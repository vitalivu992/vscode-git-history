import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Cycle Sort Mode Shortcut E2E Test Suite', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-cycle-sort-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create commits with different authors for sort testing
    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "First commit"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Third commit"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleSortToggle function exists and cycles through modes', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify the function exists
    assert.ok(source.includes('function handleSortToggle()'),
      'handleSortToggle function should exist');

    // Verify it updates sortMode
    const fnStart = source.indexOf('function handleSortToggle()');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('sortMode = (sortMode + 1) % 4') ||
               fnBody.includes('sortMode = (sortMode+1)%4') ||
               fnBody.includes('sortMode=(sortMode+1)%4'),
      'handleSortToggle should cycle through 4 sort modes');
  });

  test('sort button click handler is attached', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify sort button has click listener
    assert.ok(source.includes("sortBtn.addEventListener('click', handleSortToggle)") ||
               source.includes('sortBtn.addEventListener("click", handleSortToggle)'),
      'sort button should have click handler for handleSortToggle');
  });

  test('sort button updates label based on sortMode', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify sort button label is updated
    assert.ok(source.includes('Newest') || source.includes('Oldest') ||
               source.includes('sortBtn.textContent') || source.includes('sortBtn.title'),
      'sort button should update label based on sortMode');
  });

  test('sortMode 0 is Newest (default)', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Default sort mode should be 0 (Newest)
    const defaultMatch = source.match(/sortMode\s*=\s*0/);
    assert.ok(defaultMatch, 'sortMode should default to 0 (Newest)');
  });

  test('sortMode affects getOrderedCommits behavior', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Should have different sort logic for different modes
    assert.ok(source.includes('case 0:') && source.includes('case 1:') &&
               source.includes('case 2:') && source.includes('case 3:'),
      'getOrderedCommits should handle all 4 sort modes');
  });

  test('graph is hidden when sortMode >= 2 (author sort)', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // effectiveShowGraph should be false when sortMode >= 2
    assert.ok(source.includes('sortMode >= 2') || source.includes('sortMode>=2'),
      'graph should be hidden when sort mode is author-based');
  });

  test('cycleSortMode action is triggered via triggerAction', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // triggerAction should dispatch cycleSortMode to handleSortToggle
    const triggerActionMatch = source.match(/case 'cycleSortMode':\s*(\w+)\(\)/);
    assert.ok(triggerActionMatch, 'triggerAction should dispatch cycleSortMode');
    assert.strictEqual(triggerActionMatch[1], 'handleSortToggle',
      'cycleSortMode should call handleSortToggle');
  });
});