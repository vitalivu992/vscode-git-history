# Git History for VS Code

A powerful VS Code extension that provides git history visualization inspired by IntelliJ's Git History. View file history, selection history, and explore diffs with an intuitive interface.

See [CHANGELOG](CHANGELOG.md) for version history.

### File History

![File History](docs/file-history.png)

### Selection History

![Selection History](docs/selection-history.png)

## Features

- **File History**: Right-click anywhere in an editor to view the complete git history of that file, or press `Ctrl+Alt+H` / `Cmd+Alt+H`
- **Selection History**: Select lines of code and view only commits that affected those specific lines, or press `Ctrl+Alt+Shift+H` / `Cmd+Alt+Shift+H`
- **Commit Graph**: Visual branch and merge graph (like `git log --graph`) rendered as inline SVG in the history table
- **Commit Statistics**: See the number of files changed, insertions, and deletions for each commit directly in the commit list with color-coded indicators (green for additions, red for deletions). Toggle visibility with the "Stats" button or `Ctrl+Shift+Alt+T` / `Cmd+Shift+Alt+T`.
- **Search Commits**: Filter commits in real time by message, author, email, hash, or tag name with count indicator. Supports date filters: `after:YYYY-MM-DD`, `before:YYYY-MM-DD`, `last:Ndays/weeks/months`. Supports author filter: `author:name` or click any author name to filter. Supports tag filter: `tag:name` or click any tag badge to filter by tag. Supports regex mode with the .* button for advanced pattern matching like `bug(fix|patch)|hotfix` or `^feat:.*`.
- **Quick Date Range Filters**: Three buttons ("Today", "Week", "Month") next to the search input provide one-click access to common date ranges. Click to apply, click again to remove.
- **Sort Toggle**: Cycle through four sort modes with the sort button in the toolbar: Newest first, Oldest first, Author A-Z, and Author Z-A. Also accessible via `Ctrl+Shift+3` / `Cmd+Shift+3`
- **Compare Any Two Commits**: Shift+click (or Shift+Enter) two commits to see the diff between them
- **Multi-Select**: Select multiple commits to see a combined diff showing all changes
- **Diff Viewer**: Toggle between unified and side-by-side diff views with optional word wrap for long lines. Set your preferred default view via `gitHistory.defaultDiffView` setting
- **Word Wrap Toggle**: Enable word wrap in the diff viewer to handle long lines in JSON, minified code, and other content
- **Ignore Whitespace Toggle**: Toggle ignore whitespace in diffs to focus on actual code changes rather than formatting/indentation differences. Uses git's `-w` flag to render cleaner diffs when only whitespace has changed.
- **Changed Files**: See all files modified in a commit with status indicators (Added/Modified/Deleted/Renamed)
- **Git Tags**: Tag badges displayed in commit list for annotated and lightweight tags
- **Blame Annotations**: Toggle inline blame annotations showing commit author and date per line, with a status bar showing commit details for the current line. Click on any blame decoration to view the full commit in the history panel. (Note: Requires an active text editor)
- **Date Display**: Commit dates show relative time (e.g., "Today 2:30 PM", "Yesterday 3:45 PM") with time for recent commits; hover to see absolute timestamps
- **Expandable Commit Messages**: Click the arrow button on commits with multi-line messages to view the full commit body
- **Hide Merge Commits**: Toggle the "No Merge" button to filter out merge commits and focus on actual work commits; the count indicator shows how many commits are hidden
- **Show My Commits Only**: Toggle the "My Commits" button to quickly filter and show only commits authored by the current git user (based on git config user.name and user.email); disabled when git user is not configured
- **Filter Presets**: Save your frequently-used filter configurations as named presets for quick access. Press `Ctrl+Shift+0` / `Cmd+Shift+0` to save the current filter state (search query, hide merge commits, sort mode, my commits filter, regex mode, and path filter). Press `Ctrl+Shift+1` / `Cmd+Shift+1` to open the presets dropdown and load a saved preset. Up to 10 presets persist across VS Code sessions. Rename presets with `F2` when the dropdown is open, or delete them with the × button.
- **Jump to Hash**: Press `Ctrl+G` / `Cmd+G` to open a dialog and quickly navigate to a specific commit by hash
- **Tag Navigation**: Press `Ctrl+]` / `Cmd+]` to jump to the next tagged commit, or `Ctrl+[` / `Cmd+[` to jump to the previous tagged commit. Wraps around at the first/last tag. Respects active filters.
- **Jump to Parent**: Press `Ctrl+P` / `Cmd+P` to jump to the first parent of the currently focused commit. Different from "Compare with parent" which shows a diff - this navigates to and selects the parent. For root commits, an error is shown.
- **Jump to Commit with Changes**: Press `Ctrl+Alt+]` / `Cmd+Alt+]` to jump to the next commit with file changes, or `Ctrl+Alt+[` / `Cmd+Alt+[` to jump to the previous one. Skips merge commits and commits with no file changes. Wraps around and respects active filters.
- **Refresh**: Reload commit history with the refresh button or `Ctrl+Shift+R` / `Cmd+Shift+R` keyboard shortcut
- **Copy Commit Message**: Copy the commit message, author, email, and date to clipboard with the copy button or `Ctrl+Shift+C` / `Cmd+Shift+C` keyboard shortcut
- **Copy Commit Hash**: Copy the full commit hash to clipboard with `Ctrl+Shift+H` / `Cmd+Shift+H` keyboard shortcut, or click any hash chip
- **Copy Author Email**: Copy the author email address to clipboard with `Ctrl+Shift+A` / `Cmd+Shift+A` keyboard shortcut, or right-click context menu
- **Copy Author Name**: Copy the author name to clipboard with `Ctrl+Shift+N` / `Cmd+Shift+N` keyboard shortcut, or right-click context menu
- **Copy Committer Email**: Copy the committer email address to clipboard with `Ctrl+Alt+A` / `Cmd+Alt+A` or right-click context menu. The committer is the person who applied the commit (may differ from the author who wrote the code). Falls back to author email if committer information is not available.
- **Copy Committer Name**: Copy the committer name to clipboard with `Ctrl+Alt+N` / `Cmd+Alt+N` or right-click context menu. The committer is the person who applied the commit (may differ from the author who wrote the code). Falls back to author name if committer information is not available.

> **Note**: Git distinguishes between **author** (who wrote the code) and **committer** (who applied the commit). These are often the same person, but can differ when maintainers apply patches from contributors, cherry-pick commits, or merge pull requests.

- **Copy Parent Hash**: Copy the first parent hash to clipboard with `Ctrl+Shift+V` / `Cmd+Shift+V` keyboard shortcut, or right-click context menu. For root commits (no parent), an error message is shown.
- **Copy Short Hash**: Copy the 7-character short hash to clipboard with `Ctrl+Shift+7` / `Cmd+Shift+7` keyboard shortcut, or right-click context menu
- **📌 Copy Subject**: Copy only the commit subject (first line of the commit message) to clipboard with `Ctrl+Shift+6` / `Cmd+Shift+6` keyboard shortcut, or right-click context menu
- **📝 Copy Subject with Author**: Copy the commit subject together with the author name in `{subject} - {author}` format with `Ctrl+Alt+Shift+M` / `Cmd+Alt+Shift+M` keyboard shortcut or the right-click context menu. Useful for code reviews, team discussions, and changelogs where attribution matters without hash/date clutter. Example: `Fix authentication bug - John Doe`
- **📊 Copy Diff Stat Summary**: Copy just the diff stat summary (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)") to clipboard with `Ctrl+Shift+9` / `Cmd+Shift+9` keyboard shortcut, or right-click context menu. Uses singular forms when counts are 1 (e.g., "1 file changed, 1 insertion(+), 1 deletion(-)").
- **≡ Copy as Oneline**: Copy the commit in `git log --oneline` format (`{shortHash} {subject}`) to clipboard with `Ctrl+Shift+Y` / `Cmd+Shift+Y` keyboard shortcut, or right-click context menu. Example: `a1b2c3d Fix authentication bug`
- **📝 Copy as Compact**: Copy the commit in a compact single-line format (`{shortHash} - {subject} ({author}, {relativeDate})`) to clipboard with `Ctrl+Shift+.` / `Cmd+Shift+.` keyboard shortcut, or right-click context menu. Useful for quick sharing in team chat, code review summaries, and release note snippets. Example: `a1b2c3d - Fix authentication bug (John Doe, 2 days ago)`
- **📄 Copy Commit Body**: Copy just the commit body (the multi-line description after the subject line) to clipboard with `Ctrl+Shift+Z` / `Cmd+Shift+Z` keyboard shortcut, or right-click context menu. Shows "Commit has no body" for single-line commits.
- **📜 Copy as Markdown**: Copy commit information formatted as Markdown for use in changelogs, release notes, and documentation. Press `Ctrl+Alt+M` / `Cmd+Alt+M` or use the right-click context menu. The format includes commit message with heading, author, date (relative + absolute), stats, tags, and body.
- **{} Copy as JSON**: Copy the focused or selected commit as formatted JSON with all available commit data. Press `Ctrl+Alt+J` / `Cmd+Alt+J` or use the right-click context menu. The JSON includes hash, shortHash, author (name, email), date (ISO 8601), message, body (or null), parentHashes (empty array for root commits), tags (empty array if none), and stats (or null). Useful for programmatic access, API integrations, and automation workflows.
- **🌐 Copy as HTML**: Copy the focused or selected commit as styled HTML with inline CSS for portability. Press `Ctrl+Alt+H` / `Cmd+Alt+H` or use the right-click context menu. The HTML includes the commit subject, hash, author, date, stats (with colored insertions/deletions), tags (as badges), and commit body. Useful for sharing commits in emails, wikis, and HTML documentation.
- **📜 Copy as reStructuredText**: Copy the focused or selected commit as reStructuredText (ReST) format for Sphinx documentation. Press `Ctrl+Alt+Y` / `Cmd+Alt+Y` or use the right-click context menu. The format includes commit message with `=` underline, `:Author:`, `:Date:`, `:Hash:` field lists, statistics section with bold text, tags, and body section with `-` underline. Useful for Python projects using ReST-based documentation.
- **📋 Copy as Jira Format**: Copy the focused or selected commit in Jira/Confluence markup format with `Ctrl+Alt+Shift+J` / `Cmd+Alt+Shift+J` keyboard shortcut, or use the right-click context menu. The format uses Jira's text formatting syntax (`h4.` headings, `||` table headers, `|` table cells) and includes commit hash and subject as heading, author info table (Author, Date, Email), statistics, tags, and commit body. Useful for pasting commit details into Jira tickets, Confluence pages, and other Atlassian products.
- **📄 Copy as YAML**: Copy the focused or selected commit as YAML format with `Ctrl+Alt+Shift+Y` / `Cmd+Alt+Shift+Y` keyboard shortcut, or use the right-click context menu. The YAML includes structured data for hash, shortHash, author (name, email), committer (when different from author), date (ISO 8601), message, body (literal block style), parentHashes (array), tags (array), and stats (object or null). Useful for CI/CD pipelines (GitHub Actions, GitLab CI), configuration files (Kubernetes, Docker Compose, Ansible), and DevOps automation workflows.
- **📝 Copy as BBCode**: Copy the focused or selected commit as BBCode (Bulletin Board Code) format with `Ctrl+Alt+Shift+B` / `Cmd+Alt+Shift+B` keyboard shortcut, or use the right-click context menu. BBCode is used by many forum platforms including vBulletin, XenForo, phpBB, and Invision Community. The format includes commit hash, subject, author, email, date, statistics, tags, and body. Headers use `[b]bold[/b]` tags for visibility. Useful for sharing commit information on gaming forums, technical discussion boards, and community platforms that don't support Markdown.
- **📊 Copy as CSV**: Copy the focused or selected commit as CSV (Comma-Separated Values) format with `Ctrl+Alt+Shift+C` / `Cmd+Alt+Shift+C` keyboard shortcut, or use the right-click context menu. The CSV includes a header row and one data row with fields: Hash, Short Hash, Author, Email, Date, Message, Tags, Files Changed, Insertions, Deletions. Fields containing commas, quotes, or newlines are properly escaped. Useful for pasting commit data into spreadsheets, databases, and data analysis tools.
- **👥 Copy Co-Authors**: Copy co-authors from commit message to clipboard with `Ctrl+Shift+K` / `Cmd+Shift+K` keyboard shortcut, or right-click context menu. Extracts "Co-authored-by:" trailers in the format "Name <email>" separated by newlines.
- **📋 Copy Commit Trailers**: Copy all commit trailers (structured metadata in "Key: Value" format) to clipboard with `Ctrl+Shift+Alt+3` / `Cmd+Shift+Alt+3` keyboard shortcut, or right-click context menu. Extracts all trailers including Fixes, Closes, Reviewed-by, Signed-off-by, etc. Each trailer is copied on its own line.
- **🔗 Copy Issue References**: Copy issue/PR references from commit trailers to clipboard with `Ctrl+Shift+Alt+5` / `Cmd+Shift+Alt+5` keyboard shortcut, or right-click context menu. Extracts Fixes, Closes, Resolves, Related-to, and other issue reference trailers as a comma-separated list (e.g., `#123, #456`).
- **✅ Copy Reviewers**: Copy reviewer information from commit trailers to clipboard with `Ctrl+Shift+Alt+4` / `Cmd+Shift+Alt+4` keyboard shortcut, or right-click context menu. Extracts Reviewed-by, Acked-by, Tested-by, and Signed-off-by trailers as a comma-separated list.
- **🕐 Copy Commit Date**: Copy the commit date in ISO 8601 format to clipboard with `Ctrl+Shift+T` / `Cmd+Shift+T` keyboard shortcut, or right-click context menu
- **Copy Selected Hashes**: Copy all selected commit hashes as a newline-separated list with `Ctrl+Shift+;` / `Cmd+Shift+;` keyboard shortcut (when 2+ commits are selected), or right-click context menu (shown when multiple commits are selected). Falls back to single hash copy when 0 or 1 commit is selected.
- **Copy All Filtered Hashes**: Copy all currently visible commit hashes from the filtered view as a newline-separated list with `Ctrl+Shift+Alt+H` / `Cmd+Shift+Alt+H` keyboard shortcut. Unlike "Copy Selected Hashes", this copies all visible commits without requiring manual selection. Useful for batch cherry-pick operations, release notes generation, and bulk operations on filtered commit lists.
- **Copy All Filtered as Oneline**: Copy all currently visible commits in oneline format (`{shortHash} {subject}`) to clipboard with `Ctrl+Shift+Alt+Y` / `Cmd+Shift+Alt+Y` keyboard shortcut. Unlike "Copy Selected Hashes", this copies all visible commits without requiring manual selection. Useful for changelogs, release notes, and sharing commit lists in a compact format.
- **👥 Copy All Unique Authors**: Copy all unique authors from the currently filtered commits in Git format (`Name <email>`), sorted alphabetically and separated by newlines with `Ctrl+Shift+Alt+P` / `Cmd+Shift+Alt+P` keyboard shortcut. Shows count of unique authors copied. Useful for crediting contributors in release notes, finding all contributors to a feature branch, team statistics, and adding "Contributors:" sections in documentation. Deduplicates by `Name <email>` format.
- **☑️ Copy Selected Messages as Checklist**: Copy selected commit messages as a Markdown checklist (`- [ ] message`) with `Ctrl+Alt+Z` / `Cmd+Alt+Z` keyboard shortcut. Falls back to the focused commit when none are selected. Context menu entry is shown when 2+ commits are selected. Useful for creating PR review checklists, release verification lists, and sprint planning notes.
- **🔢 Copy Selected Messages as Numbered List**: Copy selected commit messages as a numbered Markdown list (`1. message`) with `Ctrl+Alt+Shift+Z` / `Cmd+Alt+Shift+Z` keyboard shortcut. Falls back to the focused commit when none are selected. Context menu entry is shown when 2+ commits are selected. Useful for numbered release notes, meeting agendas, and ordered changelogs.
- **☑️ Copy Selected Messages with Author**: These variants include author names with commit messages, useful for team reports, code reviews, and meeting agendas. Use keyboard shortcuts or the right-click context menu (shown when 2+ commits are selected) to access these options:
  - **Checklist with Author**: Copy selected commit messages as a Markdown checklist (`- [ ] Author - message`) with `Ctrl+Alt+Shift+C` / `Cmd+Alt+Shift+C` keyboard shortcut
  - **Numbered with Author**: Copy selected commit messages as a numbered Markdown list (`1. Author - message`) with `Ctrl+Alt+Shift+N` / `Cmd+Alt+Shift+N` keyboard shortcut
  Both fallback to the focused commit when 0 or 1 commit is selected.
- **Copy Commit Info**: Copy the full commit information (hash, author, date, message) to clipboard with `Ctrl+Shift+I` / `Cmd+Shift+I` keyboard shortcut
- **Copy Cherry-Pick Command**: Copy a pre-formatted `git cherry-pick <hash>` command to the clipboard with `Ctrl+Shift+P` / `Cmd+Shift+P` keyboard shortcut, or right-click on any commit
- **Copy Cherry-Pick Commands (Selected)**: Copy cherry-pick commands for multiple selected commits as newline-separated list with `Ctrl+Alt+Shift+K` / `Cmd+Alt+Shift+K` keyboard shortcut or the right-click context menu (shown when 2+ commits are selected). Falls back to single commit cherry-pick command when 0 or 1 commit is selected. Output format: `git cherry-pick hash1`, `git cherry-pick hash2`, etc.
- **Copy Revert Command**: Copy a pre-formatted `git revert <hash>` command to the clipboard with `Ctrl+Shift+U` / `Cmd+Shift+U` keyboard shortcut, or right-click on any commit
- **Copy Commit as Patch**: Copy the commit as a unified diff patch (with git headers) suitable for `git apply` or `git am` with `Ctrl+Shift+E` / `Cmd+Shift+E` keyboard shortcut, or right-click on any commit
- **Copy Commit URL**: Copy the web URL for a commit to share with others. Automatically detects GitHub, GitLab, Bitbucket, and Azure DevOps remotes (including self-hosted instances). Use `Ctrl+Shift+L` / `Cmd+Shift+L` or right-click on any commit
- **📢 Copy as Platform Mention**: Copy the commit in platform-specific mention format (e.g., `owner/repo@1b55bc0`) for use in issues, pull requests, and team discussions. Supports GitHub, GitLab, Bitbucket, and Azure DevOps. Use `Ctrl+Shift+@` / `Cmd+Shift+@` or right-click on any commit
- **🔗 Copy Commit Reference**: Copy the commit in canonical Git reference format (`refs/commit/<hash>`) to clipboard. Useful for Git submodule configurations, Git notes references, portable commit references in scripts, and Git blame references. Use `Ctrl+Shift+]` / `Cmd+Shift+]` or right-click on any commit
- **Copy Commit Stats**: Copy commit statistics (files changed, insertions, deletions) to clipboard with `Ctrl+Shift+S` / `Cmd+Shift+S` keyboard shortcut, or right-click on any commit
- **✅ Copy Signature Info**: Copy the GPG signature verification status for signed commits to clipboard. Press `Ctrl+Shift+Alt+G` / `Cmd+Shift+Alt+G` or use the right-click context menu. Shows "Signature: Verified" with signer name if the commit has a valid GPG signature, or "Signature: Not Verified" for unsigned or invalid signatures.
- **Copy Files Changed Count**: Copy just the number of files changed in a commit to clipboard with `F4` keyboard shortcut or right-click context menu. Outputs "N file" or "N files" (singular/plural). Useful for quick file count statistics without the full diff stat summary.
- **Quick Compare with Parent**: Instantly compare the selected commit with its parent to see what changed in that specific commit. Use the "Compare" button or press `Ctrl+Alt+P` / `Cmd+Alt+P`. For root commits (first commit), an error is shown since there's no parent.
- **Create Branch from Commit**: Press `Ctrl+Shift+Alt+B` / `Cmd+Shift+Alt+B` or right-click on any commit to create a new branch at that point in history. You'll be prompted for a branch name, and the branch will be created at the selected commit using `git branch <name> <hash>`.
- **Create Tag from Commit**: Press `Ctrl+Alt+I` / `Cmd+Alt+I` or right-click on any commit to create a new git tag at that point in history. Supports both lightweight tags (enter tag name only) and annotated tags (enter a message when prompted). The tag will be created using `git tag <name> <hash>` or `git tag -a <name> -m <message> <hash>`.
- **Delete Tag from Commit**: Press `Ctrl+Alt+.` / `Cmd+Alt+.` or right-click on any commit with tags to delete them. If the commit has only one tag, it will be deleted immediately with confirmation. If the commit has multiple tags, a picker lets you choose which one to delete. The tag is deleted using `git tag -d <tagname>`.
- **Cherry-pick Commit**: Right-click on any commit or press `Ctrl+Alt+K` / `Cmd+Alt+K` to cherry-pick it onto the current branch. A confirmation dialog shows the commit hash and message. The extension executes `git cherry-pick <hash>` and refreshes the panel on success. If conflicts occur, the error message from git is displayed.
- **Revert Commit**: Right-click on any commit or press `Ctrl+Alt+R` / `Cmd+Alt+R` to revert it. A confirmation dialog shows the commit hash and message. The extension executes `git revert <hash>` and refreshes the panel on success. If conflicts occur, the error message from git is displayed.
- **Branch Switching**: Right-click on the branch badge or press `Ctrl+Alt+S` / `Cmd+Alt+S` to switch between branches. A searchable picker dialog shows all local and remote branches. The panel automatically refreshes after successful checkout.
- **Delete Branch**: Press `Ctrl+Alt+X` / `Cmd+Alt+X` to open a modal dialog to select and delete local branches. The current branch is marked and cannot be deleted. For unmerged branches, git will offer a force delete option.
- **Copy Changed Files**: Copy the list of changed files for a commit to clipboard with `Ctrl+Shift+F` / `Cmd+Shift+F` keyboard shortcut, or right-click on any commit
- **Copy Commit Diff**: Copy the full diff output for a commit to clipboard with `Ctrl+Shift+D` / `Cmd+Shift+D` keyboard shortcut, or right-click on any commit
- **Copy File Path**: Right-click on any file in the changed files list to copy its full path to clipboard
- **Copy File Basename**: Copy just the filename without extension or path to clipboard. Press `Ctrl+Shift+Alt+N` / `Cmd+Shift+Alt+N` or right-click on any file in the changed files list. For example, copies "main" from "src/main.js". Useful for documentation and code references.
- **Open File at Commit**: Right-click on any file in the changed files list to view the file content as it was at that specific commit
- **Export Filtered Commits**: Click the "Export" button or press `Ctrl+Shift+O` / `Cmd+Shift+O` to export the currently filtered commit list to JSON, CSV, Markdown, Plain Text, PR Description, or mbox format. The Markdown format generates a changelog-style output with commit hashes, authors, dates, messages, tags, and statistics—perfect for release notes and documentation. The Plain Text format provides a simple, readable commit list with one commit per line in the format: `hash - message (author <email>) [+stats]`. The PR Description format generates a structured Markdown output with Summary, Changes checklist, Statistics, and Commits detail sections—ideal for pull request descriptions. The mbox format (available when 2+ commits are selected, also accessible via `Ctrl+Shift+Alt+E` / `Cmd+Shift+Alt+E`) exports RFC 822 compliant patches suitable for email clients and `git am`.
- **Import Filter Query**: Press `Ctrl+Shift+4` / `Cmd+Shift+4` or click the "Paste Filter" button to restore a previously copied filter query from clipboard. This allows you to share reproducible commit views with team members.
- **Clear All Filters**: Press `Ctrl+Alt+Q` / `Cmd+Alt+Q` or click the "Clear All" button to remove all active filters at once. Useful when you have multiple filters applied and want to quickly reset to the full commit list.
- **Select All Commits**: Press `Ctrl+A` / `Cmd+A` to quickly select all visible commits for bulk operations like export or copy
- **Branch Indicator**: Current branch name is displayed as a badge in the commit details panel for quick context
- **First-Run Welcome Tip**: On first use, a helpful tip appears directing you to keyboard shortcuts (press `?` for help), ensuring you discover the extension's full capabilities
- **Keyboard Help**: Press `?` in the history panel to show a quick reference of all available keyboard shortcuts. Use the search box at the top to filter shortcuts by description.
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

#### Context Menu Actions

Right-click on commits in the commit list or files in the changed files list to access additional options:

**Commit Row Context Menu:**

| Action | Description |
|--------|-------------|
| **Copy commit hash** | Copy the full commit hash to clipboard |
| **Copy commit message** | Copy the commit message to clipboard |
| **Copy commit info** | Copy full commit information (hash, author, date, message) |
| **Copy cherry-pick command** | Copy a pre-formatted `git cherry-pick <hash>` command |
| **Copy cherry-pick commands** | Copy cherry-pick commands for multiple selected commits (2+ commits selected) |
| **Copy revert command** | Copy a pre-formatted `git revert <hash>` command |
| **Copy changed files** | Copy the list of changed files to clipboard |
| **Copy commit diff** | Copy the full diff output to clipboard |
| **Copy as patch** | Copy the commit as a unified diff patch (for `git apply` or `git am`) |
| **Copy commit URL** | Copy the web URL (GitHub/GitLab/Bitbucket) for the commit |
| **Copy as platform mention** | Copy in `owner/repo@hash` format for issues and discussions |
| **Copy commit reference** | Copy the commit in canonical Git reference format (`refs/commit/<hash>`) |
| **Copy stats** | Copy commit statistics (files changed, insertions, deletions) to clipboard |
| **Copy author email** | Copy the author email address |
| **Copy author name** | Copy the author name |
| **Copy author (git format)** | Copy author in git format `Name <email>` - useful for Co-authored-by trailers |
| **Copy author initials** | Copy the author's initials (e.g., "JD" for "John Doe") |
| **Copy committer email** | Copy the committer email address (person who applied the commit) |
| **Copy committer name** | Copy the committer name (person who applied the commit) |
| **Copy parent hash** | Copy the first parent hash (error for root commits) |
| **Copy short hash** | Copy the 7-character short hash |
| **Copy subject** | Copy only the commit subject (first line) |
| **Copy diff stat summary** | Copy the diff stat (e.g., "3 files changed, 45 insertions(+), 12 deletions(-)") |
| **Copy files changed count** | Copy just the number of files changed (e.g., "3 files") |
| **Copy as oneline** | Copy in `git log --oneline` format |
| **Copy commit body** | Copy the commit body (description after subject) |
| **Copy as Markdown** | Copy formatted as Markdown |
| **Copy as JSON** | Copy as formatted JSON |
| **Copy as reStructuredText** | Copy as reStructuredText (ReST) format for Sphinx documentation |
| **Copy as Jira Format** | Copy in Jira/Confluence markup format for Atlassian products |
| **Copy as YAML** | Copy as YAML format for CI/CD pipelines and DevOps automation |
| **Copy as BBCode** | Copy as BBCode format for forum platforms |
| **Copy as CSV** | Copy as CSV format with headers for spreadsheets and data analysis |
| **Copy co-authors** | Copy co-authors from commit message |
| **Copy trailers** | Copy all commit trailers (Fixes, Reviewed-by, Signed-off-by, etc.) |
| **Copy issue references** | Copy issue/PR references from trailers (Fixes, Closes, Resolves, etc.) |
| **Copy reviewers** | Copy reviewer information from trailers (Reviewed-by, Acked-by, etc.) |
| **Copy commit date** | Copy date in ISO 8601 format |
| **Copy relative date** | Copy date in relative format |
| **Copy branch name** | Copy the current branch name |
| **Copy branch URL** | Copy the web URL for the current branch |
| **Copy remote URL** | Copy the raw git remote URL |
| **Copy file permalink** | Copy permanent web URL for a file at a specific commit |
| **Copy tags** | Copy all tags for this commit |
| **Copy Unix timestamp** | Copy the Unix timestamp (epoch seconds) for the commit |
| **Copy file stats** | Copy per-file statistics showing insertions and deletions for each changed file |
| **Copy message with stats** | Copy the commit message together with diff stat summary |
| **Copy selected hashes** | Copy all selected commit hashes (2+ commits selected) |
| **Copy messages as checklist** | Copy selected commit messages as checklist Markdown list (`- [ ] message`) - shown when 2+ commits are selected |
| **Copy messages as numbered list** | Copy selected commit messages as numbered Markdown list (`1. message`) - shown when 2+ commits are selected |
| **Copy combined diff** | Copy combined diff of all selected commits |
| **Copy git show command** | Copy a pre-formatted `git show <hash>` command to the clipboard |
| **Copy git describe** | Copy git describe output showing nearest tag and commit count (e.g., `v1.2.3-45-gabcdef1`) |
| **Copy range diff** | Copy diff between two commits (range selected) |
| **Compare with parent** | Compare this commit with its parent |
| **Create branch from commit** | Create a new branch at the selected commit |
| **Create tag from commit** | Create a git tag at the selected commit |
| **Delete tag from commit** | Delete a git tag from the selected commit (only shown when commit has tags) |
| **Cherry-pick commit** | Cherry-pick this commit onto the current branch using `git cherry-pick` |
| **Revert commit** | Revert this commit using `git revert` |

**Changed Files Context Menu:**

| Action | Description |
|--------|-------------|
| **Open file at this commit** | View the file content as it was at the selected commit |
| **View diff for this file** | Show the diff for this specific file only |
| **Copy diff for this file** | Copy the diff for this specific file to clipboard |
| **Copy file content** | Copy the full content of a file at the selected commit to clipboard |
| **Copy file path** | Copy the full file path to clipboard |
| **Copy file name only** | Copy just the filename (e.g., `main.js`) to clipboard |
| **Copy file basename (without extension)** | Copy the filename without path or extension (e.g., `main.js` → `main`) |
| **Copy file extension** | Copy just the file extension (e.g., `ts` from `main.ts`) to clipboard |
| **Copy file directory** | Copy the directory path containing the file (with trailing separator, e.g., `src/webview/panel/`) |
| **Copy relative path** | Copy the file path relative to the git repository root (e.g., `src/webview/panel/main.js`) |
| **Copy path with hash** | Copy the file path with commit hash in `{shortHash}:{filePath}` format (e.g., `a1b2c3d:src/main.ts`) with `Ctrl+Alt+Shift+B` / `Cmd+Alt+Shift+B` keyboard shortcut |
| **Copy git show command** | Copy a pre-formatted `git show <hash>:<file>` command for the file to clipboard |
| **Copy file permalink** | Copy permanent web URL for the file at the selected commit (GitHub/GitLab/Bitbucket) |
| **Copy all file permalinks** | Copy newline-separated permanent web URLs for all files changed in the commit |
| **Reveal File in Explorer** | Open the file in your system's file explorer |

#### Keyboard Navigation

Navigate the commit list using keyboard shortcuts:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate up/down through commits |
| `Home` | Jump to first commit |
| `End` | Jump to last commit |
| `PageDown` | Jump down one page (10 commits) |
| `PageUp` | Jump up one page (10 commits) |
| `Enter` | Select focused commit and show its diff |
| `Shift+Enter` | Select range from anchor to focused commit |
| `Ctrl+Enter` / `Cmd+Enter` | Add/remove focused commit from multi-selection |
| `Ctrl+A` / `Cmd+A` | Select all visible commits |
| `/` or `Ctrl+F` / `Cmd+F` | Focus the search input |
| `Ctrl+Shift+C` / `Cmd+Shift+C` | Copy commit message to clipboard |
| `Ctrl+Shift+H` / `Cmd+Shift+H` | Copy commit hash to clipboard |
| `Ctrl+Shift+I` / `Cmd+Shift+I` | Copy full commit info to clipboard |
| `Ctrl+Shift+Alt+J` / `Cmd+Shift+Alt+J` | Toggle ignore whitespace in diffs |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Copy cherry-pick command to clipboard |
| `Ctrl+Shift+U` / `Cmd+Shift+U` | Copy revert command to clipboard |
| `Ctrl+Shift+W` / `Cmd+Shift+W` | Toggle word wrap in diff viewer |
| `Ctrl+Shift+E` / `Cmd+Shift+E` | Copy commit as patch to clipboard |
| `Ctrl+Shift+L` / `Cmd+Shift+L` | Copy commit URL to clipboard |
| `Ctrl+Shift+@` / `Cmd+Shift+@` | Copy as platform mention (`owner/repo@hash`) |
| `Ctrl+Shift+]` / `Cmd+Shift+]` | Copy commit reference (`refs/commit/<hash>`) |
| `Ctrl+Shift+M` / `Cmd+Shift+M` | Toggle "Show my commits only" filter |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | Copy commit stats to clipboard |
| `Ctrl+Shift+3` / `Cmd+Shift+3` | Cycle sort mode (Newest/Oldest/Author A-Z/Author Z-A) |
| `Ctrl+Alt+A` / `Cmd+Alt+A` | Copy committer email to clipboard |
| `Ctrl+Alt+B` / `Cmd+Alt+B` | Copy branch name to clipboard |
| `Ctrl+Alt+D` / `Cmd+Alt+D` | Copy combined diff to clipboard (2+ commits selected) |
| `Ctrl+Alt+F` / `Cmd+Alt+F` | Copy file diff to clipboard (for focused file in changed files list) |
| `Ctrl+Alt+C` / `Cmd+Alt+C` | Copy file content at commit to clipboard (for focused file in changed files list) |
| `Ctrl+Alt+G` / `Cmd+Alt+G` | Copy git describe to clipboard |
| `Ctrl+Alt+K` / `Cmd+Alt+K` | Copy file directory to clipboard (for focused file in changed files list) |
| `Ctrl+Alt+E` / `Cmd+Alt+E` | Copy file extension to clipboard (for focused file in changed files list) |
| `Ctrl+Alt+Shift+E` / `Cmd+Alt+Shift+E` | Reveal file in system file explorer |
| `Ctrl+Alt+L` / `Cmd+Alt+L` | Copy relative file path to clipboard |
| `Ctrl+Alt+W` / `Cmd+Alt+W` | Copy commit message with stats to clipboard |
| `Ctrl+Shift+Alt+I` / `Cmd+Shift+Alt+I` | Copy full commit info with file stats to clipboard |
| `Ctrl+Alt+N` / `Cmd+Alt+N` | Copy committer name to clipboard |
| `Ctrl+Alt+O` / `Cmd+Alt+O` | Copy remote URL to clipboard |
| `Ctrl+Alt+Q` / `Cmd+Alt+Q` | Clear all filters |
| `Ctrl+Shift+Alt+R` / `Cmd+Shift+Alt+R` | Copy range diff to clipboard (range selected) |
| `Ctrl+Alt+S` / `Cmd+Alt+S` | Show branch switcher |
| `Ctrl+Alt+U` / `Cmd+Alt+U` | Copy branch URL to clipboard |
| `Ctrl+Alt+Shift+U` / `Cmd+Alt+Shift+U` | Copy file permalink to clipboard |
| `Ctrl+Shift+Alt+U` / `Cmd+Shift+Alt+U` | Copy all file permalinks to clipboard (newline-separated) |
| `Ctrl+Shift+G` / `Cmd+Shift+G` | Copy tags to clipboard |
| `Ctrl+Shift+A` / `Cmd+Shift+A` | Copy author email to clipboard |
| `Ctrl+Shift+N` / `Cmd+Shift+N` | Copy author name to clipboard |
| `Ctrl+Alt+Shift+A` / `Cmd+Alt+Shift+A` | Copy author in git format (`Name <email>`) |
| `Ctrl+Alt+Shift+I` / `Cmd+Alt+Shift+I` | Copy author initials (e.g., "JD" for "John Doe") |
| `Ctrl+Alt+Shift+B` / `Cmd+Alt+Shift+B` | Copy file path with hash to clipboard (`shortHash:filePath`) |
| `Ctrl+Alt+Shift+K` / `Cmd+Alt+Shift+K` | Copy cherry-pick commands for selected commits to clipboard |
| `Ctrl+Alt+Shift+M` / `Cmd+Alt+Shift+M` | Copy subject with author to clipboard |
| `Ctrl+Shift+V` / `Cmd+Shift+V` | Copy parent hash to clipboard |
| `Ctrl+Shift+7` / `Cmd+Shift+7` | Copy short hash (7 characters) to clipboard |
| `Ctrl+Shift+6` / `Cmd+Shift+6` | Copy subject (commit title) to clipboard |
| `Ctrl+Shift+9` / `Cmd+Shift+9` | Copy diff stat summary to clipboard |
| `Ctrl+Shift+Y` / `Cmd+Shift+Y` | Copy as oneline (`shortHash subject`) to clipboard |
| `Ctrl+Shift+.` / `Cmd+Shift+.` | Copy as compact (`shortHash - subject (author, relativeDate)`) to clipboard |
| `Ctrl+Shift+K` / `Cmd+Shift+K` | Copy co-authors to clipboard |
| `Ctrl+Shift+Alt+3` / `Cmd+Shift+Alt+3` | Copy all commit trailers to clipboard |
| `Ctrl+Shift+Alt+5` / `Cmd+Shift+Alt+5` | Copy issue references from trailers to clipboard |
| `Ctrl+Shift+Alt+4` / `Cmd+Shift+Alt+4` | Copy reviewers from trailers to clipboard |
| `Ctrl+Shift+T` / `Cmd+Shift+T` | Copy commit date (ISO 8601 format) to clipboard |
| `Ctrl+Shift+J` / `Cmd+Shift+J` | Copy short date (YYYY-MM-DD format) to clipboard |
| `Ctrl+Shift+8` / `Cmd+Shift+8` | Copy relative date (e.g., "Today 2:30 PM", "3 days ago") to clipboard |
| `Ctrl+Shift+2` / `Cmd+Shift+2` | Copy Unix timestamp (epoch seconds) to clipboard |
| `Ctrl+Shift+Alt+F` / `Cmd+Shift+Alt+F` | Copy file stats (per-file insertions/deletions) to clipboard |
| `Ctrl+Shift+;` / `Cmd+Shift+;` | Copy selected hashes to clipboard (2+ commits) |
| `Ctrl+Shift+,` / `Cmd+Shift+,` | Copy file name only to clipboard |
| `Ctrl+Shift+Alt+N` / `Cmd+Shift+Alt+N` | Copy file basename without extension to clipboard |
| `F6` | Copy file path to clipboard (for focused file in changed files list) |
| `Ctrl+Shift+O` / `Cmd+Shift+O` | Export filtered commits to file |
| `Ctrl+Shift+5` / `Cmd+Shift+5` | Copy filter query state to clipboard (includes search query and all toggle states as JSON) |
| `Ctrl+Shift+4` / `Cmd+Shift+4` | Paste/import filter query from clipboard |
| `Ctrl+Alt+Shift+L` / `Cmd+Alt+Shift+L` | Copy current filter as equivalent `git log` command |
| `Ctrl+Alt+P` / `Cmd+Alt+P` | Quick compare with parent |
| `Ctrl+Alt+X` / `Cmd+Alt+X` | Delete local branch |
| `Ctrl+Shift+Alt+B` / `Cmd+Shift+Alt+B` | Create branch at selected commit |
| `Ctrl+Alt+I` / `Cmd+Alt+I` | Create tag at selected commit |
| `Ctrl+Alt+.` / `Cmd+Alt+.` | Delete tag from selected commit |
| `Ctrl+Alt+K` / `Cmd+Alt+K` | Cherry-pick commit onto current branch |
| `Ctrl+Alt+R` / `Cmd+Alt+R` | Revert commit |
| `Ctrl+Shift+Alt+E` / `Cmd+Shift+Alt+E` | Export commits as mbox format |
| `Ctrl+Shift+Alt+G` / `Cmd+Shift+Alt+G` | Copy signature info to clipboard |
| `Ctrl+Shift+Alt+S` / `Cmd+Shift+Alt+S` | Toggle GPG signature verification badges |
| `Ctrl+Shift+Alt+T` / `Cmd+Shift+Alt+T` | Toggle stats column visibility |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Copy changed files to clipboard |
| `Ctrl+Shift+D` / `Cmd+Shift+D` | Copy commit diff to clipboard |
| `Ctrl+Shift+X` / `Cmd+Shift+X` | Toggle regex search mode |
| `Ctrl+Shift+Q` / `Cmd+Shift+Q` | Toggle hide merge commits |
| `Ctrl+Shift+/` / `Cmd+Shift+/` | Cycle diff context lines (1-10) |
| `Ctrl+G` / `Cmd+G` | Jump to commit by hash |
| `Ctrl+K Ctrl+O` / `Cmd+K Cmd+O` | Open commit URL in browser |
| `Ctrl+K Ctrl+P` / `Cmd+K Cmd+P` | Open file URL in browser |
| `Ctrl+Shift+0` / `Cmd+Shift+0` | Save filter preset |
| `Ctrl+Shift+1` / `Cmd+Shift+1` | Load filter preset |
| `F2` or ✎ button | Rename preset (in presets dropdown) |
| `?` | Show keyboard shortcuts help |
| `Escape` | Clear selection and search focus |

### Using Blame Annotations

1. Open any file in a git repository
2. Press `Ctrl+Shift+B` / `Cmd+Shift+B` or right-click and select "Toggle Blame Annotations"
3. Inline decorations appear showing the author and date for each line's last commit
4. The status bar shows commit details for the current line
5. Click the status bar or use "Git: Show Blame Commit" to view the full commit diff

**Note**: The "Show Blame Commit" command requires an active text editor. If triggered without an active editor, a warning message "No active editor found" will be displayed.

## Requirements

- Visual Studio Code 1.85.0 or higher
- Git installed and available in your PATH
- A git repository

## Extension Settings

This extension contributes the following settings:

* `gitHistory.maxCommits`: Maximum number of commits to display (default: 500)
* `gitHistory.showGraph`: Show commit graph visualization in the history view (default: true)
* `gitHistory.hideMergeCommits`: Hide merge commits in the history view (default: false)
* `gitHistory.blame.dateFormat`: Date format for blame annotations - `relative` (e.g., "2 days ago"), `short` (e.g., "2024-03-15"), or `iso` (e.g., "2024-03-15T10:30:00Z") (default: `relative`)
* `gitHistory.defaultDiffView`: Default diff view mode when opening Git History - `unified` or `side-by-side` (default: `unified`). **Note**: User settings from the previous session take precedence over this configuration.
* `gitHistory.diffContextLines`: Number of context lines to show in diffs (default: `3`, range: `1-10`). Increase for more context during code review, decrease for more focused diffs.
* `gitHistory.showSignatures`: Show GPG signature verification status for signed commits (default: true)

### Persistent User Preferences

Git History automatically saves and restores your view preferences across VS Code sessions. The following settings are remembered:

- **Diff Type**: Your choice of unified or side-by-side diff view
- **Word Wrap**: Whether word wrap is enabled in the diff viewer
- **Sort Order**: Newest-first or oldest-first commit ordering
- **Hide Merge Commits**: Whether merge commits are filtered out
- **Show My Commits Only**: Whether to show only commits by the current git user
- **Regex Search Mode**: Whether regex search is enabled
- **Ignore Whitespace**: Whether to ignore whitespace in diffs

These preferences are saved automatically when you change them in the UI, and restored the next time you open Git History. This allows you to maintain your preferred workflow without reconfiguring each time.

## Keyboard Shortcuts

### Global Commands

| Command | Keybinding |
|---------|------------|
| Git History (File) | `Ctrl+Alt+H` / `Cmd+Alt+H` |
| Git History for Selection | `Ctrl+Alt+Shift+H` / `Cmd+Alt+Shift+H` |
| Toggle Blame Annotations | `Ctrl+Shift+B` / `Cmd+Shift+B` |
| Refresh History | `Ctrl+Shift+R` / `Cmd+Shift+R` |

**Note**: These global shortcuts work from any text editor (not just within the Git History panel). They are also shown in the Keyboard Help dialog (`?` key) under the "Global Editor Shortcuts" section.

### History Panel Navigation

| Command | Keybinding |
|---------|------------|
| Navigate commits (up/down) | `↑` / `↓` |
| First commit | `Home` |
| Last commit | `End` |
| Page down | `PageDown` |
| Page up | `PageUp` |
| Select commit | `Enter` |
| Multi-select toggle | `Ctrl+Enter` / `Cmd+Enter` |
| Focus commit list | `Ctrl+L` / `Cmd+L` |
| Focus search | `/` or `Ctrl+F` / `Cmd+F` |
| Copy commit message | `Ctrl+Shift+C` / `Cmd+Shift+C` |
| Toggle word wrap | `Ctrl+Shift+W` / `Cmd+Shift+W` |
| Toggle ignore whitespace | `Ctrl+Shift+Alt+J` / `Cmd+Shift+Alt+J` |
| Toggle my commits filter | `Ctrl+Shift+M` / `Cmd+Shift+M` |
| Toggle regex search mode | `Ctrl+Shift+X` / `Cmd+Shift+X` |
| Cycle sort mode (Newest/Oldest/Author A-Z/Author Z-A) | `Ctrl+Shift+3` / `Cmd+Shift+3` |
| Cycle diff context lines (1-10) | `Ctrl+Shift+/` / `Cmd+Shift+/` |
| Copy commit hash | `Ctrl+Shift+H` / `Cmd+Shift+H` |
| Copy commit subject | `Ctrl+Shift+6` / `Cmd+Shift+6` |
| Copy diff stat summary | `Ctrl+Shift+9` / `Cmd+Shift+9` |
| Copy as oneline | `Ctrl+Shift+Y` / `Cmd+Shift+Y` |
| Copy as compact | `Ctrl+Shift+.` / `Cmd+Shift+.` |
| Copy commit date | `Ctrl+Shift+T` / `Cmd+Shift+T` |
| Copy relative date | `Ctrl+Shift+8` / `Cmd+Shift+8` |
| Copy short hash | `Ctrl+Shift+7` / `Cmd+Shift+7` |
| Copy commit body | `Ctrl+Shift+Z` / `Cmd+Shift+Z` |
| Copy as Markdown | `Ctrl+Alt+M` / `Cmd+Alt+M` |
| Copy as JSON | `Ctrl+Alt+J` / `Cmd+Alt+J` |
| Copy as HTML | `Ctrl+Alt+H` / `Cmd+Alt+H` |
| Copy as reStructuredText | `Ctrl+Alt+Y` / `Cmd+Alt+Y` |
| Copy as Jira Format | `Ctrl+Alt+Shift+J` / `Cmd+Alt+Shift+J` |
| Copy as YAML | `Ctrl+Alt+Shift+Y` / `Cmd+Alt+Shift+Y` |
| Copy as BBCode | `Ctrl+Alt+Shift+B` / `Cmd+Alt+Shift+B` |
| Copy as CSV | `Ctrl+Alt+Shift+C` / `Cmd+Alt+Shift+C` |
| Copy co-authors | `Ctrl+Shift+K` / `Cmd+Shift+K` |
| Copy trailers | `Ctrl+Shift+Alt+3` / `Cmd+Shift+Alt+3` |
| Copy issue references | `Ctrl+Shift+Alt+5` / `Cmd+Shift+Alt+5` |
| Copy reviewers | `Ctrl+Shift+Alt+4` / `Cmd+Shift+Alt+4` |
| Copy file path | `F6` |
| Copy file name | `Ctrl+Shift+,` / `Cmd+Shift+,` |
| Copy file extension | `Ctrl+Alt+E` / `Cmd+Alt+E` |
| Copy relative path | `Ctrl+Alt+L` / `Cmd+Alt+L` |
| Copy branch URL | `Ctrl+Alt+U` / `Cmd+Alt+U` |
| Copy file permalink | `Ctrl+Alt+Shift+U` / `Cmd+Alt+Shift+U` |
| Copy remote URL | `Ctrl+Alt+O` / `Cmd+Alt+O` |
| Copy combined diff | `Ctrl+Alt+D` / `Cmd+Alt+D` (2+ selected) |
| Copy range diff | `Ctrl+Shift+Alt+R` / `Cmd+Shift+Alt+R` (range selected) |
| Copy file diff | `Ctrl+Alt+F` / `Cmd+Alt+F` |
| Copy file content | `Ctrl+Alt+C` / `Cmd+Alt+C` |
| Copy git show command | `Ctrl+Alt+V` / `Cmd+Alt+V` |
| Copy file show command | `Ctrl+Alt+Shift+V` / `Cmd+Alt+Shift+V` |
| Copy git describe | `Ctrl+Alt+G` / `Cmd+Alt+G` |
| Copy selected hashes | `Ctrl+Shift+;` / `Cmd+Shift+;` (when 2+ selected) |
| Copy selected messages as checklist | `Ctrl+Alt+Z` / `Cmd+Alt+Z` (when 2+ selected) |
| Copy selected messages as numbered list | `Ctrl+Alt+Shift+Z` / `Cmd+Alt+Shift+Z` (when 2+ selected) |
| Clear selection | `Escape` |

### Filter Presets

| Command | Keybinding |
|---------|------------|
| Save filter preset | `Ctrl+Shift+0` / `Cmd+Shift+0` |
| Load filter preset | `Ctrl+Shift+1` / `Cmd+Shift+1` |
| Rename filter preset | `F2` (when dropdown is open) |

### Tag Navigation

| Command | Keybinding |
|---------|------------|
| Jump to next tag | `Ctrl+]` / `Cmd+]` |
| Jump to previous tag | `Ctrl+[` / `Cmd+[` |
| Jump to parent | `Ctrl+P` / `Cmd+P` |
| Jump to next commit with changes | `Ctrl+Alt+]` / `Cmd+Alt+]` |
| Jump to previous commit with changes | `Ctrl+Alt+[` / `Cmd+Alt+[` |

## License

MIT

## Issues

Report issues at: https://github.com/vitalivu992/vscode-git-history/issues

