const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays the currently playing song and if looping is on.')
    , execute(interaction, queueHandler) {
        queueHandler.status(interaction);
    }
};