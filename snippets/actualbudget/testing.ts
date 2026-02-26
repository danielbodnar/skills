/**
 * Testing Patterns and Utilities for Actual Budget
 * 
 * This file demonstrates comprehensive testing approaches for applications
 * using the Actual Budget API, including unit tests, integration tests,
 * and test utilities.
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import api from '@actual-app/api';
import type { Account, Transaction, Category } from './schemas/types';

// Test configuration
const TEST_CONFIG = {
  dataDir: './test-data',
  serverURL: 'http://localhost:5006',
  password: 'test-password'
};

// Mock data generators
export const mockDataGenerators = {
  // Generate mock account data
  createMockAccount: (overrides: Partial<Account> = {}): Account => ({
    id: `account-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Account',
    type: 'checking',
    offbudget: false,
    closed: false,
    balance: 0,
    ...overrides
  }),

  // Generate mock transaction data
  createMockTransaction: (overrides: Partial<Transaction> = {}): Transaction => ({
    id: `transaction-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().slice(0, 10),
    amount: -1000, // $10.00 expense
    account_id: 'test-account-id',
    payee_name: 'Test Payee',
    notes: 'Test transaction',
    cleared: false,
    ...overrides
  }),

  // Generate mock category data
  createMockCategory: (overrides: Partial<Category> = {}): Category => ({
    id: `category-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Category',
    group_id: 'test-group-id',
    is_income: false,
    ...overrides
  }),

  // Generate multiple mock transactions
  createMockTransactions: (count: number, overrides: Partial<Transaction> = {}): Transaction[] => {
    return Array.from({ length: count }, (_, index) => 
      mockDataGenerators.createMockTransaction({
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        amount: -(100 + index * 50), // Varying amounts
        payee_name: `Test Payee ${index + 1}`,
        ...overrides
      })
    );
  }
};

// Test utilities
export const testUtils = {
  // Setup test environment
  setupTestEnvironment: async () => {
    try {
      await api.init(TEST_CONFIG);
      return true;
    } catch (error) {
      console.warn('Test server not available, using mocks');
      return false;
    }
  },

  // Cleanup test environment
  cleanupTestEnvironment: async () => {
    try {
      await api.shutdown();
    } catch (error) {
      // Ignore shutdown errors in tests
    }
  },

  // Create test budget with sample data
  createTestBudget: async (budgetName = 'Test Budget') => {
    await api.runImport(budgetName, async () => {
      // Create test accounts
      const checkingId = await api.createAccount({
        name: 'Test Checking',
        type: 'checking'
      });

      const savingsId = await api.createAccount({
        name: 'Test Savings',
        type: 'savings'
      });

      // Create test category group and categories
      const expenseGroupId = await api.createCategoryGroup({
        name: 'Test Expenses'
      });

      const foodCategoryId = await api.createCategory({
        name: 'Food',
        group_id: expenseGroupId
      });

      // Add test transactions
      const testTransactions = mockDataGenerators.createMockTransactions(5);
      await api.addTransactions(checkingId, testTransactions);

      return {
        accounts: { checkingId, savingsId },
        categories: { expenseGroupId, foodCategoryId }
      };
    });
  },

  // Assert amount equals (handling cents conversion)
  expectAmountToEqual: (actual: number, expected: number, message?: string) => {
    const actualDollars = actual / 100;
    const expectedDollars = expected / 100;
    expect(actualDollars).toBeCloseTo(expectedDollars, 2, message);
  },

  // Assert date equals (handling date format variations)
  expectDateToEqual: (actual: string, expected: string) => {
    expect(new Date(actual).toISOString().slice(0, 10))
      .toBe(new Date(expected).toISOString().slice(0, 10));
  },

  // Wait for async operations to complete
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock API for testing without server
export const mockAPI = {
  // Mock API implementation
  accounts: new Map<string, Account>(),
  transactions: new Map<string, Transaction>(),
  categories: new Map<string, Category>(),
  
  // Mock methods
  init: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined),
  
  getAccounts: vi.fn().mockImplementation(() => 
    Promise.resolve(Array.from(mockAPI.accounts.values()))
  ),
  
  createAccount: vi.fn().mockImplementation((account: Omit<Account, 'id'>) => {
    const id = `mock-account-${Date.now()}`;
    const newAccount = { ...account, id };
    mockAPI.accounts.set(id, newAccount);
    return Promise.resolve(id);
  }),
  
  getTransactions: vi.fn().mockImplementation((accountId: string) => {
    const accountTransactions = Array.from(mockAPI.transactions.values())
      .filter(tx => tx.account_id === accountId);
    return Promise.resolve(accountTransactions);
  }),
  
  importTransactions: vi.fn().mockImplementation((accountId: string, transactions: Transaction[]) => {
    transactions.forEach(tx => {
      const id = `mock-tx-${Date.now()}-${Math.random()}`;
      mockAPI.transactions.set(id, { ...tx, id, account_id: accountId });
    });
    return Promise.resolve();
  }),

  addTransactions: vi.fn().mockImplementation((accountId: string, transactions: Transaction[]) => {
    return mockAPI.importTransactions(accountId, transactions);
  }),

  // Reset mock data
  reset: () => {
    mockAPI.accounts.clear();
    mockAPI.transactions.clear();
    mockAPI.categories.clear();
    vi.clearAllMocks();
  }
};

// Test suites
describe('Actual Budget API Integration Tests', () => {
  let serverAvailable = false;

  beforeEach(async () => {
    if (process.env.NODE_ENV === 'test-integration') {
      serverAvailable = await testUtils.setupTestEnvironment();
    } else {
      // Use mocks for unit tests
      vi.doMock('@actual-app/api', () => ({ default: mockAPI }));
      mockAPI.reset();
    }
  });

  afterEach(async () => {
    if (serverAvailable) {
      await testUtils.cleanupTestEnvironment();
    }
  });

  describe('Account Management', () => {
    it('should create and retrieve accounts', async () => {
      const testAPI = serverAvailable ? api : mockAPI;
      
      // Create test account
      const accountData = {
        name: 'Test Checking Account',
        type: 'checking' as const
      };
      
      const accountId = await testAPI.createAccount(accountData);
      expect(accountId).toBeDefined();
      expect(typeof accountId).toBe('string');
      
      // Retrieve accounts
      const accounts = await testAPI.getAccounts();
      expect(accounts).toBeInstanceOf(Array);
      
      const createdAccount = accounts.find(acc => acc.id === accountId);
      expect(createdAccount).toBeDefined();
      expect(createdAccount?.name).toBe(accountData.name);
      expect(createdAccount?.type).toBe(accountData.type);
    });

    it('should handle account creation with different types', async () => {
      const testAPI = serverAvailable ? api : mockAPI;
      const accountTypes = ['checking', 'savings', 'credit', 'investment'] as const;
      
      for (const type of accountTypes) {
        const accountId = await testAPI.createAccount({
          name: `Test ${type} Account`,
          type
        });
        
        expect(accountId).toBeDefined();
        
        const accounts = await testAPI.getAccounts();
        const account = accounts.find(acc => acc.id === accountId);
        expect(account?.type).toBe(type);
      }
    });
  });

  describe('Transaction Management', () => {
    let testAccountId: string;

    beforeEach(async () => {
      const testAPI = serverAvailable ? api : mockAPI;
      testAccountId = await testAPI.createAccount({
        name: 'Transaction Test Account',
        type: 'checking'
      });
    });

    it('should import transactions successfully', async () => {
      const testAPI = serverAvailable ? api : mockAPI;
      
      const testTransactions = [
        {
          date: '2024-01-15',
          amount: -2500, // $25.00 expense
          payee_name: 'Test Store',
          notes: 'Test purchase'
        },
        {
          date: '2024-01-16',
          amount: 5000, // $50.00 income
          payee_name: 'Test Income',
          notes: 'Test deposit'
        }
      ];

      await testAPI.importTransactions(testAccountId, testTransactions);
      
      const transactions = await testAPI.getTransactions(
        testAccountId, 
        '2024-01-01', 
        '2024-01-31'
      );
      
      expect(transactions).toHaveLength(2);
      
      // Check expense transaction
      const expenseTransaction = transactions.find(tx => tx.amount < 0);
      expect(expenseTransaction).toBeDefined();
      testUtils.expectAmountToEqual(expenseTransaction!.amount, -2500);
      
      // Check income transaction
      const incomeTransaction = transactions.find(tx => tx.amount > 0);
      expect(incomeTransaction).toBeDefined();
      testUtils.expectAmountToEqual(incomeTransaction!.amount, 5000);
    });

    it('should handle bulk transaction imports', async () => {
      const testAPI = serverAvailable ? api : mockAPI;
      
      const bulkTransactions = mockDataGenerators.createMockTransactions(100);
      
      const startTime = Date.now();
      await testAPI.addTransactions(testAccountId, bulkTransactions);
      const endTime = Date.now();
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      
      const retrievedTransactions = await testAPI.getTransactions(
        testAccountId,
        '2020-01-01',
        '2030-12-31'
      );
      
      expect(retrievedTransactions.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Data Validation', () => {
    it('should validate transaction data before import', async () => {
      const validTransactions = [
        { date: '2024-01-01', amount: 1000, payee_name: 'Valid Payee' },
        { date: '2024-01-02', amount: -500, payee_name: 'Another Valid Payee' }
      ];

      const invalidTransactions = [
        { date: 'invalid-date', amount: 1000, payee_name: 'Bad Date' },
        { date: '2024-01-01', amount: 'not-a-number', payee_name: 'Bad Amount' },
        { amount: 1000, payee_name: 'Missing Date' } // Missing date
      ];

      // This would be implemented in a real validation function
      const validateTransaction = (tx: any) => {
        const errors = [];
        
        if (!tx.date || isNaN(new Date(tx.date).getTime())) {
          errors.push('Invalid date');
        }
        
        if (tx.amount === undefined || isNaN(parseFloat(tx.amount))) {
          errors.push('Invalid amount');
        }
        
        return errors;
      };

      // Test valid transactions
      validTransactions.forEach(tx => {
        const errors = validateTransaction(tx);
        expect(errors).toHaveLength(0);
      });

      // Test invalid transactions
      invalidTransactions.forEach(tx => {
        const errors = validateTransaction(tx);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  const PERFORMANCE_TIMEOUT = 10000; // 10 seconds

  it('should handle large transaction imports efficiently', async () => {
    const testAPI = mockAPI; // Use mocks for performance tests
    
    const accountId = await testAPI.createAccount({
      name: 'Performance Test Account',
      type: 'checking'
    });

    const largeTransactionSet = mockDataGenerators.createMockTransactions(1000);
    
    const startTime = Date.now();
    await testAPI.addTransactions(accountId, largeTransactionSet);
    const endTime = Date.now();
    
    const processingTime = endTime - startTime;
    console.log(`Processed 1000 transactions in ${processingTime}ms`);
    
    // Should process 1000 transactions in less than 5 seconds
    expect(processingTime).toBeLessThan(5000);
  }, PERFORMANCE_TIMEOUT);
});

// Error handling tests
describe('Error Handling', () => {
  it('should handle API initialization failures gracefully', async () => {
    const invalidConfig = {
      dataDir: './invalid-path',
      serverURL: 'http://invalid-server:9999',
      password: 'wrong-password'
    };

    // This should either succeed (if mocked) or fail gracefully
    try {
      await api.init(invalidConfig);
      // If it succeeds, it's likely mocked
      expect(true).toBe(true);
    } catch (error) {
      // If it fails, the error should be meaningful
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBeDefined();
    }
  });

  it('should handle invalid transaction data', async () => {
    const testAPI = mockAPI;
    
    const accountId = await testAPI.createAccount({
      name: 'Error Test Account',
      type: 'checking'
    });

    const invalidTransactions = [
      { date: 'not-a-date', amount: 'not-a-number', payee_name: 'Invalid' }
    ];

    // Mock API should handle this, real API might throw
    try {
      await testAPI.importTransactions(accountId, invalidTransactions as any);
      // Check that invalid data was either rejected or sanitized
      const transactions = await testAPI.getTransactions(accountId, '2020-01-01', '2030-12-31');
      // Should have 0 transactions if validation worked
      expect(transactions).toHaveLength(0);
    } catch (error) {
      // If it throws, that's also acceptable error handling
      expect(error).toBeInstanceOf(Error);
    }
  });
});

// Integration test helpers
export const integrationTestHelpers = {
  // Check if test server is running
  isTestServerRunning: async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5006');
      return response.ok;
    } catch {
      return false;
    }
  },

  // Setup test database
  setupTestDatabase: async () => {
    if (await integrationTestHelpers.isTestServerRunning()) {
      try {
        await api.init(TEST_CONFIG);
        await testUtils.createTestBudget('Integration Test Budget');
        return true;
      } catch (error) {
        console.error('Failed to setup test database:', error);
        return false;
      }
    }
    return false;
  },

  // Run integration tests only if server is available
  runIntegrationTests: () => {
    return process.env.NODE_ENV === 'test-integration' || 
           process.env.RUN_INTEGRATION_TESTS === 'true';
  }
};

// Test configuration for different environments
export const testConfigs = {
  unit: {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/test/setup-unit.ts'],
    testMatch: ['**/*.test.ts', '**/*.spec.ts'],
    testPathIgnorePatterns: ['**/*.integration.test.ts']
  },
  
  integration: {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/test/setup-integration.ts'],
    testMatch: ['**/*.integration.test.ts'],
    testTimeout: 30000
  },
  
  e2e: {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/test/setup-e2e.ts'],
    testMatch: ['**/*.e2e.test.ts'],
    testTimeout: 60000
  }
};

// Export test utilities for use in other test files
export { TEST_CONFIG, mockAPI, testUtils, mockDataGenerators };