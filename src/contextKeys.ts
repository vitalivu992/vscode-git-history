import * as vscode from 'vscode';

export function setSideBySideDiffContext(enabled: boolean): void {
  void vscode.commands.executeCommand('setContext', 'gitHistory.sideBySideDiff', enabled);
}
