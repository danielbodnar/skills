import { test, expect } from '@playwright/test';

// Basic test structure
test('basic example', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.locator('h1')).toHaveText('Example Domain');
});

// Test with setup and teardown
test.describe('User authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page.locator('.welcome-message')).toBeVisible();
  });
});

// Test with multiple assertions
test('comprehensive page test', async ({ page }) => {
  await page.goto('https://playwright.dev');
  
  // Title assertion
  await expect(page).toHaveTitle(/Playwright/);
  
  // Element visibility
  await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
  
  // Text content
  await expect(page.locator('h1')).toContainText('Playwright');
  
  // Click and navigation
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/.*intro/);
});

// Test with custom timeout
test('test with custom timeout', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('https://example.com');
  await expect(page.locator('.slow-loading-element')).toBeVisible({ timeout: 10000 });
});