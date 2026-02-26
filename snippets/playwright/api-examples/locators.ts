import { test, expect } from '@playwright/test';

test.describe('Locator examples', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test('text locators', async ({ page }) => {
    // Get by text
    await page.getByText('Welcome').click();
    await page.getByText('Welcome', { exact: true }).click();
    
    // Get by partial text
    await page.getByText(/Welcome.*user/i).click();
    
    // Get by placeholder
    await page.getByPlaceholder('Enter your name').fill('John');
    
    // Get by label
    await page.getByLabel('Email').fill('john@example.com');
    
    // Get by title
    await page.getByTitle('Close dialog').click();
  });

  test('role-based locators', async ({ page }) => {
    // Get by role
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('checkbox', { name: 'Remember me' }).check();
    
    // Get by role with exact match
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
  });

  test('attribute-based locators', async ({ page }) => {
    // Get by test ID
    await page.getByTestId('submit-button').click();
    
    // Get by alt text
    await page.getByAltText('Company logo').click();
    
    // Custom data attributes
    await page.locator('[data-cy="login-form"]').click();
    await page.locator('[data-testid="user-menu"]').click();
  });

  test('css and xpath locators', async ({ page }) => {
    // CSS selectors
    await page.locator('button.primary').click();
    await page.locator('#submit-btn').click();
    await page.locator('input[type="email"]').fill('test@example.com');
    
    // XPath selectors
    await page.locator('//button[contains(text(), "Submit")]').click();
    await page.locator('//input[@placeholder="Username"]').fill('admin');
  });

  test('filtering and chaining', async ({ page }) => {
    // Filter by text
    await page.locator('button').filter({ hasText: 'Submit' }).click();
    
    // Filter by other locator
    await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Product' }) }).click();
    
    // Chaining locators
    await page.locator('nav').getByRole('link', { name: 'Products' }).click();
    await page.locator('.user-menu').getByRole('button', { name: 'Logout' }).click();
    
    // nth element
    await page.locator('li').nth(0).click();
    await page.locator('li').first().click();
    await page.locator('li').last().click();
  });

  test('frame and iframe locators', async ({ page }) => {
    // Frame locator
    const frame = page.frameLocator('#my-frame');
    await frame.getByRole('button', { name: 'Submit' }).click();
    
    // Nested frames
    const nestedFrame = frame.frameLocator('#nested-frame');
    await nestedFrame.getByText('Content').click();
  });

  test('locator actions', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Submit' });
    
    // Basic actions
    await button.click();
    await button.dblclick();
    await button.hover();
    await button.focus();
    
    // Input actions
    const input = page.getByLabel('Email');
    await input.fill('test@example.com');
    await input.clear();
    await input.type('new@example.com');
    
    // Checkbox and radio
    await page.getByRole('checkbox', { name: 'Agree' }).check();
    await page.getByRole('checkbox', { name: 'Agree' }).uncheck();
    await page.getByRole('radio', { name: 'Option 1' }).check();
    
    // Select dropdown
    await page.getByRole('combobox').selectOption('value1');
    await page.getByRole('combobox').selectOption({ label: 'Option 1' });
    
    // File upload
    await page.getByLabel('Upload').setInputFiles('path/to/file.pdf');
    await page.getByLabel('Upload').setInputFiles(['file1.pdf', 'file2.pdf']);
  });
});