import * as assert from 'assert';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today ${formatTime(date)}`;
  } else if (diffDays === 1) {
    return `Yesterday ${formatTime(date)}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

suite('Date Formatting Tests', () => {
  test('today shows Today with time', () => {
    const now = new Date();
    const todayIso = now.toISOString();
    const result = formatDate(todayIso);
    assert.ok(result.startsWith('Today '), `Expected "${result}" to start with "Today "`);
    assert.ok(result.includes(':'), `Expected "${result}" to contain time separator`);
  });

  test('yesterday shows Yesterday with time', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString();
    const result = formatDate(yesterdayIso);
    assert.ok(result.startsWith('Yesterday '), `Expected "${result}" to start with "Yesterday "`);
    assert.ok(result.includes(':'), `Expected "${result}" to contain time separator`);
  });

  test('three days ago shows days ago', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoIso = threeDaysAgo.toISOString();
    const result = formatDate(threeDaysAgoIso);
    assert.strictEqual(result, '3 days ago');
  });

  test('six days ago shows days ago', () => {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const sixDaysAgoIso = sixDaysAgo.toISOString();
    const result = formatDate(sixDaysAgoIso);
    assert.strictEqual(result, '6 days ago');
  });

  test('older than a week shows weeks ago or date', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const oldDateIso = oldDate.toISOString();
    const result = formatDate(oldDateIso);
    assert.ok(!result.includes('Today'), `Expected "${result}" to not include "Today"`);
    assert.ok(!result.includes('Yesterday'), `Expected "${result}" to not include "Yesterday"`);
  });

  test('time format includes hour and minute', () => {
    const now = new Date();
    const time = formatTime(now);
    const parts = time.split(':');
    assert.strictEqual(parts.length, 2, `Expected time "${time}" to have 2 parts separated by :`);
  });
});

suite('Commit List Date Format Setting', () => {
  // Mirrors formatDate() in src/webview/panel/main.js, which consults the
  // commitListDateFormat state set from gitHistory.commitList.dateFormat.
  function formatDateWithFormat(isoString: string, format: string): string {
    const date = new Date(isoString);

    if (format === 'iso') {
      return date.toISOString().substring(0, 10);
    }
    if (format === 'short') {
      return date.toLocaleDateString();
    }

    return formatDate(isoString);
  }

  test('iso format shows YYYY-MM-DD', () => {
    const iso = '2026-08-21T10:30:00.000Z';
    const result = formatDateWithFormat(iso, 'iso');
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/, `Expected "${result}" to be a YYYY-MM-DD date`);
  });

  test('short format shows locale date', () => {
    const iso = '2026-08-21T10:30:00.000Z';
    const result = formatDateWithFormat(iso, 'short');
    assert.strictEqual(result, new Date(iso).toLocaleDateString());
  });

  test('relative format keeps default behavior', () => {
    const nowIso = new Date().toISOString();
    const result = formatDateWithFormat(nowIso, 'relative');
    assert.ok(result.startsWith('Today '), `Expected "${result}" to start with "Today "`);
  });

  test('main.js formatDate should honor commitListDateFormat', () => {
    const mainJsPath = require('path').resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = require('fs').readFileSync(mainJsPath, 'utf-8');

    const formatDateSection = source.substring(
      source.indexOf('function formatDate(isoString)'),
      source.indexOf('function formatTime(date)')
    );
    assert.ok(formatDateSection.length > 0, 'formatDate should exist in main.js');
    assert.ok(
      formatDateSection.includes("commitListDateFormat === 'iso'"),
      'formatDate should support the iso format'
    );
    assert.ok(
      formatDateSection.includes("commitListDateFormat === 'short'"),
      'formatDate should support the short format'
    );
  });

  test('package.json should define gitHistory.commitList.dateFormat', () => {
    const pkgPath = require('path').resolve(__dirname, '../../../package.json');
    const pkg = JSON.parse(require('fs').readFileSync(pkgPath, 'utf-8'));

    const prop = pkg.contributes.configuration.properties['gitHistory.commitList.dateFormat'];
    assert.ok(prop, 'gitHistory.commitList.dateFormat should be contributed');
    assert.strictEqual(prop.default, 'relative');
    assert.deepStrictEqual(prop.enum, ['relative', 'short', 'iso']);
  });

  test('webviewProvider should pass commitListDateFormat in the init message', () => {
    const providerPath = require('path').resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = require('fs').readFileSync(providerPath, 'utf-8');

    assert.ok(
      source.includes("get<string>('commitList.dateFormat', 'relative')"),
      'webviewProvider should read the commitList.dateFormat config'
    );
    assert.ok(
      /type: 'init'[^;]*commitListDateFormat/.test(source),
      'init message should carry commitListDateFormat'
    );
  });
});

suite('Date Formatting Source Verification', () => {
  test('main.js should define formatDate with time for Today', () => {
    const mainJsPath = require('path').resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = require('fs').readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("return `Today ${formatTime"),
      'main.js should return Today with time'
    );
  });

  test('main.js should define formatDate with time for Yesterday', () => {
    const mainJsPath = require('path').resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = require('fs').readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("return `Yesterday ${formatTime"),
      'main.js should return Yesterday with time'
    );
  });
});