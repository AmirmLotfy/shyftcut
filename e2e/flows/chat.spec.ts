import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('Chat page loads', async ({ page }) => {
  await page.goto('/chat');
  await expect(page).toHaveURL('/chat');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('Chat input and send button work', async ({ page }) => {
  await page.goto('/chat');
  await expect(page.getByTestId('chat-input')).toBeVisible();
  await expect(page.getByTestId('chat-send')).toBeVisible();
  await page.getByTestId('chat-input').fill('What skills do I need for product management?');
  await page.getByTestId('chat-send').click();
  // After send: message list shows user message, then assistant (API) or error toast (no API)
  await expect(page.getByTestId('chat-message-list')).toBeVisible({ timeout: 5000 });
});
