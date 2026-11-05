import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryCache, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from '../dist/index.js';

test('MemoryCache stores, retrieves and deletes values', async () => {
  const cache = new MemoryCache(2);
  await cache.set('a', { value: 1 });
  assert.deepEqual(await cache.get('a'), { value: 1 });
  assert.equal(await cache.delete('a'), true);
  assert.equal(await cache.get('a'), undefined);
});

test('MemoryCache expires values', async () => {
  const cache = new MemoryCache();
  await cache.set('short', 'value', 5);
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(await cache.get('short'), undefined);
});

test('MemoryCache evicts least recently used entries', async () => {
  const cache = new MemoryCache(2);
  await cache.set('a', 1); await cache.set('b', 2); await cache.get('a'); await cache.set('c', 3);
  assert.equal(await cache.get('b'), undefined);
  assert.equal(await cache.get('a'), 1);
});

test('builders create Discord API payloads', () => {
  const embed = new EmbedBuilder().setTitle('Hello').setDescription('World').setColor(0x5865f2).toJSON();
  assert.equal(embed.title, 'Hello');
  const button = new ButtonBuilder('confirm', 'Confirm', ButtonStyle.Success);
  const row = new ActionRowBuilder().addComponents(button).toJSON();
  assert.equal(row.type, 1);
  assert.equal(row.components[0].custom_id, 'confirm');
});

test('REST sends bot authorization and parses JSON responses', async () => {
  const { REST } = await import('../dist/index.js');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bot test-token');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-RateLimit-Bucket': 'test-bucket', 'X-RateLimit-Remaining': '4', 'X-RateLimit-Reset-After': '0.1' } });
  };
  try {
    const rest = new REST({ token: 'test-token' });
    assert.deepEqual(await rest.get('/users/@me'), { ok: true });
  } finally { globalThis.fetch = originalFetch; }
});

test('REST exposes Discord API errors with their HTTP status', async () => {
  const { REST, DiscordAPIError } = await import('../dist/index.js');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Missing Access', code: 50001 }), { status: 403 });
  try {
    const rest = new REST({ token: 'test-token', maxRetries: 0 });
    await assert.rejects(rest.get('/guilds/123'), error => error instanceof DiscordAPIError && error.status === 403 && error.code === 50001);
  } finally { globalThis.fetch = originalFetch; }
});
