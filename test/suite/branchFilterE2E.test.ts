import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Branch Filter E2E Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');

  let mainJsSource: string;
  let webviewProviderSource: string;
  let typesSource: string;
  let messageHandlerSource: string;

  suiteSetup(() => {
    mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');
    webviewProviderSource = fs.readFileSync(webviewProviderPath, 'utf-8');
    typesSource = fs.readFileSync(typesPath, 'utf-8');
    messageHandlerSource = fs.readFileSync(messageHandlerPath, 'utf-8');
  });

  suite('Main.js Branch Filter Integration', () => {
    test('main.js should parse branch: filter from query', () => {
      assert.ok(
        mainJsSource.includes('branchMatch'),
        'main.js should have branchMatch variable'
      );
      assert.ok(
        mainJsSource.includes('/branch:([^') || mainJsSource.includes('/branch:([^\n'),
        'main.js should parse branch: filter regex'
      );
    });

    test('main.js should extract branchFilter from query', () => {
      assert.ok(
        mainJsSource.includes('const branchFilter = branchMatch'),
        'main.js should extract branchFilter'
      );
    });

    test('main.js should include branchFilter in return value of parseDateFilter', () => {
      assert.ok(
        mainJsSource.includes('branchFilter'),
        'main.js parseDateFilter should return branchFilter'
      );
    });

    test('main.js should apply branch filter in getFilteredCommits', () => {
      assert.ok(
        mainJsSource.includes('if (branchFilter)'),
        'main.js should check for branchFilter'
      );
      assert.ok(
        mainJsSource.includes('branchCommitHashes[branchFilter]'),
        'main.js should use branchCommitHashes to filter commits'
      );
    });

    test('main.js should render branch filter badge', () => {
      assert.ok(
        mainJsSource.includes('branchBadge'),
        'main.js should create branchBadge element'
      );
      assert.ok(
        mainJsSource.includes('data-filter="branch"'),
        'main.js should have branch filter clear button'
      );
    });

    test('main.js should handle branch filter clearing', () => {
      assert.ok(
        mainJsSource.includes("filterToRemove === 'branch'"),
        'main.js should handle branch filter removal'
      );
      assert.ok(
        mainJsSource.includes("newQuery.replace(/branch:[^\\s]+/i, '').trim()"),
        'main.js should remove branch: from query when clearing'
      );
    });

    test('main.js should initialize branches from init message', () => {
      assert.ok(
        mainJsSource.includes('branches = message.branches'),
        'main.js should set branches from message'
      );
    });

    test('main.js should request branch hashes on init', () => {
      assert.ok(
        mainJsSource.includes("type: 'requestBranchHashes'"),
        'main.js should send requestBranchHashes message'
      );
    });

    test('main.js should handle branchHashes message', () => {
      assert.ok(
        mainJsSource.includes("case 'branchHashes':"),
        'main.js should handle branchHashes message'
      );
    });

    test('main.js should build branchCommitHashes map from message', () => {
      assert.ok(
        mainJsSource.includes('branchCommitHashes[branchName.toLowerCase()]'),
        'main.js should build branchCommitHashes with lowercase keys'
      );
    });
  });

  suite('TypeScript Type Integration', () => {
    test('types.ts should include branches in init message type', () => {
      assert.ok(
        typesSource.includes('branches?: string[]'),
        'types.ts ExtToWebviewMessage init should have branches field'
      );
    });

    test('types.ts should include requestBranchHashes message type', () => {
      assert.ok(
        typesSource.includes("type: 'requestBranchHashes'"),
        'types.ts should define requestBranchHashes message type'
      );
    });

    test('types.ts should include branchHashes message type', () => {
      assert.ok(
        typesSource.includes("type: 'branchHashes'"),
        'types.ts should define branchHashes message type'
      );
    });
  });

  suite('gitService Integration', () => {
    test('gitService.ts should export getAllBranches function', () => {
      const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
      const gitServiceSource = fs.readFileSync(gitServicePath, 'utf-8');
      assert.ok(
        gitServiceSource.includes('export async function getAllBranches'),
        'gitService.ts should export getAllBranches function'
      );
    });

    test('gitService.ts should export getBranchCommitHashes function', () => {
      const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
      const gitServiceSource = fs.readFileSync(gitServicePath, 'utf-8');
      assert.ok(
        gitServiceSource.includes('export async function getBranchCommitHashes'),
        'gitService.ts should export getBranchCommitHashes function'
      );
    });
  });

  suite('webviewProvider Integration', () => {
    test('webviewProvider should import getAllBranches', () => {
      assert.ok(
        webviewProviderSource.includes('getAllBranches'),
        'webviewProvider.ts should import getAllBranches'
      );
    });

    test('webviewProvider should pass branches in init message', () => {
      assert.ok(
        webviewProviderSource.includes('branches,'),
        'webviewProvider.ts should include branches in postMessage'
      );
    });
  });

  suite('messageHandler Integration', () => {
    test('messageHandler should import getBranchCommitHashes', () => {
      assert.ok(
        messageHandlerSource.includes('getBranchCommitHashes'),
        'messageHandler.ts should import getBranchCommitHashes'
      );
    });

    test('messageHandler should handle requestBranchHashes message', () => {
      assert.ok(
        messageHandlerSource.includes("case 'requestBranchHashes':"),
        'messageHandler.ts should handle requestBranchHashes'
      );
    });

    test('messageHandler should call handleRequestBranchHashes', () => {
      assert.ok(
        messageHandlerSource.includes('handleRequestBranchHashes'),
        'messageHandler.ts should call handleRequestBranchHashes'
      );
    });
  });

  suite('Search Placeholder E2E', () => {
    const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');

    test('index.html search placeholder should mention branch filter', () => {
      const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(
        indexHtmlSource.includes('branch:name'),
        'index.html placeholder should include branch:name for user discoverability'
      );
    });

    test('index.html and webviewProvider.ts should have matching search input placeholders', () => {
      const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
      const webviewProviderSource = fs.readFileSync(webviewProviderPath, 'utf-8');

      const indexPlaceholder = indexHtmlSource.match(/id="search-input" placeholder="([^"]+)"/)?.[1];
      const providerPlaceholder = webviewProviderSource.match(/id="search-input" placeholder="([^"]+)"/)?.[1];

      assert.ok(indexPlaceholder, 'index.html should have search input placeholder');
      assert.ok(providerPlaceholder, 'webviewProvider.ts should have search input placeholder');
      assert.strictEqual(indexPlaceholder, providerPlaceholder,
        'index.html and webviewProvider.ts placeholders must match exactly');
    });

    test('index.html should have export-btn matching webviewProvider.ts', () => {
      const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
      const webviewProviderSource = fs.readFileSync(webviewProviderPath, 'utf-8');

      assert.ok(
        indexHtmlSource.includes('id="export-btn"'),
        'index.html should have export-btn for dev-mode parity'
      );
      assert.ok(
        webviewProviderSource.includes('id="export-btn"'),
        'webviewProvider.ts should have export-btn'
      );
    });

    test('CLAUDE.md should document branch filter in UI Features', () => {
      const claudeMdPath = path.resolve(__dirname, '../../../CLAUDE.md');
      const claudeSource = fs.readFileSync(claudeMdPath, 'utf-8');
      assert.ok(
        claudeSource.includes('**Branch Filter**'),
        'CLAUDE.md should have Branch Filter section in UI Features'
      );
      assert.ok(
        claudeSource.includes('branch:name'),
        'CLAUDE.md should document branch:name syntax'
      );
    });

    test('CLAUDE.md should document branchHashes and requestBranchHashes in Message Protocol', () => {
      const claudeMdPath = path.resolve(__dirname, '../../../CLAUDE.md');
      const claudeSource = fs.readFileSync(claudeMdPath, 'utf-8');
      assert.ok(
        claudeSource.includes('`branchHashes`'),
        'CLAUDE.md Message Protocol should list branchHashes'
      );
      assert.ok(
        claudeSource.includes('`requestBranchHashes`'),
        'CLAUDE.md Message Protocol should list requestBranchHashes'
      );
    });
  });
});
