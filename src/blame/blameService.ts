import * as vscode from 'vscode';
import { BlameLineInfo, BlameResult } from '../types';
import { getFileBlame } from '../git/gitService';
import { setBlameVisibleContext } from '../contextKeys';

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

/**
 * Format the blame annotation text shown trailing a line.
 * Uncommitted lines are labelled instead of attributed to a commit.
 */
export function formatBlameLabel(bl: BlameLineInfo, dateFormat: string): string {
  if (/^0+$/.test(bl.hash)) {
    return 'Not Committed Yet';
  }
  return `${bl.author}, ${formatBlameDate(bl.authorTime, dateFormat)}`;
}

function formatBlameDate(timestamp: number, dateFormat: string): string {
  if (dateFormat === 'iso') {
    return new Date(timestamp * 1000).toISOString().substring(0, 10);
  }
  if (dateFormat === 'relative') {
    return formatRelativeTime(timestamp);
  }
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Number of blank characters to pad a trailing blame annotation with so that it
 * starts exactly at the `offset` column. Returns `undefined` when the line is
 * longer than that column, in which case the annotation is hidden: the blame
 * text stays aligned at the column instead of being pushed further right.
 */
export function computeBlameAnnotationGap(lineLength: number, offset: number): number | undefined {
  if (lineLength > offset) {
    return undefined;
  }
  return Math.max(0, offset - lineLength);
}

/**
 * Escape markdown syntax in untrusted text (git author names, commit
 * summaries). Blame hovers are rendered trusted so that the "Show commit
 * details" command link is clickable; without escaping, commit metadata could
 * inject its own command links or remote images into that trusted hover.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|<>]/g, ch => `\\${ch}`);
}
export class BlameService implements vscode.Disposable {
  private readonly _decorationType: vscode.TextEditorDecorationType;
  private readonly _activeBlames = new Map<string, BlameResult>();
  private readonly _statusBarItem: vscode.StatusBarItem;
  private readonly _disposables: vscode.Disposable[] = [];

  constructor() {
    this._decorationType = vscode.window.createTextEditorDecorationType({
      after: {
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
        this._syncContextKey(editor);
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
      this.hideBlame(editor);
      return;
    }

    await this.showBlame(editor);
  }

  public async showBlame(editor: vscode.TextEditor): Promise<void> {
    const key = editor.document.uri.toString();

    if (this._activeBlames.has(key)) {
      this._applyDecorations(editor, this._activeBlames.get(key)!.lines);
      this._updateStatusBar(editor);
      this._syncContextKey(editor);
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const { getGitRoot } = await import('../git/gitService');

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: 'Loading git blame...' },
      async () => {
        try {
          const cwd = await getGitRoot(filePath);
          const lines = await getFileBlame(filePath, cwd);
          const blameResult: BlameResult = { filePath, lines };
          this._activeBlames.set(key, blameResult);
          this._applyDecorations(editor, lines);
          this._updateStatusBar(editor);
          this._syncContextKey(editor);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Git blame failed: ${message}`);
        }
      }
    );
  }

  public hideBlame(editor: vscode.TextEditor): void {
    this.clearBlame(editor.document.uri);
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

    const active = vscode.window.activeTextEditor;
    if (active) {
      this._updateStatusBar(active);
    } else {
      this._statusBarItem.hide();
    }
    this._syncContextKey(active);
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
    const dateFormat = config.get<string>('blame.dateFormat', 'short');
    const annotationOffset = config.get<number>('blame.annotationOffset', 160);

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
      // Anchor the annotation at the end of the line so it trails the code,
      // then pad it out to the configured column. Lines longer than the column
      // hide the annotation entirely so the blame text stays aligned.
      const lineLength = editor.document.lineAt(lineIndex).text.length;
      const gapChars = computeBlameAnnotationGap(lineLength, annotationOffset);
      if (gapChars === undefined) {
        continue;
      }
      const range = new vscode.Range(lineIndex, lineLength, lineIndex, lineLength);

      decorations.push({
        range,
        hoverMessage: isUncommitted ? undefined : this._buildBlameHover(editor, bl),
        renderOptions: {
          after: {
            contentText: formatBlameLabel(bl, dateFormat),
            fontStyle: 'italic',
            margin: `0 0 0 ${gapChars}ch`
          }
        }
      });
    }

    editor.setDecorations(this._decorationType, decorations);
  }

  private _buildBlameHover(editor: vscode.TextEditor, bl: BlameLineInfo): vscode.MarkdownString {
    const commitDate = new Date(bl.authorTime * 1000).toLocaleString();
    const args = encodeURIComponent(
      JSON.stringify([editor.document.uri.toString(), bl.hash])
    );

    const hover = new vscode.MarkdownString();
    hover.isTrusted = true;
    hover.appendMarkdown(`**${escapeMarkdown(bl.author)}** — ${escapeMarkdown(bl.summary)}\n\n`);
    hover.appendMarkdown(`\`${bl.shortHash}\` • ${commitDate}\n\n`);
    hover.appendMarkdown(`[Show commit details](command:gitHistory.showBlameCommit?${args})`);
    return hover;
  }

  private _syncContextKey(editor: vscode.TextEditor | undefined): void {
    const active = editor ?? vscode.window.activeTextEditor;
    const visible = active
      ? this._activeBlames.has(active.document.uri.toString())
      : false;
    setBlameVisibleContext(visible);
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
