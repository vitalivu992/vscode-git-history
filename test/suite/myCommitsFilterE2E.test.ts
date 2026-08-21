import * as assert from 'assert';
import * as path from 'path';

suite('My Commits Filter E2E Tests', () => {
  test('main.js should integrate my commits filter with other filters', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find getFilteredCommits function
    const filterFnStart = source.indexOf('function getFilteredCommits');
    const filterFnEnd = source.indexOf('\nfunction', filterFnStart + 1);
    const filterFn = source.substring(filterFnStart, filterFnEnd > filterFnStart ? filterFnEnd : undefined);

    // Verify filter order: merge commits -> my commits -> author -> tag -> branch -> date -> text
    const mergeIndex = filterFn.indexOf('hideMergeCommits');
    const myCommitsIndex = filterFn.indexOf('showMyCommitsOnly');
    const authorIndex = filterFn.indexOf('authorFilter');
    const tagIndex = filterFn.indexOf('tagFilter');
    const branchIndex = filterFn.indexOf('branchFilter');

    // My commits should be applied after merge commits and before author/tag/branch filters
    assert.ok(myCommitsIndex > mergeIndex, 'My commits filter should be applied after merge commits filter');
    assert.ok(myCommitsIndex < authorIndex || authorIndex === -1, 'My commits filter should be applied before author filter');
    assert.ok(myCommitsIndex < tagIndex || tagIndex === -1, 'My commits filter should be applied before tag filter');
    assert.ok(myCommitsIndex < branchIndex || branchIndex === -1, 'My commits filter should be applied before branch filter');
  });

  test('my commits filter should work with sort order', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify that getOrderedCommits is called after filtering
    const renderCommitsStart = source.indexOf('function renderCommits');
    const renderCommitsEnd = source.indexOf('\nfunction', renderCommitsStart + 1);
    const renderCommitsFn = source.substring(renderCommitsStart, renderCommitsEnd > renderCommitsStart ? renderCommitsEnd : undefined);

    assert.ok(
      renderCommitsFn.includes('getFilteredCommits') && renderCommitsFn.includes('getOrderedCommits'),
      'renderCommits should call both getFilteredCommits and getOrderedCommits'
    );
  });

  test('my commits button should have correct initial title', () => {
    const fs = require('fs');
    const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');

    // Find the my-commits-btn in the HTML template
    const myCommitsBtnMatch = source.match(/my-commits-btn[^>]+title="([^"]+)"/);
    assert.ok(myCommitsBtnMatch, 'my-commits-btn should have a title attribute');
    assert.ok(
      myCommitsBtnMatch[1].includes('my commits') || myCommitsBtnMatch[1].includes('Ctrl+Shift+M'),
      'my-commits-btn title should describe its function'
    );
  });

  test('handleMyCommitsToggle should update button state correctly', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find handleMyCommitsToggle function
    const toggleFnStart = source.indexOf('function handleMyCommitsToggle');
    const toggleFnEnd = source.indexOf('\nfunction', toggleFnStart + 1);
    const toggleFn = source.substring(toggleFnStart, toggleFnEnd > toggleFnStart ? toggleFnEnd : undefined);

    // Should toggle the state
    assert.ok(toggleFn.includes('showMyCommitsOnly = !showMyCommitsOnly'), 'Should toggle showMyCommitsOnly state');

    // Should update button appearance
    assert.ok(toggleFn.includes("classList.add('active')"), 'Should add active class when enabled');
    assert.ok(toggleFn.includes("classList.remove('active')"), 'Should remove active class when disabled');

    // Should update button title
    assert.ok(toggleFn.includes('.title'), 'Should update button title');

    // Should re-render commits
    assert.ok(toggleFn.includes('renderCommits()'), 'Should call renderCommits');
    assert.ok(toggleFn.includes('updateCommitCount()'), 'Should call updateCommitCount');

    // Should save settings
    assert.ok(toggleFn.includes("type: 'saveSettings'") && toggleFn.includes('showMyCommitsOnly'),
      'Should persist showMyCommitsOnly setting');
  });

  test('init message handler should initialize my commits state correctly', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find init case
    const initCaseStart = source.indexOf("case 'init':");
    const initCaseEnd = source.indexOf('break;', initCaseStart) + 6;
    const initCase = source.substring(initCaseStart, initCaseEnd);

    // Should store currentUser from message
    assert.ok(initCase.includes('message.currentUser'), 'Should store currentUser from init message');

    // Should apply showMyCommitsOnly from userSettings
    assert.ok(initCase.includes('settings.showMyCommitsOnly'), 'Should apply showMyCommitsOnly from settings');
  });

  test('button should be disabled when no git user is configured', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find init case where button state is set
    const initCaseStart = source.indexOf("case 'init':");
    const initCaseEnd = source.indexOf('break;', initCaseStart) + 6;
    const initCase = source.substring(initCaseStart, initCaseEnd);

    // Should disable button when no currentUser
    assert.ok(initCase.includes('myCommitsBtn.disabled'), 'Should disable myCommitsBtn');
    assert.ok(initCase.includes('!currentUser'), 'Should check if currentUser is null');
  });

  test('currentUser should be used from init message for filtering', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find getFilteredCommits function
    const filterFnStart = source.indexOf('function getFilteredCommits');
    const filterFnEnd = source.indexOf('\nfunction', filterFnStart + 1);
    const filterFn = source.substring(filterFnStart, filterFnEnd > filterFnStart ? filterFnEnd : undefined);

    // Should use currentUser for filtering
    assert.ok(filterFn.includes('currentUser.email'), 'Should check currentUser.email');
    assert.ok(filterFn.includes('currentUser.name'), 'Should check currentUser.name');
    assert.ok(filterFn.includes('toLowerCase'), 'Should use case-insensitive comparison');
  });

  test('keyboard help should include my commits shortcut in correct category', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find keyboard help dialog function
    const keyboardHelpStart = source.indexOf('function showKeyboardHelpDialog');
    const keyboardHelpEnd = source.indexOf('\nfunction', keyboardHelpStart + 1);
    const keyboardHelpFn = source.substring(keyboardHelpStart, keyboardHelpEnd > keyboardHelpStart ? keyboardHelpEnd : undefined);

    // Should include the shortcut
    assert.ok(
      keyboardHelpFn.includes('Shift') && keyboardHelpFn.includes('M'),
      'Keyboard help should include Ctrl+Shift+M shortcut'
    );

    // Should include description about my commits
    assert.ok(
      keyboardHelpFn.includes('my commits') || keyboardHelpFn.includes('My Commits'),
      'Keyboard help should mention my commits'
    );
  });

  test('filter should handle case sensitivity correctly', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find getFilteredCommits function
    const filterFnStart = source.indexOf('function getFilteredCommits');
    const filterFnEnd = source.indexOf('\nfunction', filterFnStart + 1);
    const filterFn = source.substring(filterFnStart, filterFnEnd > filterFnStart ? filterFnEnd : undefined);

    // Should convert both sides to lowercase for comparison
    const myCommitsFilterSection = filterFn.substring(filterFn.indexOf('showMyCommitsOnly'));
    assert.ok(
      myCommitsFilterSection.includes('toLowerCase'),
      'My commits filter should use case-insensitive comparison'
    );
  });

  test('updateCommitCount should consider my commits filter as active', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find updateCommitCount function
    const updateCountStart = source.indexOf('function updateCommitCount');
    const updateCountEnd = source.indexOf('\nfunction', updateCountStart + 1);
    const updateCountFn = source.substring(updateCountStart, updateCountEnd > updateCountStart ? updateCountEnd : undefined);

    // Should include showMyCommitsOnly in hasActiveFilter check
    assert.ok(
      updateCountFn.includes('showMyCommitsOnly'),
      'updateCommitCount should check showMyCommitsOnly for active filter'
    );
  });

  test('hasActiveFilters should include my commits filter', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find hasActiveFilters function
    const hasActiveStart = source.indexOf('function hasActiveFilters');
    const hasActiveEnd = source.indexOf('\nfunction', hasActiveStart + 1);
    const hasActiveFn = source.substring(hasActiveStart, hasActiveEnd > hasActiveStart ? hasActiveEnd : undefined);

    // Should include showMyCommitsOnly
    assert.ok(
      hasActiveFn.includes('showMyCommitsOnly'),
      'hasActiveFilters should include showMyCommitsOnly check'
    );
  });

  test('empty state should show appropriate message for my commits filter', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find renderCommits empty state section
    const renderCommitsStart = source.indexOf('function renderCommits');
    const renderCommitsEnd = source.indexOf('\nfunction', renderCommitsStart + 1);
    const renderCommitsFn = source.substring(renderCommitsStart, renderCommitsEnd > renderCommitsStart ? renderCommitsEnd : undefined);

    // Should reference hasActiveFilters for empty state message
    assert.ok(
      renderCommitsFn.includes('hasActiveFilters') || renderCommitsFn.includes('hasFilters'),
      'renderCommits should use hasActiveFilters for empty state'
    );
  });

  test('webviewProvider should handle getCurrentGitUser errors gracefully', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    // Find getCurrentGitUser function
    const fnStart = source.indexOf('export async function getCurrentGitUser');
    const fnEnd = source.indexOf('\n}', fnStart) + 2;
    const fn = source.substring(fnStart, fnEnd);

    // Should have try-catch
    assert.ok(fn.includes('try') && fn.includes('catch'), 'Should have error handling');

    // Should return null on error
    assert.ok(fn.includes('return null'), 'Should return null on error');
  });

  test('gitService getCurrentGitUser should parse git config correctly', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    // Find getCurrentGitUser function
    const fnStart = source.indexOf('export async function getCurrentGitUser');
    const fnEnd = source.indexOf('\n}', fnStart) + 2;
    const fn = source.substring(fnStart, fnEnd);

    // Should call git config user.name
    assert.ok(fn.includes("['config', 'user.name']"), 'Should call git config user.name');

    // Should call git config user.email
    assert.ok(fn.includes("['config', 'user.email']"), 'Should call git config user.email');

    // Should trim the output
    assert.ok(fn.includes('.trim()'), 'Should trim the config output');

    // Should return object with name and email
    assert.ok(fn.includes('return { name, email }'), 'Should return name and email object');
  });

  test('my commits filter should work when combined with search query', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find getFilteredCommits function
    const filterFnStart = source.indexOf('function getFilteredCommits');
    const filterFnEnd = source.indexOf('\nfunction', filterFnStart + 1);
    const filterFn = source.substring(filterFnStart, filterFnEnd > filterFnStart ? filterFnEnd : undefined);

    // My commits filter should be applied before text search
    const myCommitsIndex = filterFn.indexOf('showMyCommitsOnly');
    const textQueryIndex = filterFn.indexOf('textQuery');

    assert.ok(
      myCommitsIndex < textQueryIndex,
      'My commits filter should be applied before text query filter'
    );
  });

  test('toggle function should reset focused index', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find handleMyCommitsToggle function
    const toggleFnStart = source.indexOf('function handleMyCommitsToggle');
    const toggleFnEnd = source.indexOf('\nfunction', toggleFnStart + 1);
    const toggleFn = source.substring(toggleFnStart, toggleFnEnd > toggleFnStart ? toggleFnEnd : undefined);

    // Should reset focusedIndex when filter changes
    assert.ok(toggleFn.includes('focusedIndex = -1'), 'Should reset focusedIndex when toggling');
  });
});
