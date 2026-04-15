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

### Extension Structure

- **Entry Point**: `src/extension.ts` registers two commands:
  - `gitHistory.showFileHistory` - history for entire file
  - `gitHistory.showSelectionHistory` - history for selected lines
  - Also registers `GitHistoryContentProvider` for the `git-history` URI scheme

- **Git Layer** (`src/git/`):
  - `gitService.ts` - executes git commands via `child_process.execFile`
  - `gitParser.ts` - parses git output using null-separated format
  - `gitStatsParser.ts` - parses commit statistics (files changed, insertions, deletions) from git --stat output

- **Webview Layer** (`src/webview/`):
  - `webviewProvider.ts` - manages the webview panel lifecycle
  - `messageHandler.ts` - handles messages between extension and webview
  - `panel/` - static HTML/CSS/JS files for the UI (diff2html for rendering)

- **Combined Diff**: `getCombinedDiff` in `src/git/gitService.ts` sorts selected commit hashes chronologically (oldest first) using `git log --format="%H %at" --no-walk` to determine commit dates. The `sortHashesByDate` helper maps hashes to timestamps and sorts ascending. This ensures the diff range `earliest~1..latest` always spans the correct chronological range regardless of hash input order. Falls back to lexicographic sort if the date lookup fails.

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

### UI Features

- **Date Display**: Commit dates are displayed in relative format with time for recent commits (e.g., "Today 2:30 PM", "Yesterday 3:45 PM", "2 days ago", "2 weeks ago"). Hovering over a date reveals the absolute timestamp in locale format. Implemented in `src/webview/panel/main.js` (`formatDate()` and `formatTime()` functions) and uses a `title` attribute on date elements.

- **Git Tag Badges**: Tags parsed from the `%d` decorations field are rendered as colored badges next to commit messages. Lightweight and annotated tags are both supported. Badge styling is defined in `src/webview/panel/styles.css`.

- **Blame Annotations**: The extension provides line-by-line blame annotations via the `toggleBlame` and `showBlameCommit` commands. Blame information is displayed as inline decorations showing commit hash, author, and date for each line. Date format is configurable via `gitHistory.blame.dateFormat` (relative, short, or iso).

- **Expandable Commit Messages**: Commits with multi-line messages (subject + body) display an expand/collapse button (▼/▲) in the message column. Clicking expands to show the full commit body. The expanded state is tracked per commit hash during the session. Implementation is in `src/webview/panel/main.js` (render logic and event handling) and `src/webview/panel/styles.css` (flex layout and body styling).

- **Commit Search**: The search input filters commits in real time by message, author name, author email, commit hash (full and short), and tag name. The filter is implemented as a case-insensitive `.includes()` match across all these fields in `src/webview/panel/main.js` (`renderCommits` function). Tag filtering uses `commit.tags.some()` to match any tag badge text.

- **Date Range Filters**: The search input supports date filtering with special syntax: `after:YYYY-MM-DD` for commits after a date, `before:YYYY-MM-DD` for commits before a date, and `last:Ndays/weeks/months` for relative time filtering (e.g., `last:7days`, `last:2weeks`). Date filters can be combined with text search (e.g., `fix bug after:2024-01-01`). The `parseDateFilter()` function in `main.js` extracts date filters from the query, and active filters are displayed as removable badges below the search input. The remaining text after removing date filters is used for the standard text search.

- **Author Filter**: The search input supports author filtering with the `author:name` syntax (e.g., `author:Alice`, `author:alice@example.com`). The filter matches case-insensitively against both the author name and email fields. Clicking on any author name in the commit list applies the author filter for that author. Active author filters are displayed as removable badges alongside date filter badges. The `parseDateFilter()` function in `main.js` extracts the author filter, and `getFilteredCommits()` applies it before date and text filters. The author filter can be combined with date filters and text search (e.g., `author:Bob fix after:2024-01-01`). The `author-filter-link` class on author names enables click-to-filter, styled in `styles.css`.

- **Sort Toggle**: The sort button in the toolbar toggles between newest-first (default) and oldest-first commit ordering. The state is tracked in `sortOldestFirst` in `src/webview/panel/main.js`. When toggled, `getOrderedCommits()` reverses the filtered commit list. The commit graph is hidden in oldest-first mode because the graph layout algorithm assumes newest-first order. The graph header visibility is controlled by `effectiveShowGraph` (true only when `showGraph` is enabled AND `sortOldestFirst` is false).

- **Keyboard Navigation**: The commit list supports full keyboard navigation for accessibility and power users. Arrow keys (`↑`/`↓`) move focus between commits with wrapping support. `Home`/`End` jump to first/last commit. `Enter` selects the focused commit, while `Ctrl+Enter` toggles multi-selection. `/` or `Ctrl+F` focuses the search input. `Escape` clears selection and removes focus. The focused row has a distinct visual outline using the `focused` CSS class (separate from the `selected` class used for commit selection). Implementation spans `src/webview/panel/main.js` (`handleKeyDown`, `updateFocusedRow`, `scrollFocusedIntoView` functions) and `src/webview/panel/styles.css` (`.focused` class styling).

- **Hide Merge Commits**: A toggle button in the toolbar allows filtering out merge commits from the history view. When enabled, commits with more than one parent (merge commits) are hidden from the commit list. This helps reduce clutter when reviewing history with many merge commits. The setting is controlled by `gitHistory.hideMergeCommits` configuration (default: false) and can be toggled per-session via the "No Merge" button. State is tracked in `hideMergeCommits` variable in `main.js`, filtering logic is integrated into `getFilteredCommits()`, and the UI button styling is defined in `styles.css` with `.merge-toggle-btn` and `.merge-toggle-btn.active` classes.

- **Jump to Hash**: Press `Ctrl+G` / `Cmd+G` to open a modal dialog where you can type a commit hash (full or short). As you type, matching commits are displayed. Press `Enter` to jump to the first match, or click on a result. The commit is scrolled into view and selected. Implementation is in `main.js` (`showJumpToHashDialog`, `scrollToCommitByHash`) and styled in `styles.css` (`#jump-to-hash-modal`, related classes).

- **Copy Commit Hash**: Press `Ctrl+Shift+H` / `Cmd+Shift+H` to copy the full commit hash of the focused or selected commit to clipboard. Hash chips in the commit list are also click-to-copy (using `navigator.clipboard`). The keyboard shortcut follows the same resolution pattern as copy message: `handleCopyHash` in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitHash` message. The message is handled by `handleCopyCommitHash` in `messageHandler.ts` which writes `commit.hash` to `vscode.env.clipboard` and shows a confirmation with the short hash. The `copyCommitHash` message type is defined in `src/types.ts`.

- **Copy Commit Info**: Press `Ctrl+Shift+I` / `Cmd+Shift+I` to copy the full commit information including hash, author (name and email), date, and commit message. The format is: `hash\nAuthor: name <email>\nDate: date\n\nmessage`. The `handleCopyInfo` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCommitInfo` message. The message is handled by `handleCopyCommitInfo` in `messageHandler.ts` which formats the commit data and writes it to `vscode.env.clipboard`. The `copyCommitInfo` message type is defined in `src/types.ts`.

- **Copy Cherry-Pick Command**: Press `Ctrl+Shift+P` / `Cmd+Shift+P` to copy a pre-formatted `git cherry-pick <hash>` command to the clipboard. The `handleCopyCherryPick` function in `main.js` resolves the target commit via `getOrderedCommits(getFilteredCommits())` and sends a `copyCherryPickCommand` message. The message is handled by `handleCopyCherryPickCommand` in `messageHandler.ts` which formats the command and writes it to `vscode.env.clipboard`, showing a confirmation with the short hash. The `copyCherryPickCommand` message type is defined in `src/types.ts`. Also available in the commit row right-click context menu.

- **Copy Commit as Patch**: Press `Ctrl+Shift+E` / `Cmd+Shift+E` to copy the commit as a unified diff patch (with git headers) to the clipboard. The patch is generated using `git format-patch -1 --stdout <hash>` via the `getCommitPatch()` function in `gitService.ts`. The patch includes proper headers (`From`, `Date`, `Subject`) and can be applied using `git apply` or `git am`. The `handleCopyPatch` function in `main.js` resolves the target commit and sends a `copyCommitPatch` message. The message is handled by `handleCopyCommitPatch` in `messageHandler.ts` which writes the patch to `vscode.env.clipboard`. Also available in the commit row right-click context menu with a 🩹 icon.

- **Open File at Commit**: Right-click on any file in the changed files list to open a context menu with "Open file at this commit" option. This opens the file content as it was at that specific commit in a new editor tab using a virtual document with the `git-history` URI scheme. The `GitHistoryContentProvider` (registered in `src/gitHistoryContentProvider.ts`) implements VS Code's `TextDocumentContentProvider` to serve file content on demand. The message handler in `src/webview/messageHandler.ts` (`handleOpenFileAtCommit`) constructs a `git-history` URI with the commit hash and working directory encoded in the query string, then calls `vscode.window.showTextDocument(uri)`. The provider parses the URI and fetches content via `getFileContentAtCommit` from `src/git/gitService.ts`. Tab titles display the relative file path with syntax highlighting based on the file extension.

- **Word Wrap Toggle**: A toggle button ("Wrap") in the toolbar enables word wrap in the diff viewer to handle long lines in JSON, minified code, and other content. Also toggled via `Ctrl+Shift+W` / `Cmd+Shift+W`. Active state is indicated by highlighted button styling (`.word-wrap-btn.active`). The button element (`word-wrap-btn`) must be present in both `webviewProvider.ts` `_getHtmlForWebview()` and `index.html`. State is tracked in `wordWrapEnabled` variable in `main.js`. When enabled, the `word-wrap` CSS class is added to `#diff-viewer`, applying `white-space: pre-wrap` and `word-break: break-all` to diff lines. The toggle function (`handleWordWrapToggle`) updates both the diff-viewer class and the button's active class and title attribute.

- **Commit Statistics**: The commit list displays statistics for each commit including the number of files changed, insertions (green `+X`), and deletions (red `-Y`). These are shown in a dedicated "Stats" column between the Date and Message columns. The stats are parsed from `git log --stat` output (see `src/git/gitStatsParser.ts`), merged with commit data in `src/git/gitService.ts`, and rendered in the webview by `formatCommitStats()` in `src/webview/panel/main.js`. The stats column styling uses green (`--vscode-gitDecoration-addedResourceForeground`) for insertions and red (`--vscode-gitDecoration-deletedResourceForeground`) for deletions. Hovering over the stats cell shows a tooltip with the full stats breakdown (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)").

### Message Protocol

Extension ↔ Webview communication uses typed messages (see `ExtToWebviewMessage` and `WebviewToExtMessage` in `src/types.ts`):
- Extension sends: `init`, `diff`, `combinedDiff`, `commitFiles`, `error`, `selectCommit`
- Webview sends: `ready`, `requestDiff`, `requestCombinedDiff`, `requestCommitFiles`, `requestFileDiff`, `requestRefresh`, `copyCommitMessage`, `copyCommitHash`, `copyCommitInfo`, `copyCherryPickCommand`, `copyCommitPatch`, `openFileAtCommit`

### Build System

- Webpack bundles the extension to `dist/extension.js`
- Webview static files are copied to `dist/webview/panel/`
- Tests compile separately via `test/tsconfig.json` to `out/`
- Main entry point is `./dist/extension.js` (configured in package.json)

## Testing

Tests use VS Code's test framework with Mocha. Run with `npm test` or `make test`. On Linux CI, tests require `xvfb-run` because VS Code needs a display. The test job also captures screenshots for PR review.
