const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const ytpl = require('@distube/ytpl');
const fs = require('fs');
const ErrorHandler = require('./error-handler.js');

var isInit = false;
var connection;
const player = createAudioPlayer();
var errorHandler = new ErrorHandler;

// Used by the /queue command to respect Discord's 2000 character response limit
const SONG_LIMIT = 5;

// Set the music store location, based on OS
const MUSIC_STORE = process.platform == 'win32' ? 'media/' : '/etc/galo-bot/media/';

// Handles the song queue
module.exports = class QueueHandler {



    /* ======================================================================= */
    /* ============================= INITIALIZER ============================= */
    /* ======================================================================= */



    // Initializes the QueueHandler object, setting important information
    init(interaction) {
        // If already initialized, no need to initialize again
        if (isInit) { return true; }

        // Initialize variables
        this.songQueue = [];
        this.loop_song = false;
        this.loop_queue = false;

        // Check to see if the user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            interaction.reply('You need to be in a voice channel to play music');
            return false;
        }

        // Join the voice channel and save connection to queue object
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        // Once bot connects to the voice channel, subscribe the player
        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            connection.subscribe(player);
        });

        // Auto-advances the queue when a song finishes
        // Note: this event WILL trigger when using player.stop() so be wary of using that method
        player.on(AudioPlayerStatus.Idle, () => {
            // If queue looping is on, take the song just played and stick it to the end of the queue
            // !this.loop_song prevents song duplication when both loop types are on at the same time
            if (this.loop_queue && !this.loop_song) {
                this.songQueue.push(this.songQueue[0]);
            }

            // Remove current song unless song looping is on
            if (!this.loop_song) {
                this.songQueue.shift();
            }

            // If the queue isn't empty, play the next song
            if (this.songQueue.length != 0) {
                this.enqueue(this.songQueue[0], true);
            }
        });

        // Fix for when the player sometimes enters the AutoPaused state
        // No clue why it started happening, this is likely obscuring the issue
        player.on(AudioPlayerStatus.AutoPaused, () => {
            // Reset network
            connection.configureNetworking();
        });

        isInit = true;
        return true;
    }



    /* ======================================================================= */
    /* ============================== COMMANDS =============================== */
    /* ======================================================================= */



    // Plays a song or adds a playlist to the queue
    async play(interaction) {
        // Set variables
        var id = '';
        var playlistId = '';
        const rawUrl = interaction.options.getString('url').trim();
        const loop = interaction.options.getBoolean('loop');
        const shuffle = interaction.options.getBoolean('shuffle');

        // Defer the reply because without it the bot only gets 3 seconds to respond
        await interaction.deferReply();

        // Playlists need to be handled differently
        if (rawUrl.indexOf('list=') != -1) {
            try {
                playlistId = await ytpl.getPlaylistID(rawUrl);
            } catch (error) {
                interaction.reply('Sorry, I couldn\'t find the playlist "' + rawUrl + '"\nPlease make sure it is a valid YouTube URL');
                return;
            }

            // This is an expensive operation, a large playlist will take a while
            this.fetchPlaylist(playlistId, (playlistInfo, error) => {
                if (!error) {
                    // Shuffle if user asked for it
                    if (shuffle) {
                        this.shuffle();
                    }
                    // Loop if user asked for it
                    if (loop) {
                        this.loop_queue = true;
                    }
                    // Reply to the interaction
                    interaction.editReply('Processed [' + playlistInfo.title + '](<' + rawUrl + '>), added ' + playlistInfo.items.length + ' songs to the queue');
                } else {
                    errorHandler.handle(error, interaction, "playlist");
                }
            });
        } else {
            // No playlist to handle, just add the song
            try {
                id = ytdl.getVideoID(rawUrl);
            } catch (error) {
                interaction.editReply('Sorry, I couldn\'t find the song "' + rawUrl + '"\nPlease make sure it is a valid YouTube URL');
                return;
            }
            const song = {
                rawUrl: rawUrl,
                id: id,
                filePath: MUSIC_STORE + id + '.webm',
                title: '',
                author: ''
            };

            this.fetchSong(song, (fetchedSong, error) => {
                if (!error) {
                    // Shuffle if user asked for it
                    if (shuffle) {
                        this.shuffle();
                    }
                    // Loop if user asked for it
                    if (loop) {
                        this.loop_song = true;
                    }
                    // Reply to the interaction
                    interaction.editReply('Added [' + fetchedSong.videoDetails.title + '](<' + song.rawUrl + '>) to the queue in position ' + this.songQueue.length);
                } else {
                    // Need to clean up the corrupted file that was generated
                    fs.unlink(__dirname + '/' + song.filePath, (err) => {
                        errorHandler.handle(error, interaction, "song");
                    });
                }
            });
        }
    }

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

    // Skips the current song, or to a position in queue if specified
    skip(interaction) {
        // "position" is a user-defined integer. Set it to 2 (skip to queue position 2, the next song) if they don't specify it
        const pos = interaction.options.getInteger('position') == null ? 2 : interaction.options.getInteger('position');

        if (player.state.status != 'idle') {
            player.pause();
            if (this.songQueue.length != 0) {
                // Remove all songs before the desired position
                this.songQueue.splice(0, pos);

                // Play the desired song
                if (this.songQueue.length > 0) {
                    player.play(createAudioResource(this.songQueue[0].filePath));
                    interaction.reply(pos == 0 ? 'Skipped the current song' : ('Skipped to queue position ' + pos));
                } else {
                    interaction.reply('Queue cleared');
                }
            }
        } else {
            interaction.reply('Nothing is playing');
        }
    }

    // Prints the current queue to chat, basically songQueue.toString()
    queue(interaction) {
        var responseString = '';

        if (this.songQueue[0] == null) {
            responseString += 'Queue is empty! Use /play to add something';
        }

        for (let i = 0; i < this.songQueue.length; i++) {
            if (i == 0) {
                responseString += ('\n### Now playing: ' + this.songQueue[i].title + '\n');
            } else {
                responseString += (i + ': ' + this.songQueue[i].title + '\n');
            }

            // Limit response via SONG_LIMIT
            if (i == SONG_LIMIT && this.songQueue.length > (SONG_LIMIT + 1)) {
                const remSongs = this.songQueue.length - i - 1;

                responseString += '-# (Plus an additional '

                // Respect plurals
                responseString += remSongs == 1 ? 'song)' : remSongs + ' songs)'
                break;
            }
        }

        if (this.songQueue[0] != null) {
            responseString += '\n-# Loop song: ' + this.loop_song + ' | Loop queue: ' + this.loop_queue;
        }

        // Print out the queue, stripping the trailing newline off using regex
        interaction.reply(responseString == '' ? 'Queue is empty! Use /play to add something' : responseString.replace(/\n$/, ''));
    }

    // Empties the queue
    clear(interaction) {
        this.songQueue = [];
        player.stop();
        interaction.reply('Queue cleared');
    }

    // Randomizes the order of the queue
    shuffle(interaction) {
        // Save the state of the queue and then clear it out so it can be loaded fresh
        const queueState = this.songQueue;
        player.stop();

        // Uses the Durstenfeld shuffle algorithm (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm)
        // Also uses double-assignment fanciness to avoid a double for loop
        for (let i = queueState.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queueState[i], queueState[j]] = [queueState[j], queueState[i]];
        }

        // Load the now-shuffled queue in and play the first song
        this.songQueue = queueState;
        player.play(createAudioResource(this.songQueue[0].filePath));

        // When being called from another command, interaction will be null to avoid reply collisions
        if (interaction != null) {
            interaction.reply('Queue order shuffled');
        }
    }

    // Loops the song or entire queue, based on user's choice
    loop(interaction) {
        // "type" can have the following values: 'loop_song', 'loop_queue'
        const type = interaction.options.getString('type');

        // Set the global loop options
        if (type == 'loop_song') {
            this.loop_song = !this.loop_song;

            this.loop_song ? interaction.reply('Looping current song') : interaction.reply('No longer looping song');
        } else {
            this.loop_queue = !this.loop_queue;

            this.loop_queue ? interaction.reply('Looping entire queue') : interaction.reply('No longer looping queue');
        }
    }

    // Debugging info
    debug(interaction) {
        interaction.reply(
            '```' +
            'player.state.status = ' + player.state.status + '\n' +
            'connection.state.status = ' + connection.state.status + '\n' +
            'current song = ' + this.songQueue[0].title + '\n' +

            '```'
        );
    }



    /* ======================================================================= */
    /* ============================== UTILITIES ============================== */
    /* ======================================================================= */



    // Adds a song to the queue
    enqueue(song, autoPlay) {
        if (!autoPlay) {
            this.songQueue.push(song);
        }

        // Push the song to the queue and play it if there's no song currently playing
        if (player.state.status != 'playing') {
            player.play(createAudioResource(song.filePath));
        }
    }

    // If the song already exists on disk, grab that file. Else, download from YouTube
    async fetchSong(song, callback) {
        var songInfo;
        try {
            // Retrieve and set song information
            songInfo = await ytdl.getInfo(song.rawUrl, { filter: 'audioonly', quality: 'highestaudio' });

            song.title = '[' + songInfo.videoDetails.title + '](<' + song.rawUrl + '>)';
            song.author = songInfo.videoDetails.ownerChannelName;
        } catch (error) {
            callback(null, error);
            return;
        }

        fs.access(song.filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // ENOENT means file does not exist
                if (err.code == "ENOENT") {
                    // File isn't on disk, need to download
                    // Pipe the downloaded stream into a file
                    const stream = ytdl(song.rawUrl, { filter: 'audioonly', quality: 'highestaudio' }).on('error', (error) => {
                        callback(null, error);
                    });
                    stream.pipe(fs.createWriteStream(song.filePath)).on('finish', () => {
                        this.enqueue(song, false);
                        callback(songInfo, null);
                    });
                } else if (err.code == "EPERM") {
                    // File has been marked for deletion and can't be accessed
                    callback(null, { errCode: 602 });
                }
            } else {
                // File is on disk, no need to download
                this.enqueue(song, false);
                callback(songInfo, null);
            }
        });
    }

    // Takes in two song arrays and returns an array in the same order as the first one
    // Returns a new array containing items from incorrectOrder but in the order of correctOrder
    enqueuePlaylist(correctOrder, incorrectOrder) {
        var returnOrder = [];
        for (let i = 0; i < correctOrder.length; i++) {
            for (let j = 0; j < incorrectOrder.length; j++) {
                // This will add songs to the songQueue in the order of items
                if (correctOrder[i].id == incorrectOrder[j].id) {
                    returnOrder.push(incorrectOrder[j]);
                    break;
                }
            }
        }
        this.songQueue = this.songQueue.concat(returnOrder);

        // songQueue has been populated, play the queue if something's not already playing
        if (player.state.status != 'playing') {
            player.play(createAudioResource(this.songQueue[0].filePath));
        }
    }

    // Fetches an entire playlist from YouTube. Depending on the size of the playlist, this may take a long time
    async fetchPlaylist(playlistId, callback) {
        var playlist;
        var items;
        try {
            playlist = await ytpl(playlistId);
            items = playlist.items;
        } catch {
            callback(null, { statusCode: 601 });
            return;
        }
        var tempQueue = [];

        for (let i = 0; i < items.length; i++) {
            // First, build the song object
            const item = items[i];
            const id = item.id;
            const rawUrl = 'https://youtu.be/' + id;
            const song = {
                rawUrl: rawUrl,
                id: id,
                filePath: MUSIC_STORE + id + '.webm',
                title: '[' + items[i].title + '](<' + rawUrl + '>)',
                author: items[i].author.name
            };

            // Can't just call fetchSong() because it won't necessarily maintain proper queue order if songs need to be downloaded
            fs.access(song.filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    // File isn't on disk, need to download
                    const stream = ytdl(song.rawUrl, { filter: 'audioonly', quality: 'highestaudio' }).on('error', (error) => {
                        callback(null, error);
                    });
                    // Pipe the downloaded stream into a file
                    stream.pipe(fs.createWriteStream(song.filePath)).on('finish', () => {
                        tempQueue.push(song);
                        // If the lengths match, every song to add has been added so populate the real queue
                        if (tempQueue.length == items.length) {
                            // items is in the correct order, tempQueue isn't necessarily
                            this.enqueuePlaylist(items, tempQueue);
                            // Return useful info
                            callback(playlist, null);
                        }
                    });
                } else {
                    // File is on disk, no need to download
                    tempQueue.push(song);
                    // Need to do this here as well, in case the playlist contains some downloaded songs and some not
                    if (tempQueue.length == items.length) {
                        // items is in the correct order, tempQueue isn't necessarily
                        this.enqueuePlaylist(items, tempQueue);
                        // Return useful info
                        callback(playlist, null);
                    }
                }
            });
        }
    }

    // To be run when the bot disconnects
    disconnect() {
        this.songQueue = [];
        player.stop();
        if (connection) {
            connection.destroy();
        }

        isInit = false;
    }
};