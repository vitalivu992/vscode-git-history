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
%H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%d%x00---COMMIT-END---%n
```
Fields: hash, parent hashes (space-separated), author, email, timestamp, subject, body, decorations.
Commits are separated by `---COMMIT-END---` markers. `%P` is empty for root commits.

The `%d` decorations field contains tag references (e.g., `tag: v1.0.0`, `tag: v1.0.0, origin/main`). Tags are parsed from this field and rendered as badges in the webview commit list. Both annotated and lightweight tags are supported.

Selection history (`git log -L`) uses the same null-separated format (without body/`---COMMIT-END---`):
```
%H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%d
```
Each commit appears as a single header line; inline diff lines (no null chars) are skipped by the parser.

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

### UI Features

- **Date Display**: Commit dates are displayed in relative format with time for recent commits (e.g., "Today 2:30 PM", "Yesterday 3:45 PM", "2 days ago", "2 weeks ago"). Hovering over a date reveals the absolute timestamp in locale format. Implemented in `src/webview/panel/main.js` (`formatDate()` and `formatTime()` functions) and uses a `title` attribute on date elements.

- **Commit Count Display**: The search bar always shows the number of commits in the current view. When no filters are active, it displays "N commits" (e.g., "142 commits"). When filters are active and reduce the visible count, it displays "X of N commits" (e.g., "12 of 142 commits"). The count updates in real-time as search, author, tag, date, regex, and merge-commit filters change. Implemented via the `updateCommitCount()` function in `src/webview/panel/main.js`, which is called from `renderCommits()`, filter toggle handlers, and the `init` message handler. The HTML element (`#commit-count` with class `.commit-count`) exists in both `webviewProvider.ts` and `index.html`. Styled in `styles.css` with muted foreground color.

- **Git Tag Badges**: Tags parsed from the `%d` decorations field are rendered as colored badges next to commit messages. Lightweight and annotated tags are both supported. Badge styling is defined in `src/webview/panel/styles.css`.

- **Blame Annotations**: The extension provides line-by-line blame annotations via the `toggleBlame` and `showBlameCommit` commands. Blame information is displayed as inline decorations showing commit hash, author, and date for each line. Date format is configurable via `gitHistory.blame.dateFormat` (relative, short, or iso).

  The `showBlameCommit` command (triggered by clicking on blame decorations) displays a warning message "No active editor found" when there is no active text editor, consistent with other commands like `showFileHistory` and `showSelectionHistory`.

- **Expandable Commit Messages**: Commits with multi-line messages (subject + body) display an expand/collapse button (▼/▲) in the message column. Clicking expands to show the full commit body. The expanded state is tracked per commit hash during the session. Implementation is in `src/webview/panel/main.js` (render logic and event handling) and `src/webview/panel/styles.css` (flex layout and body styling).

- **Commit Search**: The search input filters commits in real time by message, author name, author email, commit hash (full and short), and tag name. The filter is implemented as a case-insensitive `.includes()` match across all these fields in `src/webview/panel/main.js` (`renderCommits` function). Tag filtering uses `commit.tags.some()` to match any tag badge text.

- **Regex Search Mode**: A toggle button (.*) next to the search input enables regex search mode for advanced pattern matching. When enabled, the search query is interpreted as a JavaScript regular expression, allowing powerful filters like `bug(fix|patch)|hotfix` or `^feat:.*`. Invalid regex patterns are gracefully handled with visual feedback. The regex toggle button shows active state with highlighted styling. Keyboard shortcut `Ctrl+Shift+X` / `Cmd+Shift+X` toggles regex mode. Regex mode works in combination with date filters and other search features. Implementation in `src/webview/panel/main.js`: the `regexSearchEnabled` state variable controls the mode, `isRegexMatch()` function performs the regex testing with error handling, and `handleRegexToggle()` updates the UI state.

- **Date Range Filters**: The search input supports date filtering with special syntax: `after:YYYY-MM-DD` for commits after a date, `before:YYYY-MM-DD` for commits before a date, and `last:Ndays/weeks/months` for relative time filtering (e.g., `last:7days`, `last:2weeks`). Date filters can be combined with text search (e.g., `fix bug after:2024-01-01`). The `parseDateFilter()` function in `main.js` extracts date filters from the query, and active filters are displayed as removable badges below the search input. The remaining text after removing date filters is used for the standard text search.

- **Author Filter**: The search input supports author filtering with the `author:name` syntax (e.g., `author:Alice`, `author:alice@example.com`). The filter matches case-insensitively against both the author name and email fields. Clicking on any author name in the commit list applies the author filter for that author. Active author filters are displayed as removable badges alongside date filter badges. The `parseDateFilter()` function in `main.js` extracts the author filter, and `getFilteredCommits()` applies it before date and text filters. The author filter can be combined with date filters and text search (e.g., `author:Bob fix after:2024-01-01`). The `author-filter-link` class on author names enables click-to-filter, styled in `styles.css`.

- **Tag Filter**: The search input supports tag filtering with the `tag:name` syntax (e.g., `tag:v1.0.0`, `tag:release`). The filter matches case-insensitively against tag names using `commit.tags.some(t => t.toLowerCase().includes(tagFilter))`. Clicking on any tag badge in the commit list applies the tag filter. Active tag filters are displayed as removable badges alongside author and date filter badges. The `parseDateFilter()` function in `main.js` extracts the tag filter and strips it from the text query, and `getFilteredCommits()` applies it after author filter and before date filters. The tag filter can be combined with author filter, date filters, and text search (e.g., `tag:v2.0 author:Bob after:2024-01-01`). The `tag-filter-link` class on tag badges enables click-to-filter, styled in `styles.css`.

- **Branch Filter**: The search input supports branch filtering with the `branch:name` syntax (e.g., `branch:main`, `branch:feature/login`). The filter matches case-insensitively against branch names using a pre-fetched `branchCommitHashes` map that maps lowercase branch names to sets of commit hashes. The `parseDateFilter()` function in `main.js` extracts the branch filter, and `getFilteredCommits()` applies it after tag filter and before date filters. On initialization, the webview receives the list of all branches via the `init` message and sends a `requestBranchHashes` message to the extension. The extension responds with a `branchHashes` message containing a `Record<string, string[]>` mapping branch names to their commit hashes. Active branch filters are displayed as removable badges alongside other filter badges. Clicking on the branch badge clears it. The branch filter can be combined with all other filters (e.g., `branch:main author:Bob after:2024-01-01`). Implementation spans `main.js` (filter parsing, commit filtering, badge rendering), `webviewProvider.ts` (fetches branches via `getAllBranches`), `messageHandler.ts` (`handleRequestBranchHashes` calls `getBranchCommitHashes`), and `gitService.ts` (`getAllBranches` uses `git branch -a`, `getBranchCommitHashes` uses `git log --format="%H" <branch>`).

- **Sort Toggle**: The sort button in the toolbar cycles through four sort modes: newest-first (default), oldest-first, author A-Z, and author Z-A. The state is tracked as `sortMode` (0–3) in `src/webview/panel/main.js`. When toggled, `getOrderedCommits()` applies the appropriate sort: `slice()` for newest, `reverse()` for oldest, and `localeCompare` on `author` for A-Z/Z-A. The `updateSortButton()` helper updates the button label and active state. The commit graph is hidden for author-based modes (modes 2 and 3) because the graph layout algorithm assumes date-based ordering. The graph header visibility is controlled by `effectiveShowGraph` (true only when `showGraph` is enabled AND `sortMode < 2`). Also accessible via `Ctrl+Shift+3` / `Cmd+Shift+3` (registered as `gitHistory.cycleSortMode`). The `sortMode` setting is persisted in `UserSettings` (previously `sortOldestFirst: boolean`, migrated on load in `settingsService.ts`).

- **Keyboard Navigation**: The commit list supports full keyboard navigation for accessibility and power users. Arrow keys (`↑`/`↓`) move focus between commits with wrapping support. `Home`/`End` jump to first/last commit. `Enter` selects the focused commit, while `Ctrl+Enter` toggles multi-selection. `Ctrl+A` / `Cmd+A` selects all visible commits in the current view, useful for bulk operations like exporting or copying all hashes. `/` or `Ctrl+F` focuses the search input. `Escape` clears selection and removes focus. The focused row has a distinct visual outline using the `focused` CSS class (separate from the `selected` class used for commit selection). Implementation spans `src/webview/panel/main.js` (`handleKeyDown`, `updateFocusedRow`, `scrollFocusedIntoView` functions) and `src/webview/panel/styles.css` (`.focused` class styling).

- **Hide Merge Commits**: A toggle button in the toolbar allows filtering out merge commits from the history view. When enabled, commits with more than one parent (merge commits) are hidden from the commit list. This helps reduce clutter when reviewing history with many merge commits. The setting is controlled by `gitHistory.hideMergeCommits` configuration (default: false) and can be toggled per-session via the "No Merge" button or keyboard shortcut `Ctrl+Shift+Q` / `Cmd+Shift+Q`. State is tracked in `hideMergeCommits` variable in `main.js`, filtering logic is integrated into `getFilteredCommits()`, and the UI button styling is defined in `styles.css` with `.merge-toggle-btn` and `.merge-toggle-btn.active` classes.

- **Jump to Hash**: Press `Ctrl+G` / `Cmd+G` to open a modal dialog where you can type a commit hash (full or short). As you type, matching commits are displayed. Press `Enter` to jump to the first match, or click on a result. The commit is scrolled into view and selected. Implementation is in `main.js` (`showJumpToHashDialog`, `scrollToCommitByHash`) and styled in `styles.css` (`#jump-to-hash-modal`, related classes).

- **Copy Commit Hash**: Press `Ctrl+Shift+H` / `Cmd+Shift+H` to copy the full commit hash of the focused or selected commit to clipboard. Hash chips in the commit list are also click-to-copy (using `navigator.clipboard`). The keyboard shortcut follows the same resolution pattern as copy message: `handleCopyHash` in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitHash` message. The message is handled by `handleCopyCommitHash` in `messageHandler.ts` which writes `commit.hash` to `vscode.env.clipboard` and shows a confirmation with the short hash. The `copyCommitHash` message type is defined in `src/types.ts`.

- **Copy Commit Info**: Press `Ctrl+Shift+I` / `Cmd+Shift+I` to copy the full commit information including hash, author (name and email), date, and commit message. The format is: `hash\nAuthor: name <email>\nDate: date\n\nmessage`. The `handleCopyInfo` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitInfo` message. The message is handled by `handleCopyCommitInfo` in `messageHandler.ts` which formats the commit data and writes it to `vscode.env.clipboard`. The `copyCommitInfo` message type is defined in `src/types.ts`.

- **Copy Cherry-Pick Command**: Press `Ctrl+Shift+P` / `Cmd+Shift+P` to copy a pre-formatted `git cherry-pick <hash>` command to the clipboard. The `handleCopyCherryPick` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCherryPickCommand` message. The message is handled by `handleCopyCherryPickCommand` in `messageHandler.ts` which formats the command and writes it to `vscode.env.clipboard`, showing a confirmation with the short hash. The `copyCherryPickCommand` message type is defined in `src/types.ts`. Also available in the commit row right-click context menu.

- **Copy Revert Command**: Press `Ctrl+Shift+U` / `Cmd+Shift+U` to copy a pre-formatted `git revert <hash>` command to the clipboard. The `handleCopyRevert` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyRevertCommand` message. The message is handled by `handleCopyRevertCommand` in `messageHandler.ts` which formats the command and writes it to `vscode.env.clipboard`, showing a confirmation with the short hash. The `copyRevertCommand` message type is defined in `src/types.ts`. Also available in the commit row right-click context menu with a ↩️ icon.

- **Copy Commit as Patch**: Press `Ctrl+Shift+E` / `Cmd+Shift+E` to copy the commit as a unified diff patch (with git headers) to the clipboard. The patch is generated using `git format-patch -1 --stdout <hash>` via the `getCommitPatch()` function in `gitService.ts`. The patch includes proper headers (`From`, `Date`, `Subject`) and can be applied using `git apply` or `git am`. The `handleCopyPatch` function in `main.js` resolves the target commit and sends a `copyCommitPatch` message. The message is handled by `handleCopyCommitPatch` in `messageHandler.ts` which writes the patch to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 🩹 icon.

- **Copy Branch Name**: Press `Ctrl+Alt+B` / `Cmd+Alt+B` to copy the current branch name to the clipboard. The branch badge in the commit detail header is also clickable to copy the branch name. Also available in the commit row right-click context menu. The `handleCopyBranchName` function in `main.js` sends a `copyBranchName` message. The message is handled by `handleCopyBranchName` in `messageHandler.ts` which reads the branch from `panel.getBranch()` and writes it to `vscode.env.clipboard`. The branch is stored in the `_branch` field of `GitHistoryPanel` during `loadData()`. A confirmation message showing the branch name is displayed.

- **Copy Tags**: Press `Ctrl+Shift+G` / `Cmd+Shift+G` to copy all tags of the focused or selected commit as a comma-separated string to the clipboard. Tags are parsed from git's `%d` decorations field and displayed as badges on commits. The `handleCopyTags` function in `main.js` resolves the target commit and sends a `copyTags` message. The message is handled by `handleCopyTags` in `messageHandler.ts` which reads `commit.tags` and writes them to `vscode.env.clipboard` joined by ", ". If no tags exist, shows "No tags on commit" message. Also available in the commit row right-click context menu.

- **Copy Author Email**: Press `Ctrl+Shift+A` / `Cmd+Shift+A` to copy the author email address of the focused or selected commit to clipboard. The email address is also available via right-click context menu. The `handleCopyAuthorEmail` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyAuthorEmail` message. The message is handled by `handleCopyAuthorEmail` in `messageHandler.ts` which writes `commit.email` to `vscode.env.clipboard`. The `copyAuthorEmail` message type is defined in `src/types.ts`.

- **Copy Author Name**: Press `Ctrl+Shift+N` / `Cmd+Shift+N` to copy the author name of the focused or selected commit to clipboard. The author name is also available via right-click context menu with a 👤 icon. The `handleCopyAuthorName` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyAuthorName` message. The message is handled by `handleCopyAuthorName` in `messageHandler.ts` which writes `commit.author` to `vscode.env.clipboard`. The `copyAuthorName` message type is defined in `src/types.ts`.

- **Copy Parent Hash**: Press `Ctrl+Shift+V` / `Cmd+Shift+V` to copy the first parent hash of the focused or selected commit to clipboard. The parent hash is also available via right-click context menu with a ⧁ icon. The `handleCopyParentHash` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyParentHash` message. The message is handled by `handleCopyParentHash` in `messageHandler.ts` which checks for root commits (no parent) and writes `commit.parentHashes[0]` to `vscode.env.clipboard`, showing a confirmation with the short hash. For root commits (no parent), an error message "Root commit has no parent" is shown. The `copyParentHash` message type is defined in `src/types.ts`.

- **Copy Short Hash**: Press `Ctrl+Shift+7` / `Cmd+Shift+7` to copy the 7-character short hash of the focused or selected commit to clipboard (mnemonic: 7 = 7 characters). The short hash is also available via right-click context menu with the `#7` icon. The `handleCopyShortHash` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyShortHash` message. The message is handled by `handleCopyShortHash` in `messageHandler.ts` which extracts the first 7 characters of the hash using `substring(0, 7)` and writes it to `vscode.env.clipboard`. The `copyShortHash` message type is defined in `src/types.ts`.

- **Copy Subject**: Press `Ctrl+Shift+6` / `Cmd+Shift+6` to copy only the commit subject (first line of the commit message) to clipboard. This is useful for referencing or sharing just the commit title without the body. The subject is also available via right-click context menu with the `📌` icon. The `handleCopySubject` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copySubject` message. The message is handled by `handleCopySubject` in `messageHandler.ts` which writes `commit.message` to `vscode.env.clipboard`. The confirmation message truncates long subjects to 50 characters. The `copySubject` message type is defined in `src/types.ts`.

- **Copy Diff Stat Summary**: Press `Ctrl+Shift+9` / `Cmd+Shift+9` to copy just the diff stat summary (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)") to clipboard. This is useful for changelogs, commit descriptions, and quick references. Uses singular forms when counts are 1 (e.g., "1 file changed, 1 insertion(+), 1 deletion(-)"). Shows "No statistics available for this commit" when the commit has no stats. The `handleCopyDiffStatSummary` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyDiffStatSummary` message. The message is handled by `handleCopyDiffStatSummary` in `messageHandler.ts` which formats the stat summary with proper singular/plural forms and writes to `vscode.env.clipboard`. Also available via right-click context menu with the `📊` icon.

- **Copy as Oneline**: Press `Ctrl+Shift+Y` / `Cmd+Shift+Y` to copy the commit in `git log --oneline` format (`{shortHash} {subject}`) to clipboard. Example output: `a1b2c3d Fix authentication bug`. This is useful for sharing commits in chat, creating changelog entries, or quick reference in a standardized git format. The `handleCopyOneline` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyOneline` message. The message is handled by `handleCopyOneline` in `messageHandler.ts` which formats the string as `${commit.shortHash} ${commit.message}` and writes it to `vscode.env.clipboard`. The confirmation message truncates long messages to 50 characters. Also available in the commit row right-click context menu with the `≡` icon. The `copyOneline` message type is defined in `src/types.ts`.

- **Copy Commit Body**: Press `Ctrl+Shift+Z` / `Cmd+Shift+Z` to copy just the commit body (the multi-line description after the subject line) to clipboard. The `handleCopyCommitBody` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitBody` message. The message is handled by `handleCopyCommitBody` in `messageHandler.ts` which extracts the body from `fullMessage` after the first newline, trims it, and writes it to `vscode.env.clipboard`. Shows "Commit has no body" for commits with single-line messages or empty bodies. The confirmation message truncates long bodies to 50 characters. Also available in the commit row right-click context menu with a 📄 icon. The `copyCommitBody` message type and `copyCommitBody` webview action are defined in `src/types.ts`.

- **Copy Commit as Markdown**: Press `Ctrl+Alt+M` / `Cmd+Alt+M` to copy the focused or selected commit as formatted Markdown. The format includes commit message with heading, author, date (relative + absolute), stats, tags, and body. Useful for changelogs, release notes, and documentation. The `handleCopyMarkdown` function in `main.js` resolves the target commit and sends a `copyCommitMarkdown` message. The message is handled by `handleCopyCommitMarkdown` in `messageHandler.ts` which uses the `formatCommitAsMarkdown` helper to format the commit data and writes it to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 📜 icon. The `copyCommitMarkdown` message type and `copyCommitMarkdown` webview action are defined in `src/types.ts`.

- **Copy Co-Authors**: Press `Ctrl+Shift+K` / `Cmd+Shift+K` to copy co-authors from the commit message to clipboard. This extracts "Co-authored-by:" trailers following the Git convention (format: `Co-authored-by: Name <email>`). Multiple co-authors are copied as newline-separated entries in the format "Name <email>". If no co-authors are found, a "No co-authors on commit" message is shown. The `handleCopyCoAuthors` function in `main.js` resolves the target commit and sends a `copyCoAuthors` message. The message is handled by `handleCopyCoAuthors` in `messageHandler.ts` which uses the `extractCoAuthors` helper to parse the commit body for co-author trailers. Also available in the commit row right-click context menu with a 👥 icon.

- **Copy Commit Date**: Press `Ctrl+Shift+T` / `Cmd+Shift+T` to copy the commit date in ISO 8601 format (e.g., `2026-05-11T10:30:45.000Z`). The `handleCopyCommitDate` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitDate` message. The message is handled by `handleCopyCommitDate` in `messageHandler.ts` which formats the date using `new Date(commit.date).toISOString()` and writes it to `vscode.env.clipboard`. The date is also available via right-click context menu with the `🕐` icon. The `copyCommitDate` message type is defined in `src/types.ts`.

- **Copy Relative Date**: Press `Ctrl+Shift+8` / `Cmd+Shift+8` to copy the commit date in the same human-readable relative format displayed in the UI (e.g., "Today 2:30 PM", "Yesterday 3:45 PM", "3 days ago", "2 weeks ago"). This complements the ISO format from `Ctrl+Shift+T` for more readable output. The `handleCopyRelativeDate` function in `main.js` resolves the target commit and sends a `copyRelativeDate` message. The message is handled by `handleCopyRelativeDate` in `messageHandler.ts` which calculates the time difference between the commit date and now, then formats it as "Today HH:MM", "Yesterday HH:MM", "X days ago", "X weeks ago", or absolute date for older commits. The relative date is also available via right-click context menu with the `🕒` icon. The `copyRelativeDate` message type and `copyRelativeDate` webview action are defined in `src/types.ts`.

- **Copy Selected Hashes**: Press `Ctrl+Shift+;` / `Cmd+Shift+;` to copy all selected commit hashes as a newline-separated list to the clipboard. When multiple commits are selected (2+), this copies all hashes in display order. Falls back to single hash copy behavior when 0 or 1 commit is selected. The `handleCopySelectedHashes` function in `main.js` handles the keyboard shortcut and context menu action, sending a `copySelectedHashes` message with an array of hashes. The message is handled by `handleCopySelectedHashes` in `messageHandler.ts` which joins hashes with newline and writes to clipboard. The `copySelectedHashes` message type and `copySelectedHashes` webview action are defined in `src/types.ts`. Also available in the commit row right-click context menu (only shown when multiple commits are selected).

- **Open File at Commit**: Right-click on any file in the changed files list to open a context menu with "Open file at this commit" option. This opens the file content as it was at that specific commit in a new editor tab using a virtual document with the `git-history` URI scheme. The `GitHistoryContentProvider` (registered in `src/gitHistoryContentProvider.ts`) implements VS Code's `TextDocumentContentProvider` to serve file content on demand. The message handler in `src/webview/messageHandler.ts` (`handleOpenFileAtCommit`) constructs a `git-history` URI with the commit hash and working directory encoded in the query string, then calls `vscode.window.showTextDocument(uri)`. The provider parses the URI and fetches content via `getFileContentAtCommit` from `src/git/gitService.ts`. Tab titles display the relative file path with syntax highlighting based on the file extension.

- **Word Wrap Toggle**: A toggle button ("Wrap") in the toolbar enables word wrap in the diff viewer to handle long lines in JSON, minified code, and other content. Also toggled via `Ctrl+Shift+W` / `Cmd+Shift+W`. Active state is indicated by highlighted button styling (`.word-wrap-btn.active`). The button element (`word-wrap-btn`) must be present in both `webviewProvider.ts` `_getHtmlForWebview()` and `index.html`. State is tracked in `wordWrapEnabled` variable in `main.js`. When enabled, the `word-wrap` CSS class is added to `#diff-viewer`, applying `white-space: pre-wrap` and `word-break: break-all` to diff lines. The toggle function (`handleWordWrapToggle`) updates both the diff-viewer class and the button's active class and title attribute.

- **Ignore Whitespace Toggle**: A toggle button ("Ignore WS") in the toolbar enables ignoring whitespace in diff comparison. This is useful for reviewing code that has been reformatted without semantic changes. Also toggled via `Ctrl+Shift+J` / `Cmd+Shift+J`. When enabled, the `-w` flag is added to git diff commands to ignore whitespace differences. Active state is indicated by highlighted button styling (`.ignore-ws-btn.active`).

- **Default Diff View**: The `gitHistory.defaultDiffView` configuration setting (`"unified"` or `"side-by-side"`, default `"unified"`) controls the initial diff view mode when opening Git History. The setting is read in `webviewProvider.ts` `loadData()` and passed in the `init` message as `defaultDiffView`. The `main.js` `case 'init'` handler calls `setDiffType('side-by-side')` when `message.defaultDiffView === 'side-by-side'`; otherwise the default `unified` mode is used. Invalid values fall back to unified. Users can still toggle the view at any time using the segmented control buttons.

- **Diff Context Lines**: The `gitHistory.diffContextLines` configuration setting (default: `3`, range: `1-10`) controls the number of context lines shown in git diffs. Git's default is 3 lines, but users may want more context for better code review understanding, or less context for more focused diffs. The setting is read in `webviewProvider.ts` `loadData()` and stored in the `_diffContextLines` field. The `getDiffContextLines()` getter method returns the value, which is passed to all diff functions in `messageHandler.ts` (`handleRequestDiff`, `handleRequestCombinedDiff`, `handleRequestRangeDiff`, `handleRequestFileDiff`, `handleQuickCompare`). When `diffContextLines` is not equal to the default 3, the `-U<context>` flag is added to git diff commands (e.g., `git show -U5 <hash>` for 5 lines of context). When `diffContextLines` is 3 (git default), no `-U` flag is added to keep commands cleaner. The configuration property has `minimum: 1` and `maximum: 10` in package.json, and VS Code enforces these limits in the settings UI. Users can also adjust context lines from the toolbar via a stepper button that cycles through 1-10 (click to increment). The setting persists across sessions via `saveSettings` and is also accessible via keyboard shortcut `Ctrl+Shift+/` / `Cmd+Shift+/`.

- **Commit Statistics**: The commit list displays statistics for each commit including the number of files changed, insertions (green `+X`), and deletions (red `-Y`). These are shown in a dedicated "Stats" column between the Date and Message columns. The stats are parsed from `git log --stat` output (see `src/git/gitStatsParser.ts`), merged with commit data in `src/git/gitService.ts`, and rendered in the webview by `formatCommitStats()` in `src/webview/panel/main.js`. The stats column styling uses green (`--vscode-gitDecoration-addedResourceForeground`) for insertions and red (`--vscode-gitDecoration-deletedResourceForeground`) for deletions. Hovering over the stats cell shows a tooltip with the full stats breakdown (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)").

- **Compare Any Two Commits (Range Diff)**: Users can Shift+click (or Shift+Enter) two commits to see the diff between them using `git diff A..B`. The `handleRangeSelection` function in `main.js` finds all commits between the anchor (first clicked) and target, selects them all, and requests the range diff via `requestRangeDiff`. The `getCommitRangeDiff` function in `gitService.ts` executes `git diff fromHash..toHash`. The header shows "Comparing: `short1`..`short2`" to indicate range mode. This differs from multi-select (Ctrl+click) which shows a combined diff of all changes across the range. Range selection supports the same file-path scoping as single commits.

- **Quick Compare with Parent**: Users can quickly compare a commit with its direct parent using the "Compare" button or `Ctrl+Alt+P` / `Cmd+Alt+P` keyboard shortcut. This shows the diff between the commit and its parent (`git diff parent..commit`), useful for quickly reviewing what changed in each individual commit without requiring manual selection. The feature is implemented in `src/webview/panel/main.js` (`handleQuickCompare` function), `src/git/gitService.ts` (`getCommitParentDiff` function using `git diff hash~1..hash`), and `src/webview/messageHandler.ts` (`handleQuickCompare` handler). The button is added in `webviewProvider.ts` with id `compare-parent-btn`. For root commits (no parent), an error message is shown indicating there's no parent to compare with. Also available in the commit row right-click context menu as "Compare with parent" with a ⧁ icon.

- **File Context Menu**: Right-click on any file in the changed files list to open a context menu with options: "Open file at this commit" (opens file using the `git-history` URI scheme), "View diff for this file" (shows file-scoped diff), "Copy file path" (copies the file path to clipboard using `handleCopyFilePath`), and "Copy file name only" (copies just the filename using `handleCopyFileName`). Both have keyboard shortcuts: `Ctrl+Shift+.` for file path and `Ctrl+Shift+,` for file name. The `openFileAtCommit` message is handled by `handleOpenFileAtCommit` in `messageHandler.ts` which constructs a `git-history` URI and calls `vscode.window.showTextDocument`. The `copyFilePath` message is handled by `handleCopyFilePath` which writes the file path to `vscode.env.clipboard`. The `copyFileName` message is handled by `handleCopyFileName` which uses `path.basename()` to extract the filename and writes it to `vscode.env.clipboard`. All message types are dispatched through the `handleMessage` switch statement in `messageHandler.ts`.

- **Create Branch from Commit**: Right-click on any commit to create a new branch at that commit. The `handleCreateBranch` function in `messageHandler.ts` prompts for branch name via `vscode.window.showInputBox()` and calls `createBranchFromCommit` from `gitService.ts` which executes `git branch <name> <hash>`. Shows confirmation message on success. Invalid branch names (containing `..`, `~`, `:`, spaces, etc.) are rejected by git, and the error is displayed to the user. Empty input is treated as cancel. The feature is available via the commit row right-click context menu with a 🌿 icon.

- **Create Tag from Commit**: Right-click on any commit to create a new git tag at that commit. Supports both lightweight tags (name only) and annotated tags (with message). The `handleCreateTag` function in `messageHandler.ts` prompts for tag name and optional message via `vscode.window.showInputBox()`, then calls `createTagFromCommit` from `gitService.ts` which executes `git tag <name> <hash>` for lightweight tags or `git tag -a <name> -m <message> <hash>` for annotated tags. Shows confirmation message indicating whether the tag was lightweight or annotated. Invalid tag names are rejected by git, and the error is displayed to the user. Empty input is treated as cancel. The feature is available via the commit row right-click context menu with a 🏷️ icon.

- **Export Filtered Commits**: Click the "Export" button or press `Ctrl+Shift+O` / `Cmd+Shift+O` to export the currently filtered commit list to JSON, CSV, or Markdown format. The export dialog shows the number of commits to be exported and offers three format options: JSON (full commit data with stats and tags), CSV (tabular format for spreadsheet analysis), or Markdown (changelog format for documentation and release notes). The export respects all active filters (search, author, tag, date, hide merge commits). The `handleExportCommits` function in `messageHandler.ts` uses `vscode.window.showSaveDialog` for file selection and `fs.promises.writeFile` to write the formatted data. CSV fields are properly escaped for commas, quotes, and newlines. The formatter functions `formatCommitsAsJson`, `formatCommitsAsCsv`, and `formatCommitsAsMarkdown` are pure functions that can be unit tested independently.

- **Copy Filter Query**: Press `Ctrl+Shift+5` / `Cmd+Shift+5` or click the "Copy Filter" button next to the search input to copy the current filter state to clipboard. The filter is copied as a JSON string containing the search query and all toggle states (hide merge commits, sort mode, show my commits only). This is useful for sharing search filters, documenting reproducible commit views, or saving filter configurations for later use. Example output: `{"query":"author:alice after:2024-01-01","hideMergeCommits":true,"sortMode":0,"showMyCommitsOnly":true}`. The `handleCopyFilterQuery` function in `main.js` captures the current filter state and sends a `copyFilterQuery` message. The message is handled by `handleCopyFilterQuery` in `messageHandler.ts` which formats the state as JSON and writes it to `vscode.env.clipboard`. The `copyFilterQuery` message type and `FilterQueryState` interface are defined in `src/types.ts`.

- **Import Filter Query**: Press `Ctrl+Shift+4` / `Cmd+Shift+4` or click the "Paste Filter" button to restore a previously copied filter query from clipboard. The `handlePasteFilterQuery` function in `main.js` sends a `pasteFilterQuery` message to the extension. The message is handled by `handlePasteFilterQuery` in `messageHandler.ts` which reads the clipboard via `vscode.env.clipboard.readText()`, parses the JSON, validates the filter state, and sends an `applyFilterQuery` message back to the webview. The `applyFilterQuery` function in `main.js` applies the filter state (search query, hide merge commits, sort mode, show my commits only) and refreshes the UI. Invalid JSON or malformed filter states show a user-friendly warning message. The `pasteFilterQuery` message type and `applyFilterQuery` webview action are defined in `src/types.ts`.

- **Clear All Filters**: Press `Ctrl+Alt+Q` / `Cmd+Alt+Q` or click the "Clear All" button (next to the search input) to clear all active filters at once. The button appears only when filters are active (search query, date filters, author/tag/branch/path filters, hide merge commits toggle, regex mode, or my commits toggle). When clicked, it resets all filter state and refreshes the view to show the full commit list. The `clearAllFilters` function in `main.js` resets `searchQuery`, `hideMergeCommits`, `regexSearchEnabled`, and `showMyCommitsOnly`, then calls `renderCommits()`, `renderFilterBadges()`, `updateClearAllButton()`, and `saveSettings()`. The `clearAllFilters` action is also handled via the `triggerAction` message pattern for keyboard shortcut discoverability. The `clearAllFilters` webview action is defined in `src/types.ts`.

- **Keyboard Help**: Press `?` in the history panel to show a modal dialog displaying all available keyboard shortcuts organized by category (Navigation, Search & Filter, View Options, Copy Commands, Actions). The dialog detects the platform (Mac/Windows/Linux) and displays the appropriate modifier keys (Cmd/Ctrl, Option/Alt). Shortcuts are rendered with styled key badges and organized sections. The modal can be closed by clicking the overlay, clicking the X button, or pressing Escape. Implementation is in `src/webview/panel/main.js` (`showKeyboardHelpDialog` function) with styling in `styles.css` (`#keyboard-help-modal` and related classes). The shortcuts data structure is defined inline in the function and includes all keyboard shortcuts documented in the README.

### Message Protocol

Extension ↔ Webview communication uses typed messages (see `ExtToWebviewMessage` and `WebviewToExtMessage` in `src/types.ts`):
- Extension sends: `init`, `diff`, `combinedDiff`, `rangeDiff`, `commitFiles`, `error`, `selectCommit`, `branchHashes`, `applyFilterQuery`
- Webview sends: `ready`, `requestDiff`, `requestCombinedDiff`, `requestRangeDiff`, `requestCommitFiles`, `requestFileDiff`, `requestRefresh`, `copyCommitMessage`, `copyCommitHash`, `copyCommitInfo`, `copyCherryPickCommand`, `copyRevertCommand`, `copyCommitFiles`, `copyCommitDiff`, `copyFilePath`, `copyFileName`, `copyCommitPatch`, `copyCommitUrl`, `copyCommitStats`, `copyBranchName`, `copyTags`, `copyAuthorEmail`, `copyAuthorName`, `copyParentHash`, `copyShortHash`, `copySubject`, `copyDiffStatSummary`, `copyCoAuthors`, `copyCommitDate`, `copyOneline`, `copyCommitBody`, `copyCommitMarkdown`, `copyFileContent`, `copySelectedHashes`, `copyFilterQuery`, `pasteFilterQuery`, `openFileAtCommit`, `quickCompare`, `createBranch`, `createTag`, `saveSettings`, `exportCommits`, `requestBranchHashes`

The `saveSettings` message is sent by the webview when UI preferences change (diff type, word wrap, sort order, hide merge commits, regex mode) to persist them across sessions.

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

These tests validate edge cases in git output parsing without requiring actual git operations.
