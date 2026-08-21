import * as assert from 'assert';
import * as vscode from 'vscode';
import { FirstRunTipService } from '../../src/firstRunTip/firstRunTip';

// Mock Memento for testing (same pattern as settingsServiceUnit.test.ts)
class MockMemento implements vscode.Memento {
	private store = new Map<string, any>();

	get<T>(key: string): T | undefined;
	get<T>(key: string, defaultValue: T): T;
	get<T>(key: string, defaultValue?: T): T | undefined {
		if (defaultValue !== undefined) {
			return this.store.has(key) ? (this.store.get(key) as T) : defaultValue;
		}
		return this.store.get(key) as T | undefined;
	}

	update(key: string, value: any): Thenable<void> {
		if (value === undefined) {
			this.store.delete(key);
		} else {
			this.store.set(key, value);
		}
		return Promise.resolve();
	}

	keys(): readonly string[] {
		return Array.from(this.store.keys());
	}
}

suite('FirstRunTipService Unit Tests', () => {
	let mockMemento: MockMemento;
	let service: FirstRunTipService;

	setup(() => {
		mockMemento = new MockMemento();
		service = new FirstRunTipService(mockMemento);
	});

	suite('shouldShowTip', () => {
		test('returns true on first run when tip not shown', () => {
			assert.strictEqual(service.shouldShowTip(), true);
		});

		test('returns false after tip has been shown', async () => {
			await service.markAsShown();
			assert.strictEqual(service.shouldShowTip(), false);
		});

		test('returns true when key is explicitly set to false', async () => {
			await mockMemento.update('gitHistory.firstRunShown', false);
			assert.strictEqual(service.shouldShowTip(), true);
		});

		test('returns default false when key is not set', () => {
			const defaultValue = mockMemento.get<boolean>('gitHistory.firstRunShown', false);
			assert.strictEqual(defaultValue, false);
			assert.strictEqual(service.shouldShowTip(), true);
		});
	});

	suite('markAsShown', () => {
		test('sets the first-run tip shown flag to true', async () => {
			await service.markAsShown();

			const stored = mockMemento.get<boolean>('gitHistory.firstRunShown');
			assert.strictEqual(stored, true);
		});

		test('makes shouldShowTip return false after calling markAsShown', async () => {
			await service.markAsShown();
			assert.strictEqual(service.shouldShowTip(), false);
		});

		test('can be called multiple times without error', async () => {
			await service.markAsShown();
			await service.markAsShown();
			await service.markAsShown();

			assert.strictEqual(service.shouldShowTip(), false);
		});
	});

	suite('reset', () => {
		test('resets the first-run tip state to allow showing again', async () => {
			await service.markAsShown();
			assert.strictEqual(service.shouldShowTip(), false);

			await service.reset();
			assert.strictEqual(service.shouldShowTip(), true);
		});

		test('sets the first-run tip shown flag to false', async () => {
			await service.markAsShown();
			await service.reset();

			const stored = mockMemento.get<boolean>('gitHistory.firstRunShown');
			assert.strictEqual(stored, false);
		});

		test('can reset even when tip was never shown', async () => {
			await service.reset();
			assert.strictEqual(service.shouldShowTip(), true);
		});
	});

	suite('persistence across service restarts', () => {
		test('shouldShowTip returns false for new service instance after markAsShown', async () => {
			await service.markAsShown();
			const newService = new FirstRunTipService(mockMemento);

			assert.strictEqual(newService.shouldShowTip(), false);
		});

		test('shouldShowTip returns true for new service instance after reset', async () => {
			await service.markAsShown();
			await service.reset();
			const newService = new FirstRunTipService(mockMemento);

			assert.strictEqual(newService.shouldShowTip(), true);
		});

		test('state persists in the memento', async () => {
			await service.markAsShown();

			// Verify directly in memento
			assert.strictEqual(mockMemento.get<boolean>('gitHistory.firstRunShown'), true);
		});
	});

	suite('integration scenarios', () => {
		test('full lifecycle: show tip, dismiss, reset, show again', () => {
			// First run - should show
			assert.strictEqual(service.shouldShowTip(), true);

			// Mark as shown
			service.markAsShown();

			// New instance - should not show
			const afterDismiss = new FirstRunTipService(mockMemento);
			assert.strictEqual(afterDismiss.shouldShowTip(), false);

			// Reset
			afterDismiss.reset();

			// New instance - should show again
			const afterReset = new FirstRunTipService(mockMemento);
			assert.strictEqual(afterReset.shouldShowTip(), true);
		});

		test('concurrent service instances share same memento', async () => {
			const service1 = new FirstRunTipService(mockMemento);
			const service2 = new FirstRunTipService(mockMemento);

			assert.strictEqual(service1.shouldShowTip(), true);
			assert.strictEqual(service2.shouldShowTip(), true);

			await service1.markAsShown();

			// Both should reflect the change
			assert.strictEqual(service1.shouldShowTip(), false);
			assert.strictEqual(service2.shouldShowTip(), false);
		});
	});
});