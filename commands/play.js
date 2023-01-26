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
    , execute(interaction) {
        // Initialize the queueHandler and then Add the requested song to the queue
        queueHandler.init(interaction);
        queueHandler.add(interaction.options.getString('url'));
    },
};