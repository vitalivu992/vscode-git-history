import * as vscode from 'vscode';
import { GitHistoryPanel, GitHistoryDiffPanel } from './webview/webviewProvider';
import { getGitRoot } from './git/gitService';
import { BlameService } from './blame/blameService';
import { GitHistoryContentProvider } from './gitHistoryContentProvider';
import { SettingsService } from './settings';
import { FirstRunTipService } from './firstRunTip';
import { setBlameVisibleContext } from './contextKeys';

/**
 * Resolve the editor a blame command should act on. Editor and line-number
 * context menus pass the document URI as the first argument; the Command
 * Palette and status bar pass nothing. When a URI is supplied it must match a
 * visible editor: falling back to the active editor could pair one file's
 * commit hash with a different file.
 */
function resolveBlameEditor(uriArg: unknown): vscode.TextEditor | undefined {
  const uriString =
    uriArg instanceof vscode.Uri
      ? uriArg.toString()
      : typeof uriArg === 'string'
        ? uriArg
        : undefined;

  if (uriString) {
    return vscode.window.visibleTextEditors.find(
      e => e.document.uri.toString() === uriString
    );
  }

  return vscode.window.activeTextEditor;
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize settings service
  const settingsService = new SettingsService(context.globalState);
  const firstRunTipService = new FirstRunTipService(context.globalState);

  const blameService = new BlameService();
  context.subscriptions.push(blameService);
  setBlameVisibleContext(false);

  // Create and register the Git History webview view provider
  const gitHistoryPanel = new GitHistoryPanel(context.extensionUri, settingsService, firstRunTipService, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(GitHistoryPanel.viewType, gitHistoryPanel, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
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
        await GitHistoryPanel.createOrShow(context.extensionUri, filePath, cwd, settingsService, firstRunTipService, context);
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
          settingsService,
          firstRunTipService,
          context,
          { startLine, endLine }
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open git history: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  const showRepositoryHistoryCommand = vscode.commands.registerCommand(
    'gitHistory.showRepositoryHistory',
    async () => {
      let cwd: string;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        try {
          cwd = await getGitRoot(activeEditor.document.uri.fsPath);
        } catch {
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
          }
          cwd = workspaceFolders[0].uri.fsPath;
        }
      } else if (workspaceFolders && workspaceFolders.length > 0) {
        cwd = workspaceFolders[0].uri.fsPath;
      } else {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      await GitHistoryPanel.createOrShow(context.extensionUri, '', cwd, settingsService, firstRunTipService, context);
    }
  );

  const toggleBlameCommand = vscode.commands.registerCommand(
    'gitHistory.toggleBlame',
    async (_uri?: unknown, _lineNumber?: unknown) => {
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

  const showBlameCommand = vscode.commands.registerCommand(
    'gitHistory.showBlame',
    async (uri?: unknown) => {
      const editor = resolveBlameEditor(uri);
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }
      try {
        await blameService.showBlame(editor);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to show blame: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  const hideBlameCommand = vscode.commands.registerCommand(
    'gitHistory.hideBlame',
    (uri?: unknown) => {
      const editor = resolveBlameEditor(uri);
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }
      blameService.hideBlame(editor);
    }
  );

  const showBlameCommitCommand = vscode.commands.registerCommand(
    'gitHistory.showBlameCommit',
    async (uriArg?: unknown, hashArg?: unknown) => {
      const editor = resolveBlameEditor(uriArg);
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      let hash = typeof hashArg === 'string' && hashArg ? hashArg : undefined;
      if (!hash) {
        const bl = blameService.getBlameForLine(
          editor.document.uri,
          editor.selection.active.line
        );
        hash = bl?.hash;
      }

      if (!hash || /^0+$/.test(hash)) {
        vscode.window.showInformationMessage('No committed blame info for this line');
        return;
      }

      try {
        const filePath = editor.document.uri.fsPath;
        const cwd = await getGitRoot(filePath);
        await GitHistoryPanel.showCommitDiff(context.extensionUri, filePath, cwd, settingsService, firstRunTipService, context, hash);
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
    showRepositoryHistoryCommand,
    toggleBlameCommand,
    showBlameCommand,
    hideBlameCommand,
    showBlameCommitCommand,
    vscode.workspace.registerTextDocumentContentProvider(
      GitHistoryContentProvider.scheme,
      new GitHistoryContentProvider()
    )
  );

  // Register webview action commands for keybinding discoverability
  const webviewActions = [
    { command: 'gitHistory.refresh', action: 'refresh' },
    { command: 'gitHistory.copyCommitHash', action: 'copyCommitHash' },
    { command: 'gitHistory.copyCommitInfo', action: 'copyCommitInfo' },
    { command: 'gitHistory.copyCherryPick', action: 'copyCherryPick' },
    { command: 'gitHistory.copyRevert', action: 'copyRevert' },
    { command: 'gitHistory.copyCommitUrl', action: 'copyCommitUrl' },
    { command: 'gitHistory.openCommitUrl', action: 'openCommitUrl' },
    { command: 'gitHistory.copyAuthorEmail', action: 'copyAuthorEmail' },
    { command: 'gitHistory.copyAuthorName', action: 'copyAuthorName' },
    { command: 'gitHistory.copyShortHash', action: 'copyShortHash' },
    { command: 'gitHistory.copySubject', action: 'copySubject' },
    { command: 'gitHistory.copyShortDate', action: 'copyShortDate' },
    { command: 'gitHistory.copyTrailers', action: 'copyTrailers' },
    { command: 'gitHistory.copyRangeDiff', action: 'copyRangeDiff' },
    { command: 'gitHistory.compareWithParent', action: 'compareWithParent' },
    { command: 'gitHistory.createBranch', action: 'createBranch' },
    { command: 'gitHistory.createTag', action: 'createTag' },
    { command: 'gitHistory.deleteTag', action: 'deleteTag' },
    { command: 'gitHistory.deleteBranch', action: 'deleteBranch' },
    { command: 'gitHistory.checkoutBranch', action: 'checkoutBranch' },
    { command: 'gitHistory.renameBranch', action: 'renameBranch' },
    { command: 'gitHistory.cherryPickCommit', action: 'cherryPickCommit' },
    { command: 'gitHistory.revertCommit', action: 'revertCommit' },
    { command: 'gitHistory.toggleMyCommits', action: 'toggleMyCommits' },
    { command: 'gitHistory.toggleWordWrap', action: 'toggleWordWrap' },
    { command: 'gitHistory.toggleRegex', action: 'toggleRegex' },
    { command: 'gitHistory.toggleIgnoreWhitespace', action: 'toggleIgnoreWhitespace' },
    { command: 'gitHistory.toggleHideMergeCommits', action: 'toggleHideMergeCommits' },
    { command: 'gitHistory.jumpToHash', action: 'jumpToHash' },
    { command: 'gitHistory.jumpToNextTag', action: 'jumpToNextTag' },
    { command: 'gitHistory.jumpToPreviousTag', action: 'jumpToPreviousTag' },
    { command: 'gitHistory.jumpToParent', action: 'jumpToParent' },
    { command: 'gitHistory.focusSearch', action: 'focusSearch' },
    { command: 'gitHistory.focusCommitList', action: 'focusCommitList' },
    { command: 'gitHistory.showKeyboardHelp', action: 'showKeyboardHelp' },
    { command: 'gitHistory.cycleDiffContextLines', action: 'cycleDiffContextLines' },
    { command: 'gitHistory.cycleSortMode', action: 'cycleSortMode' },
    { command: 'gitHistory.clearAllFilters', action: 'clearAllFilters' },
  ] as const;

  // Diff-surface actions: routed to the editor-area diff panel when it is
  // open (the list panel has no diff viewer after the split). Refresh hits
  // both surfaces (list reload + diff re-request); the diff-view toggles fall
  // back to the list panel when no diff panel is open.
  const diffSurfaceActions = new Set(['toggleWordWrap', 'toggleIgnoreWhitespace', 'cycleDiffContextLines']);

  for (const { command, action } of webviewActions) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, () => {
        const diffPanel = GitHistoryDiffPanel.instance;
        if (diffPanel && (diffSurfaceActions.has(action) || action === 'refresh')) {
          diffPanel.postMessage({ type: 'triggerAction', action });
          if (diffSurfaceActions.has(action)) {
            return;
          }
        }
        GitHistoryPanel.currentPanel?.postMessage({ type: 'triggerAction', action });
      })
    );
  }
}

export function deactivate() {
  GitHistoryPanel.currentPanel?.dispose();
  GitHistoryDiffPanel.instance?.dispose();
}
