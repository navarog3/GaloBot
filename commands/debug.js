const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Debug menu')
    , execute(interaction, queueHandler) {
        queueHandler.debug(interaction);
    }
};