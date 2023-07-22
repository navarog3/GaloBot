const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unpause')
        .setDescription('Unpauses the currently paused song.')
    , execute(interaction, queueHandler) {
        queueHandler.unpause();
    }
};