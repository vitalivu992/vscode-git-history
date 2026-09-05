import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// Re-implementation of extractTrailers in messageHandler.ts (house style:
// mirror the webview/extension logic here and source-verify the original).
function extractTrailers(fullMessage: string): string {
  const lines = fullMessage.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  if (!lines.length) {
    return '';
  }
  let start = lines.length - 1;
  while (start > 0 && lines[start - 1].trim() !== '') {
    start--;
  }
  const trailers: string[] = [];
  for (const line of lines.slice(start)) {
    if (/^\s+/.test(line) && trailers.length) {
      trailers[trailers.length - 1] += '\n' + line;
    } else if (/^[A-Za-z0-9-]+:\s+.+$/.test(line)) {
      trailers.push(line);
    } else {
      return '';
    }
  }
  return trailers.join('\n');
}

suite('Copy Trailers Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const usagePath = path.resolve(__dirname, '../../../USAGE.md');

  test('messageHandler.ts should export extractTrailers (source verification)', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('export function extractTrailers'),
      'messageHandler.ts should export extractTrailers');
  });

  test('extractTrailers returns the Signed-off-by block', () => {
    const message = 'Fix bug\n\nLonger explanation of the fix.\n\nSigned-off-by: Alice <alice@example.com>\nReviewed-by: Bob <bob@example.com>';
    assert.strictEqual(
      extractTrailers(message),
      'Signed-off-by: Alice <alice@example.com>\nReviewed-by: Bob <bob@example.com>'
    );
  });

  test('extractTrailers keeps folded continuation lines', () => {
    const message = 'Add config\n\nSigned-off-by: Alice <alice@example.com>\n  with a folded continuation';
    assert.strictEqual(
      extractTrailers(message),
      'Signed-off-by: Alice <alice@example.com>\n  with a folded continuation'
    );
  });

  test('extractTrailers returns empty when the last paragraph is prose', () => {
    const message = 'Fix bug\n\nThis paragraph is plain prose and not a trailer block.';
    assert.strictEqual(extractTrailers(message), '');
  });

  test('extractTrailers does not treat the subject line as a trailer', () => {
    // "fix: bug" looks like Token: value but sits in the first paragraph
    const message = 'fix: bug\n\nSigned-off-by: Alice <alice@example.com>';
    assert.strictEqual(extractTrailers(message), 'Signed-off-by: Alice <alice@example.com>');
  });

  test('extractTrailers handles messages without a body', () => {
    assert.strictEqual(extractTrailers('just a subject'), '');
    assert.strictEqual(extractTrailers(''), '');
  });

  test('types.ts should have copyTrailers in WebviewAction and WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyTrailers'"),
      'types.ts should have copyTrailers message type');
  });

  test('messageHandler.ts should handle copyTrailers case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyTrailers':"),
      'messageHandler.ts should handle copyTrailers case');
    assert.ok(source.includes('function handleCopyTrailers'),
      'messageHandler.ts should have handleCopyTrailers function');
  });

  test('handleCopyTrailers should write trailers to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyTrailers');
    assert.ok(fnStart >= 0, 'handleCopyTrailers function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyTrailers should write to clipboard');
    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyTrailers should handle commit not found');
    assert.ok(fnBody.includes('Commit has no trailers'),
      'handleCopyTrailers should report when there are no trailers');
  });

  test('main.js should have handleCopyTrailers function and message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyTrailers'),
      'main.js should have handleCopyTrailers function');
    assert.ok(source.includes("type: 'copyTrailers'"),
      'main.js should send copyTrailers message');
  });

  test('main.js should handle Ctrl+Shift+Alt+3 keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const sortHandler = source.indexOf("e.key === '3'");
    const trailersHandler = source.indexOf('handleCopyTrailers()');
    assert.ok(sortHandler >= 0 && trailersHandler >= 0,
      'main.js should handle the 3 key and call handleCopyTrailers');
    // The alt+3 trailers handler must fire before the plain ctrl+shift+3
    // sort handler, otherwise the sort case swallows the chord.
    const kdStart = source.indexOf('function handleKeyDown');
    const sortHandlerPos = source.indexOf("e.key === '3'", kdStart);
    const altThreePos = source.indexOf("e.shiftKey && e.altKey && e.key === '3'", kdStart);
    assert.ok(altThreePos >= 0 && altThreePos < sortHandlerPos,
      'Ctrl+Shift+Alt+3 handler must precede the Ctrl+Shift+3 sort handler');
  });

  test('main.js triggerAction should dispatch copyTrailers', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyTrailers': handleCopyTrailers()"),
      'main.js triggerAction should dispatch copyTrailers');
  });

  test('main.js should have context menu item for copy-trailers', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-trailers'),
      'main.js should have context menu item for copy-trailers');
  });

  test('package.json should register copyTrailers command and keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const command = json.contributes.commands.find((c: any) => c.command === 'gitHistory.copyTrailers');
    assert.ok(command, 'Should declare gitHistory.copyTrailers command');
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyTrailers'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyTrailers');
    assert.strictEqual(binding.key, 'ctrl+shift+alt+3');
    assert.strictEqual(binding.mac, 'cmd+shift+alt+3');
    assert.strictEqual(binding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('extension.ts should register copyTrailers webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyTrailers'"),
      'extension.ts should register copyTrailers webview action');
  });

  test('CLAUDE.md should document Copy Trailers feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Trailers'),
      'CLAUDE.md should document Copy Trailers feature');
  });

  test('USAGE.md should document the copy trailers shortcut', () => {
    const source = fs.readFileSync(usagePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+3') && source.toLowerCase().includes('trailer'),
      'USAGE.md should document Ctrl+Shift+Alt+3 copy trailers');
  });
});
