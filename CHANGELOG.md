# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Copy file directory feature (copies directory path with trailing separator)

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