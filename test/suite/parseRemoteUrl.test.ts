import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Git remote information extracted from a remote URL
 * (mirroring the interface from gitService.ts)
 */
interface GitRemoteInfo {
  platform: 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'unknown';
  baseUrl: string;
  owner: string;
  repo: string;
  project?: string; // Azure DevOps: project name
}

/**
 * Detect the git platform based on hostname
 * (mirroring the logic from gitService.ts)
 */
function detectPlatform(hostname: string): 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'unknown' {
  const lowerHost = hostname.toLowerCase();

  if (lowerHost === 'github.com' || lowerHost.endsWith('.github.com')) {
    return 'github';
  }
  if (lowerHost === 'gitlab.com' || lowerHost.endsWith('.gitlab.com') || lowerHost.includes('gitlab')) {
    return 'gitlab';
  }
  if (lowerHost === 'bitbucket.org' || lowerHost.includes('bitbucket')) {
    return 'bitbucket';
  }
  if (lowerHost === 'dev.azure.com' || lowerHost === 'ssh.dev.azure.com' || lowerHost.endsWith('.visualstudio.com')) {
    return 'azure';
  }

  return 'unknown';
}

/**
 * Parse a git remote URL to extract platform information
 * (mirroring the logic from gitService.ts)
 */
function parseRemoteUrl(remoteUrl: string): GitRemoteInfo | null {
  // Azure DevOps SSH format: git@ssh.dev.azure.com:v3/{org}/{project}/{repo}
  const azureSshPattern = /^git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/;
  let match = remoteUrl.match(azureSshPattern);
  if (match) {
    const [, owner, project, repo] = match;
    return { platform: 'azure', baseUrl: 'https://dev.azure.com', owner, project, repo };
  }

  // Azure DevOps HTTPS format: https://dev.azure.com/{org}/{project}/_git/{repo}
  const azureHttpsPattern = /^https?:\/\/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(azureHttpsPattern);
  if (match) {
    const [, owner, project, repo] = match;
    return { platform: 'azure', baseUrl: 'https://dev.azure.com', owner, project, repo };
  }

  // Azure DevOps legacy HTTPS format: https://{org}.visualstudio.com/{project}/_git/{repo}
  const azureLegacyPattern = /^https?:\/\/([^/]+)\.visualstudio\.com\/([^/]+)\/_git\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(azureLegacyPattern);
  if (match) {
    const [, owner, project, repo] = match;
    return { platform: 'azure', baseUrl: `https://${owner}.visualstudio.com`, owner, project, repo };
  }

  // Try general SSH format (git@host:owner/repo.git)
  const sshPattern = /^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(sshPattern);
  if (match) {
    const [, host, sshOwner, sshRepo] = match;
    const platform = detectPlatform(host);
    const baseUrl = `https://${host}`;
    return { platform, baseUrl, owner: sshOwner, repo: sshRepo };
  }

  // Try ssh:// URL format with optional port: ssh://git@host:port/owner/repo.git
  // Must be checked AFTER Azure-specific patterns but BEFORE SCP-like pattern
  const sshUrlPattern = /^ssh:\/\/(?:git@)?([^:/?]+)(?::(\d+))?\/([^/]+)\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(sshUrlPattern);
  if (match) {
    const [, host, port, sshOwner, sshRepo] = match;
    const platform = detectPlatform(host);
    // Port is intentionally excluded from baseUrl as git hosting platforms don't use custom ports for web URLs
    const baseUrl = `https://${host}`;
    return { platform, baseUrl, owner: sshOwner, repo: sshRepo };
  }

  // Try general HTTPS format (https://host/owner/repo.git)
  const httpsPattern = /^https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/;
  match = remoteUrl.match(httpsPattern);
  if (match) {
    const [, host, httpsOwner, httpsRepo] = match;
    const platform = detectPlatform(host);
    const baseUrl = `https://${host}`;
    return { platform, baseUrl, owner: httpsOwner, repo: httpsRepo };
  }

  return null;
}

suite('parseRemoteUrl Tests', () => {

  suite('detectPlatform function', () => {

    test('github.com should return github', () => {
      assert.strictEqual(detectPlatform('github.com'), 'github');
    });

    test('gist.github.com should return github', () => {
      assert.strictEqual(detectPlatform('gist.github.com'), 'github');
    });

    test('sub.github.com should return github', () => {
      assert.strictEqual(detectPlatform('sub.github.com'), 'github');
    });

    test('gitlab.com should return gitlab', () => {
      assert.strictEqual(detectPlatform('gitlab.com'), 'gitlab');
    });

    test('my.gitlab.example.com should return gitlab', () => {
      assert.strictEqual(detectPlatform('my.gitlab.example.com'), 'gitlab');
    });

    test('sub.gitlab.com should return gitlab', () => {
      assert.strictEqual(detectPlatform('sub.gitlab.com'), 'gitlab');
    });

    test('bitbucket.org should return bitbucket', () => {
      assert.strictEqual(detectPlatform('bitbucket.org'), 'bitbucket');
    });

    test('my.bitbucket.example.com should return bitbucket', () => {
      assert.strictEqual(detectPlatform('my.bitbucket.example.com'), 'bitbucket');
    });

    test('dev.azure.com should return azure', () => {
      assert.strictEqual(detectPlatform('dev.azure.com'), 'azure');
    });

    test('ssh.dev.azure.com should return azure', () => {
      assert.strictEqual(detectPlatform('ssh.dev.azure.com'), 'azure');
    });

    test('myorg.visualstudio.com should return azure', () => {
      assert.strictEqual(detectPlatform('myorg.visualstudio.com'), 'azure');
    });

    test('unknown.com should return unknown', () => {
      assert.strictEqual(detectPlatform('unknown.com'), 'unknown');
    });

    test('should be case insensitive', () => {
      assert.strictEqual(detectPlatform('GitHub.Com'), 'github');
      assert.strictEqual(detectPlatform('GITLAB.COM'), 'gitlab');
      assert.strictEqual(detectPlatform('BitBucket.Org'), 'bitbucket');
      assert.strictEqual(detectPlatform('Dev.Azure.Com'), 'azure');
    });

  });

  suite('parseRemoteUrl function - GitHub URLs', () => {

    test('git@github.com:owner/repo.git (SSH)', () => {
      const result = parseRemoteUrl('git@github.com:owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('git@github.com:owner/repo (SSH without .git)', () => {
      const result = parseRemoteUrl('git@github.com:owner/repo');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('https://github.com/owner/repo.git (HTTPS)', () => {
      const result = parseRemoteUrl('https://github.com/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('https://github.com/owner/repo (HTTPS without .git)', () => {
      const result = parseRemoteUrl('https://github.com/owner/repo');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('ssh://git@github.com/owner/repo.git (SSH URL format)', () => {
      const result = parseRemoteUrl('ssh://git@github.com/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('http://github.com/owner/repo.git (HTTP)', () => {
      const result = parseRemoteUrl('http://github.com/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

  });

  suite('parseRemoteUrl function - GitLab URLs', () => {

    test('git@gitlab.com:owner/repo.git (SSH)', () => {
      const result = parseRemoteUrl('git@gitlab.com:owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'gitlab',
        baseUrl: 'https://gitlab.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('https://gitlab.com/owner/repo.git (HTTPS)', () => {
      const result = parseRemoteUrl('https://gitlab.com/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'gitlab',
        baseUrl: 'https://gitlab.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('https://my.gitlab.example.com/owner/repo.git (self-hosted)', () => {
      const result = parseRemoteUrl('https://my.gitlab.example.com/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'gitlab',
        baseUrl: 'https://my.gitlab.example.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('ssh://git@gitlab.com:2222/owner/repo.git (SSH with custom port)', () => {
      const result = parseRemoteUrl('ssh://git@gitlab.com:2222/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'gitlab',
        baseUrl: 'https://gitlab.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('ssh://git@gitlab.example.com:2222/owner/repo.git (self-hosted with custom port)', () => {
      const result = parseRemoteUrl('ssh://git@gitlab.example.com:2222/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

  });

  suite('parseRemoteUrl function - Bitbucket URLs', () => {

    test('git@bitbucket.org:owner/repo.git (SSH)', () => {
      const result = parseRemoteUrl('git@bitbucket.org:owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'bitbucket',
        baseUrl: 'https://bitbucket.org',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('https://bitbucket.org/owner/repo.git (HTTPS)', () => {
      const result = parseRemoteUrl('https://bitbucket.org/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'bitbucket',
        baseUrl: 'https://bitbucket.org',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('https://my.bitbucket.example.com/owner/repo.git (self-hosted)', () => {
      const result = parseRemoteUrl('https://my.bitbucket.example.com/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'bitbucket',
        baseUrl: 'https://my.bitbucket.example.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

  });

  suite('parseRemoteUrl function - Azure DevOps URLs', () => {

    test('git@ssh.dev.azure.com:v3/org/project/repo (SSH)', () => {
      const result = parseRemoteUrl('git@ssh.dev.azure.com:v3/org/project/repo');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://dev.azure.com',
        owner: 'org',
        project: 'project',
        repo: 'repo'
      });
    });

    test('git@ssh.dev.azure.com:v3/org/project/repo.git (SSH with .git)', () => {
      const result = parseRemoteUrl('git@ssh.dev.azure.com:v3/org/project/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://dev.azure.com',
        owner: 'org',
        project: 'project',
        repo: 'repo'
      });
    });

    test('https://dev.azure.com/org/project/_git/repo (HTTPS)', () => {
      const result = parseRemoteUrl('https://dev.azure.com/org/project/_git/repo');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://dev.azure.com',
        owner: 'org',
        project: 'project',
        repo: 'repo'
      });
    });

    test('https://dev.azure.com/org/project/_git/repo.git (HTTPS with .git)', () => {
      const result = parseRemoteUrl('https://dev.azure.com/org/project/_git/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://dev.azure.com',
        owner: 'org',
        project: 'project',
        repo: 'repo'
      });
    });

    test('http://dev.azure.com/org/project/_git/repo (HTTP)', () => {
      const result = parseRemoteUrl('http://dev.azure.com/org/project/_git/repo');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://dev.azure.com',
        owner: 'org',
        project: 'project',
        repo: 'repo'
      });
    });

    test('https://myorg.visualstudio.com/project/_git/repo (legacy HTTPS)', () => {
      const result = parseRemoteUrl('https://myorg.visualstudio.com/project/_git/repo');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://myorg.visualstudio.com',
        owner: 'myorg',
        project: 'project',
        repo: 'repo'
      });
    });

    test('https://myorg.visualstudio.com/project/_git/repo.git (legacy HTTPS with .git)', () => {
      const result = parseRemoteUrl('https://myorg.visualstudio.com/project/_git/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'azure',
        baseUrl: 'https://myorg.visualstudio.com',
        owner: 'myorg',
        project: 'project',
        repo: 'repo'
      });
    });

  });

  suite('parseRemoteUrl function - SSH with Custom Port (General)', () => {

    test('ssh://git@github.com:443/owner/repo.git (port 443)', () => {
      const result = parseRemoteUrl('ssh://git@github.com:443/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'github',
        baseUrl: 'https://github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('ssh://git@gitlab.example.com:2222/owner/repo.git (custom port)', () => {
      const result = parseRemoteUrl('ssh://git@gitlab.example.com:2222/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('ssh://host/owner/repo.git (without git@ user)', () => {
      const result = parseRemoteUrl('ssh://host/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'unknown',
        baseUrl: 'https://host',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('ssh://git@unknown.com:9999/owner/repo.git (unknown platform with port)', () => {
      const result = parseRemoteUrl('ssh://git@unknown.com:9999/owner/repo.git');
      assert.deepStrictEqual(result, {
        platform: 'unknown',
        baseUrl: 'https://unknown.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

  });

  suite('parseRemoteUrl function - Edge Cases', () => {

    test('empty string should return null', () => {
      assert.strictEqual(parseRemoteUrl(''), null);
    });

    test('invalid format should return null', () => {
      assert.strictEqual(parseRemoteUrl('not-a-url'), null);
    });

    test('just hostname without path should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://github.com'), null);
    });

    test('URL with query parameters should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://github.com/owner/repo?query=1'), null);
    });

    test('URL with fragment should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://github.com/owner/repo#section'), null);
    });

    test('URL with query parameters and fragment should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://github.com/owner/repo.git?query=1#section'), null);
    });

    test('missing owner in path should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://github.com/repo'), null);
    });

    test('multiple @ in SSH URL should return null', () => {
      assert.strictEqual(parseRemoteUrl('ssh://git@extra@github.com/owner/repo.git'), null);
    });

    test('just protocol should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://'), null);
    });

    test('protocol with host only should return null', () => {
      assert.strictEqual(parseRemoteUrl('https://github.com'), null);
    });

    test('SSH format without colon should return null', () => {
      assert.strictEqual(parseRemoteUrl('git@github.com/owner/repo.git'), null);
    });

  });

  suite('Source Verification Tests', () => {

    test('parseRemoteUrl function exists in gitService.ts', () => {
      const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
      const source = fs.readFileSync(servicePath, 'utf-8');
      assert.ok(source.includes('export function parseRemoteUrl'), 'parseRemoteUrl function should exist in gitService.ts');
    });

    test('detectPlatform function exists in gitService.ts', () => {
      const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
      const source = fs.readFileSync(servicePath, 'utf-8');
      assert.ok(source.includes('function detectPlatform'), 'detectPlatform function should exist in gitService.ts');
    });

  });

});
