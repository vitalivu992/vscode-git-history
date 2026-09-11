import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Copy File URL Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const usagePath = path.resolve(__dirname, '../../../USAGE.md');
  let tempDir: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-url-'));
    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    execSync('git remote add origin https://github.com/acme/widgets.git', { cwd: tempDir });

    fs.mkdirSync(path.join(tempDir, 'src'));
    fs.writeFileSync(path.join(tempDir, 'src', 'main.js'), 'console.log(1);\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "initial"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getFileUrl provides the permalink the copy action should put on the clipboard', async () => {
    const { getFileUrl } = await import('../../src/git/gitService');
    const url = await getFileUrl('src/main.js', commitHash, tempDir);
    assert.strictEqual(
      url,
      `https://github.com/acme/widgets/blob/${commitHash.substring(0, 7)}/src/main.js`
    );
  });

  test('types.ts should have copyFileUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copyFileUrl'; hash: string; filePath: string"),
      'copyFileUrl message should carry hash and filePath');
  });

  test('messageHandler.ts should handle copyFileUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyFileUrl':"),
      'messageHandler.ts should handle copyFileUrl case');
    assert.ok(source.includes('function handleCopyFileUrl'),
      'messageHandler.ts should have handleCopyFileUrl function');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('getFileUrl'),
      'handleCopyFileUrl should reuse getFileUrl');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileUrl should copy to the clipboard');
    assert.ok(fnBody.includes('No git remote configured'),
      'handleCopyFileUrl should report a missing remote');
    assert.ok(!fnBody.includes('openExternal'),
      'handleCopyFileUrl should copy, not open the browser');
  });

  test('messageHandler.ts copyFileUrl case should not swallow openFileUrl', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const openCase = source.indexOf("case 'openFileUrl':");
    const copyCase = source.indexOf("case 'copyFileUrl':");
    assert.ok(openCase >= 0 && copyCase > openCase, 'copyFileUrl case should follow openFileUrl');
    const between = source.substring(openCase, copyCase);
    assert.ok(between.includes('break;'), 'openFileUrl case should break before copyFileUrl');
  });

  test('main.js file context menu should have copy-file-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('data-action="copy-file-url"');
    assert.ok(menuStart >= 0, 'file context menu should have copy-file-url item');
    assert.ok(source.includes('Copy file URL at this commit'),
      'file context menu should label the action');
    const handlerStart = source.indexOf("action === 'copy-file-url'");
    assert.ok(handlerStart >= 0, 'file context menu should handle copy-file-url');
    const nearby = source.substring(handlerStart, handlerStart + 200);
    assert.ok(nearby.includes("type: 'copyFileUrl'"),
      'copy-file-url handler should send copyFileUrl message');
  });

  test('CLAUDE.md should document the copy file URL feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('copyFileUrl'),
      'CLAUDE.md should reference copyFileUrl');
  });

  test('USAGE.md should document the copy file URL context-menu action', () => {
    const source = fs.readFileSync(usagePath, 'utf-8');
    assert.ok(source.toLowerCase().includes('copy file url'),
      'USAGE.md should document the Copy file URL action');
  });
});
