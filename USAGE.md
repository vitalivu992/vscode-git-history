# Using Git History

How to use Git History: open history views, navigate the panel, use the right-click context menus, and the full keyboard-shortcut reference.

> Feature list: [FEATURES.md](FEATURES.md) · Settings: [CONFIGURATION.md](CONFIGURATION.md) · Dev implementation map: [FEATURES.md](FEATURES.md#implementation-reference)

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
- **Shift+click two commits** to compare any two commits and see what changed between them (e.g., compare v1.0 to v2.0)
- **Ctrl+click** to multi-select non-consecutive commits for a combined diff
- **Search commits** using the search box to filter by message, author, email, hash, or tag name. You can also use date filters:
  - `after:2024-01-01` - show commits after a specific date
  - `before:2024-06-01` - show commits before a specific date
  - `last:7days` or `last:2weeks` or `last:1month` - show commits within a recent time period
  - Quick date buttons: Click "Today" (`last:1day`), "Week" (`last:7days`), or "Month" (`last:1month`) for one-click filtering
  - Combine filters: `bug fix after:2024-01-01` - search for "bug fix" in commits after January 1st
- **Filter by author** using `author:` prefix or click any author name in the commit list:
  - `author:Alice` - show commits by author name (case-insensitive)
  - `author:alice@example.com` - show commits by email
  - Combine with other filters: `author:Bob fix after:2024-01-01`
- **Filter by tag** using `tag:` prefix or click any tag badge in the commit list:
  - `tag:v1.0.0` - show commits with a tag matching "v1.0.0" (case-insensitive, partial match)
  - `tag:release` - show commits with tags containing "release"
  - Combine with other filters: `tag:v2.0 author:Bob after:2024-01-01`
- **Filter by branch** using `branch:` prefix:
  - `branch:main` - show commits on main branch
  - `branch:feature/login` - show commits on feature branch (case-insensitive, partial match)
  - Combine with other filters: `branch:main author:Bob after:2024-01-01`
- **Filter by path** using `path:` prefix:
  - `path:src/main.ts` - show commits that modified this specific file
  - `path:src/` - show commits that modified any file in src/ directory
  - Combine with other filters: `path:src/ author:Bob after:2024-01-01`
- **Scope the text search** using `message:` / `body:` prefixes:
  - `message:auth` - match "auth" in the commit subject only (not the body)
  - `body:oauth2` - match "oauth2" in the commit body only (not the subject)
  - Combine with other filters: `message:fix body:parser author:Bob`
- **Regex search mode**: Click the .* button (or press `Ctrl+Shift+X` / `Cmd+Shift+X`) to enable regex pattern matching:
  - `^feat:` - match commits starting with "feat:"
  - `bug(fix|patch)|hotfix` - match "bugfix", "bugpatch", or "hotfix"
  - `\\bfix\\b` - match whole word "fix" (not "bugfix")
  - Invalid regex patterns show red border on the button and a descriptive error in the tooltip (e.g., "Unterminated group", "Nothing to repeat"); filtering falls back to substring matching
- **Toggle sort order** with the sort button to cycle through newest-first, oldest-first, author A-Z, and author Z-A ordering
- **Hide merge commits** with the "No Merge" button to focus on actual work commits; the count indicator shows "X of Y" when filters are active
- **Show my commits only** with the "My Commits" button to quickly filter commits authored by you (based on `git config user.name` and `user.email`). The button is disabled if git user is not configured.
- **Toggle view mode** between Unified and Side-by-Side
- **Scroll the diff viewer** to see all changes

### First-Run Tip

When you first open Git History, you'll see a welcome banner with a tip about keyboard shortcuts. Press `?` in the history panel at any time to see all available keyboard shortcuts. Click "Got it" to dismiss the tip - it will only appear once.

The tip is automatically saved using VS Code's global state, so you won't see it again after dismissing it. This ensures new users discover the powerful keyboard shortcuts available in the extension while not getting in the way of experienced users.

### Using Blame Annotations

1. Open any file in a git repository
2. Press `Ctrl+Shift+B` / `Cmd+Shift+B` or right-click and select "Toggle Blame Annotations"
3. Inline decorations appear showing the author and date for each line's last commit
4. The status bar shows commit details for the current line
5. Click the status bar or use "Git: Show Blame Commit" to view the full commit diff

**Note**: The "Show Blame Commit" command requires an active text editor. If triggered without an active editor, a warning message "No active editor found" will be displayed.

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
| **Delete tag from commit** | Delete a git tag from the selected commit (only shown when commit has tags) |
| **Cherry-pick commit** | Cherry-pick this commit onto the current branch using `git cherry-pick` |
| **Revert commit** | Revert this commit using `git revert` |
| **Reset to this commit** | Reset the current branch to this commit (soft / mixed / hard) |

**Changed Files Context Menu:**

| Action | Description |
|--------|-------------|
| **Open file at this commit** | View the file content as it was at the selected commit |
| **View diff for this file** | Show the diff for this specific file only |
| **Compare with working tree** | Show the diff between the file at this commit and your working tree |
| **Blame file** | Open the file in your editor with blame annotations toggled on |
| **Restore file from this commit** | Overwrite the working-tree file with the version from this commit (asks for confirmation) |
| **Copy path** | Copy the file's absolute path |
| **Copy relative path** | Copy the file's path relative to the repository root |
| **Reveal in File Explorer** | Open your system file explorer at the file's location |

## Keyboard Shortcuts

> Bindings marked **†** are registered to two commands in `package.json` with overlapping context; VS Code resolves them by specificity and one will shadow the other. Both actions remain available via the right-click context menu.

### Global (work from any text editor)

| Keybinding | Action |
|------------|--------|
| `Ctrl+Alt+H` / `Cmd+Alt+H` | Git History (File) |
| `Ctrl+Alt+Shift+H` / `Cmd+Alt+Shift+H` | Git History for Selection |
| `Ctrl+Shift+B` / `Cmd+Shift+B` | Toggle Blame Annotations |
| `Ctrl+Shift+R` / `Cmd+Shift+R` | Refresh History |

### Navigation

| Keybinding | Action |
|------------|--------|
| `↑` / `↓` | Navigate up/down through commits |
| `Home` / `End` | Jump to first / last commit |
| `PageDown` / `PageUp` | Jump down / up one page (10 commits) |
| `Enter` | Select focused commit and show its diff |
| `Shift+Enter` | Select range from anchor to focused commit |
| `Ctrl+Enter` / `Cmd+Enter` | Add/remove focused commit from multi-selection |
| `Ctrl+A` / `Cmd+A` | Select all visible commits |
| `Ctrl+L` / `Cmd+L` | Focus the first visible commit |
| `/` or `Ctrl+F` / `Cmd+F` | Focus the search input |
| `Ctrl+G` / `Cmd+G` | Jump to commit by hash |
| `Escape` | Clear selection and search focus |

### View & filters

| Keybinding | Action |
|------------|--------|
| `Ctrl+Shift+X` | Toggle regex search mode |
| `Ctrl+Shift+M` | Toggle "Show my commits only" filter |
| `Ctrl+Shift+Q` | Toggle hide merge commits |
| `Ctrl+Shift+3` | Cycle sort mode (Newest / Oldest / Author A-Z / Z-A) |
| `Ctrl+Shift+/` | Cycle diff context lines (1–10) |
| `Ctrl+Shift+Alt+S` | Toggle GPG signature verification badges |
| `Ctrl+Shift+W` | Toggle word wrap in diff viewer |
| `Ctrl+Shift+Alt+J` | Toggle ignore whitespace in diffs |
| `Ctrl+Alt+Q` | Clear all filters |

### Copy

| Keybinding | Action |
|------------|--------|
| `Ctrl+Shift+H` | Copy full commit hash |
| `Ctrl+Shift+7` | Copy short hash (7 characters) |
| `Ctrl+Shift+I` | Copy full commit info (hash, author, date, message) |
| `Ctrl+Shift+6` | Copy subject (commit title) |
| `Ctrl+Shift+N` | Copy author name |
| `Ctrl+Shift+A` | Copy author email |
| `Ctrl+Shift+L` | Copy commit URL |
| `Ctrl+Shift+P` | Copy `git cherry-pick <hash>` command |
| `Ctrl+Shift+U` | Copy `git revert <hash>` command |

### Git actions

| Keybinding | Action |
|------------|--------|
| `Ctrl+Alt+K` **†** | Cherry-pick commit |
| `Ctrl+Alt+R` | Revert commit |
| `Ctrl+Shift+Alt+B` **†** | Create branch at selected commit |
| `Ctrl+Alt+I` | Create tag at selected commit |
| `Ctrl+Alt+.` | Delete tag from selected commit |
| `Ctrl+Alt+S` | Show branch switcher |
| `Ctrl+Alt+X` | Delete local branch |

### Tag navigation

| Keybinding | Action |
|------------|--------|
| `Ctrl+]` | Jump to next tagged commit |
| `Ctrl+[` | Jump to previous tagged commit |
| `Ctrl+P` | Jump to parent commit |
| `?` | Show keyboard shortcuts help |

