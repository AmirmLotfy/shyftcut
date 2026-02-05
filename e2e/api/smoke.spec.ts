import { test, expect } from '@playwright/test';

test.describe('API Smoke', () => {
  test('GET /api/profile without auth returns 401 when API available', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || process.env.VITE_API_URL;
    if (!apiBase) {
      test.skip(true, 'PLAYWRIGHT_API_URL or VITE_API_URL not set; API smoke skipped (preview-only mode)');
      return;
    }
    const url = apiBase.replace(/\/$/, '') + '/api';
    const res = await request.get(url, {
      headers: { 'X-Path': '/api/profile', 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });
});
