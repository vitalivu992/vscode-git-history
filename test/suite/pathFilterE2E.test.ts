import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('pathFilterE2E Tests', () => {
  test('main.js should have pathFilter state variable', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for commitFilesMap state variable
    assert.ok(content.includes('commitFilesMap = new Map()'), 'main.js should have commitFilesMap state variable');
  });

  test('main.js should parse pathFilter in parseDateFilter', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for pathFilter in parseDateFilter
    assert.ok(content.includes('pathMatch = query.match(/path:([^\\s]+)/i)'), 'parseDateFilter should parse path: filter');
  });

  test('main.js should return pathFilter in parseDateFilter result', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for pathFilter in return statement
    assert.ok(content.includes('pathFilter'), 'parseDateFilter return should include pathFilter');
  });

  test('main.js should render path filter badge in renderFilterBadges', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for path filter badge rendering
    assert.ok(content.includes('if (pathFilter)'), 'renderFilterBadges should handle path filter badge');
    assert.ok(content.includes('path: ${escapeHtml(pathFilter)}'), 'renderFilterBadges should render path filter badge');
  });

  test('main.js should handle path filter clear in filter clear handler', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for path filter clear handler
    assert.ok(content.includes("filterToRemove === 'path'"), 'should handle path filter clear');
    assert.ok(content.includes('/path:[^\\s]+/i'), 'should clear path filter with regex');
  });

  test('main.js should apply path filter in getFilteredCommits', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for path filter in getFilteredCommits
    assert.ok(content.includes('// Apply path filter'), 'getFilteredCommits should apply path filter');
    assert.ok(content.includes('if (pathFilter)'), 'getFilteredCommits should check pathFilter');
    assert.ok(content.includes('commitFilesMap.get(commit.hash)'), 'getFilteredCommits should use commitFilesMap');
    assert.ok(content.includes("f.path.toLowerCase().includes(pathFilter)"), 'getFilteredCommits should filter by file path');
  });

  test('main.js should cache commit files in commitFiles message handler', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for caching commit files
    assert.ok(content.includes("case 'commitFiles':"), 'commitFiles handler should exist');
    assert.ok(content.includes('commitFilesMap.set(message.hash, message.files)'), 'commitFiles handler should cache files');
  });

  test('main.js should include pathFilter in hasActiveFilters', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for pathFilter in hasActiveFilters
    const hasActiveFiltersMatch = content.match(/function hasActiveFilters\(\)[\s\S]*?\{[\s\S]*?(return|return!![\s\S]*?);\s*}/);
    assert.ok(hasActiveFiltersMatch, 'hasActiveFilters should exist');
    assert.ok(hasActiveFiltersMatch![0].includes('pathFilter'), 'hasActiveFilters should include pathFilter');
  });

  test('main.js should request commit files when path filter needs them', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for requestCommitFiles when files not cached
    assert.ok(content.includes("vscode.postMessage({ type: 'requestCommitFiles', hash: commit.hash })"), 'should request files when not cached');
  });

  test('main.js should re-render commits after files are cached', () => {
    const mainJsPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the commitFiles case handler
    const commitFilesMatch = content.match(/case 'commitFiles':[\s\S]*?break;/);
    assert.ok(commitFilesMatch, 'commitFiles case handler should exist');

    // Check that renderCommits is called after renderFiles in commitFiles handler
    const handler = commitFilesMatch[0];
    assert.ok(handler.includes('renderCommits()'), 'commitFiles handler should call renderCommits() to re-render commit list after files are cached');
  });

  test('index.html placeholder should show path:name syntax', () => {
    const indexHtmlPath = path.join(__dirname, '..', '..', 'src', 'webview', 'panel', 'index.html');
    const content = fs.readFileSync(indexHtmlPath, 'utf-8');
    assert.ok(content.includes('path:name'),
      'index.html placeholder should show path:name syntax, not path:file');
  });

  test('webviewProvider placeholder should show path:name syntax', () => {
    const providerPath = path.join(__dirname, '..', '..', 'src', 'webview', 'webviewProvider.ts');
    const content = fs.readFileSync(providerPath, 'utf-8');
    assert.ok(content.includes('path:name'),
      'webviewProvider placeholder should show path:name syntax, not path:file');
  });
});