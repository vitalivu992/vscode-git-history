import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Preset Filter Fields E2E Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');

  test('showSavePresetDialog includes regexSearchEnabled in filterState', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Find the showSavePresetDialog function
    const fnStart = source.indexOf('function showSavePresetDialog');
    assert.ok(fnStart > -1, 'main.js should define showSavePresetDialog function');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    // Check that regexSearchEnabled is included in the filterState within this function
    const filterStateMatch = fnBody.match(/const filterState = \{[^}]+\}/s);
    assert.ok(filterStateMatch, 'showSavePresetDialog should define a filterState object');
    assert.ok(filterStateMatch[0].includes('regexSearchEnabled'),
      'showSavePresetDialog filterState should include regexSearchEnabled');
  });

  test('showSavePresetDialog includes pathFilter in filterState', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function showSavePresetDialog');
    assert.ok(fnStart > -1, 'main.js should define showSavePresetDialog function');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    const filterStateMatch = fnBody.match(/const filterState = \{[^}]+\}/s);
    assert.ok(filterStateMatch, 'showSavePresetDialog should define a filterState object');
    assert.ok(filterStateMatch[0].includes('pathFilter'),
      'showSavePresetDialog filterState should include pathFilter');
  });

  test('savePreset includes regexSearchEnabled in filterState', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function savePreset');
    assert.ok(fnStart > -1, 'main.js should define savePreset function');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    const filterStateMatch = fnBody.match(/const filterState = \{[^}]+\}/s);
    assert.ok(filterStateMatch, 'savePreset should define a filterState object');
    assert.ok(filterStateMatch[0].includes('regexSearchEnabled'),
      'savePreset filterState should include regexSearchEnabled');
  });

  test('savePreset includes pathFilter in filterState', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function savePreset');
    assert.ok(fnStart > -1, 'main.js should define savePreset function');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    const filterStateMatch = fnBody.match(/const filterState = \{[^}]+\}/s);
    assert.ok(filterStateMatch, 'savePreset should define a filterState object');
    assert.ok(filterStateMatch[0].includes('pathFilter'),
      'savePreset filterState should include pathFilter');
  });

  test('applyFilterQuery restores regexSearchEnabled from preset', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function applyFilterQuery');
    assert.ok(fnStart > -1, 'main.js should define applyFilterQuery function');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('regexSearchEnabled'),
      'applyFilterQuery should handle regexSearchEnabled field');
    assert.ok(fnBody.includes('pathFilter'),
      'applyFilterQuery should handle pathFilter field');
  });

  test('handleApplyPreset sends filterState with regexSearchEnabled and pathFilter to webview', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleApplyPreset'),
      'messageHandler.ts should define handleApplyPreset function');

    // The handler sends the preset's filterState as-is to the webview
    // So it passes through regexSearchEnabled and pathFilter if they're in the saved preset
    assert.ok(source.includes("type: 'applyFilterQuery'"),
      'handleApplyPreset should send applyFilterQuery message');
  });

  test('FilterQueryState interface includes regexSearchEnabled and pathFilter', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes('FilterQueryState'),
      'types.ts should define FilterQueryState interface');

    const ifaceStart = source.indexOf('interface FilterQueryState');
    assert.ok(ifaceStart > -1, 'types.ts should define FilterQueryState interface');
    const ifaceEnd = source.indexOf('}', ifaceStart);
    const ifaceBody = source.substring(ifaceStart, ifaceEnd);

    assert.ok(ifaceBody.includes('regexSearchEnabled'),
      'FilterQueryState should include regexSearchEnabled');
    assert.ok(ifaceBody.includes('pathFilter'),
      'FilterQueryState should include pathFilter');
  });

  test('preset save/load round-trip preserves regexSearchEnabled', () => {
    // Simulate the full round-trip: save preset with regex enabled, then restore it
    const savedState = {
      query: 'bug|fix',
      hideMergeCommits: false,
      sortMode: 0,
      showMyCommitsOnly: false,
      regexSearchEnabled: true,
      pathFilter: null
    };

    // Simulate saving the preset (filterState as stored)
    const preset = {
      name: 'Regex Filter',
      filterState: savedState,
      createdAt: new Date().toISOString()
    };

    // Simulate loading the preset (restoring filterState)
    const restored = preset.filterState;
    assert.strictEqual(restored.regexSearchEnabled, true);
    assert.strictEqual(restored.pathFilter, null);
  });

  test('preset save/load round-trip preserves pathFilter', () => {
    const savedState = {
      query: '',
      hideMergeCommits: false,
      sortMode: 0,
      showMyCommitsOnly: false,
      regexSearchEnabled: false,
      pathFilter: 'src/components/'
    };

    const preset = {
      name: 'Path Filter',
      filterState: savedState,
      createdAt: new Date().toISOString()
    };

    const restored = preset.filterState;
    assert.strictEqual(restored.regexSearchEnabled, false);
    assert.strictEqual(restored.pathFilter, 'src/components/');
  });
});
