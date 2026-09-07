import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../..');
    const extensionTestsPath = path.resolve(__dirname, './screenshot/index');
    const workspacePath = path.resolve(__dirname, '../..');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        workspacePath,
        '--disable-extensions',
        // Electron must run on X11 under Xvfb (CI/headless): without these,
        // Electron probes Wayland first and exits with SIGTRAP.
        '--no-sandbox',
        '--disable-gpu',
        '--ozone-platform=x11'
      ]
    });
  } catch (err) {
    console.error('Failed to run screenshot tests');
    process.exit(1);
  }
}

main();
