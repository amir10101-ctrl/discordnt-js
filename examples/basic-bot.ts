import { NT, EmbedBuilder } from 'discordnt.js';

const client = new NT({
  token: process.env.DISCORD_TOKEN ?? '',
  intents: 1, // Guilds
});

client.slash({ name: 'ping', description: 'Check whether the bot is online' }, async ctx => {
  await ctx.reply('Pong!');
});

client.slash({ name: 'hello', description: 'Send a greeting' }, async ctx => {
  const embed = new EmbedBuilder().setTitle('Hello!').setDescription(`Welcome, ${ctx.user?.username ?? 'there'}.`).setColor(0x5865f2);
  await ctx.reply({ embeds: [embed.toJSON()] });
});

client.on('ready', () => console.log('DiscordNT.js connected.'));
client.on('error', error => console.error(error));
await client.start();
