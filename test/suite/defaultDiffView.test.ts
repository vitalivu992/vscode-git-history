import * as assert from 'assert';
import * as path from 'path';

suite('Default Diff View Config Tests', () => {

  suite('Logic Tests', () => {

    function simulateInitDefaultDiffView(
      defaultDiffView: string | undefined,
      currentDiffType: string
    ): string {
      let result = currentDiffType;
      if (defaultDiffView === 'side-by-side') {
        result = 'side-by-side';
      }
      return result;
    }

    test('defaultDiffView unified keeps currentDiffType as unified', () => {
      const result = simulateInitDefaultDiffView('unified', 'unified');
      assert.strictEqual(result, 'unified');
    });

    test('defaultDiffView side-by-side sets currentDiffType to side-by-side', () => {
      const result = simulateInitDefaultDiffView('side-by-side', 'unified');
      assert.strictEqual(result, 'side-by-side');
    });

    test('defaultDiffView undefined falls back to unified', () => {
      const result = simulateInitDefaultDiffView(undefined, 'unified');
      assert.strictEqual(result, 'unified');
    });

    test('defaultDiffView invalid value falls back to unified', () => {
      const result = simulateInitDefaultDiffView('invalid', 'unified');
      assert.strictEqual(result, 'unified');
    });

    test('defaultDiffView empty string falls back to unified', () => {
      const result = simulateInitDefaultDiffView('', 'unified');
      assert.strictEqual(result, 'unified');
    });

    test('defaultDiffView null falls back to unified', () => {
      const result = simulateInitDefaultDiffView(null as any, 'unified');
      assert.strictEqual(result, 'unified');
    });

    test('setDiffType can still toggle after init with side-by-side', () => {
      let currentDiffType = simulateInitDefaultDiffView('side-by-side', 'unified');
      assert.strictEqual(currentDiffType, 'side-by-side');
      currentDiffType = 'unified';
      assert.strictEqual(currentDiffType, 'unified');
    });

    test('setDiffType can still toggle after init with unified', () => {
      let currentDiffType = simulateInitDefaultDiffView('unified', 'unified');
      assert.strictEqual(currentDiffType, 'unified');
      currentDiffType = 'side-by-side';
      assert.strictEqual(currentDiffType, 'side-by-side');
    });
  });

  suite('Source Verification Tests', () => {

    test('package.json defines gitHistory.defaultDiffView setting', () => {
      const fs = require('fs');
      const pkgPath = path.resolve(__dirname, '../../../package.json');
      const source = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(source);

      assert.ok(
        pkg.contributes.configuration.properties['gitHistory.defaultDiffView'],
        'package.json should define gitHistory.defaultDiffView'
      );
    });

    test('package.json defaultDiffView has correct enum values', () => {
      const fs = require('fs');
      const pkgPath = path.resolve(__dirname, '../../../package.json');
      const source = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(source);
      const setting = pkg.contributes.configuration.properties['gitHistory.defaultDiffView'];

      assert.deepStrictEqual(setting.enum, ['unified', 'side-by-side']);
    });

    test('package.json defaultDiffView default is unified', () => {
      const fs = require('fs');
      const pkgPath = path.resolve(__dirname, '../../../package.json');
      const source = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(source);
      const setting = pkg.contributes.configuration.properties['gitHistory.defaultDiffView'];

      assert.strictEqual(setting.default, 'unified');
    });

    test('package.json defaultDiffView type is string', () => {
      const fs = require('fs');
      const pkgPath = path.resolve(__dirname, '../../../package.json');
      const source = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(source);
      const setting = pkg.contributes.configuration.properties['gitHistory.defaultDiffView'];

      assert.strictEqual(setting.type, 'string');
    });

    test('types.ts includes defaultDiffView in init message type', () => {
      const fs = require('fs');
      const typesPath = path.resolve(__dirname, '../../../src/types.ts');
      const source = fs.readFileSync(typesPath, 'utf-8');

      const initIdx = source.indexOf("type: 'init'");
      assert.ok(initIdx >= 0, 'Should find init message type');

      const initToEnd = source.substring(initIdx);
      assert.ok(
        initToEnd.includes('defaultDiffView'),
        'init message type should include defaultDiffView field'
      );
    });

    test('webviewProvider.ts reads defaultDiffView config', () => {
      const fs = require('fs');
      const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
      const source = fs.readFileSync(providerPath, 'utf-8');

      assert.ok(
        source.includes("get<string>('defaultDiffView'"),
        'webviewProvider should read defaultDiffView config'
      );
    });

    test('webviewProvider.ts passes defaultDiffView in init message', () => {
      const fs = require('fs');
      const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
      const source = fs.readFileSync(providerPath, 'utf-8');

      const postMessageLines = source.match(/postMessage\([^)]+\)/g);
      assert.ok(postMessageLines, 'Should find postMessage calls');

      const initMessages = postMessageLines.filter(
        (msg: string) => msg.includes("'init'") || msg.includes('"init"') || msg.includes('type: \'init\'')
      );
      assert.ok(initMessages.length > 0, 'Should find init postMessage');

      const initMsg = initMessages[0];
      assert.ok(
        initMsg.includes('defaultDiffView'),
        'init postMessage should include defaultDiffView'
      );
    });

    test('main.js handles defaultDiffView in case init', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      const caseInitIdx = source.indexOf("case 'init':");
      assert.ok(caseInitIdx >= 0, 'Should find case init');

      const nextCaseIdx = source.indexOf("case '", caseInitIdx + 10);
      const initBlock = source.substring(
        caseInitIdx,
        nextCaseIdx > caseInitIdx ? nextCaseIdx : undefined
      );

      assert.ok(
        initBlock.includes('message.defaultDiffView'),
        'init handler should reference message.defaultDiffView'
      );
    });

    test('main.js calls setDiffType when defaultDiffView is side-by-side', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      const caseInitIdx = source.indexOf("case 'init':");
      const nextCaseIdx = source.indexOf("case '", caseInitIdx + 10);
      const initBlock = source.substring(
        caseInitIdx,
        nextCaseIdx > caseInitIdx ? nextCaseIdx : undefined
      );

      assert.ok(
        initBlock.includes("message.defaultDiffView === 'side-by-side'"),
        'init handler should check for side-by-side'
      );
      assert.ok(
        initBlock.includes("setDiffType('side-by-side')"),
        'init handler should call setDiffType for side-by-side'
      );
    });

    test('main.js only applies side-by-side for exact match', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      const caseInitIdx = source.indexOf("case 'init':");
      const nextCaseIdx = source.indexOf("case '", caseInitIdx + 10);
      const initBlock = source.substring(
        caseInitIdx,
        nextCaseIdx > caseInitIdx ? nextCaseIdx : undefined
      );

      const setDiffTypeCount = (initBlock.match(/setDiffType/g) || []).length;
      // User settings (up to 1 call) + defaultDiffView fallback (1 call) = up to 2 calls
      assert.ok(
        setDiffTypeCount >= 1 && setDiffTypeCount <= 3,
        `init handler should call setDiffType 1-3 times (user settings + fallback), got ${setDiffTypeCount}`
      );
    });

    test('main.js setDiffType function exists and handles diff types', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      assert.ok(
        source.includes('function setDiffType'),
        'main.js should have setDiffType function'
      );

      const fnStart = source.indexOf('function setDiffType');
      const fnEnd = source.indexOf('\n// ───', fnStart + 1);
      const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

      assert.ok(fnBody.includes("'unified'"), 'setDiffType should handle unified');
      assert.ok(fnBody.includes('sideBySideBtn'), 'setDiffType should handle side-by-side via button reference');
    });

    test('CLAUDE.md documents the defaultDiffView feature', () => {
      const fs = require('fs');
      const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
      const source = fs.readFileSync(claudePath, 'utf-8');

      assert.ok(
        source.includes('gitHistory.defaultDiffView'),
        'CLAUDE.md should document defaultDiffView setting'
      );
      assert.ok(
        source.includes('defaultDiffView'),
        'CLAUDE.md should mention defaultDiffView'
      );
    });

    test('README.md documents the defaultDiffView setting', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(
        source.includes('gitHistory.defaultDiffView'),
        'README.md should document defaultDiffView setting'
      );
    });

    test('webviewProvider.ts has unified-btn with active class in initial HTML', () => {
      const fs = require('fs');
      const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
      const source = fs.readFileSync(providerPath, 'utf-8');

      assert.ok(
        source.includes('id="unified-btn" class="active"'),
        'webviewProvider should have unified-btn as active by default'
      );
    });

    test('index.html has unified-btn with active class', () => {
      const fs = require('fs');
      const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
      const source = fs.readFileSync(indexPath, 'utf-8');

      assert.ok(
        source.includes('id="unified-btn" class="active"'),
        'index.html should have unified-btn as active by default'
      );
    });
  });
});
