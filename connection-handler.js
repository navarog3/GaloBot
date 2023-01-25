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

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            connection.subscribe(player);
            return connection;
        } catch (error) {
            connection.destroy();
            throw error;
        }
    };

    async play(songUrl) {
        const resource = createAudioResource(songUrl, {
            inputType: StreamType.Arbitrary,
        });
        this.player.play(resource);
        
        return entersState(this.player, AudioPlayerStatus.Playing, 5000);
    };
};