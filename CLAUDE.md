# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

```bash
npm install           # Install dependencies
npm run compile       # Production build (webpack + compile tests)
npm run watch         # Development build with watch mode
npm run compile-tests # Compile tests only (tsc -p test/tsconfig.json)
npm test              # Run tests (on Linux: xvfb-run -a npm test)
npm run screenshot    # Capture extension screenshots
```

### Makefile (convenience wrapper)

```bash
make help            # Show all available targets
make compile         # npm install + npm run compile
make test            # Run tests + capture screenshots
make package         # Package as .vsix file
make install         # Install .vsix to Cursor
make clean           # Remove dist/, out/, .vsix, screenshots/
```

## Architecture Overview

This is a VS Code extension for viewing git history of files and line selections.

### User Preference Persistence

User preferences are automatically persisted across VS Code sessions using VS Code's `ExtensionContext.globalState`. The following settings are saved and restored when reopening Git History:

- **Diff Type**: Unified or side-by-side view preference
- **Word Wrap**: Whether word wrap is enabled in diff viewer
- **Sort Order**: Sort mode (0=newest, 1=oldest, 2=author A-Z, 3=author Z-A)
- **Hide Merge Commits**: Whether to filter out merge commits
- **Regex Search Mode**: Whether regex search is enabled
- **Search Query**: Search query text for filtering commits
- **Show Graph**: Whether the commit graph column is visible
- **Show Signatures**: Whether GPG signature verification badges are visible
- **Show Stats**: Whether the commit statistics column is visible
- **Ignore Whitespace**: Whether whitespace differences are ignored in diffs
- **Show My Commits Only**: Whether to show commits authored by the current user only
- **Diff Context Lines**: Number of context lines shown in diffs (1-10)

**Implementation**:
- `src/settings/settingsService.ts` - Service for saving/loading settings via `globalState`
- `src/settings/settingsTypes.ts` - Type definitions and default values
- Settings are saved automatically when toggles change in the UI (via `saveSettings` message)
- Settings are applied on panel initialization via the `init` message's `userSettings` field
- User settings take precedence over `gitHistory.defaultDiffView` configuration
- Settings merge with defaults for backward compatibility when new settings are added

### Extension Structure

- **Entry Point**: `src/extension.ts` registers two commands:
  - `gitHistory.showFileHistory` - history for entire file
  - `gitHistory.showSelectionHistory` - history for selected lines
  - Also registers `GitHistoryContentProvider` for the `git-history` URI scheme
  - Registers 19 webview action commands (prefixed `gitHistory.`) that post `triggerAction` messages to the active webview panel for keybinding discoverability. Each command maps to a `WebviewAction` type defined in `src/types.ts`. These commands are declared in `package.json` under `contributes.keybindings` with `when: "activeWebviewPanelId == gitHistory.webview"` so they only fire when the Git History panel is focused. The webview handles `triggerAction` messages in its `handleMessage` switch, dispatching to the same handler functions used by `handleKeyDown`.

- **Git Layer** (`src/git/`):
  - `gitService.ts` - executes git commands via `child_process.execFile`
  - `gitParser.ts` - parses git output using null-separated format
  - `gitStatsParser.ts` - parses commit statistics (files changed, insertions, deletions) from git --stat output
  - `blameParser.ts` - parses `git blame --porcelain` output into `BlameLineInfo` objects

- **Blame Layer** (`src/blame/`):
  - `blameService.ts` - manages inline blame decorations and status bar, toggles blame annotations

- **Settings Layer** (`src/settings/`):
  - `settingsService.ts` - persists `UserSettings` via VS Code's `ExtensionContext.globalState`
  - `settingsTypes.ts` - type definitions and default values for user settings

- **Content Provider**: `src/gitHistoryContentProvider.ts` implements VS Code's `TextDocumentContentProvider` for the `git-history` URI scheme, serving file content at specific commits.

- **Webview Layer** (`src/webview/`):
  - `webviewProvider.ts` - manages the webview panel lifecycle
  - `messageHandler.ts` - handles messages between extension and webview
  - `panel/` - static HTML/CSS/JS files for the UI (diff2html for rendering)

- **Combined Diff**: `getCombinedDiff` in `src/git/gitService.ts` sorts selected commit hashes chronologically (oldest first) using `git log --format="%H %at" --no-walk` to determine commit dates. The `sortHashesByDate` helper maps hashes to timestamps and sorts ascending. This ensures the diff range `earliest~1..latest` always spans the correct chronological range regardless of hash input order. Falls back to lexicographic sort if the date lookup fails.

- **Compare Any Two Commits (Range Diff)**: Users can Shift+click (or Shift+Enter) two commits to see the diff between them using `git diff A..B`. The `handleRangeSelection` function in `main.js` finds all commits between the anchor (first clicked) and target, selects them all, and requests the range diff via `requestRangeDiff`. The `getCommitRangeDiff` function in `gitService.ts` executes `git diff fromHash..toHash`. The header shows "Comparing: `short1`..`short2`" to indicate range mode. This differs from multi-select (Ctrl+click) which shows a combined diff of all changes across the range. Range selection supports the same file-path scoping as single commits.

- **Types**: `src/types.ts` defines shared interfaces (`CommitInfo`, `CommitFileChange`, `DiffResult`, message types)

### Git Log Format

File history uses:
```
%H%x00%P%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%s%x00%b%x00%d%x00%G?%x00%GS%x00---COMMIT-END---%n
```
Fields: hash, parent hashes (space-separated), author, email, committer name, committer email, timestamp, subject, body, decorations, GPG signature status, GPG signer name.
Commits are separated by `---COMMIT-END---` markers. `%P` is empty for root commits.

The `%d` decorations field contains tag references (e.g., `tag: v1.0.0`, `tag: v1.0.0, origin/main`). Tags are parsed from this field and rendered as badges in the webview commit list. Both annotated and lightweight tags are supported.

Selection history (`git log -L`) uses the same null-separated format (without body/`---COMMIT-END---`):
```
%H%x00%P%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%s%x00%d%x00%G?%x00%GS
```
Each commit appears as a single header line; inline diff lines (no null chars) are skipped by the parser.

### maxCommits Configuration

Both `getFileHistory()` and `getSelectionHistory()` respect the `gitHistory.maxCommits` configuration setting (default: 500). This limit is applied at the git command level using the `-n` flag, ensuring efficient filtering even for repositories with extensive history. The limit can be configured in VS Code settings.

### Commit Graph

The webview renders a per-row SVG graph column (like `git log --graph`) using a lane-based algorithm:
- `src/webview/panel/graphLayout.js` – pure JS lane computation, exports `computeGraphLayout(commits)` and `simplifyParentsForDisplay(commits)`
- `src/webview/panel/main.js` – calls `simplifyParentsForDisplay` then `computeGraphLayout` on the filtered list, renders SVG per row via `renderGraphSvg()`
- Controlled by `gitHistory.showGraph` config setting (default: true)

`simplifyParentsForDisplay` remaps each commit's `parentHashes` to only reference commits present in the displayed list. This prevents "ghost" lanes when the list is filtered (e.g. `--follow -- file` or `-L`). Commits whose parents are all absent get the next commit in the list assigned as a synthetic first parent.

### Branch Detection

The extension detects and displays the current git branch in the history panel:
- `src/git/gitService.ts` – `getCurrentBranch(cwd)` uses `git rev-parse --abbrev-ref HEAD`
- `src/webview/webviewProvider.ts` – fetches branch during `loadData()` and passes it in the `init` message
- `src/webview/panel/main.js` – `renderBranchBadge()` displays the branch as a badge in the commit detail header
- `src/types.ts` – `init` message type includes optional `branch?: string` field
- Falls back to `'HEAD'` when in detached HEAD state

- **Branch Switching**: Right-click the branch badge to show a context menu with all local and remote branches, or press `Ctrl+Alt+S` / `Cmd+Alt+S` to open a searchable branch picker dialog. Clicking a branch sends a `checkoutBranch` message to the extension which executes `git checkout <branch>`. On success, the panel automatically refreshes to show the new branch's commits. Implemented in `main.js` (`showBranchContextMenu()`, `showBranchPickerDialog()`, `setAllBranches()`), `messageHandler.ts` (`handleCheckoutBranch()`), `gitService.ts` (`checkoutBranch()`), and `styles.css` (`.branch-context-menu`, `.branch-picker-modal`).

- **Delete Branch**: Press `Ctrl+Alt+X` / `Cmd+Alt+X` to open a modal dialog to select and delete local branches. The modal shows all local branches (excluding remote tracking branches), with the current branch marked and not deletable. When deleting a branch that is not fully merged, git will reject the operation and offer a force delete option. Cannot delete the current branch - shows an error message. Implemented in `main.js` (`handleDeleteBranch()`), `messageHandler.ts` (`handleDeleteBranch()`), `gitService.ts` (`deleteBranch()`), and `package.json` (command definition).

### UI Features

- **Date Display**: Commit dates are displayed in relative format with time for recent commits (e.g., "Today 2:30 PM", "Yesterday 3:45 PM", "2 days ago", "2 weeks ago"). Hovering over a date reveals the absolute timestamp in locale format. Implemented in `src/webview/panel/main.js` (`formatDate()` and `formatTime()` functions) and uses a `title` attribute on date elements.

- **Commit Count Display**: The search bar always shows the number of commits in the current view. When no filters are active, it displays "N commits" (e.g., "142 commits"). When filters are active and reduce the visible count, it displays "X of N commits" (e.g., "12 of 142 commits"). The count updates in real-time as search, author, tag, date, regex, and merge-commit filters change. Implemented via the `updateCommitCount()` function in `src/webview/panel/main.js`, which is called from `renderCommits()`, filter toggle handlers, and the `init` message handler. The HTML element (`#commit-count` with class `.commit-count`) exists in both `webviewProvider.ts` and `index.html`. Styled in `styles.css` with muted foreground color.

- **Git Tag Badges**: Tags parsed from the `%d` decorations field are rendered as colored badges next to commit messages. Lightweight and annotated tags are both supported. Badge styling is defined in `src/webview/panel/styles.css`.

- **Blame Annotations**: The extension provides line-by-line blame annotations via the `toggleBlame` and `showBlameCommit` commands. Blame information is displayed as inline decorations showing commit hash, author, and date for each line. Date format is configurable via `gitHistory.blame.dateFormat` (relative, short, or iso). Error handling is implemented: if `getGitRoot` or `getFileBlame` fails (git not installed, file not in a git repo, or git command timeout), an error message is shown to the user with details about the failure.

  The `showBlameCommit` command (triggered by clicking on blame decorations) displays a warning message "No active editor found" when there is no active text editor, consistent with other commands like `showFileHistory` and `showSelectionHistory`.

- **Expandable Commit Messages**: Commits with multi-line messages (subject + body) display an expand/collapse button (▼/▲) in the message column. Clicking expands to show the full commit body. The expanded state is tracked per commit hash during the session. Implementation is in `src/webview/panel/main.js` (render logic and event handling) and `src/webview/panel/styles.css` (flex layout and body styling).

- **Commit Search**: The search input filters commits in real time by message, author name, author email, commit hash (full and short), and tag name. The filter is implemented as a case-insensitive `.includes()` match across all these fields in `src/webview/panel/main.js` (`renderCommits` function). Tag filtering uses `commit.tags.some()` to match any tag badge text.

- **Regex Search Mode**: A toggle button (.*) next to the search input enables regex search mode for advanced pattern matching. When enabled, the search query is interpreted as a JavaScript regular expression, allowing powerful filters like `bug(fix|patch)|hotfix` or `^feat:.*`. Invalid regex patterns are gracefully handled with visual feedback. The regex toggle button shows active state with highlighted styling. Keyboard shortcut `Ctrl+Shift+X` / `Cmd+Shift+X` toggles regex mode. Regex mode works in combination with date filters and other search features. Implementation in `src/webview/panel/main.js`: the `regexSearchEnabled` state variable controls the mode, `isRegexMatch()` function performs the regex testing with error handling, and `handleRegexToggle()` updates the UI state. When an invalid regex pattern is entered while regex mode is enabled, the `getRegexError()` function captures the JavaScript RegExp error message and the error is displayed in the regex toggle button's tooltip (e.g., "Invalid regex: Unterminated group"). The `updateRegexValidation()` function manages the tooltip and the `regexErrorMessage` state variable. The button gets an `.invalid` CSS class (red border). The search falls back to case-insensitive substring matching via `isRegexMatch()`.

- **Date Range Filters**: The search input supports date filtering with special syntax: `after:YYYY-MM-DD` for commits after a date, `before:YYYY-MM-DD` for commits before a date, and `last:Ndays/weeks/months` for relative time filtering (e.g., `last:7days`, `last:2weeks`). Date filters can be combined with text search (e.g., `fix bug after:2024-01-01`). The `parseDateFilter()` function in `main.js` extracts date filters from the query, and active filters are displayed as removable badges below the search input. The remaining text after removing date filters is used for the standard text search.

- **Author Filter**: The search input supports author filtering with the `author:name` syntax (e.g., `author:Alice`, `author:alice@example.com`). The filter matches case-insensitively against both the author name and email fields. Clicking on any author name in the commit list applies the author filter for that author. Active author filters are displayed as removable badges alongside date filter badges. The `parseDateFilter()` function in `main.js` extracts the author filter, and `getFilteredCommits()` applies it before date and text filters. The author filter can be combined with date filters and text search (e.g., `author:Bob fix after:2024-01-01`). The `author-filter-link` class on author names enables click-to-filter, styled in `styles.css`.

- **Tag Filter**: The search input supports tag filtering with the `tag:name` syntax (e.g., `tag:v1.0.0`, `tag:release`). The filter matches case-insensitively against tag names using `commit.tags.some(t => t.toLowerCase().includes(tagFilter))`. Clicking on any tag badge in the commit list applies the tag filter. Active tag filters are displayed as removable badges alongside author and date filter badges. The `parseDateFilter()` function in `main.js` extracts the tag filter and strips it from the text query, and `getFilteredCommits()` applies it after author filter and before date filters. The tag filter can be combined with author filter, date filters, and text search (e.g., `tag:v2.0 author:Bob after:2024-01-01`). The `tag-filter-link` class on tag badges enables click-to-filter, styled in `styles.css`.

- **Branch Filter**: The search input supports branch filtering with the `branch:name` syntax (e.g., `branch:main`, `branch:feature/login`). The filter matches case-insensitively against branch names using a pre-fetched `branchCommitHashes` map that maps lowercase branch names to sets of commit hashes. The `parseDateFilter()` function in `main.js` extracts the branch filter, and `getFilteredCommits()` applies it after tag filter and before date filters. On initialization, the webview receives the list of all branches via the `init` message and sends a `requestBranchHashes` message to the extension. The extension responds with a `branchHashes` message containing a `Record<string, string[]>` mapping branch names to their commit hashes. Active branch filters are displayed as removable badges alongside other filter badges. Clicking on the branch badge clears it. The branch filter can be combined with all other filters (e.g., `branch:main author:Bob after:2024-01-01`). Implementation spans `main.js` (filter parsing, commit filtering, badge rendering), `webviewProvider.ts` (fetches branches via `getAllBranches`), `messageHandler.ts` (`handleRequestBranchHashes` calls `getBranchCommitHashes`), and `gitService.ts` (`getAllBranches` uses `git branch -a`, `getBranchCommitHashes` uses `git log --format="%H" <branch>`).

- **Path Filter**: The search input supports path filtering with the `path:name` syntax (e.g., `path:src/main.js`, `path:tests`). The filter matches case-insensitively against file paths in each commit. It works by fetching the files changed in each commit and checking if any file path contains the filter string. Active path filters are displayed as removable badges alongside other filter badges. The `parseDateFilter()` function in `main.js` extracts the path filter and strips it from the text query, and `getFilteredCommits()` applies it after other filters. The path filter can be combined with all other filters (e.g., `fix bug path:src after:2024-01-01`).

- **Quick Date Range Filters**: Three quick filter buttons ("Today", "Week", "Month") next to the search input provide instant access to common date ranges. Clicking applies the corresponding date filter (`last:1day`, `last:7days`, `last:1month`). The buttons show an active state when their filter is applied, and clicking again removes the filter (toggle behavior). These work in combination with other filters (author, tag, branch, text search). The `applyQuickDateFilter()` function in `main.js` handles button clicks by updating `searchQuery`, syncing button active states via `updateQuickDateFilterButtons()`, and refreshing the commit list. Button states are synced automatically when filters change through search input, badge removal, clear all, paste filter query, or init with saved settings. Implementation spans `main.js` (`applyQuickDateFilter`, `updateQuickDateFilterButtons`), `index.html` and `webviewProvider.ts` (button HTML), and `styles.css` (`.date-filter-btn`, `.date-filter-btn.active`).

- **Sort Toggle**: The sort button in the toolbar cycles through four sort modes: newest-first (default), oldest-first, author A-Z, and author Z-A. The state is tracked as `sortMode` (0–3) in `src/webview/panel/main.js`. When toggled, `getOrderedCommits()` applies the appropriate sort: `slice()` for newest, `reverse()` for oldest, and `localeCompare` on `author` for A-Z/Z-A. The `updateSortButton()` helper updates the button label and active state. The commit graph is hidden for author-based modes (modes 2 and 3) because the graph layout algorithm assumes date-based ordering. The graph header visibility is controlled by `effectiveShowGraph` (true only when `showGraph` is enabled AND `sortMode < 2`). Also accessible via `Ctrl+Shift+3` / `Cmd+Shift+3` (registered as `gitHistory.cycleSortMode`). The `sortMode` setting is persisted in `UserSettings` (previously `sortOldestFirst: boolean`, migrated on load in `settingsService.ts`).

- **Keyboard Navigation**: The commit list supports full keyboard navigation for accessibility and power users. Arrow keys (`↑`/`↓`) move focus between commits with wrapping support. `Home`/`End` jump to first/last commit. `PageUp`/`PageDown` navigate up or down by 10 commits at a time, providing faster navigation through large commit histories. The page size is fixed at 10 commits for consistent behavior, and PageUp/PageDown respects all active filters while stopping at boundaries (unlike arrow keys which wrap). `Enter` selects the focused commit, while `Ctrl+Enter` toggles multi-selection. `Ctrl+A` / `Cmd+A` selects all visible commits in the current view, useful for bulk operations like exporting or copying all hashes. `/` or `Ctrl+F` focuses the search input. `Escape` clears selection and removes focus. The focused row has a distinct visual outline using the `focused` CSS class (separate from the `selected` class used for commit selection). Implementation spans `src/webview/panel/main.js` (`handleKeyDown`, `updateFocusedRow`, `scrollFocusedIntoView` functions) and `src/webview/panel/styles.css` (`.focused` class styling).

- **Focus Commit List**: Press `Ctrl+L` / `Cmd+L` to quickly focus the first visible commit in the list for keyboard navigation. This is useful when you want to start navigating commits with arrow keys without having to click on a commit first. The shortcut sets `focusedIndex` to 0, applies the `.focused` CSS class via `updateFocusedRow()`, and scrolls the focused commit into view via `scrollFocusedIntoView()`. Works with filters active - focuses the first *visible* commit in the filtered view. If no commits are visible, the function returns silently. The `focusCommitList` webview action is defined in `src/types.ts` and the command is registered in `src/extension.ts` as `gitHistory.focusCommitList`.

- **Hide Merge Commits**: A toggle button in the toolbar allows filtering out merge commits from the history view. When enabled, commits with more than one parent (merge commits) are hidden from the commit list. This helps reduce clutter when reviewing history with many merge commits. The setting is controlled by `gitHistory.hideMergeCommits` configuration (default: false) and can be toggled per-session via the "No Merge" button or keyboard shortcut `Ctrl+Shift+Q` / `Cmd+Shift+Q`. State is tracked in `hideMergeCommits` variable in `main.js`, filtering logic is integrated into `getFilteredCommits()`, and the UI button styling is defined in `styles.css` with `.merge-toggle-btn` and `.merge-toggle-btn.active` classes.

- **Graph Toggle**: A toggle button ("Graph") in the toolbar controls visibility of the commit graph column. The graph is shown by default. Toggling hides/shows the SVG graph column in the commit list. Also toggled via `Ctrl+Alt+T` / `Cmd+Alt+T`. Active state (graph visible) is indicated by highlighted button styling (`.graph-toggle-btn.active`). The `showGraph` state is persisted in `UserSettings` across sessions via `saveSettings`. The graph is automatically hidden when sort mode is author-based (sortMode ≥ 2) regardless of the toggle state. The initial value comes from `UserSettings.showGraph`, falling back to the `gitHistory.showGraph` VS Code configuration. Implementation spans `main.js` (`handleToggleGraph()` function, init handler), `webviewProvider.ts` (passes showGraph from userSettings in init message), and `styles.css` (`.graph-toggle-btn` styling).

- **Stats Column Toggle**: A toggle button ("Stats") in the toolbar controls visibility of the commit statistics column (files changed, insertions, deletions). The stats column is shown by default. Toggling hides/shows the stats column in the commit list. Also toggled via `Ctrl+Shift+Alt+T` / `Cmd+Shift+Alt+T`. Active state (stats visible) is indicated by highlighted button styling (`.stats-toggle-btn.active`). The `showStats` state is persisted in `UserSettings` across sessions via `saveSettings`. The toggle hides/shows both the `<th>` header and the per-row `<td>` cells. Implementation spans `main.js` (`handleToggleStats()` function, init handler, conditional rendering in `renderCommits`), `webviewProvider.ts` (passes showStats in init message, button HTML), `index.html` (button HTML), and `styles.css` (`.stats-toggle-btn` styling).

- **Toolbar Button Tooltips**: All toolbar buttons display their keyboard shortcuts in hover tooltips, helping users discover shortcuts naturally without checking documentation. The Graph toggle tooltip shows `Ctrl+Alt+T`, Signatures toggle shows `Ctrl+Shift+Alt+S`, Stats toggle shows `Ctrl+Shift+Alt+T`, No Merge toggle shows `Ctrl+Shift+Q`, and Sort button shows `Ctrl+Shift+3`. Both the static HTML (in `index.html` and `webviewProvider.ts`) and the dynamic title updates in `main.js` (in `handleToggleGraph`, `handleToggleSignatures`, `handleToggleStats`, `handleMergeToggle`, and `updateSortButton`) include the shortcuts. Tooltips update dynamically when toggling state (e.g., "Graph visible (Ctrl+Alt+T to toggle)" when shown, "Show graph (Ctrl+Alt+T)" when hidden). Tests are in `test/suite/toolbarTooltips.test.ts` and `test/suite/toolbarTooltipsE2E.test.ts`.

- **Jump to Hash**: Press `Ctrl+G` / `Cmd+G` to open a modal dialog where you can type a commit hash (full or short). As you type, matching commits are displayed. Press `Enter` to jump to the first match, or click on a result. The commit is scrolled into view and selected. Implementation is in `main.js` (`showJumpToHashDialog`, `scrollToCommitByHash`) and styled in `styles.css` (`#jump-to-hash-modal`, related classes).

- **Tag Navigation**: Press `Ctrl+]` / `Cmd+]` to jump to the next tagged commit, or `Ctrl+[` / `Cmd+[` to jump to the previous tagged commit. The navigation works within the current filtered view, respecting all active filters. The function wraps around when reaching the first or last tag. If no tagged commits are found in the current view, an error message is displayed. If no commit is currently focused, next jumps to the first tag and previous jumps to the last tag. Implemented in `src/webview/panel/main.js` (`getTaggedCommits`, `jumpToNextTag`, `jumpToPreviousTag` functions). The `jumpToNextTag` and `jumpToPreviousTag` webview actions are defined in `src/types.ts`.

- **Jump to Parent Commit**: Press `Ctrl+P` / `Cmd+P` to jump to the first parent of the currently focused commit. This is different from "Quick compare with parent" which shows a diff - this navigates to and selects the parent commit. For root commits (no parent), an error message is shown. The parent must be in the current filtered view; if not, an error suggests clearing filters. Implemented in `src/webview/panel/main.js` (`jumpToParent` function). The `jumpToParent` webview action is defined in `src/types.ts`.

- **Jump to Next/Previous Commit with Stats**: Press `Ctrl+Alt+]` / `Cmd+Alt+]` to jump to the next commit that has file changes (filesChanged > 0), or `Ctrl+Alt+[` / `Cmd+Alt+[` to jump to the previous one. This effectively skips merge commits and commits with no file changes, letting users focus on commits that made actual code changes. The navigation wraps around and respects all active filters. If no commits with file changes exist in the current view, an error message is shown. Implemented in `src/webview/panel/main.js` (`getCommitsWithStats`, `jumpToNextCommitWithStats`, `jumpToPreviousCommitWithStats` functions). The `jumpToNextCommitWithStats` and `jumpToPreviousCommitWithStats` webview actions are defined in `src/types.ts`.

- **Copy Commit Hash**: Press `Ctrl+Shift+H` / `Cmd+Shift+H` to copy the full commit hash of the focused or selected commit to clipboard. Hash chips in the commit list are also click-to-copy (using `navigator.clipboard`). The keyboard shortcut follows the same resolution pattern as copy message: `handleCopyHash` in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitHash` message. The message is handled by `handleCopyCommitHash` in `messageHandler.ts` which writes `commit.hash` to `vscode.env.clipboard` and shows a confirmation with the short hash. The `copyCommitHash` message type is defined in `src/types.ts`.

- **Copy Commit Info**: Press `Ctrl+Shift+I` / `Cmd+Shift+I` to copy the full commit information including hash, author (name and email), date, and commit message. The format is: `hash\nAuthor: name <email>\nDate: date\n\nmessage`. The `handleCopyInfo` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitInfo` message. The message is handled by `handleCopyCommitInfo` in `messageHandler.ts` which formats the commit data and writes it to `vscode.env.clipboard`. The `copyCommitInfo` message type is defined in `src/types.ts`.

- **Copy Cherry-Pick Command**: Press `Ctrl+Shift+P` / `Cmd+Shift+P` to copy a pre-formatted `git cherry-pick <hash>` command to the clipboard. The `handleCopyCherryPick` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCherryPickCommand` message. The message is handled by `handleCopyCherryPickCommand` in `messageHandler.ts` which formats the command and writes it to `vscode.env.clipboard`, showing a confirmation with the short hash. The `copyCherryPickCommand` message type is defined in `src/types.ts`. Also available in the commit row right-click context menu.

- **Copy Cherry-Pick Commands (Selected)**: Press `Ctrl+Alt+Shift+K` / `Cmd+Alt+Shift+K` to copy cherry-pick commands for multiple selected commits as a newline-separated list to the clipboard. When 2+ commits are selected, copies a command for each commit in display order (e.g., `git cherry-pick hash1\ngit cherry-pick hash2`). Falls back to single-commit cherry-pick behavior when 0 or 1 commit is selected. The `handleCopySelectedCherryPickCommands` function in `main.js` gets selected hashes and sends a `copySelectedCherryPickCommands` message. The message is handled by `handleCopySelectedCherryPickCommands` in `messageHandler.ts` which joins commands with newlines and writes to clipboard, showing confirmation with count. The `copySelectedCherryPickCommands` message type and webview action are defined in `src/types.ts`. Also available in the commit row right-click context menu (shown when 2+ commits are selected).

- **Copy Revert Command**: Press `Ctrl+Shift+U` / `Cmd+Shift+U` to copy a pre-formatted `git revert <hash>` command to the clipboard. The `handleCopyRevert` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyRevertCommand` message. The message is handled by `handleCopyRevertCommand` in `messageHandler.ts` which formats the command and writes it to `vscode.env.clipboard`, showing a confirmation with the short hash. The `copyRevertCommand` message type is defined in `src/types.ts`. Also available in the commit row right-click context menu with a ↩️ icon.

- **Copy git show Command**: Press `Ctrl+Alt+V` / `Cmd+Alt+V` to copy a pre-formatted `git show <hash>` command to the clipboard. The `handleCopyShowCommand` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyShowCommand` message. The message is handled by `handleCopyShowCommand` in `messageHandler.ts` which formats the command and writes it to `vscode.env.clipboard`, showing a confirmation with the short hash. Also available in the commit row right-click context menu with a 👁️ icon. The `copyShowCommand` message type and `copyShowCommand` webview action are defined in `src/types.ts`.

- **Copy Commit as Patch**: Press `Ctrl+Shift+E` / `Cmd+Shift+E` to copy the commit as a unified diff patch (with git headers) to the clipboard. The patch is generated using `git format-patch -1 --stdout <hash>` via the `getCommitPatch()` function in `gitService.ts`. The patch includes proper headers (`From`, `Date`, `Subject`) and can be applied using `git apply` or `git am`. The `handleCopyPatch` function in `main.js` resolves the target commit and sends a `copyCommitPatch` message. The message is handled by `handleCopyCommitPatch` in `messageHandler.ts` which writes the patch to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 🩹 icon.

- **Copy Commit URL**: Press `Ctrl+Shift+L` / `Cmd+Shift+L` to copy the web URL for the focused or selected commit to the clipboard. The URL points to the commit page on your git hosting platform (GitHub, GitLab, Bitbucket, or Azure DevOps). The `handleCopyUrl` function in `main.js` resolves the target commit and sends a `copyCommitUrl` message. The message is handled by `handleCopyCommitUrl` in `messageHandler.ts` which generates the URL using `getCommitUrl()` from `gitService.ts`. The `getCommitUrl()` function auto-detects the git platform from the remote URL and generates the correct commit URL: GitHub uses `/{owner}/{repo}/commit/{shortHash}`, GitLab uses `/{owner}/{repo}/-/commit/{shortHash}`, Bitbucket uses `/{owner}/{repo}/commits/{shortHash}`, and Azure DevOps uses `/{org}/{project}/_git/{repo}/commit/{shortHash}`. Shows "No git remote configured" when no remote is set, and "Unable to detect git platform" when the platform is not supported. The confirmation message shows the short hash (7 characters). Also available in the commit row right-click context menu. The `copyCommitUrl` message type and `copyCommitUrl` webview action are defined in `src/types.ts`.

- **Open Commit URL in Browser**: Press `Ctrl+K Ctrl+O` / `Cmd+K Cmd+O` to open the commit page directly in your default browser. The `handleOpenUrl` function in `main.js` resolves the target commit and sends an `openCommitUrl` message. The message is handled by `handleOpenCommitUrl` in `messageHandler.ts` which generates the URL using `getCommitUrl()` from `gitService.ts` and opens it with `vscode.env.openExternal(vscode.Uri.parse(url))`. Shows "Unable to generate commit URL" when no remote is configured or the platform is unsupported. Also available in the commit row right-click context menu with a 🌐 icon. The `openCommitUrl` message type and `openCommitUrl` webview action are defined in `src/types.ts`.

- **SSH URL with Custom Port Support**: The extension supports standard SSH URLs with custom ports (`ssh://git@host:port/owner/repo.git`). This is important for self-hosted GitLab/GitHub instances that use non-standard SSH ports (e.g., port 22 blocked, using 443 or 2222 instead). The `parseRemoteUrl` function in `gitService.ts` handles these URLs by extracting the host, port (optional), owner, and repo, then generating web URLs using the base HTTPS URL (port is excluded from web URLs as git hosting platforms don't use custom ports for web access). Supported formats include `ssh://git@host:port/owner/repo.git` and `ssh://host/owner/repo.git` (without git@ user). The pattern is checked after Azure DevOps SSH patterns but before the general SCP-like SSH pattern to ensure correct URL parsing. Implementation is in `src/git/gitService.ts` (`parseRemoteUrl` function).

- **Copy as Platform Mention**: Press `Ctrl+Shift+@` / `Cmd+Shift+@` to copy the commit in platform-specific mention format (e.g., `owner/repo@1b55bc0`). This format is used by GitHub/GitLab/Bitbucket/Azure DevOps for referencing commits in issues, pull requests, and discussions. The `handleCopyMention` function in `main.js` resolves the target commit and sends a `copyCommitMention` message. The message is handled by `handleCopyCommitMention` in `messageHandler.ts` which uses existing platform detection from `getRemoteUrl()` and `parseRemoteUrl()` in `gitService.ts` to extract owner and repo, then formats the mention as `{owner}/{repo}@{shortHash}`. Shows "No git remote configured" when no remote is set, and "Unable to detect git platform" when the platform is not supported. Also available in the commit row right-click context menu with a 📢 icon. The `copyCommitMention` message type and `copyCommitMention` webview action are defined in `src/types.ts`.

- **Copy Commit Reference**: Press `Ctrl+Shift+]` / `Cmd+Shift+]` to copy the commit in canonical Git reference format (`refs/commit/<hash>`). This is useful for Git submodule configurations, Git notes references, portable commit references in scripts, and Git blame references. The `handleCopyRef` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitRef` message. The message is handled by `handleCopyCommitRef` in `messageHandler.ts` which formats the reference as `refs/commit/${hash}` and writes it to `vscode.env.clipboard`. Shows a confirmation message with the short hash. Also available in the commit row right-click context menu with a 🔗 icon. The `copyCommitRef` message type and `copyCommitRef` webview action are defined in `src/types.ts`.

- **Copy Branch Name**: Press `Ctrl+Alt+B` / `Cmd+Alt+B` to copy the current branch name to the clipboard. The branch badge in the commit detail header is also clickable to copy the branch name. Also available in the commit row right-click context menu. The `handleCopyBranchName` function in `main.js` sends a `copyBranchName` message. The message is handled by `handleCopyBranchName` in `messageHandler.ts` which reads the branch from `panel.getBranch()` and writes it to `vscode.env.clipboard`. The branch is stored in the `_branch` field of `GitHistoryPanel` during `loadData()`. A confirmation message showing the branch name is displayed.

- **Copy Branch URL**: Press `Ctrl+Alt+U` / `Cmd+Alt+U` to copy the remote URL for the current branch to the clipboard. The `handleCopyBranchUrl` function in `main.js` sends a `copyBranchUrl` message. The message is handled by `handleCopyBranchUrl` in `messageHandler.ts` which reads the branch from `panel.getBranch()` and generates the URL using `getBranchUrl()` from `gitService.ts`. The `getBranchUrl()` function auto-detects the git platform (GitHub, GitLab, Bitbucket, Azure DevOps) from the remote URL and generates the correct branch URL: GitHub uses `/{owner}/{repo}/tree/{branch}`, GitLab uses `/{owner}/{repo}/-/tree/{branch}`, Bitbucket uses `/{owner}/{repo}/src/{branch}`, and Azure DevOps uses `/{org}/{project}/_git/{repo}?version=GB{branch}`. Shows "No branch detected" when no branch is available, and "Unable to generate branch URL" when no remote is configured or the platform is unsupported. Also available in the commit row right-click context menu. The `copyBranchUrl` message type and `copyBranchUrl` webview action are defined in `src/types.ts`.

- **Copy Remote URL**: Press `Ctrl+Alt+O` / `Cmd+Alt+O` to copy the raw git remote URL (e.g., `https://github.com/user/repo.git` or `git@github.com:user/repo.git`) to the clipboard. Useful for CI/CD scripts and sharing the repo URL with team members. The `handleCopyRemoteUrl` function in `main.js` sends a `copyRemoteUrl` message. The message is handled by `handleCopyRemoteUrl` in `messageHandler.ts` which uses `getRemoteUrl()` from `gitService.ts` to fetch the remote URL and writes it to `vscode.env.clipboard`. Shows "No git remote configured" when no remote is set. Also available in the commit row right-click context menu. The `copyRemoteUrl` message type and `copyRemoteUrl` webview action are defined in `src/types.ts`.

- **Copy Relative File Path**: Press `Ctrl+Alt+L` / `Cmd+Alt+L` to copy the file path relative to the git repository root. This is useful for documentation, code reviews, and bug reports where you want portable file references without system-specific paths (e.g., `src/webview/panel/main.js` instead of `/home/user/projects/repo/src/webview/panel/main.js`). The `handleCopyRelativePath` function in `main.js` sends a `copyRelativePath` message. The message is handled by `handleCopyRelativePath` in `messageHandler.ts` which uses `path.relative(cwd, filePath)` to compute the relative path and writes it to `vscode.env.clipboard`. Also available in the file context menu with right-click on any file in the changed files list. The `copyRelativePath` message type and `copyRelativePath` webview action are defined in `src/types.ts`.

- **Copy File Extension**: Press `Ctrl+Alt+E` / `Cmd+Alt+E` to copy just the file extension to clipboard (e.g., "ts" from "main.ts"). Useful for documentation and configuration. The `handleCopyExtension` function in `main.js` sends a `copyFileExtension` message. The message is handled by `handleCopyFileExtension` in `messageHandler.ts` which uses `path.extname(filePath).replace(/^\./, '')` to extract the extension without the leading dot and writes it to `vscode.env.clipboard`. Shows "no extension" for files without an extension. Also available in the file context menu with right-click on any file in the changed files list. The `copyFileExtension` message type and `copyFileExtension` webview action are defined in `src/types.ts`.

- **Copy File Path with Hash**: Press `Ctrl+Alt+Shift+B` / `Cmd+Alt+Shift+B` to copy the file path with the commit short hash as a prefix (e.g., `a1b2c3d:src/main.js`). This format is useful for referencing specific file versions in code reviews, bug reports, and documentation. The `handleCopyFilePathWithHash` function in `main.js` sends a `copyFilePathWithHash` message with the file path and commit hash. The message is handled by `handleCopyFilePathWithHash` in `messageHandler.ts` which formats the output as `{shortHash}:{filePath}` and writes it to `vscode.env.clipboard`. Shows a confirmation message with the truncated path if it's too long. Also available in the file context menu with a 🔗 icon. The `copyFilePathWithHash` message type and `copyFilePathWithHash` webview action are defined in `src/types.ts`.

- **Reveal File in Explorer**: Press `Ctrl+Alt+Shift+E` / `Cmd+Alt+Shift+E` to open the selected file in your system's default file explorer. This is useful for quickly locating files on disk, attaching files to emails, or performing file system operations outside of VS Code. The `handleRevealFileInExplorer` function in `main.js` sends a `revealFileInExplorer` message with the file path. The message is handled by `handleRevealFileInExplorer` in `messageHandler.ts` which constructs an absolute path using `path.join(cwd, filePath)` and opens it with `vscode.env.openExternal(vscode.Uri.file(absolutePath))`. Shows a confirmation message with the file name on success. Also available in the file context menu with a 📂 icon. The `revealFileInExplorer` message type and `revealFileInExplorer` webview action are defined in `src/types.ts`.

- **Copy File Content**: Press `Ctrl+Alt+C` / `Cmd+Alt+C` to copy the full content of a file at the selected commit to the clipboard. This is useful for saving code snapshots, comparing file contents across commits, or extracting file content at specific points in history. The `handleCopyFileContent` function in `main.js` sends a `copyFileContent` message with the file path and commit hash. The message is handled by `handleCopyFileContent` in `messageHandler.ts` which uses `getFileContentAtCommit()` from `gitService.ts` to fetch the file content via `git show` and writes it to `vscode.env.clipboard`. Shows a confirmation message with the file name and short hash. Also available in the file context menu with right-click on any file in the changed files list. The `copyFileContent` message type and `copyFileContent` webview action are defined in `src/types.ts`.

- **Copy File Permalink**: Press `Ctrl+Alt+Shift+U` / `Cmd+Alt+Shift+U` to copy a permanent web URL for the selected file at the current commit. This generates a browseable link to the file version on your git hosting platform (GitHub, GitLab, Bitbucket, or Azure DevOps). Useful for code reviews, bug reports, and sharing specific file versions. The URL format is platform-specific: GitHub uses `/blob/{hash}/path`, GitLab uses `/-/blob/{hash}/path`, Bitbucket uses `/src/{hash}/path`, and Azure DevOps uses `?path=%2F{path}&version={hash}`. Shows "Unable to generate file URL" when no remote is configured or the platform is unsupported. Also available in the file context menu with a 🔗 icon. The `handleCopyFileUrl` function in `main.js` sends a `copyFileUrl` message with the file path and commit hash. The message is handled by `handleCopyFileUrl` in `messageHandler.ts` which uses `getFileUrl()` from `gitService.ts` to generate the platform-specific URL. The `copyFileUrl` message type and `copyFileUrl` webview action are defined in `src/types.ts`.

- **Copy All File Permalinks**: Press `Ctrl+Shift+Alt+U` / `Cmd+Shift+Alt+U` to copy permanent web URLs for all files changed in a commit as a newline-separated list. Useful for code reviews and bug reports where multiple file links need to be shared at once. The `handleCopyAllFilePermalinks` function in `main.js` resolves the target commit and sends a `copyAllFilePermalinks` message with the hash. The message is handled by `handleCopyAllFilePermalinks` in `messageHandler.ts` which gets the commit files via `getCommitFiles()`, generates a permalink for each file via `getFileUrl()`, joins them with newlines, and writes to clipboard. Shows a confirmation with the file count (singular/plural). Shows "Unable to generate file permalinks. No remote configured?" when no remote is set. Also available in the changed files context menu. The `copyAllFilePermalinks` message type and `copyAllFilePermalinks` webview action are defined in `src/types.ts`.

- **Open File Permalink in Browser**: Press `Ctrl+K Ctrl+P` / `Cmd+K Cmd+P` to open the file permalink directly in your default browser. The `handleOpenFileUrl` function in `main.js` resolves the target commit and selected file, then sends an `openFileUrl` message with the file path and commit hash. The message is handled by `handleOpenFileUrl` in `messageHandler.ts` which generates the URL using `getFileUrl()` from `gitService.ts` and opens it with `vscode.env.openExternal(vscode.Uri.parse(url))`. Shows "Unable to generate file URL" when no remote is configured or the platform is unsupported. Also available in the file context menu with a 🌐 icon. The `openFileUrl` message type and `openFileUrl` webview action are defined in `src/types.ts`.

- **Copy as Git Describe**: Press `Ctrl+Alt+G` / `Cmd+Alt+G` to copy the git describe output for the selected commit. This outputs the nearest tag, number of commits since that tag, and abbreviated hash (e.g., `v1.2.3-45-gabcdef1`). If no tags exist, it falls back to the abbreviated hash. Useful for release notes, bug reports, and build scripts. The command uses `git describe --always --long --tags <hash>`. Also available in the commit row right-click context menu with a 🏷️ icon.

- **Copy Tags**: Press `Ctrl+Shift+G` / `Cmd+Shift+G` to copy all tags of the focused or selected commit as a comma-separated string to the clipboard. Tags are parsed from git's `%d` decorations field and displayed as badges on commits. The `handleCopyTags` function in `main.js` resolves the target commit and sends a `copyTags` message. The message is handled by `handleCopyTags` in `messageHandler.ts` which reads `commit.tags` and writes them to `vscode.env.clipboard` joined by ", ". If no tags exist, shows "No tags on commit" message. Also available in the commit row right-click context menu.

- **Copy Author Email**: Press `Ctrl+Shift+A` / `Cmd+Shift+A` to copy the author email address of the focused or selected commit to clipboard. The email address is also available via right-click context menu. The `handleCopyAuthorEmail` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyAuthorEmail` message. The message is handled by `handleCopyAuthorEmail` in `messageHandler.ts` which writes `commit.email` to `vscode.env.clipboard`. The `copyAuthorEmail` message type is defined in `src/types.ts`.

- **Copy Author Name**: Press `Ctrl+Shift+N` / `Cmd+Shift+N` to copy the author name of the focused or selected commit to clipboard. The author name is also available via right-click context menu with a 👤 icon. The `handleCopyAuthorName` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyAuthorName` message. The message is handled by `handleCopyAuthorName` in `messageHandler.ts` which writes `commit.author` to `vscode.env.clipboard`. The `copyAuthorName` message type is defined in `src/types.ts`.

- **Copy Author in Git Format**: Press `Ctrl+Alt+Shift+A` / `Cmd+Alt+Shift+A` to copy the commit author in standard git format (`Author Name <email>`). This format is required for Co-authored-by trailers in commit messages and is the standard git attribution format. The `handleCopyAuthorGitFormat` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyAuthorGitFormat` message. The message is handled by `handleCopyAuthorGitFormat` in `messageHandler.ts` which formats the author as `${commit.author} <${commit.email}>` and writes it to `vscode.env.clipboard`. The `copyAuthorGitFormat` message type and `copyAuthorGitFormat` webview action are defined in `src/types.ts`. Also available in the commit row right-click context menu.

- **Copy Author Initials**: Press `Ctrl+Alt+Shift+I` / `Cmd+Alt+Shift+I` to copy the author's initials to clipboard. Initials are extracted from the author name: two-part names use first and last initials (e.g., "John Doe" → "JD"), multi-part names use first and last initials (e.g., "John Middle Doe" → "JE"), and single-word names use the first two characters (e.g., "Single" → "SI"). Output is always uppercased. Useful for contributor lists, compact attribution in code reviews, and meeting notes. The `handleCopyAuthorInitials` function in `main.js` resolves the target commit and sends a `copyAuthorInitials` message. The message is handled by `handleCopyAuthorInitials` in `messageHandler.ts` which uses the same initials extraction logic as `getAuthorInitials()` and writes to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 🔤 icon. The `copyAuthorInitials` message type and `copyAuthorInitials` webview action are defined in `src/types.ts`.

- **Copy Committer Name**: Press `Ctrl+Alt+N` / `Cmd+Alt+N` to copy the committer name of the focused or selected commit to clipboard. The committer is the person who applied the commit (may differ from the author who wrote the code). Falls back to author name if committer information is not available. The `handleCopyCommitterName` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitterName` message. The message is handled by `handleCopyCommitterName` in `messageHandler.ts` which writes `commit.committer || commit.author` to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 👤 icon. The `copyCommitterName` message type is defined in `src/types.ts`.

- **Copy Committer Email**: Press `Ctrl+Alt+A` / `Cmd+Alt+A` to copy the committer email address of the focused or selected commit to clipboard. The committer is the person who applied the commit (may differ from the author who wrote the code). Falls back to author email if committer information is not available. The `handleCopyCommitterEmail` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitterEmail` message. The message is handled by `handleCopyCommitterEmail` in `messageHandler.ts` which writes `commit.committerEmail || commit.email` to `vscode.env.clipboard`. Also available in the commit row right-click context menu. The `copyCommitterEmail` message type is defined in `src/types.ts`.

- **Copy Signature Info**: Press `Ctrl+Shift+Alt+G` / `Cmd+Shift+Alt+G` to copy the GPG signature verification status for the focused or selected commit to clipboard. For commits with valid GPG signatures, copies "Signature: Verified" followed by the signer name on a new line (e.g., "Signer: Alice <alice@example.com>"). For unsigned commits or commits with invalid signatures, copies "Signature: Not Verified". The `handleCopySignatureInfo` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copySignatureInfo` message. The message is handled by `handleCopySignatureInfo` in `messageHandler.ts` which checks `commit.signature?.verified` and `commit.signature.signer` to build the output, then writes it to `vscode.env.clipboard`. Shows "Copied signature info" confirmation. Also available in the commit row right-click context menu with a 🔐 icon. The `copySignatureInfo` message type is defined in `src/types.ts`.

- **Copy Parent Hash**: Press `Ctrl+Shift+V` / `Cmd+Shift+V` to copy the first parent hash of the focused or selected commit to clipboard. The parent hash is also available via right-click context menu with a ⧁ icon. The `handleCopyParentHash` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyParentHash` message. The message is handled by `handleCopyParentHash` in `messageHandler.ts` which checks for root commits (no parent) and writes `commit.parentHashes[0]` to `vscode.env.clipboard`, showing a confirmation with the short hash. For root commits (no parent), an error message "Root commit has no parent" is shown. The `copyParentHash` message type is defined in `src/types.ts`.

- **Copy Short Hash**: Press `Ctrl+Shift+7` / `Cmd+Shift+7` to copy the 7-character short hash of the focused or selected commit to clipboard (mnemonic: 7 = 7 characters). The short hash is also available via right-click context menu with the `#7` icon. The `handleCopyShortHash` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyShortHash` message. The message is handled by `handleCopyShortHash` in `messageHandler.ts` which extracts the first 7 characters of the hash using `substring(0, 7)` and writes it to `vscode.env.clipboard`. The `copyShortHash` message type is defined in `src/types.ts`.

- **Copy Subject**: Press `Ctrl+Shift+6` / `Cmd+Shift+6` to copy only the commit subject (first line of the commit message) to clipboard. This is useful for referencing or sharing just the commit title without the body. The subject is also available via right-click context menu with the `📌` icon. The `handleCopySubject` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copySubject` message. The message is handled by `handleCopySubject` in `messageHandler.ts` which writes `commit.message` to `vscode.env.clipboard`. The confirmation message truncates long subjects to 50 characters. The `copySubject` message type is defined in `src/types.ts`.

- **Copy Subject with Author**: Copy the commit subject together with the author name via the right-click context menu ("📝 Copy subject with author") or keyboard shortcut `Ctrl+Alt+Shift+M` / `Cmd+Alt+Shift+M`. The format is `{subject} - {author}`. This is useful for code reviews, team discussions, and changelogs where you want attribution without hash/date clutter. The `handleCopySubjectWithAuthor` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copySubjectWithAuthor` message. The message is handled by `handleCopySubjectWithAuthor` in `messageHandler.ts` which formats the output as `${commit.message} - ${commit.author}` and writes it to `vscode.env.clipboard`. The confirmation message truncates long output to 50 characters. The `copySubjectWithAuthor` message type and `copySubjectWithAuthor` webview action are defined in `src/types.ts`.

- **Copy Diff Stat Summary**: Press `Ctrl+Shift+9` / `Cmd+Shift+9` to copy just the diff stat summary (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)") to clipboard. This is useful for changelogs, commit descriptions, and quick references. Uses singular forms when counts are 1 (e.g., "1 file changed, 1 insertion(+), 1 deletion(-)"). Shows "No statistics available for this commit" when the commit has no stats. The `handleCopyDiffStatSummary` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyDiffStatSummary` message. The message is handled by `handleCopyDiffStatSummary` in `messageHandler.ts` which formats the stat summary with proper singular/plural forms and writes to `vscode.env.clipboard`. Also available via right-click context menu with the `📊` icon.

- **Copy File Stats**: Press `Ctrl+Shift+Alt+F` / `Cmd+Shift+Alt+F` to copy per-file statistics for a commit, showing insertions and deletions for each changed file. The output format is one file per line: `{path} | +{insertions}, -{deletions}` for regular files and `{path} | Binary` for binary files, followed by a summary line showing the total file count. This is useful for code reviews where you need to see which files changed most, changelogs that detail file-level impact, and quick analysis of commit scope. The `handleCopyFileStats` function in `main.js` resolves the target commit and sends a `copyFileStats` message. The message is handled by `handleCopyFileStats` in `messageHandler.ts` which calls `getFileStats()` from `gitService.ts` (using `git show --numstat --format=""`) to get per-file statistics, formats the output, and writes it to `vscode.env.clipboard`. Shows "No files changed in this commit" when the commit has no file changes. Also available in the commit row right-click context menu with a 📊 icon. The `copyFileStats` message type, `copyFileStats` webview action, and `FileStats` interface are defined in `src/types.ts`.

- **Copy Files Changed Count**: Press `F4` to copy just the number of files changed in a commit to clipboard. Outputs "N file" or "N files" (singular/plural). Useful for quick file count statistics without the full diff stat summary. Also available in the commit row right-click context menu.

- **Copy Commit Message with Stats**: Press `Ctrl+Alt+W` / `Cmd+Alt+W` to copy the commit message (subject and body) together with the diff stat summary. The format is: `{subject}\n\n{body}\n\n{stats}`. Useful for code reviews and pull request descriptions where both the message and statistics are needed. The `handleCopyCommitWithStats` function in `main.js` resolves the target commit and sends a `copyCommitWithStats` message. The message is handled by `handleCopyCommitWithStats` in `messageHandler.ts` which formats the output and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu. The `copyCommitWithStats` message type and `copyCommitWithStats` webview action are defined in `src/types.ts`.

- **Copy Full Commit Info with File Stats**: Press `Ctrl+Shift+Alt+I` / `Cmd+Shift+Alt+I` to copy the full commit metadata (hash, author, date, message) together with per-file statistics (insertions/deletions per file). The output format includes the commit header (hash, author with email, locale date), the full commit message indented with 4 spaces, a summary line (files changed, insertions, deletions), and per-file breakdown (`path | +X, -Y`). The `handleCopyFullCommitInfoWithFileStats` function in `main.js` resolves the target commit and sends a `copyFullCommitInfoWithFileStats` message. The message is handled by `handleCopyFullCommitInfoWithFileStats` in `messageHandler.ts` which uses `getFileStats()` from `gitService.ts` and the `formatFullInfoWithStats` helper to combine commit info and file stats, then writes to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📋 icon. The `copyFullCommitInfoWithFileStats` message type and webview action are defined in `src/types.ts`.

- **Copy Combined Diff**: Press `Ctrl+Alt+D` / `Cmd+Alt+D` to copy the combined diff output for multiple selected commits (Ctrl+click). This is useful for reviewing all changes across multiple commits in one paste. The `handleCopyCombinedDiff` function in `main.js` sends a `copyCombinedDiff` message with the selected hashes. The message is handled by `handleCopyCombinedDiff` in `messageHandler.ts` which uses `getCombinedDiff()` to generate the diff and writes it to clipboard. Requires at least 2 commits to be selected.

- **Copy Range Diff**: Press `Ctrl+Shift+Alt+R` / `Cmd+Shift+Alt+R` to copy the range diff between two commits (Shift+click selection). This copies the diff between the first and last selected commits in a range. The `handleCopyRangeDiff` function in `main.js` sends a `copyRangeDiff` message with the `fromHash` and `toHash`. The message is handled by `handleCopyRangeDiff` in `messageHandler.ts` which uses `getCommitRangeDiff()` to generate the diff and writes it to clipboard. Requires a range selection.

- **Copy as Oneline**: Press `Ctrl+Shift+Y` / `Cmd+Shift+Y` to copy the commit in `git log --oneline` format (`{shortHash} {subject}`) to clipboard. Example output: `a1b2c3d Fix authentication bug`. This is useful for sharing commits in chat, creating changelog entries, or quick reference in a standardized git format. The `handleCopyOneline` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyOneline` message. The message is handled by `handleCopyOneline` in `messageHandler.ts` which formats the string as `${commit.shortHash} ${commit.message}` and writes it to `vscode.env.clipboard`. The confirmation message truncates long messages to 50 characters. Also available in the commit row right-click context menu with the `≡` icon. The `copyOneline` message type is defined in `src/types.ts`.

- **Copy as Compact**: Press `Ctrl+Shift+.` / `Cmd+Shift+.` to copy the commit in a compact single-line format (`{shortHash} - {subject} ({author}, {relativeDate})`) to clipboard. Example output: `a1b2c3d - Fix authentication bug (John Doe, 2 days ago)`. This is useful for quick sharing in team chat, code review summaries, and release note snippets. The `handleCopyCompact` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitCompact` message. The message is handled by `handleCopyCompact` in `messageHandler.ts` which formats the string using `formatRelativeTime()` from `blameService.ts` and writes it to `vscode.env.clipboard`. The confirmation message truncates long messages to 50 characters. Also available in the commit row right-click context menu with a 📝 icon. The `copyCommitCompact` message type and `copyCompact` webview action are defined in `src/types.ts`.

- **Copy Commit Body**: Press `Ctrl+Shift+Z` / `Cmd+Shift+Z` to copy just the commit body (the multi-line description after the subject line) to clipboard. The `handleCopyCommitBody` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitBody` message. The message is handled by `handleCopyCommitBody` in `messageHandler.ts` which extracts the body from `fullMessage` after the first newline, trims it, and writes it to `vscode.env.clipboard`. Shows "Commit has no body" for commits with single-line messages or empty bodies. The confirmation message truncates long bodies to 50 characters. Also available in the commit row right-click context menu with a 📄 icon. The `copyCommitBody` message type and `copyCommitBody` webview action are defined in `src/types.ts`.

- **Copy Commit as Markdown**: Press `Ctrl+Alt+M` / `Cmd+Alt+M` to copy the focused or selected commit as formatted Markdown. The format includes commit message with heading, author, date (relative + absolute), stats, tags, and body. Useful for changelogs, release notes, and documentation. The `handleCopyMarkdown` function in `main.js` resolves the target commit and sends a `copyCommitMarkdown` message. The message is handled by `handleCopyCommitMarkdown` in `messageHandler.ts` which uses the `formatCommitAsMarkdown` helper to format the commit data and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📜 icon. The `copyCommitMarkdown` message type and `copyCommitMarkdown` webview action are defined in `src/types.ts`.

- **Copy Commit as JSON**: Press `Ctrl+Alt+J` / `Cmd+Alt+J` to copy the focused or selected commit as formatted JSON with all available commit data. The JSON includes `hash` (full 40-character), `shortHash` (7-character), `author` (object with `name` and `email`), `date` (ISO 8601 formatted), `message` (subject), `body` (null if none), `parentHashes` (empty array for root commits), `tags` (empty array if none), and `stats` (object with `filesChanged`, `insertions`, `deletions` or null). Uses 2-space indentation for pretty printing. Useful for programmatic access, API integrations, data analysis, and automation workflows. The `handleCopyJson` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitJson` message. The message is handled by `handleCopyCommitJson` in `messageHandler.ts` which extracts the body from `fullMessage` (splitting on first newline), builds the JSON object, uses `JSON.stringify(commitJson, null, 2)` for pretty printing, and writes it to `vscode.env.clipboard`. The confirmation message truncates long subjects to 50 characters. Also available in the commit row right-click context menu with a {} icon. The `copyCommitJson` message type and `copyCommitJson` webview action are defined in `src/types.ts`.

- **Copy Commit as HTML**: Press `Ctrl+Alt+H` / `Cmd+Alt+H` to copy the focused or selected commit as styled HTML with inline CSS for portability. The HTML includes the commit subject, hash (as a code element), author with email, date (locale format with ISO title tooltip), stats (with green insertions and red deletions), tags (as colored badge spans), and commit body (with HTML-escaped content). Uses inline styles for email and wiki compatibility. The `handleCopyHtml` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitHtml` message. The message is handled by `handleCopyCommitHtml` in `messageHandler.ts` which uses the `formatCommitAsHtml` helper to generate styled HTML and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 🌐 icon. The `copyCommitHtml` message type and `copyCommitHtml` webview action are defined in `src/types.ts`.

- **Copy Commit as reStructuredText**: Press `Ctrl+Alt+Y` / `Cmd+Alt+Y` to copy the focused or selected commit as reStructuredText (ReST) format. The format includes commit message with `=` underline, `:Author:`, `:Date:`, and `:Hash:` field lists, statistics section with bold text, tags, and body section with `-` underline. Useful for Python projects using Sphinx documentation and ReST-based docs. The `handleCopyRest` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitRest` message. The message is handled by `handleCopyCommitRest` in `messageHandler.ts` which uses the `formatCommitAsRest` helper to format the commit data and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📜 icon. The `copyCommitRest` message type and `copyCommitRest` webview action are defined in `src/types.ts`.

- **Copy Commit as Jira Format**: Press `Ctrl+Alt+Shift+J` / `Cmd+Alt+Shift+J` to copy the focused or selected commit in Jira/Confluence markup format. Uses Jira's text formatting syntax (`h4.` for headings, `||` for table headers, `|` for table cells, `*text*` for emphasis). The format includes commit hash and subject as an `h4.` heading, author info table (Author, Date, Email), stats with `*Stats:*` markup, tags with `*Tags:*` markup, and commit body with `h5.` heading. Useful for pasting commit details into Jira tickets, Confluence pages, and other Atlassian products. The `handleCopyJira` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitJira` message. The message is handled by `handleCopyCommitJira` in `messageHandler.ts` which uses the `formatCommitAsJira` helper to format the commit data and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📋 icon. The `copyCommitJira` message type and `copyCommitJira` webview action are defined in `src/types.ts`.

- **Copy Commit as YAML**: Press `Ctrl+Alt+Shift+Y` / `Cmd+Alt+Shift+Y` to copy the focused or selected commit as YAML format. Useful for CI/CD pipelines (GitHub Actions, GitLab CI), configuration files (Kubernetes, Docker Compose, Ansible), and DevOps automation workflows. The YAML includes structured data for `hash`, `shortHash`, `author` (name, email), `committer` (name, email, only when different from author), `date` (ISO 8601), `message`, `body` (using `|` literal block style for multi-line content, `null` when absent), `parentHashes` (array, empty for root commits), `tags` (array, empty when none), and `stats` (object with `filesChanged`, `insertions`, `deletions`, or `null`). The `handleCopyYaml` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitYaml` message. The message is handled by `handleCopyCommitYaml` in `messageHandler.ts` which uses the `formatCommitAsYaml` helper to format the commit data and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📄 icon. The `copyCommitYaml` message type and `copyCommitYaml` webview action are defined in `src/types.ts`.

- **Copy Commit as BBCode**: Press `Ctrl+Alt+Shift+B` / `Cmd+Alt+Shift+B` to copy the focused or selected commit as BBCode (Bulletin Board Code) format. BBCode is used by many forum platforms (vBulletin, XenForo, phpBB, Invision, Discourse with BBCode plugin). The format includes commit hash and subject, author with email, date, statistics, tags, and commit body. Headers use `[b]bold[/b]` tags for visibility. Useful for sharing commit information on gaming forums, technical discussion boards, and community platforms that don't support Markdown. The `handleCopyBbcode` function in `main.js` resolves the target commit and sends a `copyCommitBbcode` message. The message is handled by `handleCopyCommitBbcode` in `messageHandler.ts` which uses `formatCommitAsBbcode()` to format the commit data and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu. The `copyCommitBbcode` message type and `copyCommitBbcode` webview action are defined in `src/types.ts`.

- **Copy Commit as CSV**: Press `Ctrl+Alt+Shift+C` / `Cmd+Alt+Shift+C` to copy the focused or selected commit as CSV (Comma-Separated Values) format. The CSV includes a header row and one data row with fields: Hash, Short Hash, Author, Email, Date, Message, Tags, Files Changed, Insertions, Deletions. Fields containing commas, quotes, or newlines are properly escaped using the existing `escapeCsvField` helper. Tags are joined with semicolon separator. Stats default to '0' when unavailable. Useful for pasting commit data into spreadsheets, databases, and data analysis tools. The `handleCopyCsv` function in `main.js` resolves the target commit and sends a `copyCommitCsv` message. The message is handled by `handleCopyCommitCsv` in `messageHandler.ts` which formats the CSV with headers and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📊 icon. The `copyCommitCsv` message type and `copyCommitCsv` webview action are defined in `src/types.ts`.

- **Copy Co-Authors**: Press `Ctrl+Shift+K` / `Cmd+Shift+K` to copy co-authors from the commit message to clipboard. This extracts "Co-authored-by:" trailers following the Git convention (format: `Co-authored-by: Name <email>`). Multiple co-authors are copied as newline-separated entries in the format "Name <email>". If no co-authors are found, a "No co-authors on commit" message is shown. The `handleCopyCoAuthors` function in `main.js` resolves the target commit and sends a `copyCoAuthors` message. The message is handled by `handleCopyCoAuthors` in `messageHandler.ts` which uses the `extractCoAuthors` helper to parse the commit body for co-author trailers. Also available in the commit row right-click context menu with a 👥 icon.

- **Copy Commit Trailers**: Press `Ctrl+Shift+Alt+3` / `Cmd+Shift+Alt+3` to copy all commit trailers to clipboard. Trailers are structured metadata in "Key: Value" format at the end of commit messages (e.g., `Fixes: #123`, `Reviewed-by: Alice <alice@example.com>`, `Signed-off-by: Bob <bob@example.com>`). The `handleCopyTrailers` function in `main.js` resolves the target commit and sends a `copyTrailers` message. The message is handled by `handleCopyTrailers` in `messageHandler.ts` which uses the `extractTrailers` helper to parse the commit body for all trailers. Shows "No trailers on commit" when no trailers are found. Also available in the commit row right-click context menu with a 📋 icon. The `copyTrailers` message type and `copyTrailers` webview action are defined in `src/types.ts`.

- **Copy Issue References**: Press `Ctrl+Shift+Alt+5` / `Cmd+Shift+Alt+5` to copy issue/PR references from commit trailers to clipboard. Extracts Fixes, Closes, Resolves, Related-to, Refs, References, See, and Issue trailers. The output is a comma-separated list of reference values (e.g., `#123, #456`). The `handleCopyFixesReferences` function in `main.js` resolves the target commit and sends a `copyFixesReferences` message. The message is handled by `handleCopyFixesReferences` in `messageHandler.ts` which uses `extractTrailers` and filters for issue reference keys. Shows "No issue references found in trailers" when none are found. Also available in the commit row right-click context menu with a 🔗 icon. The `copyFixesReferences` message type and webview action are defined in `src/types.ts`.

- **Copy Reviewers**: Press `Ctrl+Shift+Alt+4` / `Cmd+Shift+Alt+4` to copy reviewer information from commit trailers to clipboard. Extracts Reviewed-by, Acked-by, Tested-by, and Signed-off-by trailers. The output is a comma-separated list (e.g., `Alice <alice@example.com>, Bob <bob@example.com>`). The `handleCopyReviewedBy` function in `main.js` resolves the target commit and sends a `copyReviewedBy` message. The message is handled by `handleCopyReviewedBy` in `messageHandler.ts` which uses `extractTrailers` and filters for review keys. Shows "No review/acknowledgment trailers found" when none are found. Also available in the commit row right-click context menu with a ✅ icon. The `copyReviewedBy` message type and webview action are defined in `src/types.ts`.

- **Copy Commit Date**: Press `Ctrl+Shift+T` / `Cmd+Shift+T` to copy the commit date in ISO 8601 format (e.g., `2026-05-11T10:30:45.000Z`). The `handleCopyCommitDate` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitDate` message. The message is handled by `handleCopyCommitDate` in `messageHandler.ts` which formats the date using `new Date(commit.date).toISOString()` and writes it to `vscode.env.clipboard`. The date is also available via right-click context menu with the `🕐` icon. The `copyCommitDate` message type is defined in `src/types.ts`.

- **Copy Commit Short Date**: Press `Ctrl+Shift+J` / `Cmd+Shift+J` to copy the commit date in short format (YYYY-MM-DD, e.g., `2026-05-11`). This format is widely used for changelog entries, file naming conventions, report headers, and daily commit summaries. The `handleCopyCommitShortDate` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitShortDate` message. The message is handled by `handleCopyCommitShortDate` in `messageHandler.ts` which formats the date as `YYYY-MM-DD` using `getFullYear()`, `getMonth()` (with zero-padding), and `getDate()` (with zero-padding), then writes it to `vscode.env.clipboard`. The short date is also available via right-click context menu with the `📅` icon. The `copyCommitShortDate` message type and `copyCommitShortDate` webview action are defined in `src/types.ts`.

- **Copy Relative Date**: Press `Ctrl+Shift+8` / `Cmd+Shift+8` to copy the commit date in the same human-readable relative format displayed in the UI (e.g., "Today 2:30 PM", "Yesterday 3:45 PM", "3 days ago", "2 weeks ago"). This complements the ISO format from `Ctrl+Shift+T` for more readable output. The `handleCopyRelativeDate` function in `main.js` resolves the target commit and sends a `copyRelativeDate` message. The message is handled by `handleCopyRelativeDate` in `messageHandler.ts` which calculates the time difference between the commit date and now, then formats it as "Today HH:MM", "Yesterday HH:MM", "X days ago", "X weeks ago", or absolute date for older commits. The relative date is also available via right-click context menu with the `🕒` icon. The `copyRelativeDate` message type and `copyRelativeDate` webview action are defined in `src/types.ts`.

- **Copy Commit Unix Timestamp**: Press `Ctrl+Shift+2` / `Cmd+Shift+2` to copy the Unix timestamp (epoch seconds) for the selected commit. This outputs the number of seconds since January 1, 1970 (e.g., `1747049445`). Useful for CI/CD scripts, database inserts, and cross-platform date comparisons without timezone issues. The `handleCopyCommitTimestamp` function in `main.js` resolves the target commit and sends a `copyCommitTimestamp` message. The message is handled by `handleCopyCommitTimestamp` in `messageHandler.ts` which converts `commit.date` to Unix timestamp using `Math.floor(new Date(commit.date).getTime() / 1000)`. The timestamp is also available via right-click context menu with the `⏱️` icon. The `copyCommitTimestamp` message type and `copyCommitTimestamp` webview action are defined in `src/types.ts`.

- **Copy Selected Hashes**: Press `Ctrl+Shift+;` / `Cmd+Shift+;` to copy all selected commit hashes as a newline-separated list to the clipboard. When multiple commits are selected (2+), this copies all hashes in display order. Falls back to single hash copy behavior when 0 or 1 commit is selected. The `handleCopySelectedHashes` function in `main.js` handles the keyboard shortcut and context menu action, sending a `copySelectedHashes` message with an array of hashes. The message is handled by `handleCopySelectedHashes` in `messageHandler.ts` which joins hashes with newline and writes to clipboard. The `copySelectedHashes` message type and `copySelectedHashes` webview action are defined in `src/types.ts`. Also available in the commit row right-click context menu (only shown when multiple commits are selected).

- **Copy Selected Messages as Checklist**: Press `Ctrl+Alt+Z` / `Cmd+Alt+Z` to copy selected commit messages as a Markdown checklist format (`- [ ] message`) to the clipboard. Falls back to the focused commit when none are selected. When multiple commits are selected (2+), messages are formatted in display order. The `handleCopySelectedMessagesChecklist` function in `main.js` handles the keyboard shortcut and context menu action, sending a `copySelectedMessagesChecklist` message with an array of hashes. The message is handled by `handleCopySelectedMessagesChecklist` in `messageHandler.ts` which filters commits by hashes, formats each as `- [ ] c.message`, and writes to `vscode.env.clipboard`. The confirmation message uses singular/plural forms ("Copied 1 message as checklist" vs "Copied 3 messages as checklist"). Also available in the commit row right-click context menu (only shown when 2+ commits are selected). The `copySelectedMessagesChecklist` message type and `copySelectedMessagesChecklist` webview action are defined in `src/types.ts`.

- **Copy Selected Messages as Numbered List**: Press `Ctrl+Alt+Shift+Z` / `Cmd+Alt+Shift+Z` to copy selected commit messages as a numbered Markdown list (`1. message`) to the clipboard. Falls back to the focused commit when none are selected. When multiple commits are selected (2+), messages are formatted in display order with numbering starting at 1. The `handleCopySelectedMessagesNumbered` function in `main.js` handles the keyboard shortcut and context menu action, sending a `copySelectedMessagesNumbered` message with an array of hashes. The message is handled by `handleCopySelectedMessagesNumbered` in `messageHandler.ts` which filters commits by hashes, formats each as `{index + 1}. {message}`, and writes to `vscode.env.clipboard`. The confirmation message uses singular/plural forms ("Copied 1 message as numbered list" vs "Copied 3 messages as numbered list"). Useful for numbered release notes, meeting agendas, and ordered changelogs. Also available in the commit row right-click context menu (only shown when 2+ commits are selected). The `copySelectedMessagesNumbered` message type and `copySelectedMessagesNumbered` webview action are defined in `src/types.ts`.

- **Copy Selected Messages as Checklist with Author**: Press `Ctrl+Alt+Shift+C` / `Cmd+Alt+Shift+C` to copy selected commit messages as a Markdown checklist with author names (`- [ ] Author - message`) to the clipboard. Falls back to the focused commit when none are selected. When multiple commits are selected (2+), messages are formatted in display order. The `handleCopySelectedMessagesChecklistWithAuthor` function in `main.js` handles the keyboard shortcut and context menu action, sending a `copySelectedMessagesChecklistWithAuthor` message with an array of hashes. The message is handled by `handleCopySelectedMessagesChecklistWithAuthor` in `messageHandler.ts` which filters commits by hashes, formats each as `- [ ] c.author - c.message`, and writes to `vscode.env.clipboard`. Also available in the commit row right-click context menu (only shown when 2+ commits are selected). The `copySelectedMessagesChecklistWithAuthor` message type and webview action are defined in `src/types.ts`.

- **Copy Selected Messages as Numbered List with Author**: Press `Ctrl+Alt+Shift+N` / `Cmd+Alt+Shift+N` to copy selected commit messages as a numbered Markdown list with author names (`1. Author - message`) to the clipboard. Falls back to the focused commit when none are selected. When multiple commits are selected (2+), messages are formatted in display order with numbering starting at 1. The `handleCopySelectedMessagesNumberedWithAuthor` function in `main.js` handles the keyboard shortcut and context menu action, sending a `copySelectedMessagesNumberedWithAuthor` message with an array of hashes. The message is handled by `handleCopySelectedMessagesNumberedWithAuthor` in `messageHandler.ts` which filters commits by hashes, formats each as `{index + 1}. c.author - c.message`, and writes to `vscode.env.clipboard`. Also available in the commit row right-click context menu (only shown when 2+ commits are selected). The `copySelectedMessagesNumberedWithAuthor` message type and webview action are defined in `src/types.ts`.

- **Copy All Filtered Hashes**: Press `Ctrl+Shift+Alt+H` / `Cmd+Shift+Alt+H` to copy all commit hashes from the current filtered view as a newline-separated list to the clipboard. Unlike "Copy Selected Hashes", this copies all visible commits without requiring manual selection. Useful for batch cherry-pick operations, release notes generation, and bulk operations on filtered commit lists. The `handleCopyAllFilteredHashes` function in `main.js` resolves all commits via `getOrderedCommits(getFilteredCommits())`, maps them to hashes, and sends a `copyAllFilteredHashes` message. The message is handled by `handleCopyAllFilteredHashes` in `messageHandler.ts` which joins hashes with newline and writes to `vscode.env.clipboard`. Shows "No commits visible in current view" when no commits match the current filters. The confirmation message uses singular/plural forms ("Copied 1 filtered commit hash" vs "Copied 5 filtered commit hashes"). Also available in the commit row right-click context menu, showing the count of filtered commits in the label. The `copyAllFilteredHashes` message type and `copyAllFilteredHashes` webview action are defined in `src/types.ts`.

- **Copy All Filtered as Oneline**: Press `Ctrl+Shift+Alt+Y` / `Cmd+Shift+Alt+Y` to copy all currently visible commits in oneline format (`{shortHash} {subject}`) to clipboard. Unlike "Copy Selected Hashes", this copies all visible commits without requiring manual selection. Useful for changelogs, release notes, and sharing commit lists in a compact format. The `handleCopyAllFilteredAsOneline` function in `main.js` resolves all commits via `getOrderedCommits(getFilteredCommits())` and sends a `copyAllFilteredAsOneline` message. The message is handled by `handleCopyAllFilteredAsOneline` in `messageHandler.ts` which formats each commit as `{commit.shortHash} {commit.message}`, joins them with newlines, and writes to `vscode.env.clipboard`. Shows "No commits visible in current view" when no commits match the current filters. The confirmation message uses singular/plural forms ("Copied 1 commit as oneline" vs "Copied 5 commits as oneline"). Also available in the commit row right-click context menu, showing the count of filtered commits in the label. The `copyAllFilteredAsOneline` message type and `copyAllFilteredAsOneline` webview action are defined in `src/types.ts`.

- **Copy All Unique Authors**: Press `Ctrl+Shift+Alt+P` / `Cmd+Shift+Alt+P` to copy all unique authors from the currently filtered commits in Git format (`Name <email>`), sorted alphabetically and separated by newlines. Shows count of unique authors copied. Useful for crediting contributors in release notes, finding all contributors to a feature branch, team statistics, and adding "Contributors:" sections in documentation. The `handleCopyAllUniqueAuthors` function in `main.js` resolves all commits via `getOrderedCommits(getFilteredCommits())` and sends a `copyAllUniqueAuthors` message. The message is handled by `handleCopyAllUniqueAuthors` in `messageHandler.ts` which extracts unique authors (deduplicated by `Name <email>` format), sorts them alphabetically, and writes to `vscode.env.clipboard`. Shows "No commits visible in current view" when no commits match the current filters. The confirmation message uses singular/plural forms ("Copied 1 unique author" vs "Copied 5 unique authors"). Edge cases: All commits by same author shows "Copied 1 unique author", same name with different email are treated as different authors. Also available in the commit row right-click context menu with a 👥 icon, showing the count of unique authors in the label. The `copyAllUniqueAuthors` message type and `copyAllUniqueAuthors` webview action are defined in `src/types.ts`.

- **Open File at Commit**: Right-click on any file in the changed files list to open a context menu with "Open file at this commit" option. This opens the file content as it was at that specific commit in a new editor tab using a virtual document with the `git-history` URI scheme. The `GitHistoryContentProvider` (registered in `src/gitHistoryContentProvider.ts`) implements VS Code's `TextDocumentContentProvider` to serve file content on demand. The message handler in `src/webview/messageHandler.ts` (`handleOpenFileAtCommit`) constructs a `git-history` URI with the commit hash and working directory encoded in the query string, then calls `vscode.window.showTextDocument(uri)`. The provider parses the URI and fetches content via `getFileContentAtCommit` from `src/git/gitService.ts`. Tab titles display the relative file path with syntax highlighting based on the file extension.

- **Word Wrap Toggle**: A toggle button ("Wrap") in the toolbar enables word wrap in the diff viewer to handle long lines in JSON, minified code, and other content. Also toggled via `Ctrl+Shift+W` / `Cmd+Shift+W`. Active state is indicated by highlighted button styling (`.word-wrap-btn.active`). The button element (`word-wrap-btn`) must be present in both `webviewProvider.ts` `_getHtmlForWebview()` and `index.html`. State is tracked in `wordWrapEnabled` variable in `main.js`. When enabled, the `word-wrap` CSS class is added to `#diff-viewer`, applying `white-space: pre-wrap` and `word-break: break-all` to diff lines. The toggle function (`handleWordWrapToggle`) updates both the diff-viewer class and the button's active class and title attribute.

- **Ignore Whitespace Toggle**: A toggle button ("Ignore WS") in the toolbar enables ignoring whitespace in diff comparison. This is useful for reviewing code that has been reformatted without semantic changes. Also toggled via `Ctrl+Shift+Alt+J` / `Cmd+Shift+Alt+J`. When enabled, the `-w` flag is added to git diff commands to ignore whitespace differences. Active state is indicated by highlighted button styling (`.ignore-ws-btn.active`).

- **Default Diff View**: The `gitHistory.defaultDiffView` configuration setting (`"unified"` or `"side-by-side"`, default `"unified"`) controls the initial diff view mode when opening Git History. The setting is read in `webviewProvider.ts` `loadData()` and passed in the `init` message as `defaultDiffView`. The `main.js` `case 'init'` handler calls `setDiffType('side-by-side')` when `message.defaultDiffView === 'side-by-side'`; otherwise the default `unified` mode is used. Invalid values fall back to unified. Users can still toggle the view at any time using the segmented control buttons.

- **Diff Context Lines**: The `gitHistory.diffContextLines` configuration setting (default: `3`, range: `1-10`) controls the number of context lines shown in git diffs. Git's default is 3 lines, but users may want more context for better code review understanding, or less context for more focused diffs. The setting is read in `webviewProvider.ts` `loadData()` and stored in the `_diffContextLines` field. The `getDiffContextLines()` getter method returns the value, which is passed to all diff functions in `messageHandler.ts` (`handleRequestDiff`, `handleRequestCombinedDiff`, `handleRequestRangeDiff`, `handleRequestFileDiff`, `handleQuickCompare`). When `diffContextLines` is not equal to the default 3, the `-U<context>` flag is added to git diff commands (e.g., `git show -U5 <hash>` for 5 lines of context). When `diffContextLines` is 3 (git default), no `-U` flag is added to keep commands cleaner. The configuration property has `minimum: 1` and `maximum: 10` in package.json, and VS Code enforces these limits in the settings UI. Users can also adjust context lines from the toolbar via a stepper button that cycles through 1-10 (click to increment). The setting persists across sessions via `saveSettings` and is also accessible via keyboard shortcut `Ctrl+Shift+/` / `Cmd+Shift+/`.

- **Commit Statistics**: The commit list displays statistics for each commit including the number of files changed, insertions (green `+X`), and deletions (red `-Y`). These are shown in a dedicated "Stats" column between the Date and Message columns. The stats are parsed from `git log --stat` output (see `src/git/gitStatsParser.ts`), merged with commit data in `src/git/gitService.ts`, and rendered in the webview by `formatCommitStats()` in `src/webview/panel/main.js`. The stats column styling uses green (`--vscode-gitDecoration-addedResourceForeground`) for insertions and red (`--vscode-gitDecoration-deletedResourceForeground`) for deletions. Hovering over the stats cell shows a tooltip with the full stats breakdown (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)"). The parser includes defensive validation to handle malformed git output: invalid numbers (non-numeric values) are treated as 0, negative values are clamped to 0 (git should never output negative stats, but we guard against it), and empty or missing stat fields default to 0.

- **Compare Any Two Commits (Range Diff)**: Users can Shift+click (or Shift+Enter) two commits to see the diff between them using `git diff A..B`. The `handleRangeSelection` function in `main.js` finds all commits between the anchor (first clicked) and target, selects them all, and requests the range diff via `requestRangeDiff`. The `getCommitRangeDiff` function in `gitService.ts` executes `git diff fromHash..toHash`. The header shows "Comparing: `short1`..`short2`" to indicate range mode. This differs from multi-select (Ctrl+click) which shows a combined diff of all changes across the range. Range selection supports the same file-path scoping as single commits.

- **Quick Compare with Parent**: Users can quickly compare a commit with its direct parent using the "Compare" button or `Ctrl+Alt+P` / `Cmd+Alt+P` keyboard shortcut. This shows the diff between the commit and its parent (`git diff parent..commit`), useful for quickly reviewing what changed in each individual commit without requiring manual selection. The feature is implemented in `src/webview/panel/main.js` (`handleQuickCompare` function), `src/git/gitService.ts` (`getCommitParentDiff` function using `git diff hash~1..hash`), and `src/webview/messageHandler.ts` (`handleQuickCompare` handler). The button is added in `webviewProvider.ts` with id `compare-parent-btn`. For root commits (no parent), an error message is shown indicating there's no parent to compare with. Also available in the commit row right-click context menu as "Compare with parent" with a ⧁ icon.

- **File Context Menu**: Right-click on any file in the changed files list to open a context menu with options: "Open file at this commit" (opens file using the `git-history` URI scheme), "View diff for this file" (shows file-scoped diff), "Copy diff for this file" (copies the file-scoped diff to clipboard using `handleCopyFileDiff`), "Copy file content" (copies the file content at this commit to clipboard using `handleCopyFileContent`), "Copy file path" (copies the file path to clipboard using `handleCopyFilePath`), "Copy file name only" (copies just the filename using `handleCopyFileName`), "Copy file extension" (copies just the file extension using `handleCopyExtension`), "Copy file directory" (copies the directory path using `handleCopyFileDirectory`), and "Copy relative path" (copies the path relative to git root using `handleCopyRelativePath`). Keyboard shortcuts: `Ctrl+Alt+F` for file diff, `Ctrl+Alt+C` for file content, `F6` for file path, `Ctrl+Shift+,` for file name, `Ctrl+Alt+E` for file extension, `Ctrl+Alt+K` for file directory, and `Ctrl+Alt+L` for relative path. The `openFileAtCommit` message is handled by `handleOpenFileAtCommit` in `messageHandler.ts` which constructs a `git-history` URI and calls `vscode.window.showTextDocument`. The `copyFileDiff` message is handled by `handleCopyFileDiff` which uses `getCommitDiff` with the filePath parameter to get the file-scoped diff and writes it to `vscode.env.clipboard`. The `copyFileContent` message is handled by `handleCopyFileContent` which uses `getFileContentAtCommit` to get the file content and writes it to `vscode.env.clipboard`. The `copyFilePath` message is handled by `handleCopyFilePath` which writes the file path to `vscode.env.clipboard`. The `copyFileName` message is handled by `handleCopyFileName` which uses `path.basename()` to extract the filename and writes it to `vscode.env.clipboard`. The `copyFileExtension` message is handled by `handleCopyFileExtension` which uses `path.extname()` to extract the extension and writes it to `vscode.env.clipboard`. The `copyFileDirectory` message is handled by `handleCopyFileDirectory` which uses `path.dirname()` to extract the directory and writes it to `vscode.env.clipboard`. The `copyRelativePath` message is handled by `handleCopyRelativePath` which uses `path.relative(cwd, filePath)` to compute the relative path and writes it to `vscode.env.clipboard`. All message types are dispatched through the `handleMessage` switch statement in `messageHandler.ts`.

- **Create Branch from Commit**: Right-click on any commit to create a new branch at that commit. The `handleCreateBranch` function in `messageHandler.ts` prompts for branch name via `vscode.window.showInputBox()` and calls `createBranchFromCommit` from `gitService.ts` which executes `git branch <name> <hash>`. Shows confirmation message on success. Invalid branch names (containing `..`, `~`, `:`, spaces, etc.) are rejected by git, and the error is displayed to the user. Empty input is treated as cancel. The feature is available via the commit row right-click context menu with a 🌿 icon.

- **Create Tag from Commit**: Right-click on any commit to create a new git tag at that commit. Supports both lightweight tags (name only) and annotated tags (with message). The `handleCreateTag` function in `messageHandler.ts` prompts for tag name and optional message via `vscode.window.showInputBox()`, then calls `createTagFromCommit` from `gitService.ts` which executes `git tag <name> <hash>` for lightweight tags or `git tag -a <name> -m <message> <hash>` for annotated tags. Shows confirmation message indicating whether the tag was lightweight or annotated. Invalid tag names are rejected by git, and the error is displayed to the user. Empty input is treated as cancel. The feature is available via the commit row right-click context menu with a 🏷️ icon.

- **Delete Tag from Commit**: Right-click on any commit that has tags to delete them. If the commit has only one tag, it will be deleted immediately with confirmation. If the commit has multiple tags, a QuickPick dialog appears to select which tag to delete. The extension executes `git tag -d <tagname>` and refreshes the panel to show updated tag badges. The `handleDeleteTag` function in `messageHandler.ts` finds the commit, checks for tags, handles the selection logic (single vs multiple tags), calls `deleteTagFromCommit` from `gitService.ts`, and refreshes the panel via `panel.loadData()`. The feature is available via the commit row right-click context menu with a 🗑️ icon and is only shown when the commit has tags.

- **Cherry-pick Commit**: Right-click on any commit or press `Ctrl+Alt+K` / `Cmd+Alt+K` to cherry-pick it onto the current branch. A confirmation dialog shows the commit hash and message. The extension executes `git cherry-pick <hash>` via the `cherryPickCommit` function in `gitService.ts` and refreshes the panel on success. If conflicts occur, the error message from git is displayed. The `handleCherryPickCommit` function in `messageHandler.ts` manages the confirmation dialog and error handling. The feature is available via the commit row right-click context menu with a 🍒 icon. Also accessible via keyboard shortcut `Ctrl+Alt+K` / `Cmd+Alt+K` (registered as `gitHistory.cherryPickCommit`).

- **Revert Commit**: Right-click on any commit or press `Ctrl+Alt+R` / `Cmd+Alt+R` to revert it. A confirmation dialog shows the commit hash and message. The extension executes `git revert <hash>` via the `revertCommit` function in `gitService.ts` and refreshes the panel on success. If conflicts occur, the error message from git is displayed. The `handleRevertCommit` function in `messageHandler.ts` manages the confirmation dialog and error handling. The feature is available via the commit row right-click context menu with a ↩️ icon. Also accessible via keyboard shortcut `Ctrl+Alt+R` / `Cmd+Alt+R` (registered as `gitHistory.revertCommit`).

- **Export Filtered Commits**: Click the "Export" button or press `Ctrl+Shift+O` / `Cmd+Shift+O` to export the currently filtered commit list to JSON, CSV, Markdown, Plain Text, PR Description, or mbox format. The export dialog shows the number of commits to be exported and offers six format options: JSON (full commit data with stats and tags), CSV (tabular format for spreadsheet analysis), Markdown (changelog format for documentation and release notes), Plain Text (simple, readable commit list with one commit per line: `hash - message (author <email>) [+stats]`), PR Description (structured Markdown with Summary, Changes checklist, Statistics, and Commits detail sections—ideal for pull request descriptions), or mbox (RFC 822 patches for email clients and `git am`, only available when 2+ commits are selected). The export respects all active filters (search, author, tag, date, hide merge commits). The `handleExportCommits` function in `messageHandler.ts` uses `vscode.window.showSaveDialog` for file selection and `fs.promises.writeFile` to write the formatted data. CSV fields are properly escaped for commas, quotes, and newlines. The formatter functions `formatCommitsAsJson`, `formatCommitsAsCsv`, `formatCommitsAsMarkdown`, `formatCommitsAsText`, and `formatCommitsAsPrDescription` are pure functions that can be unit tested independently. The mbox export uses `getCommitsAsMbox` from `gitService.ts` which runs `git format-patch --stdout fromHash^..toHash` and is handled by `handleExportCommitsMbox` in `messageHandler.ts`. The `exportCommitsMbox` message type and webview action are defined in `src/types.ts`.

- **Copy Filter Query**: Press `Ctrl+Shift+5` / `Cmd+Shift+5` or click the "Copy Filter" button next to the search input to copy the current filter state to clipboard. The filter is copied as a JSON string containing the search query and all toggle states (hide merge commits, sort mode, show my commits only, regex mode, path filter). This is useful for sharing search filters, documenting reproducible commit views, or saving filter configurations for later use. Example output: `{"query":"author:alice after:2024-01-01","hideMergeCommits":true,"sortMode":0,"showMyCommitsOnly":true,"regexSearchEnabled":false,"pathFilter":null}`. The `handleCopyFilterQuery` function in `main.js` captures the current filter state and sends a `copyFilterQuery` message. The message is handled by `handleCopyFilterQuery` in `messageHandler.ts` which formats the state as JSON and writes it to `vscode.env.clipboard`. The `copyFilterQuery` message type and `FilterQueryState` interface are defined in `src/types.ts`.

- **Import Filter Query**: Press `Ctrl+Shift+4` / `Cmd+Shift+4` or click the "Paste Filter" button to restore a previously copied filter query from clipboard. The `handlePasteFilterQuery` function in `main.js` sends a `pasteFilterQuery` message to the extension. The message is handled by `handlePasteFilterQuery` in `messageHandler.ts` which reads the clipboard via `vscode.env.clipboard.readText()`, parses the JSON, validates the filter state, and sends an `applyFilterQuery` message back to the webview. The `applyFilterQuery` function in `main.js` applies the filter state (search query, hide merge commits, sort mode, show my commits only, regex search mode, path filter) and refreshes the UI. Invalid JSON or malformed filter states show a user-friendly warning message. The `pasteFilterQuery` message type and `applyFilterQuery` webview action are defined in `src/types.ts`.

- **Copy Filter as Git Log Command**: Press `Ctrl+Alt+Shift+L` / `Cmd+Alt+Shift+L` to copy the current filter state as an equivalent `git log` command to the clipboard. This converts UI filters to git log arguments: text search maps to `--grep` (or `--grep -E` in regex mode), `author:` filter maps to `--author`, date filters (`after:`, `before:`, `last:Ndays`) map to `--after`/`--before`, `hideMergeCommits` maps to `--no-merges`, and `pathFilter` maps to `-- <path>`. Tags and branch filters are included as comments since git log lacks native equivalents. Useful for reproducing filters in a terminal, sharing filter criteria with teammates, or learning git log syntax. The `handleCopyFilterAsGitLogCommand` function in `main.js` captures the filter state and sends a `copyFilterAsGitLogCommand` message. The message is handled by `handleCopyFilterAsGitLogCommand` in `messageHandler.ts` which uses the `buildGitLogCommand` utility to construct the command and writes it to `vscode.env.clipboard`. The `copyFilterAsGitLogCommand` message type and webview action are defined in `src/types.ts`.

- **Clear All Filters**: Press `Ctrl+Alt+Q` / `Cmd+Alt+Q` or click the "Clear All" button (next to the search input) to clear all active filters at once. The button appears only when filters are active (search query, date filters, author/tag/branch/path filters, hide merge commits toggle, regex mode, or my commits toggle). When clicked, it resets all filter state and refreshes the view to show the full commit list. The `clearAllFilters` function in `main.js` resets `searchQuery`, `hideMergeCommits`, `regexSearchEnabled`, and `showMyCommitsOnly`, then calls `renderCommits()`, `renderFilterBadges()`, `updateClearAllButton()`, and `saveSettings()`. The `clearAllFilters` action is also handled via the `triggerAction` message pattern for keyboard shortcut discoverability. The `clearAllFilters` webview action is defined in `src/types.ts`.

- **Keyboard Help**: Press `?` in the history panel to show a modal dialog displaying all available keyboard shortcuts organized by category (Navigation, Search & Filter, View Options, Copy Commands, Actions, Global Editor Shortcuts). The dialog detects the platform (Mac/Windows/Linux) and displays the appropriate modifier keys (Cmd/Ctrl, Option/Alt). Shortcuts are rendered with styled key badges and organized sections. The modal can be closed by clicking the overlay, clicking the X button, or pressing Escape. Implementation is in `src/webview/panel/main.js` (`showKeyboardHelpDialog` function) with styling in `styles.css` (`#keyboard-help-modal` and related classes). The shortcuts data structure is defined inline in the function and includes all keyboard shortcuts documented in the README. The Global Editor Shortcuts section shows shortcuts that work from any text editor (not just within the Git History panel): Toggle blame annotations, Show file history, and Show selection history.

- **GPG Signature Verification**: The extension displays GPG signature verification status for signed commits as colored badges next to the commit message. Green checkmark (✓) indicates a valid, verified signature; red X (✗) indicates an invalid signature (bad, expired, untrusted, revoked, or error). Unsigned commits show no badge. Hovering over a signature badge displays the signer's name and verification status. The `gitHistory.showSignatures` configuration setting controls badge visibility (default: true). Signature status is detected using git's `%G?` format specifier and signer name via `%GS`: `G` (good/valid), `B` (bad), `U` (untrusted), `X` (expired), `Y` (expired key), `R` (revoked), `E` (missing key), `N` (no signature). Only `G` is treated as verified. The `CommitSignature` interface in `src/types.ts` stores `verified` (boolean) and `signer` (string | null). Parsing is done in `src/git/gitParser.ts` (`parseCommitBlock` and `parseLineHistoryLog`). Rendering uses `.signature-badge.verified` and `.signature-badge.unverified` CSS classes in `styles.css`. The `showSignatures` setting is persisted in `UserSettings` across sessions.

### Message Protocol

Extension ↔ Webview communication uses typed messages (see `ExtToWebviewMessage` and `WebviewToExtMessage` in `src/types.ts`):
- Extension sends: `init`, `diff`, `combinedDiff`, `rangeDiff`, `commitFiles`, `error`, `selectCommit`, `branchHashes`, `applyFilterQuery`, `filterPresets`
- Webview sends: `ready`, `requestDiff`, `requestCombinedDiff`, `requestRangeDiff`, `requestCommitFiles`, `requestFileDiff`, `requestRefresh`, `copyCommitMessage`, `copyCommitHash`, `copyCommitInfo`, `copyCherryPickCommand`, `copyRevertCommand`, `copyShowCommand`, `copyCommitFiles`, `copyCommitDiff`, `copyFileDiff`, `copyFilePath`, `copyFileName`, `copyFileExtension`, `copyRelativePath`, `copyCommitPatch`, `copyCommitUrl`, `copyCommitMention`, `copyCommitRef`, `copyCommitStats`, `copyBranchName`, `copyBranchUrl`, `copyRemoteUrl`, `copyTags`, `copyAuthorEmail`, `copyAuthorName`, `copyAuthorInitials`, `copyParentHash`, `copyShortHash`, `copySubject`, `copySubjectWithAuthor`, `copyDiffStatSummary`, `copyCoAuthors`, `copyTrailers`, `copyFixesReferences`, `copyReviewedBy`, `copyCommitDate`, `copyOneline`, `copyCommitCompact`, `copyCommitBody`, `copyCommitMarkdown`, `copyCommitHtml`, `copyCommitJira`, `copyCommitYaml`, `copyCommitBbcode`, `copyCommitCsv`, `copyFileContent`, `copySelectedHashes`, `copySelectedMessagesChecklist`, `copySelectedMessagesNumbered`, `copySelectedMessagesChecklistWithAuthor`, `copySelectedMessagesNumberedWithAuthor`, `copyAllFilteredHashes`, `copyFilterQuery`, `copyFilterAsGitLogCommand`, `pasteFilterQuery`, `openFileAtCommit`, `openCommitUrl`, `openFileUrl`, `quickCompare`, `createBranch`, `createTag`, `saveSettings`, `exportCommits`, `exportCommitsMbox`, `requestBranchHashes`, `saveFilterPreset`, `deleteFilterPreset`, `getFilterPresets`, `applyPreset`, `copyFullCommitInfoWithFileStats`, `copySignatureInfo`

The `saveSettings` message is sent by the webview when UI preferences change (diff type, word wrap, sort order, hide merge commits, regex mode) to persist them across sessions.

### Saved Filter Presets

The extension allows users to save, name, and quickly restore filter presets with a maximum of 10 presets stored across sessions using VS Code's `ExtensionContext.globalState`.

- **Save Filter Preset**: Click the "Save Preset" button or press `Ctrl+Shift+0` / `Cmd+Shift+0` to save the current filter state as a named preset. A modal dialog appears where you can enter a preset name (max 50 characters). The preset includes the current search query, hide merge commits toggle, sort mode, my commits filter, regex search mode, and path filter. Preset names are validated for duplicates (case-insensitive), empty names, and invalid characters (path separators, control characters). A maximum of 10 presets can be saved.

- **Load Filter Preset**: Click the "⭐ Presets" dropdown button or press `Ctrl+Shift+1` / `Cmd+Shift+1` to open the presets dropdown menu. Each preset shows its name and a summary of the filter state. Click on a preset to apply its filter state. The dropdown can be dismissed by clicking outside or pressing Escape. Each preset item also has a delete button (×) to remove it.

- **Preset Persistence**: Presets are stored in VS Code's globalState using the `gitHistory.savedPresets` key and persist across VS Code sessions. The preset data structure includes the name, filter state (query, hideMergeCommits, sortMode, showMyCommitsOnly, regexSearchEnabled, pathFilter), and creation timestamp.

- **Preset Summary**: Each preset displays a human-readable summary showing the active filters: search query in quotes, "No Merge" if hide merge commits is enabled, "My Commits" if my commits filter is on, and the sort mode label (Newest, Oldest, A-Z, Z-A). For example: `"bug fix" • No Merge • Newest`.

**Implementation**:
- `src/types.ts` - `SavedFilterPreset` interface, `SAVED_PRESETS_STORAGE_KEY` constant, message types
- `src/settings/settingsTypes.ts` - `MAX_SAVED_PRESETS` (10), `PRESET_NAME_MAX_LENGTH` (50) constants
- `src/webview/messageHandler.ts` - `handleSaveFilterPreset`, `handleDeleteFilterPreset`, `handleGetFilterPresets`, `validatePresetName` helper
- `src/webview/webviewProvider.ts` - passes `savedPresets` in init message, provides `getContext()` method
- `src/webview/panel/main.js` - `savedPresets` state, `showSavePresetDialog()`, `showPresetDropdown()`, `loadPreset()`, `deletePreset()`, `renderPresetDropdown()`, `getPresetSummary()`, event handlers for buttons
- `src/webview/panel/styles.css` - styles for preset save modal, dropdown menu, and buttons

### Build System

- Webpack bundles the extension to `dist/extension.js`
- Webview static files are copied to `dist/webview/panel/`
- Tests compile separately via `test/tsconfig.json` to `out/`
- Main entry point is `./dist/extension.js` (configured in package.json)

## Testing

Tests use VS Code's test framework with Mocha. Run with `npm test` or `make test`. On Linux CI, tests require `xvfb-run` because VS Code needs a display. The test job also captures screenshots for PR review.

### Unit Tests

Unit tests for pure parsing functions are located in:
- `test/suite/gitParser.test.ts` - Tests for `parseGitLog`, `parseNameStatus`, `parseLineHistoryLog`, `isBinaryFile`
- `test/suite/gitStatsParser.test.ts` - Tests for `parseCommitStats`, `extractStatsFromCommitBlock`, `parseMultipleCommitStats`
- `test/suite/messageHandlerUtils.test.ts` - Tests for utility functions in `messageHandler.ts`
- `test/suite/formatRelativeTime.test.ts` - Tests for `formatRelativeTime` function in `blameService.ts`
- `test/suite/toggleGraph.test.ts` - Tests for graph toggle webview action
- `test/suite/toggleSignatures.test.ts` - Tests for GPG signature toggle webview action
- `test/suite/toggleRegex.test.ts` - Tests for regex search mode toggle webview action
- `test/suite/authorAvatarUtils.test.ts` - Tests for `getAuthorColor` and `getAuthorInitials` utility functions in `main.js`
- `test/suite/parseRemoteUrl.test.ts` - Tests for `parseRemoteUrl` and `detectPlatform` URL parsing functions in `gitService.ts`

These tests validate edge cases in git output parsing and webview action wiring without requiring actual git operations.

### Testing messageHandlerUtils

The `test/suite/messageHandlerUtils.test.ts` file contains unit tests for pure utility functions in `src/webview/messageHandler.ts`:

**Export Formatting Functions:**
- `escapeCsvField()` - CSV field escaping for commas, quotes, newlines
- `formatCommitsAsJson()` - JSON formatting with 2-space indentation
- `formatCommitsAsCsv()` - CSV formatting with proper field escaping
- `formatCommitsAsMarkdown()` - Markdown changelog formatting for multiple commits
- `formatCommitsAsText()` - Plain text formatting with one commit per line: `hash - message (author <email>) [+stats]`
- `formatCommitAsMarkdown()` - Markdown formatting for single commit with relative/absolute dates

**Utility Functions:**
- `extractCoAuthors()` - Extracts "Co-authored-by:" trailers from commit messages
- `validatePresetName()` - Validates saved filter preset names (length, invalid characters, duplicates)

These functions are pure (no side effects) and can be tested with simple input/output assertions using sample `CommitInfo` data.

### Testing authorAvatarUtils

The `test/suite/authorAvatarUtils.test.ts` file contains unit tests for author avatar utility functions in `src/webview/panel/main.js`:

**getAuthorColor()** - Generates a consistent color from the `GRAPH_COLORS` array based on author name hash:
- Consistency: same author name always returns the same color
- Determinism: different author names return different colors
- Valid color: returned value is always from the `GRAPH_COLORS` array
- Edge cases: empty string, single character, special characters, unicode characters, very long names

**getAuthorInitials()** - Extracts initials from author name:
- Two-part names: "John Doe" → "JD" (first + last initial)
- Multi-part names: "John Middle Doe" → "JE" (first + last initial)
- Single word: "Single" → "SI" (first two characters)
- Whitespace handling: trimmed before processing
- Case handling: always uppercased output

These functions are reimplemented in TypeScript for testing, following the same pattern as `test/suite/regexSearch.test.ts`. Source verification tests ensure the functions exist in `main.js`.

### Testing URL Parsing

The `test/suite/parseRemoteUrl.test.ts` file contains comprehensive unit tests for URL parsing functions in `src/git/gitService.ts`:

**detectPlatform()** - Detects the git hosting platform from a hostname:
- All supported platforms (GitHub, GitLab, Bitbucket, Azure DevOps)
- Self-hosted instances
- Case insensitivity
- Unknown platforms

**parseRemoteUrl()** - Parses git remote URLs to extract platform information:
- SSH format: `git@host:owner/repo.git`
- SSH URL format: `ssh://git@host:port/owner/repo.git`
- HTTPS format: `https://host/owner/repo.git`
- Azure DevOps specific formats
- Edge cases (invalid formats, empty strings)

These tests ensure URL generation features work correctly across all supported git hosting platforms.

### Testing SettingsService

When adding new `UserSettings` properties:

1. **Add the property to `src/settings/settingsTypes.ts`**
   - Add the property to the `UserSettings` interface
   - Add the default value to `DEFAULT_SETTINGS`

2. **Update unit tests in `test/suite/settingsServiceUnit.test.ts`**
   - Add tests for `getSetting()` with the new property
   - Add tests for `setSetting()` with the new property
   - Add tests for backward compatibility (partial settings merge)

3. **Verify backward compatibility**
   - Test that partial settings (missing the new property) merge with defaults correctly
   - Existing users without the new property should get the default value

4. **Add E2E tests in `test/suite/settingsServiceE2E.test.ts`**
   - Test UI persistence across sessions (if the setting has UI controls)
   - Verify data flow: extension → provider → webview
   - Verify data flow: webview → extension → globalState

**Example: Adding a new setting**

```typescript
// 1. Update src/settings/settingsTypes.ts
export interface UserSettings {
  // ... existing properties
  newSetting: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  // ... existing defaults
  newSetting: false
};

// 2. Update test/suite/settingsServiceUnit.test.ts
test('getSetting returns newSetting default value', () => {
  const value = settingsService.getSetting('newSetting');
  assert.strictEqual(value, false);
});

test('setSetting updates newSetting', async () => {
  await settingsService.setSetting('newSetting', true);
  assert.strictEqual(settingsService.getSetting('newSetting'), true);
});
```

**Test Files**
- `test/suite/settingsServiceUnit.test.ts` - Mock-based unit tests for SettingsService methods
- `test/suite/settingsServiceE2E.test.ts` - Integration tests verifying settings persistence and data flow
- `test/suite/settingsService.test.ts` - Source verification tests (ensures files exist and are structured correctly)

### Testing FirstRunTipService

When adding new functionality to the FirstRunTipService:

1. **Unit tests in `test/suite/firstRunTipServiceUnit.test.ts`**
   - Use `MockMemento` pattern (same as SettingsService)
   - Test `shouldShowTip()` returns true on first run
   - Test `shouldShowTip()` returns false after `markAsShown()`
   - Test `reset()` allows tip to show again
   - Test persistence across service restarts

2. **E2E tests in `test/suite/firstRunTipServiceE2E.test.ts`**
   - Test that `showFirstRunTip` flag is passed in init message
   - Test that `dismissFirstRunTip` message calls `markAsShown`
   - Test full data flow: extension → provider → webview → handler

**MockMemento pattern**

```typescript
class MockMemento implements vscode.Memento {
  private store = new Map<string, any>();

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (defaultValue !== undefined) {
      return this.store.has(key) ? (this.store.get(key) as T) : defaultValue;
    }
    return this.store.get(key) as T | undefined;
  }

  update(key: string, value: any): Thenable<void> {
    if (value === undefined) {
      this.store.delete(key);
    } else {
      this.store.set(key, value);
    }
    return Promise.resolve();
  }

  keys(): readonly string[] {
    return Array.from(this.store.keys());
  }
}
```

**Test Files**
- `test/suite/firstRunTipServiceUnit.test.ts` - Mock-based unit tests for FirstRunTipService methods
- `test/suite/firstRunTipServiceE2E.test.ts` - Integration tests verifying tip flow and persistence
- `test/suite/firstRunTip.test.ts` - Source verification tests

### Testing formatRelativeTime

The `test/suite/formatRelativeTime.test.ts` file contains comprehensive unit tests for the `formatRelativeTime` function in `src/blame/blameService.ts`:

**Time Range Tests:**
- Tests for all time ranges (seconds, minutes, hours, days, weeks, months, years)
- Verifies correct thresholds and boundary conditions

**Singular/Plural Forms:**
- Tests singular forms (1 minute, 1 hour, etc.) at exact thresholds
- Tests plural forms (2 minutes, 2 hours, etc.) for proper English grammar

**Boundary Conditions:**
- Tests exact thresholds (60s, 3600s, 86400s, 604800s, 2592000s, 31536000s)
- Tests values just before and after each threshold

**Edge Cases:**
- Tests current time (0 seconds ago)
- Tests 1 second ago
- Tests large time differences (10+ years)
- Tests fractional minute boundaries

These tests ensure the relative time formatting is correct for all time ranges, which is important for the blame annotations feature that displays commit dates in a user-friendly format.

### Testing gitParser Utilities

The `test/suite/gitParser.test.ts` file contains comprehensive unit tests for pure parsing functions in `src/git/gitParser.ts`:

**isBinaryFile()** - Tests detect binary file indicators:
- Standard git output ("Binary files", "GIT binary patch")
- Edge cases (empty string, case variations, partial matches)
- Validates that only exact git-formatted strings match

**parseNameStatus()** - Tests parse git name-status output:
- All standard status codes (A, M, D, R, C)
- Various similarity percentages (R001, R050, R075, C099)
- Edge case status codes (T for type change, U for unmerged)
- Malformed input handling (missing tabs, incomplete lines)
- Special characters in file paths

### Testing graphLayout

The `test/suite/graphLayout.test.ts` file contains unit tests for graph visualization functions in `src/webview/panel/graphLayout.js`:

**computeGraphLayout()** - Tests the lane-based algorithm that computes per-row layout data:
- Empty input returns empty array
- Single commit with no parents (root)
- Linear history - single vertical line
- Merge commits have two parents - produces merge segment
- Multiple parallel branches
- Max columns capped at 10
- Commit with missing parentHashes field (backwards compat)
- Filtered subset with broken parent chains - no ghost lanes

**simplifyParentsForDisplay()** - Tests parent hash simplification for filtered commit lists:
- Empty list returns empty array
- Visible parents are kept as-is
- Invisible parent replaced with next commit in list
- Root commit (no original parents) stays a root
- Last commit with invisible parent becomes a root
- Partial visibility: keeps only visible parents
- Does not mutate original commits

These functions are reimplemented in TypeScript for testing, following the same pattern as `authorAvatarUtils.test.ts`. Source verification tests ensure the functions exist in the original JavaScript file.
