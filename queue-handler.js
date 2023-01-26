const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

var queue;
var isInit = false;
const player = createAudioPlayer();

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
    add(rawUrl) {
        // Make sure it's initialized first
        if (!isInit) return;

        // Fetch the video from 
        const stream = ytdl(rawUrl, { quality: '251' });

        stream.on('info', (info) => {
            const listLoc = rawUrl.indexOf('list=');
            const timeLoc = rawUrl.indexOf('&t=');
            var playlist = { items: {} };
            var startTime = 0;

            if (listLoc != -1) {
                // Get the playlist ID from the url
                playlist = ytpl.getPlaylistID(rawUrl);
            }

            if (timeLoc != -1) {
                // Get the time from the url
                startTime = rawUrl.substring(timeLoc + 3);
            }

            // Save info as a song object
            const song = {
                title: info.videoDetails.title,
                shortUrl: info.videoDetails.video_url,
                playlist: playlist,
                startTime: startTime
            };

            // If song has a playlist url
            if (song.playlist.items.length > 0) {
                // Grab playlist contents with ytpl, then put them all in the queue
                playlist = ytpl(song.playlist);
                for (let i = 0; i < playlist.items.length; i++) {
                    queue.songs.push(playlist.items[i]);
                }
            }

            // Add song to queue, then if queue is otherwise empty start playing it
            queue.songs.push(song);
            if (queue.songs.length == 1 || queue.songs.length == playlist.items.length) {
                this.play(song, stream);
            }
        });
    };

    // Plays a song in the queue. Calls itself when a song ends, as long as the queue still has more songs
    play(song, stream) {
        player.play(createAudioResource(stream));

        queue.interaction.reply(`Now playing ${song.shortUrl}`);

        // Once song is finished, remove it and play the next song as long as the queue isn't empty
        // this.queue.songs.shift();
        // this.queue.songs.length != 0 ? this.play(queue.songs[0]) : queue.textChannel.send('Queue empty');
    };
};