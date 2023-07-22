const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const fs = require('fs');
const events = require('events');

var songQueue;
var isInit = false;
const player = createAudioPlayer();
const queueEvents = new events.EventEmitter();
const musicStore = 'M:\\GaloBot Store\\';

// Handles the song queue.
module.exports = class QueueHandler {
    // Initializes the QueueHandler object, setting important information
    init(interaction) {
        // If already initialized, just update the interaction but nothing else
        if (isInit) {
            this.songQueue.interaction = interaction;
            return;
        }

        // Set global vars
        this.songQueue = {
            interaction: interaction,
            songs: []
        };

        // Check to see if the user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
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

        // When the player enters the idle state, play the next song if there is one
        player.on(AudioPlayerStatus.Idle, () => {
            this.songQueue.songs.shift();
            if (this.songQueue.songs.length != 0) {
                this.enqueue(songQueue.songs[0], true);
            }
        });

        isInit = true;
    };

    /* ========== COMMANDS ========== */

    // Plays a song
    async play(rawUrl) {
        // Make sure it's initialized first
        if (!isInit) return;

        const videoId = rawUrl.split('https://youtu.be/')[1];
        const song = {
            rawUrl: rawUrl,
            videoId: videoId,
            filePath: musicStore + videoId + '.webm'
        };

        // Need to await as if the file to play is already stored, the interactions collide
        await this.songQueue.interaction.deferReply();

        // Grab the song from YouTube unless it's already in the local store
        this.fetchSong(song);

        // Once the song is loaded, push the song to the queue and play it
        queueEvents.on(videoId + ' loaded', () => {
            this.enqueue(song, false);
        });

        //  stream.on('info', (info) => {
        //     const listLoc = rawUrl.indexOf('list=');
        //     var playlist = { items: {} };

        //     if (listLoc != -1) {
        //         // Get the playlist ID from the url
        //         playlist = ytpl.getPlaylistID(rawUrl);
        //     }

        //     // Save info as a song object
        //     const song = {
        //         title: info.videoDetails.title,
        //         shortUrl: info.videoDetails.video_url,
        //         playlist: playlist
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

    // Pauses the player
    pause() {
        if (player.state.status == 'playing') {
            player.pause();
            this.songQueue.interaction.reply('Song paused');
        } else {
            this.songQueue.interaction.reply('Nothing is playing');
        }
    }

    // Unpauses the player
    unpause() {
        if (player.state.status == 'paused') {
            player.unpause();
            this.songQueue.interaction.reply('Song resumed');
        } else {
            this.songQueue.interaction.reply('Nothing is paused');
        }
    }

    // Skips the current song
    skip() {
        this.songQueue.interaction.reply('Coming soon');
    }

    // Prints the current queue to chat
    queue() {
        var songList = '';

        for (let i = 0; i < this.songQueue.songs.length; i++) {
            songList += (this.songQueue.songs[i].rawUrl + '\n');
        }

        // Print out the queue, stripping the trailing newline off
        this.songQueue.interaction.reply('Queue: ' + songList.slice(0, -1));
    }

    // Empties the queue
    clear() {
        this.songQueue.interaction.reply('Coming soon');
    }

    // Randomizes the order of the queue
    shuffle() {
        this.songQueue.interaction.reply('Coming soon');
    }

    /* ========== UTILITIES ========== */

    // Adds a song to the queue. Autoplay is there to change the response behavior
    enqueue(song, autoPlay) {
        if (!autoPlay) {
            this.songQueue.interaction.editReply('Now playing ' + song.rawUrl);
        } else {
            this.songQueue.interaction.channel.send('Now playing ' + song.rawUrl);
        }

        // Push the song to the queue and play it
        this.songQueue.songs.push(song);
        player.play(createAudioResource(song.filePath));
    };

    // If the song already exists on disk, grab that file. Else, download from YouTube
    async fetchSong(song) {
        fs.access(song.filePath, fs.constants.F_OK, async (err) => {
            if (err) {
                // File isn't on disk, need to download
                ytdl(song.rawUrl, {
                    filter: 'audioonly',
                    quality: 'highestaudio'
                }).pipe(fs.createWriteStream(song.filePath)).on('finish', () => {
                    queueEvents.emit(song.videoId + ' loaded');
                });
            } else {
                // File is on disk, no need to download
                queueEvents.emit(song.videoId + ' loaded');
            }
        });
    };
};