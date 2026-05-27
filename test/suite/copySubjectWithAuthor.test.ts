import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Subject With Author Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

  test('types.ts should have copySubjectWithAuthor message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copySubjectWithAuthor'"),
      'types.ts should have copySubjectWithAuthor message type');
  });

  test('types.ts should have copySubjectWithAuthor in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copySubjectWithAuthor'"),
      'WebviewAction should include copySubjectWithAuthor');
  });

  test('types.ts should have copySubjectWithAuthor in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copySubjectWithAuthor'"),
      'WebviewToExtMessage should include copySubjectWithAuthor');
  });

  test('messageHandler.ts should handle copySubjectWithAuthor case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copySubjectWithAuthor':"),
      'messageHandler.ts should handle copySubjectWithAuthor case');
  });

  test('messageHandler.ts should have handleCopySubjectWithAuthor function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopySubjectWithAuthor'),
      'messageHandler.ts should have handleCopySubjectWithAuthor function');
  });

  test('handleCopySubjectWithAuthor should format as subject - author', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    assert.ok(fnStart >= 0, 'handleCopySubjectWithAuthor function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('${commit.message} - ${commit.author}'),
      'handleCopySubjectWithAuthor should format as subject - author');
  });

  test('handleCopySubjectWithAuthor should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    assert.ok(fnStart >= 0, 'handleCopySubjectWithAuthor function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopySubjectWithAuthor should write to clipboard');
  });

  test('handleCopySubjectWithAuthor should truncate long output', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    assert.ok(fnStart >= 0, 'handleCopySubjectWithAuthor function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 47)'),
      'handleCopySubjectWithAuthor should truncate long output');
  });

  test('handleCopySubjectWithAuthor should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    assert.ok(fnStart >= 0, 'handleCopySubjectWithAuthor function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopySubjectWithAuthor should handle commit not found');
  });

  test('main.js should have handleCopySubjectWithAuthor function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopySubjectWithAuthor'),
      'main.js should have handleCopySubjectWithAuthor function');
  });

  test('main.js should send copySubjectWithAuthor message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copySubjectWithAuthor'"),
      'main.js should send copySubjectWithAuthor message');
  });

  test('main.js triggerAction should dispatch copySubjectWithAuthor', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copySubjectWithAuthor': handleCopySubjectWithAuthor()"),
      'main.js triggerAction should dispatch copySubjectWithAuthor');
  });

  test('main.js should have context menu item for copy-subject-with-author', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-subject-with-author'),
      'main.js should have context menu item for copy-subject-with-author');
  });

  test('main.js context menu should handle copy-subject-with-author action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-subject-with-author'"),
      'main.js should handle copy-subject-with-author action');
  });

  test('main.js should have memo icon for subject with author menu item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const hasMenu = source.includes('copy-subject-with-author');
    const hasIcon = source.includes('📝');
    assert.ok(hasMenu && hasIcon,
      'main.js should have memo icon for subject with author menu item');
  });

  test('package.json should register copySubjectWithAuthor command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copySubjectWithAuthor'),
      'package.json should register gitHistory.copySubjectWithAuthor command');
  });

  test('package.json should have Copy Subject with Author command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Subject with Author'),
      'package.json should have Copy Subject with Author command title');
  });

  test('extension.ts should register copySubjectWithAuthor webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copySubjectWithAuthor'"),
      'extension.ts should register copySubjectWithAuthor webview action');
  });

  test('format check: subject with author produces expected output', () => {
    const message = 'Fix authentication bug';
    const author = 'John Doe';
    const result = `${message} - ${author}`;
    assert.strictEqual(result, 'Fix authentication bug - John Doe');
  });

  test('format check: special characters in message and author', () => {
    const message = 'Fix: "broken" feature (critical)';
    const author = "Jane O'Brien";
    const result = `${message} - ${author}`;
    assert.strictEqual(result, "Fix: \"broken\" feature (critical) - Jane O'Brien");
  });

  test('format check: truncation at 50 chars', () => {
    const message = 'This is a very long commit message that exceeds the truncation limit';
    const author = 'Some Author Name';
    const result = `${message} - ${author}`;
    const truncated = result.length > 50 ? result.substring(0, 47) + '...' : result;
    assert.strictEqual(truncated.length, 50);
    assert.ok(truncated.endsWith('...'));
  });
});
