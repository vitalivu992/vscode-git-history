/**
 * Represents a single git commit
 */
export interface CommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  fullMessage: string;
}

/**
 * Represents a file changed in a commit
 */
export interface CommitFileChange {
  path: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C';
  previousPath?: string; // For renamed files
}

/**
 * Diff result with metadata
 */
export interface DiffResult {
  diff: string;
  filePath?: string;
  isBinary: boolean;
}

/**
 * Messages from extension to webview
 */
export type ExtToWebviewMessage =
  | { type: 'init'; commits: CommitInfo[]; filePath: string }
  | { type: 'diff'; hash: string; diff: string; files: CommitFileChange[] }
  | { type: 'combinedDiff'; hashes: string[]; diff: string }
  | { type: 'commitFiles'; hash: string; files: CommitFileChange[] }
  | { type: 'error'; message: string };

/**
 * Messages from webview to extension
 */
export type WebviewToExtMessage =
  | { type: 'ready' }
  | { type: 'requestDiff'; hash: string }
  | { type: 'requestCombinedDiff'; hashes: string[] }
  | { type: 'requestCommitFiles'; hash: string };
