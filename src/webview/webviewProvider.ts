import * as vscode from 'vscode';
import * as path from 'path';
import { getFileHistory, getSelectionHistory } from '../git/gitService';
import { CommitInfo } from '../types';
import { handleMessage } from './messageHandler';

interface SelectionRange {
  startLine: number;
  endLine: number;
}

export class GitHistoryPanel {
  public static currentPanel: GitHistoryPanel | undefined;
  public static readonly viewType = 'gitHistory.webview';

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _filePath: string;
  private readonly _cwd: string;
  private readonly _selection?: SelectionRange;
  private _commits: CommitInfo[] = [];
  private _webviewReady: boolean = false;
  private _pendingInit: (() => void) | null = null;

  public static async createOrShow(
    extensionUri: vscode.Uri,
    filePath: string,
    cwd: string,
    selection?: SelectionRange
  ): Promise<void> {
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

    // If panel already exists, show it
    if (GitHistoryPanel.currentPanel) {
      GitHistoryPanel.currentPanel._panel.reveal(column);
      // Reload with new data
      await GitHistoryPanel.currentPanel.loadData();
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      GitHistoryPanel.viewType,
      'Git History',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'panel')]
      }
    );

    GitHistoryPanel.currentPanel = new GitHistoryPanel(panel, extensionUri, filePath, cwd, selection);
    await GitHistoryPanel.currentPanel.loadData();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly _extensionUri: vscode.Uri,
    filePath: string,
    cwd: string,
    selection?: SelectionRange
  ) {
    this._panel = panel;
    this._filePath = filePath;
    this._cwd = cwd;
    this._selection = selection;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        await handleMessage(message, this);
      },
      null,
      this._disposables
    );

    this._panel.webview.html = this._getHtmlForWebview();
  }

  public getPanel(): vscode.WebviewPanel {
    return this._panel;
  }

  public getFilePath(): string {
    return this._filePath;
  }

  public getCwd(): string {
    return this._cwd;
  }

  public getSelection(): SelectionRange | undefined {
    return this._selection;
  }

  public getCommits(): CommitInfo[] {
    return this._commits;
  }

  public onWebviewReady(): void {
    this._webviewReady = true;
    if (this._pendingInit) {
      this._pendingInit();
      this._pendingInit = null;
    }
  }

  public async loadData(): Promise<void> {
    const sendInit = async () => {
      try {
        let commits: CommitInfo[];

        if (this._selection) {
          commits = await getSelectionHistory(
            this._filePath,
            this._selection.startLine,
            this._selection.endLine,
            this._cwd
          );
        } else {
          commits = await getFileHistory(this._filePath, this._cwd);
        }

        this._commits = commits;
        this.postMessage({ type: 'init', commits: this._commits, filePath: this._filePath });
      } catch (error) {
        this.postMessage({
          type: 'error',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    };

    if (this._webviewReady) {
      await sendInit();
    } else {
      this._pendingInit = () => { void sendInit(); };
    }
  }

  public postMessage(message: any): void {
    void this._panel.webview.postMessage(message);
  }

  private _getHtmlForWebview(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net;">
  <title>Git History</title>
  <link rel="stylesheet" href="${this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'panel', 'styles.css'))}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html@3.4.47/bundles/css/diff2html.min.css">
</head>
<body>
  <div id="app">
    <div id="diff-controls">
      <button id="unified-btn" class="active">Unified</button>
      <button id="side-by-side-btn">Side-by-Side</button>
    </div>

    <div id="main-content">
      <div id="diff-viewer"></div>

      <div id="bottom-panel">
        <div id="commit-table-container">
          <div class="search-container">
            <input type="text" id="search-input" placeholder="Search commits...">
          </div>
          <table id="commit-table">
            <thead>
              <tr>
                <th class="checkbox-col"><input type="checkbox" id="select-all"></th>
                <th class="hash-col">Hash</th>
                <th class="author-col">Author</th>
                <th class="date-col">Date</th>
                <th class="message-col">Message</th>
              </tr>
            </thead>
            <tbody id="commit-list"></tbody>
          </table>
        </div>

        <div id="commit-detail">
          <h3>Changed Files</h3>
          <ul id="file-list"></ul>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/diff2html@3.4.47/bundles/js/diff2html-ui.min.js"></script>
  <script nonce="${nonce}" src="${this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'panel', 'main.js'))}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public dispose(): void {
    GitHistoryPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
