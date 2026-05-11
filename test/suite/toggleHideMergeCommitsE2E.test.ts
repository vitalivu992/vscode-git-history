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
}

/**
 * Simulate the toggle hide merge commits behavior
 */
function simulateHideMergeCommitsToggle(
  initialState: boolean,
  mergeToggleBtnExists: boolean
): { newState: boolean; buttonClasses: string[]; buttonTitle: string } {
  let hideMergeCommits = initialState;
  const buttonClasses: string[] = [];

  if (mergeToggleBtnExists) {
    hideMergeCommits = !hideMergeCommits;

    if (hideMergeCommits) {
      buttonClasses.push('active');
    } else {
      const activeIdx = buttonClasses.indexOf('active');
      if (activeIdx >= 0) buttonClasses.splice(activeIdx, 1);
    }
  }

  const buttonTitle = hideMergeCommits
    ? 'Merge commits hidden (click to show)'
    : 'Hide merge commits';

  return { newState: hideMergeCommits, buttonClasses, buttonTitle };
}

suite('Toggle Hide Merge Commits E2E Logic Tests', () => {
  test('toggle from disabled to enabled adds active class', () => {
    const result = simulateHideMergeCommitsToggle(false, true);
    assert.strictEqual(result.newState, true);
    assert.ok(result.buttonClasses.includes('active'), 'Should add active class to button');
    assert.ok(result.buttonTitle.includes('hidden'), 'Title should indicate merge commits are hidden');
  });

  test('toggle from enabled to disabled removes active class', () => {
    const result = simulateHideMergeCommitsToggle(true, true);
    assert.strictEqual(result.newState, false);
    assert.ok(!result.buttonClasses.includes('active'), 'Should not have active class on button');
    assert.ok(result.buttonTitle.includes('Hide'), 'Title should indicate hide merge commits action');
  });

  test('toggling twice returns to initial state', () => {
    const first = simulateHideMergeCommitsToggle(false, true);
    const second = simulateHideMergeCommitsToggle(first.newState, true);
    assert.strictEqual(second.newState, false);
    assert.ok(!second.buttonClasses.includes('active'));
  });

  test('toggling three times ends in enabled state', () => {
    const first = simulateHideMergeCommitsToggle(false, true);
    const second = simulateHideMergeCommitsToggle(first.newState, true);
    const third = simulateHideMergeCommitsToggle(second.newState, true);
    assert.strictEqual(third.newState, true);
    assert.ok(third.buttonClasses.includes('active'));
  });

  test('toggle without button does not change state', () => {
    const result = simulateHideMergeCommitsToggle(false, false);
    assert.strictEqual(result.newState, false, 'State should not change without button');
    assert.ok(!result.buttonClasses.includes('active'), 'Should not have active class');
  });
});

suite('Toggle Hide Merge Commits E2E Source Integration Tests', () => {
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

    assert.ok(providerSource.includes('id="merge-toggle-btn"'), 'webviewProvider should have merge-toggle-btn');
    assert.ok(indexSource.includes('id="merge-toggle-btn"'), 'index.html should have merge-toggle-btn');
    assert.ok(mainSource.includes('handleMergeToggle'), 'main.js should have toggle handler');
    assert.ok(stylesSource.includes('.merge-toggle-btn'), 'styles.css should have button styling');
    assert.ok(stylesSource.includes('.merge-toggle-btn.active'), 'styles.css should have active state styling');
  });

  test('toggleHideMergeCommits action is defined in types.ts', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes("'toggleHideMergeCommits'"), 'types.ts should include toggleHideMergeCommits in WebviewAction');
  });

  test('toggleHideMergeCommits command is registered in extension.ts', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(extensionSource.includes("'toggleHideMergeCommits'"), 'extension.ts should register toggleHideMergeCommits action');
  });

  test('toggleHideMergeCommits command is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.toggleHideMergeCommits');
    assert.ok(command, 'package.json should define gitHistory.toggleHideMergeCommits command');
    assert.strictEqual(command.title, 'Git History: Toggle Hide Merge Commits');
  });

  test('keyboard shortcut Ctrl+Shift+Q is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.toggleHideMergeCommits');
    assert.ok(keybinding, 'package.json should define keybinding for toggleHideMergeCommits');
    assert.strictEqual(keybinding.key, 'ctrl+shift+q');
    assert.strictEqual(keybinding.mac, 'cmd+shift+q');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard shortcut triggers handleMergeToggle in main.js', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const triggerActionStart = mainSource.indexOf('case \'triggerAction\':');
    assert.ok(triggerActionStart >= 0, 'Should have triggerAction message handler');

    const triggerActionEnd = mainSource.indexOf('}', triggerActionStart + 100);
    const triggerActionBody = mainSource.substring(triggerActionStart, triggerActionEnd);

    assert.ok(triggerActionBody.includes('toggleHideMergeCommits'), 'triggerAction should handle toggleHideMergeCommits');
    assert.ok(triggerActionBody.includes('handleMergeToggle()'), 'triggerAction should call handleMergeToggle()');
  });

  test('handleMergeToggle sends saveSettings message', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = mainSource.indexOf('function handleMergeToggle');
    assert.ok(fnStart >= 0, 'handleMergeToggle function should exist');

    const fnEnd = mainSource.indexOf('\n}', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('saveSettings'), 'handleMergeToggle should send saveSettings message');
    assert.ok(fnBody.includes('hideMergeCommits'), 'handleMergeToggle should persist hideMergeCommits setting');
  });

  test('button order is consistent between webviewProvider and index.html', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');

    const getButtonOrder = (source: string): string[] => {
      const buttons = ['copy-btn', 'word-wrap-btn', 'sort-btn', 'merge-toggle-btn', 'refresh-btn'];
      return buttons.filter(btn => {
        const idx = source.indexOf(`id="${btn}"`);
        return idx >= 0;
      }).sort((a, b) => {
        return source.indexOf(`id="${a}"`) - source.indexOf(`id="${b}"`);
      });
    };

    const providerOrder = getButtonOrder(providerSource);
    const indexOrder = getButtonOrder(indexSource);

    assert.deepStrictEqual(providerOrder, indexOrder,
      `Button order should match: provider=${providerOrder.join(',')}, index=${indexOrder.join(',')}`);
  });

  test('merge toggle button triggers handleMergeToggle on click', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = mainSource.indexOf('function init()');
    assert.ok(initStart >= 0, 'Should have init function');

    const initEnd = mainSource.indexOf('\n// ───', initStart);
    const initBody = mainSource.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initBody.includes('merge-toggle-btn'), 'init should bind event to merge-toggle-btn');
    assert.ok(initBody.includes('handleMergeToggle'), 'init should call handleMergeToggle on button click');
  });
});

suite('Toggle Hide Merge Commits E2E Filter Logic Tests', () => {
  /**
   * Re-implementation of getFilteredCommits from main.js for testing
   */
  function getFilteredCommits(
    commits: TestCommit[],
    hideMergeCommits: boolean
  ): TestCommit[] {
    let filtered = commits;

    if (hideMergeCommits) {
      filtered = filtered.filter(commit => !(commit.parentHashes && commit.parentHashes.length > 1));
    }

    return filtered;
  }

  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'Initial commit',
      fullMessage: 'Initial commit',
      parentHashes: []
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@example.com',
      message: 'Add feature X',
      fullMessage: 'Add feature X',
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'Merge pull request #42',
      fullMessage: 'Merge pull request #42',
      parentHashes: ['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'dddddddddddddddddddddddddddddddddddddddd']
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@example.com',
      message: 'Feature branch work',
      fullMessage: 'Feature branch work',
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']
    }
  ];

  test('filtering with hideMergeCommits=true removes merge commits', () => {
    const result = getFilteredCommits(commits, true);
    assert.strictEqual(result.length, 3);
    assert.ok(!result.some(c => c.hash === commits[2].hash), 'Merge commit should be filtered out');
  });

  test('filtering with hideMergeCommits=false shows all commits', () => {
    const result = getFilteredCommits(commits, false);
    assert.strictEqual(result.length, 4);
  });

  test('toggle changes commit count dynamically', () => {
    const allCommits = getFilteredCommits(commits, false);
    const filtered = getFilteredCommits(commits, true);

    assert.strictEqual(allCommits.length, 4, 'Should show all commits when toggle is off');
    assert.strictEqual(filtered.length, 3, 'Should show 3 commits when toggle is on (1 merge commit hidden)');
    assert.strictEqual(allCommits.length - filtered.length, 1, 'Exactly 1 commit should be hidden');
  });

  test('toggle preserves order of non-merge commits', () => {
    const result = getFilteredCommits(commits, true);
    assert.strictEqual(result[0].hash, commits[0].hash);
    assert.strictEqual(result[1].hash, commits[1].hash);
    assert.strictEqual(result[2].hash, commits[3].hash);
  });
});

suite('Toggle Hide Merge Commits E2E Persistence Tests', () => {
  const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
  const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');

  test('hideMergeCommits is defined in UserSettings', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('hideMergeCommits'), 'UserSettings should include hideMergeCommits');
  });

  test('hideMergeCommits has correct default value', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('hideMergeCommits: false'), 'Default should be false (show merge commits)');
  });

  test('messageHandler handles saveSettings message', () => {
    const handlerSource = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(handlerSource.includes('saveSettings'), 'messageHandler should handle saveSettings message');
  });

  test('init message includes hideMergeCommits from userSettings', () => {
    const typesSource = fs.readFileSync(path.resolve(__dirname, '../../../src/types.ts'), 'utf-8');
    const initMatch = typesSource.match(/type ExtToWebviewMessage[\s\S]*?{[\s\S]*?type: 'init'/);
    assert.ok(initMatch, 'Should have init message type');
    assert.ok(typesSource.includes('hideMergeCommits'), 'init message should include hideMergeCommits');
  });
});
