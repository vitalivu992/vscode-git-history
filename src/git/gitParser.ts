import { CommitInfo } from '../types';

const COMMIT_SEPARATOR = '---COMMIT-END---';

/**
 * Parse git log output with null-separated fields
 * Format: %H%x00%an%x00%ae%x00%at%x00%s%x00%b%x00---COMMIT-END---%n
 */
export function parseGitLog(output: string): CommitInfo[] {
  const commits: CommitInfo[] = [];

  // Trim the output and split by separator - each block is one commit
  // The git format ends with ---COMMIT-END---\n, so the last split will be empty
  const blocks = output.trim().split(COMMIT_SEPARATOR).filter(b => b.trim());

  for (const block of blocks) {
    const commit = parseCommitBlock(block.trim());
    if (commit) {
      commits.push(commit);
    }
  }

  return commits;
}

/**
 * Parse a single commit block with null-separated fields
 */
function parseCommitBlock(block: string): CommitInfo | null {
  // Split by null character to get fields
  const fields = block.split('\x00').map(f => f.trim()).filter(f => f);

  // Need at least: hash, author, email, date, message
  if (fields.length < 5) {
    return null;
  }

  const hash = fields[0];
  const author = fields[1];
  const email = fields[2];
  const dateStr = fields[3];
  const subject = fields[4];
  const body = fields[5] || '';

  // Validate hash format
  if (!/^[0-9a-f]{40}$/i.test(hash)) {
    return null;
  }

  const date = new Date(parseInt(dateStr) * 1000);
  if (isNaN(date.getTime())) {
    return null;
  }

  const fullMessage = body ? `${subject}\n\n${body}` : subject;

  return {
    hash,
    shortHash: hash.substring(0, 7),
    author,
    email,
    date: date.toISOString(),
    message: subject,
    fullMessage: fullMessage.trim()
  };
}

/**
 * Parse git show --name-status output
 * Format: A/M/D/R/C<optional_number>\tpath or R100\toldPath\tnewPath
 */
export function parseNameStatus(output: string): Map<string, { status: string; previousPath?: string }> {
  const result = new Map();
  const lines = output.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const parts = line.split('\t');
    const statusCode = parts[0];

    // Extract the base status (first character), ignoring numbers (e.g., R100 -> R)
    const baseStatus = statusCode?.charAt(0);

    if (!baseStatus) {
      continue;
    }

    if (baseStatus === 'R' || baseStatus === 'C') {
      // Renamed or copied: R100\toldPath\tnewPath
      if (parts.length >= 3) {
        result.set(parts[2], { status: baseStatus, previousPath: parts[1] });
      }
    } else {
      // Added, Modified, Deleted: A/M/D\tpath
      if (parts.length >= 2) {
        result.set(parts[1], { status: baseStatus });
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
