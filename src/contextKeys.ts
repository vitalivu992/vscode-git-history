import * as vscode from 'vscode';

export const BLAME_VISIBLE_CONTEXT_KEY = 'gitHistory.blameVisible';

export function setSideBySideDiffContext(enabled: boolean): void {
  void vscode.commands.executeCommand('setContext', 'gitHistory.sideBySideDiff', enabled);
}

export function setBlameVisibleContext(enabled: boolean): void {
  void vscode.commands.executeCommand('setContext', BLAME_VISIBLE_CONTEXT_KEY, enabled);
}
