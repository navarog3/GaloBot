module.exports = {
  name: 'ping',
  description: 'Ping pong',
  args: false,
  execute(message, args) {
    message.channel.send('pong');
  },
};