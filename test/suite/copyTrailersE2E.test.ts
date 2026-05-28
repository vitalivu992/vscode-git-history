import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Trailers E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let noTrailersHash: string;
  let singleTrailerHash: string;
  let multiTrailersHash: string;
  let issueRefsHash: string;
  let reviewedByHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-trailers-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Commit 1: no trailers
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    noTrailersHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 2: single trailer
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit\n\nFixes: #123"', { cwd: tempDir });
    singleTrailerHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 3: multiple trailers
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Third commit\n\nFixes: #456\nReviewed-by: Alice <alice@example.com>\nSigned-off-by: Bob <bob@example.com>"', { cwd: tempDir });
    multiTrailersHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 4: issue references only
    fs.writeFileSync(testFile, 'Hello World 4\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Fourth commit\n\nFixes: #100\nCloses: #200\nResolves: #300"', { cwd: tempDir });
    issueRefsHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 5: reviewed-by only
    fs.writeFileSync(testFile, 'Hello World 5\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Fifth commit\n\nReviewed-by: Charlie <charlie@example.com>\nAcked-by: Dave <dave@example.com>"', { cwd: tempDir });
    reviewedByHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ─── Git integration ────────────────────────────────────────────────────────

  test('git commit body contains trailer', () => {
    const body = execSync(`git log --format=%b -1 ${singleTrailerHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(body.includes('Fixes: #123'),
      'Commit body should contain Fixes trailer');
  });

  test('git commit body contains multiple trailers', () => {
    const body = execSync(`git log --format=%b -1 ${multiTrailersHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(body.includes('Fixes: #456'),
      'Commit body should contain Fixes trailer');
    assert.ok(body.includes('Reviewed-by: Alice <alice@example.com>'),
      'Commit body should contain Reviewed-by trailer');
    assert.ok(body.includes('Signed-off-by: Bob <bob@example.com>'),
      'Commit body should contain Signed-off-by trailer');
  });

  test('git commit without trailers has empty body or no trailer format', () => {
    const body = execSync(`git log --format=%b -1 ${noTrailersHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(!body.includes('Fixes:'),
      'Commit body should not contain any trailer');
  });

  test('git commit has multiple issue reference trailers', () => {
    const body = execSync(`git log --format=%b -1 ${issueRefsHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(body.includes('Fixes: #100'),
      'Commit body should contain Fixes trailer');
    assert.ok(body.includes('Closes: #200'),
      'Commit body should contain Closes trailer');
    assert.ok(body.includes('Resolves: #300'),
      'Commit body should contain Resolves trailer');
  });

  test('git commit has review trailers', () => {
    const body = execSync(`git log --format=%b -1 ${reviewedByHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(body.includes('Reviewed-by: Charlie <charlie@example.com>'),
      'Commit body should contain Reviewed-by trailer');
    assert.ok(body.includes('Acked-by: Dave <dave@example.com>'),
      'Commit body should contain Acked-by trailer');
  });

  // ─── Message handler ────────────────────────────────────────────────────────

  test('handleCopyTrailers function exists', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyTrailers'),
      'handleCopyTrailers should be defined');
  });

  test('handleCopyTrailers uses extractTrailers', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyTrailers');
    assert.ok(fnStart >= 0, 'handleCopyTrailers function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('extractTrailers'),
      'Should call extractTrailers');
    assert.ok(fnBody.includes('commit.fullMessage'),
      'Should pass commit.fullMessage to extractTrailers');
  });

  test('handleCopyTrailers handles no trailers', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyTrailers');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('trailers.size === 0'),
      'Should check for empty trailers map');
    assert.ok(fnBody.includes('No trailers on commit'),
      'Should show "No trailers on commit" message');
  });

  test('handleCopyFixesReferences handles no issue refs', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFixesReferences');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('refs.length === 0'),
      'Should check for empty refs array');
    assert.ok(fnBody.includes('No issue references found'),
      'Should show "No issue references found" message');
  });

  test('handleCopyReviewedBy handles no reviewers', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyReviewedBy');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('reviewers.length === 0'),
      'Should check for empty reviewers array');
    assert.ok(fnBody.includes('No review/acknowledgment trailers found'),
      'Should show "No review/acknowledgment trailers found" message');
  });

  // ─── extractTrailers utility ───────────────────────────────────────────────

  test('extractTrailers function exists and is exported', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('export function extractTrailers'),
      'extractTrailers should be defined and exported');
  });

  test('extractTrailers returns Map type', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function extractTrailers');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Map<string, string[]>'),
      'Should return Map<string, string[]>');
    assert.ok(fnBody.includes('new Map'),
      'Should create new Map');
  });

  // ─── Webview (main.js) ──────────────────────────────────────────────────────

  test('main.js has handleCopyTrailers function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyTrailers'),
      'main.js should have handleCopyTrailers function');
  });

  test('main.js has handleCopyFixesReferences function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFixesReferences'),
      'main.js should have handleCopyFixesReferences function');
  });

  test('main.js has handleCopyReviewedBy function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyReviewedBy'),
      'main.js should have handleCopyReviewedBy function');
  });

  test('context menu has copy-trailers item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-trailers"'),
      'Context menu should have copy-trailers action');
    assert.ok(source.includes('Copy trailers'),
      'Context menu should have Copy trailers label');
  });

  test('context menu has copy-fixes-references item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-fixes-references"'),
      'Context menu should have copy-fixes-references action');
    assert.ok(source.includes('Copy issue references'),
      'Context menu should have Copy issue references label');
  });

  test('context menu has copy-reviewed-by item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-reviewed-by"'),
      'Context menu should have copy-reviewed-by action');
    assert.ok(source.includes('Copy reviewers'),
      'Context menu should have Copy reviewers label');
  });

  test('keyboard shortcuts trigger correct handlers', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('handleCopyTrailers()'),
      'Ctrl+Shift+Alt+T should trigger handleCopyTrailers');
    assert.ok(source.includes('handleCopyFixesReferences()'),
      'Ctrl+Shift+Alt+5 should trigger handleCopyFixesReferences');
    assert.ok(source.includes('handleCopyReviewedBy()'),
      'Ctrl+Shift+Alt+4 should trigger handleCopyReviewedBy');
  });

  test('triggerAction dispatches all three trailer actions', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyTrailers': handleCopyTrailers()"),
      'triggerAction should dispatch copyTrailers');
    assert.ok(source.includes("case 'copyFixesReferences': handleCopyFixesReferences()"),
      'triggerAction should dispatch copyFixesReferences');
    assert.ok(source.includes("case 'copyReviewedBy': handleCopyReviewedBy()"),
      'triggerAction should dispatch copyReviewedBy');
  });

  // ─── Package registration ───────────────────────────────────────────────────

  test('package.json registers all three commands', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyTrailers"'),
      'package.json should register copyTrailers command');
    assert.ok(content.includes('"gitHistory.copyFixesReferences"'),
      'package.json should register copyFixesReferences command');
    assert.ok(content.includes('"gitHistory.copyReviewedBy"'),
      'package.json should register copyReviewedBy command');
  });

  test('package.json has correct keybindings', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const trailersBinding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyTrailers'
    );
    assert.ok(trailersBinding, 'Should have keybinding for copyTrailers');
    assert.strictEqual(trailersBinding.key, 'ctrl+shift+alt+t');

    const fixesBinding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyFixesReferences'
    );
    assert.ok(fixesBinding, 'Should have keybinding for copyFixesReferences');
    assert.strictEqual(fixesBinding.key, 'ctrl+shift+alt+5');

    const reviewedBinding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyReviewedBy'
    );
    assert.ok(reviewedBinding, 'Should have keybinding for copyReviewedBy');
    assert.strictEqual(reviewedBinding.key, 'ctrl+shift+alt+4');
  });

  // ─── Types ──────────────────────────────────────────────────────────────────

  test('types.ts has all three message types', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyTrailers'"),
      'types.ts should include copyTrailers');
    assert.ok(source.includes("'copyFixesReferences'"),
      'types.ts should include copyFixesReferences');
    assert.ok(source.includes("'copyReviewedBy'"),
      'types.ts should include copyReviewedBy');
  });
});
