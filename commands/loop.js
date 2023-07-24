const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Loops just one song or entire queue, based on the "type" option')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('"song" loops just the song currently playing, "queue" loops the entire queue')
                .setRequired(true)
                .addChoices(
                    { name: 'song', value: 'loop_song' },
                    { name: 'queue', value: 'loop_queue' }
                ))
    , execute(interaction, queueHandler) {
        queueHandler.loop(interaction);
    }
};