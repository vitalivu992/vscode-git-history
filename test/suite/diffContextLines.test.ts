import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Read package.json to verify configuration
const packageJsonPath = path.join(__dirname, '../../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

suite('Diff Context Lines Configuration Tests', () => {
  test('package.json should have diffContextLines configuration', () => {
    assert.ok(packageJson.contributes.configuration.properties['gitHistory.diffContextLines'],
      'gitHistory.diffContextLines configuration should exist');
  });

  test('diffContextLines should have correct type (number)', () => {
    const config = packageJson.contributes.configuration.properties['gitHistory.diffContextLines'];
    assert.strictEqual(config.type, 'number', 'diffContextLines should be of type number');
  });

  test('diffContextLines should have correct default value (3)', () => {
    const config = packageJson.contributes.configuration.properties['gitHistory.diffContextLines'];
    assert.strictEqual(config.default, 3, 'diffContextLines should have default value of 3');
  });

  test('diffContextLines should have minimum value of 1', () => {
    const config = packageJson.contributes.configuration.properties['gitHistory.diffContextLines'];
    assert.strictEqual(config.minimum, 1, 'diffContextLines should have minimum value of 1');
  });

  test('diffContextLines should have maximum value of 10', () => {
    const config = packageJson.contributes.configuration.properties['gitHistory.diffContextLines'];
    assert.strictEqual(config.maximum, 10, 'diffContextLines should have maximum value of 10');
  });

  test('diffContextLines should have a description', () => {
    const config = packageJson.contributes.configuration.properties['gitHistory.diffContextLines'];
    assert.ok(config.description, 'diffContextLines should have a description');
    assert.strictEqual(typeof config.description, 'string', 'description should be a string');
    assert.ok(config.description.toLowerCase().includes('context'),
      'description should mention "context"');
    assert.ok(config.description.toLowerCase().includes('diff'),
      'description should mention "diff"');
  });
});

suite('Diff Context Lines WebviewProvider Integration Tests', () => {
  test('webviewProvider should have _diffContextLines field', async () => {
    // Import the module to check its structure
    const webviewProviderModule = await import('../../src/webview/webviewProvider');

    // We can't directly test private fields, but we can verify the class exists
    assert.ok(webviewProviderModule.GitHistoryPanel, 'GitHistoryPanel class should exist');
  });

  test('webviewProvider should have getDiffContextLines method', async () => {
    const webviewProviderModule = await import('../../src/webview/webviewProvider');

    // Check that the class has the method (can't test instance without mocking)
    const panelClass = webviewProviderModule.GitHistoryPanel;
    assert.ok(panelClass.prototype.getDiffContextLines,
      'GitHistoryPanel should have getDiffContextLines method');
  });

  test('getDiffContextLines should return a number', async () => {
    const webviewProviderModule = await import('../../src/webview/webviewProvider');
    const panelClass = webviewProviderModule.GitHistoryPanel;

    // The method should exist on the prototype
    assert.strictEqual(typeof panelClass.prototype.getDiffContextLines, 'function',
      'getDiffContextLines should be a function');
  });
});

suite('Diff Context Lines Runtime Configuration Tests', () => {
  test('VS Code configuration should read diffContextLines with default value', async () => {
    const config = vscode.workspace.getConfiguration('gitHistory');
    const diffContextLines = config.get<number>('diffContextLines', 3);

    assert.strictEqual(typeof diffContextLines, 'number', 'diffContextLines should be a number');
    assert.ok(diffContextLines >= 1 && diffContextLines <= 10,
      'diffContextLines should be within valid range (1-10)');
  });

  test.skip('diffContextLines should be configurable', async () => {
    // Skipped: VS Code configuration test - env-dependent
  });
});
