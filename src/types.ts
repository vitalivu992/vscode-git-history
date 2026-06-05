import { UserSettings } from './settings';

/**
 * Statistics for a single commit
 */
export interface CommitStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

/**
 * Statistics for a single file in a commit
 */
export interface FileStats {
  path: string;
  insertions: number;
  deletions: number;
  isBinary: boolean;
}

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
  stats?: CommitStats;
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
  | 'copyCommitMessage'
  | 'copySelectedCherryPickCommands'
  | 'copyCommitHash'
  | 'copyCommitInfo'
  | 'copyCherryPick'
  | 'copyRevert'
  | 'copyCommitFiles'
  | 'copyCommitDiff'
  | 'copyCommitPatch'
  | 'copyCommitUrl'
  | 'copyCommitStats'
  | 'copyFileStats'
  | 'copyFilesChangedCount'
  | 'copyBranchName'
  | 'copyBranchUrl'
  | 'copyRemoteUrl'
  | 'copyTags'
  | 'copySelectedHashes'
  | 'copyAuthorEmail'
  | 'copyAuthorName'
  | 'copyAuthorGitFormat'
  | 'copyAuthorInitials'
  | 'copyParentHash'
  | 'copyShortHash'
  | 'copySubject'
  | 'copySubjectWithAuthor'
  | 'copyDiffStatSummary'
  | 'copyCommitWithStats'
  | 'copyCoAuthors'
  | 'copyCommitDate'
  | 'copyCommitShortDate'
  | 'copyRelativeDate'
  | 'copyCommitTimestamp'
  | 'copyOneline'
  | 'copyCompact'
  | 'copyCommitBody'
  | 'copyCommitMarkdown'
  | 'copyCommitJson'
  | 'copyCommitHtml'
  | 'copyCommitRest'
  | 'copyCommitJira'
  | 'copyFileContent'
  | 'copyDescribe'
  | 'copyFileName'
  | 'copyFileExtension'
  | 'copyFileLineCount'
  | 'copyFileDirectory'
  | 'copyRelativePath'
  | 'copyFileDiff'
  | 'copyFilePath'
  | 'exportCommits'
  | 'exportCommitsMbox'
  | 'quickCompare'
  | 'createBranch'
  | 'createTag'
  | 'deleteTag'
  | 'deleteBranch'
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
  | 'copyFilterQuery'
  | 'pasteFilterQuery'
  | 'clearAllFilters'
  | 'copyCombinedDiff'
  | 'copyRangeDiff'
  | 'copyCommitMention'
  | 'copyCommitRef'
  | 'copyFileUrl'
  | 'openCommitUrl'
  | 'openFileUrl'
  | 'saveFilterPreset'
  | 'loadFilterPreset'
  | 'renameFilterPreset'
  | 'toggleGraph'
  | 'toggleSignatures'
  | 'toggleStats'
  | 'copyAllFilteredHashes'
  | 'copyAllFilteredAsOneline'
  | 'copyAllUniqueAuthors'
  | 'copySelectedMessagesChecklist'
  | 'copySelectedMessagesNumbered'
  | 'copySelectedMessagesChecklistWithAuthor'
  | 'copySelectedMessagesNumberedWithAuthor'
  | 'copyCommitterEmail'
  | 'copyCommitterName'
  | 'copyShowCommand'
  | 'copyFileShowCommand'
  | 'jumpToNextTag'
  | 'jumpToPreviousTag'
  | 'jumpToParent'
  | 'jumpToNextCommitWithStats'
  | 'jumpToPreviousCommitWithStats'
  | 'cycleDiffContextLines'
  | 'cycleSortMode'
  | 'copyAllFilePermalinks'
  | 'copyFilterAsGitLogCommand'
  | 'copyFileBasename'
  | 'copyFilePathWithHash'
  | 'focusCommitList'
  | 'revealFileInExplorer'
  | 'copySignatureInfo'
  | 'copyFullCommitInfoWithFileStats'
  | 'copyCommitYaml'
  | 'copyCommitBbcode'
  | 'copyCommitCsv'
  | 'copyTrailers'
  | 'copyFixesReferences'
  | 'copyReviewedBy';

/**
 * Filter state for copy filter query feature
 */
export interface FilterQueryState {
  query: string;
  hideMergeCommits: boolean;
  sortMode: number;
  showMyCommitsOnly: boolean;
  regexSearchEnabled: boolean;
  pathFilter: string | null;
}

/**
 * Saved filter preset for quick filter restoration
 */
export interface SavedFilterPreset {
  name: string;
  filterState: FilterQueryState;
  createdAt: string;
}

/**
 * Storage key for saved filter presets in VS Code's globalState
 */
export const SAVED_PRESETS_STORAGE_KEY = 'gitHistory.savedPresets';

/**
 * Messages from extension to webview
 */
export type ExtToWebviewMessage =
  | { type: 'init'; commits: CommitInfo[]; filePath: string; showGraph: boolean; selection?: { startLine: number; endLine: number }; branch?: string; branches?: string[]; hideMergeCommits?: boolean; defaultDiffView?: string; userSettings?: UserSettings; currentUser?: { name: string; email: string } | null; showFirstRunTip?: boolean; savedPresets?: SavedFilterPreset[] }
  | { type: 'diff'; hash: string; diff: string; files: CommitFileChange[]; selectedFile?: string }
  | { type: 'combinedDiff'; hashes: string[]; diff: string }
  | { type: 'rangeDiff'; fromHash: string; toHash: string; diff: string }
  | { type: 'commitFiles'; hash: string; files: CommitFileChange[] }
  | { type: 'error'; message: string }
  | { type: 'selectCommit'; hash: string }
  | { type: 'branchHashes'; hashes: Record<string, string[]> }
  | { type: 'triggerAction'; action: WebviewAction }
  | { type: 'showFirstRunTip' }
  | { type: 'applyFilterQuery'; filterState: FilterQueryState }
  | { type: 'filterPresets'; presets: SavedFilterPreset[] };

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
  | { type: 'copyFileName'; filePath: string }
  | { type: 'copyFileExtension'; filePath: string }
  | { type: 'copyFileLineCount'; hash: string; filePath: string }
  | { type: 'copyFileBasename'; filePath: string }
  | { type: 'copyFileDirectory'; filePath: string }
  | { type: 'copyRelativePath'; filePath: string }
  | { type: 'copyFilePathWithHash'; hash: string; filePath: string }
  | { type: 'openFileAtCommit'; hash: string; filePath: string }
  | { type: 'copyCommitPatch'; hash: string }
  | { type: 'copyCommitUrl'; hash: string }
  | { type: 'copyCommitStats'; hash: string }
  | { type: 'copyFileStats'; hash: string }
  | { type: 'copyFilesChangedCount'; hash: string }
  | { type: 'copyBranchName' }
  | { type: 'copyBranchUrl' }
  | { type: 'copyRemoteUrl' }
  | { type: 'copyTags'; hash: string }
  | { type: 'copySelectedHashes'; hashes: string[] }
  | { type: 'copySelectedCherryPickCommands'; hashes: string[] }
  | { type: 'copyAuthorEmail'; hash: string }
  | { type: 'copyAuthorName'; hash: string }
  | { type: 'copyAuthorGitFormat'; hash: string }
  | { type: 'copyAuthorInitials'; hash: string }
  | { type: 'copyCommitterEmail'; hash: string }
  | { type: 'copyCommitterName'; hash: string }
  | { type: 'copyShowCommand'; hash: string }
  | { type: 'copyFileShowCommand'; hash: string; filePath: string }
  | { type: 'copyParentHash'; hash: string }
  | { type: 'copyShortHash'; hash: string }
  | { type: 'copySubject'; hash: string }
  | { type: 'copySubjectWithAuthor'; hash: string }
  | { type: 'copyDiffStatSummary'; hash: string }
  | { type: 'copyCommitWithStats'; hash: string }
  | { type: 'copyCoAuthors'; hash: string }
  | { type: 'copyCommitDate'; hash: string }
  | { type: 'copyCommitShortDate'; hash: string }
  | { type: 'copyRelativeDate'; hash: string }
  | { type: 'copyCommitTimestamp'; hash: string }
  | { type: 'copyOneline'; hash: string }
  | { type: 'copyCommitCompact'; hash: string }
  | { type: 'copyCommitBody'; hash: string }
  | { type: 'copyCommitMarkdown'; hash: string }
  | { type: 'copyCommitJson'; hash: string }
  | { type: 'copyCommitHtml'; hash: string }
  | { type: 'copyCommitRest'; hash: string }
  | { type: 'copyCommitJira'; hash: string }
  | { type: 'copyFileContent'; hash: string; filePath: string }
  | { type: 'copyDescribe'; hash: string }
  | { type: 'copyFileDiff'; hash: string; filePath: string }
  | { type: 'quickCompare'; hash: string }
  | { type: 'createBranch'; hash: string }
  | { type: 'createTag'; hash: string }
  | { type: 'deleteTag'; hash: string }
  | { type: 'deleteBranch'; branch: string; force?: boolean }
  | { type: 'saveSettings'; settings: Partial<UserSettings> }
  | { type: 'exportCommits'; format: 'json' | 'csv' | 'markdown' | 'text' | 'prdescription'; commits: CommitInfo[] }
  | { type: 'exportCommitsMbox'; fromHash: string; toHash: string }
  | { type: 'requestBranchHashes'; branches: string[] }
  | { type: 'checkoutBranch'; branch: string }
  | { type: 'cherryPickCommit'; hash: string }
  | { type: 'revertCommit'; hash: string }
  | { type: 'changeDiffContextLines'; value: number }
  | { type: 'dismissFirstRunTip' }
  | { type: 'copyFilterQuery'; filterState: FilterQueryState }
  | { type: 'pasteFilterQuery' }
  | { type: 'copyCombinedDiff'; hashes: string[] }
  | { type: 'copyRangeDiff'; fromHash: string; toHash: string }
  | { type: 'copyCommitMention'; hash: string }
  | { type: 'copyCommitRef'; hash: string }
  | { type: 'copyFileUrl'; hash: string; filePath: string }
  | { type: 'openCommitUrl'; hash: string }
  | { type: 'openFileUrl'; hash: string; filePath: string }
  | { type: 'saveFilterPreset'; name: string; filterState: FilterQueryState }
  | { type: 'deleteFilterPreset'; name: string }
  | { type: 'renameFilterPreset'; oldName: string; newName: string }
  | { type: 'getFilterPresets' }
  | { type: 'applyPreset'; presetName: string }
  | { type: 'copyAllFilteredHashes'; hashes: string[] }
  | { type: 'copyAllFilteredAsOneline'; hashes: string[] }
  | { type: 'copyAllUniqueAuthors'; hashes: string[] }
  | { type: 'copySelectedMessagesChecklist'; hashes: string[] }
  | { type: 'copySelectedMessagesNumbered'; hashes: string[] }
  | { type: 'copySelectedMessagesChecklistWithAuthor'; hashes: string[] }
  | { type: 'copySelectedMessagesNumberedWithAuthor'; hashes: string[] }
  | { type: 'copyAllFilePermalinks'; hash: string }
  | { type: 'copyFilterAsGitLogCommand'; filterState: FilterQueryState }
  | { type: 'focusCommitList' }
  | { type: 'revealFileInExplorer'; filePath: string }
  | { type: 'copySignatureInfo'; hash: string }
  | { type: 'copyFullCommitInfoWithFileStats'; hash: string }
  | { type: 'copyCommitYaml'; hash: string }
  | { type: 'copyCommitBbcode'; hash: string }
  | { type: 'copyCommitCsv'; hash: string }
  | { type: 'copyTrailers'; hash: string }
  | { type: 'copyFixesReferences'; hash: string }
  | { type: 'copyReviewedBy'; hash: string };
