import * as vscode from 'vscode';
import { GitHistoryPanel } from './webview/webviewProvider';
import { getGitRoot } from './git/gitService';
import { BlameService } from './blame/blameService';
import { GitHistoryContentProvider } from './gitHistoryContentProvider';
import { SettingsService } from './settings';
import { FirstRunTipService } from './firstRunTip';

export function activate(context: vscode.ExtensionContext) {
  // Initialize settings service
  const settingsService = new SettingsService(context.globalState);
  const firstRunTipService = new FirstRunTipService(context.globalState);

  const blameService = new BlameService();
  context.subscriptions.push(blameService);
  const showFileHistoryCommand = vscode.commands.registerCommand(
    'gitHistory.showFileHistory',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      const filePath = activeEditor.document.uri.fsPath;
      const selection = activeEditor.selection;

      // Convert 0-indexed to 1-indexed for git
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;

      try {
        const cwd = await getGitRoot(filePath);
        await GitHistoryPanel.createOrShow(context.extensionUri, filePath, cwd, settingsService, firstRunTipService, context);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open git history: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  const showSelectionHistoryCommand = vscode.commands.registerCommand(
    'gitHistory.showSelectionHistory',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      const filePath = activeEditor.document.uri.fsPath;
      const selection = activeEditor.selection;

      if (selection.isEmpty) {
        vscode.window.showInformationMessage('Please select some lines first');
        return;
      }

      // Convert 0-indexed to 1-indexed for git
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;

      try {
        const cwd = await getGitRoot(filePath);
        await GitHistoryPanel.createOrShow(
          context.extensionUri,
          filePath,
          cwd,
          settingsService,
          firstRunTipService,
          context,
          { startLine, endLine }
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open git history: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  const showRepositoryHistoryCommand = vscode.commands.registerCommand(
    'gitHistory.showRepositoryHistory',
    async () => {
      let cwd: string;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        try {
          cwd = await getGitRoot(activeEditor.document.uri.fsPath);
        } catch {
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
          }
          cwd = workspaceFolders[0].uri.fsPath;
        }
      } else if (workspaceFolders && workspaceFolders.length > 0) {
        cwd = workspaceFolders[0].uri.fsPath;
      } else {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      await GitHistoryPanel.createOrShow(context.extensionUri, '', cwd, settingsService, firstRunTipService, context);
    }
  );

  const toggleBlameCommand = vscode.commands.registerCommand(
    'gitHistory.toggleBlame',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }
      try {
        await blameService.toggleBlame(activeEditor);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to show blame: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  const showBlameCommitCommand = vscode.commands.registerCommand(
    'gitHistory.showBlameCommit',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }
      const bl = blameService.getBlameForLine(
        activeEditor.document.uri,
        activeEditor.selection.active.line
      );
      if (!bl || /^0+$/.test(bl.hash)) {
        vscode.window.showInformationMessage('No committed blame info for this line');
        return;
      }
      try {
        const filePath = activeEditor.document.uri.fsPath;
        const cwd = await getGitRoot(filePath);
        await GitHistoryPanel.showCommitDiff(context.extensionUri, filePath, cwd, settingsService, firstRunTipService, context, bl.hash);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to show commit: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  context.subscriptions.push(
    showFileHistoryCommand,
    showSelectionHistoryCommand,
    showRepositoryHistoryCommand,
    toggleBlameCommand,
    showBlameCommitCommand,
    vscode.workspace.registerTextDocumentContentProvider(
      GitHistoryContentProvider.scheme,
      new GitHistoryContentProvider()
    )
  );

  // Register webview action commands for keybinding discoverability
  const webviewActions = [
    { command: 'gitHistory.refresh', action: 'refresh' },
    { command: 'gitHistory.copyCommitHash', action: 'copyCommitHash' },
    { command: 'gitHistory.copyCommitInfo', action: 'copyCommitInfo' },
    { command: 'gitHistory.copyCherryPick', action: 'copyCherryPick' },
    { command: 'gitHistory.copyRevert', action: 'copyRevert' },
    { command: 'gitHistory.copyCommitUrl', action: 'copyCommitUrl' },
    { command: 'gitHistory.copyAuthorEmail', action: 'copyAuthorEmail' },
    { command: 'gitHistory.copyAuthorName', action: 'copyAuthorName' },
    { command: 'gitHistory.copyShortHash', action: 'copyShortHash' },
    { command: 'gitHistory.copySubject', action: 'copySubject' },
    { command: 'gitHistory.createBranch', action: 'createBranch' },
    { command: 'gitHistory.createTag', action: 'createTag' },
    { command: 'gitHistory.deleteTag', action: 'deleteTag' },
    { command: 'gitHistory.deleteBranch', action: 'deleteBranch' },
    { command: 'gitHistory.checkoutBranch', action: 'checkoutBranch' },
    { command: 'gitHistory.renameBranch', action: 'renameBranch' },
    { command: 'gitHistory.cherryPickCommit', action: 'cherryPickCommit' },
    { command: 'gitHistory.revertCommit', action: 'revertCommit' },
    { command: 'gitHistory.toggleMyCommits', action: 'toggleMyCommits' },
    { command: 'gitHistory.toggleWordWrap', action: 'toggleWordWrap' },
    { command: 'gitHistory.toggleRegex', action: 'toggleRegex' },
    { command: 'gitHistory.toggleIgnoreWhitespace', action: 'toggleIgnoreWhitespace' },
    { command: 'gitHistory.toggleHideMergeCommits', action: 'toggleHideMergeCommits' },
    { command: 'gitHistory.jumpToHash', action: 'jumpToHash' },
    { command: 'gitHistory.jumpToNextTag', action: 'jumpToNextTag' },
    { command: 'gitHistory.jumpToPreviousTag', action: 'jumpToPreviousTag' },
    { command: 'gitHistory.jumpToParent', action: 'jumpToParent' },
    { command: 'gitHistory.focusSearch', action: 'focusSearch' },
    { command: 'gitHistory.focusCommitList', action: 'focusCommitList' },
    { command: 'gitHistory.showKeyboardHelp', action: 'showKeyboardHelp' },
    { command: 'gitHistory.cycleDiffContextLines', action: 'cycleDiffContextLines' },
    { command: 'gitHistory.cycleSortMode', action: 'cycleSortMode' },
    { command: 'gitHistory.clearAllFilters', action: 'clearAllFilters' },
    { command: 'gitHistory.toggleSignatures', action: 'toggleSignatures' },
  ] as const;

  for (const { command, action } of webviewActions) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, () => {
        GitHistoryPanel.currentPanel?.postMessage({ type: 'triggerAction', action });
      })
    );
  }
}

export function deactivate() {
  GitHistoryPanel.currentPanel?.dispose();
}
