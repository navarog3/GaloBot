const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
  name: 'ping-now',
  description: 'Forces the given ping to happen now, regardless of time left.',
  usage: '[ping_name]',
  args: true,
  execute(message, args) {
    const fileName = `./pings/${args[0]}.json`;
    const rawData = fs.readFileSync(fileName);
    const ping = JSON.parse(rawData);
        
    message.reply(`${args[0]}:\n ${ping.msg}`);
  },
};