const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const fs = require('fs');

var isInit = false;
const player = createAudioPlayer();
const musicStore = 'media/';
const DISCONNECT_DELAY = 10000;

// Handles the song queue
module.exports = class QueueHandler {
    /* ========== INITIALIZER ========== */

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
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        // Once bot connects to the voice channel, subscribe the player
        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            connection.subscribe(player);
        });

        // If it's the only user in the voice channel, disconnect
        setInterval(() => {
            if (voiceChannel) {
                const memberCount = voiceChannel.members.size;
                if (memberCount == 1) {
                    player.stop();
                    connection.disconnect();
                    isInit = false;
                }
            }
        }, DISCONNECT_DELAY);

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
            } else {
                // When queue is empty, disconnect from the voice channel after a delay
                setInterval(() => {
                    player.stop();
                    connection.disconnect();
                    isInit = false;
                }, DISCONNECT_DELAY);
            }
        });

        isInit = true;
        return true;
    }

    /* ========== COMMANDS ========== */

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
            this.fetchPlaylist(playlistId, (playlistInfo, errCode) => {
                if (!errCode) {
                    // Shuffle if user asked for it
                    if (shuffle) {
                        this.shuffle();
                    }
                    // Loop if user asked for it
                    if (loop) {
                        this.loop_queue = true;
                    }
                    // Reply to the interaction
                    interaction.editReply('Playlist processed, added ' + playlistInfo.length + ' songs to the queue');
                } else if (errCode == 410) {
                    // Error 410 means that the requested song is age-restricted and thus can't be played
                    interaction.editReply('That song is age-restricted and can\'t be played');
                } else {
                    // Unhandled error, notify user
                    interaction.editReply('You found an unhandled error! Let  know so that he can fix it');
                }
            });
        } else {
            // No playlist to handle, just add the song
            try {
                id = ytdl.getVideoID(rawUrl);
            } catch (error) {
                interaction.reply('Sorry, I couldn\'t find the song "' + rawUrl + '"\nPlease make sure it is a valid YouTube URL');
                return;
            }
            const song = {
                rawUrl: rawUrl,
                id: id,
                filePath: musicStore + id + '.webm'
            };

            this.fetchSong(song, (songInfo, errCode) => {
                if (!errCode) {
                    // Shuffle if user asked for it
                    if (shuffle) {
                        this.shuffle();
                    }
                    // Loop if user asked for it
                    if (loop) {
                        this.loop_song = true;
                    }
                    // Reply to the interaction
                    if (this.songQueue.length != 0) {
                        interaction.editReply('Added <' + song.rawUrl + '> to the queue in position ' + this.songQueue.length);
                    } else {
                        interaction.editReply('Now playing <' + song.rawUrl + '>');
                    }
                } else if (errCode == 410) {
                    // Error 410 means that the requested song is age-restricted
                    interaction.editReply('That song is age-restricted and can\'t be played');
                } else {
                    interaction.editReply('You found an unhandled error! Let my developer know so that he can fix it');
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
        // "position" is a user-defined integer. Set it to 1 (skip just current song) if they don't specify it
        const pos = interaction.options.getInteger('position') == null ? 1 : interaction.options.getInteger('position');

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
                    // If skipping last song in the queue, disconnect from the voice channel after a delay
                    setInterval(() => {
                        player.stop();
                        connection.disconnect();
                        isInit = false;
                    }, DISCONNECT_DELAY);

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
        // Discord limits the size of reponses to 2000 characters, so limit the song list to be printed
        const SONG_LIMIT = 5;

        if (this.songQueue[0] != null) {
            responseString += 'Loop song: ' + this.loop_song + ' | Loop queue: ' + this.loop_queue;
        } else {
            responseString += 'Queue is empty! Use /play to add something';
        }

        for (let i = 0; i < this.songQueue.length; i++) {
            if (i == 0) {
                responseString += ('\nNow playing: <' + this.songQueue[i].rawUrl + '>\n');
            } else {
                responseString += (i + ': <' + this.songQueue[i].rawUrl + '>\n');
            }

            // Limit response via SONG_LIMIT
            if (i == SONG_LIMIT && this.songQueue.length > (SONG_LIMIT + 1)) {
                const remSongs = this.songQueue.length - i - 1;

                responseString += 'Queue contains an additional '

                // Respect plurals
                responseString += remSongs == 1 ? 'song' : remSongs + ' songs'
                break;
            }
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
    async fetchSong(song, callback) {
        var inError = false;

        fs.access(song.filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File isn't on disk, need to download
                const stream = ytdl(song.rawUrl, { filter: 'audioonly', quality: 'highestaudio' }).on('error', (error) => {
                    inError = true;
                    callback(null, error.statusCode);
                });

                if (!inError) {
                    // Pipe the downloaded stream into a file
                    stream.pipe(fs.createWriteStream(song.filePath)).on('finish', () => {
                        this.enqueue(song, false);
                        //callback({ title: song.title, author: song.author }, null);
                        callback(null, null);
                    });
                }
            } else {
                // File is on disk, no need to download
                this.enqueue(song, false);
                //callback({ title: song.title, author: song.author }, null);
                callback(null, null);
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
        if (player.state.status == 'idle') {
            player.play(createAudioResource(this.songQueue[0].filePath));
        }
    }

    // Fetches an entire playlist from YouTube. Depending on the size of the playlist, this may take a long time
    async fetchPlaylist(playlistId, callback) {
        const playlist = await ytpl(playlistId);
        const items = playlist.items;
        var tempQueue = [];
        var inError = false;

        for (let i = 0; i < items.length; i++) {
            // First, build the song object
            const item = items[i];
            const id = item.id;
            const rawUrl = 'https://youtu.be/' + id;
            const song = {
                rawUrl: rawUrl,
                id: id,
                filePath: musicStore + id + '.webm'
            };

            // Can't just call fetchSong() because it won't necessarily maintain proper queue order if songs need to be downloaded
            fs.access(song.filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    // File isn't on disk, need to download
                    const stream = ytdl(song.rawUrl, { filter: 'audioonly', quality: 'highestaudio' }).on('error', (error) => {
                        inError = true;
                        callback(null, error.statusCode);
                    });

                    if (!inError) {
                        // Pipe the downloaded stream into a file
                        stream.pipe(fs.createWriteStream(song.filePath)).on('finish', () => {
                            tempQueue.push(song);
                            // If the lengths match, every song to add has been added so populate the real queue
                            if (tempQueue.length == items.length) {
                                // items is in the correct order, tempQueue isn't necessarily
                                this.enqueuePlaylist(items, tempQueue);
                                // Return useful info
                                callback({ length: items.length, title: playlist.title, author: playlist.author }, null);
                            }
                        });
                    }
                } else {
                    // File is on disk, no need to download
                    tempQueue.push(song);
                    // Need to do this here as well, in case the playlist contains some downloaded songs and some not
                    if (tempQueue.length == items.length) {
                        // items is in the correct order, tempQueue isn't necessarily
                        this.enqueuePlaylist(items, tempQueue);
                        // Return useful info
                        callback({ length: items.length, title: playlist.title, author: playlist.author }, null);
                    }
                }
            });
        }
    }
};