const { SlashCommandBuilder } = require('discord.js');
const QueueHandler = require('../queue-handler.js');

// Create a new queueHandler instance
var queueHandler = new QueueHandler;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or playlist via youtube link.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Youtube song or playlist link.')
                .setRequired(true))
    , async execute(interaction) {
        const url = interaction.options.getString('url');

        // Add the requested song to the queue
        await queueHandler.init(interaction);
        await queueHandler.add(url);
    },
};