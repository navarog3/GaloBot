const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const fs = require('fs');

var isInit = false;
const player = createAudioPlayer();
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
        this.songQueue = [];

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
            console.log('hello');
            this.songQueue.shift();
            if (this.songQueue.length != 0) {
                this.enqueue(this.songQueue[0], true);
            }
        });

        isInit = true;
    };

    /* ========== COMMANDS ========== */

    // Plays a song
    async play(interaction) {
        // Make sure it's initialized first
        if (!isInit) return;

        var rawUrl = interaction.options.getString('url');

        // Easter egg if url isn't supplied
        if (rawUrl == null) {
            player.play(createAudioResource('media/nullSong.webm'));
            interaction.reply('Next time submit a url to get the song you want played.');
            return;
        }

        var videoId;
        rawUrl = rawUrl.trim();

        try {
            videoId = ytdl.getVideoID(rawUrl);
        } catch (error) {
            interaction.reply('Sorry, I couldn\'t find the song "' + rawUrl + '"\nPlease make sure it is a valid YouTube URL.');
            return;
        }

        const song = {
            rawUrl: rawUrl,
            videoId: videoId,
            filePath: musicStore + videoId + '.webm'
        };

        // Defer the reply because without it the bot only gets 3 seconds to respond
        await interaction.deferReply();

        // Grab the song from YouTube unless it's already in the local store
        await this.fetchSong(song);

        // Reply to the interaction after pulling the song in
        if (this.songQueue.length != 0) {
            interaction.editReply('Added <' + song.rawUrl + '> to the queue in position ' + this.songQueue.length);
        } else {
            interaction.editReply('Now playing <' + song.rawUrl + '>');
        }

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
    pause(interaction) {
        if (player.state.status == 'playing') {
            player.pause();
            interaction.reply('Song paused');
        } else {
            interaction.reply('Nothing is playing');
        }
    }

    // Unpauses the player
    unpause(interaction) {
        if (player.state.status == 'paused') {
            player.unpause();
            interaction.reply('Song resumed');
        } else {
            interaction.reply('Nothing is paused');
        }
    }

    // Skips the current song
    skip(interaction) {
        if (player.state.status == 'playing') {
            player.pause();
            this.songQueue.shift();
            if (this.songQueue.length != 0) {
                player.play(createAudioResource(this.songQueue[0].filePath));
            }
            interaction.reply('Skipped the current song');
        } else {
            interaction.reply('Nothing is playing');
        }
    }

    // Prints the current queue to chat
    queue(interaction) {
        var songList = '';

        for (let i = 0; i < this.songQueue.length; i++) {
            if (i == 0) {
                songList = ('Now playing: <' + this.songQueue[i].rawUrl + '>\n');
            } else {
                songList += (i + ': <' + this.songQueue[i].rawUrl + '>\n');
            }
        }

        // Print out the queue, stripping the trailing newline off
        interaction.reply(songList == '' ? 'Queue is empty! Use /play to add something' : songList.slice(0, -1));
    }

    // Empties the queue
    clear(interaction) {
        interaction.reply('Coming soon');
    }

    // Randomizes the order of the queue
    shuffle(interaction) {
        interaction.reply('Coming soon');
    }

    /* ========== UTILITIES ========== */

    // Adds a song to the queue
    enqueue(song, autoPlay) {
        if (!autoPlay) {
            this.songQueue.push(song);
        }

        // Push the song to the queue and play it if there's no song currently playing
        if (player.state.status == 'idle') {
            player.play(createAudioResource(song.filePath));
        }
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
                    this.enqueue(song, false);
                });
            } else {
                // File is on disk, no need to download
                this.enqueue(song, false);
            }
        });
    };
};