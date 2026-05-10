import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Search Query Persistence Tests', () => {
  test('main.js should have searchQuery variable', () => {
    const fs = require('fs');
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(source.includes('let searchQuery'), 'main.js should have searchQuery variable declared');
  });

  test('handleSearch should post saveSettings message', () => {
    const fs = require('fs');
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    // Find the handleSearch function
    const handleSearchStart = source.indexOf('function handleSearch(e)');
    assert.ok(handleSearchStart >= 0, 'handleSearch function should exist');

    // Extract the function body (until the closing brace)
    const handleSearchEnd = source.indexOf('\n}', handleSearchStart) + 2;
    const handleSearchFn = source.substring(handleSearchStart, handleSearchEnd);

    assert.ok(handleSearchFn.includes("vscode.postMessage"), 'handleSearch should call vscode.postMessage');
    assert.ok(handleSearchFn.includes('saveSettings'), 'handleSearch should include saveSettings in the message');
    assert.ok(handleSearchFn.includes('searchQuery'), 'handleSearch should include searchQuery in settings');
  });

  test('init message handler should restore search query', () => {
    const fs = require('fs');
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    // Find the init case handler
    const initCaseStart = source.indexOf("case 'init':");
    assert.ok(initCaseStart >= 0, 'init case should exist in message handler');

    // Look for searchQuery restoration code after the init case
    // We need to find content within the init case that restores searchQuery from settings
    const initSection = source.substring(initCaseStart, initCaseStart + 1500);

    assert.ok(initSection.includes('searchQuery'), 'init handler should reference searchQuery');
    assert.ok(initSection.includes('settings.searchQuery'), 'init handler should read settings.searchQuery');
  });

  test('searchInput should be updated when restoring search query', () => {
    const fs = require('fs');
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    // Find the section that restores search query
    const settingsSearchStart = source.indexOf('// Apply saved search query');
    assert.ok(settingsSearchStart >= 0, 'should have section for applying saved search query');

    const settingsSection = source.substring(settingsSearchStart, settingsSearchStart + 300);

    assert.ok(settingsSection.includes('searchInput.value'), 'should set searchInput.value when restoring search query');
    assert.ok(settingsSection.includes('renderCommits'), 'should re-render commits after restoring search');
  });
});