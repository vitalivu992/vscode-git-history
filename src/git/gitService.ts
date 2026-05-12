import * as path from 'path';
import * as util from 'util';
import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { CommitInfo, CommitFileChange, DiffResult, BlameLineInfo } from '../types';
import { parseGitLog, parseNameStatus, isBinaryFile, parseLineHistoryLog } from './gitParser';
import { parseBlameOutput } from './blameParser';
import { parseMultipleCommitStats } from './gitStatsParser';

const execFileAsync = util.promisify(execFile);

/**
 * Git remote information extracted from a remote URL
 */
interface GitRemoteInfo {
  platform: 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'unknown';
  baseUrl: string;
  owner: string;
  repo: string;
  project?: string; // Azure DevOps: project name
}

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
  const format = '%H%x00%P%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%s%x00%b%x00%d%x00%G?%x00%GS%x00---COMMIT-END---%n';

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
    '--format=%H%x00%P%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%s%x00%d%x00%G?%x00%GS'
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
  filePath?: string,
  ignoreWhitespace?: boolean,
  diffContextLines?: number
): Promise<DiffResult> {
  const args = ['show', '--patch', '--no-color'];

  if (ignoreWhitespace) {
    args.push('-w');
  }

  if (diffContextLines !== undefined && diffContextLines !== 3) {
    args.push(`-U${diffContextLines}`);
  }

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
  filePath?: string,
  ignoreWhitespace?: boolean,
  diffContextLines?: number
): Promise<DiffResult> {
  if (hashes.length === 0) {
    return { diff: '', filePath, isBinary: false };
  }

  if (hashes.length === 1) {
    return getCommitDiff(hashes[0], cwd, filePath, ignoreWhitespace, diffContextLines);
  }

  const sortedHashes = await sortHashesByDate(hashes, cwd);
  const earliest = sortedHashes[0];
  const latest = sortedHashes[sortedHashes.length - 1];

  const args = ['diff', '--no-color'];

  if (ignoreWhitespace) {
    args.push('-w');
  }

  if (diffContextLines !== undefined && diffContextLines !== 3) {
    args.push(`-U${diffContextLines}`);
  }

  args.push(`${earliest}~1..${latest}`);

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
    const args2 = ['diff', '--no-color'];

    if (ignoreWhitespace) {
      args2.push('-w');
    }

    if (diffContextLines !== undefined && diffContextLines !== 3) {
      args2.push(`-U${diffContextLines}`);
    }

    args2.push(`${EMPTY_TREE_HASH}..${latest}`);
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
 * Get the current git user from git config
 * Returns name and email from user.name and user.email config
 */
export async function getCurrentGitUser(cwd: string): Promise<{ name: string; email: string } | null> {
  try {
    const nameOutput = await execGit(['config', 'user.name'], cwd);
    const emailOutput = await execGit(['config', 'user.email'], cwd);
    const name = nameOutput.trim();
    const email = emailOutput.trim();

    if (name || email) {
      return { name, email };
    }
    return null;
  } catch {
    return null;
  }
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
 * Get all branch names for a git repository (local and remote)
 */
export async function getAllBranches(cwd: string): Promise<string[]> {
  try {
    const output = await execGit(['branch', '-a', '--format=%(refname:short)'], cwd);
    const branches = output
      .trim()
      .split('\n')
      .map(b => b.trim())
      .filter(Boolean)
      .filter(b => !b.startsWith('HEAD -> '));
    return [...new Set(branches)];
  } catch {
    return [];
  }
}

/**
 * Get commit hashes reachable from each branch for a specific file
 * Returns a map: branchName -> array of commit hashes
 */
export async function getBranchCommitHashes(
  branches: string[],
  cwd: string,
  filePath?: string
): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};

  for (const branch of branches) {
    try {
      const relativePath = filePath ? path.relative(cwd, filePath) : '';
      const args = ['log', '--format=%H', '-n', '2000', branch];
      if (relativePath) {
        args.push('--', relativePath);
      }

      const output = await execGit(args, cwd);
      const hashes = output.trim().split('\n').filter(Boolean);
      result[branch] = hashes;
    } catch {
      result[branch] = [];
    }
  }

  return result;
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
 * Get commit as git describe output
 * Returns the nearest tag, number of commits since that tag, and abbreviated hash
 * e.g., v1.2.3-45-gabcdef1
 */
export async function getCommitDescribe(
  hash: string,
  cwd: string
): Promise<string> {
  const output = await execGit(['describe', '--always', '--long', '--tags', hash], cwd);
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

/**
 * Export multiple commits as mbox format (RFC 822 patches)
 * Uses git format-patch to generate email-friendly output for git am
 */
export async function getCommitsAsMbox(
  fromHash: string,
  toHash: string,
  cwd: string
): Promise<string> {
  const args = ['format-patch', '--stdout', `${fromHash}^..${toHash}`];
  return execGit(args, cwd);
}

/**
 * Get diff between two specific commits (fromHash..toHash)
 * Shows all changes between two arbitrary commits
 */
export async function getCommitRangeDiff(
  fromHash: string,
  toHash: string,
  cwd: string,
  filePath?: string,
  ignoreWhitespace?: boolean,
  diffContextLines?: number
): Promise<DiffResult> {
  const args = ['diff', '--no-color'];

  if (ignoreWhitespace) {
    args.push('-w');
  }

  if (diffContextLines !== undefined && diffContextLines !== 3) {
    args.push(`-U${diffContextLines}`);
  }

  args.push(`${fromHash}..${toHash}`);

  if (filePath) {
    const relativePath = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath;
    args.push('--', relativePath);
  }

  const output = await execGit(args, cwd);

  return {
    diff: output,
    filePath,
    isBinary: isBinaryFile(output)
  };
}

/**
 * Get diff between a commit and its parent
 * Useful for quick compare to see what changed in a specific commit
 */
export async function getCommitParentDiff(
  hash: string,
  cwd: string,
  filePath?: string,
  ignoreWhitespace?: boolean,
  diffContextLines?: number
): Promise<DiffResult> {
  const args = ['diff', '--no-color'];

  if (ignoreWhitespace) {
    args.push('-w');
  }

  if (diffContextLines !== undefined && diffContextLines !== 3) {
    args.push(`-U${diffContextLines}`);
  }

  args.push(`${hash}~1..${hash}`);

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
  } catch {
    return {
      diff: '',
      filePath,
      isBinary: false
    };
  }
}

/**
 * Get the git remote URL for a repository
 * @param cwd Working directory
 * @param remote Remote name (default: 'origin')
 * @returns Remote URL or null if not found
 */
export async function getRemoteUrl(cwd: string, remote = 'origin'): Promise<string | null> {
  try {
    const output = await execGit(['remote', 'get-url', remote], cwd);
    return output.trim();
  } catch {
    return null;
  }
}

/**
 * Parse a git remote URL to extract platform, base URL, owner, and repo
 * Supports both SSH and HTTPS formats for GitHub, GitLab, and Bitbucket
 * @param remoteUrl The remote URL to parse
 * @returns Parsed remote info or null if unrecognized format
 */
export function parseRemoteUrl(remoteUrl: string): GitRemoteInfo | null {
  // Azure DevOps SSH format: git@ssh.dev.azure.com:v3/{org}/{project}/{repo}
  const azureSshPattern = /^git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/;
  let match = remoteUrl.match(azureSshPattern);
  if (match) {
    const [, owner, project, repo] = match;
    return { platform: 'azure', baseUrl: 'https://dev.azure.com', owner, project, repo };
  }

  // Azure DevOps HTTPS format: https://dev.azure.com/{org}/{project}/_git/{repo}
  const azureHttpsPattern = /^https?:\/\/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(azureHttpsPattern);
  if (match) {
    const [, owner, project, repo] = match;
    return { platform: 'azure', baseUrl: 'https://dev.azure.com', owner, project, repo };
  }

  // Azure DevOps legacy HTTPS format: https://{org}.visualstudio.com/{project}/_git/{repo}
  const azureLegacyPattern = /^https?:\/\/([^/]+)\.visualstudio\.com\/([^/]+)\/_git\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(azureLegacyPattern);
  if (match) {
    const [, owner, project, repo] = match;
    return { platform: 'azure', baseUrl: `https://${owner}.visualstudio.com`, owner, project, repo };
  }

  // Try general SSH format (git@host:owner/repo.git)
  const sshPattern = /^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(sshPattern);
  if (match) {
    const [, host, sshOwner, sshRepo] = match;
    const platform = detectPlatform(host);
    const baseUrl = `https://${host}`;
    return { platform, baseUrl, owner: sshOwner, repo: sshRepo };
  }

  // Try ssh:// URL format with optional port: ssh://git@host:port/owner/repo.git
  // Must be checked AFTER Azure-specific patterns but BEFORE SCP-like pattern
  const sshUrlPattern = /^ssh:\/\/(?:git@)?([^:/?]+)(?::(\d+))?\/([^/]+)\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(sshUrlPattern);
  if (match) {
    const [, host, port, sshOwner, sshRepo] = match;
    const platform = detectPlatform(host);
    // Port is intentionally excluded from baseUrl as git hosting platforms don't use custom ports for web URLs
    const baseUrl = `https://${host}`;
    return { platform, baseUrl, owner: sshOwner, repo: sshRepo };
  }

  // Try general HTTPS format (https://host/owner/repo.git)
  const httpsPattern = /^https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(httpsPattern);
  if (match) {
    const [, host, httpsOwner, httpsRepo] = match;
    const platform = detectPlatform(host);
    const baseUrl = `https://${host}`;
    return { platform, baseUrl, owner: httpsOwner, repo: httpsRepo };
  }

  return null;
}

/**
 * Detect the git platform based on hostname
 * @param hostname The hostname to check
 * @returns The detected platform
 */
function detectPlatform(hostname: string): 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'unknown' {
  const lowerHost = hostname.toLowerCase();

  if (lowerHost === 'github.com' || lowerHost.endsWith('.github.com')) {
    return 'github';
  }
  if (lowerHost === 'gitlab.com' || lowerHost.endsWith('.gitlab.com') || lowerHost.includes('gitlab')) {
    return 'gitlab';
  }
  if (lowerHost === 'bitbucket.org' || lowerHost.includes('bitbucket')) {
    return 'bitbucket';
  }
  if (lowerHost === 'dev.azure.com' || lowerHost === 'ssh.dev.azure.com' || lowerHost.endsWith('.visualstudio.com')) {
    return 'azure';
  }

  return 'unknown';
}

/**
 * Generate a web URL for a commit
 * Auto-detects the git remote and generates platform-specific URLs
 * @param hash The commit hash
 * @param cwd Working directory
 * @param remote Remote name (default: 'origin')
 * @returns Commit URL or null if unable to generate
 */
export async function getCommitUrl(
  hash: string,
  cwd: string,
  remote = 'origin'
): Promise<string | null> {
  const remoteUrl = await getRemoteUrl(cwd, remote);
  if (!remoteUrl) {
    return null;
  }

  const remoteInfo = parseRemoteUrl(remoteUrl);
  if (!remoteInfo || remoteInfo.platform === 'unknown') {
    return null;
  }

  // Use short hash for URLs (7 characters)
  const shortHash = hash.substring(0, 7);

  switch (remoteInfo.platform) {
    case 'github':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/commit/${shortHash}`;
    case 'gitlab':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/-/commit/${shortHash}`;
    case 'bitbucket':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/commits/${shortHash}`;
    case 'azure':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.project}/_git/${remoteInfo.repo}/commit/${shortHash}`;
    default:
      return null;
  }
}

/**
 * Generate a web URL for browsing a branch
 * Auto-detects the git remote and generates platform-specific branch URLs
 * @param branch The branch name
 * @param cwd Working directory
 * @param remote Remote name (default: 'origin')
 * @returns Branch URL or null if unable to generate
 */
export async function getBranchUrl(
  branch: string,
  cwd: string,
  remote = 'origin'
): Promise<string | null> {
  const remoteUrl = await getRemoteUrl(cwd, remote);
  if (!remoteUrl) {
    return null;
  }

  const remoteInfo = parseRemoteUrl(remoteUrl);
  if (!remoteInfo || remoteInfo.platform === 'unknown') {
    return null;
  }

  switch (remoteInfo.platform) {
    case 'github':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/tree/${branch}`;
    case 'gitlab':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/-/tree/${branch}`;
    case 'bitbucket':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/src/${branch}`;
    case 'azure':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.project}/_git/${remoteInfo.repo}?version=GB${branch}`;
    default:
      return null;
  }
}

/**
 * Create a new branch at a specific commit
 * @param branchName The name for the new branch
 * @param commitHash The commit hash to create the branch at
 * @param cwd Working directory
 */
export async function createBranchFromCommit(
  branchName: string,
  commitHash: string,
  cwd: string
): Promise<void> {
  await execGit(['branch', branchName, commitHash], cwd);
}

/**
 * Create a new tag at a specific commit
 * @param tagName The name for the new tag
 * @param commitHash The commit hash to create the tag at
 * @param cwd Working directory
 * @param message Optional message for annotated tags
 */
export async function createTagFromCommit(
  tagName: string,
  commitHash: string,
  cwd: string,
  message?: string
): Promise<void> {
  if (message) {
    await execGit(['tag', '-a', tagName, '-m', message, commitHash], cwd);
  } else {
    await execGit(['tag', tagName, commitHash], cwd);
  }
}

/**
 * Delete a tag from a commit
 * @param tagName The name of the tag to delete
 * @param cwd Working directory
 */
export async function deleteTagFromCommit(tagName: string, cwd: string): Promise<void> {
  await execGit(['tag', '-d', tagName], cwd);
}

/**
 * Delete a local branch
 * @param branchName The name of the branch to delete
 * @param cwd Working directory
 * @param force If true, use -D to force delete even if not fully merged
 */
export async function deleteBranch(branchName: string, cwd: string, force: boolean = false): Promise<void> {
  const args = force ? ['branch', '-D', branchName] : ['branch', '-d', branchName];
  await execGit(args, cwd);
}

/**
 * Checkout an existing branch
 * @param branchName The name of the branch to checkout
 * @param cwd Working directory
 */
export async function checkoutBranch(branchName: string, cwd: string): Promise<void> {
  await execGit(['checkout', branchName], cwd);
}

/**
 * Generate a web URL for browsing a file at a specific commit
 * Auto-detects the git remote and generates platform-specific file URLs
 * @param filePath The file path (absolute or relative to cwd)
 * @param hash The commit hash
 * @param cwd Working directory
 * @param remote Remote name (default: 'origin')
 * @returns File URL or null if unable to generate
 */
export async function getFileUrl(
  filePath: string,
  hash: string,
  cwd: string,
  remote = 'origin'
): Promise<string | null> {
  const remoteUrl = await getRemoteUrl(cwd, remote);
  if (!remoteUrl) {
    return null;
  }

  const remoteInfo = parseRemoteUrl(remoteUrl);
  if (!remoteInfo || remoteInfo.platform === 'unknown') {
    return null;
  }

  const shortHash = hash.substring(0, 7);
  // Ensure path starts with / and remove leading ./
  const normalizedPath = filePath.startsWith('./') ? filePath.slice(2) : filePath;

  switch (remoteInfo.platform) {
    case 'github':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/blob/${shortHash}/${normalizedPath}`;
    case 'gitlab':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/-/blob/${shortHash}/${normalizedPath}`;
    case 'bitbucket':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.repo}/src/${shortHash}/${normalizedPath}`;
    case 'azure':
      return `${remoteInfo.baseUrl}/${remoteInfo.owner}/${remoteInfo.project}/_git/${remoteInfo.repo}?path=%2F${encodeURIComponent(normalizedPath)}&version=${shortHash}`;
    default:
      return null;
  }
}
