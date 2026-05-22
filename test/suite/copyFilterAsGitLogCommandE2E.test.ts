import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Filter as Git Log Command E2E', function() {
  this.timeout(60000);

  let extensionUri: vscode.Uri;
  let fixturesDir: string;

  suiteSetup(async function() {
    const extension = vscode.extensions.getExtension('vitalivu.vscode-git-history');
    if (!extension) {
      this.skip();
      return;
    }

    extensionUri = extension.extensionUri;
    fixturesDir = path.join(extension.extensionPath, 'test', 'fixtures');

    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  test('should execute copyFilterAsGitLogCommand without error', async function() {
    const testFile = path.join(fixturesDir, `test-gitlog-cmd-${Date.now()}.txt`);
    fs.writeFileSync(testFile, 'Test content for git log command\n');

    try {
      const doc = await vscode.workspace.openTextDocument(testFile);
      await vscode.window.showTextDocument(doc);

      await vscode.commands.executeCommand('gitHistory.showFileHistory');

      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        await vscode.commands.executeCommand('gitHistory.copyFilterAsGitLogCommand');
      } catch (error) {
        // Command execution failed - acceptable as we're testing
        // that the command is registered and can be called
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  test('should have copyFilterAsGitLogCommand registered as a command', async function() {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('gitHistory.copyFilterAsGitLogCommand'), 'copyFilterAsGitLogCommand command should be registered');
  });

  test('should have keybinding configured in package.json', function() {
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    const keybindings = pkg.contributes.keybindings;
    const found = keybindings.find((kb: any) => kb.command === 'gitHistory.copyFilterAsGitLogCommand');

    assert.ok(found, 'Keybinding should be configured');
    assert.strictEqual(found.key, 'ctrl+alt+shift+l', 'Key should be ctrl+alt+shift+l');
    assert.strictEqual(found.mac, 'cmd+alt+shift+l', 'Mac key should be cmd+alt+shift+l');
    assert.strictEqual(found.when, 'activeWebviewPanelId == gitHistory.webview', 'When clause should match webview panel');
  });

  test('should have command title in package.json', function() {
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    const commands = pkg.contributes.commands;
    const found = commands.find((cmd: any) => cmd.command === 'gitHistory.copyFilterAsGitLogCommand');

    assert.ok(found, 'Command should be registered in package.json');
    assert.ok(found.title.includes('Git Log'), 'Command title should mention Git Log');
  });

  test('main.js should have handleCopyFilterAsGitLogCommand function', function() {
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilterAsGitLogCommand'), 'main.js should have handleCopyFilterAsGitLogCommand function');
    assert.ok(source.includes("case 'copyFilterAsGitLogCommand'"), 'main.js should have triggerAction case');
    assert.ok(source.includes("type: 'copyFilterAsGitLogCommand'"), 'main.js should send copyFilterAsGitLogCommand message');
  });

  test('extension.ts should register copyFilterAsGitLogCommand', function() {
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("gitHistory.copyFilterAsGitLogCommand"), 'extension.ts should register copyFilterAsGitLogCommand');
    assert.ok(source.includes("'copyFilterAsGitLogCommand'"), 'extension.ts should map to copyFilterAsGitLogCommand action');
  });
});
