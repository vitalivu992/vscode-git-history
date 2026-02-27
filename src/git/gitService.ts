import * as path from 'path';
import * as util from 'util';
import { execFile } from 'child_process';
import { CommitInfo, CommitFileChange, DiffResult } from '../types';
import { parseGitLog, parseNameStatus, isBinaryFile, parseLineHistoryLog } from './gitParser';

const execFileAsync = util.promisify(execFile);

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf899d69f82cf0163';
const MAX_COMMITS = 500;

/**
 * Execute a git command in a directory
 */
async function execGit(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large repos
    });
    return stdout;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Git error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get git history for a file
 */
export async function getFileHistory(filePath: string, cwd: string): Promise<CommitInfo[]> {
  const relativePath = path.relative(cwd, filePath);

  // Use %x00 as field separator for cleaner parsing
  const format = '%H%x00%an%x00%ae%x00%at%x00%s%x00%b%x00---COMMIT-END---%n';

  const args = [
    'log',
    '--follow',
    `--format=${format}`,
    '-n', MAX_COMMITS.toString(),
    '--',
    relativePath
  ];

  const output = await execGit(args, cwd);
  return parseGitLog(output);
}

/**
 * Get git history for a line selection using git log -L
 */
export async function getSelectionHistory(
  filePath: string,
  startLine: number,
  endLine: number,
  cwd: string
): Promise<CommitInfo[]> {
  const relativePath = path.relative(cwd, filePath);

  const args = [
    'log',
    `-L${startLine},${endLine}:${relativePath}`,
    '--format=%H %an <%ae> %at %s'
  ];

  const output = await execGit(args, cwd);
  return parseLineHistoryLog(output);
}

/**
 * Get diff for a single commit
 */
export async function getCommitDiff(
  hash: string,
  cwd: string,
  filePath?: string
): Promise<DiffResult> {
  const args = ['show', '--patch', '--no-color'];

  if (filePath) {
    const relativePath = path.relative(cwd, filePath);
    args.push('--', relativePath);
  } else {
    args.push(hash);
  }

  const output = await execGit(args, cwd);

  // Remove the header lines (commit info, keep only the diff)
  const diffStart = output.indexOf('diff --git');
  const diff = diffStart >= 0 ? output.substring(diffStart) : output;

  return {
    diff,
    filePath,
    isBinary: isBinaryFile(output)
  };
}

/**
 * Get combined diff for multiple commits
 * Uses git diff earliest~1..latest to show all changes
 */
export async function getCombinedDiff(
  hashes: string[],
  cwd: string,
  filePath?: string
): Promise<DiffResult> {
  if (hashes.length === 0) {
    return { diff: '', filePath, isBinary: false };
  }

  if (hashes.length === 1) {
    return getCommitDiff(hashes[0], cwd, filePath);
  }

  // Sort hashes by date (oldest first)
  const sortedHashes = [...hashes].sort();
  const earliest = sortedHashes[0];
  const latest = sortedHashes[sortedHashes.length - 1];

  const args = ['diff', '--no-color', `${earliest}~1..${latest}`];

  if (filePath) {
    const relativePath = path.relative(cwd, filePath);
    args.push('--', relativePath);
  }

  try {
    const output = await execGit(args, cwd);

    return {
      diff: output,
      filePath,
      isBinary: isBinaryFile(output)
    };
  } catch (error) {
    // Fallback for initial commits: use empty tree
    const args2 = ['diff', '--no-color', `${EMPTY_TREE_HASH}..${latest}`];
    if (filePath) {
      const relativePath = path.relative(cwd, filePath);
      args2.push('--', relativePath);
    }

    const output = await execGit(args2, cwd);
    return {
      diff: output,
      filePath,
      isBinary: isBinaryFile(output)
    };
  }
}

/**
 * Get files changed in a commit
 */
export async function getCommitFiles(
  hash: string,
  cwd: string
): Promise<CommitFileChange[]> {
  const args = ['show', '--name-status', '--no-color', '--format=', hash];
  const output = await execGit(args, cwd);

  const changesMap = parseNameStatus(output);
  const changes: CommitFileChange[] = [];

  for (const [filePath, data] of changesMap.entries()) {
    changes.push({
      path: filePath,
      status: data.status as CommitFileChange['status'],
      previousPath: data.previousPath
    });
  }

  return changes;
}

/**
 * Get the git root directory for a file
 */
export async function getGitRoot(filePath: string): Promise<string> {
  const args = ['rev-parse', '--show-toplevel'];
  const { stdout } = await execFileAsync('git', args, {
    cwd: path.dirname(filePath)
  });
  return stdout.trim();
}
