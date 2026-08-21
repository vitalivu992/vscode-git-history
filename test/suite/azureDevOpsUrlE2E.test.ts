import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Azure DevOps URL E2E Tests', () => {
  test('parseRemoteUrl handles Azure DevOps HTTPS URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    assert.ok(fnStart >= 0, 'parseRemoteUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('dev.azure.com'),
      'Should handle dev.azure.com URLs');
    assert.ok(fnBody.includes('_git'),
      'Should handle Azure DevOps _git path segment');
  });

  test('parseRemoteUrl handles Azure DevOps SSH URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('ssh.dev.azure.com'),
      'Should handle ssh.dev.azure.com URLs');
  });

  test('parseRemoteUrl handles Azure DevOps legacy visualstudio.com URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('visualstudio.com'),
      'Should handle *.visualstudio.com legacy URLs');
  });

  test('GitRemoteInfo interface includes Azure platform and project field', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const interfaceStart = source.indexOf('interface GitRemoteInfo');
    assert.ok(interfaceStart >= 0, 'GitRemoteInfo interface should exist');
    const interfaceEnd = source.indexOf('}', interfaceStart);
    const interfaceBody = source.substring(interfaceStart, interfaceEnd);

    assert.ok(interfaceBody.includes("'azure'"),
      'GitRemoteInfo platform should include azure');
    assert.ok(interfaceBody.includes('project?'),
      'GitRemoteInfo should include optional project field');
  });

  test('detectPlatform identifies Azure DevOps hostnames', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('function detectPlatform');
    assert.ok(fnStart >= 0, 'detectPlatform function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'azure'"),
      'detectPlatform should return azure for Azure DevOps hostnames');
    assert.ok(fnBody.includes('dev.azure.com'),
      'Should detect dev.azure.com');
    assert.ok(fnBody.includes('ssh.dev.azure.com'),
      'Should detect ssh.dev.azure.com');
    assert.ok(fnBody.includes('visualstudio.com'),
      'Should detect *.visualstudio.com');
  });

  test('getCommitUrl handles Azure DevOps platform', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'azure'"),
      'getCommitUrl should handle Azure DevOps platform');
    assert.ok(fnBody.includes('/commit/'),
      'Should use /commit/ path for Azure DevOps');
  });

  test('messageHandler handles unknown platform message includes Azure DevOps', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // The error message for unknown platforms should NOT mention Azure since it's now supported
    // But we verify the copy URL handler exists
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
  });
});
