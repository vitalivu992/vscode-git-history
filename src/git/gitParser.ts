import { CommitInfo } from '../types';

const COMMIT_SEPARATOR = '---COMMIT-END---';

/**
 * Parse git log output with null-separated fields
 * Format: %H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%d%x00---COMMIT-END---%n
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
  // Split by null character to get fields (keep empty strings for optional fields like parentHashes)
  const fields = block.split('\x00').map(f => f.trim());

  // Need at least: hash, parentHashes, author, email, date, message
  if (fields.length < 6) {
    return null;
  }

  const hash = fields[0];
  const parentHashes = fields[1] ? fields[1].split(' ').filter(Boolean) : [];
  const author = fields[2];
  const email = fields[3];
  const dateStr = fields[4];
  const subject = fields[5];
  const body = fields[6] || '';
  const decorations = fields[7] || '';
  const tags = parseTagsFromDecorations(decorations);

  // Validate hash format
  if (!/^[0-9a-f]{40}$/i.test(hash)) {
    return null;
  }

  if (!author || !email || !dateStr) {
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
    parentHashes,
    author,
    email,
    date: date.toISOString(),
    message: subject,
    fullMessage: fullMessage.trim(),
    ...(tags.length > 0 ? { tags } : {})
  };
}

/**
 * Extract tag names from git %d decorations string
 * Example input: " (HEAD -> main, tag: v1.0.0, origin/main)"
 */
function parseTagsFromDecorations(decorations: string): string[] {
  const tags: string[] = [];
  const tagRegex = /tag:\s*([^,)]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(decorations)) !== null) {
    tags.push(match[1].trim());
  }
  return tags;
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
 * Format: %H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%d
 * Each commit header line contains null-separated fields; diff lines are skipped.
 */
export function parseLineHistoryLog(output: string): CommitInfo[] {
  const commits: CommitInfo[] = [];
  const seen = new Set<string>();
  const lines = output.split('\n');

  for (const line of lines) {
    const nullIdx = line.indexOf('\x00');
    if (nullIdx < 0) { continue; }

    const fields = line.split('\x00');
    const hash = fields[0];
    if (!/^[0-9a-f]{40}$/i.test(hash)) { continue; }
    if (seen.has(hash)) { continue; }
    seen.add(hash);

    const parentHashes = fields[1] ? fields[1].split(' ').filter(Boolean) : [];
    const author = fields[2] || '';
    const email = fields[3] || '';
    const dateStr = fields[4] || '';
    const subject = fields[5] || '';
    const decorations = fields[6] || '';
    const tags = parseTagsFromDecorations(decorations);
    const date = new Date(parseInt(dateStr) * 1000);
    if (!author || isNaN(date.getTime())) { continue; }

    commits.push({
      hash,
      shortHash: hash.substring(0, 7),
      parentHashes,
      author,
      email,
      date: date.toISOString(),
      message: subject,
      fullMessage: subject,
      ...(tags.length > 0 ? { tags } : {})
    });
  }

  return commits;
}

/**
 * Detect if a file is binary based on git output
 */
export function isBinaryFile(diff: string): boolean {
  return diff.includes('Binary files') || diff.includes('GIT binary patch');
}
