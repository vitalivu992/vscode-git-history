import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Open File URL Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const usagePath = path.resolve(__dirname, '../../../USAGE.md');
  let tempDir: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-open-file-url-'));
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

  test('getFileUrl generates a GitHub blob permalink', async () => {
    const { getFileUrl } = await import('../../src/git/gitService');
    const url = await getFileUrl('src/main.js', commitHash, tempDir);
    assert.strictEqual(
      url,
      `https://github.com/acme/widgets/blob/${commitHash.substring(0, 7)}/src/main.js`
    );
  });

  test('getFileUrl normalizes absolute paths and backslashes', async () => {
    const { getFileUrl } = await import('../../src/git/gitService');
    const url = await getFileUrl(path.join(tempDir, 'src', 'main.js'), commitHash, tempDir);
    assert.strictEqual(
      url,
      `https://github.com/acme/widgets/blob/${commitHash.substring(0, 7)}/src/main.js`
    );
  });

  test('getFileUrl returns null without a remote', async () => {
    const { getFileUrl } = await import('../../src/git/gitService');
    const noRemoteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-no-remote-'));
    try {
      const { execSync } = require('child_process');
      execSync('git init', { cwd: noRemoteDir });
      const url = await getFileUrl('a.txt', commitHash, noRemoteDir);
      assert.strictEqual(url, null);
    } finally {
      fs.rmSync(noRemoteDir, { recursive: true, force: true });
    }
  });

  test('gitService.ts generates platform-specific file URL shapes', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function getFileUrl'),
      'gitService.ts should export getFileUrl');
    assert.ok(source.includes('/blob/${shortHash}/${relativePath}'),
      'GitHub file URLs should use /blob/');
    assert.ok(source.includes('/-/blob/${shortHash}/${relativePath}'),
      'GitLab file URLs should use /-/blob/');
    assert.ok(source.includes('/src/${shortHash}/${relativePath}'),
      'Bitbucket file URLs should use /src/');
    assert.ok(source.includes('path=${encodeURIComponent(relativePath)}&version=GC'),
      'Azure DevOps file URLs should use path + version=GC');
  });

  test('types.ts should have openFileUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'openFileUrl'; hash: string; filePath: string"),
      'openFileUrl message should carry hash and filePath');
  });

  test('messageHandler.ts should handle openFileUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'openFileUrl':"),
      'messageHandler.ts should handle openFileUrl case');
    assert.ok(source.includes('function handleOpenFileUrl'),
      'messageHandler.ts should have handleOpenFileUrl function');

    const fnStart = source.indexOf('function handleOpenFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('getFileUrl'),
      'handleOpenFileUrl should reuse getFileUrl');
    assert.ok(fnBody.includes('vscode.env.openExternal'),
      'handleOpenFileUrl should open the URL in the browser');
    assert.ok(fnBody.includes('No git remote configured'),
      'handleOpenFileUrl should report a missing remote');
  });

  test('main.js file context menu should have open-file-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('data-action="open-file-url"');
    assert.ok(menuStart >= 0, 'file context menu should have open-file-url item');
    assert.ok(source.includes('Open file URL at this commit'),
      'file context menu should label the action');
    const handlerStart = source.indexOf("action === 'open-file-url'");
    assert.ok(handlerStart >= 0, 'file context menu should handle open-file-url');
    const nearby = source.substring(handlerStart, handlerStart + 200);
    assert.ok(nearby.includes("type: 'openFileUrl'"),
      'open-file-url handler should send openFileUrl message');
  });

  test('CLAUDE.md should document the open file URL feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('openFileUrl'),
      'CLAUDE.md should reference openFileUrl');
  });

  test('USAGE.md should document the open file URL context-menu action', () => {
    const source = fs.readFileSync(usagePath, 'utf-8');
    assert.ok(source.toLowerCase().includes('open file url'),
      'USAGE.md should document the Open file URL action');
  });
});
