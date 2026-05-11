import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitHistoryPanel } from './webviewProvider';
import { getCommitDiff, getCombinedDiff, getCommitRangeDiff, getCommitFiles, getCommitPatch, getCommitParentDiff, getBranchCommitHashes, getCommitUrl, getRemoteUrl, parseRemoteUrl, createBranchFromCommit, createTagFromCommit } from '../git/gitService';
import { ExtToWebviewMessage, CommitInfo } from '../types';
import { SettingsService, UserSettings } from '../settings';

/**
 * Handle messages from webview
 */
export async function handleMessage(
  message: unknown,
  panel: GitHistoryPanel,
  settingsService: SettingsService
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

    case 'copyCommitMessage':
      handleCopyCommitMessage(message.hash, panel);
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

    case 'copyCommitFiles':
      handleCopyCommitFiles(message.hash, panel);
      break;

    case 'copyCommitDiff':
      await handleCopyCommitDiff(message.hash, panel);
      break;

    case 'copyCommitPatch':
      await handleCopyCommitPatch(message.hash, panel);
      break;

    case 'copyCommitUrl':
      await handleCopyCommitUrl(message.hash, panel);
      break;

    case 'copyCommitStats':
      await handleCopyCommitStats(message.hash, panel);
      break;

    case 'copyBranchName':
      handleCopyBranchName(panel);
      break;

    case 'copyTags':
      handleCopyTags(message.hash, panel);
      break;

    case 'copyAuthorEmail':
      handleCopyAuthorEmail(message.hash, panel);
      break;

    case 'copyAuthorName':
      handleCopyAuthorName(message.hash, panel);
      break;

    case 'copyParentHash':
      handleCopyParentHash(message.hash, panel);
      break;

    case 'copyShortHash':
      handleCopyShortHash(message.hash, panel);
      break;

    case 'copySubject':
      handleCopySubject(message.hash, panel);
      break;

    case 'copyCoAuthors':
      handleCopyCoAuthors(message.hash, panel);
      break;

    case 'copyCommitDate':
      handleCopyCommitDate(message.hash, panel);
      break;

    case 'copyOneline':
      handleCopyOneline(message.hash, panel);
      break;

    case 'copySelectedHashes':
      handleCopySelectedHashes(message.hashes, panel);
      break;

    case 'copyFilePath':
      handleCopyFilePath(message.filePath, panel);
      break;

    case 'openFileAtCommit':
      await handleOpenFileAtCommit(message.hash, message.filePath, panel);
      break;

    case 'quickCompare':
      await handleQuickCompare(message.hash, panel);
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

    case 'exportCommits':
      await handleExportCommits(message.format, message.commits, panel);
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

    panel.postMessage({
      type: 'diff',
      hash,
      diff: diffResult.diff,
      files
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
    panel.postMessage({
      type: 'diff',
      hash,
      diff: diffResult.diff,
      files,
      selectedFile: filePath
    });
  } catch (error) {
    panel.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

function handleCopyCommitMessage(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const messageText = commit.fullMessage || commit.message;
  const copyText = `${commit.author} <${commit.email}>\nDate: ${new Date(commit.date).toISOString()}\n\n${messageText}`;

  void vscode.env.clipboard.writeText(copyText).then(() => {
    void vscode.window.showInformationMessage('Commit message copied to clipboard');
  });
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

async function handleCopyCommitFiles(hash: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const files = await getCommitFiles(hash, cwd);

    const filesList = files.map(file => {
      if (file.previousPath && file.status === 'R') {
        return `${file.previousPath} -> ${file.path}`;
      }
      return file.path;
    }).join('\n');

    if (filesList) {
      await vscode.env.clipboard.writeText(filesList);
      void vscode.window.showInformationMessage(`Copied ${files.length} file(s) to clipboard`);
    } else {
      void vscode.window.showInformationMessage('No files to copy');
    }
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to copy files: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleCopyCommitDiff(hash: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const diffResult = await getCommitDiff(hash, cwd, undefined, panel.getIgnoreWhitespace(), panel.getDiffContextLines());

    if (diffResult.isBinary) {
      void vscode.window.showInformationMessage('Cannot copy diff for binary file');
      return;
    }

    if (diffResult.diff) {
      await vscode.env.clipboard.writeText(diffResult.diff);
      const shortHash = hash.substring(0, 7);
      void vscode.window.showInformationMessage(`Commit diff ${shortHash} copied to clipboard`);
    } else {
      void vscode.window.showInformationMessage('No diff to copy');
    }
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to copy diff: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function handleCopyFilePath(filePath: string, _panel: GitHistoryPanel): void {
  // Extract just the filename for the display message
  const fileName = path.basename(filePath);

  void vscode.env.clipboard.writeText(filePath).then(() => {
    void vscode.window.showInformationMessage(`Copied path: ${fileName}`);
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

async function handleCopyCommitPatch(hash: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const patch = await getCommitPatch(hash, cwd);

    if (patch) {
      await vscode.env.clipboard.writeText(patch);
      const shortHash = hash.substring(0, 7);
      void vscode.window.showInformationMessage(`Commit patch ${shortHash} copied to clipboard`);
    } else {
      void vscode.window.showInformationMessage('No patch to copy');
    }
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to copy patch: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleQuickCompare(hash: string, panel: GitHistoryPanel): Promise<void> {
  try {
    const cwd = panel.getCwd();
    const commit = panel.getCommits().find(c => c.hash === hash);

    if (!commit) {
      panel.postMessage({
        type: 'error',
        message: 'Commit not found'
      });
      return;
    }

    if (!commit.parentHashes || commit.parentHashes.length === 0) {
      panel.postMessage({
        type: 'error',
        message: 'Root commit has no parent to compare with'
      });
      return;
    }

    const diffResult = await getCommitParentDiff(hash, cwd, undefined, panel.getIgnoreWhitespace(), panel.getDiffContextLines());

    if (diffResult.isBinary) {
      panel.postMessage({
        type: 'diff',
        hash,
        diff: 'Binary file - cannot display diff',
        files: []
      });
      return;
    }

    const files = await getCommitFiles(hash, cwd);

    const parentShort = commit.parentHashes[0].substring(0, 7);
    const commitShort = hash.substring(0, 7);

    panel.postMessage({
      type: 'rangeDiff',
      fromHash: commit.parentHashes[0],
      toHash: hash,
      diff: diffResult.diff
    });

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
 * Format commits as JSON
 */
function formatCommitsAsJson(commits: CommitInfo[]): string {
  return JSON.stringify(commits, null, 2);
}

/**
 * Escape a field for CSV output
 */
function escapeCsvField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Format commits as CSV
 */
function formatCommitsAsCsv(commits: CommitInfo[]): string {
  const headers = ['Hash', 'Short Hash', 'Author', 'Email', 'Date', 'Message', 'Tags', 'Files Changed', 'Insertions', 'Deletions'];
  const lines = [headers.join(',')];

  for (const commit of commits) {
    const fields = [
      commit.hash,
      commit.shortHash,
      escapeCsvField(commit.author),
      commit.email,
      commit.date,
      escapeCsvField(commit.message),
      commit.tags ? commit.tags.join(';') : '',
      commit.stats?.filesChanged?.toString() || '0',
      commit.stats?.insertions?.toString() || '0',
      commit.stats?.deletions?.toString() || '0'
    ];
    lines.push(fields.join(','));
  }

  return lines.join('\n');
}

/**
 * Format commits as Markdown (changelog format)
 */
function formatCommitsAsMarkdown(commits: CommitInfo[]): string {
  const lines: string[] = [];

  for (const commit of commits) {
    const tags = commit.tags && commit.tags.length > 0
      ? ` ${commit.tags.map(t => `\`${t}\``).join(' ')}`
      : '';
    const stats = commit.stats
      ? ` (${commit.stats.filesChanged} file${commit.stats.filesChanged === 1 ? '' : 's'}, +${commit.stats.insertions}, -${commit.stats.deletions})`
      : '';

    lines.push(`### ${commit.shortHash}${stats}${tags}`);
    lines.push('');
    lines.push(`**Author:** ${commit.author} <${commit.email}>`);
    lines.push(`**Date:** ${commit.date}`);
    lines.push('');
    lines.push(commit.message);
    lines.push('');

    if (commit.fullMessage && commit.fullMessage !== commit.message) {
      lines.push('---');
      lines.push('');
      lines.push(commit.fullMessage.replace(commit.message, '').trim());
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Handle export commits to file
 */
async function handleExportCommits(
  format: 'json' | 'csv' | 'markdown',
  commits: CommitInfo[],
  panel: GitHistoryPanel
): Promise<void> {
  try {
    if (commits.length === 0) {
      void vscode.window.showInformationMessage('No commits to export');
      return;
    }

    const fileExtension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
    const defaultFileName = `git-history-export.${fileExtension}`;

    const filters = format === 'markdown'
      ? { 'Markdown': ['md'] }
      : { [format.toUpperCase()]: [fileExtension] };

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(panel.getCwd(), defaultFileName)),
      filters
    });

    if (!uri) {
      return; // User cancelled
    }

    const content = format === 'json'
      ? formatCommitsAsJson(commits)
      : format === 'csv'
      ? formatCommitsAsCsv(commits)
      : formatCommitsAsMarkdown(commits);

    await fs.promises.writeFile(uri.fsPath, content, 'utf-8');

    void vscode.window.showInformationMessage(
      `Exported ${commits.length} commit${commits.length !== 1 ? 's' : ''} to ${path.basename(uri.fsPath)}`
    );
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to export commits: ${error instanceof Error ? error.message : String(error)}`
    );
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
        'Unable to detect git platform. Supported: GitHub, GitLab, Bitbucket.'
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

/**
 * Handle copy commit stats to clipboard
 */
async function handleCopyCommitStats(hash: string, panel: GitHistoryPanel): Promise<void> {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  if (!commit.stats) {
    void vscode.window.showInformationMessage('No statistics available for this commit');
    return;
  }

  const { stats, shortHash, message } = commit;
  const netChange = stats.insertions - stats.deletions;
  const netSign = netChange >= 0 ? '+' : '';
  const filesWord = stats.filesChanged === 1 ? 'file' : 'files';

  const copyText = `Commit ${shortHash}: ${message}
${stats.filesChanged} ${filesWord} changed
Insertions: +${stats.insertions}
Deletions: -${stats.deletions}
Net: ${netSign}${netChange}`;

  await vscode.env.clipboard.writeText(copyText);
  void vscode.window.showInformationMessage(`Commit stats copied: ${stats.filesChanged} ${filesWord}, +${stats.insertions}, -${stats.deletions}`);
}

function handleCopyBranchName(panel: GitHistoryPanel): void {
  const branch = panel.getBranch();
  if (!branch) {
    void vscode.window.showInformationMessage('No branch detected');
    return;
  }

  void vscode.env.clipboard.writeText(branch).then(() => {
    void vscode.window.showInformationMessage(`Branch name copied: ${branch}`);
  });
}

function handleCopyTags(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const tags = commit.tags || [];
  const tagsText = tags.join(', ');

  void vscode.env.clipboard.writeText(tagsText).then(() => {
    const shortHash = hash.slice(0, 7);
    if (tags.length > 0) {
      void vscode.window.showInformationMessage(`Copied tags: ${tagsText}`);
    } else {
      void vscode.window.showInformationMessage(`No tags on commit ${shortHash}`);
    }
  });
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

function handleCopyParentHash(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  if (!commit.parentHashes || commit.parentHashes.length === 0) {
    void vscode.window.showInformationMessage('Root commit has no parent');
    return;
  }

  const parentHash = commit.parentHashes[0];
  const parentShort = parentHash.substring(0, 7);
  void vscode.env.clipboard.writeText(parentHash).then(() => {
    void vscode.window.showInformationMessage(`Parent hash copied: ${parentShort}`);
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

function handleCopyCoAuthors(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const coAuthors = extractCoAuthors(commit.fullMessage);

  if (coAuthors.length === 0) {
    void vscode.window.showInformationMessage('No co-authors on commit');
    return;
  }

  const coAuthorsText = coAuthors.join('\n');
  void vscode.env.clipboard.writeText(coAuthorsText).then(() => {
    void vscode.window.showInformationMessage(`Copied ${coAuthors.length} co-author${coAuthors.length > 1 ? 's' : ''}`);
  });
}

/**
 * Extract co-authors from commit message body.
 * Looks for "Co-authored-by:" trailers in the format:
 * Co-authored-by: Name <email@example.com>
 */
function extractCoAuthors(fullMessage: string): string[] {
  const coAuthors: string[] = [];
  const lines = fullMessage.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*Co-authored-by:\s*(.+?)\s*<([^>]+)>/i);
    if (match) {
      const name = match[1].trim();
      const email = match[2];
      coAuthors.push(`${name} <${email}>`);
    }
  }

  return coAuthors;
}

function handleCopyCommitDate(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const dateStr = new Date(commit.date).toISOString();
  void vscode.env.clipboard.writeText(dateStr).then(() => {
    void vscode.window.showInformationMessage(`Copied date: ${dateStr}`);
  });
}

function handleCopyOneline(hash: string, panel: GitHistoryPanel): void {
  const commit = panel.getCommits().find(c => c.hash === hash);
  if (!commit) {
    void vscode.window.showInformationMessage('Commit not found');
    return;
  }

  const oneline = `${commit.shortHash} ${commit.message}`;
  void vscode.env.clipboard.writeText(oneline).then(() => {
    const shortMsg = commit.message.length > 50
      ? commit.message.substring(0, 47) + '...'
      : commit.message;
    void vscode.window.showInformationMessage(`Copied: ${commit.shortHash} ${shortMsg}`);
  });
}

/**
 * Handle copy selected hashes to clipboard
 */
function handleCopySelectedHashes(hashes: string[], panel: GitHistoryPanel): void {
  if (hashes.length === 0) {
    void vscode.window.showInformationMessage('No commits selected');
    return;
  }

  const hashText = hashes.join('\n');
  void vscode.env.clipboard.writeText(hashText).then(() => {
    void vscode.window.showInformationMessage(`Copied ${hashes.length} commit hash${hashes.length > 1 ? 'es' : ''}`);
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
