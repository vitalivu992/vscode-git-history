import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vscode from 'vscode';

const screenshotsDir = path.resolve(__dirname, '../../..', 'screenshots');

function findAndFocusVSCodeWindow(): void {
  // Walk up the process tree from this extension host process to find the VS Code
  // main window. This is more reliable than searching by class name.
  // xdotool works for XWayland apps (VS Code/Electron) even on GNOME Wayland.
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

    // Move to parent process
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
      ['gnome-screenshot', ['-w', '-f', outputPath]],
      ['grim', [outputPath]],
      ['scrot', ['-u', outputPath]],
    ];
    for (const [cmd, args] of tools) {
      try {
        cp.execFileSync(cmd, args);
        return;
      } catch {
        continue;
      }
    }
    throw new Error('Screenshot capture failed. Install gnome-screenshot (GNOME), grim (wlroots Wayland), or scrot (X11).');
  } else if (platform === 'darwin') {
    cp.execFileSync('screencapture', ['-x', outputPath]);
  } else {
    throw new Error(`Screenshot capture not supported on platform: ${platform}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

suite('Screenshot Capture', () => {
  suiteSetup(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('capture selection history', async () => {
    const readmePath = path.resolve(__dirname, '../../..', 'README.md');
    const doc = await vscode.workspace.openTextDocument(readmePath);
    const editor = await vscode.window.showTextDocument(doc);

    // Select the "Features" paragraph (lines 7-17, 0-indexed: 6-16)
    const startLine = 6;
    const endLine = 16;
    editor.selection = new vscode.Selection(startLine, 0, endLine, doc.lineAt(endLine).text.length);

    await vscode.commands.executeCommand('gitHistory.showSelectionHistory');
    await sleep(3000);

    const outputPath = path.join(screenshotsDir, 'selection-history.png');
    findAndFocusVSCodeWindow();
    await sleep(500);
    captureScreen(outputPath);
    assert.ok(fs.existsSync(outputPath), 'Screenshot file should exist');
  });

  test('capture file history', async () => {
    const readmePath = path.resolve(__dirname, '../../..', 'README.md');
    const doc = await vscode.workspace.openTextDocument(readmePath);
    await vscode.window.showTextDocument(doc);

    await vscode.commands.executeCommand('gitHistory.showFileHistory');
    await sleep(3000);

    const outputPath = path.join(screenshotsDir, 'file-history.png');
    findAndFocusVSCodeWindow();
    await sleep(500);
    captureScreen(outputPath);
    assert.ok(fs.existsSync(outputPath), 'Screenshot file should exist');
  });
});
