import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  fullMessage: string;
  parentHashes: string[];
  signature?: { verified: boolean; signer: string | null } | null;
}

/**
 * Simulate the toggle signatures behavior
 */
function simulateToggleSignatures(
  initialState: boolean,
  toggleBtnExists: boolean
): { newState: boolean; buttonClasses: string[]; buttonTitle: string } {
  let showSignatures = initialState;
  const buttonClasses: string[] = initialState ? ['active'] : [];

  if (toggleBtnExists) {
    showSignatures = !showSignatures;

    if (showSignatures) {
      buttonClasses.push('active');
    } else {
      const activeIdx = buttonClasses.indexOf('active');
      if (activeIdx >= 0) buttonClasses.splice(activeIdx, 1);
    }
  }

  const buttonTitle = showSignatures
    ? 'GPG signatures visible (click to hide)'
    : 'Show GPG signatures';

  return { newState: showSignatures, buttonClasses, buttonTitle };
}

suite('Toggle Signatures E2E Logic Tests', () => {
  test('toggle from enabled to disabled removes active class', () => {
    const result = simulateToggleSignatures(true, true);
    assert.strictEqual(result.newState, false);
    assert.ok(!result.buttonClasses.includes('active'), 'Should not have active class on button');
    assert.ok(result.buttonTitle.includes('Show'), 'Title should indicate show signatures action');
  });

  test('toggle from disabled to enabled adds active class', () => {
    const result = simulateToggleSignatures(false, true);
    assert.strictEqual(result.newState, true);
    assert.ok(result.buttonClasses.includes('active'), 'Should add active class to button');
    assert.ok(result.buttonTitle.includes('visible'), 'Title should indicate signatures are visible');
  });

  test('toggling twice returns to initial state', () => {
    const first = simulateToggleSignatures(true, true);
    const second = simulateToggleSignatures(first.newState, true);
    assert.strictEqual(second.newState, true);
    assert.ok(second.buttonClasses.includes('active'));
  });

  test('toggling three times ends in disabled state', () => {
    const first = simulateToggleSignatures(true, true);
    const second = simulateToggleSignatures(first.newState, true);
    const third = simulateToggleSignatures(second.newState, true);
    assert.strictEqual(third.newState, false);
    assert.ok(!third.buttonClasses.includes('active'));
  });

  test('toggle without button does not change state', () => {
    const result = simulateToggleSignatures(true, false);
    assert.strictEqual(result.newState, true, 'State should not change without button');
  });
});

suite('Toggle Signatures E2E Source Integration Tests', () => {
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

    assert.ok(providerSource.includes('id="signatures-toggle-btn"'), 'webviewProvider should have signatures-toggle-btn');
    assert.ok(indexSource.includes('id="signatures-toggle-btn"'), 'index.html should have signatures-toggle-btn');
    assert.ok(mainSource.includes('handleToggleSignatures'), 'main.js should have toggle handler');
    assert.ok(stylesSource.includes('.signatures-toggle-btn'), 'styles.css should have button styling');
    assert.ok(stylesSource.includes('.signatures-toggle-btn.active'), 'styles.css should have active state styling');
  });

  test('toggleSignatures action is defined in types.ts', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes("'toggleSignatures'"), 'types.ts should include toggleSignatures in WebviewAction');
  });

  test('CommitSignature interface is defined in types.ts', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes('interface CommitSignature'), 'types.ts should define CommitSignature interface');
    assert.ok(typesSource.includes('verified: boolean'), 'CommitSignature should have verified boolean');
    assert.ok(typesSource.includes('signer: string | null'), 'CommitSignature should have signer field');
  });

  test('toggleSignatures command is registered in extension.ts', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(extensionSource.includes("'toggleSignatures'"), 'extension.ts should register toggleSignatures action');
  });

  test('toggleSignatures command is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.toggleSignatures');
    assert.ok(command, 'package.json should define gitHistory.toggleSignatures command');
    assert.strictEqual(command.title, 'Git History: Toggle Signatures');
  });

  test('keyboard shortcut Ctrl+Shift+S is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.toggleSignatures');
    assert.ok(keybinding, 'package.json should define keybinding for toggleSignatures');
    assert.strictEqual(keybinding.key, 'ctrl+shift+s');
    assert.strictEqual(keybinding.mac, 'cmd+shift+s');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('triggerAction handler calls handleToggleSignatures', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const triggerActionStart = mainSource.indexOf("case 'triggerAction':");
    assert.ok(triggerActionStart >= 0, 'Should have triggerAction message handler');

    const triggerActionEnd = mainSource.indexOf('}', triggerActionStart + 100);
    const triggerActionBody = mainSource.substring(triggerActionStart, triggerActionEnd);

    assert.ok(triggerActionBody.includes('toggleSignatures'), 'triggerAction should handle toggleSignatures');
    assert.ok(triggerActionBody.includes('handleToggleSignatures()'), 'triggerAction should call handleToggleSignatures()');
  });

  test('handleToggleSignatures sends saveSettings message', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = mainSource.indexOf('function handleToggleSignatures');
    assert.ok(fnStart >= 0, 'handleToggleSignatures function should exist');

    const fnEnd = mainSource.indexOf('\n}', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('saveSettings'), 'handleToggleSignatures should send saveSettings message');
    assert.ok(fnBody.includes('showSignatures'), 'handleToggleSignatures should persist showSignatures setting');
  });

  test('signatures toggle button triggers handleToggleSignatures on click', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = mainSource.indexOf('function init()');
    assert.ok(initStart >= 0, 'Should have init function');

    const initEnd = mainSource.indexOf('\n// ───', initStart);
    const initBody = mainSource.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initBody.includes('signatures-toggle-btn'), 'init should bind event to signatures-toggle-btn');
    assert.ok(initBody.includes('handleToggleSignatures'), 'init should call handleToggleSignatures on button click');
  });
});

suite('Toggle Signatures E2E Badge Rendering Tests', () => {
  /**
   * Re-implementation of signature badge rendering from main.js for testing
   */
  function renderSignatureBadge(
    commit: TestCommit,
    showSignatures: boolean
  ): string {
    if (commit.signature && showSignatures) {
      return `<span class="signature-badge ${commit.signature.verified ? 'verified' : 'unverified'}">${commit.signature.verified ? '✓' : '✗'}</span>`;
    }
    return '';
  }

  const verifiedCommit: TestCommit = {
    hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    shortHash: 'aaaaaaa',
    author: 'Alice',
    email: 'alice@example.com',
    message: 'Signed commit',
    fullMessage: 'Signed commit',
    parentHashes: [],
    signature: { verified: true, signer: 'Alice <alice@example.com>' }
  };

  const unverifiedCommit: TestCommit = {
    hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    shortHash: 'bbbbbbb',
    author: 'Bob',
    email: 'bob@example.com',
    message: 'Bad signature',
    fullMessage: 'Bad signature',
    parentHashes: [],
    signature: { verified: false, signer: 'Bob <bob@example.com>' }
  };

  const unsignedCommit: TestCommit = {
    hash: 'cccccccccccccccccccccccccccccccccccccccc',
    shortHash: 'ccccccc',
    author: 'Charlie',
    email: 'charlie@example.com',
    message: 'Unsigned commit',
    fullMessage: 'Unsigned commit',
    parentHashes: []
  };

  test('verified commit shows verified badge when signatures enabled', () => {
    const badge = renderSignatureBadge(verifiedCommit, true);
    assert.ok(badge.includes('signature-badge'), 'Badge should have signature-badge class');
    assert.ok(badge.includes('verified'), 'Badge should have verified class');
    assert.ok(badge.includes('✓'), 'Badge should show checkmark');
  });

  test('unverified commit shows unverified badge when signatures enabled', () => {
    const badge = renderSignatureBadge(unverifiedCommit, true);
    assert.ok(badge.includes('signature-badge'), 'Badge should have signature-badge class');
    assert.ok(badge.includes('unverified'), 'Badge should have unverified class');
    assert.ok(badge.includes('✗'), 'Badge should show X mark');
  });

  test('unsigned commit shows no badge when signatures enabled', () => {
    const badge = renderSignatureBadge(unsignedCommit, true);
    assert.strictEqual(badge, '', 'Unsigned commit should show no badge');
  });

  test('all commits show no badge when signatures disabled', () => {
    assert.strictEqual(renderSignatureBadge(verifiedCommit, false), '', 'Verified commit should show no badge when disabled');
    assert.strictEqual(renderSignatureBadge(unverifiedCommit, false), '', 'Unverified commit should show no badge when disabled');
    assert.strictEqual(renderSignatureBadge(unsignedCommit, false), '', 'Unsigned commit should show no badge when disabled');
  });

  test('toggle changes badge visibility dynamically', () => {
    const badgeOn = renderSignatureBadge(verifiedCommit, true);
    const badgeOff = renderSignatureBadge(verifiedCommit, false);

    assert.ok(badgeOn.length > 0, 'Badge should be visible when signatures enabled');
    assert.strictEqual(badgeOff, '', 'Badge should be hidden when signatures disabled');
  });
});

suite('Toggle Signatures E2E Persistence Tests', () => {
  const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');

  test('showSignatures is defined in UserSettings', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('showSignatures'), 'UserSettings should include showSignatures');
  });

  test('showSignatures has correct default value of true', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('showSignatures: true'), 'Default should be true (show signatures by default)');
  });
});
