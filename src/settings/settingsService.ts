import * as vscode from 'vscode';
import { UserSettings, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from './settingsTypes';

/**
 * Service for persisting and retrieving user settings
 * Uses VS Code's ExtensionContext.globalState for storage
 */
export class SettingsService {
  private readonly _memento: vscode.Memento;

  constructor(memento: vscode.Memento) {
    this._memento = memento;
  }

  /**
   * Save user settings to global state
   * @param settings - The settings to save
   */
  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = this.getSettings();
    const newSettings: UserSettings = {
      ...currentSettings,
      ...settings
    };
    await this._memento.update(SETTINGS_STORAGE_KEY, newSettings);
  }

  /**
   * Get saved user settings, falling back to defaults if none exist
   * @returns The current user settings
   */
  getSettings(): UserSettings {
    const saved = this._memento.get<UserSettings>(SETTINGS_STORAGE_KEY);
    if (!saved) {
      return { ...DEFAULT_SETTINGS };
    }

    // Merge with defaults to handle any missing fields (backward compatibility)
    return {
      ...DEFAULT_SETTINGS,
      ...saved
    };
  }

  /**
   * Reset all settings to defaults
   */
  async resetSettings(): Promise<void> {
    await this._memento.update(SETTINGS_STORAGE_KEY, undefined);
  }

  /**
   * Get a single setting value
   * @param key - The setting key
   * @returns The setting value
   */
  getSetting<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return this.getSettings()[key];
  }

  /**
   * Update a single setting value
   * @param key - The setting key
   * @param value - The new value
   */
  async setSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    await this.saveSettings({ [key]: value } as Partial<UserSettings>);
  }
}
