const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.')
    , execute(interaction, queueHandler) {
        queueHandler.skip(interaction);
    }
};