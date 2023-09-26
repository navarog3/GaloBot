const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song, or to a position in queue if specified.')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position in the queue to skip to.'))
    , execute(interaction, queueHandler) {
        queueHandler.skip(interaction);
    }
};