const { joinVoiceChannel, createAudioPlayer, entersState, VoiceConnectionStatus, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');

const player = createAudioPlayer();

module.exports = class ConnectionHandler {

    // Connects the bot to a voice channel and subscribes the player
    async connectToChannel(channel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });

        // Debugging help
        connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });
        player.on('stateChange', (oldState, newState) => {
            console.log(`Player transitioned from ${oldState.status} to ${newState.status}`);
        });

        // Wait for the bot to connect to the channel, then subscribe the player to the connection
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 3000);
            connection.subscribe(player);
        } catch (error) {
            connection.destroy();
            throw error;
        }
    };

    async play(songUrl) {
        const resource = createAudioResource(songUrl, {
            inputType: StreamType.Arbitrary,
        });
        player.play(resource);
    };
};