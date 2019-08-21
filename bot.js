// require the discord.js module
const Discord = require('discord.js');
// create a new Discord client
const client = new Discord.Client();


// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	console.log(message.content);
});

// login to Discord with your app's token
client.login('your-token-goes-here');