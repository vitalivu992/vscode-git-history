import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'node:test';

/**
 * E2E tests for Copy Selected Messages with Author functionality
 *
 * These tests verify that:
 * 1. Message types exist in src/types.ts
 * 2. Switch cases exist in src/webview/messageHandler.ts
 * 3. Handlers are called correctly
 * 4. Webview actions exist in src/types.ts
 * 5. triggerAction cases exist in src/webview/panel/main.js
 * 6. Commands are registered in src/extension.ts
 * 7. Keybindings are defined in package.json
 */

const ROOT_DIR = path.join(__dirname, '..', '..', '..');

describe('E2E: Copy Selected Messages with Author', () => {
  describe('src/types.ts', () => {
    let typesContent: string;

    before(() => {
      typesContent = fs.readFileSync(
        path.join(ROOT_DIR, 'src', 'types.ts'),
        'utf-8'
      );
    });

    it('should have copySelectedMessagesChecklistWithAuthor in WebviewToExtMessage', () => {
      assert.ok(
        typesContent.includes("type: 'copySelectedMessagesChecklistWithAuthor'"),
        'WebviewToExtMessage should include copySelectedMessagesChecklistWithAuthor type'
      );
    });

    it('should have copySelectedMessagesNumberedWithAuthor in WebviewToExtMessage', () => {
      assert.ok(
        typesContent.includes("type: 'copySelectedMessagesNumberedWithAuthor'"),
        'WebviewToExtMessage should include copySelectedMessagesNumberedWithAuthor type'
      );
    });

    it('should have copySelectedMessagesChecklistWithAuthor in WebviewAction', () => {
      assert.ok(
        typesContent.includes("'copySelectedMessagesChecklistWithAuthor'"),
        'WebviewAction should include copySelectedMessagesChecklistWithAuthor'
      );
    });

    it('should have copySelectedMessagesNumberedWithAuthor in WebviewAction', () => {
      assert.ok(
        typesContent.includes("'copySelectedMessagesNumberedWithAuthor'"),
        'WebviewAction should include copySelectedMessagesNumberedWithAuthor'
      );
    });
  });

  describe('src/extension.ts', () => {
    let extensionContent: string;

    before(() => {
      extensionContent = fs.readFileSync(
        path.join(ROOT_DIR, 'src', 'extension.ts'),
        'utf-8'
      );
    });

    it('should register copySelectedMessagesChecklistWithAuthor command', () => {
      assert.ok(
        extensionContent.includes("'gitHistory.copySelectedMessagesChecklistWithAuthor'"),
        'extension.ts should register gitHistory.copySelectedMessagesChecklistWithAuthor command'
      );
      assert.ok(
        extensionContent.includes("'copySelectedMessagesChecklistWithAuthor'"),
        'extension.ts should map to copySelectedMessagesChecklistWithAuthor action'
      );
    });

    it('should register copySelectedMessagesNumberedWithAuthor command', () => {
      assert.ok(
        extensionContent.includes("'gitHistory.copySelectedMessagesNumberedWithAuthor'"),
        'extension.ts should register gitHistory.copySelectedMessagesNumberedWithAuthor command'
      );
      assert.ok(
        extensionContent.includes("'copySelectedMessagesNumberedWithAuthor'"),
        'extension.ts should map to copySelectedMessagesNumberedWithAuthor action'
      );
    });
  });

  describe('src/webview/messageHandler.ts', () => {
    let messageHandlerContent: string;

    before(() => {
      messageHandlerContent = fs.readFileSync(
        path.join(ROOT_DIR, 'src', 'webview', 'messageHandler.ts'),
        'utf-8'
      );
    });

    it('should have handleCopySelectedMessagesChecklistWithAuthor function', () => {
      assert.ok(
        messageHandlerContent.includes('function handleCopySelectedMessagesChecklistWithAuthor'),
        'messageHandler.ts should have handleCopySelectedMessagesChecklistWithAuthor function'
      );
    });

    it('should have handleCopySelectedMessagesNumberedWithAuthor function', () => {
      assert.ok(
        messageHandlerContent.includes('function handleCopySelectedMessagesNumberedWithAuthor'),
        'messageHandler.ts should have handleCopySelectedMessagesNumberedWithAuthor function'
      );
    });

    it('should have switch case for copySelectedMessagesChecklistWithAuthor', () => {
      assert.ok(
        messageHandlerContent.includes("case 'copySelectedMessagesChecklistWithAuthor':"),
        'messageHandler.ts should have switch case for copySelectedMessagesChecklistWithAuthor'
      );
      assert.ok(
        messageHandlerContent.includes('handleCopySelectedMessagesChecklistWithAuthor(message.hashes, panel)'),
        'messageHandler.ts should call handleCopySelectedMessagesChecklistWithAuthor in switch case'
      );
    });

    it('should have switch case for copySelectedMessagesNumberedWithAuthor', () => {
      assert.ok(
        messageHandlerContent.includes("case 'copySelectedMessagesNumberedWithAuthor':"),
        'messageHandler.ts should have switch case for copySelectedMessagesNumberedWithAuthor'
      );
      assert.ok(
        messageHandlerContent.includes('handleCopySelectedMessagesNumberedWithAuthor(message.hashes, panel)'),
        'messageHandler.ts should call handleCopySelectedMessagesNumberedWithAuthor in switch case'
      );
    });

    it('should format checklist with author correctly', () => {
      assert.ok(
        messageHandlerContent.includes('`${c.author} - ${c.message}`'),
        'messageHandler.ts should format as "Author - message"'
      );
    });
  });

  describe('src/webview/panel/main.js', () => {
    let mainJsContent: string;

    before(() => {
      mainJsContent = fs.readFileSync(
        path.join(ROOT_DIR, 'src', 'webview', 'panel', 'main.js'),
        'utf-8'
      );
    });

    it('should have handleCopySelectedMessagesChecklistWithAuthor function', () => {
      assert.ok(
        mainJsContent.includes('function handleCopySelectedMessagesChecklistWithAuthor()'),
        'main.js should have handleCopySelectedMessagesChecklistWithAuthor function'
      );
    });

    it('should have handleCopySelectedMessagesNumberedWithAuthor function', () => {
      assert.ok(
        mainJsContent.includes('function handleCopySelectedMessagesNumberedWithAuthor()'),
        'main.js should have handleCopySelectedMessagesNumberedWithAuthor function'
      );
    });

    it('should have triggerAction case for copySelectedMessagesChecklistWithAuthor', () => {
      assert.ok(
        mainJsContent.includes("case 'copySelectedMessagesChecklistWithAuthor':"),
        'main.js should have triggerAction case for copySelectedMessagesChecklistWithAuthor'
      );
      assert.ok(
        mainJsContent.includes('handleCopySelectedMessagesChecklistWithAuthor();'),
        'main.js should call handleCopySelectedMessagesChecklistWithAuthor in triggerAction'
      );
    });

    it('should have triggerAction case for copySelectedMessagesNumberedWithAuthor', () => {
      assert.ok(
        mainJsContent.includes("case 'copySelectedMessagesNumberedWithAuthor':"),
        'main.js should have triggerAction case for copySelectedMessagesNumberedWithAuthor'
      );
      assert.ok(
        mainJsContent.includes('handleCopySelectedMessagesNumberedWithAuthor();'),
        'main.js should call handleCopySelectedMessagesNumberedWithAuthor in triggerAction'
      );
    });

    it('should have context menu item for copy-selected-messages-checklist-with-author', () => {
      assert.ok(
        mainJsContent.includes('copy-selected-messages-checklist-with-author'),
        'main.js should have context menu item for copy-selected-messages-checklist-with-author'
      );
    });

    it('should have context menu item for copy-selected-messages-numbered-with-author', () => {
      assert.ok(
        mainJsContent.includes('copy-selected-messages-numbered-with-author'),
        'main.js should have context menu item for copy-selected-messages-numbered-with-author'
      );
    });

    it('should have context menu event handler for copy-selected-messages-checklist-with-author', () => {
      assert.ok(
        mainJsContent.includes("action === 'copy-selected-messages-checklist-with-author'"),
        'main.js should handle copy-selected-messages-checklist-with-author action'
      );
      assert.ok(
        mainJsContent.includes('handleCopySelectedMessagesChecklistWithAuthor();'),
        'main.js should call handleCopySelectedMessagesChecklistWithAuthor() in context menu handler'
      );
    });

    it('should have context menu event handler for copy-selected-messages-numbered-with-author', () => {
      assert.ok(
        mainJsContent.includes("action === 'copy-selected-messages-numbered-with-author'"),
        'main.js should handle copy-selected-messages-numbered-with-author action'
      );
      assert.ok(
        mainJsContent.includes('handleCopySelectedMessagesNumberedWithAuthor();'),
        'main.js should call handleCopySelectedMessagesNumberedWithAuthor() in context menu handler'
      );
    });

    it('should post copySelectedMessagesChecklistWithAuthor message to extension', () => {
      assert.ok(
        mainJsContent.includes("{ type: 'copySelectedMessagesChecklistWithAuthor'"),
        'main.js should post copySelectedMessagesChecklistWithAuthor message'
      );
    });

    it('should post copySelectedMessagesNumberedWithAuthor message to extension', () => {
      assert.ok(
        mainJsContent.includes("{ type: 'copySelectedMessagesNumberedWithAuthor'"),
        'main.js should post copySelectedMessagesNumberedWithAuthor message'
      );
    });

    it('should show context menu items when 2+ commits selected', () => {
      assert.ok(
        mainJsContent.includes('selectedCommits.size > 1'),
        'main.js should conditionally show context menu items based on selection size'
      );
    });
  });

  describe('package.json', () => {
    let packageJson: any;

    before(() => {
      packageJson = JSON.parse(
        fs.readFileSync(
          path.join(ROOT_DIR, 'package.json'),
          'utf-8'
        )
      );
    });

    it('should have copySelectedMessagesChecklistWithAuthor command', () => {
      const command = packageJson.contributes.commands.find(
        (c: any) => c.command === 'gitHistory.copySelectedMessagesChecklistWithAuthor'
      );
      assert.ok(
        command,
        'package.json should have gitHistory.copySelectedMessagesChecklistWithAuthor command'
      );
      assert.strictEqual(
        command.title,
        'Git History: Copy Selected Messages as Checklist with Author'
      );
      assert.strictEqual(command.category, 'Git History');
    });

    it('should have copySelectedMessagesNumberedWithAuthor command', () => {
      const command = packageJson.contributes.commands.find(
        (c: any) => c.command === 'gitHistory.copySelectedMessagesNumberedWithAuthor'
      );
      assert.ok(
        command,
        'package.json should have gitHistory.copySelectedMessagesNumberedWithAuthor command'
      );
      assert.strictEqual(
        command.title,
        'Git History: Copy Selected Messages as Numbered List with Author'
      );
      assert.strictEqual(command.category, 'Git History');
    });

    it('should have keybinding for copySelectedMessagesChecklistWithAuthor', () => {
      const keybinding = packageJson.contributes.keybindings.find(
        (k: any) => k.command === 'gitHistory.copySelectedMessagesChecklistWithAuthor'
      );
      assert.ok(
        keybinding,
        'package.json should have keybinding for copySelectedMessagesChecklistWithAuthor'
      );
      assert.strictEqual(keybinding.key, 'ctrl+alt+z');
      assert.strictEqual(keybinding.mac, 'cmd+alt+z');
      assert.strictEqual(
        keybinding.when,
        'activeWebviewPanelId == gitHistory.webview'
      );
    });

    it('should have keybinding for copySelectedMessagesNumberedWithAuthor', () => {
      const keybinding = packageJson.contributes.keybindings.find(
        (k: any) => k.command === 'gitHistory.copySelectedMessagesNumberedWithAuthor'
      );
      assert.ok(
        keybinding,
        'package.json should have keybinding for copySelectedMessagesNumberedWithAuthor'
      );
      assert.strictEqual(keybinding.key, 'ctrl+alt+shift+z');
      assert.strictEqual(keybinding.mac, 'cmd+alt+shift+z');
      assert.strictEqual(
        keybinding.when,
        'activeWebviewPanelId == gitHistory.webview'
      );
    });
  });

  describe('README.md', () => {
    let readmeContent: string;

    before(() => {
      readmeContent = fs.readFileSync(
        path.join(ROOT_DIR, 'README.md'),
        'utf-8'
      );
    });

    it('should document Copy Selected Messages with Author feature', () => {
      assert.ok(
        readmeContent.includes('Copy Selected Messages with Author'),
        'README.md should document Copy Selected Messages with Author feature'
      );
    });

    it('should document checklist with author format', () => {
      assert.ok(
        readmeContent.includes('Checklist with Author') ||
        readmeContent.includes('checklist with author'),
        'README.md should document checklist with author format'
      );
    });

    it('should document numbered with author format', () => {
      assert.ok(
        readmeContent.includes('Numbered with Author') ||
        readmeContent.includes('numbered with author'),
        'README.md should document numbered with author format'
      );
    });

    it('should mention the format "Author - message"', () => {
      assert.ok(
        readmeContent.includes('Author - message') ||
        readmeContent.includes('author - message'),
        'README.md should mention the "Author - message" format'
      );
    });
  });
});
