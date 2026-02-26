import { test as base, expect } from '@playwright/test';

// Define custom fixtures
type CustomFixtures = {
  todoPage: TodoPage;
  settingsPage: SettingsPage;
  authenticatedPage: any;
  database: DatabaseConnection;
};

class TodoPage {
  constructor(public readonly page: any) {}

  async goto() {
    await this.page.goto('/todos');
  }

  async addTodo(text: string) {
    await this.page.getByPlaceholder('Add new todo').fill(text);
    await this.page.getByRole('button', { name: 'Add' }).click();
  }

  async toggleTodo(text: string) {
    await this.page.getByText(text).click();
  }

  async deleteTodo(text: string) {
    await this.page.getByText(text).hover();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  async getTodos() {
    return this.page.locator('.todo-item').allTextContents();
  }
}

class SettingsPage {
  constructor(public readonly page: any) {}

  async goto() {
    await this.page.goto('/settings');
  }

  async switchToDarkMode() {
    await this.page.getByRole('switch', { name: 'Dark mode' }).click();
  }

  async updateProfile(name: string, email: string) {
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
}

class DatabaseConnection {
  async connect() {
    // Mock database connection
    console.log('Connecting to database...');
  }

  async disconnect() {
    // Mock database disconnection
    console.log('Disconnecting from database...');
  }

  async clearData() {
    // Mock data clearing
    console.log('Clearing test data...');
  }

  async seedData() {
    // Mock data seeding
    console.log('Seeding test data...');
  }
}

// Extend the base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await use(todoPage);
  },

  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await use(settingsPage);
  },

  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
    
    await use(page);
  },

  database: async ({}, use) => {
    const db = new DatabaseConnection();
    await db.connect();
    await db.clearData();
    await db.seedData();
    
    await use(db);
    
    await db.clearData();
    await db.disconnect();
  },
});

export { expect };

// Example usage of custom fixtures
test.describe('Todo application', () => {
  test('should add and complete todos', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');
    
    const todos = await todoPage.getTodos();
    expect(todos).toContain('Buy groceries');
    expect(todos).toContain('Walk the dog');
    
    await todoPage.toggleTodo('Buy groceries');
    // Add assertions for completed state
  });

  test('should manage settings', async ({ settingsPage }) => {
    await settingsPage.goto();
    await settingsPage.switchToDarkMode();
    await settingsPage.updateProfile('John Doe', 'john@example.com');
    
    // Add assertions for settings changes
  });

  test('authenticated user actions', async ({ authenticatedPage }) => {
    // Page is already authenticated
    await authenticatedPage.goto('/profile');
    await expect(authenticatedPage.getByText('Welcome, testuser')).toBeVisible();
  });

  test('database operations', async ({ database, page }) => {
    // Database is set up and seeded
    await page.goto('/users');
    
    // Verify seeded data is present
    await expect(page.locator('.user-row')).toHaveCount(5);
    
    // Database will be cleaned up automatically
  });
});

// Worker-scoped fixtures for expensive setup
export const workerTest = base.extend<{}, { workerStorageState: string }>({
  workerStorageState: [async ({ browser }, use) => {
    // This runs once per worker
    const page = await browser.newPage();
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Save authentication state
    await page.context().storageState({ path: 'auth-state.json' });
    await page.close();
    
    await use('auth-state.json');
  }, { scope: 'worker' }],

  page: async ({ context, workerStorageState }, use) => {
    // Load the authentication state
    const page = await context.newPage();
    await context.storageState({ path: workerStorageState });
    await use(page);
  },
});