const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the currently playing song.')
    , execute(interaction, queueHandler) {
        queueHandler.pause(interaction);
    }
};