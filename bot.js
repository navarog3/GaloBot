// require the discord.js module
const Discord = require('discord.js');
// create a new Discord client
const client = new Discord.Client();
//get prefix and token
const {prefix, token} = require('./config.json');


// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
  //if message doesn't contain the prefix or was sent by a bot, ignore it
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  //create args which slices off the prefix and splits it into an array separated by spaces
  const args = message.content.slice(prefix.length).split(/ +/);
  //pulls the first item in the array args (removes it from args)
  const command = args.shift().toLowerCase();

	if (message.content === `${prefix}ping`) {
    // send back "pong" to the channel the message was sent in
    message.channel.send('pong');
  }
});

// login to Discord with your app's token
client.login(token);