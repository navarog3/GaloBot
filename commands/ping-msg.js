const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
  name: 'ping-msg',
  description: 'Enters the message that will be displayed with a ping.',
  usage: '[ping_name] [ping message]',
  args: true,
    execute(message, args) {
      const pingName = args[0];
      const pingMsg = args.shift();

      let dataPre = {
        msg: `${pingMsg}`
      };
      let data = JSON.stringify(dataPre);

      const fileName = `./pings/${pingName}.json`;

      fs.appendFile(fileName, JSON.stringify(data, null, 2), (err) => {
        if (err) return console.log(err);
        console.log(JSON.stringify(data));
        //console.log('writing to ' + fileName);
      })
      message.reply(` Successfully modified the message of the ${pingName} ping.`);
    },
  };