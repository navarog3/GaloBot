const { createAudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { ytpl } = require('ytpl');
// const ConnectionHandler = require('./connection-handler');

var queue;
var isInit = false;
const player = createAudioPlayer();

// // Create a new connectionHandler instance
// var connectionHandler = new ConnectionHandler;

// Handles the song queue.
// Song objects have two properties, title and url
module.exports = class QueueHandler {

    // Initializes the QueueHandler object, setting important information. Should only be run on first interaction with the bot.
    async init(interaction) {
        // If already initialized, don't do it again
        if (this.isInit) return;

        const voiceChannel = interaction.member.voice.channel;

        // Set global vars
        this.queue = {
            interaction: interaction,
            songs: []
        };

        // Check to see if the user is in a voice channel
        if (!voiceChannel) {
            await interaction.reply('You need to be in a voice channel to play music.');
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

    // Add a song to the queue
    add(rawUrl) {
        if (!isInit) {
            // QueueHandler needs to be initialized before it can do anything
            throw { name: "QueueHandlerNotInit", message: "Queue handler was attempted to be used before being initialized" };
        }

        const stream = ytdl(rawUrl, { quality: '251' });

        stream.on('info', (info) => {
            const listLoc = rawUrl.indexOf('list=');
            const timeLoc = rawUrl.indexOf('&t=');
            var playlist = '';
            var startTime = 0;

            if (listLoc != -1) {
                // Get the playlist ID from the url
                playlist = ytpl.getPlaylistID(rawUrl);
            }

            if (timeLoc != -1) {
                // Get the time from the url
                startTime = rawUrl.substring(timeLoc + 3);
            }

            const song = {
                title: info.videoDetails.title,
                shortUrl: info.videoDetails.video_url,
                playlist: playlist,
                startTime: startTime
            };

            if (song.playlist != '') {
                // Grab playlist contents with ytpl, then put them all in the queue
                const playlist = ytpl(song.playlist);
                for (let i = 0; i < playlist.items.length; i++) {
                    this.queue.songs.push(playlist.items[i]);
                }

                // Play the first song in the playlist if the queue only has this playlist in it
                if (this.queue.songs.length == playlist.items.length) {
                    this.play(playlist.items[0]);
                }
            } else {
                // Add song to queue, then if queue is empty start playing it
                this.queue.songs.push(song);
                if (this.queue.songs.length == 1) {
                    this.play(song);
                }
            }
        });
    };

    // Plays a song in the queue. Calls itself when a song ends, as long as the queue still has more songs
    play(song) {
        // connectionHandler.play('https://youtu.be/GKzsktuqwyU');
        const stream = ytdl(song.shortUrl, { quality: '251' });
        stream.on('info', (info) => {
            console.log(stream);
            player.play(createAudioResource(stream));
        });
        // connectionHandler.play(song.shortUrl);

        // Send url to ytdl, using the audio only option. dlChunkSize of 0 is recommended for Discord bots
        // const stream = await ytdl(song.shortUrl, { filter: 'audioonly', dlChunkSize: 0 });

        // Play the ytdl stream
        // const dispatcher = this.connectionHandler.play(stream).on("finish", () => {
        // Once song is finished, remove it and play the next song as long as the queue isn't empty
        // this.queue.songs.shift();
        // this.queue.songs.length != 0 ? this.play(queue.songs[0]) : queue.textChannel.send('Queue empty');
        // });

        // dispatcher.setVolumeLogarithmic(queue.volume / 5);
        this.queue.interaction.reply(`Now playing ${song.shortUrl}`);
    };
};