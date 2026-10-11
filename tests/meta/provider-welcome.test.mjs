import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function manifest(provider) {
  return JSON.parse(
    await readFile(new URL(`../../extensions/${provider}/package.json`, import.meta.url), 'utf8'),
  );
}

test('installed providers can independently contribute empty Explorer open buttons', async () => {
  for (const [provider, command, label] of [
    ['github-provider', 'remotish.github.open', 'Open GitHub Repository'],
    ['git-http-provider', 'remotish.gitHttp.open', 'Open Git HTTP Repository'],
    ['fixture-provider', 'remotish.demo.openFixture', 'Open Fixture Repository'],
  ]) {
    const data = await manifest(provider);
    assert.ok(data.contributes.commands.some((entry) => entry.command === command));
    assert.ok(data.activationEvents.includes(`onCommand:${command}`));
    assert.deepEqual(data.contributes.viewsWelcome, [
      {
        view: 'workbench.explorer.emptyView',
        contents: `[${label}](command:${command})`,
      },
    ]);
  }
});

test('Browser RPC does not advertise a picker that does not exist', async () => {
  const data = await manifest('browser-rpc-provider');
  assert.deepEqual(data.contributes.viewsWelcome ?? [], []);
});
