# discordnt.js

**Less Code. More Power.** A small TypeScript-first Discord API library focused on a straightforward developer experience.

> Status: early development (`0.1.0`). This is not a `1.0.0` release and is not yet a complete replacement for discord.js. The public API and protocol coverage may change.

## Requirements

- Node.js 22 or newer (uses the built-in WebSocket implementation)
- A Discord application and bot token

## Install

```bash
npm install discordnt.js
```

The npm package has not been published by this project yet. To develop locally, clone or download this source folder and run `npm install` inside it.

## Quick start

```ts
import { NT, EmbedBuilder } from 'discordnt.js';

const client = new NT({
  token: process.env.DISCORD_TOKEN!,
  intents: 1, // GatewayIntentBits.Guilds
});

client.slash({ name: 'ping', description: 'Check bot latency' }, async ctx => {
  await ctx.reply('Pong!');
});

client.slash({ name: 'about', description: 'About this bot' }, async ctx => {
  const embed = new EmbedBuilder()
    .setTitle('DiscordNT.js')
    .setDescription('Less Code. More Power.')
    .setColor(0x5865f2);
  await ctx.reply({ embeds: [embed.toJSON()] });
});

client.on('ready', () => console.log('Ready'));
client.on('error', error => console.error(error));
await client.start();
```

Set `DISCORD_TOKEN` in your environment. Never commit a real token.

## Current implementation status

| Area | Status |
|---|---|
| TypeScript ESM package and declarations | Implemented |
| REST JSON requests, errors, basic route buckets and 429 handling | Initial implementation; needs Discord integration tests |
| Gateway identify, heartbeat, session resume and reconnect | Initial implementation; needs live reconnect tests |
| Slash command registration and chat-input handlers | Basic implementation |
| Button, select, modal and autocomplete handler routing | Basic implementation |
| Interaction reply, defer, edit, follow-up and modal response | Basic implementation |
| Embed, button and action-row builders | Basic implementation |
| In-memory LRU/TTL cache | Implemented |
| Redis adapter | Not included in this standalone cut |
| Full voice protocol, UDP discovery, encryption, RTP and Opus playback | **Not implemented** |
| Sharding, full structures/collections, full API coverage | Not implemented |

Do not advertise Voice as supported yet. `VoiceManager` is only an adapter contract; it does not connect to Discord voice servers or play audio.

## Slash commands

Commands are registered globally on startup by default, provided at least one command has been added. Global command updates can take time to appear. Set `autoRegisterCommands: false` if you manage command registration yourself.

```ts
client.slash({ name: 'echo', description: 'Repeat text', options: [
  { type: 3, name: 'text', description: 'Text to repeat', required: true }
]}, async ctx => {
  await ctx.reply(ctx.getString('text') ?? '');
});
```

Component and modal handlers are registered by custom ID:

```ts
client.button('confirm', async ctx => ctx.reply('Confirmed'));
client.select('choose-color', async ctx => ctx.reply('Selection received'));
client.modal('feedback-form', async ctx => ctx.reply('Thanks for the feedback'));
client.autocomplete('echo', async ctx => ctx.respondAutocomplete([
  { name: 'Example', value: 'example' }
]));
```

## REST

`client.rest` exposes `get`, `post`, `put`, `patch`, `delete`, and `request`. It uses the bot authorization header and throws `DiscordAPIError` for non-success responses. Avoid retrying non-idempotent requests yourself unless you understand whether the operation is safe to repeat.

## Gateway

The Gateway uses Node's built-in WebSocket. Set the correct intents for the events your bot needs. Resume is attempted when a resumable session is available; otherwise the client identifies again. Always listen for `error` events.

## Security

- Keep bot tokens in environment variables or a secret manager.
- Never expose a bot token in browser-side code.
- Use the minimum Gateway intents and permissions needed.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
npm pack --dry-run
```

Before publishing, replace the repository placeholder in `package.json`, add the final project URL, review the license and package metadata, run tests on supported Node versions, and complete Discord live integration tests.

## License

MIT. See [LICENSE](./LICENSE).
