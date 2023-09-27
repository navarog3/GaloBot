const { readdirSync } = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, IntentsBitField } = require('discord.js');
const { token } = require('./config.json');
const QueueHandler = require('./queue-handler.js');

// Create a the song queue
var queueHandler = new QueueHandler;

// Create new client instance
const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildVoiceStates);
const client = new Client({ intents: myIntents });

// Get path to commands directory
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Add command files to list of available commands
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Once client is ready, run this code once
client.once(Events.ClientReady, c => {
	console.log(`Logged in as ${c.user.tag}`);
});

// On interactions (slash commands are interactions), execute it
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commmandName} was found.`);
		return;
	}

	// Try to initialize the queueHandler (will return boolean based on if it's initialized or not)
	if (queueHandler.init(interaction)) {
		await command.execute(interaction, queueHandler);
	}
});

// Log into Discord with the bot's token
client.login(token);