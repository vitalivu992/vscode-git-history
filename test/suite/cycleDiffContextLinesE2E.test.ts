import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Cycle Diff Context Lines E2E Test Suite', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-cycle-context-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create commits with different content for diff context testing
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

  test('handleDiffContextLinesCycle function exists and cycles through values', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify the function exists
    assert.ok(source.includes('function handleDiffContextLinesCycle()'),
      'handleDiffContextLinesCycle function should exist');

    // Verify it updates diffContextLines
    const fnStart = source.indexOf('function handleDiffContextLinesCycle()');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('diffContextLines = diffContextLines >= 10 ? 1 : diffContextLines + 1') ||
               fnBody.includes('diffContextLines=diffContextLines>=10?1:diffContextLines+1'),
      'handleDiffContextLinesCycle should cycle through context line values (1-10)');
  });

  test('context lines default to 3', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Default context lines should be 3
    const defaultMatch = source.match(/let diffContextLines\s*=\s*3/);
    assert.ok(defaultMatch, 'diffContextLines should default to 3');
  });

  test('context lines button click handler is attached', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify context lines button has click listener
    assert.ok(source.includes("contextLinesBtn.addEventListener('click', handleDiffContextLinesCycle)") ||
               source.includes('contextLinesBtn.addEventListener("click", handleDiffContextLinesCycle)'),
      'context lines button should have click handler for handleDiffContextLinesCycle');
  });

  test('context lines button updates value display when cycled', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify button updates the value span
    assert.ok(source.includes('context-lines-value') && source.includes('valueSpan.textContent = diffContextLines'),
      'context lines button should update the value display when cycled');
  });

  test('context lines button updates title/tooltip when cycled', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify button title/tooltip is updated
    assert.ok(source.includes('contextLinesBtn.title') &&
               (source.includes('Diff context lines:') || source.includes('Ctrl+Shift+/')),
      'context lines button should update title/tooltip when cycled');
  });

  test('context lines change re-fetches diff when commit is selected', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify diff is re-fetched on context change
    const fnStart = source.indexOf('function handleDiffContextLinesCycle()');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('requestDiff') || fnBody.includes('requestCombinedDiff'),
      'changing context lines should re-fetch the diff');
  });

  test('context lines setting is persisted when cycled', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify setting is saved
    const fnStart = source.indexOf('function handleDiffContextLinesCycle()');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('saveSettings') && fnBody.includes('diffContextLines'),
      'context lines setting should be persisted when cycled');
  });

  test('cycleDiffContextLines action is triggered via triggerAction', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // triggerAction should dispatch cycleDiffContextLines to handleDiffContextLinesCycle
    const triggerActionMatch = source.match(/case 'cycleDiffContextLines':\s*handleDiffContextLinesCycle\(\)/);
    assert.ok(triggerActionMatch, 'triggerAction should dispatch cycleDiffContextLines to handleDiffContextLinesCycle');
  });

  test('cycleDiffContextLines is registered in WebviewAction type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    // Verify the action type exists
    assert.ok(source.includes("'cycleDiffContextLines'") || source.includes('"cycleDiffContextLines"'),
      'cycleDiffContextLines should be registered in WebviewAction type');
  });
});
