const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Loops just one song or entire queue, based on the "type" option')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('"s" loops just the song, "q" loops the entire queue')
                .setRequired(true)
                .addChoices(
                    { name: 's', value: 'loop_song' },
                    { name: 'q', value: 'loop_queue' }
                ))
    , execute(interaction, queueHandler) {
        queueHandler.loop(interaction);
    }
};