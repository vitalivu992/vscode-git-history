import { UserSettings } from './settings';

/**
 * GPG signature information for a commit
 */
export interface CommitSignature {
  /** Whether the signature is valid (verified) */
  verified: boolean;
  /** Name of the signer (key holder), null if unavailable */
  signer: string | null;
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
  committer?: string;
  committerEmail?: string;
  date: string;
  message: string;
  fullMessage: string;
  tags?: string[];
  signature?: CommitSignature | null;
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
 * Actions that can be triggered from VS Code keybindings
 */
export type WebviewAction =
  | 'refresh'
  | 'copyCommitHash'
  | 'copyCommitInfo'
  | 'copyCherryPick'
  | 'copyRevert'
  | 'copyCommitUrl'
  | 'copyAuthorEmail'
  | 'copyAuthorName'
  | 'copyShortHash'
  | 'copySubject'
  | 'createBranch'
  | 'createTag'
  | 'deleteTag'
  | 'deleteBranch'
  | 'renameBranch'
  | 'checkoutBranch'
  | 'cherryPickCommit'
  | 'revertCommit'
  | 'toggleMyCommits'
  | 'toggleWordWrap'
  | 'toggleRegex'
  | 'toggleIgnoreWhitespace'
  | 'toggleHideMergeCommits'
  | 'jumpToHash'
  | 'focusSearch'
  | 'showKeyboardHelp'
  | 'clearAllFilters'
  | 'toggleSignatures'
  | 'jumpToNextTag'
  | 'jumpToPreviousTag'
  | 'jumpToParent'
  | 'cycleDiffContextLines'
  | 'cycleSortMode'
  | 'focusCommitList';

/**
 * Messages from extension to webview
 */
export type ExtToWebviewMessage =
  | { type: 'init'; commits: CommitInfo[]; filePath: string; selection?: { startLine: number; endLine: number }; branch?: string; branches?: string[]; hideMergeCommits?: boolean; defaultDiffView?: string; commitListDateFormat?: string; userSettings?: UserSettings; currentUser?: { name: string; email: string } | null; showFirstRunTip?: boolean }
  | { type: 'diff'; hash: string; diff: string; files: CommitFileChange[]; selectedFile?: string; stats?: { filesChanged: number; insertions: number; deletions: number } }
  | { type: 'combinedDiff'; hashes: string[]; diff: string }
  | { type: 'rangeDiff'; fromHash: string; toHash: string; diff: string }
  | { type: 'commitFiles'; hash: string; files: CommitFileChange[] }
  | { type: 'error'; message: string }
  | { type: 'selectCommit'; hash: string }
  | { type: 'branchHashes'; hashes: Record<string, string[]> }
  | { type: 'diffSearchResults'; query: string; matchingHashes: string[] }
  | { type: 'triggerAction'; action: WebviewAction }
  | { type: 'showFirstRunTip' };

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
  | { type: 'copyCommitHash'; hash: string }
  | { type: 'copyCommitInfo'; hash: string }
  | { type: 'copyCherryPickCommand'; hash: string }
  | { type: 'copyRevertCommand'; hash: string }
  | { type: 'openFileAtCommit'; hash: string; filePath: string }
  | { type: 'restoreFileFromCommit'; hash: string; filePath: string }
  | { type: 'compareFileWithWorkingTree'; hash: string; filePath: string }
  | { type: 'copyFilePath'; filePath: string; relative: boolean }
  | { type: 'revealInExplorer'; filePath: string }
  | { type: 'blameFile'; filePath: string }
  | { type: 'copyCommitUrl'; hash: string }
  | { type: 'copyAuthorEmail'; hash: string }
  | { type: 'copyAuthorName'; hash: string }
  | { type: 'copyShortHash'; hash: string }
  | { type: 'copySubject'; hash: string }
  | { type: 'createBranch'; hash: string }
  | { type: 'createTag'; hash: string }
  | { type: 'deleteTag'; hash: string }
  | { type: 'deleteBranch'; branch: string; force?: boolean }
  | { type: 'renameBranch'; branch: string; newName: string }
  | { type: 'saveSettings'; settings: Partial<UserSettings> }
  | { type: 'requestBranchHashes'; branches: string[] }
  | { type: 'checkoutBranch'; branch: string }
  | { type: 'cherryPickCommit'; hash: string }
  | { type: 'revertCommit'; hash: string }
  | { type: 'resetToCommit'; hash: string; mode: 'soft' | 'mixed' | 'hard' }
  | { type: 'requestDiffSearch'; query: string; commitHashes: string[] }
  | { type: 'changeDiffContextLines'; value: number }
  | { type: 'dismissFirstRunTip' }
  | { type: 'focusCommitList' };
