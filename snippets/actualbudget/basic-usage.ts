/**
 * Basic Actual Budget API Usage Examples
 * 
 * This file demonstrates fundamental operations with the Actual Budget API
 * including server connection, budget management, and basic data operations.
 */

import api from '@actual-app/api';

// Basic server connection and initialization
export const initializeActualBudget = async () => {
  try {
    await api.init({
      // Local directory for caching budget data
      dataDir: './actual-data',
      
      // URL of your Actual Budget server
      serverURL: 'http://localhost:5006',
      
      // Server password for authentication
      password: process.env.ACTUAL_PASSWORD || 'your-password'
    });
    
    console.log('Successfully connected to Actual Budget server');
    return true;
  } catch (error) {
    console.error('Failed to initialize Actual Budget API:', error);
    return false;
  }
};

// Download and load a specific budget
export const loadBudget = async (budgetId: string, encryptionPassword?: string) => {
  try {
    if (encryptionPassword) {
      // Download encrypted budget
      await api.downloadBudget(budgetId, { password: encryptionPassword });
    } else {
      // Download unencrypted budget
      await api.downloadBudget(budgetId);
    }
    
    console.log(`Budget ${budgetId} loaded successfully`);
    return true;
  } catch (error) {
    console.error('Failed to load budget:', error);
    return false;
  }
};

// Get budget information for a specific month
export const getBudgetData = async (month: string) => {
  try {
    const budget = await api.getBudgetMonth(month);
    
    console.log(`Budget data for ${month}:`, {
      totalBudgeted: budget.totalBudgeted,
      totalSpent: budget.totalSpent,
      totalBalance: budget.totalBalance
    });
    
    return budget;
  } catch (error) {
    console.error(`Failed to get budget data for ${month}:`, error);
    return null;
  }
};

// List all available budgets on the server
export const listBudgets = async () => {
  try {
    const budgets = await api.getBudgets();
    
    console.log('Available budgets:');
    budgets.forEach((budget: any) => {
      console.log(`- ${budget.name} (ID: ${budget.id})`);
    });
    
    return budgets;
  } catch (error) {
    console.error('Failed to list budgets:', error);
    return [];
  }
};

// Synchronize local data with server
export const syncBudget = async () => {
  try {
    await api.sync();
    console.log('Budget synchronized successfully');
    return true;
  } catch (error) {
    console.error('Failed to sync budget:', error);
    return false;
  }
};

// Properly shutdown the API connection
export const shutdownAPI = async () => {
  try {
    await api.shutdown();
    console.log('API connection closed');
  } catch (error) {
    console.error('Error during API shutdown:', error);
  }
};

// Complete workflow example
export const basicWorkflow = async () => {
  // Initialize connection
  const initialized = await initializeActualBudget();
  if (!initialized) return;
  
  try {
    // List available budgets
    const budgets = await listBudgets();
    
    if (budgets.length > 0) {
      // Load the first budget
      await loadBudget(budgets[0].id);
      
      // Get current month's budget data
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      await getBudgetData(currentMonth);
      
      // Sync with server
      await syncBudget();
    }
  } finally {
    // Always shutdown properly
    await shutdownAPI();
  }
};

// Usage with environment variables for security
export const secureInitialization = async () => {
  const config = {
    dataDir: process.env.ACTUAL_DATA_DIR || './actual-data',
    serverURL: process.env.ACTUAL_SERVER_URL || 'http://localhost:5006',
    password: process.env.ACTUAL_PASSWORD
  };
  
  if (!config.password) {
    throw new Error('ACTUAL_PASSWORD environment variable is required');
  }
  
  await api.init(config);
};

// Handle API errors gracefully
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${operationName} failed:`, error);
    
    // Log additional error details if available
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return null;
  }
};

// Example usage with error handling
export const safeBasicOperations = async () => {
  const budgets = await withErrorHandling(
    () => api.getBudgets(),
    'Get budgets'
  );
  
  if (budgets && budgets.length > 0) {
    const budget = await withErrorHandling(
      () => api.getBudgetMonth('2024-01'),
      'Get January 2024 budget'
    );
    
    console.log('Budget data:', budget);
  }
};