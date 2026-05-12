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
    { command: 'gitHistory.copyCommitMessage', action: 'copyCommitMessage' },
    { command: 'gitHistory.copyCommitHash', action: 'copyCommitHash' },
    { command: 'gitHistory.copyCommitInfo', action: 'copyCommitInfo' },
    { command: 'gitHistory.copyCherryPick', action: 'copyCherryPick' },
    { command: 'gitHistory.copyRevert', action: 'copyRevert' },
    { command: 'gitHistory.copyCommitFiles', action: 'copyCommitFiles' },
    { command: 'gitHistory.copyCommitDiff', action: 'copyCommitDiff' },
    { command: 'gitHistory.copyCombinedDiff', action: 'copyCombinedDiff' },
    { command: 'gitHistory.copyRangeDiff', action: 'copyRangeDiff' },
    { command: 'gitHistory.copyCommitPatch', action: 'copyCommitPatch' },
    { command: 'gitHistory.copyCommitUrl', action: 'copyCommitUrl' },
    { command: 'gitHistory.copyCommitMention', action: 'copyCommitMention' },
    { command: 'gitHistory.copyCommitRef', action: 'copyCommitRef' },
    { command: 'gitHistory.copyCommitStats', action: 'copyCommitStats' },
    { command: 'gitHistory.copyBranchName', action: 'copyBranchName' },
    { command: 'gitHistory.copyBranchUrl', action: 'copyBranchUrl' },
    { command: 'gitHistory.copyRemoteUrl', action: 'copyRemoteUrl' },
    { command: 'gitHistory.copyTags', action: 'copyTags' },
    { command: 'gitHistory.copyAuthorEmail', action: 'copyAuthorEmail' },
    { command: 'gitHistory.copyAuthorName', action: 'copyAuthorName' },
    { command: 'gitHistory.copyCommitterEmail', action: 'copyCommitterEmail' },
    { command: 'gitHistory.copyCommitterName', action: 'copyCommitterName' },
    { command: 'gitHistory.copyParentHash', action: 'copyParentHash' },
    { command: 'gitHistory.copyShortHash', action: 'copyShortHash' },
    { command: 'gitHistory.copySubject', action: 'copySubject' },
    { command: 'gitHistory.copyDiffStatSummary', action: 'copyDiffStatSummary' },
    { command: 'gitHistory.copyCoAuthors', action: 'copyCoAuthors' },
    { command: 'gitHistory.copyCommitDate', action: 'copyCommitDate' },
    { command: 'gitHistory.copyRelativeDate', action: 'copyRelativeDate' },
    { command: 'gitHistory.copyOneline', action: 'copyOneline' },
    { command: 'gitHistory.copyCommitBody', action: 'copyCommitBody' },
    { command: 'gitHistory.copyCommitMarkdown', action: 'copyCommitMarkdown' },
    { command: 'gitHistory.copyCommitJson', action: 'copyCommitJson' },
    { command: 'gitHistory.copyFileContent', action: 'copyFileContent' },
    { command: 'gitHistory.copyDescribe', action: 'copyDescribe' },
    { command: 'gitHistory.copyCommitTimestamp', action: 'copyCommitTimestamp' },
    { command: 'gitHistory.copyFileDiff', action: 'copyFileDiff' },
    { command: 'gitHistory.copyFileExtension', action: 'copyFileExtension' },
    { command: 'gitHistory.copyFileDirectory', action: 'copyFileDirectory' },
    { command: 'gitHistory.copyFileName', action: 'copyFileName' },
    { command: 'gitHistory.copyFilePath', action: 'copyFilePath' },
    { command: 'gitHistory.copyFileUrl', action: 'copyFileUrl' },
    { command: 'gitHistory.copyRelativePath', action: 'copyRelativePath' },
    { command: 'gitHistory.copySelectedHashes', action: 'copySelectedHashes' },
    { command: 'gitHistory.copyAllFilteredHashes', action: 'copyAllFilteredHashes' },
    { command: 'gitHistory.exportCommits', action: 'exportCommits' },
    { command: 'gitHistory.quickCompare', action: 'quickCompare' },
    { command: 'gitHistory.createBranch', action: 'createBranch' },
    { command: 'gitHistory.createTag', action: 'createTag' },
    { command: 'gitHistory.deleteTag', action: 'deleteTag' },
    { command: 'gitHistory.deleteBranch', action: 'deleteBranch' },
    { command: 'gitHistory.checkoutBranch', action: 'checkoutBranch' },
    { command: 'gitHistory.toggleMyCommits', action: 'toggleMyCommits' },
    { command: 'gitHistory.toggleWordWrap', action: 'toggleWordWrap' },
    { command: 'gitHistory.toggleRegex', action: 'toggleRegex' },
    { command: 'gitHistory.toggleIgnoreWhitespace', action: 'toggleIgnoreWhitespace' },
    { command: 'gitHistory.toggleHideMergeCommits', action: 'toggleHideMergeCommits' },
    { command: 'gitHistory.jumpToHash', action: 'jumpToHash' },
    { command: 'gitHistory.focusSearch', action: 'focusSearch' },
    { command: 'gitHistory.showKeyboardHelp', action: 'showKeyboardHelp' },
    { command: 'gitHistory.cycleDiffContextLines', action: 'cycleDiffContextLines' },
    { command: 'gitHistory.cycleSortMode', action: 'cycleSortMode' },
    { command: 'gitHistory.copyFilterQuery', action: 'copyFilterQuery' },
    { command: 'gitHistory.pasteFilterQuery', action: 'pasteFilterQuery' },
    { command: 'gitHistory.clearAllFilters', action: 'clearAllFilters' },
    { command: 'gitHistory.openCommitUrl', action: 'openCommitUrl' },
    { command: 'gitHistory.openFileUrl', action: 'openFileUrl' },
    { command: 'gitHistory.saveFilterPreset', action: 'saveFilterPreset' },
    { command: 'gitHistory.loadFilterPreset', action: 'loadFilterPreset' },
    { command: 'gitHistory.toggleGraph', action: 'toggleGraph' },
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
