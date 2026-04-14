# Git History for VS Code

A powerful VS Code extension that provides git history visualization inspired by IntelliJ's Git History. View file history, selection history, and explore diffs with an intuitive interface.

### File History

![File History](docs/file-history.png)

### Selection History

![Selection History](docs/selection-history.png)

## Features

- **File History**: Right-click anywhere in an editor to view the complete git history of that file
- **Selection History**: Select lines of code and view only commits that affected those specific lines
- **Commit Graph**: Visual branch and merge graph (like `git log --graph`) rendered as inline SVG in the history table
- **Search Commits**: Filter commits in real time by message, author name, or commit hash
- **Multi-Select**: Select multiple commits to see a combined diff showing all changes
- **Diff Viewer**: Toggle between unified and side-by-side diff views
- **Changed Files**: See all files modified in a commit with status indicators (Added/Modified/Deleted/Renamed)
- **Git Tags**: Tag badges displayed in commit list for annotated and lightweight tags
- **Date Tooltips**: Hover over commit dates to see absolute timestamps
- **Expandable Commit Messages**: Click the arrow button on commits with multi-line messages to view the full commit body
- **Dark/Light Theme**: Automatically adapts to your VS Code theme using native CSS variables

## Installation

1. Press `F1` (or `Ctrl+Shift+P` / `Cmd+Shift+P`) to open the Command Palette
2. Type "Extensions: Install Extensions"
3. Search for "Git History"
4. Click Install

## Usage

### View File History

1. Open any file in a git repository
2. Right-click in the editor
3. Select "Git History (File)"
4. The history panel will open showing all commits

### View Selection History

1. Select one or more lines of code
2. Right-click in the editor
3. Select "Git History for Selection"
4. The history panel will show only commits that affected your selection

### Using the History Panel

- **Click a commit row** to view its diff and changed files
- **Check multiple commits** to see a combined diff
- **Search commits** using the search box to filter by message, author, or hash
- **Toggle view mode** between Unified and Side-by-Side
- **Scroll the diff viewer** to see all changes

## Requirements

- Visual Studio Code 1.85.0 or higher
- Git installed and available in your PATH
- A git repository

## Extension Settings

This extension contributes the following settings:

* `gitHistory.maxCommits`: Maximum number of commits to display (default: 500)
* `gitHistory.showGraph`: Show commit graph visualization in the history view (default: true)
* `gitHistory.blame.dateFormat`: Date format for blame annotations - `relative` (e.g., "2 days ago"), `short` (e.g., "2024-03-15"), or `iso` (e.g., "2024-03-15T10:30:00Z") (default: `relative`)

## Keyboard Shortcuts

| Command | Keybinding |
|---------|------------|
| Git History (File) | (none - customize as desired) |
| Git History for Selection | (none - customize as desired) |
| Toggle Blame Annotations | `Ctrl+Shift+B` / `Cmd+Shift+B` |

## License

MIT

## Issues

Report issues at: https://github.com/vitalivu992/vscode-git-history/issues

