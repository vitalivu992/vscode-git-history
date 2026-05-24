import assert from 'assert';
import fs from 'fs';
import path from 'path';

const readmePath = path.join(__dirname, '../../../README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf-8');

suite('Undocumented Copy Commands Documentation Test', () => {
  test('README.md should document Copy Signature Info', () => {
    assert.ok(
      readmeContent.includes('Copy Signature Info') || readmeContent.includes('copySignatureInfo'),
      'README.md should document the Copy Signature Info feature'
    );
  });

  test('README.md should document Copy Files Changed Count', () => {
    assert.ok(
      readmeContent.includes('Copy Files Changed Count') || readmeContent.includes('copyFilesChangedCount'),
      'README.md should document the Copy Files Changed Count feature'
    );
  });

  test('README.md should document Copy File Basename', () => {
    assert.ok(
      readmeContent.includes('Copy File Basename') || readmeContent.includes('copyFileBasename'),
      'README.md should document the Copy File Basename feature'
    );
  });

  test('README.md should include keyboard shortcut for Copy Signature Info', () => {
    assert.ok(
      readmeContent.includes('Ctrl+Shift+Alt+G') || readmeContent.includes('Cmd+Shift+Alt+G'),
      'README.md should document the keyboard shortcut for Copy Signature Info'
    );
  });

  test('README.md should include keyboard shortcut for Copy File Basename', () => {
    assert.ok(
      readmeContent.includes('Ctrl+Shift+Alt+N') || readmeContent.includes('Cmd+Shift+Alt+N'),
      'README.md should document the keyboard shortcut for Copy File Basename'
    );
  });
});
