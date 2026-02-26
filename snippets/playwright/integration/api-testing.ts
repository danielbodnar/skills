import { test, expect } from '@playwright/test';

// API testing with Playwright
test.describe('API Testing', () => {
  test('GET request', async ({ request }) => {
    const response = await request.get('https://api.github.com/users/microsoft');
    
    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.login).toBe('microsoft');
    expect(data.type).toBe('Organization');
  });

  test('POST request', async ({ request }) => {
    const response = await request.post('https://reqres.in/api/users', {
      data: {
        name: 'John Doe',
        job: 'Developer'
      }
    });

    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data.name).toBe('John Doe');
    expect(data.job).toBe('Developer');
    expect(data.id).toBeDefined();
  });

  test('PUT request', async ({ request }) => {
    const response = await request.put('https://reqres.in/api/users/2', {
      data: {
        name: 'Jane Smith',
        job: 'Manager'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.name).toBe('Jane Smith');
    expect(data.job).toBe('Manager');
  });

  test('DELETE request', async ({ request }) => {
    const response = await request.delete('https://reqres.in/api/users/2');
    expect(response.status()).toBe(204);
  });
});

// API testing with authentication
test.describe('Authenticated API Testing', () => {
  test.beforeAll(async ({ request }) => {
    // Set up authentication context
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        username: 'testuser',
        password: 'testpass'
      }
    });
    
    const { token } = await loginResponse.json();
    
    // Store token for subsequent requests
    await request.storageState({
      origins: [{
        origin: 'https://api.example.com',
        localStorage: [{ name: 'auth-token', value: token }]
      }]
    });
  });

  test('protected endpoint', async ({ request }) => {
    const response = await request.get('/api/user/profile', {
      headers: {
        'Authorization': 'Bearer ${TOKEN}'
      }
    });

    expect(response.status()).toBe(200);
    
    const profile = await response.json();
    expect(profile.username).toBe('testuser');
  });
});

// API testing with browser context
test.describe('API + UI Testing', () => {
  test('create resource via API, verify in UI', async ({ page, request }) => {
    // Create a new post via API
    const createResponse = await request.post('/api/posts', {
      data: {
        title: 'Test Post',
        content: 'This is a test post created via API'
      }
    });

    expect(createResponse.status()).toBe(201);
    const post = await createResponse.json();

    // Verify the post appears in the UI
    await page.goto('/posts');
    await expect(page.getByText('Test Post')).toBeVisible();
    
    // Click on the post to view details
    await page.getByText('Test Post').click();
    await expect(page.getByText('This is a test post created via API')).toBeVisible();
  });

  test('UI action triggers API call', async ({ page, context }) => {
    // Set up API response listener
    const responsePromise = context.waitForResponse(
      response => response.url().includes('/api/posts') && response.request().method() === 'POST'
    );

    // Perform UI action that triggers API call
    await page.goto('/create-post');
    await page.getByLabel('Title').fill('New Post');
    await page.getByLabel('Content').fill('Post content');
    await page.getByRole('button', { name: 'Publish' }).click();

    // Wait for and verify API call
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    
    const responseData = await response.json();
    expect(responseData.title).toBe('New Post');
  });
});

// GraphQL API testing
test.describe('GraphQL API Testing', () => {
  test('GraphQL query', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
              email
            }
          }
        `,
        variables: {
          id: '1'
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.data.user).toBeDefined();
    expect(data.data.user.id).toBe('1');
    expect(data.errors).toBeUndefined();
  });

  test('GraphQL mutation', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
              email
            }
          }
        `,
        variables: {
          input: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.data.createUser).toBeDefined();
    expect(data.data.createUser.name).toBe('John Doe');
    expect(data.data.createUser.email).toBe('john@example.com');
  });
});

// API testing with mock responses
test.describe('API Mocking', () => {
  test('mock API response', async ({ page }) => {
    // Mock API response
    await page.route('/api/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ])
      });
    });

    // Navigate to page that uses the API
    await page.goto('/users');
    
    // Verify mocked data is displayed
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
  });

  test('mock API error response', async ({ page }) => {
    // Mock API error
    await page.route('/api/users', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/users');
    
    // Verify error handling
    await expect(page.getByText('Failed to load users')).toBeVisible();
  });
});