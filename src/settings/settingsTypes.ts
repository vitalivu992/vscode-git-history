/**
 * User settings interface for Git History panel state
 */
export interface UserSettings {
  /** Diff view type: 'unified' or 'side-by-side' */
  diffType: 'unified' | 'side-by-side';
  /** Whether word wrap is enabled in diff view */
  wordWrapEnabled: boolean;
  /** Sort mode: 0=newest first, 1=oldest first, 2=author A-Z, 3=author Z-A */
  sortMode: number;
  /** Whether to hide merge commits */
  hideMergeCommits: boolean;
  /** Whether regex search mode is enabled */
  regexSearchEnabled: boolean;
  /** Whether to show only commits by the current git user */
  showMyCommitsOnly: boolean;
  /** Whether to ignore whitespace in diffs */
  ignoreWhitespace: boolean;
  /** Number of context lines in diffs (1-10) */
  diffContextLines: number;
  /** Whether to show GPG signature verification badges */
  showSignatures: boolean;
  /** Saved search query for persistence across sessions */
  searchQuery: string;
}

/**
 * Default settings used when no saved settings exist
 */
export const DEFAULT_SETTINGS: UserSettings = {
  diffType: 'unified',
  wordWrapEnabled: false,
  sortMode: 0,
  hideMergeCommits: false,
  regexSearchEnabled: false,
  showMyCommitsOnly: false,
  ignoreWhitespace: false,
  diffContextLines: 3,
  showSignatures: true,
  searchQuery: ''
};

/**
 * Storage key for settings in VS Code's globalState
 */
export const SETTINGS_STORAGE_KEY = 'gitHistory.userSettings';
