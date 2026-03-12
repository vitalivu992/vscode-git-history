# Capturing Screenshots

## Automated Capture

Run the screenshot script to capture the extension UI:

```bash
npm run screenshot
```

On Linux (requires a display):
```bash
xvfb-run -a npm run screenshot
```

## Output

Screenshots are saved to the `screenshots/` directory (gitignored). Two files are produced:

- `screenshots/selection-history.png` — extension showing selection history
- `screenshots/file-history.png` — extension showing file history

## CI

On pull requests, the CI `test` job automatically:
1. Runs tests and captures screenshots in an Xvfb virtual display (1920×1080)
2. Packages the extension as a `.vsix` file
3. Uploads both `screenshots/` and the `.vsix` as GitHub Actions artifacts (retained for 7 days)

PR reviewers can download the artifacts from the **Actions** tab on GitHub. Artifacts are named with the extension version and commit SHA for easy identification.

## Manual Workflow

1. Press `F5` in VS Code to open an Extension Development Host
2. Open a file in a git repository
3. Right-click and select "Git History (File)" or "Git History for Selection"
4. Take a screenshot using your OS tool:
   - **Linux**: `import -window root screenshot.png` (ImageMagick)
   - **macOS**: `screencapture -x screenshot.png`
   - **Windows**: Use the Snipping Tool or `Win+Shift+S`
5. Drag and drop the screenshot into your PR description on GitHub

## Example Scenario

1. Open `README.md`
2. Select the Features section (lines 7–17)
3. Right-click → "Git History for Selection"
4. The extension opens showing commits that touched those lines
5. Capture the full VS Code window
