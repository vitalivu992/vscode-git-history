import * as assert from 'assert';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  parentHashes: string[];
}

interface CurrentUser {
  name: string;
  email: string;
}

/**
 * Filter commits to show only those by the current user
 */
function filterMyCommits(commits: TestCommit[], currentUser: CurrentUser | null, enabled: boolean): TestCommit[] {
  if (!enabled || !currentUser) {
    return commits;
  }
  return commits.filter(commit =>
    commit.email.toLowerCase() === currentUser.email.toLowerCase() ||
    commit.author.toLowerCase() === currentUser.name.toLowerCase()
  );
}

/**
 * Check if current user config is valid
 */
function isCurrentUserValid(user: CurrentUser | null): boolean {
  if (!user) return false;
  return !!(user.name.trim() || user.email.trim());
}

suite('My Commits Filter Logic Tests', () => {
  const mockCommits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice',
      email: 'alice@example.com',
      message: 'First commit',
      parentHashes: []
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob',
      email: 'bob@example.com',
      message: 'Second commit',
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Alice',
      email: 'alice@example.com',
      message: 'Third commit',
      parentHashes: ['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Charlie',
      email: 'charlie@example.com',
      message: 'Fourth commit',
      parentHashes: ['cccccccccccccccccccccccccccccccccccccccc']
    },
    {
      hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      shortHash: 'eeeeeee',
      author: 'Alice Smith',
      email: 'alice@example.com',
      message: 'Fifth commit',
      parentHashes: ['dddddddddddddddddddddddddddddddddddddddd']
    }
  ];

  test('filterMyCommits should return all commits when disabled', () => {
    const currentUser: CurrentUser = { name: 'Alice', email: 'alice@example.com' };
    const filtered = filterMyCommits(mockCommits, currentUser, false);
    assert.strictEqual(filtered.length, 5);
  });

  test('filterMyCommits should return all commits when no current user', () => {
    const filtered = filterMyCommits(mockCommits, null, true);
    assert.strictEqual(filtered.length, 5);
  });

  test('filterMyCommits should filter by email match', () => {
    const currentUser: CurrentUser = { name: 'Alice', email: 'alice@example.com' };
    const filtered = filterMyCommits(mockCommits, currentUser, true);
    assert.strictEqual(filtered.length, 3);
    assert.strictEqual(filtered[0].author, 'Alice');
    assert.strictEqual(filtered[1].author, 'Alice');
    assert.strictEqual(filtered[2].author, 'Alice Smith');
  });

  test('filterMyCommits should filter by name match (fallback)', () => {
    const currentUser: CurrentUser = { name: 'Charlie', email: 'different@example.com' };
    const filtered = filterMyCommits(mockCommits, currentUser, true);
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].author, 'Charlie');
  });

  test('filterMyCommits should be case insensitive for email', () => {
    const currentUser: CurrentUser = { name: 'Alice', email: 'ALICE@EXAMPLE.COM' };
    const filtered = filterMyCommits(mockCommits, currentUser, true);
    assert.strictEqual(filtered.length, 3);
  });

  test('filterMyCommits should be case insensitive for name', () => {
    const currentUser: CurrentUser = { name: 'ALICE', email: 'other@example.com' };
    const filtered = filterMyCommits(mockCommits, currentUser, true);
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.every(c => c.author.toLowerCase().includes('alice')));
  });

  test('filterMyCommits should return empty array when no matches', () => {
    const currentUser: CurrentUser = { name: 'David', email: 'david@example.com' };
    const filtered = filterMyCommits(mockCommits, currentUser, true);
    assert.strictEqual(filtered.length, 0);
  });

  test('filterMyCommits should handle partial name matches', () => {
    // Should match both "Alice" and "Alice Smith" when current user is "Alice"
    const currentUser: CurrentUser = { name: 'Alice', email: 'different@example.com' };
    const filtered = filterMyCommits(mockCommits, currentUser, true);
    // Only "Alice" should match, not "Alice Smith" (full name comparison)
    assert.strictEqual(filtered.length, 2);
  });

  test('isCurrentUserValid should return false for null', () => {
    assert.strictEqual(isCurrentUserValid(null), false);
  });

  test('isCurrentUserValid should return false for empty object', () => {
    assert.strictEqual(isCurrentUserValid({ name: '', email: '' }), false);
  });

  test('isCurrentUserValid should return true when name is set', () => {
    assert.strictEqual(isCurrentUserValid({ name: 'Alice', email: '' }), true);
  });

  test('isCurrentUserValid should return true when email is set', () => {
    assert.strictEqual(isCurrentUserValid({ name: '', email: 'alice@example.com' }), true);
  });

  test('isCurrentUserValid should return true when both are set', () => {
    assert.strictEqual(isCurrentUserValid({ name: 'Alice', email: 'alice@example.com' }), true);
  });
});

suite('My Commits Filter Source Verification', () => {
  test('main.js should have handleMyCommitsToggle function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleMyCommitsToggle'), 'main.js should have handleMyCommitsToggle function');
  });

  test('main.js should have showMyCommitsOnly state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('showMyCommitsOnly'), 'main.js should have showMyCommitsOnly state variable');
  });

  test('main.js should have currentUser state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('currentUser'), 'main.js should have currentUser state variable');
  });

  test('main.js should apply my commits filter in getFilteredCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const filterFnStart = source.indexOf('function getFilteredCommits');
    const filterFnEnd = source.indexOf('\nfunction', filterFnStart + 1);
    const filterFn = source.substring(filterFnStart, filterFnEnd > filterFnStart ? filterFnEnd : undefined);

    assert.ok(filterFn.includes('showMyCommitsOnly'), 'getFilteredCommits should check showMyCommitsOnly');
    assert.ok(filterFn.includes('currentUser'), 'getFilteredCommits should reference currentUser');
  });

  test('main.js should handle Ctrl+Shift+M keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'm'") && source.includes('ctrlKey') && source.includes('shiftKey'),
      'main.js should handle Ctrl+Shift+M keyboard shortcut');
  });

  test('main.js should call handleMyCommitsToggle from button click', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init');
    const initEnd = source.indexOf('\nfunction', initStart + 1);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('myCommitsBtn') && initFn.includes('handleMyCommitsToggle'),
      'init function should set up myCommitsBtn event listener');
  });

  test('main.js should save showMyCommitsOnly setting', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMyCommitsToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("type: 'saveSettings'"), 'handleMyCommitsToggle should send saveSettings message');
    assert.ok(toggleFn.includes('showMyCommitsOnly'), 'handleMyCommitsToggle should save showMyCommitsOnly setting');
  });

  test('main.js should apply showMyCommitsOnly from userSettings in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initCaseStart = source.indexOf("case 'init':");
    const initCaseEnd = source.indexOf('break;', initCaseStart) + 6;
    const initCase = source.substring(initCaseStart, initCaseEnd);

    assert.ok(initCase.includes('showMyCommitsOnly'), 'init case should apply showMyCommitsOnly setting');
  });

  test('main.js should call renderCommits and updateCommitCount after restoring showMyCommitsOnly', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initCaseStart = source.indexOf("case 'init':");
    const initCaseEnd = source.indexOf('break;', initCaseStart) + 6;
    const initCase = source.substring(initCaseStart, initCaseEnd);

    // Find the block where showMyCommitsOnly is restored from settings
    const myCommitsAssignment = initCase.indexOf('showMyCommitsOnly = settings.showMyCommitsOnly');
    assert.ok(myCommitsAssignment !== -1, 'init case should restore showMyCommitsOnly from settings');

    // Check that renderCommits() and updateCommitCount() are called after
    const afterMyCommits = initCase.substring(myCommitsAssignment);
    assert.ok(afterMyCommits.includes('renderCommits()'), 'init case should call renderCommits() after restoring showMyCommitsOnly');
    assert.ok(afterMyCommits.includes('updateCommitCount()'), 'init case should call updateCommitCount() after restoring showMyCommitsOnly');
  });

  test('main.js should store currentUser from init message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initCaseStart = source.indexOf("case 'init':");
    const initCaseEnd = source.indexOf('break;', initCaseStart) + 6;
    const initCase = source.substring(initCaseStart, initCaseEnd);

    assert.ok(initCase.includes('message.currentUser'), 'init case should store currentUser from message');
  });

  test('main.js should disable myCommitsBtn when no currentUser', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('myCommitsBtn.disabled') && source.includes('currentUser'),
      'main.js should disable myCommitsBtn when no currentUser');
  });

  test('main.js should include my commits toggle in keyboard help', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const keyboardHelpStart = source.indexOf('function showKeyboardHelpDialog');
    const keyboardHelpEnd = source.indexOf('\nfunction', keyboardHelpStart + 1);
    const keyboardHelpFn = source.substring(keyboardHelpStart, keyboardHelpEnd > keyboardHelpStart ? keyboardHelpEnd : undefined);

    assert.ok(keyboardHelpFn.includes('my commits') || keyboardHelpFn.includes('My Commits'),
      'keyboard help should mention my commits filter');
  });
});

suite('My Commits Filter CSS Verification', () => {
  test('styles.css should have my-commits-btn styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.my-commits-btn'), 'styles.css should have .my-commits-btn styles');
  });

  test('styles.css should have my-commits-btn.active styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.my-commits-btn.active'), 'styles.css should have .my-commits-btn.active styles');
  });

  test('styles.css should have my-commits-btn:disabled styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.my-commits-btn:disabled'), 'styles.css should have .my-commits-btn:disabled styles');
  });
});

suite('My Commits Filter Git Service Verification', () => {
  test('gitService.ts should have getCurrentGitUser function', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getCurrentGitUser'), 'gitService.ts should export getCurrentGitUser function');
  });

  test('gitService.ts should call git config user.name', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes("['config', 'user.name']"), 'getCurrentGitUser should call git config user.name');
  });

  test('gitService.ts should call git config user.email', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes("['config', 'user.email']"), 'getCurrentGitUser should call git config user.email');
  });
});

suite('My Commits Filter Settings Verification', () => {
  test('settingsTypes.ts should have showMyCommitsOnly in UserSettings', () => {
    const fs = require('fs');
    const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsTypesPath, 'utf-8');

    assert.ok(source.includes('showMyCommitsOnly'), 'UserSettings should include showMyCommitsOnly');
  });

  test('settingsTypes.ts should have showMyCommitsOnly in DEFAULT_SETTINGS', () => {
    const fs = require('fs');
    const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsTypesPath, 'utf-8');

    const defaultSettingsStart = source.indexOf('export const DEFAULT_SETTINGS');
    const defaultSettingsEnd = source.indexOf('};', defaultSettingsStart) + 2;
    const defaultSettings = source.substring(defaultSettingsStart, defaultSettingsEnd);

    assert.ok(defaultSettings.includes('showMyCommitsOnly'), 'DEFAULT_SETTINGS should include showMyCommitsOnly');
    assert.ok(defaultSettings.includes('showMyCommitsOnly: false'), 'showMyCommitsOnly default should be false');
  });
});

suite('My Commits Filter Types Verification', () => {
  test('types.ts should include currentUser in init message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    // Find the ExtToWebviewMessage type definition
    const extToWebviewMatch = source.indexOf('export type ExtToWebviewMessage');
    const initTypeStart = source.indexOf("type: 'init'", extToWebviewMatch);
    // Find the end of the init type line (ending with } |)
    const initTypeEnd = source.indexOf('|', initTypeStart);
    const initType = source.substring(initTypeStart, initTypeEnd > initTypeStart ? initTypeEnd : undefined);

    assert.ok(initType.includes('currentUser'), 'init message type should include currentUser');
    assert.ok(initType.includes('name: string'), 'currentUser should have name property');
    assert.ok(initType.includes('email: string'), 'currentUser should have email property');
  });
});

suite('My Commits Filter Webview Provider Verification', () => {
  test('webviewProvider.ts should import getCurrentGitUser', () => {
    const fs = require('fs');
    const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');

    assert.ok(source.includes('getCurrentGitUser'), 'webviewProvider.ts should import getCurrentGitUser');
  });

  test('webviewProvider.ts should call getCurrentGitUser in loadData', () => {
    const fs = require('fs');
    const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');

    const loadDataStart = source.indexOf('public async loadData');
    const loadDataEnd = source.indexOf('\n  }', loadDataStart) + 4;
    const loadDataFn = source.substring(loadDataStart, loadDataEnd);

    assert.ok(loadDataFn.includes('getCurrentGitUser'), 'loadData should call getCurrentGitUser');
  });

  test('webviewProvider.ts should pass currentUser in init message', () => {
    const fs = require('fs');
    const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');

    const loadDataStart = source.indexOf('public async loadData');
    const loadDataEnd = source.indexOf('\n  }', loadDataStart) + 4;
    const loadDataFn = source.substring(loadDataStart, loadDataEnd);

    assert.ok(loadDataFn.includes('currentUser'), 'loadData should pass currentUser to init message');
  });

  test('webviewProvider.ts should have my-commits-btn in HTML', () => {
    const fs = require('fs');
    const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');

    assert.ok(source.includes('my-commits-btn'), 'webview HTML should include my-commits-btn');
  });
});
