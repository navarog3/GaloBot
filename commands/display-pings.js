const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
  name: 'display-pings',
  description: 'Displays the names of pings currently being handled.',
  args: false,
    execute(message, args) {
        const pingList = [];
        fs.readdir('./pings/', (err, files) => {
            files.forEach(file => {
                pingList.push(file.slice(0, -5));
            });

            if (!pingList.length) {
                message.reply(' There are no pings currently being handled.');
            } else {
                message.reply(` Pings currently being handled are: ${pingList.join(', ')}`);
            };
        });
    },
};