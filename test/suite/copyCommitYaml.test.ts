import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit as YAML Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitYaml message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitYaml'"),
      'types.ts should have copyCommitYaml message type');
  });

  test('types.ts should have copyCommitYaml in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitYaml'"),
      'WebviewAction should include copyCommitYaml');
  });

  test('types.ts should have copyCommitYaml in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitYaml'"),
      'WebviewToExtMessage should include copyCommitYaml message type');
  });

  test('messageHandler.ts should handle copyCommitYaml case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitYaml':"),
      'messageHandler.ts should handle copyCommitYaml case');
  });

  test('messageHandler.ts should have handleCopyCommitYaml function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitYaml'),
      'messageHandler.ts should have handleCopyCommitYaml function');
  });

  test('messageHandler.ts should have formatCommitAsYaml export', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('export function formatCommitAsYaml'),
      'messageHandler.ts should export formatCommitAsYaml function');
  });

  test('formatCommitAsYaml should produce YAML structure', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for YAML keys
    assert.ok(fnBody.includes('hash:'), 'Should have hash key');
    assert.ok(fnBody.includes('shortHash:'), 'Should have shortHash key');
    assert.ok(fnBody.includes('author:'), 'Should have author key');
    assert.ok(fnBody.includes('message:'), 'Should have message key');
    assert.ok(fnBody.includes('parentHashes:'), 'Should have parentHashes key');
    assert.ok(fnBody.includes('tags:'), 'Should have tags key');
    assert.ok(fnBody.includes('stats:'), 'Should have stats key');
  });

  test('formatCommitAsYaml should handle body with literal block style', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('"body: |"') || fnBody.includes('body: |'),
      'Should use literal block style for body');
    assert.ok(fnBody.includes('"body: null"') || fnBody.includes('body: null'),
      'Should handle null body');
  });

  test('handleCopyCommitYaml should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitYaml');
    assert.ok(fnStart >= 0, 'handleCopyCommitYaml function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitYaml should write to clipboard');
    assert.ok(fnBody.includes('Copied as YAML'),
      'handleCopyCommitYaml should show confirmation');
  });

  test('handleCopyCommitYaml should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitYaml');
    assert.ok(fnStart >= 0, 'handleCopyCommitYaml function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitYaml should handle commit not found');
  });

  test('main.js should have handleCopyYaml function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyYaml'),
      'main.js should have handleCopyYaml function');
  });

  test('main.js should send copyCommitYaml message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitYaml'"),
      'main.js should send copyCommitYaml message');
  });

  test('main.js should handle Ctrl+Alt+Shift+Y keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Check for Shift+Y keyboard shortcut handling
    const hasShiftY = source.includes("'Y'") && source.includes('shiftKey');
    const hasCopyYaml = source.includes('handleCopyYaml');
    assert.ok(hasShiftY && hasCopyYaml,
      'main.js should handle Ctrl+Alt+Shift+Y and call handleCopyYaml');
  });

  test('main.js triggerAction should dispatch copyCommitYaml', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitYaml': handleCopyYaml()"),
      'main.js triggerAction should dispatch copyCommitYaml');
  });

  test('main.js should have context menu item for copy-yaml', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-yaml"'),
      'main.js should have context menu item for copy-yaml');
  });

  test('main.js context menu should handle copy-yaml action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-yaml'"),
      'main.js should handle copy-yaml action');
  });

  test('main.js context menu should have Copy as YAML label', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as YAML'),
      'main.js should have Copy as YAML context menu label');
  });

  test('main.js keyboard help should include Copy as YAML', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'Copy as YAML'") || source.includes('"Copy as YAML"'),
      'main.js keyboard help should include Copy as YAML description');
  });

  test('package.json should register copyCommitYaml command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitYaml'),
      'package.json should register gitHistory.copyCommitYaml command');
  });

  test('package.json should have Copy Commit as YAML command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as YAML'),
      'package.json should have Copy Commit as YAML command title');
  });

  test('package.json should register Ctrl+Alt+Shift+Y keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitYaml'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitYaml');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+y');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitYaml webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitYaml'"),
      'extension.ts should register copyCommitYaml webview action');
  });

  test('CLAUDE.md should document Copy Commit as YAML feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as YAML'),
      'CLAUDE.md should document Copy Commit as YAML feature');
    assert.ok(source.includes('handleCopyYaml') || source.includes('formatCommitAsYaml'),
      'CLAUDE.md should reference YAML handler functions');
  });

  test('CLAUDE.md should document Ctrl+Alt+Shift+Y keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+Shift+Y') || source.includes('Cmd+Alt+Shift+Y'),
      'CLAUDE.md should document Copy as YAML keyboard shortcut');
  });

  test('README.md should document Copy as YAML feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('YAML') || source.includes('Ctrl+Alt+Shift+Y'),
      'README.md should document copy as YAML feature or keyboard shortcut');
  });
});
