const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Randomly reorders the queue, including the currently playing song.')
    , execute(interaction, queueHandler) {
        queueHandler.shuffle();
    }
};