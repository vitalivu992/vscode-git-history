import * as vscode from 'vscode';
import * as path from 'path';
import { GitHistoryPanel } from './webviewProvider';
import { getCommitDiff, getCombinedDiff, getCommitFiles } from '../git/gitService';
import { ExtToWebviewMessage } from '../types';

/**
 * Handle messages from webview
 */
export async function handleMessage(
  message: unknown,
  panel: GitHistoryPanel
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

    case 'openFileAtCommit':
      await handleOpenFileAtCommit(message.hash, message.filePath, panel);
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
    const diffResult = await getCommitDiff(hash, panel.getCwd());

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
    const diffResult = await getCombinedDiff(hashes, panel.getCwd());

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
    const diffResult = await getCommitDiff(hash, cwd, filePath);

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
