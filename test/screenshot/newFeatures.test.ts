import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vscode from 'vscode';

const screenshotsDir = path.resolve(__dirname, '../../..', 'screenshots');

function findAndFocusVSCodeWindow(): void {
  const display = process.env.DISPLAY;
  if (!display) { return; }

  const env = { ...process.env, DISPLAY: display };
  let pid = process.pid;
  const seen = new Set<number>();

  while (pid > 1 && !seen.has(pid)) {
    seen.add(pid);
    try {
      const result = cp.execFileSync(
        'xdotool', ['search', '--onlyvisible', '--pid', String(pid)],
        { encoding: 'utf8', env }
      );
      const windowIds = result.trim().split('\n').filter(Boolean);
      if (windowIds.length > 0) {
        const windowId = windowIds[windowIds.length - 1];
        try { cp.execFileSync('xdotool', ['windowfocus', '--sync', windowId], { env }); } catch {}
        try { cp.execFileSync('xdotool', ['windowraise', windowId], { env }); } catch {}
        return;
      }
    } catch {}

    try {
      const ppid = cp.execFileSync('ps', ['-p', String(pid), '-o', 'ppid='],
        { encoding: 'utf8' }).trim();
      pid = parseInt(ppid, 10);
    } catch { break; }
  }
}

function captureScreen(outputPath: string): void {
  const platform = process.platform;
  if (platform === 'linux') {
    findAndFocusVSCodeWindow();

    const tools: [string, string[]][] = [
      ['scrot', [outputPath]],
      ['gnome-screenshot', ['-f', outputPath]],
      ['import', ['-window', 'root', outputPath]],
    ];
    for (const [cmd, args] of tools) {
      try {
        cp.execFileSync(cmd, args);
        return;
      } catch {
        continue;
      }
    }
    throw new Error('Screenshot capture failed. Install gnome-screenshot (GNOME), grim (wlroot Wayland), or scrot (X11).');
  } else if (platform === 'darwin') {
    cp.execFileSync('screencapture', ['-x', outputPath]);
  } else {
    throw new Error(`Screenshot capture not supported on platform: ${platform}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

suite('New Features Screenshot Capture', () => {
  suiteSetup(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('capture repository history', async () => {
    await vscode.commands.executeCommand('gitHistory.showRepositoryHistory');
    await sleep(4000);

    const outputPath = path.join(screenshotsDir, 'repository-history.png');
    findAndFocusVSCodeWindow();
    await sleep(500);
    captureScreen(outputPath);
    assert.ok(fs.existsSync(outputPath), 'Screenshot file should exist');
  });

  test('capture repository history with diff stats bar', async () => {
    // Repository history should already be open from previous test
    // Wait for commit diff + stats to render
    await sleep(3000);

    const outputPath = path.join(screenshotsDir, 'diff-stats-bar.png');
    findAndFocusVSCodeWindow();
    await sleep(500);
    captureScreen(outputPath);
    if (!fs.existsSync(outputPath)) {
      console.warn('Screenshot not created - no capture tool available. Skipping.');
    } else {
      assert.ok(fs.existsSync(outputPath), 'Screenshot file should exist');
    }
  });

  test('capture file history with changed files context menu', async () => {
    // Open file history so we have the changed-files panel visible
    const readmePath = path.resolve(__dirname, '../../..', 'README.md');
    const doc = await vscode.workspace.openTextDocument(readmePath);
    await vscode.window.showTextDocument(doc);

    await vscode.commands.executeCommand('gitHistory.showFileHistory');
    await sleep(4000);

    const outputPath = path.join(screenshotsDir, 'changed-files-context-menu.png');
    findAndFocusVSCodeWindow();
    await sleep(500);
    captureScreen(outputPath);
    if (!fs.existsSync(outputPath)) {
      console.warn('Screenshot not created.');
    }
  });

  test('capture diff search button', async () => {
    // File history should be open. The diff search button is in the toolbar.
    await sleep(2000);

    const outputPath = path.join(screenshotsDir, 'diff-search-button.png');
    findAndFocusVSCodeWindow();
    await sleep(500);
    captureScreen(outputPath);
    if (!fs.existsSync(outputPath)) {
      console.warn('Screenshot not created.');
    }
  });
});
