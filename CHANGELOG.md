# Changelog

All notable changes to the "vscode-git-history" extension will be documented in this file.

## [Unreleased]

### Changed
- **CI**: Merged screenshot capture and packaging into the test job for faster builds
- **CI**: Artifacts now include version in filename (e.g., `screenshots-v1.1.0-<sha>`)
- **CI**: Artifacts retained for 7 days instead of 90
- **Release**: Version bump now happens AFTER release upload (bumps to next version)
- **Makefile**: Renamed `publish` target to `package` (more conventional)
- **Makefile**: Added `help` target for self-documenting targets
- **Makefile**: `make test` now captures screenshots along with running tests
- **Makefile**: `make install` installs to Cursor editor

## [1.1.0] - 2026-03-11

### Added
- **Click file to view individual diff**: Click any file in the changed files panel to see only that file's diff
- **Visual file selection**: Selected file is highlighted in the file list
- **Back-to-full-diff link**: "Show full commit diff" link appears when viewing a single file's diff
- File clicking is automatically disabled during multi-select (combined diff) mode

### Fixed
- **Bug**: File-scoped diff (`getCommitDiff` with `filePath`) now correctly includes the commit hash, ensuring it targets the specified commit instead of HEAD

## [1.0.0] - 2026-03-11

### Added
- **Commit Graph**: Visual branch and merge graph column in the history table, rendered as per-row inline SVG
  - Lane-based algorithm computes node positions and edge connections from parent hash data
  - 8-color palette using VS Code token colors, visible on dark and light themes
  - Merge commits show bezier curves connecting branches
- **`gitHistory.showGraph` setting**: Toggle the graph column on or off (default: `true`)
- `graphLayout.js` – standalone, dependency-free graph layout algorithm with unit tests

### Changed
- Git log format now includes `%P` (parent hashes) for graph computation
- `CommitInfo` type now includes `parentHashes: string[]`

## [0.0.2] - 2026-03-01

### Fixed
- **Security**: Restored nonce-based CSP for `script-src` instead of `unsafe-inline`
- **Security**: Added `https://cdn.jsdelivr.net` to `style-src` CSP so diff2html CSS loads correctly
- **Bug**: Copied file status (`C`) now maps to `.copied` CSS class (purple) instead of `.renamed` (blue)
- **Config**: `gitHistory.maxCommits` setting is now actually read from VS Code configuration (was hardcoded to 500)

### Added
- Webview HTML structure and CSP tests
- Status class mapping unit tests

## [0.0.1] - 2024-02-27

### Initial Release

#### Features
- View git history for files
- View git history for line selections
- Multi-select commits for combined diff view
- Toggle between unified and side-by-side diff views
- Changed files list with status indicators
- VS Code theme integration

#### Commands
- `gitHistory.showFileHistory` - Show history for current file
- `gitHistory.showSelectionHistory` - Show history for current selection

#### Technical
- TypeScript implementation
- Webview-based UI with diff2html
- Message-based communication between extension and webview
- Comprehensive test coverage
