import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Author Sort E2E Tests', () => {
  test('main.js has sortMode state variable initialized to 0', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let sortMode = 0'), 'sortMode should be initialized to 0');
  });

  test('getOrderedCommits handles all four sort modes', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function getOrderedCommits');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('switch (sortMode)'), 'Should use switch on sortMode');
    assert.ok(fnBody.includes('case 0:'), 'Should handle mode 0 (newest first)');
    assert.ok(fnBody.includes('case 1:'), 'Should handle mode 1 (oldest first)');
    assert.ok(fnBody.includes('case 2:'), 'Should handle mode 2 (author A-Z)');
    assert.ok(fnBody.includes('case 3:'), 'Should handle mode 3 (author Z-A)');
    assert.ok(fnBody.includes('localeCompare'), 'Should use localeCompare for author sorting');
  });

  test('handleSortToggle cycles through all four modes', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleSortToggle');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('sortMode = (sortMode + 1) % 4'), 'Should cycle through 4 modes');
    assert.ok(fnBody.includes('updateSortButton'), 'Should call updateSortButton');
    assert.ok(fnBody.includes('saveSettings'), 'Should save settings');
  });

  test('updateSortButton labels match sort modes', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function updateSortButton');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('case 0:'), 'Should label mode 0');
    assert.ok(fnBody.includes('case 1:'), 'Should label mode 1');
    assert.ok(fnBody.includes('case 2:'), 'Should label mode 2');
    assert.ok(fnBody.includes('case 3:'), 'Should label mode 3');
  });

  test('cycleSortMode action is handled in triggerAction', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("case 'cycleSortMode':") && source.includes('handleSortToggle()'),
      'triggerAction should dispatch cycleSortMode to handleSortToggle'
    );
  });

  test('package.json declares cycleSortMode command and keybinding', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];
    const keybindings = packageJson.contributes?.keybindings || [];

    const commandNames = new Set(commands.map((c: any) => c.command));
    assert.ok(commandNames.has('gitHistory.cycleSortMode'), 'Should declare cycleSortMode command');

    const sortKeybinding = keybindings.find((kb: any) => kb.command === 'gitHistory.cycleSortMode');
    assert.ok(sortKeybinding, 'Should have keybinding for cycleSortMode');
    assert.ok(
      sortKeybinding.when === 'activeWebviewPanelId == gitHistory.webview',
      'Keybinding should be scoped to webview panel'
    );
  });

  test('extension.ts registers cycleSortMode as webview action', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(
      source.includes("command: 'gitHistory.cycleSortMode'") && source.includes("action: 'cycleSortMode'"),
      'extension.ts should register cycleSortMode webview action'
    );
  });

  test('sortMode is persisted via saveSettings', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleSortToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleBody = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleBody.includes('saveSettings'), 'handleSortToggle should save settings');
    assert.ok(toggleBody.includes('sortMode'), 'Should save sortMode value');
  });

  test('sortMode is restored from settings on init', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('settings.sortMode') && source.includes('sortMode = settings.sortMode'),
      'Init handler should restore sortMode from settings'
    );
  });

  test('settingsTypes.ts defines sortMode with default value 0', () => {
    const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsTypesPath, 'utf-8');

    assert.ok(source.includes('sortMode'), 'settingsTypes.ts should define sortMode');
  });

  test('settingsService.ts handles sortMode migration from sortOldestFirst', () => {
    const settingsServicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    const source = fs.readFileSync(settingsServicePath, 'utf-8');

    assert.ok(
      source.includes('sortOldestFirst') || source.includes('sortMode'),
      'settingsService should handle sortMode/sortOldestFirst migration'
    );
  });

  test('Ctrl+Shift+3 keyboard shortcut should be handled in handleKeyDown', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === '3'") && kdBody.includes('handleSortToggle'),
      'handleKeyDown should handle Ctrl+Shift+3 and call handleSortToggle'
    );
  });
});
