import * as assert from 'assert';
import * as path from 'path';

suite('Settings Service Tests', () => {
  test('settingsService.ts should exist', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    assert.ok(fs.existsSync(servicePath), 'settingsService.ts should exist');
  });

  test('settingsTypes.ts should exist', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    assert.ok(fs.existsSync(typesPath), 'settingsTypes.ts should exist');
  });

  test('settings/index.ts should exist', () => {
    const fs = require('fs');
    const indexPath = path.resolve(__dirname, '../../../src/settings/index.ts');
    assert.ok(fs.existsSync(indexPath), 'settings/index.ts should exist');
  });

  test('SettingsService should have saveSettings method', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('saveSettings'), 'SettingsService should have saveSettings method');
  });

  test('SettingsService should have getSettings method', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('getSettings'), 'SettingsService should have getSettings method');
  });

  test('SettingsService should accept Memento in constructor', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('memento: vscode.Memento'), 'SettingsService constructor should accept Memento');
  });

  test('UserSettings interface should be defined', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('export interface UserSettings'), 'UserSettings interface should be exported');
  });

  test('UserSettings should have diffType property', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('diffType:'), 'UserSettings should have diffType property');
  });

  test('UserSettings should have wordWrapEnabled property', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('wordWrapEnabled:'), 'UserSettings should have wordWrapEnabled property');
  });

  test('UserSettings should have sortOldestFirst property', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('sortOldestFirst:'), 'UserSettings should have sortOldestFirst property');
  });

  test('UserSettings should have hideMergeCommits property', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('hideMergeCommits:'), 'UserSettings should have hideMergeCommits property');
  });

  test('UserSettings should have regexSearchEnabled property', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('regexSearchEnabled:'), 'UserSettings should have regexSearchEnabled property');
  });

  test('DEFAULT_SETTINGS should be defined', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('export const DEFAULT_SETTINGS'), 'DEFAULT_SETTINGS should be exported');
  });

  test('DEFAULT_SETTINGS should have correct default values', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("diffType: 'unified'"), 'DEFAULT_SETTINGS should have unified as default diffType');
    assert.ok(source.includes('wordWrapEnabled: false'), 'DEFAULT_SETTINGS should have false as default wordWrapEnabled');
    assert.ok(source.includes('sortOldestFirst: false'), 'DEFAULT_SETTINGS should have false as default sortOldestFirst');
    assert.ok(source.includes('hideMergeCommits: false'), 'DEFAULT_SETTINGS should have false as default hideMergeCommits');
    assert.ok(source.includes('regexSearchEnabled: false'), 'DEFAULT_SETTINGS should have false as default regexSearchEnabled');
  });

  test('SETTINGS_STORAGE_KEY should be defined', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('SETTINGS_STORAGE_KEY'), 'SETTINGS_STORAGE_KEY should be defined');
    assert.ok(source.includes("gitHistory.userSettings"), 'SETTINGS_STORAGE_KEY should use gitHistory.userSettings');
  });

  test('SettingsService should use globalState storage key', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('SETTINGS_STORAGE_KEY'), 'SettingsService should use SETTINGS_STORAGE_KEY');
  });

  test('SettingsService getSettings should merge with defaults', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('...DEFAULT_SETTINGS'), 'getSettings should merge saved settings with defaults');
  });

  test('extension.ts should import SettingsService', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("from './settings'"), 'extension.ts should import from ./settings');
    assert.ok(source.includes('SettingsService'), 'extension.ts should reference SettingsService');
  });

  test('extension.ts should initialize SettingsService', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes('new SettingsService'), 'extension.ts should create SettingsService instance');
    assert.ok(source.includes('context.globalState'), 'extension.ts should pass globalState to SettingsService');
  });

  test('types.ts should import UserSettings', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("from './settings'"), 'types.ts should import from ./settings');
  });

  test('ExtToWebviewMessage init should include userSettings', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('userSettings?: UserSettings'), 'init message should include optional userSettings');
  });

  test('WebviewToExtMessage should have saveSettings type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'saveSettings'"), 'WebviewToExtMessage should have saveSettings type');
    assert.ok(source.includes('settings: Partial<UserSettings>'), 'saveSettings should have settings field');
  });

  test('webviewProvider.ts should import SettingsService', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes("from '../settings'"), 'webviewProvider.ts should import from ../settings');
  });

  test('webviewProvider.ts should have settingsService field', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('SettingsService'), 'webviewProvider.ts should reference SettingsService field');
  });

  test('webviewProvider.ts loadData should include userSettings in init message', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('userSettings'), 'loadData should include userSettings in init message');
    assert.ok(source.includes('getSettings'), 'loadData should call getSettings to retrieve user settings');
  });

  test('messageHandler.ts should import SettingsService', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("from '../settings'"), 'messageHandler.ts should import from ../settings');
  });

  test('messageHandler.ts should have handleSaveSettings function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('handleSaveSettings'), 'messageHandler.ts should have handleSaveSettings function');
  });

  test('messageHandler.ts handleSaveSettings should call settingsService.saveSettings', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const saveStart = source.indexOf('function handleSaveSettings');
    const saveEnd = source.indexOf('\n}', saveStart) + 2;
    const saveFn = source.substring(saveStart, saveEnd);

    assert.ok(saveFn.includes('saveSettings'), 'handleSaveSettings should call saveSettings');
  });

  test('messageHandler.ts should have saveSettings case in switch', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'saveSettings':"), 'messageHandler.ts should have saveSettings case');
  });
});
