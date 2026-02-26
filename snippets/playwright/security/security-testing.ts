import { test, expect } from '@playwright/test';

// Security testing patterns
test.describe('Security Testing', () => {
  test('XSS prevention', async ({ page }) => {
    await page.goto('/xss-test-page');
    
    // Try to inject malicious script
    const maliciousScript = '<script>alert("XSS")</script>';
    
    await page.getByLabel('User Input').fill(maliciousScript);
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Verify script is not executed (escaped/sanitized)
    const displayedContent = await page.locator('.user-content').textContent();
    expect(displayedContent).toContain('&lt;script&gt;');
    
    // Verify no alert was triggered
    page.on('dialog', dialog => {
      throw new Error('XSS vulnerability detected: alert was triggered');
    });
  });

  test('CSRF protection', async ({ page }) => {
    await page.goto('/csrf-test-page');
    
    // Get CSRF token
    const csrfToken = await page.locator('input[name="csrf_token"]').getAttribute('value');
    expect(csrfToken).toBeTruthy();
    
    // Test valid request with CSRF token
    await page.getByLabel('Amount').fill('100');
    await page.getByRole('button', { name: 'Transfer' }).click();
    
    await expect(page.getByText('Transfer successful')).toBeVisible();
    
    // Test invalid request without CSRF token
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/transfer';
      
      const input = document.createElement('input');
      input.name = 'amount';
      input.value = '100';
      form.appendChild(input);
      
      document.body.appendChild(form);
      form.submit();
    });
    
    // Should be blocked
    await expect(page.getByText('CSRF token validation failed')).toBeVisible();
  });

  test('SQL injection prevention', async ({ page }) => {
    await page.goto('/search-page');
    
    // Try SQL injection attack
    const maliciousQuery = "'; DROP TABLE users; --";
    
    await page.getByLabel('Search').fill(maliciousQuery);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Verify query is handled safely
    await expect(page.getByText('No results found')).toBeVisible();
    
    // Verify application still functions (table wasn't dropped)
    await page.getByLabel('Search').fill('normal query');
    await page.getByRole('button', { name: 'Search' }).click();
    
    await expect(page.locator('.search-results')).toBeVisible();
  });

  test('authentication bypass attempts', async ({ page }) => {
    // Try to access protected page without authentication
    const response = await page.goto('/admin/dashboard');
    
    // Should redirect to login
    expect(page.url()).toContain('/login');
    
    // Try direct API access
    const apiResponse = await page.request.get('/api/admin/users');
    expect(apiResponse.status()).toBe(401);
    
    // Try session manipulation
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });
});

// Content Security Policy testing
test.describe('CSP Testing', () => {
  test('CSP headers validation', async ({ page }) => {
    const response = await page.goto('/csp-test-page');
    
    // Check CSP headers
    const cspHeader = response?.headers()['content-security-policy'];
    expect(cspHeader).toBeTruthy();
    expect(cspHeader).toContain("default-src 'self'");
    expect(cspHeader).toContain("script-src 'self'");
    
    // Try to execute inline script (should be blocked)
    const scriptBlocked = await page.evaluate(() => {
      try {
        eval('console.log("Inline script executed")');
        return false;
      } catch (e) {
        return true;
      }
    });
    
    expect(scriptBlocked).toBe(true);
  });

  test('external resource blocking', async ({ page }) => {
    await page.goto('/external-resource-page');
    
    // Monitor blocked requests
    const blockedRequests: string[] = [];
    page.on('requestfailed', request => {
      blockedRequests.push(request.url());
    });
    
    // Try to load external script
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.src = 'https://malicious-site.com/script.js';
      document.head.appendChild(script);
    });
    
    await page.waitForTimeout(1000);
    
    // Verify external script was blocked
    expect(blockedRequests.some(url => url.includes('malicious-site.com'))).toBe(true);
  });
});

// Input validation testing
test.describe('Input Validation', () => {
  test('form validation security', async ({ page }) => {
    await page.goto('/form-validation-page');
    
    // Test various malicious inputs
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '../../etc/passwd',
      'javascript:alert("xss")',
      'SELECT * FROM users',
      '{{7*7}}', // Template injection
      '${7*7}',  // Expression injection
    ];
    
    for (const input of maliciousInputs) {
      await page.getByLabel('User Input').fill(input);
      await page.getByRole('button', { name: 'Submit' }).click();
      
      // Verify input is rejected or sanitized
      const errorMessage = await page.locator('.error-message').textContent();
      expect(errorMessage).toContain('Invalid input');
      
      // Clear the input
      await page.getByLabel('User Input').clear();
    }
  });

  test('file upload security', async ({ page }) => {
    await page.goto('/file-upload-page');
    
    // Try to upload malicious file
    const maliciousFile = 'test-files/malicious.exe';
    
    await page.getByLabel('Upload File').setInputFiles(maliciousFile);
    await page.getByRole('button', { name: 'Upload' }).click();
    
    // Verify file type is rejected
    await expect(page.getByText('Invalid file type')).toBeVisible();
    
    // Test file size limits
    const largeFile = 'test-files/large-file.pdf'; // > 10MB
    
    await page.getByLabel('Upload File').setInputFiles(largeFile);
    await page.getByRole('button', { name: 'Upload' }).click();
    
    await expect(page.getByText('File size too large')).toBeVisible();
  });

  test('API parameter validation', async ({ request }) => {
    // Test invalid user ID
    const response1 = await request.get('/api/users/invalid-id');
    expect(response1.status()).toBe(400);
    
    // Test negative numbers
    const response2 = await request.get('/api/users/-1');
    expect(response2.status()).toBe(400);
    
    // Test SQL injection in parameters
    const response3 = await request.get('/api/users/1; DROP TABLE users;');
    expect(response3.status()).toBe(400);
    
    // Test XSS in parameters
    const response4 = await request.get('/api/search?q=<script>alert(1)</script>');
    expect(response4.status()).toBe(400);
  });
});

// Authentication and authorization testing
test.describe('Authentication Security', () => {
  test('password policy enforcement', async ({ page }) => {
    await page.goto('/register');
    
    // Test weak passwords
    const weakPasswords = [
      '123456',
      'password',
      'abc123',
      'qwerty',
      '12345678'
    ];
    
    for (const password of weakPasswords) {
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Register' }).click();
      
      await expect(page.getByText('Password does not meet requirements')).toBeVisible();
      
      await page.getByLabel('Password').clear();
    }
    
    // Test strong password
    await page.getByLabel('Password').fill('StrongP@ssw0rd123!');
    await page.getByRole('button', { name: 'Register' }).click();
    
    await expect(page.getByText('Password does not meet requirements')).not.toBeVisible();
  });

  test('session management', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify session is created
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.secure).toBe(true);
    
    // Test session timeout
    await page.evaluate(() => {
      // Simulate session timeout
      localStorage.setItem('session_timeout', Date.now().toString());
    });
    
    await page.reload();
    
    // Should be redirected to login
    expect(page.url()).toContain('/login');
  });

  test('privilege escalation prevention', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.getByLabel('Username').fill('regularuser');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Try to access admin page
    const response = await page.goto('/admin/users');
    expect(response?.status()).toBe(403);
    
    // Try to modify admin settings via API
    const apiResponse = await page.request.post('/api/admin/settings', {
      data: { setting: 'value' }
    });
    expect(apiResponse.status()).toBe(403);
  });
});

// Data privacy and GDPR compliance
test.describe('Data Privacy', () => {
  test('PII data handling', async ({ page }) => {
    await page.goto('/profile-page');
    
    // Check that sensitive data is masked
    const ssnField = page.locator('input[name="ssn"]');
    const ssnValue = await ssnField.getAttribute('value');
    
    if (ssnValue) {
      expect(ssnValue).toMatch(/\*\*\*-\*\*-\d{4}/); // Masked SSN format
    }
    
    // Test data export functionality
    await page.getByRole('button', { name: 'Export My Data' }).click();
    
    await expect(page.getByText('Data export will be emailed to you')).toBeVisible();
  });

  test('data deletion compliance', async ({ page }) => {
    await page.goto('/account-settings');
    
    // Test account deletion
    await page.getByRole('button', { name: 'Delete Account' }).click();
    
    // Verify confirmation dialog
    await expect(page.getByText('Are you sure you want to delete your account?')).toBeVisible();
    
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    
    // Verify data deletion confirmation
    await expect(page.getByText('Your account has been scheduled for deletion')).toBeVisible();
  });
});

// Security headers testing
test.describe('Security Headers', () => {
  test('security headers validation', async ({ page }) => {
    const response = await page.goto('/secure-page');
    
    const headers = response?.headers();
    
    // Check security headers
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['x-xss-protection']).toBe('1; mode=block');
    expect(headers?.['strict-transport-security']).toContain('max-age=');
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('clickjacking prevention', async ({ page }) => {
    // Try to embed page in iframe
    await page.goto('/iframe-test-page');
    
    const iframe = page.locator('iframe');
    await iframe.waitFor({ state: 'attached' });
    
    // Verify iframe is blocked
    const iframeContent = await iframe.evaluate(el => el.contentDocument);
    expect(iframeContent).toBe(null); // Should be blocked by X-Frame-Options
  });
});