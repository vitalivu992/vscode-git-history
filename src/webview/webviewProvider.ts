import * as vscode from 'vscode';
import * as path from 'path';
import { getFileHistory, getSelectionHistory, getRepositoryHistory, getCurrentBranch, getAllBranches, getCurrentGitUser } from '../git/gitService';
import { CommitInfo, ExtToWebviewMessage } from '../types';
import { handleMessage } from './messageHandler';
import { SettingsService } from '../settings';
import { FirstRunTipService } from '../firstRunTip';

interface SelectionRange {
  startLine: number;
  endLine: number;
}

export class GitHistoryPanel implements vscode.WebviewViewProvider {
  public static currentPanel: GitHistoryPanel | undefined;
  public static readonly viewType = 'gitHistory.webview';

  private _view: vscode.WebviewView | undefined;
  private _disposables: vscode.Disposable[] = [];
  private _filePath: string = '';
  private _cwd: string = '';
  private _selection?: SelectionRange;
  private _commits: CommitInfo[] = [];
  private _branch: string | undefined;
  private _webviewReady: boolean = false;
  private _pendingInit: (() => void) | null = null;
  private readonly _settingsService: SettingsService;
  private readonly _firstRunTipService: FirstRunTipService;
  private readonly _extensionUri: vscode.Uri;
  private readonly _context: vscode.ExtensionContext;
  private _ignoreWhitespace: boolean = false;
  private _diffContextLines: number = 3;

  public static async showCommitDiff(
    extensionUri: vscode.Uri,
    filePath: string,
    cwd: string,
    settingsService: SettingsService,
    firstRunTipService: FirstRunTipService,
    context: vscode.ExtensionContext,
    commitHash: string
  ): Promise<void> {
    await GitHistoryPanel.createOrShow(extensionUri, filePath, cwd, settingsService, firstRunTipService, context);
    GitHistoryPanel.currentPanel?.postMessage({ type: 'selectCommit', hash: commitHash });
  }

  public static async createOrShow(
    extensionUri: vscode.Uri,
    filePath: string,
    cwd: string,
    settingsService: SettingsService,
    firstRunTipService: FirstRunTipService,
    context: vscode.ExtensionContext,
    selection?: SelectionRange
  ): Promise<void> {
    if (GitHistoryPanel.currentPanel) {
      const panel = GitHistoryPanel.currentPanel;
      panel._filePath = filePath;
      panel._cwd = cwd;
      panel._selection = selection;
      await vscode.commands.executeCommand('gitHistory.webview.focus');
      await panel.loadData();
      return;
    }

    const panel = new GitHistoryPanel(extensionUri, settingsService, firstRunTipService, context);
    panel._filePath = filePath;
    panel._cwd = cwd;
    panel._selection = selection;
    GitHistoryPanel.currentPanel = panel;
    await vscode.commands.executeCommand('gitHistory.webview.focus');
    await panel.loadData();
  }

  public constructor(
    extensionUri: vscode.Uri,
    settingsService: SettingsService,
    firstRunTipService: FirstRunTipService,
    context: vscode.ExtensionContext
  ) {
    this._extensionUri = extensionUri;
    this._settingsService = settingsService;
    this._firstRunTipService = firstRunTipService;
    this._context = context;
  }

  public resolveWebviewView(
    view: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'panel')]
    };

    view.webview.onDidReceiveMessage(
      async (message) => {
        await handleMessage(message, this, this._settingsService, this._firstRunTipService);
      },
      null,
      this._disposables
    );

    view.onDidDispose(() => {
      this._view = undefined;
    }, null, this._disposables);

    view.webview.html = this._getHtmlForWebview();

    this._webviewReady = false;
  }

  public getPanel(): vscode.WebviewView | undefined {
    return this._view;
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

  public getBranch(): string | undefined {
    return this._branch;
  }

  public getContext(): vscode.ExtensionContext {
    return this._context;
  }

  public getSettingsService(): SettingsService {
    return this._settingsService;
  }

  public getIgnoreWhitespace(): boolean {
    return this._ignoreWhitespace;
  }

  public setIgnoreWhitespace(value: boolean): void {
    this._ignoreWhitespace = value;
  }

  public toggleIgnoreWhitespace(): boolean {
    this._ignoreWhitespace = !this._ignoreWhitespace;
    return this._ignoreWhitespace;
  }

  public getDiffContextLines(): number {
    return this._diffContextLines;
  }

  public setDiffContextLines(value: number): void {
    this._diffContextLines = Math.max(1, Math.min(10, value));
  }

  public onWebviewReady(): void {
    this._webviewReady = true;
    if (this._pendingInit) {
      this._pendingInit();
      this._pendingInit = null;
    } else if (this._filePath || this._cwd) {
      void this.loadData();
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
        } else if (this._filePath) {
          commits = await getFileHistory(this._filePath, this._cwd);
        } else {
          commits = await getRepositoryHistory(this._cwd);
        }

        this._commits = commits;
        const pageSize = vscode.workspace.getConfiguration('gitHistory').get<number>('maxCommits', 500);
        const hasMore = commits.length >= pageSize;
        const sprintLengthWeeks = vscode.workspace.getConfiguration('gitHistory').get<number>('sprintLengthWeeks', 2);
        const hideMergeCommits = vscode.workspace.getConfiguration('gitHistory').get<boolean>('hideMergeCommits', false);
        const defaultDiffView = vscode.workspace.getConfiguration('gitHistory').get<string>('defaultDiffView', 'unified');
        const diffContextLines = vscode.workspace.getConfiguration('gitHistory').get<number>('diffContextLines', 3);
        const commitListDateFormat = vscode.workspace.getConfiguration('gitHistory').get<string>('commitList.dateFormat', 'relative');
        this._diffContextLines = diffContextLines;
        const branch = await getCurrentBranch(this._cwd);
        this._branch = branch;
        const branches = await getAllBranches(this._cwd);
        const currentUser = await getCurrentGitUser(this._cwd);

        const userSettings = this._settingsService.getSettings();

        if (userSettings.ignoreWhitespace !== undefined) {
          this._ignoreWhitespace = userSettings.ignoreWhitespace;
        }
        if (userSettings.diffContextLines !== undefined) {
          this._diffContextLines = userSettings.diffContextLines;
        }

        const showFirstRunTip = this._firstRunTipService.shouldShowTip();

        this.postMessage({ type: 'init', commits: this._commits, filePath: this._filePath, selection: this._selection, branch, branches, hideMergeCommits, defaultDiffView, commitListDateFormat, userSettings, currentUser, showFirstRunTip, sprintLengthWeeks, hasMore, pageSize });
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

  public async loadMoreCommits(): Promise<void> {
    const pageSize = vscode.workspace.getConfiguration('gitHistory').get<number>('maxCommits', 500);
    const skip = this._commits.length;
    try {
      let newCommits: CommitInfo[];
      if (this._selection) {
        newCommits = await getSelectionHistory(this._filePath, this._selection.startLine, this._selection.endLine, this._cwd, skip, pageSize);
      } else if (this._filePath) {
        newCommits = await getFileHistory(this._filePath, this._cwd, skip, pageSize);
      } else {
        newCommits = await getRepositoryHistory(this._cwd, undefined, skip, pageSize);
      }
      const existingHashes = new Set(this._commits.map(c => c.hash));
      const deduped = newCommits.filter(c => !existingHashes.has(c.hash));
      this._commits.push(...deduped);
      this.postMessage({
        type: 'commitsLoaded',
        commits: deduped,
        totalLoaded: this._commits.length,
        hasMore: newCommits.length >= pageSize
      });
    } catch (error) {
      this.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public postMessage(message: any): void {
    if (this._view === undefined) {
      return;
    }
    void this._view.webview.postMessage(message);
  }

  private _getHtmlForWebview(): string {
    const view = this._view!;
    const nonce = this.getNonce();
    const panelDir = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'panel');
    const stylesUri = view.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'styles.css'));
    const diff2htmlCssUri = view.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'diff2html.min.css'));
    const diff2htmlJsUri = view.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'diff2html-ui.min.js'));
    const mainJsUri = view.webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'main.js'));

    const sprintLengthWeeks = vscode.workspace.getConfiguration('gitHistory').get<number>('sprintLengthWeeks', 2);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${view.webview.cspSource}; script-src 'nonce-${nonce}' ${view.webview.cspSource};">
  <title>Git History</title>
  <link rel="stylesheet" href="${stylesUri}">
  <link rel="stylesheet" href="${diff2htmlCssUri}">
</head>
<body>
  <div id="app">
    <div id="diff-controls">
      <div class="segmented-control">
        <button id="unified-btn" class="active">Unified</button>
        <button id="side-by-side-btn">Side by Side</button>
      </div>
      <button id="word-wrap-btn" class="word-wrap-btn" title="Toggle word wrap (Ctrl+Shift+W)">Wrap</button>
      <button id="ignore-ws-btn" class="ignore-ws-btn" title="Toggle ignore whitespace (Ctrl+Shift+Alt+J)">W</button>
      <button id="context-lines-btn" class="context-lines-btn" title="Diff context lines (Ctrl+Shift+/)">
        <span id="context-lines-value">3</span>
      </button>
      <button id="merge-toggle-btn" class="merge-toggle-btn" title="Hide merge commits (Ctrl+Shift+Q)">No Merge</button>
      <button id="my-commits-btn" class="my-commits-btn" title="Show only my commits (Ctrl+Shift+M)">My Commits</button>
      <button id="refresh-btn" title="Refresh (F5 or Ctrl+Shift+R)">&#x21bb;</button>
    </div>

    <div id="main-content">
      <div id="diff-viewer"></div>
      <div id="vertical-resizer"></div>

      <div id="bottom-panel">
        <div id="commit-table-container">
          <div class="search-container">
            <input type="text" id="search-input" placeholder="Search: message, author, email, hash, tag | author:name | tag:name | branch:name | path:name | after:2024-01-01 | last:2weeks">
            <button id="regex-toggle-btn" class="regex-toggle-btn" title="Toggle regex search mode (Ctrl+Shift+X)">.*</button>
            <button id="diff-search-btn" class="diff-search-btn" title="Search within diff content">🔍 diff</button>
            <button id="clear-all-filters-btn" class="clear-all-filters-btn" title="Clear all filters (Ctrl+Alt+Q)">Clear All</button>
            <div class="date-filter-buttons">
              <button id="today-filter-btn" class="date-filter-btn" title="Show commits from the last 24 hours (last:1day)">Today</button>
              <button id="sprint-filter-btn" class="date-filter-btn" title="Show commits from the last N weeks (last:Nweeks)">Last ${sprintLengthWeeks} week${sprintLengthWeeks !== 1 ? 's' : ''}</button>
            </div>
            <div id="commit-count" class="commit-count"></div>
          </div>
          <table id="commit-table">
            <thead>
              <tr>
                <th class="hash-col">Hash</th>
                <th class="author-col sortable" data-sort="author">Author</th>
                <th class="date-col sortable" data-sort="date">Date</th>
                <th class="message-col">Message</th>
              </tr>
            </thead>
            <tbody id="commit-list"></tbody>
          </table>
        </div>

        <div id="horizontal-resizer"></div>

        <div id="commit-detail">
          <div id="commit-detail-header">
            <span class="detail-label">Changed Files</span>
          </div>
          <ul id="file-list"></ul>
        </div>
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${diff2htmlJsUri}"></script>
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
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}