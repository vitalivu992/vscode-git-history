import * as vscode from 'vscode';
import { GitHistoryPanel } from './webview/webviewProvider';
import { getGitRoot } from './git/gitService';
import { BlameService } from './blame/blameService';

export function activate(context: vscode.ExtensionContext) {
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
        await GitHistoryPanel.createOrShow(context.extensionUri, filePath, cwd);
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
        await GitHistoryPanel.showCommitDiff(context.extensionUri, filePath, cwd, bl.hash);
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
    showBlameCommitCommand
  );
}

export function deactivate() {
  GitHistoryPanel.currentPanel?.dispose();
}
