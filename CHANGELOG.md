# Changelog

All notable changes to the "vscode-git-history" extension will be documented in this file.

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
