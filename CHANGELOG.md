# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Combined diff of same-timestamp commits (common after rebases/squashes) could be empty or partial because range endpoints were picked by hash order when commit dates tied; ties are now broken by ancestry

### Removed
- Copy commit message (commit-table copy action and `Ctrl+Shift+C` binding)
- Quick compare with parent (the "Compare" button, `Ctrl+Alt+P`, and the "Compare with parent" context-menu entry)
- Export filtered commits to JSON/CSV/Markdown/Plain Text/PR-description/mbox (`Ctrl+Shift+O` / `Ctrl+Shift+Alt+E` and the Export button)
- Commit graph visualization (inline SVG graph column, the Graph toggle, `Ctrl+Alt+T`, and the `gitHistory.showGraph` setting)
- Commit statistics family (the Stats column and toggle `Ctrl+Shift+Alt+T`, per-commit files-changed/insertions/deletions parsing, and all stats copy/jump actions: copy stats, diff-stat summary, per-file stats, files-changed count, message-with-stats, full-info-with-file-stats, and jump-to-next/previous-commit-with-changes)
- Filter presets (save/load/rename via `Ctrl+Shift+0` / `Ctrl+Shift+1` / `F2` and the Presets dropdown)
- Copy & paste filter state (copy/paste filter query as JSON via `Ctrl+Shift+5` / `Ctrl+Shift+4` and copy-filter-as-`git log`-command via `Ctrl+Alt+Shift+L`)
- Removed 62 niche copy/export/file/URL/diff/bulk commands for open-source release. Retained core: history views, search/filter, diff viewer, blame, git ops, keyboard nav, and 9 essential copy commands.

### Added
- Repository / branch-wide history view ("Git History (Repository)" command)
- Commit diff stats bar (`N files changed, +N insertions, -N deletions`)
- Restore single file from commit (`git checkout <hash> -- <file>`)
- Compare file-at-commit with working tree
- Blame file from the changed-files context menu (opens the file with blame annotations on)
- Configurable commit-list date format via `gitHistory.commitList.dateFormat` (`relative`, `short`, or `iso`)
- `message:` / `body:` scoped search keywords (restrict text search to the commit subject or body)
- Rename branch from the panel ("Git History: Rename Branch" — local-branch picker plus a prefilled new-name prompt, runs `git branch -m`)
- Copy file path / copy relative path / reveal in file explorer (changed-files context menu)
- Search within diff content (find commits whose diffs contain a string)
- Reset to commit with soft/mixed/hard mode selector

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

[Unreleased]: https://github.com/lvsoftwares/vscode-git-history/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/lvsoftwares/vscode-git-history/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/lvsoftwares/vscode-git-history/compare/v1.0.0...v1.1.1
[1.0.0]: https://github.com/lvsoftwares/vscode-git-history/releases/tag/v1.0.0