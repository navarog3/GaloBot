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
        // Note: this event WILL trigger when using player.stop() so be wary of using that method
        player.on(AudioPlayerStatus.Idle, () => {
            this.songQueue.shift();
            if (this.songQueue.length != 0) {
                this.enqueue(this.songQueue[0], true);
            }
        });

        isInit = true;
    }

    /* ========== COMMANDS ========== */

    // Plays a song
    async play(interaction) {
        // Make sure it's initialized first
        if (!isInit) return;

        var rawUrl = interaction.options.getString('url');

        // Easter egg if url isn't supplied
        if (rawUrl == null) {
            if (this.play.state.status == 'idle') {
                player.play(createAudioResource('media/nullSong.webm'));
            }
            interaction.reply('Next time submit a url to get the song you want played.');
            return;
        }

        // Set variables
        var videoId;
        var playlistId;
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

        // Check to see if the link is a playlist
        if (rawUrl.indexOf('list=') != -1) {
            playlistId = await ytpl.getPlaylistID(rawUrl);

            // This is an expensive operation, a large playlist will take a while
            // TODO: maybe add a warning if something is currently playing, since it will interrupt playback
            const playlistInfo = await this.fetchPlaylist(playlistId);

            // Reply to the interaction
            interaction.editReply('Playlist processed, added ' + playlistInfo.length + ' songs to the queue.');

        } else {
            // No playlist to handle, just add the one song
            await this.fetchSong(song);

            // Reply to the interaction after pulling the song in
            if (this.songQueue.length != 0) {
                interaction.editReply('Added <' + song.rawUrl + '> to the queue in position ' + this.songQueue.length + '.');
            } else {
                interaction.editReply('Now playing <' + song.rawUrl + '>.');
            }
        }
    }

    // Pauses the player
    pause(interaction) {
        if (player.state.status == 'playing') {
            player.pause();
            interaction.reply('Song paused.');
        } else {
            interaction.reply('Nothing is playing.');
        }
    }

    // Unpauses the player
    unpause(interaction) {
        if (player.state.status == 'paused') {
            player.unpause();
            interaction.reply('Song resumed.');
        } else {
            interaction.reply('Nothing is paused.');
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
            interaction.reply('Skipped the current song.');
        } else {
            interaction.reply('Nothing is playing.');
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
        interaction.reply(songList == '' ? 'Queue is empty! Use /play to add something.' : songList.slice(0, -1));
    }

    // Empties the queue
    clear(interaction) {
        this.songQueue = [];
        player.stop();
        interaction.reply('Queue cleared.');
    }

    // Randomizes the order of the queue
    shuffle(interaction) {
        // Save the state of the queue and then clear it out so it can be loaded fresh
        const queueState = this.songQueue;
        player.stop();

        // Uses the Durstenfeld shuffle algorithm (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm)
        for (var i = queueState.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [queueState[i], queueState[j]] = [queueState[j], queueState[i]];

            /* The above line does this but in only 1 line, thanks to double assignment
            var tmp = queueState[i];
            queueState[i] = queueState[j];
            queueState[j] = tmp; */
        }

        // Load the now-shuffled queue in and play the first song
        this.songQueue = queueState;
        player.play(createAudioResource(this.songQueue[0].filePath));

        interaction.reply('Queue order shuffled');
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
    }

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
    }

    // Fetches an entire playlist from YouTube. Depending on the size of the playlist, this may take a long time
    async fetchPlaylist(playlistId) {
        const playlist = await ytpl(playlistId);
        const items = playlist.items;

        for (let i = 0; i < items.length; i++) {
            // First, build the song object
            const item = items[i];
            const videoId = item.id;
            const rawUrl = 'https://youtu.be/' + videoId;
            const song = {
                rawUrl: rawUrl,
                videoId: videoId,
                filePath: musicStore + videoId + '.webm'
            };
            // BUG: if songs need to be downloaded, it adds them to the playlist in order of download speed rather than playlist order
            
            // Then fetch the song and repeat until every song in the playlist is fetched
            await this.fetchSong(song);
        }
        // Return useful info
        return {
            length: items.length,
            title: playlist.title,
            author: playlist.author
        };
    }
};