module.exports = {
  name: 'ping',
  description: 'Ping pong',
  args: false,
  usage: '',
  execute(message, args) {
    message.channel.send('pong');
  },
};