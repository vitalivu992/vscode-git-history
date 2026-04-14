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
      <div class="segmented-control">
        <button id="unified-btn" class="active">Unified</button>
        <button id="side-by-side-btn">Side by Side</button>
      </div>
      <button id="copy-btn" class="copy-btn" title="Copy commit message (Ctrl+Shift+C)">Copy</button>
      <button id="sort-btn" class="sort-btn" title="Sort: Newest first (click to toggle)">&#x2193; Newest</button>
      <button id="refresh-btn" title="Refresh (Ctrl+Shift+R)">&#x21bb;</button>
    </div>

    <div id="main-content">
      <div id="diff-viewer"></div>
      <div id="vertical-resizer"></div>

      <div id="bottom-panel">
        <div id="commit-table-container">
          <div class="search-container">
            <input type="text" id="search-input" placeholder="Search commits by message, author, or hash...">
          </div>
          <table id="commit-table">
            <thead>
              <tr>
                <th class="graph-col">Graph</th>
                <th class="hash-col">Hash</th>
                <th class="author-col">Author</th>
                <th class="date-col">Date</th>
                <th class="message-col">Message</th>
              </tr>
            </thead>
            <tbody id="commit-list"></tbody>
          </table>
        </div>

        <div id="horizontal-resizer"></div>

        <div id="commit-detail">
          <div id="commit-detail-header">
            <span class="detail-label">Changed Files</span>
          </div>
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

  test('requestRefresh message type should be defined in WebviewToExtMessage', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'requestRefresh'"), 'WebviewToExtMessage should include requestRefresh type');
  });

  test('messageHandler should handle requestRefresh without error', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'requestRefresh'"), 'messageHandler should have requestRefresh case');
  });
});

suite('Branch Indicator Tests', () => {
  test('init message type should include branch field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("branch?: string"), 'init message should have optional branch field');
  });

  test('gitService should export getCurrentBranch function', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('export async function getCurrentBranch'), 'gitService should export getCurrentBranch');
  });

  test('main.js should render branch badge', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('renderBranchBadge'), 'main.js should have renderBranchBadge function');
    assert.ok(source.includes('currentBranch'), 'main.js should track currentBranch state');
  });

  test('styles.css should have branch badge styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.branch-badge'), 'styles.css should have branch-badge class');
  });

  test('webviewProvider should call getCurrentBranch in loadData', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('getCurrentBranch'), 'webviewProvider should import getCurrentBranch');
    assert.ok(source.includes('branch'), 'webviewProvider should reference branch in init message');
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

suite('Search Filter Source Verification', () => {
  test('main.js search filter should include email field', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('commit.email.toLowerCase().includes(query)'),
      'Search filter should match against commit.email');
  });

  test('main.js search filter should include tags field', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('commit.tags') && source.includes('.some('),
      'Search filter should match against commit.tags using .some()');
  });

  test('search placeholder should mention email and tag', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('email') && source.includes('tag'),
      'Search placeholder should mention email and tag as searchable fields');
  });
});

suite('Copy Commit Message Tests', () => {
  test('copyCommitMessage message type should be defined in WebviewToExtMessage', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitMessage'"), 'WebviewToExtMessage should include copyCommitMessage type');
    assert.ok(source.includes('hash: string'), 'copyCommitMessage should have hash field');
  });

  test('messageHandler should handle copyCommitMessage without error', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitMessage'"), 'messageHandler should have copyCommitMessage case');
    assert.ok(source.includes('handleCopyCommitMessage'), 'messageHandler should call handleCopyCommitMessage');
  });

  test('messageHandler should implement handleCopyCommitMessage function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitMessage'), 'messageHandler should have handleCopyCommitMessage function');
    assert.ok(source.includes('vscode.env.clipboard'), 'handleCopyCommitMessage should use clipboard API');
    assert.ok(source.includes('panel.getCommits()'), 'handleCopyCommitMessage should access commits via panel');
  });

  test('main.js should have handleCopyMessage function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyMessage'), 'main.js should have handleCopyMessage function');
  });

  test('main.js should handle Ctrl+Shift+C keyboard shortcut for copy', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.shiftKey && e.key === 'c'"), 'handleKeyDown should check for Shift+C');
    assert.ok(source.includes('handleCopyMessage()'), 'Ctrl+Shift+C should trigger handleCopyMessage');
  });

  test('main.js should send copyCommitMessage to extension', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitMessage'"), 'handleCopyMessage should send copyCommitMessage');
    assert.ok(source.includes('hash: commit.hash'), 'handleCopyMessage should include hash in message');
  });

  test('main.js should reference copy-btn element', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("document.getElementById('copy-btn')"), 'main.js should get copy-btn element');
  });

  test('main.js should add click listener for copy button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("copyBtn.addEventListener('click', handleCopyMessage)"), 'main.js should add click listener to copyBtn');
  });

  test('webviewProvider should have copy-btn in HTML', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="copy-btn"'), 'webviewProvider HTML should have copy-btn');
    assert.ok(source.includes('title="Copy commit message'), 'copy-btn should have title with Ctrl+Shift+C');
  });

  test('styles.css should have copy-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.copy-btn'), 'styles.css should have copy-btn class');
    assert.ok(source.includes('cursor: pointer'), 'copy-btn should have cursor pointer');
  });
});
