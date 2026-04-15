/**
 * User settings interface for Git History panel state
 */
export interface UserSettings {
  /** Diff view type: 'unified' or 'side-by-side' */
  diffType: 'unified' | 'side-by-side';
  /** Whether word wrap is enabled in diff view */
  wordWrapEnabled: boolean;
  /** Sort order: true = oldest first, false = newest first */
  sortOldestFirst: boolean;
  /** Whether to hide merge commits */
  hideMergeCommits: boolean;
  /** Whether regex search mode is enabled */
  regexSearchEnabled: boolean;
}

/**
 * Default settings used when no saved settings exist
 */
export const DEFAULT_SETTINGS: UserSettings = {
  diffType: 'unified',
  wordWrapEnabled: false,
  sortOldestFirst: false,
  hideMergeCommits: false,
  regexSearchEnabled: false
};

/**
 * Storage key for settings in VS Code's globalState
 */
export const SETTINGS_STORAGE_KEY = 'gitHistory.userSettings';
