const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or playlist via YouTube link.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube song or playlist link.')
                // TODO: make this not required and if not included, play a pinchy clip from Thomas and the Magic Railroad
                .setRequired(true))
    , execute(interaction, queueHandler) {
        queueHandler.play(interaction.options.getString('url'));
    }
};