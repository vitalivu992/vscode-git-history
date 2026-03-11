import * as vscode from 'vscode';
import { BlameLineInfo, BlameResult } from '../types';
import { getFileBlame } from '../git/gitService';

/**
 * Format a Unix timestamp as a relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) {
    return 'just now';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diff / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export class BlameService implements vscode.Disposable {
  private readonly _decorationType: vscode.TextEditorDecorationType;
  private readonly _activeBlames = new Map<string, BlameResult>();
  private readonly _statusBarItem: vscode.StatusBarItem;
  private readonly _disposables: vscode.Disposable[] = [];

  constructor() {
    this._decorationType = vscode.window.createTextEditorDecorationType({
      before: {
        margin: '0 2em 0 0',
        color: new vscode.ThemeColor('editorCodeLens.foreground')
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen
    });

    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this._statusBarItem.command = 'gitHistory.showBlameCommit';

    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this._applyDecorationsIfActive(editor);
          this._updateStatusBar(editor);
        } else {
          this._statusBarItem.hide();
        }
      }),
      vscode.window.onDidChangeTextEditorSelection(e => {
        this._updateStatusBar(e.textEditor);
      }),
      vscode.workspace.onDidChangeTextDocument(e => {
        this.clearBlame(e.document.uri);
      })
    );
  }

  public async toggleBlame(editor: vscode.TextEditor): Promise<void> {
    const key = editor.document.uri.toString();

    if (this._activeBlames.has(key)) {
      this.clearBlame(editor.document.uri);
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const { getGitRoot } = await import('../git/gitService');

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: 'Loading git blame...' },
      async () => {
        const cwd = await getGitRoot(filePath);
        const lines = await getFileBlame(filePath, cwd);
        const blameResult: BlameResult = { filePath, lines };
        this._activeBlames.set(key, blameResult);
        this._applyDecorations(editor, lines);
        this._updateStatusBar(editor);
      }
    );
  }

  public clearBlame(uri: vscode.Uri): void {
    const key = uri.toString();
    this._activeBlames.delete(key);

    const editor = vscode.window.visibleTextEditors.find(
      e => e.document.uri.toString() === key
    );
    if (editor) {
      editor.setDecorations(this._decorationType, []);
    }
    this._statusBarItem.hide();
  }

  public getBlameForLine(uri: vscode.Uri, line: number): BlameLineInfo | undefined {
    const blame = this._activeBlames.get(uri.toString());
    if (!blame) {
      return undefined;
    }
    // lines are 1-indexed in blame, 0-indexed in VS Code
    return blame.lines.find(l => l.lineNumber === line + 1);
  }

  private _applyDecorationsIfActive(editor: vscode.TextEditor): void {
    const key = editor.document.uri.toString();
    const blame = this._activeBlames.get(key);
    if (blame) {
      this._applyDecorations(editor, blame.lines);
    }
  }

  private _applyDecorations(editor: vscode.TextEditor, blameLines: BlameLineInfo[]): void {
    const decorations: vscode.DecorationOptions[] = [];
    const config = vscode.workspace.getConfiguration('gitHistory');
    const dateFormat = config.get<string>('blame.dateFormat', 'relative');

    let prevHash = '';
    for (const bl of blameLines) {
      // Only annotate the first line of each consecutive same-commit group
      if (bl.hash === prevHash) {
        prevHash = bl.hash;
        continue;
      }
      prevHash = bl.hash;

      const lineIndex = bl.lineNumber - 1;
      if (lineIndex < 0 || lineIndex >= editor.document.lineCount) {
        continue;
      }

      const isUncommitted = /^0+$/.test(bl.hash);
      let dateStr: string;
      if (isUncommitted) {
        dateStr = '';
      } else if (dateFormat === 'iso') {
        dateStr = new Date(bl.authorTime * 1000).toISOString().substring(0, 10);
      } else if (dateFormat === 'short') {
        dateStr = new Date(bl.authorTime * 1000).toLocaleDateString();
      } else {
        dateStr = formatRelativeTime(bl.authorTime);
      }

      const label = isUncommitted
        ? 'Not Committed Yet'
        : `${bl.author}, ${dateStr}`;

      const range = new vscode.Range(lineIndex, 0, lineIndex, 0);
      decorations.push({
        range,
        renderOptions: {
          before: {
            contentText: label,
            fontStyle: 'italic'
          }
        }
      });
    }

    editor.setDecorations(this._decorationType, decorations);
  }

  private _updateStatusBar(editor: vscode.TextEditor): void {
    const key = editor.document.uri.toString();
    const blame = this._activeBlames.get(key);
    if (!blame) {
      this._statusBarItem.hide();
      return;
    }

    const line = editor.selection.active.line;
    const bl = blame.lines.find(l => l.lineNumber === line + 1);
    if (!bl) {
      this._statusBarItem.hide();
      return;
    }

    const isUncommitted = /^0+$/.test(bl.hash);
    if (isUncommitted) {
      this._statusBarItem.text = '$(git-commit) Not Committed Yet';
    } else {
      const timeAgo = formatRelativeTime(bl.authorTime);
      this._statusBarItem.text = `$(git-commit) ${bl.author}, ${timeAgo} — ${bl.summary}`;
    }
    this._statusBarItem.show();
  }

  public dispose(): void {
    this._decorationType.dispose();
    this._statusBarItem.dispose();
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
