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

interface WebviewAssets {
  stylesUri: vscode.Uri;
  diff2htmlCssUri: vscode.Uri;
  diff2htmlJsUri: vscode.Uri;
  mainJsUri: vscode.Uri;
  nonce: string;
}

function getWebviewAssets(webview: vscode.Webview, extensionUri: vscode.Uri): WebviewAssets {
  const panelDir = vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'panel');
  return {
    stylesUri: webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'styles.css')),
    diff2htmlCssUri: webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'diff2html.min.css')),
    diff2htmlJsUri: webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'diff2html-ui.min.js')),
    mainJsUri: webview.asWebviewUri(vscode.Uri.joinPath(panelDir, 'main.js')),
    nonce: getNonce()
  };
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Shared <head> + script tail for both webview surfaces (same assets, nonce, CSP).
 */
function wrapHtml(bodyContent: string, assets: WebviewAssets, cspSource: string): string {
  const { stylesUri, diff2htmlCssUri, diff2htmlJsUri, mainJsUri, nonce } = assets;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}' ${cspSource};">
  <title>Git History</title>
  <link rel="stylesheet" href="${stylesUri}">
  <link rel="stylesheet" href="${diff2htmlCssUri}">
</head>
<body ${bodyContent}
  <script nonce="${nonce}" src="${diff2htmlJsUri}"></script>
  <script nonce="${nonce}" src="${mainJsUri}"></script>
</body>
</html>`;
}

/**
 * HTML for the editor-area diff surface (data-mode="diff"):
 * diff controls (Unified/Side by Side, Wrap, ignore-whitespace, context lines)
 * and the diff viewer only — no commit list, no search.
 */
function getDiffHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const assets = getWebviewAssets(webview, extensionUri);
  const body = `data-mode="diff">
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
    </div>

    <div id="main-content">
      <div id="diff-viewer"></div>
    </div>
  </div>`;
  return wrapHtml(body, assets, webview.cspSource);
}

/**
 * HTML for the bottom-panel list surface (data-mode="list"):
 * list toolbar (No Merge, My Commits, refresh), the commit table with search
 * container, and the commit detail (changed files) — no diff viewer.
 */
function getListHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const assets = getWebviewAssets(webview, extensionUri);
  const sprintLengthWeeks = vscode.workspace.getConfiguration('gitHistory').get<number>('sprintLengthWeeks', 2);
  const body = `data-mode="list">
  <div id="app">
    <div id="panel-toolbar">
      <button id="merge-toggle-btn" class="merge-toggle-btn" title="Hide merge commits (Ctrl+Shift+Q)">No Merge</button>
      <button id="my-commits-btn" class="my-commits-btn" title="Show only my commits (Ctrl+Shift+M)">My Commits</button>
      <button id="refresh-btn" title="Refresh (F5 or Ctrl+Shift+R)">&#x21bb;</button>
    </div>

    <div id="main-content">
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
  </div>`;
  return wrapHtml(body, assets, webview.cspSource);
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
    // The instance created here is the singleton all commands talk to. When
    // VS Code later resolves the view on THIS instance (provider path),
    // currentPanel must already point at it — otherwise createOrShow spawns a
    // second instance that never owns the view and whose pendingInit never
    // fires (commit table never populates).
    GitHistoryPanel.currentPanel = this;
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
    // Defensive re-bind: if a command created a fresh instance via createOrShow
    // (or the view was re-resolved), currentPanel must always be the instance
    // that owns the live view.
    GitHistoryPanel.currentPanel = this;
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

  public getFirstRunTipService(): FirstRunTipService {
    return this._firstRunTipService;
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
    } else {
      // No queued init (the user opened the tab directly, no command ran):
      // load now — loadData() defaults _cwd to the first workspace folder,
      // so the repo history populates without needing a command.
      void this.loadData();
    }
  }

  public async loadData(): Promise<void> {
    const sendInit = async () => {
      try {
        // When the user opens the Git History tab directly (no command), _cwd
        // is empty — default to the first workspace folder so the repo history
        // resolves in the workspace instead of the extension-host CWD.
        if (!this._cwd) {
          const wf = vscode.workspace.workspaceFolders?.[0];
          if (wf) {
            this._cwd = wf.uri.fsPath;
          }
        }
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
    return getListHtml(view.webview, this._extensionUri);
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

/**
 * Editor-area singleton WebviewPanel rendering the diff for the commit
 * selected in the Git History panel. Created lazily on first diff request,
 * reused across commits (new diff data arrives via postMessage; the tab
 * title is updated per commit), and disposed on manual close.
 */
export class GitHistoryDiffPanel {
  public static instance: GitHistoryDiffPanel | undefined;
  public static readonly viewType = 'gitHistory.diffView';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _settingsService: SettingsService;
  private readonly _disposables: vscode.Disposable[] = [];
  private _webviewReady: boolean = false;
  private _disposed: boolean = false;
  private _pendingMessages: ExtToWebviewMessage[] = [];
  private _currentHash: string | undefined;

  /**
   * Diff tab title: `<shortHash> <subject>`, truncated to ~48 characters.
   */
  public static formatCommitTitle(shortHash: string, subject: string): string {
    const title = `${shortHash} ${subject}`.trim();
    return title.length > 48 ? title.substring(0, 45) + '...' : title;
  }

  /**
   * Reveal the existing diff panel (keeping focus where it is) or create a
   * new one next to the active editor with preserveFocus: true, so selecting
   * a commit in the panel list never yanks focus out of the list.
   */
  public static createOrShow(extensionUri: vscode.Uri, settingsService: SettingsService): GitHistoryDiffPanel {
    if (GitHistoryDiffPanel.instance) {
      GitHistoryDiffPanel.instance._panel.reveal(undefined, true);
      return GitHistoryDiffPanel.instance;
    }
    return new GitHistoryDiffPanel(extensionUri, settingsService);
  }

  private constructor(extensionUri: vscode.Uri, settingsService: SettingsService) {
    this._extensionUri = extensionUri;
    this._settingsService = settingsService;

    const viewColumn = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    this._panel = vscode.window.createWebviewPanel(
      GitHistoryDiffPanel.viewType,
      'Git History Diff',
      { viewColumn, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'panel')]
      }
    );

    this._panel.webview.html = getDiffHtml(this._panel.webview, this._extensionUri);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        if (typeof message !== 'object' || message === null || !('type' in message)) {
          return;
        }
        if (message.type === 'ready') {
          this._webviewReady = true;
          this._sendDiffSettings();
          this._flushPendingMessages();
          return;
        }
        // Diff-surface requests (re-request diff on toggle, saveSettings) are
        // handled by the shared message handler with the LIST panel as the
        // state owner (cwd, commits, ignore-whitespace/context-lines state).
        const listPanel = GitHistoryPanel.currentPanel;
        if (listPanel) {
          await handleMessage(message, listPanel, listPanel.getSettingsService(), listPanel.getFirstRunTipService());
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => {
      this._disposed = true;
      GitHistoryDiffPanel.instance = undefined;
      this._disposeDisposables();
    }, null, this._disposables);

    GitHistoryDiffPanel.instance = this;
  }

  public postMessage(message: ExtToWebviewMessage): void {
    if (this._disposed) {
      return;
    }
    if (!this._webviewReady) {
      this._pendingMessages.push(message);
      return;
    }
    void this._panel.webview.postMessage(message);
  }

  /**
   * Record the commit whose diff is shown and update the tab title.
   */
  public setCommit(hash: string, shortHash: string, subject: string): void {
    this._currentHash = hash;
    this._panel.title = GitHistoryDiffPanel.formatCommitTitle(shortHash, subject);
  }

  public setCurrentHash(hash: string): void {
    this._currentHash = hash;
  }

  public getCurrentHash(): string | undefined {
    return this._currentHash;
  }

  public setTitleForRange(fromShort: string, toShort: string): void {
    this._panel.title = `${fromShort}..${toShort}`;
  }

  public setTitleForCombined(commitCount: number): void {
    this._panel.title = `${commitCount} commits`;
  }

  private _sendDiffSettings(): void {
    const defaultDiffView = vscode.workspace.getConfiguration('gitHistory').get<string>('defaultDiffView', 'unified');
    // The diff surface only consumes the diff-relevant init fields
    // (userSettings + defaultDiffView); commits/filePath stay empty.
    this.postMessage({ type: 'init', commits: [], filePath: '', defaultDiffView, userSettings: this._settingsService.getSettings() });
  }

  private _flushPendingMessages(): void {
    const pending = this._pendingMessages;
    this._pendingMessages = [];
    for (const message of pending) {
      void this._panel.webview.postMessage(message);
    }
  }

  private _disposeDisposables(): void {
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    GitHistoryDiffPanel.instance = undefined;
    this._disposeDisposables();
    this._panel.dispose();
  }
}