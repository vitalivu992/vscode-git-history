# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Move blame annotations from the left of the code (next to the line number) to trailing the line: annotations render after the text and are padded to start exactly at the `gitHistory.blame.annotationOffset` column (default `160`); lines longer than the offset hide the annotation so it stays aligned and never renders over the code

### Removed
- Remove the unused `focusCommitList` webview-to-extension message type from the protocol (the `Ctrl+L` focus action goes through the `triggerAction` message and was never affected)

## [1.2.7] - 2026-09-10

### Added
- Copy file URL at this commit (changed-files context menu) — copies the file's permalink (GitHub/GitLab/Bitbucket/Azure DevOps) to the clipboard

### Fixed
- Fix changed-files actions in workspaces opened at a repository subdirectory: file paths are now resolved against the repository root instead of the workspace folder, so open-at-commit, restore, compare with working tree, blame, copy/reveal path, and file permalinks all target the right file

## [1.2.6] - 2026-09-07

CI and publishing workflow updates only (no functional changes).

## [1.2.5] - 2026-09-07

### Fixed
- Fix the commit table never populating when the Git History tab is opened directly: the view-provider instance now binds the `GitHistoryPanel.currentPanel` singleton on resolve, and loading defaults the working directory to the first workspace folder

## [1.2.4] - 2026-09-06

### Changed
- Split the Git History UI into two surfaces: the bottom-panel "Git History" tab keeps the commit list and changed-files detail, while a commit's diff now opens in a reusable editor-area tab (titled `<shortHash> <subject>`) created without stealing focus from the panel. The diff controls (Unified/Side by Side, Wrap, ignore-whitespace, context lines) moved to the diff tab; their shortcuts (`Ctrl+Shift+W`, `Ctrl+Shift+Alt+J`, `Ctrl+Shift+/`) and refresh now also work while the diff tab is focused

## [1.2.3] - 2026-09-05

### Added
- Git History now opens as a bottom-panel tab ("Git History") beside Terminal instead of an editor tab
- Quick date-filter buttons: "Today" and a configurable "Last N weeks" sprint button (`gitHistory.sprintLengthWeeks`, default 2)
- Sort the commit list via the clickable Author/Date column headers (Newest, Oldest, Author A-Z, Author Z-A) and cycle modes with `Ctrl+Shift+3`
- Open commit URL in browser (`Ctrl+Shift+Alt+L` / `Cmd+Shift+Alt+L`), available via context menu and keyboard shortcut
- Include short commit hash in blame decorations for quick line-to-commit tracing
- Copy short date (`Ctrl+Alt+D` / `Cmd+Alt+D`) — copies the commit date as `YYYY-MM-DD`, also in the commit context menu
- Copy trailers (`Ctrl+Shift+Alt+3` / `Cmd+Shift+Alt+3`) — copies the commit message trailer block (`Signed-off-by:` etc.), also in the commit context menu
- Copy range diff (`Ctrl+Shift+Alt+R` / `Cmd+Shift+Alt+R`) — copies the diff between two Shift+click-selected commits
- Open file URL at this commit (changed-files context menu) — opens the file's permalink on GitHub/GitLab/Bitbucket/Azure DevOps
- Quick compare with parent (`Ctrl+Alt+P` / `Cmd+Alt+P`) — shows the diff between the focused commit and its first parent
- Commit-list pagination — commits beyond `gitHistory.maxCommits` load in batches via a "Load more" row at the bottom of the list

### Fixed
- Fix ignore-whitespace shortcut mismatch: webview handler now requires `Alt` key (`Ctrl+Shift+Alt+J`), and all tooltips show the correct chord
- Remove placeholder keyboard-conflict tests that advertised unimplemented copy shortcuts (copy short date, copy trailers, copy range diff); each feature now lands with its own real tests

### Removed
- Remove the Signatures toggle (button, `gitHistory.toggleSignatures` command/keybinding, and setting); GPG signature badges now always render

## [1.2.2] - 2026-08-22

Documentation and audit fixes only (no functional changes).

## [1.2.1] - 2026-08-22

### Changed
- Fix extension display name casing; reconstruct this changelog for v1.1.4–v1.2.0

## [1.2.0] - 2026-08-22

Version bump; no functional changes since 1.1.10.

## [1.1.10] - 2026-08-22

### Added
- Register webview actions as commands for keybinding discoverability: jump to hash, jump to next/previous tag, jump to parent, focus search, show keyboard help, toggle My Commits, clear all filters, and cycle sort mode (`Ctrl+Shift+3`)

## [1.1.9] - 2026-08-22

### Changed
- Update extension display name and icons; add VS Code Marketplace publishing workflow

## [1.1.8] - 2026-08-21

No user-facing changes (repository metadata and packaging updates only).

## [1.1.7] - 2026-08-21

### Added
- Blame file from the changed-files context menu (opens the file with blame annotations on)
- Configurable commit-list date format via `gitHistory.commitList.dateFormat` (`relative`, `short`, or `iso`)
- `message:` / `body:` scoped search keywords (restrict text search to the commit subject or body)
- Rename branch from the panel ("Git History: Rename Branch" — local-branch picker plus a prefilled new-name prompt, runs `git branch -m`)

### Fixed
- Combined diff of same-timestamp commits (common after rebases/squashes) could be empty or partial because range endpoints were picked by hash order when commit dates tied; ties are now broken by ancestry

## [1.1.6] - 2026-08-21

No user-facing changes (CI workflow updates only).

## [1.1.5] - 2026-08-11

### Added
- Repository / branch-wide history view ("Git History (Repository)" command)
- Commit diff stats bar (`N files changed, +N insertions, -N deletions`)
- Restore single file from commit (`git checkout <hash> -- <file>`)
- Compare file-at-commit with working tree
- Copy file path / copy relative path / reveal in file explorer (changed-files context menu)
- Search within diff content (find commits whose diffs contain a string)
- Reset to commit with soft/mixed/hard mode selector

## [1.1.4] - 2026-08-09

### Removed
- Copy commit message (commit-table copy action and `Ctrl+Shift+C` binding)
- Quick compare with parent (the "Compare" button, `Ctrl+Alt+P`, and the "Compare with parent" context-menu entry)
- Export filtered commits to JSON/CSV/Markdown/Plain Text/PR-description/mbox (`Ctrl+Shift+O` / `Ctrl+Shift+Alt+E` and the Export button)
- Commit graph visualization (inline SVG graph column, the Graph toggle, `Ctrl+Alt+T`, and the `gitHistory.showGraph` setting)
- Commit statistics family (the Stats column and toggle `Ctrl+Shift+Alt+T`, per-commit files-changed/insertions/deletions parsing, and all stats copy/jump actions: copy stats, diff-stat summary, per-file stats, files-changed count, message-with-stats, full-info-with-file-stats, and jump-to-next/previous-commit-with-changes)
- Filter presets (save/load/rename via `Ctrl+Shift+0` / `Ctrl+Shift+1` / `F2` and the Presets dropdown)
- Copy & paste filter state (copy/paste filter query as JSON via `Ctrl+Shift+5` / `Ctrl+Shift+4` and copy-filter-as-`git log`-command via `Ctrl+Alt+Shift+L`)
- Removed 62 niche copy/export/file/URL/diff/bulk commands for open-source release. Retained core: history views, search/filter, diff viewer, blame, git ops, keyboard nav, and 9 essential copy commands.

## [1.1.2] - 2026-03-13

### Added
- Azure DevOps platform support for URL generation
- Open commit URL in browser feature
- Open file permalink in browser feature
- Copy file permalink feature
- Copy file extension feature
- Copy commit reference feature (`refs/commit/<hash>`)
- Copy as platform mention feature (`owner/repo@hash`)
- Copy as git describe feature

### Fixed
- Add defensive validation to git stats parser (handles malformed git output)
- Update error message to include Azure DevOps in supported platforms

## [1.1.1] - 2026-03-12

### Added
- Click file to view individual file diff
- Commit graph visualization
- Auto-select latest commit on panel load
- Bundle diff2html locally (instead of using CDN)

### Changed
- Use GitHub-like diff2html theme

### Fixed
- Include commit hash before file path in git show command

## [1.0.0] - 2026-03-10

### Added
- Initial stable release

[Unreleased]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.7...HEAD
[1.2.7]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.6...v1.2.7
[1.2.6]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/vitalivu992/vscode-git-history/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.10...v1.2.0
[1.1.10]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.2...v1.1.4
[1.1.2]: https://github.com/vitalivu992/vscode-git-history/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/vitalivu992/vscode-git-history/compare/v1.0.0...v1.1.1
[1.0.0]: https://github.com/vitalivu992/vscode-git-history/releases/tag/v1.0.0