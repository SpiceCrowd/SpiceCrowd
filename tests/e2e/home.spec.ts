import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Spice Crowd/);
  await expect(page.locator('text=Spice Crowd')).toBeDefined();
});
