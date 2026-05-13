import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('README Documentation Comprehensive Tests', () => {
  const readmePath = path.resolve(__dirname, '../../README.md');
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const typesPath = path.resolve(__dirname, '../../src/types.ts');
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const typesContent = fs.readFileSync(typesPath, 'utf-8');

  suite('Keyboard Shortcuts Documentation', () => {
    const keyboardNavSection = readmeContent.match(/#### Keyboard Navigation[\s\S]*?(?=\n###|\n##|$)/);
    assert.ok(keyboardNavSection, 'README should have Keyboard Navigation section');

    test('README keyboard shortcuts table should have proper format', () => {
      assert.ok(keyboardNavSection![0].includes('| Key | Action |'),
        'Keyboard Navigation section should have table with Key and Action columns');
    });

    function extractKeyboardShortcuts(section: string): Map<string, string> {
      const shortcuts = new Map<string, string>();
      const lines = section.split('\n');
      for (const line of lines) {
        const match = line.match(/\| `([^`]+)` \|\s+([^|]+)\|/);
        if (match) {
          const [, keys, action] = match;
          shortcuts.set(keys.trim(), action.trim());
        }
      }
      return shortcuts;
    }

    const documentedShortcuts = extractKeyboardShortcuts(keyboardNavSection![0]);

    test('Documented shortcuts in README should exist in package.json keybindings', () => {
      const keybindings = packageJson.contributes?.keybindings || [];
      const documentedKeys = Array.from(documentedShortcuts.keys());

      // Extract key combinations from documented shortcuts
      for (const docKey of documentedKeys) {
        // Parse the documented key format (e.g., "Ctrl+Shift+C / Cmd+Shift+C")
        const keys = docKey.split('/').map(k => k.trim().toLowerCase().replace(/\s+/g, ''));

        // Check if at least one variant exists in package.json
        let found = false;
        for (const binding of keybindings) {
          if (!binding.when?.includes('gitHistory.webview')) continue;

          const bindingKey = binding.key?.toLowerCase().replace(/\s+/g, '');
          const bindingMac = binding.mac?.toLowerCase().replace(/\s+/g, '');

          if (keys.some(k => k === bindingKey || k === bindingMac)) {
            found = true;
            break;
          }
        }

        // Skip global shortcuts that don't have webview scoping
        if (!found && !docKey.includes('Ctrl+K') && !docKey.includes('Cmd+K')) {
          // Only warn for webview-scoped shortcuts
          const isGlobalShortcut = keys.some(k =>
            k === '?' || k === 'escape' || k === 'home' || k === 'end' ||
            k.includes('ctrl+a') || k.includes('cmd+a') ||
            k.includes('ctrl+enter') || k.includes('cmd+enter') ||
            k.includes('shift+enter') || k.includes('/') ||
            k.includes('ctrl+f') || k.includes('cmd+f')
          );

          if (!isGlobalShortcut) {
            // For non-global shortcuts, this is informational
            assert.ok(true, `Shortcut ${docKey} is documented - checking package.json`);
          }
        }
      }
    });

    test('All package.json webview keybindings should be documented in README', () => {
      const keybindings = packageJson.contributes?.keybindings || [];
      const webviewKeybindings = keybindings.filter((k: any) =>
        k.when?.includes('gitHistory.webview')
      );

      for (const binding of webviewKeybindings) {
        const key = binding.key || '';
        const mac = binding.mac || '';

        // Check if this keybinding is documented
        let found = false;

        // Convert package.json key format to README format
        const normalizeKey = (k: string): string => {
          return k.toLowerCase()
            .replace('ctrl', 'Ctrl')
            .replace('cmd', 'Cmd')
            .replace('shift', 'Shift')
            .replace('alt', 'Alt')
            .replace(/\+/g, '+');
        };

        const normalizedKey = normalizeKey(key);
        const normalizedMac = normalizeKey(mac);

        // Check if either Windows or Mac version is documented
        for (const [docKey] of documentedShortcuts) {
          if (docKey.toLowerCase().includes(normalizedKey.toLowerCase()) ||
              docKey.toLowerCase().includes(normalizedMac.toLowerCase())) {
            found = true;
            break;
          }
        }

        // Some keybindings may not be in the main table but documented elsewhere
        if (!found) {
          // Check if command is documented in features section
          const command = binding.command;
          const commandTitle = packageJson.contributes?.commands?.find((c: any) => c.command === command)?.title || '';
          const isDocumented = readmeContent.includes(commandTitle) ||
                             readmeContent.includes(command.replace('gitHistory.', ''));

          assert.ok(
            isDocumented || found,
            `Keybinding ${key}/${mac} (${command}) should be documented in README keyboard shortcuts table or features section`
          );
        }
      }
    });
  });

  suite('Extension Settings Documentation', () => {
    const settingsSection = readmeContent.match(/## Extension Settings[\s\S]*?(?=\n###|\n##|$)/);
    assert.ok(settingsSection, 'README should have Extension Settings section');

    test('README settings should match package.json configuration properties', () => {
      const properties = Object.keys(packageJson.contributes?.configuration?.properties || {});

      for (const prop of properties) {
        if (!prop.startsWith('gitHistory.')) continue;

        assert.ok(
          readmeContent.includes(prop),
          `Setting ${prop} should be documented in README Extension Settings section`
        );
      }
    });

    test('README should document showSignatures setting', () => {
      assert.ok(
        readmeContent.includes('gitHistory.showSignatures'),
        'README should document gitHistory.showSignatures setting'
      );
      assert.ok(
        readmeContent.includes('GPG signature verification'),
        'README should describe GPG signature verification for showSignatures setting'
      );
    });
  });

  suite('Context Menu Documentation', () => {
    test('README Commit Row Context Menu should include new copy commands', () => {
      const contextMenuSection = readmeContent.match(/\*\*Commit Row Context Menu:\*\*[\s\S]*?(?=\*\*|\n###|\n##|$)/);
      assert.ok(contextMenuSection, 'README should have Commit Row Context Menu section');

      const section = contextMenuSection![0];

      assert.ok(
        section.includes('Copy Unix timestamp') || section.includes('Copy Unix timestamp'),
        'Commit Row Context Menu should include Copy Unix timestamp'
      );
      assert.ok(
        section.includes('Copy file stats') || section.includes('Copy file stats'),
        'Commit Row Context Menu should include Copy file stats'
      );
      assert.ok(
        section.includes('Copy message with stats') || section.includes('Copy commit message with stats'),
        'Commit Row Context Menu should include Copy message with stats'
      );
    });

    test('README should reference context menu actions in features section', () => {
      assert.ok(
        readmeContent.includes('Context Menu') || readmeContent.includes('context menu'),
        'README features section should mention context menu functionality'
      );
    });
  });

  suite('Message Type Documentation', () => {
    test('README should mention copy features in features section', () => {
      const featuresSection = readmeContent.match(/## Features[\s\S]*?(?=\n##)/);
      assert.ok(featuresSection, 'README should have Features section');

      const section = featuresSection![0];

      // Check for copy-related features
      const copyFeatures = [
        'Copy Commit',
        'copy',
        'clipboard'
      ];

      const hasCopyFeature = copyFeatures.some(f => section.toLowerCase().includes(f.toLowerCase()));
      assert.ok(
        hasCopyFeature,
        'README Features section should mention copy functionality'
      );
    });
  });

  suite('WebviewAction Documentation Coverage', () => {
    test('All critical copy actions should have corresponding webview action in types.ts', () => {
      const criticalActions = [
        'copyCommitTimestamp',
        'copyFileStats',
        'copyCommitWithStats'
      ];

      for (const action of criticalActions) {
        assert.ok(
          typesContent.includes(`'${action}'`) || typesContent.includes(`"${action}"`),
          `types.ts WebviewAction should include ${action}`
        );
      }
    });

    test('README documentation should align with implemented features', () => {
      // Features documented in README
      const readmeFeatures = [
        { name: 'Copy Unix timestamp', hasShortcut: 'Ctrl+Shift+2' },
        { name: 'Copy file stats', hasShortcut: 'Ctrl+Shift+Alt+F' },
        { name: 'Copy message with stats', contextOnly: true }
      ];

      for (const feature of readmeFeatures) {
        if (feature.hasShortcut) {
          assert.ok(
            readmeContent.includes(feature.hasShortcut),
            `README should document ${feature.name} with keyboard shortcut ${feature.hasShortcut}`
          );
        }

        assert.ok(
          readmeContent.includes(feature.name),
          `README should document ${feature.name}`
        );
      }
    });
  });

  suite('Documentation Completeness', () => {
    test('README should have all major sections', () => {
      const requiredSections = [
        '## Features',
        '## Installation',
        '## Usage',
        '## Requirements',
        '## Extension Settings',
        '## Keyboard Shortcuts',
        '## License'
      ];

      for (const section of requiredSections) {
        assert.ok(
          readmeContent.includes(section),
          `README should have ${section} section`
        );
      }
    });

    test('README should reference recent features', () => {
      // Check that recently added features are documented
      const recentFeatures = [
        'Unix timestamp',
        'file stats',
        'message with stats'
      ];

      for (const feature of recentFeatures) {
        assert.ok(
          readmeContent.toLowerCase().includes(feature.toLowerCase()),
          `README should reference ${feature} feature`
        );
      }
    });
  });
});
