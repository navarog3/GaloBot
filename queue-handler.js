const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const fs = require('fs');
const events = require('events');

var queue;
var isInit = false;
const player = createAudioPlayer();
const queueEvents = new events.EventEmitter();
const musicStore = 'M:\\GaloBot Store\\';

// Handles the song queue.
module.exports = class QueueHandler {
    // Initializes the QueueHandler object, setting important information
    init(interaction) {
        // If already initialized, don't do it again
        if (isInit) return;

        const voiceChannel = interaction.member.voice.channel;

        // Set global vars
        queue = {
            interaction: interaction,
            songs: []
        };

        // Check to see if the user is in a voice channel
        if (!voiceChannel) {
            interaction.reply('You need to be in a voice channel to play music.');
            return;
        }

        // Join the voice channel and save connection to queue object
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        // Once bot connects to the voice channel, subscribe the player
        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            connection.subscribe(player);
        });

        isInit = true;
    };

    // Adds a song or playlist to the queue
    async add(rawUrl) {
        // Make sure it's initialized first
        if (!isInit) return;

        const videoId = rawUrl.split('https://youtu.be/')[1];
        const filePath = musicStore + videoId + '.webm';

        queue.interaction.deferReply('Fetching song...');

        this.fetchSong(rawUrl, videoId, filePath);

        queueEvents.on(videoId + ' loaded', () => {
            // queue.songs.push(song);
            this.play(filePath);
        });

        //  stream.on('info', (info) => {
        //     const listLoc = rawUrl.indexOf('list=');
        //     const timeLoc = rawUrl.indexOf('&t=');
        //     var playlist = { items: {} };
        //     var startTime = 0;

        //     if (listLoc != -1) {
        //         // Get the playlist ID from the url
        //         playlist = ytpl.getPlaylistID(rawUrl);
        //     }

        //     if (timeLoc != -1) {
        //         // Get the time from the url
        //         startTime = rawUrl.substring(timeLoc + 3);
        //     }

        //     // Save info as a song object
        //     const song = {
        //         title: info.videoDetails.title,
        //         shortUrl: info.videoDetails.video_url,
        //         playlist: playlist,
        //         startTime: startTime
        //     };

        //     // If song has a playlist url
        //     if (song.playlist.items.length > 0) {
        //         // Grab playlist contents with ytpl, then put them all in the queue
        //         playlist = ytpl(song.playlist);
        //         for (let i = 0; i < playlist.items.length; i++) {
        //             queue.songs.push(playlist.items[i]);
        //         }
        //     }

        //     // Add song to queue, then if queue is otherwise empty start playing it
        //     queue.songs.push(song);
        //     if (queue.songs.length == 1 || queue.songs.length == playlist.items.length) {
        //         this.play(song, stream);
        //     }
        // });
    };

    // Plays a song in the queue. Calls itself when a song ends, as long as the queue still has more songs
    play(filePath) {
        player.play(createAudioResource(filePath));
        // queue.interaction.reply('Now playing song');

        // Once song is finished, remove it and play the next song as long as the queue isn't empty
        // this.queue.songs.shift();
        // this.queue.songs.length != 0 ? this.play(queue.songs[0]) : queue.textChannel.send('Queue empty');
    };

    // If the song already exists on disk, grab that file. Else, download from youtube
    async fetchSong(rawUrl, videoId, filePath) {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File isn't on disk, need to download
                ytdl(rawUrl, {
                    filter: 'audioonly',
                    quality: 'highestaudio'
                }).pipe(fs.createWriteStream(filePath)).on('finish', () => {
                    queueEvents.emit(videoId + ' loaded');
                });
            } else {
                // File is on disk, no need to download
                queueEvents.emit(videoId + ' loaded');
            }
        });
    };
};