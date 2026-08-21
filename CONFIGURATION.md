# Configuration

Git History is configured through VS Code settings and remembers your in-panel preferences across sessions.

> User-facing features: [FEATURES.md](FEATURES.md) · How to use: [USAGE.md](USAGE.md)

## Extension Settings

This extension contributes the following settings:

* `gitHistory.maxCommits`: Maximum number of commits to display (default: 500)
* `gitHistory.hideMergeCommits`: Hide merge commits in the history view (default: false)
* `gitHistory.blame.dateFormat`: Date format for blame annotations - `relative` (e.g., "2 days ago"), `short` (e.g., "2024-03-15"), or `iso` (e.g., "2024-03-15T10:30:00Z") (default: `relative`)
* `gitHistory.commitList.dateFormat`: Date format for the commit list - `relative` (e.g., "Today 2:30 PM", "2 weeks ago"; hover for the absolute timestamp), `short` (your locale's date), or `iso` (e.g., "2024-03-15") (default: `relative`)
* `gitHistory.defaultDiffView`: Default diff view mode when opening Git History - `unified` or `side-by-side` (default: `unified`). **Note**: User settings from the previous session take precedence over this configuration.
* `gitHistory.diffContextLines`: Number of context lines to show in diffs (default: `3`, range: `1-10`). Increase for more context during code review, decrease for more focused diffs.
* `gitHistory.showSignatures`: Show GPG signature verification status for signed commits (default: true)

### Persistent User Preferences

Git History automatically saves and restores your view preferences across VS Code sessions. The following settings are remembered:

- **Diff Type**: Your choice of unified or side-by-side diff view
- **Word Wrap**: Whether word wrap is enabled in the diff viewer
- **Sort Order**: Newest-first or oldest-first commit ordering
- **Hide Merge Commits**: Whether merge commits are filtered out
- **Show My Commits Only**: Whether to show only commits by the current git user
- **Regex Search Mode**: Whether regex search is enabled
- **Ignore Whitespace**: Whether to ignore whitespace in diffs
- **Diff Context Lines**: Number of context lines shown in diffs
- **Show GPG Signatures**: Whether GPG signature verification badges are shown
- **Search Query**: The current search text (restored across sessions)

These preferences are saved automatically when you change them in the UI, and restored the next time you open Git History. This allows you to maintain your preferred workflow without reconfiguring each time.

## Developer notes: preference persistence

User preferences are persisted across VS Code sessions using `ExtensionContext.globalState`.

- `src/settings/settingsService.ts` — service for saving/loading settings via `globalState`
- `src/settings/settingsTypes.ts` — `UserSettings` interface and `DEFAULT_SETTINGS`
- Settings are saved automatically when toggles change in the UI (via the `saveSettings` message)
- Settings are applied on panel initialization via the `init` message's `userSettings` field
- User settings take precedence over the `gitHistory.defaultDiffView` configuration
- Partial settings merge with `DEFAULT_SETTINGS` for backward compatibility when new settings are added

