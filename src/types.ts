/**
 * Statistics for a single commit
 */
export interface CommitStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

/**
 * Represents a single git commit
 */
export interface CommitInfo {
  hash: string;
  shortHash: string;
  parentHashes: string[];
  author: string;
  email: string;
  date: string;
  message: string;
  fullMessage: string;
  tags?: string[];
  stats?: CommitStats;
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
 * Blame info for a single line
 */
export interface BlameLineInfo {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  authorTime: number;
  summary: string;
  lineNumber: number;
  originalLineNumber: number;
  filename: string;
}

/**
 * Blame result for a file
 */
export interface BlameResult {
  filePath: string;
  lines: BlameLineInfo[];
}

/**
 * Messages from extension to webview
 */
export type ExtToWebviewMessage =
  | { type: 'init'; commits: CommitInfo[]; filePath: string; showGraph: boolean; selection?: { startLine: number; endLine: number }; branch?: string; hideMergeCommits?: boolean }
  | { type: 'diff'; hash: string; diff: string; files: CommitFileChange[]; selectedFile?: string }
  | { type: 'combinedDiff'; hashes: string[]; diff: string }
  | { type: 'rangeDiff'; fromHash: string; toHash: string; diff: string }
  | { type: 'commitFiles'; hash: string; files: CommitFileChange[] }
  | { type: 'error'; message: string }
  | { type: 'selectCommit'; hash: string };

/**
 * Messages from webview to extension
 */
export type WebviewToExtMessage =
  | { type: 'ready' }
  | { type: 'requestDiff'; hash: string }
  | { type: 'requestCombinedDiff'; hashes: string[] }
  | { type: 'requestRangeDiff'; fromHash: string; toHash: string }
  | { type: 'requestCommitFiles'; hash: string }
  | { type: 'requestFileDiff'; hash: string; filePath: string }
  | { type: 'requestRefresh' }
  | { type: 'copyCommitMessage'; hash: string }
  | { type: 'copyCommitHash'; hash: string }
  | { type: 'copyCommitInfo'; hash: string }
  | { type: 'copyCherryPickCommand'; hash: string }
  | { type: 'copyRevertCommand'; hash: string }
    | { type: 'copyCommitFiles'; hash: string }
  | { type: 'copyCommitDiff'; hash: string }
  | { type: 'copyFilePath'; filePath: string }
  | { type: 'openFileAtCommit'; hash: string; filePath: string }
  | { type: 'copyCommitPatch'; hash: string };
