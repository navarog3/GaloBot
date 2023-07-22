const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays a list of the songs in the queue.')
    , execute(interaction, queueHandler) {
        queueHandler.queue();
    }
};