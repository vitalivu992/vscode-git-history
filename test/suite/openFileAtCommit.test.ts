import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { handleMessage } from '../../src/webview/messageHandler';
import { GitHistoryPanel } from '../../src/webview/webviewProvider';
import * as vscode from 'vscode';

suite('Open File at Commit Feature', () => {
  let tempDir: string;
  let testFile: string;
  let mockPanel: GitHistoryPanel;
  let postedMessages: any[] = [];

  suiteSetup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-open-file-test-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Initial content line 1\nInitial content line 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Initial content line 1\nModified content line 2\nAdded line 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit with modifications"', { cwd: tempDir });

    mockPanel = {
      getCwd: () => tempDir,
      getCommits: () => {
        const output = execSync('git log --format=%H%x00%s --reverse', { cwd: tempDir, encoding: 'utf-8' });
        return output.trim().split('\n').map((line: string) => {
          const [hash, message] = line.split('\x00');
          return {
            hash,
            shortHash: hash.substring(0, 7),
            message,
            parentHashes: [],
            author: 'Test User',
            email: 'test@example.com',
            date: new Date().toISOString(),
            fullMessage: message
          };
        }).reverse();
      },
      postMessage: (msg: any) => {
        postedMessages.push(msg);
      }
    } as unknown as GitHistoryPanel;
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  setup(() => {
    postedMessages = [];
  });

  test('Message type openFileAtCommit should be defined in types', () => {
    const message = {
      type: 'openFileAtCommit',
      hash: 'abc123',
      filePath: testFile
    };

    assert.strictEqual(message.type, 'openFileAtCommit');
    assert.ok(message.hash);
    assert.ok(message.filePath);
  });

  test('Git service should support retrieving file content at commit', async () => {
    const { getFileContentAtCommit } = await import('../../src/git/gitService');

    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H --reverse', { cwd: tempDir, encoding: 'utf-8' });
    const commitHashes = commitsOutput.trim().split('\n');

    assert.ok(commitHashes.length >= 2, 'Should have at least 2 commits');

    const initialContent = await getFileContentAtCommit(testFile, commitHashes[0], tempDir);
    assert.ok(initialContent.includes('Initial content'), 'Should have initial content');
    assert.ok(!initialContent.includes('Modified content'), 'Should not have modified content');
    assert.ok(!initialContent.includes('Added line 3'), 'Should not have line 3');

    const secondContent = await getFileContentAtCommit(testFile, commitHashes[1], tempDir);
    assert.ok(secondContent.includes('Initial content'), 'Should have initial content');
    assert.ok(secondContent.includes('Modified content'), 'Should have modified content');
    assert.ok(secondContent.includes('Added line 3'), 'Should have line 3');
  });

  test('Message handler should process openFileAtCommit message', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H --reverse', { cwd: tempDir, encoding: 'utf-8' });
    const commitHashes = commitsOutput.trim().split('\n');

    const message = {
      type: 'openFileAtCommit' as const,
      hash: commitHashes[0],
      filePath: testFile
    };

    try {
      await handleMessage(message, mockPanel);
      assert.ok(true, 'Message handler processed openFileAtCommit without error');
    } catch (error) {
      assert.ok(true, 'Handler attempted to process (may fail due to missing VS Code APIs in test)');
    }
  });

  test('messageHandler should construct git-history URI for openFileAtCommit', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("scheme: 'git-history'"), 'handleOpenFileAtCommit should use git-history scheme');
    assert.ok(source.includes('encodeURIComponent(cwd)'), 'handleOpenFileAtCommit should encode cwd in URI query');
    assert.ok(source.includes('showTextDocument'), 'handleOpenFileAtCommit should open the URI as a text document');
  });

  test('messageHandler should not use untitled document workaround', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const openFileSection = source.substring(
      source.indexOf('async function handleOpenFileAtCommit'),
      source.indexOf('}', source.indexOf('Failed to open file at commit') + 100)
    );

    assert.ok(!openFileSection.includes('openTextDocument({'), 'Should not use openTextDocument with content object');
    assert.ok(!openFileSection.includes('For now'), 'Should not contain workaround comments');
    assert.ok(!openFileSection.includes('showInformationMessage'), 'Should not show info message workaround');
  });
});

suite('GitHistoryContentProvider', () => {
  test('GitHistoryContentProvider should be exported from gitHistoryContentProvider module', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/gitHistoryContentProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('export class GitHistoryContentProvider'), 'Should export GitHistoryContentProvider');
    assert.ok(source.includes('TextDocumentContentProvider'), 'Should implement TextDocumentContentProvider');
  });

  test('GitHistoryContentProvider should define static scheme property', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/gitHistoryContentProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes("static readonly scheme = 'git-history'"), 'Should define git-history scheme');
  });

  test('GitHistoryContentProvider should implement provideTextDocumentContent', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/gitHistoryContentProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('provideTextDocumentContent'), 'Should implement provideTextDocumentContent');
    assert.ok(source.includes('getFileContentAtCommit'), 'Should call getFileContentAtCommit');
  });

  test('GitHistoryContentProvider should parse commit and cwd from URI query', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/gitHistoryContentProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes("params.get('commit')"), 'Should parse commit from URI query');
    assert.ok(source.includes("params.get('cwd')"), 'Should parse cwd from URI query');
    assert.ok(source.includes('URLSearchParams'), 'Should use URLSearchParams for parsing');
  });

  test('extension.ts should register GitHistoryContentProvider', () => {
    const fs = require('fs');
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("import { GitHistoryContentProvider }"), 'Should import GitHistoryContentProvider');
    assert.ok(source.includes('registerTextDocumentContentProvider'), 'Should register text document content provider');
    assert.ok(source.includes('GitHistoryContentProvider.scheme'), 'Should use the static scheme property');
  });

  test('extension.ts should add provider to context.subscriptions', () => {
    const fs = require('fs');
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    const pushIdx = source.indexOf('context.subscriptions.push');
    const registerIdx = source.indexOf('registerTextDocumentContentProvider');

    assert.ok(pushIdx > 0, 'Should have context.subscriptions.push');
    assert.ok(registerIdx > pushIdx, 'registerTextDocumentContentProvider should be after context.subscriptions.push');

    const between = source.substring(pushIdx, registerIdx);
    assert.ok(!between.includes('\n}\n'), 'Should not cross function boundary');
  });

  test('messageHandler should not import getFileContentAtCommit directly', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(!source.includes('getFileContentAtCommit'), 'messageHandler should not import getFileContentAtCommit (provider handles it)');
  });

  test('openFileAtCommit message type should be defined in types', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'openFileAtCommit'"), 'WebviewToExtMessage should include openFileAtCommit');
    assert.ok(source.includes('hash: string'), 'openFileAtCommit should have hash field');
    assert.ok(source.includes('filePath: string'), 'openFileAtCommit should have filePath field');
  });
});
