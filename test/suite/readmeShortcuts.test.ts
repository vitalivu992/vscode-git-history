import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('README Keyboard Shortcuts Documentation Test Suite', () => {
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('README should document deleteBranch shortcut (Ctrl+Alt+X)', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(
      readme.includes('Ctrl+Alt+X') && readme.includes('Delete Branch'),
      'README should document the deleteBranch keyboard shortcut'
    );
  });

  test('README should document createBranch shortcut (Ctrl+Shift+Alt+B)', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(
      readme.includes('Ctrl+Shift+Alt+B') && readme.includes('Create Branch'),
      'README should document the createBranch keyboard shortcut'
    );
  });

  test('README should document createTag shortcut (Ctrl+Alt+I)', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(
      readme.includes('Ctrl+Alt+I') && readme.includes('Create Tag'),
      'README should document the createTag keyboard shortcut'
    );
  });

  test('README should document deleteTag shortcut (Ctrl+Alt+.)', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(
      readme.includes('Ctrl+Alt+.') && readme.includes('Delete Tag'),
      'README should document the deleteTag keyboard shortcut'
    );
  });

  test('README should document exportMbox shortcut (Ctrl+Shift+Alt+E)', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(
      readme.includes('Ctrl+Shift+Alt+E') && readme.includes('mbox'),
      'README should document the exportMbox keyboard shortcut'
    );
  });
});
