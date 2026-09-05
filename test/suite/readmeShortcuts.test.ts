import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Cross-checks the keyboard shortcuts documented in USAGE.md against the
 * keybindings declared in package.json.
 *
 * The detailed keyboard-shortcut and context-menu reference lives in USAGE.md
 * (moved out of README.md when the docs were split into topic guides). These
 * tests read that current structure rather than README.md.
 */

// --- helpers --------------------------------------------------------------

/** Locate the repo root relative to this compiled test file. */
const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRel(rel: string): string {
  return fs.readFileSync(path.resolve(repoRoot, rel), 'utf-8');
}

interface KeyBinding {
  command: string;
  key?: string;
  mac?: string;
  when?: string;
}

/** Normalize a key string for comparison: lowercase, no spaces, cmd==ctrl, ? == shift+/. */
function normKey(k: string): string {
  let v = k.toLowerCase().replace(/\s+/g, '');
  v = v.replace(/\bcmd\b/g, 'ctrl');
  if (v === '?') {
    v = 'shift+/';
  }
  return v;
}

/** True for keys that look like a VS Code keybinding (has a modifier or is an F-key). */
function isVsCodeKey(tok: string): boolean {
  const t = tok.toLowerCase();
  return t.includes('ctrl') || t.includes('cmd') || /^f\d{1,2}$/.test(t);
}

// Keys documented in the tables but handled inside the webview's keydown
// handler rather than registered through package.json keybindings. These have
// no package.json entry by design.
const INTERNAL_KEYS = new Set(
  ['↑', '↓', 'home', 'end', 'pagedown', 'pageup', 'enter', 'shift+enter', 'escape',
    'ctrl+a', 'cmd+a', 'ctrl+enter', 'cmd+enter', '/'].map(normKey)
);

/** Extract `(keyToken, action)` pairs from the USAGE.md keyboard-shortcut tables. */
function extractDocumentedShortcuts(ksSection: string): Array<{ token: string; action: string }> {
  const out: Array<{ token: string; action: string }> = [];
  for (const line of ksSection.split('\n')) {
    if (!line.includes('|')) continue;            // only table rows
    if (/Keybinding|Action/.test(line) && /---/.test(line)) continue; // separator
    if (/^\s*\|\s*Keybinding/.test(line)) continue;                   // header
    const tokens = line.match(/`([^`]+)`/g) || [];
    if (tokens.length === 0) continue;
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    const action = cells[cells.length - 1].replace(/\s*\*?\*?†\*?\*?\s*$/, '').trim();
    for (const rawTok of tokens) {
      out.push({ token: rawTok.replace(/`/g, '').trim(), action });
    }
  }
  return out;
}

// Keybindings that were removed as part of the commit-table feature removal.
// They must stay out of both USAGE.md and package.json.
const REMOVED_BINDINGS = [
  'ctrl+alt+t',          // toggle graph
  'ctrl+shift+alt+t',    // toggle stats
  'ctrl+shift+c',        // copy commit message
  'ctrl+shift+s',        // copy stats
  'ctrl+shift+9',        // copy diff stat summary
  'ctrl+alt+w',          // copy message with stats
  'f4',                  // copy files changed count
  'ctrl+shift+5',        // copy filter query
  'ctrl+shift+4',        // paste filter query
  'ctrl+alt+shift+l',    // copy filter as git log command
  // 'ctrl+alt+p' was on this list (quick compare with parent was removed with
  // the commit table) but the feature was re-introduced deliberately — see
  // gitHistory.compareWithParent — so the chord is bound again.
  'ctrl+shift+o',        // export filtered commits
  'ctrl+shift+alt+e',    // export mbox
  'ctrl+shift+0',        // save filter preset
  'ctrl+shift+1',        // load filter preset
  'f2',                  // rename preset
].map(normKey);

// --- suite ----------------------------------------------------------------

suite('readmeShortcuts', () => {
  let usageContent: string;
  let readmeContent: string;
  let featuresContent: string;
  let pkg: any;

  suiteSetup(() => {
    usageContent = readRel('USAGE.md');
    readmeContent = readRel('README.md');
    featuresContent = readRel('FEATURES.md');
    pkg = JSON.parse(readRel('package.json'));
  });

  test('USAGE.md has a Keyboard Shortcuts section', () => {
    assert.ok(/## Keyboard Shortcuts/.test(usageContent),
      'USAGE.md should contain a ## Keyboard Shortcuts section');
  });

  test('every documented VS Code keybinding has a matching package.json keybinding', () => {
    const ksMatch = usageContent.match(/## Keyboard Shortcuts\n([\s\S]*)(?:\n## |$)/);
    assert.ok(ksMatch, 'Keyboard Shortcuts section should be parseable');
    const documented = extractDocumentedShortcuts(ksMatch![1]);

    const allKeybindings: KeyBinding[] = pkg.contributes?.keybindings || [];
    const pkgKeySet = new Set<string>();
    for (const b of allKeybindings) {
      if (b.key) pkgKeySet.add(normKey(b.key));
      if (b.mac) pkgKeySet.add(normKey(b.mac));
    }

    const missing: string[] = [];
    for (const { token, action } of documented) {
      const n = normKey(token);
      if (INTERNAL_KEYS.has(n)) continue;          // webview-internal, no pkg binding
      if (!isVsCodeKey(token)) continue;           // arrows / special keys
      if (!pkgKeySet.has(n)) {
        missing.push(`${token}  (${action})`);
      }
    }
    assert.strictEqual(missing.length, 0,
      `Documented keybindings with no package.json entry:\n${missing.join('\n')}`);
  });

  test('every package.json webview keybinding is documented (by key or command title)', () => {
    const ksMatch = usageContent.match(/## Keyboard Shortcuts\n([\s\S]*)(?:\n## |$)/);
    const documented = extractDocumentedShortcuts(ksMatch ? ksMatch[1] : '');
    const documentedKeys = new Set(documented.map(d => normKey(d.token)));

    const commands = new Map<string, string>();
    for (const c of (pkg.contributes?.commands || [])) {
      commands.set(c.command, c.title || '');
    }
    // Command titles and names may live in USAGE context menus, FEATURES, or README.
    const corpus = `${usageContent}\n${featuresContent}\n${readmeContent}`;

    const allKeybindings: KeyBinding[] = pkg.contributes?.keybindings || [];
    const webviewBindings = allKeybindings.filter(b => (b.when || '').includes('gitHistory.webview'));

    const unexplained: string[] = [];
    for (const b of webviewBindings) {
      const nk = b.key ? normKey(b.key) : '';
      const nm = b.mac ? normKey(b.mac) : '';
      if (documentedKeys.has(nk) || documentedKeys.has(nm)) continue; // documented by key
      // Fallback: the action is documented elsewhere by its command title or name.
      const title = commands.get(b.command) || '';
      const bare = b.command.replace(/^gitHistory\./, '');
      const covered = (title && corpus.includes(title)) ||
        corpus.includes(bare) ||
        corpus.toLowerCase().includes(bare.toLowerCase());
      if (!covered) {
        unexplained.push(`${b.key || ''}/${b.mac || ''} (${b.command})`);
      }
    }
    assert.strictEqual(unexplained.length, 0,
      `package.json webview keybindings with no documentation:\n${unexplained.join('\n')}`);
  });

  test('removed-feature keybindings are absent from package.json and USAGE.md', () => {
    const allKeybindings: KeyBinding[] = pkg.contributes?.keybindings || [];
    const pkgKeys = new Set<string>();
    for (const b of allKeybindings) {
      if (b.key) pkgKeys.add(normKey(b.key));
      if (b.mac) pkgKeys.add(normKey(b.mac));
    }

    const ksMatch = usageContent.match(/## Keyboard Shortcuts\n([\s\S]*)(?:\n## |$)/);
    const documentedKeys = new Set(
      extractDocumentedShortcuts(ksMatch ? ksMatch[1] : '').map(d => normKey(d.token))
    );

    const leakedPkg = REMOVED_BINDINGS.filter(k => pkgKeys.has(k));
    const leakedDoc = REMOVED_BINDINGS.filter(k => documentedKeys.has(k));
    assert.strictEqual(leakedPkg.length, 0,
      `Removed keybindings still present in package.json: ${leakedPkg.join(', ')}`);
    assert.strictEqual(leakedDoc.length, 0,
      `Removed keybindings still documented in USAGE.md: ${leakedDoc.join(', ')}`);
  });
});
