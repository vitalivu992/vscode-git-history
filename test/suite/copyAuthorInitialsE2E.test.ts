import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Author Initials E2E Tests', () => {
  test('README.md documents copy author initials shortcut', () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const readme = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(
      readme.includes('Ctrl+Alt+Shift+I') && readme.includes('Copy author initials'),
      'README should document copy author initials shortcut'
    );
  });

  test('keyboard help dialog shows copy author initials', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes("'Copy author initials'") || mainJs.includes('"Copy author initials"') || mainJs.includes("Copy author initials"),
      'Keyboard help should show copy author initials'
    );
  });

  test('context menu has copy author initials option', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes("Copy author initials") &&
      mainJs.includes("copy-author-initials"),
      'Context menu should have copy author initials option'
    );
  });

  test('CLAUDE.md documents copy author initials', () => {
    const claudeMdPath = path.resolve(__dirname, '../../../CLAUDE.md');
    const claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');
    assert.ok(
      claudeMd.includes('Copy Author Initials') && claudeMd.includes('Ctrl+Alt+Shift+I'),
      'CLAUDE.md should document copy author initials feature'
    );
  });
});
