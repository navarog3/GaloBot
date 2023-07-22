const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or playlist via YouTube link.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube song or playlist link.')
                .setRequired(true))
    , execute(interaction, queueHandler) {
        queueHandler.play(interaction.options.getString('url'));
    }
};