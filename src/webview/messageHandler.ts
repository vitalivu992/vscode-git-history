import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitHistoryPanel } from './webviewProvider';
import { getCommitDiff, getCombinedDiff, getCommitRangeDiff, getCommitFiles, getCommitStats, getBranchCommitHashes, getCommitUrl, getRemoteUrl, parseRemoteUrl, createBranchFromCommit, createTagFromCommit, deleteTagFromCommit, deleteBranch, renameBranch, checkoutBranch, cherryPickCommit, revertCommit, restoreFileFromCommit, diffFileWithWorkingTree, searchInDiffs, resetToCommit } from '../git/gitService';
import { ExtToWebviewMessage, CommitInfo } from '../types';
import { SettingsService, UserSettings } from '../settings';
import { FirstRunTipService } from '../firstRunTip';

/**
 * Handle messages from webview
 */
export async function handleMessage(
  message: unknown,
  panel: GitHistoryPanel,
  settingsService: SettingsService,
  firstRunTipService: FirstRunTipService
): Promise<void> {
  if (!isValidMessage(message)) {
    console.error('Invalid message from webview:', message);
    return;
  }

  switch (message.type) {
    case 'ready':
      panel.onWebviewReady();
      break;

    case 'requestDiff':
      await handleRequestDiff(message.hash, panel);
      break;

    case 'requestCombinedDiff':
      await handleRequestCombinedDiff(message.hashes, panel);
      break;

    case 'requestRangeDiff':
      await handleRequestRangeDiff(message.fromHash, message.toHash, panel);
      break;

    case 'requestCommitFiles':
      await handleRequestCommitFiles(message.hash, panel);
      break;

    case 'requestFileDiff':
      await handleRequestFileDiff(message.hash, message.filePath, panel);
      break;

    case 'requestRefresh':
      await panel.loadData();
      break;

    case 'copyCommitHash':
      handleCopyCommitHash(message.hash, panel);
      break;

    case 'copyCommitInfo':
      handleCopyCommitInfo(message.hash, panel);
      break;

    case 'copyCherryPickCommand':
      handleCopyCherryPickCommand(message.hash, panel);
      break;

    case 'copyRevertCommand':
      handleCopyRevertCommand(message.hash, panel);
      break;

    case 'copyCommitUrl':
      await handleCopyCommitUrl(message.hash, panel);
      break;

    case 'copyAuthorEmail':
      handleCopyAuthorEmail(message.hash, panel);
      break;

    case 'copyAuthorName':
      handleCopyAuthorName(message.hash, panel);
      break;

    case 'copyShortHash':
      handleCopyShortHash(message.hash, panel);
      break;

    case 'copySubject':
      handleCopySubject(message.hash, panel);
      break;

    case 'openFileAtCommit':
      await handleOpenFileAtCommit(message.hash, message.filePath, panel);
      break;

    case 'restoreFileFromCommit':
      await handleRestoreFileFromCommit(message.hash, message.filePath, panel);
      break;

    case 'compareFileWithWorkingTree':
      await handleCompareFileWithWorkingTree(message.hash, message.filePath, panel);
      break;

    case 'copyFilePath':
      handleCopyFilePath(message.filePath, message.relative, panel);
      break;

    case 'revealInExplorer':
      await handleRevealInExplorer(message.filePath, panel);
      break;

    case 'blameFile':
      await handleBlameFile(message.filePath, panel);
      break;

    case 'resetToCommit':
      await handleResetToCommit(message.hash, message.mode, panel);
      break;

    case 'requestDiffSearch':
      await handleDiffSearch(message.query, message.commitHashes, panel);
      break;

    case 'saveSettings':
      await handleSaveSettings(message.settings, settingsService);
      break;

    case 'requestBranchHashes':
      await handleRequestBranchHashes(message.branches, panel);
      break;

    case 'createBranch':
      await handleCreateBranch(message.hash, panel);
      break;

    case 'createTag':
      await handleCreateTag(message.hash, panel);
      break;

    case 'deleteTag':
      await handleDeleteTag(message.hash, panel);
      break;

    case 'deleteBranch':
      await handleDeleteBranch(message.branch, panel, message.force);
      break;

    case 'renameBranch':
      await handleRenameBranch(message.branch, panel);
      break;

    case 'checkoutBranch':
      await handleCheckoutBranch(message.branch, panel);
      break;

    case 'cherryPickCommit':
      await handleCherryPickCommit(message.hash, panel);
      break;

    case 'revertCommit':
      await handleRevertCommit(message.hash, panel);
      break;

    case 'dismissFirstRunTip':
      await handleDismissFirstRunTip(firstRunTipService);
      break;

    case 'changeDiffContextLines':
      panel.setDiffContextLines(message.value);
      await settingsService.saveSettings({ diffContextLines: message.value });
      break;

    default:
      console.error('Unknown message type:', message);
  }
}

function isValidMessage(message: unknown): message is { type: string; [key: string]: any } {
  return typeof message === 'object' && message !== null && 'type' in message;
}

async function handleRequestDiff(hash: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const diffResult = await getCommitDiff(hash, panel.getCwd(), undefined, panel.getIgnoreWhitespace(), panel.getDiffContextLines());

    if (diffResult.isBinary) {
      panel.postMessage({
        type: 'diff',
        hash,
        diff: 'Binary file - cannot display diff',
        files: []
      });
      return;
    }

    const files = await getCommitFiles(hash, panel.getCwd());
    const stats = await getCommitStats(hash, panel.getCwd());

    panel.postMessage({
      type: 'diff',
      hash,
      diff: diffResult.diff,
      files,
      stats
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleRequestCombinedDiff(
  hashes: string[],
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const diffResult = await getCombinedDiff(hashes, panel.getCwd(), undefined, panel.getIgnoreWhitespace(), panel.getDiffContextLines());

    if (diffResult.isBinary) {
      panel.postMessage({
        type: 'combinedDiff',
        hashes,
        diff: 'Binary file - cannot display diff'
      });
      return;
    }

    panel.postMessage({
      type: 'combinedDiff',
      hashes,
      diff: diffResult.diff
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleRequestRangeDiff(
  fromHash: string,
  toHash: string,
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const diffResult = await getCommitRangeDiff(fromHash, toHash, panel.getCwd(), undefined, panel.getIgnoreWhitespace(), panel.getDiffContextLines());

    if (diffResult.isBinary) {
      panel.postMessage({
        type: 'rangeDiff',
        fromHash,
        toHash,
        diff: 'Binary file - cannot display diff'
      });
      return;
    }

    panel.postMessage({
      type: 'rangeDiff',
      fromHash,
      toHash,
      diff: diffResult.diff
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleRequestCommitFiles(
  hash: string,
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const files = await getCommitFiles(hash, panel.getCwd());
    panel.postMessage({
      type: 'commitFiles',
      hash,
      files
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleRequestFileDiff(
  hash: string,
  filePath: string,
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const diffResult = await getCommitDiff(hash, cwd, filePath, panel.getIgnoreWhitespace(), panel.getDiffContextLines());

    if (diffResult.isBinary) {
      const files = await getCommitFiles(hash, cwd);
      panel.postMessage({
        type: 'diff',
        hash,
        diff: 'Binary file - cannot display diff',
        files,
        selectedFile: filePath
      });
      return;
    }

    const files = await getCommitFiles(hash, cwd);
    const stats = await getCommitStats(hash, cwd);
    panel.postMessage({
      type: 'diff',
      hash,
      diff: diffResult.diff,
      files,
      selectedFile: filePath,
      stats
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

function handleCopyCommitHash(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  void vscode.env.clipboard.writeText(commit.hash).then(() => {
    void vscode.window.showInformationMessage(`Commit hash ${commit.shortHash} copied to clipboard`);
  });
}

function handleCopyCommitInfo(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const messageText = commit.fullMessage || commit.message;
  const dateStr = new Date(commit.date).toLocaleString();
  const copyText = `${commit.hash}\nAuthor: ${commit.author} <${commit.email}>\nDate: ${dateStr}\n\n${messageText}`;

  void vscode.env.clipboard.writeText(copyText).then(() => {
    void vscode.window.showInformationMessage('Commit info copied to clipboard');
  });
}

function handleCopyCherryPickCommand(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const cherryPickCommand = `git cherry-pick ${commit.hash}`;

  void vscode.env.clipboard.writeText(cherryPickCommand).then(() => {
    void vscode.window.showInformationMessage(`Cherry-pick command copied: ${commit.shortHash}`);
  });
}

function handleCopyRevertCommand(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const revertCommand = `git revert ${commit.hash}`;

  void vscode.env.clipboard.writeText(revertCommand).then(() => {
    void vscode.window.showInformationMessage(`Revert command copied: ${commit.shortHash}`);
  });
}






async function handleOpenFileAtCommit(
  hash: string,
  filePath: string,
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const relativePath = path.relative(cwd, filePath);

    const uri = vscode.Uri.from({
      scheme: 'git-history',
      path: `/${relativePath}`,
      query: `commit=${hash}&cwd=${encodeURIComponent(cwd)}`
    });

    await vscode.window.showTextDocument(uri, {
      preview: true,
      viewColumn: vscode.ViewColumn.One
    });
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to open file at commit: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle restore file from commit
 */
async function handleRestoreFileFromCommit(hash: string, filePath: string, panel: GitHistoryPanel): Promise<void> {
  const shortHash = hash.substring(0, 7);
  const fileName = filePath.split('/').pop() || filePath;
  const confirm = await vscode.window.showWarningMessage(
    `Restore "${fileName}" from commit ${shortHash}?\nThis will overwrite the file in your working tree.`,
    { modal: true },
    'Restore'
  );
  if (confirm !== 'Restore') { return; }
  try {
    await restoreFileFromCommit(filePath, hash, panel.getCwd());
    void vscode.window.showInformationMessage(`Restored "${fileName}" from ${shortHash}`);
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to restore file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle compare file at commit with working tree
 */
async function handleCompareFileWithWorkingTree(hash: string, filePath: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const diffResult = await diffFileWithWorkingTree(hash, filePath, panel.getCwd(), panel.getIgnoreWhitespace(), panel.getDiffContextLines());
    const files = await getCommitFiles(hash, panel.getCwd());
    if (diffResult.isBinary) {
      panel.postMessage({ type: 'diff', hash, diff: 'Binary file - cannot display diff', files, selectedFile: filePath });
    } else if (!diffResult.diff.trim()) {
      panel.postMessage({ type: 'diff', hash, diff: 'No changes — file is identical to this commit version', files, selectedFile: filePath });
    } else {
      const stats = await getCommitStats(hash, panel.getCwd());
      panel.postMessage({ type: 'diff', hash, diff: diffResult.diff, files, selectedFile: filePath, stats });
    }
  } catch (error) {
    panel.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Handle copy file path
 */
function handleCopyFilePath(filePath: string, relative: boolean, panel: GitHistoryPanel): void {
  const cwd = panel.getCwd();
  const fullPath = path.resolve(cwd, filePath);
  const toCopy = relative ? path.relative(cwd, fullPath) : fullPath;
  void vscode.env.clipboard.writeText(toCopy).then(() => {
    void vscode.window.showInformationMessage(`Copied: ${toCopy}`);
  });
}

/**
 * Handle reveal in file explorer
 */
async function handleRevealInExplorer(filePath: string, panel: GitHistoryPanel): Promise<void> {
  const cwd = panel.getCwd();
  const fullPath = path.resolve(cwd, filePath);
  const uri = vscode.Uri.file(fullPath);
  await vscode.commands.executeCommand('revealFileInOS', uri);
}

/**
 * Handle blame file — open the working-tree file in an editor and toggle
 * blame annotations for it
 */
async function handleBlameFile(filePath: string, panel: GitHistoryPanel): Promise<void> {
  const cwd = panel.getCwd();
  const fullPath = path.resolve(cwd, filePath);

  if (!fs.existsSync(fullPath)) {
    void vscode.window.showErrorMessage(
      `Cannot blame "${path.basename(fullPath)}": file does not exist in the working tree`
    );
    return;
  }

  try {
    await vscode.window.showTextDocument(vscode.Uri.file(fullPath), {
      preview: true,
      viewColumn: vscode.ViewColumn.One
    });
    await vscode.commands.executeCommand('gitHistory.toggleBlame');
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to blame file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}


async function handleRequestBranchHashes(
  branches: string[],
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const hashes = await getBranchCommitHashes(branches, cwd, panel.getFilePath());

    panel.postMessage({
      type: 'branchHashes',
      hashes
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleSaveSettings(
  settings: Partial<UserSettings>,
  settingsService: SettingsService
): Promise<void> {
  try {
    await settingsService.saveSettings(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}



/**
 * Handle copy commit URL to clipboard
 * Generates platform-specific URLs based on git remote
 */
async function handleCopyCommitUrl(hash: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const remoteUrl = await getRemoteUrl(cwd);

    if (!remoteUrl) {
      void vscode.window.showInformationMessage(
        'No git remote configured. Unable to generate commit URL.'
      );
      return;
    }

    const remoteInfo = parseRemoteUrl(remoteUrl);
    if (!remoteInfo || remoteInfo.platform === 'unknown') {
      void vscode.window.showInformationMessage(
        'Unable to detect git platform. Supported: GitHub, GitLab, Bitbucket, Azure DevOps.'
      );
      return;
    }

    const commitUrl = await getCommitUrl(hash, cwd);
    if (!commitUrl) {
      void vscode.window.showInformationMessage(
        'Failed to generate commit URL.'
      );
      return;
    }

    await vscode.env.clipboard.writeText(commitUrl);
    const shortHash = hash.substring(0, 7);
    void vscode.window.showInformationMessage(`Commit URL copied: ${shortHash}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to generate commit URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}


function handleCopyAuthorEmail(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  void vscode.env.clipboard.writeText(commit.email).then(() => {
    void vscode.window.showInformationMessage(`Author email copied: ${commit.email}`);
  });
}

function handleCopyAuthorName(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  void vscode.env.clipboard.writeText(commit.author).then(() => {
    void vscode.window.showInformationMessage(`Author name copied: ${commit.author}`);
  });
}

function handleCopyShortHash(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const shortHash = hash.substring(0, 7);
  void vscode.env.clipboard.writeText(shortHash).then(() => {
    void vscode.window.showInformationMessage(`Copied short hash: ${shortHash}`);
  });
}

function handleCopySubject(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const subject = commit.message;
  const truncatedSubject = subject.length > 50 ? subject.substring(0, 47) + '...' : subject;
  void vscode.env.clipboard.writeText(subject).then(() => {
    void vscode.window.showInformationMessage(`Copied subject: ${truncatedSubject}`);
  });
}


/**
 * Handle create branch from commit
 */
async function handleCreateBranch(hash: string, panel: GitHistoryPanel): Promise<void> {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const branchName = await vscode.window.showInputBox({
    prompt: 'Enter branch name',
    placeHolder: 'feature/my-new-branch',
    title: `Create branch at ${commit.shortHash}`
  });

  if (!branchName || branchName.trim() === '') {
    return; // User cancelled
  }

  try {
    await createBranchFromCommit(branchName.trim(), hash, panel.getCwd());
    void vscode.window.showInformationMessage(`Branch "${branchName.trim()}" created at commit ${commit.shortHash}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleCreateTag(hash: string, panel: GitHistoryPanel): Promise<void> {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const message = await vscode.window.showInputBox({
    prompt: 'Enter tag name (optional: add message for annotated tag)',
    placeHolder: 'v1.0.0',
    title: `Create tag at ${commit.shortHash}`
  });

  if (!message || message.trim() === '') {
    return; // User cancelled
  }

  const tagName = message.trim();

  // Check if user wants an annotated tag by asking for message in second prompt
  const annotate = await vscode.window.showInputBox({
    prompt: 'Enter tag message (leave empty for lightweight tag)',
    placeHolder: 'Release version 1.0.0',
    title: 'Tag message (optional)'
  });

  const tagMessage = annotate && annotate.trim() !== '' ? annotate.trim() : undefined;

  try {
    await createTagFromCommit(tagName, hash, panel.getCwd(), tagMessage);
    const tagType = tagMessage ? 'annotated' : 'lightweight';
    void vscode.window.showInformationMessage(`${tagType} tag "${tagName}" created at commit ${commit.shortHash}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to create tag: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleDeleteTag(hash: string, panel: GitHistoryPanel): Promise<void> {
  const commits = panel.getCommits();
  const commit = commits.find(c => c.hash === hash);

  if (!commit) {
    void vscode.window.showErrorMessage('Commit not found');
    return;
  }

  if (!commit.tags || commit.tags.length === 0) {
    void vscode.window.showErrorMessage('This commit has no tags');
    return;
  }

  const tags = commit.tags;

  if (tags.length === 1) {
    // Single tag - confirm and delete
    const tagName = tags[0];
    const confirm = await vscode.window.showInformationMessage(
      `Delete tag "${tagName}"?`,
      { modal: true },
      'Delete'
    );

    if (confirm !== 'Delete') {
      return;
    }

    try {
      await deleteTagFromCommit(tagName, panel.getCwd());
      void vscode.window.showInformationMessage(`Tag "${tagName}" deleted`);
      await panel.loadData();
    } catch (error) {
      void vscode.window.showErrorMessage(
        `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else {
    // Multiple tags - show QuickPick
    const selected = await vscode.window.showQuickPick(tags, {
      placeHolder: 'Select a tag to delete',
      title: 'Delete tag from commit'
    });

    if (!selected) {
      return;
    }

    try {
      await deleteTagFromCommit(selected, panel.getCwd());
      void vscode.window.showInformationMessage(`Tag "${selected}" deleted`);
      await panel.loadData();
    } catch (error) {
      void vscode.window.showErrorMessage(
        `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

async function handleDeleteBranch(branchName: string, panel: GitHistoryPanel, force: boolean = false): Promise<void> {
  const currentBranch = panel.getBranch();

  if (!currentBranch) {
    void vscode.window.showErrorMessage('No branch detected');
    return;
  }

  if (branchName === currentBranch) {
    void vscode.window.showErrorMessage('Cannot delete the current branch');
    return;
  }

  // Confirm deletion
  const confirm = await vscode.window.showInformationMessage(
    force ? `Force delete branch "${branchName}"?` : `Delete branch "${branchName}"?`,
    { modal: true },
    'Delete'
  );

  if (confirm !== 'Delete') {
    return;
  }

  try {
    await deleteBranch(branchName, panel.getCwd(), force);
    void vscode.window.showInformationMessage(`Branch "${branchName}" deleted`);
    await panel.loadData();
  } catch (error) {
    // Check if it's a "not fully merged" error - offer force delete
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!force && errorMessage.includes('not fully merged')) {
      const forceDelete = await vscode.window.showInformationMessage(
        `Branch "${branchName}" is not fully merged. Force delete?`,
        { modal: true },
        'Force Delete'
      );
      if (forceDelete === 'Force Delete') {
        await handleDeleteBranch(branchName, panel, true);
        return;
      }
    } else {
      void vscode.window.showErrorMessage(
        `Failed to delete branch: ${errorMessage}`
      );
    }
  }
}

/**
 * Handle rename branch — ask for the new name, then git branch -m
 */
async function handleRenameBranch(branchName: string, panel: GitHistoryPanel): Promise<void> {
  const newName = await vscode.window.showInputBox({
    prompt: 'Enter new branch name',
    value: branchName,
    title: `Rename branch "${branchName}"`
  });

  if (!newName || newName.trim() === '' || newName.trim() === branchName) {
    return; // User cancelled or name unchanged
  }

  try {
    await renameBranch(branchName, newName.trim(), panel.getCwd());
    void vscode.window.showInformationMessage(`Branch "${branchName}" renamed to "${newName.trim()}"`);
    await panel.loadData();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to rename branch: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleCheckoutBranch(branch: string, panel: GitHistoryPanel): Promise<void> {
  try {
    await checkoutBranch(branch, panel.getCwd());
    void vscode.window.showInformationMessage(`Switched to branch "${branch}"`);
    await panel.loadData();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to checkout branch: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle cherry-pick commit
 */
async function handleCherryPickCommit(hash: string, panel: GitHistoryPanel): Promise<void> {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Cherry-pick commit "${commit.shortHash}" (${commit.message})?`,
    { modal: true },
    'Cherry-pick'
  );

  if (confirm !== 'Cherry-pick') {
    return;
  }

  try {
    await cherryPickCommit(hash, panel.getCwd());
    void vscode.window.showInformationMessage(`Cherry-picked commit ${commit.shortHash}`);
    await panel.loadData();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to cherry-pick: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle revert commit
 */
async function handleRevertCommit(hash: string, panel: GitHistoryPanel): Promise<void> {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Revert commit "${commit.shortHash}" (${commit.message})?`,
    { modal: true },
    'Revert'
  );

  if (confirm !== 'Revert') {
    return;
  }

  try {
    await revertCommit(hash, panel.getCwd());
    void vscode.window.showInformationMessage(`Reverted commit ${commit.shortHash}`);
    await panel.loadData();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to revert: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle reset to commit
 */
async function handleResetToCommit(hash: string, mode: 'soft' | 'mixed' | 'hard', panel: GitHistoryPanel): Promise<void> {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const modeDescriptions: Record<string, string> = {
    soft: '--soft: Move HEAD, keep all changes staged',
    mixed: '--mixed (default): Move HEAD, unstage changes but keep them',
    hard: '--hard: Move HEAD, DISCARD all uncommitted changes'
  };

  const warning = mode === 'hard'
    ? `⚠️ HARD RESET will permanently discard all uncommitted changes!\n\nReset to ${commit.shortHash} (${commit.message})?`
    : `Reset to ${commit.shortHash} (${commit.message})?`;

  const confirm = await vscode.window.showWarningMessage(
    `${warning}\n\n${modeDescriptions[mode]}`,
    { modal: true },
    'Reset'
  );
  if (confirm !== 'Reset') { return; }

  try {
    await resetToCommit(hash, mode, panel.getCwd());
    void vscode.window.showInformationMessage(`Reset to ${commit.shortHash} (${mode})`);
    await panel.loadData();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to reset: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle diff search — search within commit diffs for a string
 */
async function handleDiffSearch(query: string, commitHashes: string[], panel: GitHistoryPanel): Promise<void> {
  try {
    const matchingHashes = await searchInDiffs(commitHashes, query, panel.getCwd());
    panel.postMessage({ type: 'diffSearchResults', query, matchingHashes });
  } catch (error) {
    panel.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Handle dismiss first-run tip
 */
async function handleDismissFirstRunTip(firstRunTipService: FirstRunTipService): Promise<void> {
  try {
    await firstRunTipService.markAsShown();
  } catch (error) {
    console.error('Failed to mark first-run tip as shown:', error);
  }
}

/**
 * Handle copy combined diff (multi-selected commits)
 */
