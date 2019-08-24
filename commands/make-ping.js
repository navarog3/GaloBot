const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
  name: 'make-ping',
  description: 'Creates a ping. Ping name shouldn\'t have spaces. Ping time should be of the form "Sunday 0330".',
  usage: '[ping_name] [ping time] [ping message]',
  args: true,
  execute(message, args) {
    const inputName = args[0];
    const inputDay = args[1];
    const inputTime = args[2];
    const trash = args.splice(0, 3);
    const inputMsg = args.join(' ');

    let dataPre = {
      name: `${inputName}`,
      time: `${inputDay} ${inputTime}`,
      msg:  `${inputMsg}`
    };

    let data = JSON.stringify(dataPre, null, 2);
    const fileName = `./pings/${inputName}.json`;

    fs.writeFile(fileName, data, (err) => {
      if (err) return console.log(err);
    })
    message.reply(` Successfully created a ping with the name ${inputName}.`);
  },
};