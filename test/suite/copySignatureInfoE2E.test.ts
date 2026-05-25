import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Simulate copy signature info behavior
interface CommitSignature {
  verified: boolean;
  signer?: string;
}

interface CommitInfo {
  hash: string;
  signature?: CommitSignature;
}

function simulateCopySignatureInfo(commit: CommitInfo): { text: string; error: string | null } {
  let signatureInfo: string;
  if (commit.signature?.verified) {
    signatureInfo = 'Signature: Verified';
    if (commit.signature.signer) {
      signatureInfo += `\nSigner: ${commit.signature.signer}`;
    }
  } else {
    signatureInfo = 'Signature: Not Verified';
  }
  return { text: signatureInfo, error: null };
}

suite('Copy Signature Info E2E Logic Tests', () => {
  test('copying signature info for verified commit without signer', () => {
    const commit: CommitInfo = {
      hash: 'abc123',
      signature: { verified: true }
    };
    const result = simulateCopySignatureInfo(commit);
    assert.strictEqual(result.text, 'Signature: Verified');
    assert.strictEqual(result.error, null);
  });

  test('copying signature info for verified commit with signer', () => {
    const commit: CommitInfo = {
      hash: 'def456',
      signature: { verified: true, signer: 'Alice <alice@example.com>' }
    };
    const result = simulateCopySignatureInfo(commit);
    assert.strictEqual(result.text, 'Signature: Verified\nSigner: Alice <alice@example.com>');
    assert.strictEqual(result.error, null);
  });

  test('copying signature info for unverified commit', () => {
    const commit: CommitInfo = {
      hash: 'ghi789',
      signature: { verified: false }
    };
    const result = simulateCopySignatureInfo(commit);
    assert.strictEqual(result.text, 'Signature: Not Verified');
    assert.strictEqual(result.error, null);
  });

  test('copying signature info for commit without signature', () => {
    const commit: CommitInfo = {
      hash: 'jkl012'
    };
    const result = simulateCopySignatureInfo(commit);
    assert.strictEqual(result.text, 'Signature: Not Verified');
    assert.strictEqual(result.error, null);
  });
});

suite('Copy Signature Info E2E Source Integration Tests', () => {
  const typesPath = path.resolve(__dirname, '../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
  const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test('types.ts defines copySignatureInfo in all required unions', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes("'copySignatureInfo'"), 'types.ts should include copySignatureInfo');
  });

  test('messageHandler.ts implements handleCopySignatureInfo function', () => {
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(handlerSource.includes('function handleCopySignatureInfo'),
      'messageHandler.ts should have handleCopySignatureInfo function');
    assert.ok(handlerSource.includes("case 'copySignatureInfo':"),
      'messageHandler.ts should handle copySignatureInfo case');
  });

  test('handleCopySignatureInfo handles verified signature with signer', () => {
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = handlerSource.indexOf('function handleCopySignatureInfo');
    assert.ok(fnStart >= 0, 'handleCopySignatureInfo should exist');
    const fnEnd = handlerSource.indexOf('\n}', fnStart + 400);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('signature?.verified'),
      'Function should check signature.verified');
    assert.ok(fnBody.includes('Signature: Verified'),
      'Function should output "Signature: Verified"');
    assert.ok(fnBody.includes('signature.signer'),
      'Function should include signer when available');
  });

  test('handleCopySignatureInfo handles not verified signature', () => {
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = handlerSource.indexOf('function handleCopySignatureInfo');
    const fnEnd = handlerSource.indexOf('\n}', fnStart + 400);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Signature: Not Verified'),
      'Function should output "Signature: Not Verified" for unverified signatures');
  });

  test('main.js has handleCopySignatureInfo function and sends message', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(mainSource.includes('function handleCopySignatureInfo'),
      'main.js should have handleCopySignatureInfo function');
    assert.ok(mainSource.includes("type: 'copySignatureInfo'"),
      'main.js should send copySignatureInfo message');
  });

  test('main.js has context menu entry for copy-signature-info', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(mainSource.includes('data-action="copy-signature-info"'),
      'main.js should have context menu entry');
    assert.ok(mainSource.includes('🔐'),
      'main.js should have lock icon');
  });

  test('extension.ts registers copySignatureInfo webview action', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(extensionSource.includes("action: 'copySignatureInfo'"),
      'extension.ts should register copySignatureInfo webview action');
  });

  test('package.json defines copySignatureInfo command and keybinding', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copySignatureInfo'
    );
    assert.ok(command, 'package.json should define gitHistory.copySignatureInfo command');

    const keybinding = packageJson.contributes.keybindings.find(
      (kb: any) => kb.command === 'gitHistory.copySignatureInfo'
    );
    assert.ok(keybinding, 'package.json should have keybinding');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+g');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+g');
  });

  test('README.md documents the feature', () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const readmeSource = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(readmeSource.includes('Copy Signature Info'),
      'README.md should document Copy Signature Info');
  });
});
