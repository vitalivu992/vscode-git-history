# Git History for VS Code

A powerful VS Code extension that provides git history visualization inspired by IntelliJ's Git History. View file history, selection history, and explore diffs with an intuitive interface.


### File History

![File History](docs/file-history.png)

### Selection History

![Selection History](docs/selection-history.png)

## Documentation

| Topic | Where |
|-------|-------|
| Features (catalog + dev impl map + backlog) | [FEATURES.md](FEATURES.md) |
| Technical architecture (layout, protocols, build) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Usage, context menus & keyboard shortcuts | [USAGE.md](USAGE.md) |
| Settings & persisted preferences | [CONFIGURATION.md](CONFIGURATION.md) |
| Version history | [CHANGELOG.md](CHANGELOG.md) |

## Installation

1. Press `F1` (or `Ctrl+Shift+P` / `Cmd+Shift+P`) to open the Command Palette
2. Type "Extensions: Install Extensions"
3. Search for "Git History"
4. Click Install

## Requirements

- Visual Studio Code 1.85.0 or higher
- Git installed and available in your PATH
- A git repository

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gitHistory.hideMergeCommits` | `false` | Hide merge commits from the commit list (No Merge button) |
| `gitHistory.showSignatures` | `true` | Show GPG signature verification badges (verified ✓ / unverified ✗) next to commits |
| `gitHistory.defaultDiffView` | `unified` | Default diff view: `unified` or `side-by-side` |
| `gitHistory.diffContextLines` | `3` | Number of context lines shown around changes in diffs |
| `gitHistory.maxCommits` | `500` | Maximum number of commits to display in the commit list |
| `gitHistory.blame.dateFormat` | `relative` | Date format for blame annotations: `relative`, `short`, or `iso` |
| `gitHistory.commitList.dateFormat` | `relative` | Date format for the commit list: `relative`, `short`, or `iso` |

## Keyboard Shortcuts

### Global (work from any text editor)

| Keybinding | Action |
|------------|--------|
| `Ctrl+Alt+H` / `Cmd+Alt+H` | Git History (File) |
| `Ctrl+Alt+Shift+H` / `Cmd+Alt+Shift+H` | Git History for Selection |
| `Ctrl+Shift+B` / `Cmd+Shift+B` | Toggle Blame Annotations |

### Navigation

| Keybinding | Action |
|------------|--------|
| `↑` / `↓` | Navigate up/down through commits |
| `Home` / `End` | Jump to first / last commit |
| `PageDown` / `PageUp` | Jump down / up one page (10 commits) |
| `Enter` | Select focused commit and show its diff |
| `Shift+Enter` | Select range from anchor to focused commit |
| `Ctrl+Enter` / `Cmd+Enter` | Add/remove from multi-selection |
| `Ctrl+A` / `Cmd+A` | Select all visible commits |
| `Ctrl+L` / `Cmd+L` | Focus commit list |
| `/` or `Ctrl+F` / `Cmd+F` | Focus search input |
| `Ctrl+G` / `Cmd+G` | Jump to commit by hash |
| `Ctrl+P` / `Cmd+P` | Jump to Parent commit |
| `Ctrl+]` / `Cmd+]` | Tag Navigation — jump to next tagged commit |
| `Ctrl+[` / `Cmd+[` | Tag Navigation — jump to previous tagged commit |
| `?` | Show Keyboard Help dialog |
| `Escape` | Clear selection and close dialogs |

### Search & Filter

| Keybinding | Action |
|------------|--------|
| `Ctrl+Shift+X` / `Cmd+Shift+X` | Toggle regex search mode |
| `Ctrl+Shift+M` / `Cmd+Shift+M` | Toggle "Show my commits only" filter |
| `Ctrl+Shift+Q` / `Cmd+Shift+Q` | Toggle hide merge commits |
| `Ctrl+Alt+Q` / `Cmd+Alt+Q` | Clear all filters |

### View Options

| Keybinding | Action |
|------------|--------|
| `Ctrl+Shift+W` / `Cmd+Shift+W` | Toggle word wrap |
| `Ctrl+Shift+Alt+J` / `Cmd+Shift+Alt+J` | Toggle ignore whitespace |
| `Ctrl+Shift+/` / `Cmd+Shift+/` | Cycle diff context lines |
| `Ctrl+Shift+3` / `Cmd+Shift+3` | Cycle sort mode (Newest/Oldest/Author A-Z/Author Z-A) |
| `Ctrl+Shift+Alt+S` / `Cmd+Shift+Alt+S` | Toggle GPG signature verification badges |

### Copy Commands

| Keybinding | Action |
|------------|--------|
| `Ctrl+Shift+H` / `Cmd+Shift+H` | Copy commit hash |
| `Ctrl+Shift+7` / `Cmd+Shift+7` | Copy short hash |
| `Ctrl+Shift+I` / `Cmd+Shift+I` | Copy commit info |
| `Ctrl+Shift+6` / `Cmd+Shift+6` | 📌 Copy subject |
| `Ctrl+Shift+N` / `Cmd+Shift+N` | Copy author name |
| `Ctrl+Shift+A` / `Cmd+Shift+A` | Copy author email |
| `Ctrl+Shift+L` / `Cmd+Shift+L` | Copy commit URL |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Copy cherry-pick command |
| `Ctrl+Shift+U` / `Cmd+Shift+U` | Copy revert command |

### Actions

| Keybinding | Action |
|------------|--------|
| `F5` | Refresh history |
| `Ctrl+Shift+R` / `Cmd+Shift+R` | Refresh history (alternative) |
| `Ctrl+Alt+K` / `Cmd+Alt+K` | Cherry-pick commit |
| `Ctrl+Alt+R` / `Cmd+Alt+R` | Revert commit |
| `Ctrl+Alt+X` / `Cmd+Alt+X` | Delete local branch |
| `Ctrl+Shift+Alt+B` / `Cmd+Shift+Alt+B` | Create branch |
| `Ctrl+Alt+I` / `Cmd+Alt+I` | Create tag |
| `Ctrl+Alt+.` / `Cmd+Alt+.` | Delete tag |

## Context Menus

Right-click on commits in the commit list or files in the changed files list to access additional options.

**Commit Row Context Menu:**

| Action | Description |
|--------|-------------|
| **Copy commit hash** | Copy the full commit hash to clipboard |
| **Copy commit info** | Copy full commit information (hash, author, date, message) |
| **Copy cherry-pick command** | Copy a pre-formatted `git cherry-pick <hash>` command |
| **Copy revert command** | Copy a pre-formatted `git revert <hash>` command |
| **Copy commit URL** | Copy the web URL (GitHub/GitLab/Bitbucket) for the commit |
| **Copy author email** | Copy the author email address |
| **Copy author name** | Copy the author name |
| **Copy short hash** | Copy the 7-character short hash |
| **Copy subject** | Copy only the commit subject (first line) |
| **Create branch from commit** | Create a new branch at the selected commit |
| **Create tag from commit** | Create a git tag at the selected commit |
| **Delete tag from commit** | Delete a git tag from the selected commit |
| **Cherry-pick commit** | Cherry-pick this commit onto the current branch |
| **Revert commit** | Revert this commit |
| **Reset to this commit** | Reset the current branch to this commit (soft/mixed/hard) |

**Changed Files Context Menu:**

| Action | Description |
|--------|-------------|
| **Open file at this commit** | View the file content as it was at the selected commit |
| **View diff for this file** | Show the diff for this specific file only |
| **Compare with working tree** | Diff the file between this commit and your current working tree |
| **Blame file** | Open the file with blame annotations turned on |
| **Restore file from this commit** | Restore the file version from this commit into the working tree (`git checkout <hash> -- <file>`) |
| **Copy path** | Copy the absolute file path |
| **Copy relative path** | Copy the file path relative to the repo root |
| **Reveal in File Explorer** | Open the file in the system file explorer |

## License

MIT

## Issues

Report issues at: https://github.com/vitalivu992/vscode-git-history/issues
