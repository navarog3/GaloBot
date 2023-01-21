export const name = 'ping';
export const description = 'Ping pong';
export const args = false;
export function execute(message, args) {
  message.channel.send('pong');
}