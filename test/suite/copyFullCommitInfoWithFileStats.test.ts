import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Full Commit Info with File Stats Source Verification', () => {
  test('types.ts should have copyFullCommitInfoWithFileStats message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFullCommitInfoWithFileStats'"),
      'types.ts should have copyFullCommitInfoWithFileStats message type');
    assert.ok(source.includes("'copyFullCommitInfoWithFileStats'"),
      'types.ts WebviewAction should include copyFullCommitInfoWithFileStats');
  });

  test('messageHandler.ts should have handleCopyFullCommitInfoWithFileStats function', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('case \'copyFullCommitInfoWithFileStats\''),
      'messageHandler.ts should handle copyFullCommitInfoWithFileStats message');
    assert.ok(source.includes('async function handleCopyFullCommitInfoWithFileStats'),
      'messageHandler.ts should have handleCopyFullCommitInfoWithFileStats function');
  });

  test('messageHandler.ts should export formatFullInfoWithStats', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('export function formatFullInfoWithStats'),
      'messageHandler.ts should export formatFullInfoWithStats function');
  });

  test('main.js should have copy-full-info-with-file-stats context menu action', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-full-info-with-file-stats"'),
      'main.js context menu should include copy-full-info-with-file-stats action');
    assert.ok(source.includes('Copy full info with file stats'),
      'main.js context menu should have Copy full info with file stats label');
  });

  test('main.js should have handleCopyFullCommitInfoWithFileStats function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFullCommitInfoWithFileStats()'),
      'main.js should have handleCopyFullCommitInfoWithFileStats function');
    assert.ok(source.includes('type: \'copyFullCommitInfoWithFileStats\''),
      'main.js should send copyFullCommitInfoWithFileStats message');
  });

  test('main.js should handle triggerAction for copyFullCommitInfoWithFileStats', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('case \'copyFullCommitInfoWithFileStats\''),
      'main.js should handle copyFullCommitInfoWithFileStats triggerAction');
  });

  test('extension.ts should register gitHistory.copyFullCommitInfoWithFileStats command', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFullCommitInfoWithFileStats'),
      'extension.ts should register gitHistory.copyFullCommitInfoWithFileStats command');
    assert.ok(source.includes('action: \'copyFullCommitInfoWithFileStats\''),
      'extension.ts should map copyFullCommitInfoWithFileStats action');
  });

  test('package.json should have gitHistory.copyFullCommitInfoWithFileStats command', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    assert.ok(packageJson.contributes.commands.some(
      (c: any) => c.command === 'gitHistory.copyFullCommitInfoWithFileStats'),
      'package.json should have gitHistory.copyFullCommitInfoWithFileStats command');

    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copyFullCommitInfoWithFileStats');
    assert.strictEqual(command.title, 'Git History: Copy Full Commit Info with File Stats',
      'Command title should be correct');
    assert.strictEqual(command.category, 'Git History',
      'Command category should be Git History');
  });

  test('package.json should have keybinding for copyFullCommitInfoWithFileStats', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybinding = packageJson.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyFullCommitInfoWithFileStats');
    assert.ok(keybinding, 'package.json should have keybinding for copyFullCommitInfoWithFileStats');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+i',
      'Keybinding key should be ctrl+shift+alt+i');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+i',
      'Keybinding mac should be cmd+shift+alt+i');
    assert.ok(keybinding.when.includes('gitHistory.webview'),
      'Keybinding should be scoped to gitHistory webview');
  });

  test('README should document copyFullCommitInfoWithFileStats shortcut', () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+I') && source.includes('Copy full commit info with file stats'),
      'README should document Copy full commit info with file stats keyboard shortcut');
  });
});
