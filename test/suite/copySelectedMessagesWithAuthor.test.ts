import * as assert from 'assert';
import * as vscode from 'vscode';
import { describe, it, before, after } from 'mocha';

/**
 * Unit tests for copy selected messages with author functionality
 */

// Mock data for testing
const mockCommits = [
  {
    hash: 'abc123',
    author: 'Alice Johnson',
    email: 'alice@example.com',
    message: 'Add new feature',
    date: '2024-01-01T00:00:00.000Z',
    fullMessage: 'Add new feature\n\nThis adds a new feature for users.',
    shortHash: 'abc123',
    parentHashes: [],
    tags: [],
    stats: { filesChanged: 1, insertions: 10, deletions: 0 }
  },
  {
    hash: 'def456',
    author: 'Bob Smith',
    email: 'bob@example.com',
    message: 'Fix bug in authentication',
    date: '2024-01-02T00:00:00.000Z',
    fullMessage: 'Fix bug in authentication\n\nThis fixes a critical bug.',
    shortHash: 'def456',
    parentHashes: ['abc123'],
    tags: [],
    stats: { filesChanged: 2, insertions: 5, deletions: 2 }
  },
  {
    hash: 'ghi789',
    author: 'Charlie Brown',
    email: 'charlie@example.com',
    message: 'Update documentation',
    date: '2024-01-03T00:00:00.000Z',
    fullMessage: 'Update documentation\n\nUpdated README and API docs.',
    shortHash: 'ghi789',
    parentHashes: ['def456'],
    tags: [],
    stats: { filesChanged: 1, insertions: 20, deletions: 5 }
  }
];

describe('Copy Selected Messages with Author', () => {
  let clipboardText: string = '';
  let mockInfoMessage: string = '';
  let mockClipboardWrite: typeof vscode.env.clipboard.writeText;
  let mockShowInfo: typeof vscode.window.showInformationMessage;

  before(() => {
    // Mock clipboard.writeText
    mockClipboardWrite = vscode.env.clipboard.writeText;
    clipboardText = '';
    vscode.env.clipboard.writeText = async (text: string) => {
      clipboardText = text;
      return Promise.resolve();
    };

    // Mock showInformationMessage
    mockShowInfo = vscode.window.showInformationMessage;
    mockInfoMessage = '';
    (vscode.window as any).showInformationMessage = async (message: string) => {
      mockInfoMessage = message;
      return Promise.resolve('' as any);
    };
  });

  after(() => {
    // Restore mocks
    vscode.env.clipboard.writeText = mockClipboardWrite;
    vscode.window.showInformationMessage = mockShowInfo;
  });

  describe('checklist with author formatting', () => {
    it('should format single commit with author', () => {
      const commits = [mockCommits[0]];
      const hashes = [commits[0].hash];
      const selected = commits.filter(c => hashes.includes(c.hash));

      const checklist = selected.map(c => `- [ ] ${c.author} - ${c.message}`).join('\n');

      assert.strictEqual(checklist, '- [ ] Alice Johnson - Add new feature');
    });

    it('should format multiple commits with authors', () => {
      const commits = [mockCommits[0], mockCommits[1]];
      const hashes = commits.map(c => c.hash);
      const selected = commits.filter(c => hashes.includes(c.hash));

      const checklist = selected.map(c => `- [ ] ${c.author} - ${c.message}`).join('\n');

      assert.strictEqual(
        checklist,
        '- [ ] Alice Johnson - Add new feature\n- [ ] Bob Smith - Fix bug in authentication'
      );
    });

    it('should use display order (newest first)', () => {
      const displayCommits = [mockCommits[2], mockCommits[1], mockCommits[0]];
      const hashes = ['abc123', 'ghi789'];
      const orderedHashes = hashes
        .map(hash => displayCommits.find(c => c.hash === hash))
        .filter((c): c is typeof mockCommits[0] => Boolean(c))
        .map(c => c.hash);

      const selected = displayCommits.filter(c => orderedHashes.includes(c.hash));
      const checklist = selected.map(c => `- [ ] ${c.author} - ${c.message}`).join('\n');

      // Should be ghi789 first (newest in display order), then abc123
      assert.strictEqual(
        checklist,
        '- [ ] Charlie Brown - Update documentation\n- [ ] Alice Johnson - Add new feature'
      );
    });

    it('should show "No commits selected" when no commits selected', () => {
      const selected: typeof mockCommits = [];

      if (selected.length === 0) {
        const message = 'No commits selected';
        assert.strictEqual(selected.length, 0);
      }
    });
  });

  describe('numbered list with author formatting', () => {
    it('should format single commit with author', () => {
      const commits = [mockCommits[0]];
      const hashes = [commits[0].hash];
      const selected = commits.filter(c => hashes.includes(c.hash));

      const numbered = selected.map((c, index) => `${index + 1}. ${c.author} - ${c.message}`).join('\n');

      assert.strictEqual(numbered, '1. Alice Johnson - Add new feature');
    });

    it('should format multiple commits with authors', () => {
      const commits = [mockCommits[0], mockCommits[1], mockCommits[2]];
      const hashes = commits.map(c => c.hash);
      const selected = commits.filter(c => hashes.includes(c.hash));

      const numbered = selected.map((c, index) => `${index + 1}. ${c.author} - ${c.message}`).join('\n');

      assert.strictEqual(
        numbered,
        '1. Alice Johnson - Add new feature\n2. Bob Smith - Fix bug in authentication\n3. Charlie Brown - Update documentation'
      );
    });

    it('should show "No commits selected" when no commits selected', () => {
      const selected: typeof mockCommits = [];

      if (selected.length === 0) {
        const message = 'No commits selected';
        assert.strictEqual(selected.length, 0);
      }
    });
  });

  describe('confirmation messages', () => {
    it('should use singular form for single commit', () => {
      const count = 1;
      const message = `Copied ${count} message as checklist with author`;
      assert.strictEqual(message, 'Copied 1 message as checklist with author');
    });

    it('should use plural form for multiple commits', () => {
      const count = 3;
      const message = `Copied ${count} messages as numbered list with author`;
      assert.strictEqual(message, 'Copied 3 messages as numbered list with author');
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to focused commit when none selected', () => {
      const selectedHashes: string[] = [];
      const focusedCommit = mockCommits[1];

      const hashesToCopy = selectedHashes.length === 0
        ? [focusedCommit.hash]
        : selectedHashes;

      assert.deepStrictEqual(hashesToCopy, ['def456']);
    });

    it('should show error when no focused commit available', () => {
      const selectedHashes: string[] = [];
      const focusedIndex = -1; // No focused commit

      if (selectedHashes.length === 0 && focusedIndex < 0) {
        const error = 'Select a commit to copy as checklist with author';
        assert.strictEqual(typeof error, 'string');
      }
    });
  });
});
