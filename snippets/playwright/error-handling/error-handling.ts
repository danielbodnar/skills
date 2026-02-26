import { test, expect } from '@playwright/test';

// Error handling patterns
test.describe('Error Handling', () => {
  test('handle network errors', async ({ page }) => {
    // Set up network error simulation
    await page.route('**/api/data', route => {
      route.abort('failed');
    });

    await page.goto('/data-page');
    
    // Verify error state is displayed
    await expect(page.getByText('Failed to load data')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('handle timeout errors', async ({ page }) => {
    // Set up slow response
    await page.route('**/api/slow-endpoint', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: 'slow response' })
        });
      }, 10000);
    });

    await page.goto('/slow-page');
    
    // Expect timeout error to be handled gracefully
    await expect(page.getByText('Request timeout')).toBeVisible({ timeout: 5000 });
  });

  test('handle 404 errors', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
    
    // Verify 404 page is displayed
    await expect(page.getByText('Page not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible();
  });

  test('handle 500 errors', async ({ page }) => {
    // Mock server error
    await page.route('**/api/error-endpoint', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/error-page');
    
    // Verify error handling
    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Report issue' })).toBeVisible();
  });
});

// Exception handling in test execution
test.describe('Exception Handling', () => {
  test('handle JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/js-error-page');
    
    // Trigger JavaScript error
    await page.getByRole('button', { name: 'Trigger Error' }).click();
    
    // Verify error was caught
    expect(errors).toContain('ReferenceError: undefinedVariable is not defined');
  });

  test('handle promise rejections', async ({ page }) => {
    const rejections: string[] = [];
    page.on('pageerror', error => {
      rejections.push(error.message);
    });

    await page.goto('/promise-rejection-page');
    await page.getByRole('button', { name: 'Trigger Promise Rejection' }).click();
    
    // Wait for promise rejection
    await page.waitForTimeout(1000);
    
    expect(rejections.length).toBeGreaterThan(0);
  });

  test('handle test failures gracefully', async ({ page }) => {
    try {
      await page.goto('/failing-page');
      await expect(page.getByText('Non-existent text')).toBeVisible({ timeout: 1000 });
    } catch (error) {
      // Log error for debugging
      console.log('Expected test failure:', error.message);
      
      // Verify page is in expected state after failure
      await expect(page.getByText('Page loaded')).toBeVisible();
    }
  });
});

// Retry mechanisms
test.describe('Retry Patterns', () => {
  test('automatic retry on flaky assertions', async ({ page }) => {
    await page.goto('/flaky-element-page');
    
    // This will retry until condition is met or timeout
    await expect(async () => {
      const element = page.locator('.dynamic-element');
      await expect(element).toBeVisible();
      await expect(element).toHaveText('Expected text');
    }).toPass({ timeout: 10000 });
  });

  test('manual retry with custom logic', async ({ page }) => {
    await page.goto('/retry-page');
    
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await page.getByRole('button', { name: 'Flaky Button' }).click();
        await expect(page.getByText('Success')).toBeVisible({ timeout: 2000 });
        break; // Success, exit loop
      } catch (error) {
        attempts++;
        console.log(`Attempt ${attempts} failed:`, error.message);
        
        if (attempts >= maxAttempts) {
          throw error; // Re-throw after max attempts
        }
        
        // Wait before retrying
        await page.waitForTimeout(1000);
      }
    }
  });

  test('retry with exponential backoff', async ({ page }) => {
    await page.goto('/exponential-retry-page');
    
    const maxRetries = 3;
    let retryCount = 0;
    
    const retryWithBackoff = async (operation: () => Promise<void>) => {
      while (retryCount < maxRetries) {
        try {
          await operation();
          return; // Success
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount - 1) * 1000;
          await page.waitForTimeout(delay);
        }
      }
    };

    await retryWithBackoff(async () => {
      await page.getByRole('button', { name: 'Unstable Action' }).click();
      await expect(page.getByText('Action completed')).toBeVisible({ timeout: 2000 });
    });
  });
});

// Error recovery and cleanup
test.describe('Error Recovery', () => {
  test('recover from authentication errors', async ({ page }) => {
    await page.goto('/protected-page');
    
    // Check if redirected to login due to auth error
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Recover by logging in
      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Login' }).click();
      
      // Verify recovery
      await expect(page.getByText('Welcome back')).toBeVisible();
    }
  });

  test('cleanup after test failures', async ({ page }) => {
    try {
      await page.goto('/cleanup-test-page');
      
      // Create some test data
      await page.getByRole('button', { name: 'Create Test Data' }).click();
      await expect(page.getByText('Test data created')).toBeVisible();
      
      // This might fail
      await page.getByRole('button', { name: 'Risky Operation' }).click();
      await expect(page.getByText('This might not exist')).toBeVisible();
      
    } catch (error) {
      console.log('Test failed, performing cleanup:', error.message);
      
      // Cleanup regardless of test result
      await page.getByRole('button', { name: 'Cleanup Test Data' }).click();
      await expect(page.getByText('Cleanup completed')).toBeVisible();
      
      // Re-throw to maintain test failure status
      throw error;
    } finally {
      // Always run cleanup
      if (await page.locator('.cleanup-needed').count() > 0) {
        await page.getByRole('button', { name: 'Final Cleanup' }).click();
      }
    }
  });
});

// Global error handling
test.describe('Global Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Set up global error listeners
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });
    
    page.on('requestfailed', request => {
      console.error('Request failed:', request.url());
    });
  });

  test('test with global error monitoring', async ({ page }) => {
    await page.goto('/monitored-page');
    
    // Perform actions that might cause errors
    await page.getByRole('button', { name: 'Trigger Various Actions' }).click();
    
    // Verify page still functions despite potential errors
    await expect(page.getByText('Page is functional')).toBeVisible();
  });
});

// Custom error matchers
test.describe('Custom Error Assertions', () => {
  test('verify specific error messages', async ({ page }) => {
    await page.goto('/validation-page');
    
    // Trigger validation error
    await page.getByRole('button', { name: 'Submit Empty Form' }).click();
    
    // Check for specific error messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    
    // Verify error styling
    await expect(page.locator('.error-message')).toHaveClass(/error-text/);
  });

  test('verify error state persistence', async ({ page }) => {
    await page.goto('/error-state-page');
    
    // Trigger error
    await page.getByRole('button', { name: 'Cause Error' }).click();
    await expect(page.getByText('Error occurred')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Verify error state is cleared
    await expect(page.getByText('Error occurred')).not.toBeVisible();
  });
});