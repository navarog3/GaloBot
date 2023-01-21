const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song or playlist via youtube link.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Youtube song or playlist link.')
                .setRequired(true))
                // .setMaxLength(100)) should equal the max length of a playlist link including coded start time
	,async execute(interaction, queueHandler) {
        const url = interaction.options.getString('url');

        // Initialize the queueHandler, then add a song when it's done
        await queueHandler.add(url);
	},
};