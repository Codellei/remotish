import assert from 'node:assert/strict';
import test from 'node:test';
import * as vscode from 'vscode';
import {
  createGitHubBootstrapUri,
  decodeGitHubBootstrapUri,
  restoreGitHubWorkspace,
} from '../../extensions/github-provider/build/bootstrap.js';
import {
  activate,
  createGitHubProvider,
} from '../../extensions/github-provider/build/extension.js';

function createMemento(values = new Map()) {
  return {
    get(key, defaultValue) {
      return values.has(key) ? values.get(key) : defaultValue;
    },
    async update(key, value) {
      if (value === undefined) {
        values.delete(key);
      } else {
        values.set(key, value);
      }
    },
  };
}

function createContext(globalState = createMemento()) {
  return {
    globalState,
    subscriptions: [],
  };
}

test('github provider accepts only credential-free owner/repository descriptors', async () => {
  const provider = createGitHubProvider(createContext());
  const repository = { owner: 'octocat', repository: 'Hello-World' };

  assert.doesNotThrow(() => provider.validateRepository(repository));
  for (const invalid of [
    { owner: 'octocat', repository: 'Hello-World', token: 'secret' },
    { owner: ' octocat', repository: 'Hello-World' },
    { owner: 'octocat', repository: '../Hello-World' },
  ]) {
    assert.throws(() => provider.validateRepository(invalid), /owner and repository only/u);
  }

  const adapter = await provider.createAdapter(repository);
  assert.deepEqual(adapter.capabilities, {
    commits: false,
    localEdits: true,
    forceWithLease: false,
    amend: false,
    createBranch: false,
    deleteBranch: false,
  });
});

test('github bootstrap URI is direct, versioned, and strict', () => {
  const repository = { owner: 'octocat', repository: 'Hello-World' };
  const uri = createGitHubBootstrapUri(repository);

  assert.equal(uri, 'remotish-github://open/v1/octocat/Hello-World');
  assert.deepEqual(decodeGitHubBootstrapUri(uri), repository);
  assert.deepEqual(
    decodeGitHubBootstrapUri({
      scheme: 'remotish-github',
      authority: 'open',
      path: '/v1/octocat/Hello-World',
      query: '',
      fragment: '',
    }),
    repository,
  );

  for (const invalid of [
    'remotish-github://open/v1/octocat/Hello-World?token=secret',
    'remotish-github://open/v2/octocat/Hello-World',
    'remotish-github://open/v1/octocat/Hello-World/README',
    'remotish-github://open/v1/octocat/%48ello-World',
  ]) {
    assert.throws(() => decodeGitHubBootstrapUri(invalid), /Invalid GitHub bootstrap URI/u);
  }
});

test('github restoration returns only the persisted repository identity', () => {
  const workspaceId = `github-${'a'.repeat(32)}`;
  const values = new Map([
    [
      `remotish.github.restore.v1.${workspaceId}`,
      { version: 1, owner: 'octocat', repository: 'Hello-World' },
    ],
  ]);
  const context = createContext(createMemento(values));

  assert.deepEqual(restoreGitHubWorkspace(context, workspaceId), {
    provider: 'github',
    repository: { owner: 'octocat', repository: 'Hello-World' },
  });
  assert.equal(restoreGitHubWorkspace(context, `github-${'b'.repeat(32)}`), undefined);
  assert.throws(
    () => restoreGitHubWorkspace(context, 'github-not-a-workspace'),
    /Invalid GitHub workspace ID/u,
  );

  values.set(`remotish.github.restore.v1.${workspaceId}`, {
    version: 1,
    owner: 'octocat',
    repository: 'Hello-World',
    token: 'secret',
  });
  assert.throws(
    () => restoreGitHubWorkspace(context, workspaceId),
    /Invalid GitHub restoration record/u,
  );
});

test('GitHub open command reuses the public bootstrap workspace', async (t) => {
  vscode.__test.reset();
  const context = createContext();
  const provider = activate(context);
  t.after(() => {
    for (const item of context.subscriptions) {
      item.dispose();
    }
  });
  assert.equal(provider.id, 'github');

  vscode.__test.inputBoxResponses.push(' octocat/Hello-World ');
  await vscode.commands.executeCommand('remotish.github.open');
  assert.equal(vscode.__test.externalCommands.length, 1);
  assert.equal(vscode.__test.externalCommands[0].command, 'vscode.openFolder');
  const [uri, reuseWindow] = vscode.__test.externalCommands[0].args;
  assert.equal(uri.toString(), 'remotish-github://open/v1/octocat/Hello-World');
  assert.equal(reuseWindow, false);
});

test('GitHub open command ignores cancellation and rejects malformed repository input', async (t) => {
  vscode.__test.reset();
  const context = createContext();
  activate(context);
  t.after(() => {
    for (const item of context.subscriptions) {
      item.dispose();
    }
  });

  await vscode.commands.executeCommand('remotish.github.open');
  assert.equal(vscode.__test.externalCommands.length, 0);
  assert.equal(vscode.__test.errorMessages.length, 0);

  const invalid = [
    '',
    'octocat',
    'octocat/Hello-World/extra',
    'https://github.com/octocat/Hello-World',
    'octocat/%48ello-World',
    'octocat/Hello World',
  ];
  for (const input of invalid) {
    vscode.__test.inputBoxResponses.push(input);
    await vscode.commands.executeCommand('remotish.github.open');
  }
  assert.equal(vscode.__test.externalCommands.length, 0);
  assert.equal(vscode.__test.errorMessages.length, invalid.length);
});
