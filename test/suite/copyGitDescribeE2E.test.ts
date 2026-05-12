import * as assert from 'assert';
import * as fs from 'fs';

suite('copyGitDescribe E2E Tests', () => {
  test('copyDescribe message type exists in types.ts', () => {
    const hasCopyDescribe = hasMessageType('copyDescribe');
    assert.ok(hasCopyDescribe, 'copyDescribe message type should exist');
  });

  test('copyDescribe handler exists in messageHandler.ts', () => {
    const hasHandler = hasMessageHandler('copyDescribe');
    assert.ok(hasHandler, 'handleCopyDescribe should exist');
  });

  test('copyDescribe webview action exists', () => {
    const hasAction = hasWebviewAction('copyDescribe');
    assert.ok(hasAction, 'copyDescribe action should exist');
  });

  test('gitHistory.copyDescribe command registered in extension.ts', () => {
    const hasCommand = hasVSCodeCommand('gitHistory.copyDescribe');
    assert.ok(hasCommand, 'gitHistory.copyDescribe command should be registered');
  });

  test('copyDescribe keybinding registered in package.json', () => {
    const hasKeybinding = hasKeybindingRegistration('gitHistory.copyDescribe');
    assert.ok(hasKeybinding, 'copyDescribe keybinding should be registered');
  });
});

function hasMessageType(type: string): boolean {
  const typesContent = fs.readFileSync('./src/types.ts', 'utf-8');
  return typesContent.includes(`| '${type}'`);
}

function hasMessageHandler(type: string): boolean {
  const handlerContent = fs.readFileSync('./src/webview/messageHandler.ts', 'utf-8');
  return handlerContent.includes(`case '${type}'`) && handlerContent.includes('handleCopyDescribe');
}

function hasWebviewAction(type: string): boolean {
  const mainContent = fs.readFileSync('./src/webview/panel/main.js', 'utf-8');
  return mainContent.includes(`case '${type}':`) && mainContent.includes('handleCopyDescribe()');
}

function hasVSCodeCommand(command: string): boolean {
  const extContent = fs.readFileSync('./src/extension.ts', 'utf-8');
  return extContent.includes(`'${command}'`);
}

function hasKeybindingRegistration(command: string): boolean {
  const pkgContent = fs.readFileSync('./package.json', 'utf-8');
  return pkgContent.includes(`"command": "${command}"`) && pkgContent.includes('ctrl+alt+g');
}