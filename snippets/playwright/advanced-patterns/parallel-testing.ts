import { test, expect, devices } from '@playwright/test';

// Parallel testing patterns
test.describe.configure({ mode: 'parallel' });

test.describe('Parallel Test Execution', () => {
  // These tests run in parallel
  test('test 1', async ({ page }) => {
    await page.goto('/page1');
    await expect(page.getByText('Page 1')).toBeVisible();
  });

  test('test 2', async ({ page }) => {
    await page.goto('/page2');
    await expect(page.getByText('Page 2')).toBeVisible();
  });

  test('test 3', async ({ page }) => {
    await page.goto('/page3');
    await expect(page.getByText('Page 3')).toBeVisible();
  });
});

// Serial testing within a describe block
test.describe.configure({ mode: 'serial' });

test.describe('Serial Test Execution', () => {
  // These tests run one after another
  test('setup data', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Setup Test Data' }).click();
    await expect(page.getByText('Data setup complete')).toBeVisible();
  });

  test('run test with data', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Test data loaded')).toBeVisible();
  });

  test('cleanup data', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Cleanup Test Data' }).click();
    await expect(page.getByText('Data cleanup complete')).toBeVisible();
  });
});

// Worker-scoped fixtures for shared state
test.describe('Worker-scoped Tests', () => {
  let sharedData: any;

  test.beforeAll(async ({ browser }) => {
    // This runs once per worker
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Setup shared data
    await page.goto('/api/setup');
    const response = await page.request.post('/api/test-data', {
      data: { type: 'integration-test' }
    });
    
    sharedData = await response.json();
    await context.close();
  });

  test('use shared data 1', async ({ page }) => {
    await page.goto(`/data/${sharedData.id}`);
    await expect(page.getByText(sharedData.name)).toBeVisible();
  });

  test('use shared data 2', async ({ page }) => {
    await page.goto(`/edit/${sharedData.id}`);
    await expect(page.getByValue(sharedData.name)).toBeVisible();
  });
});

// Cross-browser parallel testing
const browsers = [
  { name: 'chromium', ...devices['Desktop Chrome'] },
  { name: 'firefox', ...devices['Desktop Firefox'] },
  { name: 'webkit', ...devices['Desktop Safari'] }
];

browsers.forEach(browser => {
  test.describe(`Cross-browser tests - ${browser.name}`, () => {
    test.use(browser);

    test('responsive design test', async ({ page }) => {
      await page.goto('/responsive-page');
      
      // Test desktop view
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('.desktop-menu')).toBeVisible();
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('.mobile-menu')).toBeVisible();
    });

    test('browser-specific features', async ({ page, browserName }) => {
      await page.goto('/browser-features');
      
      if (browserName === 'chromium') {
        // Test Chrome-specific features
        await expect(page.locator('.chrome-only-feature')).toBeVisible();
      } else if (browserName === 'firefox') {
        // Test Firefox-specific features
        await expect(page.locator('.firefox-only-feature')).toBeVisible();
      }
    });
  });
});

// Parameterized parallel testing
const testData = [
  { username: 'user1', expectedMessage: 'Welcome user1' },
  { username: 'user2', expectedMessage: 'Welcome user2' },
  { username: 'user3', expectedMessage: 'Welcome user3' }
];

testData.forEach(({ username, expectedMessage }) => {
  test(`login test for ${username}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page.getByText(expectedMessage)).toBeVisible();
  });
});

// Load balancing and test distribution
test.describe('Load Balanced Tests', () => {
  // These tests will be distributed across workers
  for (let i = 0; i < 20; i++) {
    test(`parallel test ${i}`, async ({ page }) => {
      await page.goto(`/test-page-${i}`);
      await expect(page.getByText(`Test ${i}`)).toBeVisible();
    });
  }
});

// Retry logic for flaky tests
test.describe('Retry Patterns', () => {
  test('flaky test with retry', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('/flaky-endpoint');
    
    // Wait for potentially slow loading element
    await expect(page.locator('.dynamic-content')).toBeVisible({ timeout: 30000 });
    
    // Retry assertion multiple times
    await expect(async () => {
      const text = await page.locator('.status').textContent();
      expect(text).toBe('Ready');
    }).toPass({ timeout: 10000 });
  });
});

// Conditional parallel execution
test.describe('Conditional Execution', () => {
  const shouldRunParallel = process.env.PARALLEL_EXECUTION === 'true';
  
  if (shouldRunParallel) {
    test.describe.configure({ mode: 'parallel' });
  }

  test('conditional test 1', async ({ page }) => {
    await page.goto('/conditional-page');
    await expect(page.getByText('Conditional content')).toBeVisible();
  });

  test('conditional test 2', async ({ page }) => {
    await page.goto('/another-conditional-page');
    await expect(page.getByText('More content')).toBeVisible();
  });
});

// Performance testing in parallel
test.describe('Performance Tests', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/performance-test');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Less than 5 seconds
  });

  test('API performance', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/performance-test');
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Less than 1 second
  });
});

// Parallel data-driven testing
const countries = ['US', 'UK', 'DE', 'FR', 'JP'];

countries.forEach(country => {
  test(`localization test for ${country}`, async ({ page }) => {
    await page.goto(`/localized?country=${country}`);
    await expect(page.locator('.country-specific-content')).toBeVisible();
    
    // Verify country-specific elements
    await expect(page.locator(`[data-country="${country}"]`)).toBeVisible();
  });
});