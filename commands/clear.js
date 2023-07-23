const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Removes all songs from the queue and stops the current song.')
    , execute(interaction, queueHandler) {
        queueHandler.clear(interaction);
    }
};