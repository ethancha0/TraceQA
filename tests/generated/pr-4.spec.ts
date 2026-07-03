import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('Verify Home Page Text Update', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Verify that the text 'testing4' is displayed
    const updatedText = await page.getByText('testing4');
    await expect(updatedText).toBeVisible();
  });
});