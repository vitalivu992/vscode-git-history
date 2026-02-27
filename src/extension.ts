import * as vscode from 'vscode';
import { GitHistoryPanel } from './webview/webviewProvider';
import { getGitRoot } from './git/gitService';

export function activate(context: vscode.ExtensionContext) {
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

  context.subscriptions.push(showFileHistoryCommand, showSelectionHistoryCommand);
}

export function deactivate() {
  GitHistoryPanel.currentPanel?.dispose();
}
