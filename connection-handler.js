const { ytdl } = require('ytdl-core');
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

        // Once bot connects to the voice channel, subscribe the player
        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            connection.subscribe(player);
        });
    };

    async play(songUrl) {
        const resource = this.createAudioResource(songUrl, {
            inputType: StreamType.Arbitrary,
        });
        player.play(resource);
    };

    async createAudioResource(url) {
		return new Promise(async (resolve, reject) => {
			const process = await ytdl(
				url,
				{
					o: '-',
					q: '',
					f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
					r: '100K',
				},
				{ stdio: ['ignore', 'pipe', 'ignore'] },
			);
			if (!process.stdout) {
				reject(new Error('No stdout'));
				return;
			}
			const stream = process.stdout;
			const onError = (error) => {
				if (!process.killed) process.kill();
				stream.resume();
				reject(error);
			};
			process
				.once('spawn', () => {
					demuxProbe(stream)
						.then((probe) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
						.catch(onError);
				})
				.catch(onError);
		});
	}
};