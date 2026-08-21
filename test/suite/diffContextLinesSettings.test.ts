import * as assert from 'assert';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

suite('DiffContextLines Settings Persistence Tests', () => {
  let tempDir: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-diff-context-'));
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleMessage should call saveSettings with diffContextLines when changeDiffContextLines is received', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');

    let saveSettingsCalled = false;
    let saveSettingsArg: any = null;
    let panelSetDiffContextLinesCalled = false;
    let panelSetDiffContextLinesValue: number | null = null;

    const mockPanel: any = {
      getCwd: () => tempDir,
      getCommits: () => [],
      postMessage: () => true,
      setDiffContextLines: (value: number) => {
        panelSetDiffContextLinesCalled = true;
        panelSetDiffContextLinesValue = value;
      }
    };

    const mockSettingsService: any = {
      saveSettings: async (settings: any) => {
        saveSettingsCalled = true;
        saveSettingsArg = settings;
      },
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortMode: 0, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    const mockFirstRunTipService: any = {
      shouldShowTip: () => false,
      markAsShown: async () => {},
      reset: async () => {}
    };

    await handleMessage(
      { type: 'changeDiffContextLines', value: 7 },
      mockPanel,
      mockSettingsService,
      mockFirstRunTipService
    );

    assert.strictEqual(panelSetDiffContextLinesCalled, true, 'panel.setDiffContextLines should be called');
    assert.strictEqual(panelSetDiffContextLinesValue, 7, 'panel.setDiffContextLines should be called with value 7');
    assert.strictEqual(saveSettingsCalled, true, 'settingsService.saveSettings should be called');
    assert.deepStrictEqual(saveSettingsArg, { diffContextLines: 7 }, 'saveSettings should be called with diffContextLines: 7');
  });

  test('handleMessage should call saveSettings with different diffContextLines values', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');

    const testValues = [1, 5, 10];

    for (const value of testValues) {
      let saveSettingsArg: any = null;

      const mockPanel: any = {
        getCwd: () => tempDir,
        getCommits: () => [],
        postMessage: () => true,
        setDiffContextLines: () => {}
      };

      const mockSettingsService: any = {
        saveSettings: async (settings: any) => { saveSettingsArg = settings; },
        getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortMode: 0, hideMergeCommits: false, regexSearchEnabled: false }),
        resetSettings: async () => {},
        getSetting: () => undefined,
        setSetting: async () => {}
      };

      const mockFirstRunTipService: any = {
        shouldShowTip: () => false,
        markAsShown: async () => {},
        reset: async () => {}
      };

      await handleMessage(
        { type: 'changeDiffContextLines', value },
        mockPanel,
        mockSettingsService,
        mockFirstRunTipService
      );

      assert.deepStrictEqual(saveSettingsArg, { diffContextLines: value }, `saveSettings should be called with diffContextLines: ${value}`);
    }
  });
});
