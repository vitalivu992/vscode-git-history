import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Regex Search E2E Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const stylesCssPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');

  let mainJsSource: string;
  let indexHtmlSource: string;
  let stylesCssSource: string;
  let webviewProviderSource: string;

  suiteSetup(() => {
    mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');
    indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
    stylesCssSource = fs.readFileSync(stylesCssPath, 'utf-8');
    webviewProviderSource = fs.readFileSync(webviewProviderPath, 'utf-8');
  });

  suite('HTML Integration', () => {
    test('index.html contains regex toggle button with correct ID', () => {
      assert.ok(
        indexHtmlSource.includes('id="regex-toggle-btn"'),
        'index.html should have regex-toggle-btn element with id'
      );
    });

    test('regex toggle button has correct title attribute', () => {
      assert.ok(
        indexHtmlSource.includes('Toggle regex search mode (Ctrl+Shift+X)'),
        'regex toggle button should have Ctrl+Shift+X shortcut in title'
      );
    });

    test('regex toggle button is placed inside search container', () => {
      const searchContainerMatch = indexHtmlSource.match(/<div class="search-container">[\s\S]*?<\/div>/);
      assert.ok(searchContainerMatch, 'search-container div should exist');
      assert.ok(
        searchContainerMatch[0].includes('regex-toggle-btn'),
        'regex toggle button should be inside search container'
      );
    });

    test('regex toggle button displays .* as label', () => {
      assert.ok(
        indexHtmlSource.includes('>.*</button>') || indexHtmlSource.match(/regex-toggle-btn[^>]*>\.\*</),
        'regex toggle button should show .* as its label'
      );
    });
  });

  suite('CSS Styling', () => {
    test('styles.css defines .regex-toggle-btn base styles', () => {
      assert.ok(
        stylesCssSource.includes('.regex-toggle-btn {'),
        'styles.css should define .regex-toggle-btn styles'
      );
    });

    test('styles.css defines .regex-toggle-btn.active for enabled state', () => {
      assert.ok(
        stylesCssSource.includes('.regex-toggle-btn.active'),
        'styles.css should define .regex-toggle-btn.active styles'
      );
    });

    test('styles.css defines .regex-toggle-btn.invalid for invalid regex', () => {
      assert.ok(
        stylesCssSource.includes('.regex-toggle-btn.invalid'),
        'styles.css should define .regex-toggle-btn.invalid styles'
      );
    });

    test('active state uses button background color', () => {
      const activeStyleMatch = stylesCssSource.match(/\.regex-toggle-btn\.active\s*{[^}]+}/);
      assert.ok(activeStyleMatch, 'active style block should exist');
      assert.ok(
        activeStyleMatch[0].includes('vscode-button-background'),
        'active state should use button background color'
      );
    });

    test('invalid state uses error/deletion color', () => {
      const invalidStyleMatch = stylesCssSource.match(/\.regex-toggle-btn\.invalid\s*{[^}]+}/);
      assert.ok(invalidStyleMatch, 'invalid style block should exist');
      assert.ok(
        invalidStyleMatch[0].includes('gitDecoration-deletedResourceForeground') ||
        invalidStyleMatch[0].includes('#f85149'),
        'invalid state should use error/red color'
      );
    });
  });

  suite('JavaScript Implementation', () => {
    test('main.js declares regexSearchEnabled state variable', () => {
      assert.ok(
        mainJsSource.match(/let\s+regexSearchEnabled\s*=\s*false/),
        'main.js should declare regexSearchEnabled with initial value false'
      );
    });

    test('main.js gets reference to regex toggle button', () => {
      assert.ok(
        mainJsSource.includes("document.getElementById('regex-toggle-btn')") ||
        mainJsSource.includes('document.getElementById("regex-toggle-btn")'),
        'main.js should get regex-toggle-btn DOM reference'
      );
    });

    test('main.js implements isRegexMatch function', () => {
      assert.ok(
        mainJsSource.includes('function isRegexMatch'),
        'main.js should implement isRegexMatch function'
      );
    });

    test('isRegexMatch handles regex mode correctly', () => {
      // Check for the function declaration and RegExp usage
      assert.ok(
        mainJsSource.match(/function isRegexMatch\s*\(/),
        'isRegexMatch function should exist'
      );
      assert.ok(
        mainJsSource.match(/new\s+RegExp\s*\(\s*['"]?.+['"]?\s*,?\s*['"]?i?['"]?\s*\)/),
        'isRegexMatch should create RegExp object'
      );
      assert.ok(
        mainJsSource.includes('regexSearchEnabled'),
        'isRegexMatch should check regexSearchEnabled flag'
      );
    });

    test('isRegexMatch handles invalid regex with fallback', () => {
      // Check for try-catch pattern around RegExp
      assert.ok(
        mainJsSource.match(/function isRegexMatch[\s\S]{0,500}try[\s\S]{0,300}catch[\s\S]{0,300}includes/),
        'isRegexMatch should have try-catch with fallback to includes'
      );
    });

    test('main.js implements isValidRegex function', () => {
      assert.ok(
        mainJsSource.includes('function isValidRegex'),
        'main.js should implement isValidRegex function'
      );
    });

    test('main.js implements handleRegexToggle function', () => {
      assert.ok(
        mainJsSource.includes('function handleRegexToggle'),
        'main.js should implement handleRegexToggle function'
      );
    });

    test('handleRegexToggle toggles regexSearchEnabled state', () => {
      const toggleMatch = mainJsSource.match(/function handleRegexToggle[^{]*{[\s\S]*?^}/m);
      assert.ok(toggleMatch, 'handleRegexToggle function should exist');
      assert.ok(
        toggleMatch[0].includes('regexSearchEnabled = !regexSearchEnabled'),
        'handleRegexToggle should toggle regexSearchEnabled'
      );
    });

    test('handleRegexToggle updates button visual state', () => {
      const toggleMatch = mainJsSource.match(/function handleRegexToggle[^{]*{[\s\S]*?}/);
      assert.ok(toggleMatch, 'handleRegexToggle function should exist');
      assert.ok(
        toggleMatch[0].includes('classList.add') && toggleMatch[0].includes('active'),
        'handleRegexToggle should update active class'
      );
    });

    test('main.js implements updateRegexValidation function', () => {
      assert.ok(
        mainJsSource.includes('function updateRegexValidation'),
        'main.js should implement updateRegexValidation function'
      );
    });

    test('updateRegexValidation adds invalid class for bad regex', () => {
      assert.ok(
        mainJsSource.match(/function updateRegexValidation\s*\(/),
        'updateRegexValidation function should exist'
      );
      // Check that the function adds/removes invalid class
      assert.ok(
        mainJsSource.match(/classList\.add\s*\(\s*['"`]invalid['"`]\s*\)/),
        'updateRegexValidation should add invalid class'
      );
      assert.ok(
        mainJsSource.match(/classList\.remove\s*\(\s*['"`]invalid['"`]\s*\)/),
        'updateRegexValidation should remove invalid class'
      );
    });

    test('main.js adds click event listener to regex toggle button', () => {
      assert.ok(
        mainJsSource.match(/regexToggleBtn[^]*addEventListener[^]*click[^]*handleRegexToggle/) ||
        mainJsSource.match(/addEventListener\s*\(\s*['"]click['"]\s*,\s*handleRegexToggle/),
        'main.js should add click listener to regex toggle button'
      );
    });

    test('main.js handles Ctrl+Shift+X keyboard shortcut', () => {
      assert.ok(
        mainJsSource.match(/e\.key\s*===?\s*['"`]x['"`]/) &&
        mainJsSource.match(/e\.shiftKey/) &&
        mainJsSource.match(/e\.ctrlKey\s*\|\|\s*e\.metaKey/),
        'main.js should handle Ctrl+Shift+X keyboard shortcut'
      );
    });

    test('Ctrl+Shift+X calls handleRegexToggle', () => {
      // Find the keydown handler and check it calls handleRegexToggle
      const keyHandlerMatch = mainJsSource.match(/e\.key\s*===?\s*['"`]x['"`][\s\S]{0,200}handleRegexToggle/);
      assert.ok(
        keyHandlerMatch || mainJsSource.match(/handleRegexToggle\(\)[\s\S]{0,50}e\.key\s*===?\s*['"`]x['"`]/),
        'Ctrl+Shift+X handler should call handleRegexToggle'
      );
    });

    test('handleSearch calls updateRegexValidation', () => {
      assert.ok(
        mainJsSource.match(/function handleSearch[^{]*{[\s\S]*?updateRegexValidation/),
        'handleSearch should call updateRegexValidation'
      );
    });
  });

  suite('Webview Provider Integration', () => {
    test('webviewProvider.ts includes regex toggle button', () => {
      assert.ok(
        webviewProviderSource.includes('regex-toggle-btn'),
        'webviewProvider.ts should include regex toggle button in HTML template'
      );
    });

    test('webviewProvider.ts regex button has correct title', () => {
      assert.ok(
        webviewProviderSource.includes('Toggle regex search mode (Ctrl+Shift+X)'),
        'webviewProvider.ts should have correct button title with keyboard shortcut'
      );
    });
  });

  suite('Integration with existing search', () => {
    test('getFilteredCommits uses isRegexMatch for message field', () => {
      assert.ok(
        mainJsSource.match(/isRegexMatch\s*\(\s*commit\.message/),
        'getFilteredCommits should use isRegexMatch for message'
      );
    });

    test('getFilteredCommits uses isRegexMatch for author field', () => {
      assert.ok(
        mainJsSource.match(/isRegexMatch\s*\(\s*commit\.author/),
        'getFilteredCommits should use isRegexMatch for author'
      );
    });

    test('getFilteredCommits uses isRegexMatch for hash fields', () => {
      assert.ok(
        mainJsSource.match(/isRegexMatch\s*\(\s*commit\.hash/) &&
        mainJsSource.match(/isRegexMatch\s*\(\s*commit\.shortHash/),
        'getFilteredCommits should use isRegexMatch for hash fields'
      );
    });

    test('getFilteredCommits uses isRegexMatch for email field', () => {
      assert.ok(
        mainJsSource.match(/isRegexMatch\s*\(\s*commit\.email/),
        'getFilteredCommits should use isRegexMatch for email'
      );
    });

    test('getFilteredCommits uses isRegexMatch for tags', () => {
      assert.ok(
        mainJsSource.match(/isRegexMatch\s*\(\s*t,/),
        'getFilteredCommits should use isRegexMatch for tags'
      );
    });
  });
});
