import { CommitInfo } from '../types';

const COMMIT_SEPARATOR = '---COMMIT-END---';

/**
 * Parse git log output with custom separator
 */
export function parseGitLog(output: string): CommitInfo[] {
  const commits: CommitInfo[] = [];
  const commitBlocks = output.split(COMMIT_SEPARATOR).filter(b => b.trim());

  for (const block of commitBlocks) {
    const commit = parseCommitBlock(block.trim());
    if (commit) {
      commits.push(commit);
    }
  }

  return commits;
}

/**
 * Parse a single commit block
 */
function parseCommitBlock(block: string): CommitInfo | null {
  const lines = block.split('\n');
  const commit: Partial<CommitInfo> = {};

  let currentLine = 0;

  // Parse hash line (first line)
  const hashMatch = lines[currentLine]?.match(/^([0-9a-f]{40})$/);
  if (hashMatch) {
    commit.hash = hashMatch[1];
    commit.shortHash = hashMatch[1].substring(0, 7);
    currentLine++;
  } else {
    return null;
  }

  // Parse author line
  const authorMatch = lines[currentLine]?.match(/^author (.*) <(.*)>$/);
  if (authorMatch) {
    commit.author = authorMatch[1];
    commit.email = authorMatch[2];
    currentLine++;
  }

  // Parse date line (Unix timestamp)
  const dateMatch = lines[currentLine]?.match(/^date (\d+)$/);
  if (dateMatch) {
    commit.date = new Date(parseInt(dateMatch[1]) * 1000).toISOString();
    currentLine++;
  }

  // Parse message lines
  const messageLines: string[] = [];
  while (currentLine < lines.length && lines[currentLine]) {
    const line = lines[currentLine];
    if (line.startsWith('msg ')) {
      messageLines.push(line.substring(4));
    } else if (line.startsWith('fullmsg ')) {
      if (!commit.message) {
        commit.message = messageLines.join('\n').trim();
      }
      commit.fullMessage = line.substring(9).trim();
    } else {
      messageLines.push(line);
    }
    currentLine++;
  }

  if (!commit.message && messageLines.length > 0) {
    commit.message = messageLines.join('\n').trim();
  }

  if (!commit.fullMessage) {
    commit.fullMessage = commit.message || '';
  }

  if (commit.hash && commit.author && commit.date && commit.message) {
    return commit as CommitInfo;
  }

  return null;
}

/**
 * Parse git show --name-status output
 */
export function parseNameStatus(output: string): Map<string, { status: string; previousPath?: string }> {
  const result = new Map();
  const lines = output.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const parts = line.split('\t');
    const status = parts[0];

    if (status === 'R' || status === 'C') {
      // Renamed or copied: R100\toldPath\tnewPath
      if (parts.length >= 3) {
        result.set(parts[2], { status, previousPath: parts[1] });
      }
    } else {
      // Added, Modified, Deleted: A/M/D\tpath
      if (parts.length >= 2) {
        result.set(parts[1], { status });
      }
    }
  }

  return result;
}

/**
 * Parse git log -L output (line history)
 * This is more complex as it includes inline diffs
 */
export function parseLineHistoryLog(output: string): CommitInfo[] {
  const commits: CommitInfo[] = [];
  const lines = output.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for commit header pattern: ^hash author date
    const hashMatch = line.match(/^([0-9a-f]{40})\s+(.*) <(.*)>\s+(\d+)\s+(.*)$/);
    if (hashMatch) {
      const commit: CommitInfo = {
        hash: hashMatch[1],
        shortHash: hashMatch[1].substring(0, 7),
        author: hashMatch[2],
        email: hashMatch[3],
        date: new Date(parseInt(hashMatch[4]) * 1000).toISOString(),
        message: hashMatch[5],
        fullMessage: hashMatch[5]
      };
      commits.push(commit);
    }

    i++;
  }

  return commits;
}

/**
 * Detect if a file is binary based on git output
 */
export function isBinaryFile(diff: string): boolean {
  return diff.includes('Binary files') || diff.includes('GIT binary patch');
}
