const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
  name: 'remove-ping',
  description: 'Deletes a ping. Once deleted, it is unrecoverable.',
  usage: '[ping_name]',
  args: true,
  execute(message, args) {
    const fileName = `./pings/${args[0]}.json`;
    try {
      fs.unlinkSync(fileName);
    } catch(err) {
      console.error(err);
    };
    message.reply(' Ping deleted successfully.');
    },
};