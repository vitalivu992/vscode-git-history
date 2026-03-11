# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

```bash
npm install           # Install dependencies
npm run compile       # Production build (webpack + compile tests)
npm run watch         # Development build with watch mode
npm run compile-tests # Compile tests only (tsc -p test/tsconfig.json)
npm test              # Run tests (on Linux: xvfb-run -a npm test)
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

The extension uses a custom git log format with null separators:
```
%H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%b%x00---COMMIT-END---%n
```
Fields: hash, parent hashes (space-separated), author, email, timestamp, subject, body.
Commits are separated by `---COMMIT-END---` markers. `%P` is empty for root commits.

### Commit Graph

The webview renders a per-row SVG graph column (like `git log --graph`) using a lane-based algorithm:
- `src/webview/panel/graphLayout.js` – pure JS lane computation, exports `computeGraphLayout(commits)`
- `src/webview/panel/main.js` – calls `computeGraphLayout` after filtering, renders SVG per row via `renderGraphSvg()`
- Controlled by `gitHistory.showGraph` config setting (default: true)

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

Tests use VS Code's test framework with Mocha. Run with `npm test`. On Linux CI, tests require `xvfb-run` because VS Code needs a display.
