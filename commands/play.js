const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or playlist via YouTube link.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube song or playlist link.')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('loop')
                .setDescription('Automatically runs the /loop command after adding.'))
        .addBooleanOption(option =>
            option.setName('shuffle')
                .setDescription('Automatically runs the /shuffle command after adding.'))
    , execute(interaction, queueHandler) {
        queueHandler.play(interaction);
    }
};