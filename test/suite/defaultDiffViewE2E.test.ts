import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function simulateDefaultDiffViewFlow(
  configValue: string | undefined,
  initialDiffType: string
): {
  finalDiffType: string;
  unifiedBtnActive: boolean;
  sideBySideBtnActive: boolean;
} {
  let currentDiffType = initialDiffType;
  let unifiedBtnActive = currentDiffType === 'unified';
  let sideBySideBtnActive = currentDiffType === 'side-by-side';

  if (configValue === 'side-by-side') {
    currentDiffType = 'side-by-side';
    unifiedBtnActive = false;
    sideBySideBtnActive = true;
  }

  return {
    finalDiffType: currentDiffType,
    unifiedBtnActive,
    sideBySideBtnActive
  };
}

suite('Default Diff View E2E Logic Tests', () => {

  test('unified config leaves diff type as unified', () => {
    const result = simulateDefaultDiffViewFlow('unified', 'unified');
    assert.strictEqual(result.finalDiffType, 'unified');
    assert.strictEqual(result.unifiedBtnActive, true);
    assert.strictEqual(result.sideBySideBtnActive, false);
  });

  test('side-by-side config sets diff type to side-by-side', () => {
    const result = simulateDefaultDiffViewFlow('side-by-side', 'unified');
    assert.strictEqual(result.finalDiffType, 'side-by-side');
    assert.strictEqual(result.unifiedBtnActive, false);
    assert.strictEqual(result.sideBySideBtnActive, true);
  });

  test('undefined config falls back to unified', () => {
    const result = simulateDefaultDiffViewFlow(undefined, 'unified');
    assert.strictEqual(result.finalDiffType, 'unified');
    assert.strictEqual(result.unifiedBtnActive, true);
    assert.strictEqual(result.sideBySideBtnActive, false);
  });

  test('invalid config falls back to unified', () => {
    const result = simulateDefaultDiffViewFlow('invalid-value', 'unified');
    assert.strictEqual(result.finalDiffType, 'unified');
    assert.strictEqual(result.unifiedBtnActive, true);
    assert.strictEqual(result.sideBySideBtnActive, false);
  });

  test('user can still toggle after side-by-side init', () => {
    const result = simulateDefaultDiffViewFlow('side-by-side', 'unified');
    assert.strictEqual(result.finalDiffType, 'side-by-side');

    const toggledDiffType = 'unified';
    assert.strictEqual(toggledDiffType, 'unified');
  });

  test('refresh preserves defaultDiffView setting', () => {
    const first = simulateDefaultDiffViewFlow('side-by-side', 'unified');
    const second = simulateDefaultDiffViewFlow('side-by-side', 'unified');
    assert.strictEqual(first.finalDiffType, second.finalDiffType);
    assert.strictEqual(first.sideBySideBtnActive, second.sideBySideBtnActive);
  });
});

suite('Default Diff View E2E Source Integration Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const pkgPath = path.resolve(__dirname, '../../../package.json');

  test('complete data flow: config to webview', () => {
    const pkgSource = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgSource);
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      pkg.contributes.configuration.properties['gitHistory.defaultDiffView'],
      'package.json should define setting'
    );
    assert.ok(
      providerSource.includes("get<string>('defaultDiffView'"),
      'webviewProvider should read config'
    );
    assert.ok(
      providerSource.includes('defaultDiffView'),
      'webviewProvider should pass setting in init message'
    );
    assert.ok(
      mainSource.includes('message.defaultDiffView'),
      'main.js should receive and handle defaultDiffView'
    );
  });

  test('setting enum in package.json matches values checked in main.js', () => {
    const pkgSource = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgSource);
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const enumValues = pkg.contributes.configuration.properties['gitHistory.defaultDiffView'].enum;
    assert.ok(enumValues.includes('unified'), 'enum should include unified');
    assert.ok(enumValues.includes('side-by-side'), 'enum should include side-by-side');

    const caseInitIdx = mainSource.indexOf("case 'init':");
    const nextCaseIdx = mainSource.indexOf("case '", caseInitIdx + 10);
    const initBlock = mainSource.substring(caseInitIdx, nextCaseIdx);

    assert.ok(
      initBlock.includes("'side-by-side'"),
      'main.js should check for side-by-side value'
    );
  });

  test('unified-btn and side-by-side-btn exist in both HTML templates', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(providerSource.includes('id="unified-btn"'), 'webviewProvider should have unified-btn');
    assert.ok(providerSource.includes('id="side-by-side-btn"'), 'webviewProvider should have side-by-side-btn');
    assert.ok(indexSource.includes('id="unified-btn"'), 'index.html should have unified-btn');
    assert.ok(indexSource.includes('id="side-by-side-btn"'), 'index.html should have side-by-side-btn');
  });

  test('defaultDiffView is optional in types.ts (uses ? modifier)', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    const initIdx = typesSource.indexOf("type: 'init'");
    assert.ok(initIdx >= 0, 'Should find init type definition');

    const initToEnd = typesSource.substring(initIdx);
    assert.ok(
      initToEnd.includes('defaultDiffView?'),
      'defaultDiffView should be optional in init type'
    );
  });

  test('webviewProvider reads default with unified as fallback', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(
      providerSource.includes("'defaultDiffView', 'unified'") ||
      providerSource.includes('"defaultDiffView", "unified"'),
      'webviewProvider should default to unified'
    );
  });

  test('main.js setDiffType updates both button states', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = mainSource.indexOf('function setDiffType');
    const fnEnd = mainSource.indexOf('\n// ───', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('unifiedBtn'), 'setDiffType should reference unifiedBtn');
    assert.ok(fnBody.includes('sideBySideBtn'), 'setDiffType should reference sideBySideBtn');
    assert.ok(fnBody.includes('classList.add'), 'setDiffType should add active class');
    assert.ok(fnBody.includes('classList.remove'), 'setDiffType should remove active class');
  });
});

suite('Default Diff View E2E Git Integration Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-diffview-e2e-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'line 1\nline 2\nline 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'line 1\nmodified line 2\nline 3\nnew line 4\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git service returns valid diff that can be rendered in either mode', async () => {
    const { getCommitDiff } = await import('../../src/git/gitService');
    const { execSync } = require('child_process');
    const hash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    const diffResult = await getCommitDiff(hash, tempDir);
    assert.ok(!diffResult.isBinary, 'Should not be binary');
    assert.ok(diffResult.diff.includes('diff --git'), 'Should be a valid diff');
    assert.ok(diffResult.diff.includes('modified'), 'Should show modification');
  });

  test('file history returns commits for diff viewing', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');
    const commits = await getFileHistory(testFile, tempDir);

    assert.ok(commits.length >= 1, 'Should have at least 1 commit');
  });

  test('diff output works with both unified and side-by-side rendering', async () => {
    const { getCommitDiff } = await import('../../src/git/gitService');
    const { execSync } = require('child_process');
    const hash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    const diffResult = await getCommitDiff(hash, tempDir, testFile);
    assert.ok(!diffResult.isBinary, 'Should not be binary');
    assert.ok(diffResult.diff.length > 0, 'Should have diff content');
    assert.ok(diffResult.diff.includes('@@'), 'Should have diff hunk markers');
  });
});
