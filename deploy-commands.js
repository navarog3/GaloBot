// This file is only intended to be run when commands are modified. 

const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const { readdirSync } = require('fs');

// Get all commands from the commands directory
const commands = [];
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder;s output for each command
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: 10}).setToken(token);

// Deploy the commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} slash commands.`);

        // Put slash commands to Discord's server
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body : commands },
        );

        console.log(`Successfully refreshed ${data.length} slash commands.`);
    } catch (error) {
        console.error(error);
    }
})();