import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Export PR Description E2E Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');

  let mainJsSource: string;
  let messageHandlerSource: string;

  suiteSetup(() => {
    mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');
    messageHandlerSource = fs.readFileSync(messageHandlerPath, 'utf-8');
  });

  suite('PR Description export in main.js', () => {
    test('export dialog has PR Description button', () => {
      assert.ok(
        mainJsSource.includes('data-format="prdescription"'),
        'main.js export dialog should have a button with data-format="prdescription"'
      );
    });

    test('PR Description button has correct label and icon', () => {
      assert.ok(
        mainJsSource.includes('PR Description'),
        'main.js should have "PR Description" label for the export option'
      );
      assert.ok(
        mainJsSource.includes('export-option-label'),
        'main.js should have export-option-label span for PR Description'
      );
    });

    test('PR Description button sends correct message format', () => {
      // The button click should send 'exportCommits' with format='prdescription'
      assert.ok(
        mainJsSource.match(/type:\s*['"]exportCommits['"].*format[,)]/s),
        'main.js should send exportCommits message'
      );
    });
  });

  suite('PR Description formatter in messageHandler.ts', () => {
    test('formatCommitsAsPrDescription function is exported', () => {
      assert.ok(
        messageHandlerSource.includes('export function formatCommitsAsPrDescription'),
        'messageHandler.ts should export formatCommitsAsPrDescription function'
      );
    });

    test('handleExportCommits accepts prdescription format', () => {
      const match = messageHandlerSource.match(/handleExportCommits\s*\([^)]*\)/);
      assert.ok(match, 'handleExportCommits should be found');
      assert.ok(
        match[0].includes("'prdescription'"),
        'handleExportCommits signature should include prdescription format'
      );
    });

    test('formatter generates Summary section', () => {
      assert.ok(
        messageHandlerSource.includes('## Summary'),
        'formatCommitsAsPrDescription should generate Summary section'
      );
    });

    test('formatter generates Changes section with checklist', () => {
      assert.ok(
        messageHandlerSource.includes('## Changes'),
        'formatCommitsAsPrDescription should generate Changes section'
      );
      assert.ok(
        messageHandlerSource.includes('`${commit.shortHash}`'),
        'Changes section should use backtick format for hashes'
      );
    });

    test('formatter generates Statistics section', () => {
      assert.ok(
        messageHandlerSource.includes('## Statistics'),
        'formatCommitsAsPrDescription should generate Statistics section'
      );
    });

    test('formatter generates Commits detail section', () => {
      assert.ok(
        messageHandlerSource.includes('## Commits'),
        'formatCommitsAsPrDescription should generate Commits section'
      );
      assert.ok(
        messageHandlerSource.includes('### ${commit.message}'),
        'Commits section should use ### heading format'
      );
    });

    test('handleExportCommits calls formatCommitsAsPrDescription for prdescription format', () => {
      assert.ok(
        messageHandlerSource.includes('formatCommitsAsPrDescription(commits)'),
        'handleExportCommits should call formatCommitsAsPrDescription when format is prdescription'
      );
    });

    test('handleExportCommits uses Markdown filter for prdescription format', () => {
      assert.ok(
        messageHandlerSource.includes("filters = { 'Markdown': ['md'] }"),
        'handleExportCommits should use Markdown filter for prdescription format'
      );
    });
  });
});