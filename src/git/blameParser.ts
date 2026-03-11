import { BlameLineInfo } from '../types';

interface CommitMeta {
  author: string;
  authorEmail: string;
  authorTime: number;
  summary: string;
  filename: string;
}

/**
 * Parse output from `git blame --porcelain`
 */
export function parseBlameOutput(output: string): BlameLineInfo[] {
  if (!output || !output.trim()) {
    return [];
  }

  const lines = output.split('\n');
  const result: BlameLineInfo[] = [];
  const commitCache = new Map<string, CommitMeta>();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Match header line: <hash> <orig_line> <final_line> [<count>]
    const headerMatch = line.match(/^([0-9a-f]{40}) (\d+) (\d+)/);
    if (!headerMatch) {
      i++;
      continue;
    }

    const hash = headerMatch[1];
    const originalLineNumber = parseInt(headerMatch[2], 10);
    const lineNumber = parseInt(headerMatch[3], 10);
    i++;

    // Parse commit metadata (only present on first occurrence)
    const meta: Partial<CommitMeta> = {};

    while (i < lines.length && !lines[i].startsWith('\t')) {
      const metaLine = lines[i];
      if (metaLine.startsWith('author ') && !metaLine.startsWith('author-')) {
        meta.author = metaLine.substring(7);
      } else if (metaLine.startsWith('author-mail ')) {
        meta.authorEmail = metaLine.substring(12).replace(/[<>]/g, '');
      } else if (metaLine.startsWith('author-time ')) {
        meta.authorTime = parseInt(metaLine.substring(12), 10);
      } else if (metaLine.startsWith('summary ')) {
        meta.summary = metaLine.substring(8);
      } else if (metaLine.startsWith('filename ')) {
        meta.filename = metaLine.substring(9);
      }
      i++;
    }

    // Skip the tab-prefixed content line
    if (i < lines.length && lines[i].startsWith('\t')) {
      i++;
    }

    // Update cache if we got new metadata
    if (meta.author !== undefined) {
      commitCache.set(hash, {
        author: meta.author,
        authorEmail: meta.authorEmail || '',
        authorTime: meta.authorTime || 0,
        summary: meta.summary || '',
        filename: meta.filename || ''
      });
    }

    const cached = commitCache.get(hash);
    if (!cached) {
      continue;
    }

    // Handle uncommitted lines
    const isUncommitted = /^0+$/.test(hash);

    result.push({
      hash,
      shortHash: isUncommitted ? '0000000' : hash.substring(0, 7),
      author: isUncommitted ? 'Not Committed Yet' : cached.author,
      authorEmail: cached.authorEmail,
      authorTime: cached.authorTime,
      summary: isUncommitted ? 'Not Committed Yet' : cached.summary,
      lineNumber,
      originalLineNumber,
      filename: cached.filename
    });
  }

  return result;
}
