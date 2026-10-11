import type { ScmManager, WorkspaceRegistry, WorkspaceRegistryEvent } from '@remotish/vscode/model';
import type * as vscode from 'vscode';
import { RemotishHistoryProvider } from './history-provider.js';

/** Attaches one native SCM history provider per registered Remotish workspace. */
export class HistoryManager implements vscode.Disposable {
  private readonly entries = new Map<string, RemotishHistoryProvider>();
  private readonly registrySubscription: vscode.Disposable;

  constructor(
    private readonly registry: WorkspaceRegistry,
    private readonly scm: ScmManager,
    private readonly logger?: vscode.LogOutputChannel,
  ) {
    for (const registration of registry.list()) {
      this.add(registration.id);
    }
    this.registrySubscription = registry.onDidChange((event) => this.handleRegistryEvent(event));
  }

  dispose(): void {
    this.registrySubscription.dispose();
    for (const workspaceId of [...this.entries.keys()]) {
      this.remove(workspaceId);
    }
  }

  private handleRegistryEvent(event: WorkspaceRegistryEvent): void {
    if (event.type === 'registered') {
      this.add(event.registration.id);
    } else {
      this.remove(event.registration.id);
    }
  }

  private add(workspaceId: string): void {
    if (this.entries.has(workspaceId)) {
      return;
    }
    const sourceControl = this.scm.get(workspaceId)?.sourceControl;
    if (!sourceControl) {
      return;
    }
    const workspace = this.registry.require(workspaceId).workspace;
    const provider = new RemotishHistoryProvider(workspaceId, workspace, (error) => {
      if (this.logger) {
        this.logger.error(`History refresh failed for workspace ${workspaceId}.`, error);
      } else {
        console.error(`History refresh failed for workspace ${workspaceId}.`, error);
      }
    });
    sourceControl.historyProvider = provider;
    if (workspace.capabilities.commits) {
      const secondaryCommands: vscode.Command[] = [];
      if (workspace.capabilities.forceWithLease) {
        secondaryCommands.push({
          command: 'remotish.commitAndPushForceWithLease',
          title: 'Commit & Push (Force with Lease)',
          arguments: [workspaceId],
        });
      }
      if (workspace.capabilities.amend) {
        secondaryCommands.push({
          command: 'remotish.amendAndPushForceWithLease',
          title: 'Amend & Push (Force with Lease)',
          arguments: [workspaceId],
        });
      }
      sourceControl.actionButton = {
        command: {
          command: 'remotish.commitAndPush',
          title: 'Commit & Push',
          shortTitle: 'Commit & Push',
          arguments: [workspaceId],
        },
        ...(secondaryCommands.length > 0 ? { secondaryCommands: [secondaryCommands] } : {}),
        enabled: true,
      };
    }
    this.entries.set(workspaceId, provider);
  }

  private remove(workspaceId: string): void {
    const sourceControl = this.scm.get(workspaceId)?.sourceControl;
    if (sourceControl) {
      delete sourceControl.historyProvider;
      delete sourceControl.actionButton;
    }
    this.entries.get(workspaceId)?.dispose();
    this.entries.delete(workspaceId);
  }
}
