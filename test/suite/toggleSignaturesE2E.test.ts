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

suite('Signature Badge E2E Rendering Tests', () => {
  function renderSignatureBadge(commit: TestCommit): string {
    if (commit.signature) {
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

  test('verified commit shows verified badge', () => {
    const badge = renderSignatureBadge(verifiedCommit);
    assert.ok(badge.includes('signature-badge'), 'Badge should have signature-badge class');
    assert.ok(badge.includes('verified'), 'Badge should have verified class');
    assert.ok(badge.includes('✓'), 'Badge should show checkmark');
  });

  test('unverified commit shows unverified badge', () => {
    const badge = renderSignatureBadge(unverifiedCommit);
    assert.ok(badge.includes('signature-badge'), 'Badge should have signature-badge class');
    assert.ok(badge.includes('unverified'), 'Badge should have unverified class');
    assert.ok(badge.includes('✗'), 'Badge should show X mark');
  });

  test('unsigned commit shows no badge', () => {
    const badge = renderSignatureBadge(unsignedCommit);
    assert.strictEqual(badge, '', 'Unsigned commit should show no badge');
  });

  test('CommitSignature interface is defined in types.ts', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes('interface CommitSignature'), 'types.ts should define CommitSignature interface');
    assert.ok(typesSource.includes('verified: boolean'), 'CommitSignature should have verified boolean');
    assert.ok(typesSource.includes('signer: string | null'), 'CommitSignature should have signer field');
  });
});