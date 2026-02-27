# Changelog

All notable changes to the "vscode-git-history" extension will be documented in this file.

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
