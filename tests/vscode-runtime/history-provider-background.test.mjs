import assert from 'node:assert/strict';
import test from 'node:test';
import { RemotishHistoryProvider } from '../../packages/vscode-history/dist/history-provider.js';
import { HistoryManager } from '../../packages/vscode-history/dist/manager.js';

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('history provider reports detached remote-ref refresh failures', async (t) => {
  const listeners = new Set();
  const failure = new Error('listBranches failed');
  const reported = [];
  const workspace = {
    branch: 'main',
    baseRevision: 'C1',
    onDidChange(listener) {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
    async listBranches() {
      throw failure;
    },
  };

  const provider = new RemotishHistoryProvider('failing', workspace, (error) =>
    reported.push(error),
  );
  t.after(() => provider.dispose());

  await settle();
  assert.deepEqual(reported, [failure]);

  for (const listener of listeners) {
    listener({ branch: 'main', baseRevision: 'C1' });
  }
  await settle();
  assert.deepEqual(reported, [failure, failure]);
});

test('exported history constructors accept their original arguments', async () => {
  const workspace = {
    capabilities: { commits: false },
    branch: 'main',
    baseRevision: 'C1',
    onDidChange: () => ({ dispose() {} }),
    async listBranches() {
      return [];
    },
  };
  const provider = new RemotishHistoryProvider('legacy', workspace);
  await settle();
  provider.dispose();

  const sourceControl = {};
  const registry = {
    list: () => [{ id: 'legacy' }],
    require: () => ({ workspace }),
    onDidChange: () => ({ dispose() {} }),
  };
  const scm = { get: () => ({ sourceControl }) };
  const manager = new HistoryManager(registry, scm);
  assert.ok(sourceControl.historyProvider instanceof RemotishHistoryProvider);
  assert.equal(sourceControl.actionButton, undefined);
  await settle();
  manager.dispose();
  assert.equal(sourceControl.historyProvider, undefined);
});

test('controlled commit actions respect individual adapter capabilities', async () => {
  for (const [capabilities, expectedCommands] of [
    [{ commits: true }, []],
    [{ commits: true, forceWithLease: true }, ['remotish.commitAndPushForceWithLease']],
    [
      { commits: true, forceWithLease: true, amend: true },
      ['remotish.commitAndPushForceWithLease', 'remotish.amendAndPushForceWithLease'],
    ],
  ]) {
    const sourceControl = {};
    const workspace = {
      capabilities,
      branch: 'main',
      baseRevision: 'C1',
      onDidChange: () => ({ dispose() {} }),
      async listBranches() {
        return [];
      },
    };
    const registry = {
      list: () => [{ id: 'fixture' }],
      require: () => ({ workspace }),
      onDidChange: () => ({ dispose() {} }),
    };
    const manager = new HistoryManager(registry, { get: () => ({ sourceControl }) });
    const button = sourceControl.actionButton;
    assert.equal(button?.command.command, 'remotish.commitAndPush');
    assert.deepEqual(button?.command.arguments, ['fixture']);
    assert.deepEqual(
      button.secondaryCommands?.flat().map((entry) => entry.command) ?? [],
      expectedCommands,
    );
    await settle();
    manager.dispose();
    assert.equal(sourceControl.actionButton, undefined);
    assert.equal(sourceControl.historyProvider, undefined);
  }
});
