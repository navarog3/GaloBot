const { ytdl } = require('ytdl-core');
const { ytpl } = require('ytpl');
var queue;
var voiceChannel;
var textChannel;
var client;
var isInit = false;

// Handles the song queue.
// Song objects have two properties, title and url
module.exports = class QueueHandler {

    // Initializes the QueueHandler object, setting important information. Should only be run on first interaction with the bot.
    async init(interaction, client) {
        const voiceChannel = interaction.member.voice.channel;
        const textChannel = interaction.channel_id;

        // Set global vars
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;
        this.client = client;
        this.queue = {
            songs: [],
            connection: null,
            volume: 5
        };

        // Check to see if the user is in a voice channel
        if (!voiceChannel) {
            await interaction.reply('You need to be in a voice channel to play music.');
        }

        // Check for correct permissions
        const perms = voiceChannel.permissionsFor(client.user);
        if (!perms.has("CONNECT") || !perms.has("SPEAK")) {
            await interaction.reply('I need permissions to join and speak in your voice channel.');
        }

        // Join the voice channel and save connection to queue object
        queue.connection = await voiceChannel.join();

        isInit = true;
    };

    // Add a song to the queue
    async add(songUrl) {
        if (!isInit) {
            // QueueHandler needs to be initialized before it can do anything
            throw { name: "QueueHandlerNotInit", message: "Queue handler was attempted to be used before being initialized" };
        }

        // Parse the url into a valid song object
        const parsedUrl = await parseUrl(songUrl);

        if (parsedUrl.playlist != '') {
            // Grab playlist contents with ytpl, then put them all in the queue
            const playlist = await ytpl(parsedUrl.playlist);
            for (let i = 0; i < playlist.items.length; i++) {
                queue.songs.push(playlist.items[i]);
            }

            // Play the first song in the playlist if the queue only has this playlist in it
            if (queue.songs.length == playlist.items.length) {
                play(playlist.items[0]);
            }
        } else {
            // Add song to queue, then if queue is empty start playing it
            queue.songs.push(parsedUrl);
            if (queue.songs.length == 1) {
                play(parsedUrl);
            }
        }
    };

    // Plays a song in the queue. Calls itself when a song ends, as long as the queue still has more songs
    async play(song) {
        // Send url to ytdl, using the audio only option. dlChunkSize of 0 is recommended for Discord bots
        const stream = await ytdl(song.shortUrl, { filter: 'audioonly', dlChunkSize: 0 });

        // Play the ytdl stream
        const dispatcher = queue.connection.play(stream).on("finish", () => {
            // Once song is finished, remove it and play the next song as long as the queue isn't empty
            queue.songs.shift();
            queue.songs.length != 0 ? this.play(queue.songs[0]) : queue.textChannel.send('Queue empty');
        });

        dispatcher.setVolumeLogarithmic(queue.volume / 5);
        queue.textChannel.send(`Now playing **${song.title}**`);
    };

    // Parses a url into its constituate parts. Returns a parsedUrl object that contains the song's title, url, playlist url, and song start time
    //
    // ex: Given this input https://youtu.be/XTte01kdG_k?list=PL4qlfwt9LPQv9XV-maJi6PNxoEK5bdpZ8&t=65
    // parsedUrl would look like this
    // { 
    //   title: "Neil Cicierega - Best",
    //   shortUrl: "https://youtu.be/XTte01kdG_k",
    //   playlist: "https://www.youtube.com/playlist?list=PL4qlfwt9LPQv9XV-maJi6PNxoEK5bdpZ8",
    //   startTime: "65"
    // }
    async parseUrl(rawUrl) {
        const songInfo = await ytdl.getInfo(parsedUrl.song);
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

        return {
            title: songInfo.title,
            shortUrl: songInfo.video_url,
            playlist: playlist,
            startTime: startTime
        };
    };
};