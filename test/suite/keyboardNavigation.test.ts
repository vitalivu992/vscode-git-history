import * as assert from 'assert';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  tags?: string[];
}

// Simulates the getFilteredCommits function from main.js
function getFilteredCommits(commits: TestCommit[], searchQuery: string): TestCommit[] {
  if (!searchQuery) return commits;
  const query = searchQuery.toLowerCase();
  return commits.filter(commit =>
    commit.hash.toLowerCase().includes(query) ||
    commit.shortHash.toLowerCase().includes(query) ||
    commit.author.toLowerCase().includes(query) ||
    commit.email.toLowerCase().includes(query) ||
    commit.message.toLowerCase().includes(query) ||
    (commit.tags && commit.tags.some(t => t.toLowerCase().includes(query)))
  );
}

// Simulates keyboard navigation logic
class KeyboardNavigator {
  focusedIndex = -1;

  navigateDown(maxIndex: number): void {
    if (this.focusedIndex < maxIndex) {
      this.focusedIndex++;
    } else {
      this.focusedIndex = 0; // Wrap to top
    }
  }

  navigateUp(maxIndex: number): void {
    if (this.focusedIndex > 0) {
      this.focusedIndex--;
    } else {
      this.focusedIndex = maxIndex; // Wrap to bottom
    }
  }

  goToFirst(): void {
    this.focusedIndex = 0;
  }

  goToLast(maxIndex: number): void {
    this.focusedIndex = maxIndex;
  }

  pageDown(maxIndex: number, pageSize: number = 10): void {
    if (this.focusedIndex < maxIndex) {
      this.focusedIndex = Math.min(this.focusedIndex + pageSize, maxIndex);
    } else {
      this.focusedIndex = maxIndex;
    }
  }

  pageUp(maxIndex: number, pageSize: number = 10): void {
    if (this.focusedIndex > 0) {
      this.focusedIndex = Math.max(this.focusedIndex - pageSize, 0);
    } else {
      this.focusedIndex = 0;
    }
  }

  reset(): void {
    this.focusedIndex = -1;
  }

  getFocusedCommit<T>(commits: T[]): T | null {
    if (this.focusedIndex >= 0 && this.focusedIndex < commits.length) {
      return commits[this.focusedIndex];
    }
    return null;
  }
}

suite('Keyboard Navigation Logic Tests', () => {
  const commits: TestCommit[] = [
    { hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', shortHash: 'aaaaaaa', author: 'Alice', email: 'alice@example.com', message: 'First commit', tags: ['v1.0.0'] },
    { hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', shortHash: 'bbbbbbb', author: 'Bob', email: 'bob@example.com', message: 'Second commit', tags: [] },
    { hash: 'cccccccccccccccccccccccccccccccccccccccc', shortHash: 'ccccccc', author: 'Charlie', email: 'charlie@example.com', message: 'Third commit', tags: undefined },
    { hash: 'dddddddddddddddddddddddddddddddddddddddd', shortHash: 'ddddddd', author: 'Diana', email: 'diana@example.com', message: 'Fourth commit', tags: ['v2.0.0'] }
  ];

  test('initial focused index should be -1', () => {
    const navigator = new KeyboardNavigator();
    assert.strictEqual(navigator.focusedIndex, -1);
  });

  test('ArrowDown from -1 should go to 0', () => {
    const navigator = new KeyboardNavigator();
    navigator.navigateDown(commits.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('ArrowDown should increment index', () => {
    const navigator = new KeyboardNavigator();
    navigator.navigateDown(commits.length - 1); // 0
    navigator.navigateDown(commits.length - 1); // 1
    navigator.navigateDown(commits.length - 1); // 2
    assert.strictEqual(navigator.focusedIndex, 2);
  });

  test('ArrowDown at last index should wrap to 0', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = commits.length - 1; // 3
    navigator.navigateDown(commits.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('ArrowUp should decrement index', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 2;
    navigator.navigateUp(commits.length - 1);
    assert.strictEqual(navigator.focusedIndex, 1);
  });

  test('ArrowUp at 0 should wrap to last index', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 0;
    navigator.navigateUp(commits.length - 1);
    assert.strictEqual(navigator.focusedIndex, commits.length - 1);
  });

  test('Home should go to first commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 3;
    navigator.goToFirst();
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('End should go to last commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.goToLast(commits.length - 1);
    assert.strictEqual(navigator.focusedIndex, commits.length - 1);
  });

  test('PageDown should move down by 10 commits', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 0;
    navigator.pageDown(20); // Assume 21 commits (0-20)
    assert.strictEqual(navigator.focusedIndex, 10);
  });

  test('PageDown from last commit stays at last commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.goToLast(20);
    navigator.pageDown(20);
    assert.strictEqual(navigator.focusedIndex, 20);
  });

  test('PageDown near end stops at last commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 15;
    navigator.pageDown(20); // Only 5 more commits to go
    assert.strictEqual(navigator.focusedIndex, 20);
  });

  test('PageUp should move up by 10 commits', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 15;
    navigator.pageUp(20);
    assert.strictEqual(navigator.focusedIndex, 5);
  });

  test('PageUp from first commit stays at first commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 0;
    navigator.pageUp(20);
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('PageUp near start stops at first commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 5;
    navigator.pageUp(20); // Only 5 commits above
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('PageUp/PageDown with less than 10 commits handles boundaries', () => {
    const smallListMax = 3; // Only 4 commits (0-3)
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 0;
    navigator.pageDown(smallListMax);
    assert.strictEqual(navigator.focusedIndex, 3); // Should stop at last
    navigator.pageUp(smallListMax);
    assert.strictEqual(navigator.focusedIndex, 0); // Should stop at first
  });

  test('PageUp/PageDown with filtered commits works correctly', () => {
    const filtered = getFilteredCommits(commits, 'bob');
    assert.strictEqual(filtered.length, 1);

    const navigator = new KeyboardNavigator();
    navigator.pageDown(filtered.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0);
    assert.strictEqual(navigator.getFocusedCommit(filtered)?.author, 'Bob');
  });

  test('reset should set index to -1', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 2;
    navigator.reset();
    assert.strictEqual(navigator.focusedIndex, -1);
  });

  test('getFocusedCommit should return correct commit', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 1;
    const focused = navigator.getFocusedCommit(commits);
    assert.strictEqual(focused?.author, 'Bob');
  });

  test('getFocusedCommit should return null when index is -1', () => {
    const navigator = new KeyboardNavigator();
    const focused = navigator.getFocusedCommit(commits);
    assert.strictEqual(focused, null);
  });

  test('getFocusedCommit should return null when index is out of bounds', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 10;
    const focused = navigator.getFocusedCommit(commits);
    assert.strictEqual(focused, null);
  });

  test('navigation with filtered commits should work correctly', () => {
    const filtered = getFilteredCommits(commits, 'bob');
    assert.strictEqual(filtered.length, 1);

    const navigator = new KeyboardNavigator();
    navigator.navigateDown(filtered.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0);
    assert.strictEqual(navigator.getFocusedCommit(filtered)?.author, 'Bob');
  });

  test('focused index should reset when search changes', () => {
    const navigator = new KeyboardNavigator();
    navigator.focusedIndex = 2;

    // Simulate search change - reset focus
    navigator.reset();
    assert.strictEqual(navigator.focusedIndex, -1);
  });

  test('navigation should handle empty filtered list', () => {
    const emptyCommits: TestCommit[] = [];
    const navigator = new KeyboardNavigator();

    // Should not throw
    navigator.navigateDown(-1);
    assert.strictEqual(navigator.focusedIndex, 0); // Tries to wrap but max is -1

    // Re-adjust for empty list
    navigator.focusedIndex = -1;
    assert.strictEqual(navigator.getFocusedCommit(emptyCommits), null);
  });

  test('wrapping navigation with single item', () => {
    const singleCommit: TestCommit[] = [commits[0]];
    const navigator = new KeyboardNavigator();

    navigator.navigateDown(singleCommit.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0);

    navigator.navigateDown(singleCommit.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0); // Wraps to same position

    navigator.navigateUp(singleCommit.length - 1);
    assert.strictEqual(navigator.focusedIndex, 0); // Wraps to same position
  });
});

suite('Keyboard Navigation Source Verification', () => {
  test('main.js should have handleKeyDown function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleKeyDown'), 'main.js should have handleKeyDown function');
  });

  test('main.js should have getFilteredCommits function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function getFilteredCommits'), 'main.js should have getFilteredCommits function');
  });

  test('main.js should have updateFocusedRow function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function updateFocusedRow'), 'main.js should have updateFocusedRow function');
  });

  test('main.js should have scrollFocusedIntoView function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function scrollFocusedIntoView'), 'main.js should have scrollFocusedIntoView function');
  });

  test('main.js should track focusedIndex state', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let focusedIndex'), 'main.js should have focusedIndex state variable');
  });

  test('main.js should handle ArrowDown key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'ArrowDown':") || source.includes('ArrowDown'),
      'main.js should handle ArrowDown key');
  });

  test('main.js should handle ArrowUp key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'ArrowUp':") || source.includes('ArrowUp'),
      'main.js should handle ArrowUp key');
  });

  test('main.js should handle Enter key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'Enter':") || source.includes('Enter'),
      'main.js should handle Enter key');
  });

  test('main.js should handle Escape key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'Escape':") || source.includes('Escape'),
      'main.js should handle Escape key');
  });

  test('main.js should handle Home key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'Home':"),
      'main.js should handle Home key');
  });

  test('main.js should handle End key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'End':"),
      'main.js should handle End key');
  });

  test('main.js should handle PageDown key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'PageDown':"),
      'main.js should handle PageDown key');
  });

  test('main.js should handle PageUp key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'PageUp':"),
      'main.js should handle PageUp key');
  });

  test('main.js should handle / key for search focus', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === '/'"),
      'main.js should handle / key for search focus');
  });

  test('main.js should add data-index attribute to rows', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('tr.dataset.index'),
      'main.js should set data-index on table rows');
  });

  test('main.js should update focused index on mouse click', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('focusedIndex = index'),
      'main.js should update focusedIndex on mouse click');
  });
});

suite('Keyboard Navigation CSS Verification', () => {
  test('styles.css should have .focused class', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.focused'),
      'styles.css should have .focused class for keyboard navigation');
  });

  test('.focused class should have outline styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('outline:') && source.includes('.focused'),
      '.focused class should define outline for focus indicator');
  });

  test('should have distinct styling for focused.selected combination', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.focused.selected') || source.includes('.selected.focused'),
      'styles.css should handle focused+selected combination');
  });
});

// Need to import path for the source verification tests
import * as path from 'path';
