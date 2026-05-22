import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simulate the toggle stats behavior
 */
function simulateToggleStats(
  initialState: boolean,
  toggleBtnExists: boolean
): { newState: boolean; buttonClasses: string[]; buttonTitle: string; headerDisplay: string } {
  let showStats = initialState;
  const buttonClasses: string[] = initialState ? ['active'] : [];

  if (toggleBtnExists) {
    showStats = !showStats;

    if (showStats) {
      buttonClasses.push('active');
    } else {
      const activeIdx = buttonClasses.indexOf('active');
      if (activeIdx >= 0) buttonClasses.splice(activeIdx, 1);
    }
  }

  const buttonTitle = showStats
    ? 'Stats visible (click to hide)'
    : 'Show stats column';

  const headerDisplay = showStats ? '' : 'none';

  return { newState: showStats, buttonClasses, buttonTitle, headerDisplay };
}

suite('Toggle Stats E2E Logic Tests', () => {
  test('toggle from enabled to disabled removes active class', () => {
    const result = simulateToggleStats(true, true);
    assert.strictEqual(result.newState, false);
    assert.ok(!result.buttonClasses.includes('active'), 'Should not have active class on button');
    assert.ok(result.buttonTitle.includes('Show stats'), 'Title should indicate show action');
    assert.strictEqual(result.headerDisplay, 'none', 'Header should be hidden');
  });

  test('toggle from disabled to enabled adds active class', () => {
    const result = simulateToggleStats(false, true);
    assert.strictEqual(result.newState, true);
    assert.ok(result.buttonClasses.includes('active'), 'Should add active class to button');
    assert.ok(result.buttonTitle.includes('visible'), 'Title should indicate stats are visible');
    assert.strictEqual(result.headerDisplay, '', 'Header should be visible');
  });

  test('toggling twice returns to initial state', () => {
    const first = simulateToggleStats(true, true);
    const second = simulateToggleStats(first.newState, true);
    assert.strictEqual(second.newState, true);
    assert.ok(second.buttonClasses.includes('active'));
  });

  test('toggling three times ends in disabled state', () => {
    const first = simulateToggleStats(true, true);
    const second = simulateToggleStats(first.newState, true);
    const third = simulateToggleStats(second.newState, true);
    assert.strictEqual(third.newState, false);
    assert.ok(!third.buttonClasses.includes('active'));
  });

  test('toggle without button does not change state', () => {
    const result = simulateToggleStats(true, false);
    assert.strictEqual(result.newState, true, 'State should not change without button');
  });
});

suite('Toggle Stats E2E Source Integration Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test('complete flow: button exists in both HTML templates and logic handles it', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const stylesSource = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(providerSource.includes('id="stats-toggle-btn"'), 'webviewProvider should have stats-toggle-btn');
    assert.ok(indexSource.includes('id="stats-toggle-btn"'), 'index.html should have stats-toggle-btn');
    assert.ok(mainSource.includes('handleToggleStats'), 'main.js should have toggle handler');
    assert.ok(stylesSource.includes('.stats-toggle-btn'), 'styles.css should have button styling');
    assert.ok(stylesSource.includes('.stats-toggle-btn.active'), 'styles.css should have active state styling');
  });

  test('toggleStats action is defined in types.ts', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes("'toggleStats'"), 'types.ts should include toggleStats in WebviewAction');
  });

  test('toggleStats command is registered in extension.ts', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(extensionSource.includes("'toggleStats'"), 'extension.ts should register toggleStats action');
  });

  test('toggleStats command is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.toggleStats');
    assert.ok(command, 'package.json should define gitHistory.toggleStats command');
    assert.strictEqual(command.title, 'Git History: Toggle Stats Column');
  });

  test('keyboard shortcut Ctrl+Shift+Alt+T is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.toggleStats');
    assert.ok(keybinding, 'package.json should define keybinding for toggleStats');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+t');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+t');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('triggerAction handler calls handleToggleStats', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const triggerActionStart = mainSource.indexOf("case 'triggerAction':");
    assert.ok(triggerActionStart >= 0, 'Should have triggerAction message handler');

    const triggerActionEnd = mainSource.indexOf('}', triggerActionStart + 100);
    const triggerActionBody = mainSource.substring(triggerActionStart, triggerActionEnd);

    assert.ok(triggerActionBody.includes('toggleStats'), 'triggerAction should handle toggleStats');
    assert.ok(triggerActionBody.includes('handleToggleStats()'), 'triggerAction should call handleToggleStats()');
  });

  test('handleToggleStats sends saveSettings message', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = mainSource.indexOf('function handleToggleStats');
    assert.ok(fnStart >= 0, 'handleToggleStats function should exist');

    const fnEnd = mainSource.indexOf('\n}', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('saveSettings'), 'handleToggleStats should send saveSettings message');
    assert.ok(fnBody.includes('showStats'), 'handleToggleStats should persist showStats setting');
  });

  test('stats toggle button triggers handleToggleStats on click', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = mainSource.indexOf('function init()');
    assert.ok(initStart >= 0, 'Should have init function');

    const initEnd = mainSource.indexOf('\n// ───', initStart);
    const initBody = mainSource.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initBody.includes('stats-toggle-btn'), 'init should bind event to stats-toggle-btn');
    assert.ok(initBody.includes('handleToggleStats'), 'init should call handleToggleStats on button click');
  });

  test('handleToggleStats toggles stats column header visibility', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = mainSource.indexOf('function handleToggleStats');
    const fnEnd = mainSource.indexOf('\n}', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('th.stats-col'), 'handleToggleStats should toggle th.stats-col');
    assert.ok(fnBody.includes('showStats ?'), 'handleToggleStats should use showStats for display toggle');
  });
});

suite('Toggle Stats E2E Column Rendering Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  test('stats column is conditionally rendered based on showStats', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    // The stats column should use a ternary to conditionally render
    assert.ok(mainSource.includes('${showStats ?'), 'Stats column should be conditional');
    assert.ok(mainSource.includes("class=\"stats-col\""), 'Stats column should have stats-col class');
  });

  test('colspan accounts for stats column visibility', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const renderStart = mainSource.indexOf('function renderCommits');
    const renderEnd = mainSource.indexOf('\nfunction', renderStart + 1);
    const renderFn = mainSource.substring(renderStart, renderEnd > renderStart ? renderEnd : undefined);

    // Colspan should account for showStats
    assert.ok(renderFn.includes('showStats'), 'colspan should account for showStats');
  });

  test('stats column header exists in webviewProvider', () => {
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const providerSource = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(providerSource.includes('<th class="stats-col">Stats</th>'), 'webviewProvider should have stats column header');
  });
});

suite('Toggle Stats E2E Persistence Tests', () => {
  const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');

  test('showStats is defined in UserSettings', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('showStats'), 'UserSettings should include showStats');
  });

  test('showStats has correct default value of true', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('showStats: true'), 'Default should be true (show stats by default)');
  });

  test('showStats type is boolean', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('showStats: boolean'), 'showStats should be typed as boolean');
  });
});
