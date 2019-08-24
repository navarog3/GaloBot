const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
  name: 'make-ping',
  description: 'Creates a ping. Ping name shouldn\'t have spaces. Ping time should be of the form "Sunday 0330".',
  usage: '[ping_name] [ping time] [ping message]',
  args: true,
    execute(message, args) {
      //$make-ping raiders_1 Tuesday 0230 This is an example ping, for testing purposes.
      //          |  Name   |  Day  |Time| Message ----->
      const inputName = args[0];
      const inputDay = args[1];
      const inputTime = args[2];
      //const inputMsg = ;

      let dataPre = {
        name: `${input}`
      };
      let data = JSON.stringify(dataPre, null, 2);
      const fileName = `./pings/${input}.json`;

      fs.writeFile(fileName, data, (err) => {
        if (err) return console.log(err);
        // console.log(JSON.stringify(data, null, 2));
        // console.log('writing to ' + fileName);
      })
      message.reply(` Successfully created a ping with the name ${input}.`);
    },
  };