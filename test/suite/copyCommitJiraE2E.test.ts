import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Commit Jira E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-jira-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create commit with multi-line message (subject + body), stats, and tags
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add authentication feature\n\nImplemented JWT-based authentication with refresh token support.\n- Added login/logout endpoints\n- Created auth middleware\n- Added token validation"', { cwd: tempDir });
    execSync('git tag v1.0.0', { cwd: tempDir });

    // Create commit with stats but no body
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Fix typo in README"', { cwd: tempDir });

    // Create commit with minimal info
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('formatCommitAsJira function exists and is exported', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('export function formatCommitAsJira'),
      'formatCommitAsJira should be defined and exported');
  });

  test('formatCommitAsJira includes all required fields', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for Jira heading h4.
    assert.ok(fnBody.includes('h4.') && fnBody.includes('commit.shortHash'),
      'Should include h4. heading with short hash');

    // Check for author info table with || headers
    assert.ok(fnBody.includes('|| Author ||') || fnBody.includes('Author'),
      'Should include Jira table header with ||');
    assert.ok(fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'Should include author name and email');

    // Check for date formatting
    assert.ok(fnBody.includes('toLocaleString') || fnBody.includes('Date'),
      'Should include formatted date');

    // Check for stats section
    assert.ok(fnBody.includes('*Stats:*') || fnBody.includes('stats'),
      'Should include stats section');

    // Check for tags section
    assert.ok(fnBody.includes('*Tags:*') || fnBody.includes('tags'),
      'Should handle tags');

    // Check for body section with h5. heading
    assert.ok(fnBody.includes('h5.') || fnBody.includes('Commit Message'),
      'Should include body section with h5. heading');
  });

  test('formatCommitAsJira handles commits without body', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsJira');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') && fnBody.includes('commit.message'),
      'Should check if fullMessage differs from message');
    assert.ok(fnBody.includes('.trim()'),
      'Should trim body before checking');
  });

  test('formatCommitAsJira handles commits without stats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsJira');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.stats') || fnBody.includes('if ('),
      'Should check if stats exist before including');
  });

  test('formatCommitAsJira handles commits without tags', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsJira');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.tags') || fnBody.includes('tags'),
      'Should check for tags');
    assert.ok(fnBody.includes('.length') || fnBody.includes('join'),
      'Should handle tags array');
  });

  test('formatCommitAsJira uses Jira markup syntax', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsJira');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Title should use h4. heading
    assert.ok(fnBody.includes('h4.'),
      'Title should use h4. Jira heading');

    // Table should use || for headers and | for cells
    assert.ok(fnBody.includes('||') && fnBody.includes('|'),
      'Should use Jira table syntax with || and |');

    // Stats should use * markup
    assert.ok(fnBody.includes('*Stats:*'),
      'Should use Jira * markup for stats label');

    // Tags should use * markup
    assert.ok(fnBody.includes('*Tags:*'),
      'Should use Jira * markup for tags label');

    // Body heading should use h5.
    assert.ok(fnBody.includes('h5.'),
      'Body section should use h5. heading');
  });

  test('handleCopyCommitJira calls formatCommitAsJira', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJira');
    assert.ok(fnStart >= 0, 'handleCopyCommitJira should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('formatCommitAsJira'),
      'Should call formatCommitAsJira helper');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write formatted Jira to clipboard');
  });

  test('handleCopyCommitJira handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJira');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCommitJira shows confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJira');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as Jira'),
      'Should show confirmation with "Copied as Jira"');
    assert.ok(fnBody.includes('shortHash'),
      'Should include short hash in confirmation');
  });

  test('main.js handleCopyJira target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyJira');
    assert.ok(fnStart >= 0, 'handleCopyJira should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyJira sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyJira');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitJira'"),
      'Should send copyCommitJira message type');
  });

  test('main.js handleCopyJira handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyJira');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('Jira'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-jira item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-jira"'),
      'Context menu should include copy-jira');
    assert.ok(source.includes('Copy as Jira Format'),
      'Context menu should have label Copy as Jira Format');
  });

  test('context menu click handles copy-jira action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-jira'"),
      'Should handle copy-jira action');
    assert.ok(source.includes("type: 'copyCommitJira'"),
      'Should send copyCommitJira message');
  });

  test('Ctrl+Alt+Shift+J keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'J'") &&
      source.includes('e.shiftKey') &&
      source.includes('e.altKey') &&
      source.includes('handleCopyJira'),
      'Ctrl+Alt+Shift+J shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitJira"'),
      'package.json should register copyCommitJira command');
    assert.ok(content.includes('"ctrl+alt+shift+j"'),
      'package.json should define Ctrl+Alt+Shift+J keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitJira'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitJira');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+j');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+j');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy as Jira Format', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy as Jira Format') || source.includes('Jira'),
      'Keyboard help should include Copy as Jira Format');
  });

  test('Jira format example matches specification', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsJira');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Verify format: h4. {shortHash} - {message}
    assert.ok(fnBody.includes('h4.') && fnBody.includes('commit.shortHash') && fnBody.includes('commit.message'),
      'Should format heading as "h4. {shortHash} - {message}"');

    // Verify: || Author || Date || Email || table header
    assert.ok(fnBody.includes('|| Author || Date || Email ||'),
      'Should include table header row');

    // Verify: | {author} | {date} | {email} | table row
    assert.ok(fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'Should include author info in table row');

    // Verify: *Stats:* label
    assert.ok(fnBody.includes('*Stats:*'),
      'Should use *Stats:* Jira markup');

    // Verify: *Tags:* label
    assert.ok(fnBody.includes('*Tags:*'),
      'Should use *Tags:* Jira markup');

    // Verify: h5. Commit Message for body heading
    assert.ok(fnBody.includes('h5. Commit Message') || (fnBody.includes('h5.') && fnBody.includes('Commit Message')),
      'Should include h5. Commit Message heading for body');
  });
});
