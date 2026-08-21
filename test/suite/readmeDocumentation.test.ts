import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Documentation structure tests.
 *
 * README.md is a thin landing page that links out to topic guides. The detailed
 * keyboard-shortcut, context-menu, settings, and feature reference content now
 * lives in USAGE.md / CONFIGURATION.md / FEATURES.md / ARCHITECTURE.md. These
 * tests assert the CURRENT doc layout (after the doc split) so they pass.
 *
 * All assertions live inside `test(...)` bodies; file reads happen in
 * `suiteSetup(...)` — nothing throws at suite-definition time.
 */

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRel(rel: string): string {
  return fs.readFileSync(path.resolve(repoRoot, rel), 'utf-8');
}

suite('README Documentation Comprehensive Tests', () => {
  let readmeContent: string;
  let usageContent: string;
  let configurationContent: string;
  let packageJson: any;

  suiteSetup(() => {
    readmeContent = readRel('README.md');
    usageContent = readRel('USAGE.md');
    configurationContent = readRel('CONFIGURATION.md');
    packageJson = JSON.parse(readRel('package.json'));
  });

  suite('README structure', () => {
    test('README has its top-level landing sections', () => {
      const requiredSections = [
        '## Documentation',
        '## Installation',
        '## Requirements',
        '## License',
        '## Issues',
      ];
      for (const section of requiredSections) {
        assert.ok(readmeContent.includes(section),
          `README should have a ${section} section`);
      }
    });

    test('README documents File History and Selection History', () => {
      assert.ok(readmeContent.includes('### File History'),
        'README should have a File History section');
      assert.ok(readmeContent.includes('### Selection History'),
        'README should have a Selection History section');
    });

    test('README License section states MIT', () => {
      const licenseIdx = readmeContent.indexOf('## License');
      assert.ok(licenseIdx >= 0, 'README should have a License section');
      const slice = readmeContent.slice(licenseIdx, licenseIdx + 80);
      assert.ok(/MIT/.test(slice), 'README License section should state MIT');
    });
  });

  suite('Documentation topic-guide links', () => {
    test('README links to each topic guide', () => {
      const guides = ['FEATURES.md', 'ARCHITECTURE.md', 'USAGE.md', 'CONFIGURATION.md', 'CHANGELOG.md'];
      for (const guide of guides) {
        assert.ok(readmeContent.includes(`](${guide})`),
          `README should link to ${guide}`);
      }
    });

    test('README links to the Issues page', () => {
      assert.ok(/issues/.test(readmeContent),
        'README should link to the issues page');
    });
  });

  suite('Content moved to topic guides', () => {
    test('USAGE.md holds the keyboard shortcuts and context menus', () => {
      assert.ok(/## Keyboard Shortcuts/.test(usageContent),
        'USAGE.md should contain the Keyboard Shortcuts section');
      assert.ok(/## Context Menus/.test(usageContent),
        'USAGE.md should contain the Context Menus section');
    });

    test('USAGE.md context menus include surviving actions', () => {
      const ctxMatch = usageContent.match(/Commit Row Context Menu:[\s\S]*?(?=\*\*Changed Files|\n## )/);
      assert.ok(ctxMatch, 'USAGE.md should have a Commit Row Context Menu section');
      const section = ctxMatch![0];
      for (const action of ['Copy commit hash', 'Copy commit info', 'Cherry-pick commit', 'Revert commit']) {
        assert.ok(section.includes(action),
          `Commit Row Context Menu should include ${action}`);
      }
    });

    test('USAGE.md context menus omit removed actions', () => {
      const ctxMatch = usageContent.match(/Commit Row Context Menu:[\s\S]*?(?=\*\*Changed Files|\n## )/);
      const section = ctxMatch ? ctxMatch[0] : '';
      for (const removed of ['Copy commit message', 'Copy stats', 'Copy diff stat summary',
        'Copy files changed count', 'Copy file stats', 'Copy message with stats',
        'Compare with parent']) {
        assert.ok(!section.includes(removed),
          `Commit Row Context Menu should no longer list ${removed}`);
      }
    });
  });

  suite('Configuration documentation', () => {
    test('CONFIGURATION.md documents every package.json setting', () => {
      const properties = Object.keys(packageJson.contributes?.configuration?.properties || {});
      const configSettings = properties.filter(p => p.startsWith('gitHistory.'));
      for (const prop of configSettings) {
        assert.ok(configurationContent.includes(prop),
          `CONFIGURATION.md should document ${prop}`);
      }
    });

    test('CONFIGURATION.md documents the surviving settings and not the removed graph setting', () => {
      for (const setting of ['gitHistory.maxCommits', 'gitHistory.hideMergeCommits', 'gitHistory.showSignatures']) {
        assert.ok(configurationContent.includes(setting),
          `CONFIGURATION.md should document ${setting}`);
      }
      assert.ok(!configurationContent.includes('gitHistory.showGraph'),
        'CONFIGURATION.md should no longer document the removed gitHistory.showGraph setting');
    });
  });
});
