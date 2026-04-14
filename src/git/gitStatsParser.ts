/**
 * Parse commit statistics from git log --stat output
 * Git stat format: "X files changed, Y insertions(+), Z deletions(-)"
 * Or variations like: "1 file changed, 5 insertions(+)"
 * Or: "2 files changed, 1 insertion(+), 3 deletions(-)"
 * Or for binary files: "1 file changed, 0 insertions(+), 0 deletions(-)"
 * Or for merge commits: may have no stats line
 */
export interface ParsedStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

/**
 * Parse a single stat line from git output
 * @param statLine - The stat line (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)")
 * @returns ParsedStats object with filesChanged, insertions, deletions
 */
export function parseCommitStats(statLine: string): ParsedStats {
  const result: ParsedStats = {
    filesChanged: 0,
    insertions: 0,
    deletions: 0
  };

  if (!statLine || statLine.trim() === '') {
    return result;
  }

  // Match files changed: handles "file" or "files"
  const filesMatch = statLine.match(/(\d+)\s+file[s]?\s+changed/);
  if (filesMatch) {
    result.filesChanged = parseInt(filesMatch[1], 10);
  }

  // Match insertions: handles "insertion" or "insertions"
  const insertionsMatch = statLine.match(/(\d+)\s+insertion[s]?\s*\(\+\)/);
  if (insertionsMatch) {
    result.insertions = parseInt(insertionsMatch[1], 10);
  }

  // Match deletions: handles "deletion" or "deletions"
  const deletionsMatch = statLine.match(/(\d+)\s+deletion[s]?\s*\(-\)/);
  if (deletionsMatch) {
    result.deletions = parseInt(deletionsMatch[1], 10);
  }

  return result;
}

/**
 * Extract stats from the end of a git log entry that includes --stat output
 * The stats line is typically the last line before the separator or end
 * @param output - The git log output block for a single commit
 * @returns ParsedStats object
 */
export function extractStatsFromCommitBlock(output: string): ParsedStats {
  if (!output || output.trim() === '') {
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  }

  // Split by lines and find the stats line (contains "files changed")
  const lines = output.split('\n');

  // Look for the stats line (usually the last non-empty line with "changed")
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.includes('file') && line.includes('changed')) {
      return parseCommitStats(line);
    }
  }

  return { filesChanged: 0, insertions: 0, deletions: 0 };
}

/**
 * Parse multiple stat blocks from combined git log --stat output
 * @param output - Full git log --stat output with multiple commits
 * @returns Array of ParsedStats corresponding to commits in order
 */
export function parseMultipleCommitStats(output: string): ParsedStats[] {
  if (!output || output.trim() === '') {
    return [];
  }

  const results: ParsedStats[] = [];

  // Split output by commit separators if present, otherwise treat as single commit
  // Common separator patterns in git log format: "---COMMIT-END---" or blank lines
  const commitBlocks = output.split('---COMMIT-END---');

  for (const block of commitBlocks) {
    const trimmedBlock = block.trim();
    if (trimmedBlock) {
      results.push(extractStatsFromCommitBlock(trimmedBlock));
    }
  }

  return results;
}
