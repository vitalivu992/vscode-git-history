# Copy/Export E2E Test Coverage Analysis

## Summary

This document analyzes the test coverage for all copy and export commands in the VS Code Git History extension.

## E2E Test Patterns

### File Naming Convention
E2E tests follow the pattern: {CommandName}E2E.test.ts
Located in: test/suite/

### Available E2E Test Files

#### Copy Commands with E2E Tests
- copyAuthorEmailE2E.test.ts - Copy Author Email
- copyAuthorNameE2E.test.ts - Copy Author Name
- copyBranchNameE2E.test.ts - Copy Branch Name
- copyBranchUrlE2E.test.ts - Copy Branch URL
- copyCherryPickE2E.test.ts - Copy Cherry-Pick Command
- copyCommitBodyE2E.test.ts - Copy Commit Body
- copyCommitDateE2E.test.ts - Copy Commit Date
- copyCommitInfoE2E.test.ts - Copy Commit Info
- copyCommitJsonE2E.test.ts - Copy Commit as JSON
- copyCommitMarkdownE2E.test.ts - Copy Commit as Markdown
- copyCommitMentionE2E.test.ts - Copy as Platform Mention
- copyCommitPatchE2E.test.ts - Copy Commit as Patch
- copyCommitRefE2E.test.ts - Copy Commit Reference
- copyCommitUrlE2E.test.ts - Copy Commit URL
- copyHashE2E.test.ts - Copy Commit Hash
- copyDiffStatSummary.test.ts - Copy Diff Stat Summary (Note: Not E2E)
- copyFileContentE2E.test.ts - Copy File Content
- copyFileDiffE2E.test.ts - Copy File Diff
- copyFileDirectoryE2E.test.ts - Copy File Directory (Context menu)
- copyFileExtensionE2E.test.ts - Copy File Extension
- copyFileNameE2E.test.ts - Copy File Name (Context menu)
- copyFilePathE2E.test.ts - Copy File Path
- copyFileUrlE2E.test.ts - Copy File Permalink
- copyFilterQueryE2E.test.ts - Copy Filter Query
- copyGitDescribeE2E.test.ts - Copy as Git Describe
- copyOnelineE2E.test.ts - Copy as Oneline
- copyRelativeDateE2E.test.ts - Copy Relative Date
- copyRelativePathE2E.test.ts - Copy Relative File Path
- copyRemoteUrlE2E.test.ts - Copy Remote URL
- copyRevertE2E.test.ts - Copy Revert Command
- copySelectedHashesE2E.test.ts - Copy Selected Hashes
- copyShortHashE2E.test.ts - Copy Short Hash
- copySubject.test.ts - Copy Subject (Note: Not E2E)
- copyTags.test.ts - Copy Tags (Note: Not E2E)

#### Special Copy Commands
- combinedDiffE2E.test.ts - Copy Combined Diff
- rangeDiffE2E.test.ts - Copy Range Diff

#### Export Commands
- exportCommitsE2E.test.ts - Export Filtered Commits

## Missing E2E Test Coverage

### Copy Commands without E2E Tests (But with Unit Tests)
1. **Copy Diff Stat Summary** - copyDiffStatSummary.test.ts (unit test only, missing E2E)
2. **Copy Subject** - copySubject.test.ts (unit test only, missing E2E)  
3. **Copy Tags** - copyTags.test.ts (unit test only, missing E2E)

### Commands Missing Tests Entirely

#### Commit Data Copy Commands
- **Copy Parent Hash** - No test file found
  - Keyboard shortcut: Ctrl+Shift+V / Cmd+Shift+V
  - Special handling for root commits (no parent)

#### Author & Co-Author Commands
- **Copy Co-Authors** - No test file found
  - Keyboard shortcut: Ctrl+Shift+K / Cmd+Shift+K
  - Parses "Co-authored-by:" trailers from commit body

## Test Coverage Summary

### Commands with E2E Tests
- **35 commands** have E2E test coverage
- **3 commands** have unit tests but no E2E tests
- **2 commands** have no test coverage at all

### Commands with Unit Tests Only
- Copy Diff Stat Summary
- Copy Subject
- Copy Tags

### Commands Without Any Tests
- Copy Parent Hash
- Copy Co-Authors

### Total Commands Documented
- **39 total copy/export commands** documented in CLAUDE.md
- 35 have E2E tests
- 3 have unit tests only
- 1 has no tests

## Recommendations

### Immediate Additions (High Priority)
1. **Add E2E test for Copy Parent Hash**
   - Special case handling for root commits
   - Error message validation for commits without parent
   - Keyboard shortcut testing

2. **Add E2E test for Copy Co-Authors**
   - Parse "Co-authored-by:" trailers
   - Handle multiple co-authors
   - Show "No co-authors" message when applicable

### Medium Priority
1. **Add E2E tests for unit-only commands**
   - Copy Diff Stat Summary - Validate singular/plural formatting
   - Copy Subject - Test truncation and formatting
   - Copy Tags - Test tag parsing and comma separation

### Test Patterns to Follow
1. **File Context Menu Commands**:
   - Verify right-click context menu appears
   - Test specific command in menu
   - Verify clipboard output
   - Test error states (e.g., no remote URL)

2. **Keyboard Shortcuts**:
   - Test with actual keyboard shortcut
   - Verify modifier keys work correctly
   - Test cross-platform compatibility (Cmd/Ctrl)

3. **Error Handling**:
   - No git remote configured
   - No parent commit (for parent hash)
   - No co-authors found
   - Invalid tags/branches

4. **Output Validation**:
   - Verify exact format in clipboard
   - Check confirmation messages
   - Test special formatting (JSON, Markdown, etc.)

## Testing Best Practices
1. All copy commands should test the actual clipboard contents
2. Verify error messages for edge cases
3. Test keyboard shortcuts in addition to menu items
4. Include tests for both single and multi-commit scenarios
5. Validate platform-specific behavior where applicable
