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

- **Git Layer** (`src/git/`):
  - `gitService.ts` - executes git commands via `child_process.execFile`
  - `gitParser.ts` - parses git output using null-separated format

- **Webview Layer** (`src/webview/`):
  - `webviewProvider.ts` - manages the webview panel lifecycle
  - `messageHandler.ts` - handles messages between extension and webview
  - `panel/` - static HTML/CSS/JS files for the UI (diff2html for rendering)

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

### UI Features

- **Date Tooltips**: Commit dates are displayed in relative format (e.g., "2 days ago") in the commit list. Hovering over a date reveals the absolute timestamp in ISO format. Implemented in `src/webview/panel/main.js` with a `title` attribute on date elements.

- **Git Tag Badges**: Tags parsed from the `%d` decorations field are rendered as colored badges next to commit messages. Lightweight and annotated tags are both supported. Badge styling is defined in `src/webview/panel/styles.css`.

- **Blame Annotations**: The extension provides line-by-line blame annotations via the `toggleBlame` and `showBlameCommit` commands. Blame information is displayed as inline decorations showing commit hash, author, and date for each line. Date format is configurable via `gitHistory.blame.dateFormat` (relative, short, or iso).

### Message Protocol

Extension ↔ Webview communication uses typed messages (see `ExtToWebviewMessage` and `WebviewToExtMessage` in `src/types.ts`):
- Extension sends: `init`, `diff`, `combinedDiff`, `commitFiles`, `error`
- Webview sends: `ready`, `requestDiff`, `requestCombinedDiff`, `requestCommitFiles`

### Build System

- Webpack bundles the extension to `dist/extension.js`
- Webview static files are copied to `dist/webview/panel/`
- Tests compile separately via `test/tsconfig.json` to `out/`
- Main entry point is `./dist/extension.js` (configured in package.json)

## Testing

Tests use VS Code's test framework with Mocha. Run with `npm test` or `make test`. On Linux CI, tests require `xvfb-run` because VS Code needs a display. The test job also captures screenshots for PR review.
