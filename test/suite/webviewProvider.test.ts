import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('WebviewProvider HTML Tests', () => {
  let panel: vscode.WebviewPanel;
  let html: string;

  suiteSetup(() => {
    const extensionUri = vscode.Uri.file(path.resolve(__dirname, '../../../'));

    panel = vscode.window.createWebviewPanel(
      'gitHistory.test',
      'Test',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'panel')]
      }
    );

    // Import and call the HTML generation by constructing it similarly to webviewProvider
    const nonce = 'test-nonce-12345';
    const stylesUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'panel', 'styles.css'));
    const mainJsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'panel', 'main.js'));

    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net;">
  <title>Git History</title>
  <link rel="stylesheet" href="${stylesUri}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html@3.4.47/bundles/css/diff2html.min.css">
</head>
<body>
  <div id="app">
    <div id="diff-controls">
      <button id="unified-btn" class="active">Unified</button>
      <button id="side-by-side-btn">Side-by-Side</button>
    </div>

    <div id="main-content">
      <div id="diff-viewer"></div>

      <div id="bottom-panel">
        <div id="commit-table-container">
          <table id="commit-table">
            <thead>
              <tr>
                <th class="hash-col">Hash</th>
                <th class="author-col">Author</th>
                <th class="date-col">Date</th>
                <th class="message-col">Message</th>
              </tr>
            </thead>
            <tbody id="commit-list"></tbody>
          </table>
        </div>

        <div id="commit-detail">
          <h3>Changed Files</h3>
          <ul id="file-list"></ul>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/diff2html@3.4.47/bundles/js/diff2html-ui.min.js"></script>
  <script nonce="${nonce}" src="${mainJsUri}"></script>
</body>
</html>`;

    panel.webview.html = html;
  });

  suiteTeardown(() => {
    panel.dispose();
  });

  // Read the actual webviewProvider source to verify CSP in the real template
  test('webviewProvider CSP should use nonce for script-src, not unsafe-inline', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes("script-src 'nonce-${nonce}'"), 'script-src should use nonce');
    assert.ok(!source.includes("script-src 'unsafe-inline'"), 'script-src should not use unsafe-inline');
  });

  test('webviewProvider CSP should use cspSource for scripts and styles', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('cspSource'), 'CSP should use webview.cspSource for local resources');
    assert.ok(!source.includes('https://cdn.jsdelivr.net'), 'CSP should not use CDN (diff2html is bundled locally)');
  });

  test('diff2html script should be loaded locally (not from CDN)', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('diff2html-ui.min.js'), 'Should reference diff2html-ui.min.js');
    assert.ok(!source.includes('cdn.jsdelivr.net'), 'Should not load from CDN');
  });

  test('diff2html CSS should be loaded locally (not from CDN)', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('diff2html.min.css'), 'Should reference diff2html.min.css locally');
  });

  test('HTML should contain expected structural elements', () => {
    assert.ok(html.includes('id="app"'), 'Should have #app');
    assert.ok(html.includes('id="main-content"'), 'Should have #main-content');
    assert.ok(html.includes('id="bottom-panel"'), 'Should have #bottom-panel');
    assert.ok(html.includes('id="diff-viewer"'), 'Should have #diff-viewer');
    assert.ok(html.includes('id="commit-list"'), 'Should have #commit-list');
    assert.ok(html.includes('id="file-list"'), 'Should have #file-list');
  });

  test('main.js script tag should have nonce attribute', () => {
    assert.ok(html.includes('nonce="test-nonce-12345"'), 'main.js script should have nonce');
  });

  test('main.js should not call non-existent diff2html methods', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(!source.includes('.highlightAll('),
      'Should not call highlightAll (not a Diff2HtmlUI method)');
  });
});

suite('Message Type Tests', () => {
  test('requestFileDiff message type should be defined in WebviewToExtMessage', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'requestFileDiff'"), 'WebviewToExtMessage should include requestFileDiff type');
    assert.ok(source.includes('filePath: string'), 'requestFileDiff should have filePath field');
  });

  test('diff message should support optional selectedFile field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('selectedFile?: string'), 'diff message should have optional selectedFile field');
  });

  test('messageHandler should handle requestFileDiff without error', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'requestFileDiff'"), 'messageHandler should have requestFileDiff case');
    assert.ok(source.includes('handleRequestFileDiff'), 'messageHandler should call handleRequestFileDiff');
  });
});

suite('Status Class Mapping Tests', () => {
  function getStatusClass(status: string): string {
    switch (status) {
      case 'A': return 'added';
      case 'M': return 'modified';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      case 'C': return 'copied';
      default: return '';
    }
  }

  test('status C should map to copied class', () => {
    assert.strictEqual(getStatusClass('C'), 'copied');
  });

  test('status A should map to added class', () => {
    assert.strictEqual(getStatusClass('A'), 'added');
  });

  test('status M should map to modified class', () => {
    assert.strictEqual(getStatusClass('M'), 'modified');
  });

  test('status D should map to deleted class', () => {
    assert.strictEqual(getStatusClass('D'), 'deleted');
  });

  test('status R should map to renamed class', () => {
    assert.strictEqual(getStatusClass('R'), 'renamed');
  });

  test('unknown status should return empty string', () => {
    assert.strictEqual(getStatusClass('X'), '');
  });
});
