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

  public static async showCommitDiff(
    extensionUri: vscode.Uri,
    filePath: string,
    cwd: string,
    commitHash: string
  ): Promise<void> {
    await GitHistoryPanel.createOrShow(extensionUri, filePath, cwd);
    // After panel is ready, select the commit
    GitHistoryPanel.currentPanel?.postMessage({ type: 'selectCommit', hash: commitHash });
  }

  public static async createOrShow(
    extensionUri: vscode.Uri,
    filePath: string,
    cwd: string,
    selection?: SelectionRange
  ): Promise<void> {
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

    // If panel already exists, reuse it only if context is the same
    if (GitHistoryPanel.currentPanel) {
      const existingPanel = GitHistoryPanel.currentPanel;
      const existingSel = existingPanel.getSelection();
      const sameContext =
        existingPanel.getFilePath() === filePath &&
        existingPanel.getCwd() === cwd &&
        existingSel?.startLine === selection?.startLine &&
        existingSel?.endLine === selection?.endLine;

      if (sameContext) {
        existingPanel._panel.reveal(column);
        await existingPanel.loadData();
        return;
      }

      // Different context: dispose old panel and create a new one
      existingPanel.dispose();
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
        const showGraph = vscode.workspace.getConfiguration('gitHistory').get<boolean>('showGraph', true);
        this.postMessage({ type: 'init', commits: this._commits, filePath: this._filePath, showGraph, selection: this._selection });
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
    const panelDir = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'panel');
    const stylesUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'styles.css'));
    const diff2htmlCssUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'diff2html.min.css'));
    const diff2htmlJsUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'diff2html-ui.min.js'));
    const graphLayoutUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'graphLayout.js'));
    const mainJsUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'main.js'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${this._panel.webview.cspSource}; script-src 'nonce-${nonce}' ${this._panel.webview.cspSource};">
  <title>Git History</title>
  <link rel="stylesheet" href="${stylesUri}">
  <link rel="stylesheet" href="${diff2htmlCssUri}">
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
                <th class="graph-col">Graph</th>
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
  <script nonce="${nonce}" src="${diff2htmlJsUri}"></script>
  <script nonce="${nonce}" src="${graphLayoutUri}"></script>
  <script nonce="${nonce}" src="${mainJsUri}"></script>
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
