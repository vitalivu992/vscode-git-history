import * as vscode from 'vscode';
import * as path from 'path';
import { GitHistoryPanel } from './webviewProvider';
import { getCommitDiff, getCombinedDiff, getCommitRangeDiff, getCommitFiles, getCommitPatch, getCommitParentDiff } from '../git/gitService';
import { ExtToWebviewMessage } from '../types';
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

    case 'quickCompare':
      await handleQuickCompare(message.hash, panel);
      break;

    case 'saveSettings':
      await handleSaveSettings(message.settings, settingsService);
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

async function handleRequestRangeDiff(
  fromHash: string,
  toHash: string,
  panel: GitHistoryPanel
): Promise<void> {
  try {
    const diffResult = await getCommitRangeDiff(fromHash, toHash, panel.getCwd());

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
    const diffResult = await getCommitDiff(hash, cwd);

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

    const diffResult = await getCommitParentDiff(hash, cwd);

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
