const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Displays debug info, mostly to be used by the developer.')
    , execute(interaction, queueHandler) {
        queueHandler.debug(interaction);
    }
};