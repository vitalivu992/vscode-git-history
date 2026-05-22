import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('README Git Log Command Documentation Tests', function() {
  this.timeout(10000);

  test('README.md should document Copy Filter as Git Log Command', function() {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('git log'), 'README should mention git log');
    assert.ok(source.includes('Ctrl+Alt+Shift+L') || source.includes('ctrl+alt+shift+l'), 'README should document the keyboard shortcut');
  });

  test('CLAUDE.md should document Copy Filter as Git Log Command feature', function() {
    const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
    const source = fs.readFileSync(claudePath, 'utf-8');

    assert.ok(source.includes('Copy Filter as Git Log Command'), 'CLAUDE.md should document the feature');
    assert.ok(source.includes('buildGitLogCommand'), 'CLAUDE.md should mention buildGitLogCommand function');
    assert.ok(source.includes('handleCopyFilterAsGitLogCommand'), 'CLAUDE.md should mention the handler function');
    assert.ok(source.includes('copyFilterAsGitLogCommand'), 'CLAUDE.md should mention the message type');
  });

  test('CLAUDE.md should include copyFilterAsGitLogCommand in message protocol', function() {
    const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
    const source = fs.readFileSync(claudePath, 'utf-8');

    assert.ok(source.includes('`copyFilterAsGitLogCommand`'), 'CLAUDE.md should list copyFilterAsGitLogCommand in webview sends');
  });
});
