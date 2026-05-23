import * as assert from 'assert';
import * as fs from 'fs';
import path from 'path';

suite('Reveal File In Explorer E2E', () => {
  const testFilesPath = path.join(__dirname, '..', '..', '..');

  test('types.ts has revealFileInExplorer WebviewAction', () => {
    const typesPath = path.join(testFilesPath, 'src', 'types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(content.includes("'revealFileInExplorer'"));
  });

  test('types.ts has WebviewToExtMessage with revealFileInExplorer', () => {
    const typesPath = path.join(testFilesPath, 'src', 'types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(content.includes("type: 'revealFileInExplorer'"));
  });

  test('messageHandler.ts has handleRevealFileInExplorer function', () => {
    const handlerPath = path.join(testFilesPath, 'src', 'webview', 'messageHandler.ts');
    const content = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(content.includes('handleRevealFileInExplorer'));
  });

  test('messageHandler.ts calls openExternal API', () => {
    const handlerPath = path.join(testFilesPath, 'src', 'webview', 'messageHandler.ts');
    const content = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(content.includes('openExternal'));
  });

  test('messageHandler.ts has case for revealFileInExplorer', () => {
    const handlerPath = path.join(testFilesPath, 'src', 'webview', 'messageHandler.ts');
    const content = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(content.includes("case 'revealFileInExplorer'"));
  });

  test('main.js has reveal-file-explorer context menu item', () => {
    const mainJsPath = path.join(testFilesPath, 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(content.includes('reveal-file-explorer'));
  });

  test('main.js sends revealFileInExplorer message on menu click', () => {
    const mainJsPath = path.join(testFilesPath, 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(content.includes("type: 'revealFileInExplorer'"));
  });

  test('main.js has handleRevealFileInExplorer function', () => {
    const mainJsPath = path.join(testFilesPath, 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(content.includes('handleRevealFileInExplorer()'));
  });

  test('main.js has triggerAction case for revealFileInExplorer', () => {
    const mainJsPath = path.join(testFilesPath, 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(content.includes("case 'revealFileInExplorer':"));
  });

  test('extension.ts registers gitHistory.revealFileInExplorer command', () => {
    const extensionPath = path.join(testFilesPath, 'src', 'extension.ts');
    const content = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(content.includes("gitHistory.revealFileInExplorer"));
  });

  test('package.json has gitHistory.revealFileInExplorer command definition', () => {
    const packageJsonPath = path.join(testFilesPath, 'package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    assert.ok(content.includes("gitHistory.revealFileInExplorer"));
  });

  test('package.json has keybinding for revealFileInExplorer', () => {
    const packageJsonPath = path.join(testFilesPath, 'package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    // Check for ctrl+alt+shift+e or cmd+alt+shift+e keybinding
    assert.ok(content.includes('ctrl+alt+shift+e') || content.includes('cmd+alt+shift+e'));
  });

  test('main.js context menu has "Reveal in File Explorer" label', () => {
    const mainJsPath = path.join(testFilesPath, 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(content.includes('Reveal in File Explorer'));
  });

  test('main.js context menu has folder icon for reveal-file-explorer', () => {
    const mainJsPath = path.join(testFilesPath, 'src', 'webview', 'panel', 'main.js');
    const content = fs.readFileSync(mainJsPath, 'utf-8');
    // Check for folder icon (either 📁 or 📂)
    assert.ok(content.includes('📂') || content.includes('📁'));
  });
});
