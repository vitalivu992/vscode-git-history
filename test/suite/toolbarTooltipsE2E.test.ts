import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

suite('Toolbar Tooltips E2E', function () {
  this.timeout(60000);

  suiteSetup(async function () {
    const extension = vscode.extensions.getExtension('vitalivu.vscode-git-history');
    if (!extension) {
      this.skip();
      return;
    }
    await extension.activate();
  });

  test('toolbar button HTML includes keyboard shortcuts in both index.html and webviewProvider.ts', function () {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const provider = fs.readFileSync(providerPath, 'utf-8');

    const buttons = [
      { id: 'sort-btn', shortcut: 'Ctrl+Shift+3' },
      { id: 'merge-toggle-btn', shortcut: 'Ctrl+Shift+Q' },
      { id: 'graph-toggle-btn', shortcut: 'Ctrl+Alt+T' },
      { id: 'signatures-toggle-btn', shortcut: 'Ctrl+Shift+Alt+S' },
      { id: 'stats-toggle-btn', shortcut: 'Ctrl+Shift+Alt+T' },
    ];

    for (const btn of buttons) {
      const htmlMatch = html.includes(`id="${btn.id}"`) && html.includes(btn.shortcut);
      const providerMatch = provider.includes(`id="${btn.id}"`) && provider.includes(btn.shortcut);
      assert.ok(htmlMatch, `index.html ${btn.id} should include ${btn.shortcut}`);
      assert.ok(providerMatch, `webviewProvider.ts ${btn.id} should include ${btn.shortcut}`);
    }
  });
});
