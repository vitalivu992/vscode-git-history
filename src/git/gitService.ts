import * as path from 'path';
import * as util from 'util';
import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { CommitInfo, CommitFileChange, DiffResult, BlameLineInfo } from '../types';
import { parseGitLog, parseNameStatus, isBinaryFile, parseLineHistoryLog } from './gitParser';
import { parseBlameOutput } from './blameParser';
import { parseMultipleCommitStats } from './gitStatsParser';

const execFileAsync = util.promisify(execFile);

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf899d69f82cf0163';

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
  const maxCommits = vscode.workspace.getConfiguration('gitHistory').get<number>('maxCommits', 500);

  // Use %x00 as field separator for cleaner parsing
  const format = '%H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%d%x00---COMMIT-END---%n';

  const args = [
    'log',
    '--follow',
    `--format=${format}`,
    '--stat',  // Include stats for files changed, insertions, deletions
    '-n', maxCommits.toString(),
    '--',
    relativePath
  ];

  const output = await execGit(args, cwd);
  const commits = parseGitLog(output);

  // Parse stats from the same output and merge with commits
  const stats = parseMultipleCommitStats(output);
  commits.forEach((commit, index) => {
    if (stats[index]) {
      commit.stats = {
        filesChanged: stats[index].filesChanged,
        insertions: stats[index].insertions,
        deletions: stats[index].deletions
      };
    }
  });

  return commits;
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
    '--format=%H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%d'
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

  args.push(hash);
  if (filePath) {
    const relativePath = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath;
    args.push('--', relativePath);
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

async function sortHashesByDate(hashes: string[], cwd: string): Promise<string[]> {
  if (hashes.length <= 1) return [...hashes];
  try {
    const output = await execGit(
      ['log', '--format=%H %at', '--no-walk', ...hashes],
      cwd
    );
    const entries = output.trim().split('\n').filter(Boolean).map(line => {
      const spaceIdx = line.indexOf(' ');
      return {
        hash: line.substring(0, spaceIdx),
        timestamp: parseInt(line.substring(spaceIdx + 1), 10)
      };
    });
    entries.sort((a, b) => a.timestamp - b.timestamp);
    return entries.map(e => e.hash);
  } catch {
    return [...hashes].sort();
  }
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

  const sortedHashes = await sortHashesByDate(hashes, cwd);
  const earliest = sortedHashes[0];
  const latest = sortedHashes[sortedHashes.length - 1];

  const args = ['diff', '--no-color', `${earliest}~1..${latest}`];

  if (filePath) {
    const relativePath = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath;
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
      const relativePath = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath;
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
 * Get blame information for a file
 */
export async function getFileBlame(filePath: string, cwd: string): Promise<BlameLineInfo[]> {
  const relativePath = path.relative(cwd, filePath);
  const output = await execGit(['blame', '--porcelain', '--', relativePath], cwd);
  return parseBlameOutput(output);
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

/**
 * Get the current branch name for a git repository
 */
export async function getCurrentBranch(cwd: string): Promise<string> {
  try {
    const output = await execGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
    return output.trim();
  } catch (error) {
    // If HEAD is detached or other error, return a default indicator
    return 'HEAD';
  }
}

/**
 * Get file content at a specific commit
 */
export async function getFileContentAtCommit(
  filePath: string,
  commitHash: string,
  cwd: string
): Promise<string> {
  const relativePath = path.relative(cwd, filePath);
  const output = await execGit(['show', `${commitHash}:${relativePath}`], cwd);
  return output;
}

/**
 * Get commit as a patch (format-patch output)
 * Returns a unified diff with git headers suitable for git apply or git am
 */
export async function getCommitPatch(
  hash: string,
  cwd: string
): Promise<string> {
  const output = await execGit(['format-patch', '-1', '--stdout', hash], cwd);
  return output;
}
