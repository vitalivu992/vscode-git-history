import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Copy File Diff Feature Tests', () => {
  const typesPath = path.join(__dirname, '../../../src/types.ts');
  const messageHandlerPath = path.join(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');

  test('types.ts should have copyFileDiff in WebviewAction type', () => {
    const typesContent = fs.readFileSync(typesPath, 'utf-8');

    // Check that copyFileDiff is in the WebviewAction type
    assert.ok(
      typesContent.includes("'copyFileDiff'") ||
      typesContent.includes('"copyFileDiff"'),
      'copyFileDiff should be in WebviewAction type'
    );
  });

  test('types.ts should have copyFileDiff in WebviewToExtMessage type', () => {
    const typesContent = fs.readFileSync(typesPath, 'utf-8');

    // Check that copyFileDiff message type exists with hash and filePath
    const hasCopyFileDiffMessage =
      (typesContent.includes('{ type: \'copyFileDiff\'') || typesContent.includes('{ type: "copyFileDiff"')) &&
      typesContent.includes('hash: string') &&
      typesContent.includes('filePath: string');

    assert.ok(
      hasCopyFileDiffMessage,
      'copyFileDiff message type should exist with hash and filePath properties'
    );
  });

  test('messageHandler.ts should have handleCopyFileDiff function', () => {
    const messageHandlerContent = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Check that handleCopyFileDiff function exists
    assert.ok(
      messageHandlerContent.includes('handleCopyFileDiff'),
      'handleCopyFileDiff function should exist in messageHandler.ts'
    );
  });

  test('handleCopyFileDiff should use getCommitDiff with filePath parameter', () => {
    const messageHandlerContent = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Find the handleCopyFileDiff function and check it calls getCommitDiff
    const copyFileDiffMatch = messageHandlerContent.match(
      /async function handleCopyFileDiff\([^)]+\): Promise<void>[\s\S]*?await getCommitDiff\([^)]*\)/
    );

    assert.ok(
      copyFileDiffMatch,
      'handleCopyFileDiff should call getCommitDiff'
    );

    // Check that filePath is passed as a parameter
    const functionContent = messageHandlerContent.match(
      /async function handleCopyFileDiff\([^)]+\): Promise<void>[\s\S]*?(?=async function|\n\}\s*$)/
    );

    assert.ok(
      functionContent && functionContent[0].includes('filePath'),
      'handleCopyFileDiff should use filePath parameter when calling getCommitDiff'
    );
  });

  test('messageHandler.ts should have case for copyFileDiff in handleMessage', () => {
    const messageHandlerContent = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Check that there's a case for copyFileDiff in the switch statement
    assert.ok(
      messageHandlerContent.includes("case 'copyFileDiff':") ||
      messageHandlerContent.includes('case "copyFileDiff":'),
      'handleMessage should have case for copyFileDiff'
    );
  });

  test('handleCopyFileDiff should handle binary files', () => {
    const messageHandlerContent = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Find the handleCopyFileDiff function
    const functionMatch = messageHandlerContent.match(
      /async function handleCopyFileDiff\([^)]+\): Promise<void>[\s\S]*?(?=async function|\n\}\s*$)/
    );

    assert.ok(
      functionMatch && functionMatch[0].includes('isBinary'),
      'handleCopyFileDiff should check for binary files'
    );
  });

  test('handleCopyFileDiff should write to clipboard', () => {
    const messageHandlerContent = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Find the handleCopyFileDiff function
    const functionMatch = messageHandlerContent.match(
      /async function handleCopyFileDiff\([^)]+\): Promise<void>[\s\S]*?(?=async function|\n\}\s*$)/
    );

    assert.ok(
      functionMatch && functionMatch[0].includes('clipboard.writeText'),
      'handleCopyFileDiff should write diff content to clipboard'
    );
  });

  test('main.js should have copy-file-diff context menu item', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that copy-file-diff context menu item exists
    assert.ok(
      mainJsContent.includes('data-action="copy-file-diff"'),
      'main.js should have copy-file-diff context menu item'
    );
  });

  test('main.js context menu should have 🩹 icon for copy diff', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that the copy-file-diff menu item has the 🩹 icon
    const copyFileDiffMenuMatch = mainJsContent.match(
      /data-action="copy-file-diff"[\s\S]*?context-menu-icon[^<]*<\/span>/
    );

    assert.ok(
      copyFileDiffMenuMatch && copyFileDiffMenuMatch[0].includes('🩹'),
      'copy-file-diff context menu item should have 🩹 icon'
    );
  });

  test('main.js should send copyFileDiff message when menu item is clicked', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that clicking copy-file-diff sends the correct message
    const clickHandlerMatch = mainJsContent.match(
      /action === 'copy-file-diff'[\s\S]*?vscode\.postMessage[\s\S]*?\}/
    );

    assert.ok(
      clickHandlerMatch,
      'main.js should have click handler for copy-file-diff action'
    );

    assert.ok(
      clickHandlerMatch && clickHandlerMatch[0].includes("type: 'copyFileDiff'"),
      'click handler should send copyFileDiff message type'
    );
  });

  test('main.js should pass hash and filePath in copyFileDiff message', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that the message includes both hash and filePath
    const clickHandlerMatch = mainJsContent.match(
      /action === 'copy-file-diff'[\s\S]*?vscode\.postMessage[\s\S]*?\}/
    );

    assert.ok(
      clickHandlerMatch &&
      clickHandlerMatch[0].includes('hash:') &&
      clickHandlerMatch[0].includes('filePath:'),
      'copyFileDiff message should include both hash and filePath'
    );
  });

  test('handleCopyFileDiff should show appropriate error messages', () => {
    const messageHandlerContent = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Find the handleCopyFileDiff function
    const functionMatch = messageHandlerContent.match(
      /async function handleCopyFileDiff\([^)]+\): Promise<void>[\s\S]*?(?=async function|\n\}\s*$)/
    );

    assert.ok(
      functionMatch && functionMatch[0].includes('showInformationMessage') && functionMatch[0].includes('showErrorMessage'),
      'handleCopyFileDiff should show both info and error messages'
    );
  });

  test('main.js should have handleCopyFileDiff function', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      mainJsContent.includes('function handleCopyFileDiff'),
      'main.js should have handleCopyFileDiff function'
    );
  });

  test('main.js triggerAction should dispatch copyFileDiff', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      mainJsContent.includes("case 'copyFileDiff': handleCopyFileDiff()"),
      'main.js triggerAction should dispatch copyFileDiff'
    );
  });

  test('handleCopyFileDiff should use selectedFile and get target commit', () => {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the handleCopyFileDiff function
    const fnStart = mainJsContent.indexOf('function handleCopyFileDiff');
    const fnEnd = mainJsContent.indexOf('\nfunction', fnStart + 1);
    const fnBody = mainJsContent.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('selectedFile'),
      'handleCopyFileDiff should check selectedFile'
    );
    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyFileDiff should use getOrderedCommits(getFilteredCommits())'
    );
  });
});
