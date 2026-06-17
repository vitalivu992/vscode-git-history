import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Message Handler Switch Case Coverage', () => {
  let handlerSource: string;
  let typesSource: string;

  suiteSetup(() => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    handlerSource = fs.readFileSync(handlerPath, 'utf-8');

    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    typesSource = fs.readFileSync(typesPath, 'utf-8');
  });

  function extractMessageTypesFromTypes(): string[] {
    const webviewMsgMatch = typesSource.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(webviewMsgMatch, 'Should find WebviewToExtMessage type definition');

    const types: string[] = [];
    const regex = /type:\s*'(\w+)'/g;
    let match;
    while ((match = regex.exec(webviewMsgMatch[1])) !== null) {
      types.push(match[1]);
    }
    return types;
  }

  function extractSwitchCases(): string[] {
    const switchMatch = handlerSource.match(/switch\s*\(\s*message\.type\s*\)\s*\{([\s\S]*?)\n\s*default:/);
    assert.ok(switchMatch, 'Should find switch statement');

    const cases: string[] = [];
    const regex = /case\s*'(\w+)':/g;
    let match;
    while ((match = regex.exec(switchMatch[1])) !== null) {
      cases.push(match[1]);
    }
    return cases;
  }

  test('every WebviewToExtMessage type should have a corresponding switch case', () => {
    const messageTypes = extractMessageTypesFromTypes();
    const switchCases = extractSwitchCases();

    const missingCases = messageTypes.filter(t => !switchCases.includes(t));
    assert.strictEqual(
      missingCases.length,
      0,
      `The following message types are defined in types.ts but have no switch case in messageHandler.ts: ${missingCases.join(', ')}`
    );
  });

  test('copyFilePath should be handled in switch statement', () => {
    assert.ok(
      handlerSource.includes("case 'copyFilePath':"),
      'messageHandler should have case for copyFilePath'
    );
  });

  test('openFileAtCommit should be handled in switch statement', () => {
    assert.ok(
      handlerSource.includes("case 'openFileAtCommit':"),
      'messageHandler should have case for openFileAtCommit'
    );
  });

  test('handleCopyFilePath function should exist', () => {
    assert.ok(
      handlerSource.includes('function handleCopyFilePath'),
      'messageHandler should have handleCopyFilePath function'
    );
  });

  test('handleOpenFileAtCommit function should exist', () => {
    assert.ok(
      handlerSource.includes('function handleOpenFileAtCommit'),
      'messageHandler should have handleOpenFileAtCommit function'
    );
  });

  test('copyFilePath case should call handleCopyFilePath', () => {
    const caseStart = handlerSource.indexOf("case 'copyFilePath':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('handleCopyFilePath'), 'copyFilePath case should call handleCopyFilePath');
  });

  test('openFileAtCommit case should call handleOpenFileAtCommit', () => {
    const caseStart = handlerSource.indexOf("case 'openFileAtCommit':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('handleOpenFileAtCommit'), 'openFileAtCommit case should call handleOpenFileAtCommit');
  });

  test('copyBranchName should be handled in switch statement', () => {
    assert.ok(
      handlerSource.includes("case 'copyBranchName':"),
      'messageHandler should have case for copyBranchName'
    );
  });

  test('handleCopyBranchName function should exist', () => {
    assert.ok(
      handlerSource.includes('function handleCopyBranchName'),
      'messageHandler should have handleCopyBranchName function'
    );
  });

  test('copyBranchName case should call handleCopyBranchName', () => {
    const caseStart = handlerSource.indexOf("case 'copyBranchName':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('handleCopyBranchName'), 'copyBranchName case should call handleCopyBranchName');
  });

  test('copyCommitStats should be handled in switch statement', () => {
    assert.ok(
      handlerSource.includes("case 'copyCommitStats':"),
      'messageHandler should have case for copyCommitStats'
    );
  });

  test('handleCopyCommitStats function should exist', () => {
    assert.ok(
      handlerSource.includes('function handleCopyCommitStats'),
      'messageHandler should have handleCopyCommitStats function'
    );
  });

  test('copyCommitStats case should call handleCopyCommitStats', () => {
    const caseStart = handlerSource.indexOf("case 'copyCommitStats':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('handleCopyCommitStats'), 'copyCommitStats case should call handleCopyCommitStats');
  });

  test('copyCommitStats case should pass hash from message', () => {
    const caseStart = handlerSource.indexOf("case 'copyCommitStats':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('message.hash'), 'copyCommitStats case should pass message.hash');
  });

  test('copyFilePath case should pass filePath from message', () => {
    const caseStart = handlerSource.indexOf("case 'copyFilePath':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('message.filePath'), 'copyFilePath case should pass message.filePath');
  });

  test('openFileAtCommit case should pass hash and filePath from message', () => {
    const caseStart = handlerSource.indexOf("case 'openFileAtCommit':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('message.hash'), 'openFileAtCommit case should pass message.hash');
    assert.ok(caseBlock.includes('message.filePath'), 'openFileAtCommit case should pass message.filePath');
  });

  test('switch statement should be between isValidMessage check and default', () => {
    const validationIdx = handlerSource.indexOf('isValidMessage');
    const switchIdx = handlerSource.indexOf('switch (message.type)');
    const defaultIdx = handlerSource.indexOf('default:');

    assert.ok(validationIdx > 0, 'Should have isValidMessage check');
    assert.ok(switchIdx > validationIdx, 'Switch should come after validation');
    assert.ok(defaultIdx > switchIdx, 'Default should come after switch cases');
  });

  test('all handler functions referenced in switch should exist', () => {
    const switchMatch = handlerSource.match(/switch\s*\(\s*message\.type\s*\)\s*\{([\s\S]*?)\n\s*default:/);
    assert.ok(switchMatch, 'Should find switch statement');

    const lines = switchMatch[1].split('\n');
    const handlerNames: string[] = [];
    for (const line of lines) {
      const match = line.match(/(?:await\s+)?(\w+)\(/);
      if (match && match[1] !== 'panel' && match[1] !== 'switch' && match[1] !== 'case' && match[1] !== 'break') {
        const lineTrimmed = line.trim();
        if (!lineTrimmed.startsWith('panel.') && !lineTrimmed.startsWith('await panel.')) {
          handlerNames.push(match[1]);
        }
      }
    }

    for (const name of handlerNames) {
      assert.ok(
        handlerSource.includes(`function ${name}`),
        `Handler function '${name}' referenced in switch should exist`
      );
    }
  });
});

suite('Message Handler Integration - copyFilePath', () => {
  test('handleCopyFilePath should write filePath to clipboard', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFilePath');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText(filePath)'), 'Should write filePath to clipboard');
    assert.ok(fnBody.includes('path.basename(filePath)'), 'Should extract basename for display message');
    assert.ok(fnBody.includes('showInformationMessage'), 'Should show confirmation');
  });
});

suite('Message Handler Integration - openFileAtCommit', () => {
  test('handleOpenFileAtCommit should use git-history URI scheme', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleOpenFileAtCommit');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("scheme: 'git-history'"), 'Should use git-history URI scheme');
    assert.ok(fnBody.includes('encodeURIComponent(cwd)'), 'Should encode cwd in URI query');
    assert.ok(fnBody.includes('showTextDocument'), 'Should call showTextDocument');
    assert.ok(fnBody.includes("query: `commit="), 'Should include commit in query');
  });

  test('handleOpenFileAtCommit should have error handling', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('async function handleOpenFileAtCommit');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('try'), 'Should have try block');
    assert.ok(fnBody.includes('catch'), 'Should have catch block');
    assert.ok(fnBody.includes('showErrorMessage'), 'Should show error message on failure');
  });
});

suite('Message Handler Integration - copyCommitStats', () => {
  test('handleCopyCommitStats should write formatted stats to clipboard', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText(copyText)'), 'Should write formatted stats to clipboard');
    assert.ok(fnBody.includes('showInformationMessage'), 'Should show confirmation with stats summary');
  });

  test('handleCopyCommitStats should handle missing commit gracefully', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'), 'Should show message when commit is not found');
  });

  test('handleCopyCommitStats should handle missing stats gracefully', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No statistics available'), 'Should show message when stats are not available');
  });

  test('handleCopyCommitStats should format stats with singular/plural files', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(
      fnBody.includes("filesChanged === 1") || (fnBody.includes("'file'") && fnBody.includes("'files'")),
      'Should use singular "file" when count is 1 and plural "files" otherwise'
    );
  });

  test('handleCopyCommitStats should include all stat fields in output', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('filesChanged'), 'Should include files changed');
    assert.ok(fnBody.includes('insertions'), 'Should include insertions');
    assert.ok(fnBody.includes('deletions'), 'Should include deletions');
    assert.ok(fnBody.includes('Net:'), 'Should include net change');
  });
});
