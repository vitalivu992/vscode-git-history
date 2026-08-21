import * as vscode from 'vscode';

const FIRST_RUN_SHOWN_KEY = 'gitHistory.firstRunShown';

/**
 * Service for managing first-run welcome tip state
 * Uses VS Code's ExtensionContext.globalState for storage
 */
export class FirstRunTipService {
  private readonly _memento: vscode.Memento;

  constructor(memento: vscode.Memento) {
    this._memento = memento;
  }

  /**
   * Check if the first-run tip should be shown
   * @returns true if the tip hasn't been shown yet, false otherwise
   */
  shouldShowTip(): boolean {
    return !this._memento.get<boolean>(FIRST_RUN_SHOWN_KEY, false);
  }

  /**
   * Mark the first-run tip as shown
   * This prevents the tip from appearing in future sessions
   */
  async markAsShown(): Promise<void> {
    await this._memento.update(FIRST_RUN_SHOWN_KEY, true);
  }

  /**
   * Reset the first-run tip state
   * This allows the tip to be shown again (useful for testing)
   */
  async reset(): Promise<void> {
    await this._memento.update(FIRST_RUN_SHOWN_KEY, false);
  }
}
