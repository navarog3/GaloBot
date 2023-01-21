const { SlashCommandBuilder } = require('discord.js');
const { QueueHandler } = require('../queue-handler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song or playlist via youtube link.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Youtube song or playlist link.')
                .setRequired(true))
                // .setMaxLength(100)) should equal the max length of a playlist link including coded start time
	,async execute(interaction, client) {
        const url = interaction.options.getString('url');
        const voiceChannel = interaction.member.voice.channel;
        const textChannel = interaction.channel_id;

        // Initialize the queueHandler, then add a song when it's done
        const queueHandler = new QueueHandler(voiceChannel, textChannel, client);
        await queueHandler.init(interaction);
        await queueHandler.add(url);
	},
};