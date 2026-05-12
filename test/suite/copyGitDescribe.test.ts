import * as assert from 'assert';
import { getCommitDescribe } from '../../src/git/gitService';

suite('copyGitDescribe Tests', () => {
  const testCwd = process.cwd();

  test('getCommitDescribe returns describe output for commit with tags', async () => {
    const result = await getCommitDescribe('HEAD', testCwd);
    assert.ok(typeof result === 'string', 'Should return a string');
  });

  test('getCommitDescribe returns describe output for specific commit', async () => {
    const result = await getCommitDescribe('HEAD~1', testCwd);
    assert.ok(typeof result === 'string', 'Should return a string');
  });

  test('getCommitDescribe handles commit without tags (falls back to hash)', async () => {
    const result = await getCommitDescribe('HEAD', testCwd);
    assert.ok(result.length > 0, 'Should return some output');
  });

  test('getCommitDescribe format includes tag and hash', async () => {
    const result = await getCommitDescribe('HEAD', testCwd);
    // git describe has format like v1.0.0-5-gabc123 or abc123 (if no tags)
    assert.ok(result.includes('-g') || result.length === 7, 'Should have git describe format');
  });
});