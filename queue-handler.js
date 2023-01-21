const { ytdl } = require('ytdl-core');
var queue;
var init = false;
var voiceChannel;
var textChannel;
var client;

// Handles the song queue.
// Song objects have two properties, title and url

class QueueHandler {
    constructor(voiceChannel, textChannel, client) {
        // Set global vars
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;
        this.client = client;
        this.queue = {
            voiceChannel: vc,
            songs: [],
            playing: false,
            connection: null,
            volume: 5
        };
    };
};

async function init (interaction) {
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
    try {
        var connection = await voiceChannel.join();
        queue.connection = connection;
    } catch (err) {
        console.error("Failed to join voice channel");
        console.error(err);
    }

    initialized = true;
};

async function add (songUrl) {
    if (!init) {
        // queueHandler needs to be initialized before it can do anything
        throw { name: "QueueHandlerNotInit", message: "Queue handler was attempted to be used before being initialized" };
    }

    // Eventually, make this able to parse out start times and playlists
    const songInfo = await ytdl.getInfo(songUrl);
    const song = { title: songInfo.title, url: songInfo.video_url };

    // Add song to queue, then if queue is other wise empty, start playing it
    queue.songs.push(song);
    if (queue.songs.length == 1) {
        play(song);
    }

    // Send url to ytdl, using the quality option that only includes audio
    ytdl(url, { quality: '140' }); 
};

async function play (song) {
    const dispatcher = queue.connection.play(ytdl(song.url)).on("finish", () => {
        queue.songs.shift();
        play (queue.songs[0]);
    }).on("error", error => console.error(error));

    dispatcher.setVolumeLogarithmic(queue.volume / 5);
    queue.textChannel.send(`Now playing **${song.title}**`);
};