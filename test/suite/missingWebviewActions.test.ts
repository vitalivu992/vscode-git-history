import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Missing WebviewAction Types Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

  test('types.ts should have cycleDiffContextLines in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'cycleDiffContextLines'"),
      'WebviewAction should include cycleDiffContextLines');
  });

  test('types.ts should have cycleSortMode in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'cycleSortMode'"),
      'WebviewAction should include cycleSortMode');
  });

  test('main.js triggerAction should dispatch cycleDiffContextLines', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'cycleDiffContextLines': handleDiffContextLinesCycle()"),
      'main.js triggerAction should dispatch cycleDiffContextLines');
  });

  test('main.js triggerAction should dispatch cycleSortMode', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'cycleSortMode': handleSortToggle()"),
      'main.js triggerAction should dispatch cycleSortMode');
  });

  test('extension.ts should register cycleDiffContextLines webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'cycleDiffContextLines'"),
      'extension.ts should register cycleDiffContextLines webview action');
  });

  test('extension.ts should register cycleSortMode webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'cycleSortMode'"),
      'extension.ts should register cycleSortMode webview action');
  });
});
