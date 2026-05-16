import * as assert from 'assert';
import { formatRelativeTime } from '../../src/blame/blameService';

suite('formatRelativeTime', () => {
	suite('Time ranges', () => {
		test('returns "just now" for timestamps < 60 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 30; // 30 seconds ago
			assert.strictEqual(formatRelativeTime(timestamp), 'just now');
		});

		test('returns "X minute(s) ago" for timestamps < 1 hour', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 1800; // 30 minutes ago
			assert.strictEqual(formatRelativeTime(timestamp), '30 minutes ago');
		});

		test('returns "X hour(s) ago" for timestamps < 1 day', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 7200; // 2 hours ago
			assert.strictEqual(formatRelativeTime(timestamp), '2 hours ago');
		});

		test('returns "X day(s) ago" for timestamps < 1 week', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 172800; // 2 days ago
			assert.strictEqual(formatRelativeTime(timestamp), '2 days ago');
		});

		test('returns "X week(s) ago" for timestamps < 1 month', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 1209600; // 2 weeks ago
			assert.strictEqual(formatRelativeTime(timestamp), '2 weeks ago');
		});

		test('returns "X month(s) ago" for timestamps < 1 year', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 5184000; // 2 months ago
			assert.strictEqual(formatRelativeTime(timestamp), '2 months ago');
		});

		test('returns "X year(s) ago" for timestamps >= 1 year', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 63072000; // 2 years ago
			assert.strictEqual(formatRelativeTime(timestamp), '2 years ago');
		});
	});

	suite('Singular forms', () => {
		test('returns singular "minute" for 60 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 60; // Exactly 1 minute
			assert.strictEqual(formatRelativeTime(timestamp), '1 minute ago');
		});

		test('returns singular "hour" for 3600 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 3600; // Exactly 1 hour
			assert.strictEqual(formatRelativeTime(timestamp), '1 hour ago');
		});

		test('returns singular "day" for 86400 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 86400; // Exactly 1 day
			assert.strictEqual(formatRelativeTime(timestamp), '1 day ago');
		});

		test('returns singular "week" for 604800 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 604800; // Exactly 1 week
			assert.strictEqual(formatRelativeTime(timestamp), '1 week ago');
		});

		test('returns singular "month" for 2592000 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 2592000; // Exactly 1 month
			assert.strictEqual(formatRelativeTime(timestamp), '1 month ago');
		});

		test('returns singular "year" for 31536000 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 31536000; // Exactly 1 year
			assert.strictEqual(formatRelativeTime(timestamp), '1 year ago');
		});
	});

	suite('Plural forms', () => {
		test('returns plural "minutes" for 120 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 120; // 2 minutes
			assert.strictEqual(formatRelativeTime(timestamp), '2 minutes ago');
		});

		test('returns plural "hours" for 7200 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 7200; // 2 hours
			assert.strictEqual(formatRelativeTime(timestamp), '2 hours ago');
		});

		test('returns plural "days" for 172800 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 172800; // 2 days
			assert.strictEqual(formatRelativeTime(timestamp), '2 days ago');
		});

		test('returns plural "weeks" for 1209600 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 1209600; // 2 weeks
			assert.strictEqual(formatRelativeTime(timestamp), '2 weeks ago');
		});

		test('returns plural "months" for 5184000 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 5184000; // 2 months
			assert.strictEqual(formatRelativeTime(timestamp), '2 months ago');
		});

		test('returns plural "years" for 63072000 seconds', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 63072000; // 2 years
			assert.strictEqual(formatRelativeTime(timestamp), '2 years ago');
		});
	});

	suite('Boundary conditions', () => {
		test('handles 59 seconds -> "just now"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 59; // Just under 1 minute
			assert.strictEqual(formatRelativeTime(timestamp), 'just now');
		});

		test('handles 60 seconds -> "1 minute ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 60; // Exactly 1 minute
			assert.strictEqual(formatRelativeTime(timestamp), '1 minute ago');
		});

		test('handles 3599 seconds -> "59 minutes ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 3599; // Just under 1 hour
			assert.strictEqual(formatRelativeTime(timestamp), '59 minutes ago');
		});

		test('handles 3600 seconds -> "1 hour ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 3600; // Exactly 1 hour
			assert.strictEqual(formatRelativeTime(timestamp), '1 hour ago');
		});

		test('handles 86399 seconds -> "23 hours ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 86399; // Just under 1 day
			assert.strictEqual(formatRelativeTime(timestamp), '23 hours ago');
		});

		test('handles 86400 seconds -> "1 day ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 86400; // Exactly 1 day
			assert.strictEqual(formatRelativeTime(timestamp), '1 day ago');
		});

		test('handles 604799 seconds -> "6 days ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 604799; // Just under 1 week
			assert.strictEqual(formatRelativeTime(timestamp), '6 days ago');
		});

		test('handles 604800 seconds -> "1 week ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 604800; // Exactly 1 week
			assert.strictEqual(formatRelativeTime(timestamp), '1 week ago');
		});

		test('handles 2591999 seconds -> "4 weeks ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 2591999; // Just under 1 month
			assert.strictEqual(formatRelativeTime(timestamp), '4 weeks ago');
		});

		test('handles 2592000 seconds -> "1 month ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 2592000; // Exactly 1 month
			assert.strictEqual(formatRelativeTime(timestamp), '1 month ago');
		});

		test('handles 31535999 seconds -> "11 months ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 31535999; // Just under 1 year
			assert.strictEqual(formatRelativeTime(timestamp), '11 months ago');
		});

		test('handles 31536000 seconds -> "1 year ago"', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 31536000; // Exactly 1 year
			assert.strictEqual(formatRelativeTime(timestamp), '1 year ago');
		});
	});

	suite('Edge cases', () => {
		test('handles 0 seconds (current time)', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now; // Current time
			assert.strictEqual(formatRelativeTime(timestamp), 'just now');
		});

		test('handles 1 second ago', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 1;
			assert.strictEqual(formatRelativeTime(timestamp), 'just now');
		});

		test('handles large time differences', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 315360000; // 10 years
			assert.strictEqual(formatRelativeTime(timestamp), '10 years ago');
		});

		test('handles fractional minute boundaries correctly', () => {
			const now = Math.floor(Date.now() / 1000);
			const timestamp = now - 61; // 1 minute and 1 second
			assert.strictEqual(formatRelativeTime(timestamp), '1 minute ago');
		});

		test('handles values that result in zero after division', () => {
			const now = Math.floor(Date.now() / 1000);
			// 2592000 / 2592000 = 1 month, not 0
			const timestamp = now - 2592000;
			assert.strictEqual(formatRelativeTime(timestamp), '1 month ago');
		});
	});
});
