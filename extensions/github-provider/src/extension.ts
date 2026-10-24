import { GitHubAdapter } from '@remotish/adapter-github';
import {
  REMOTISH_ADAPTER_PROVIDER_API_VERSION,
  type RemotishAdapterProviderV1,
} from '@remotish/adapter-sdk';
import * as vscode from 'vscode';
import {
  createGitHubBootstrapUri,
  GITHUB_BOOTSTRAP_SCHEME,
  GitHubBootstrapFileSystem,
  restoreGitHubWorkspace,
} from './bootstrap.js';
import { decodeGitHubRepository, GITHUB_PROVIDER_ID } from './repository.js';

/** Construct the anonymous public-repository provider. */
export function createGitHubProvider(context: vscode.ExtensionContext): RemotishAdapterProviderV1 {
  return {
    apiVersion: REMOTISH_ADAPTER_PROVIDER_API_VERSION,
    id: GITHUB_PROVIDER_ID,
    displayName: 'GitHub',
    validateRepository(repository) {
      decodeGitHubRepository(repository);
    },
    createAdapter(repository) {
      const target = decodeGitHubRepository(repository);
      return new GitHubAdapter(target);
    },
    async restoreWorkspace(workspaceId) {
      return restoreGitHubWorkspace(context, workspaceId);
    },
  };
}

export function activate(context: vscode.ExtensionContext): RemotishAdapterProviderV1 {
  const bootstrap = new GitHubBootstrapFileSystem(context);
  context.subscriptions.push(
    bootstrap,
    registerOpenCommand(),
    vscode.workspace.registerFileSystemProvider(GITHUB_BOOTSTRAP_SCHEME, bootstrap, {
      isReadonly: true,
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (
        !vscode.workspace.workspaceFolders?.some(
          (folder) => folder.uri.scheme === GITHUB_BOOTSTRAP_SCHEME,
        )
      ) {
        bootstrap.cancel();
      }
    }),
  );
  return createGitHubProvider(context);
}

/** Keep repository selection in the provider; the bootstrap owns persistence and navigation. */
function registerOpenCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('remotish.github.open', async () => {
    const input = await vscode.window.showInputBox({
      title: 'Open GitHub Repository',
      prompt: 'Public repository (owner/repository)',
      placeHolder: 'octocat/Hello-World',
    });
    if (input === undefined) {
      return;
    }

    const parts = input.trim().split('/');
    let repository: ReturnType<typeof decodeGitHubRepository>;
    try {
      if (parts.length !== 2) {
        throw new Error('Invalid repository input');
      }
      repository = decodeGitHubRepository({ owner: parts[0] ?? '', repository: parts[1] ?? '' });
    } catch {
      await vscode.window.showErrorMessage('Enter a public GitHub repository as owner/repository.');
      return;
    }

    await vscode.commands.executeCommand(
      'vscode.openFolder',
      vscode.Uri.parse(createGitHubBootstrapUri(repository)),
      { forceReuseWindow: true },
    );
  });
}
