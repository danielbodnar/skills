/**
 * Account and Transaction Management Examples
 * 
 * This file demonstrates comprehensive account creation, transaction management,
 * and data import patterns for Actual Budget.
 */

import api from '@actual-app/api';
import { utils } from '@actual-app/api';

// Account types supported by Actual Budget
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'mortgage' | 'debt' | 'other';

// Transaction interface for type safety
export interface Transaction {
  id?: string;
  date: string;           // YYYY-MM-DD format
  amount: number;         // Amount in cents (e.g., $12.34 = 1234)
  payee_name?: string;    // Payee name (creates payee if doesn't exist)
  payee_id?: string;      // Existing payee ID
  category_id?: string;   // Category ID for transaction
  notes?: string;         // Transaction notes
  cleared?: boolean;      // Whether transaction is cleared
  account_id?: string;    // Account ID (for import operations)
}

// Account interface
export interface Account {
  id?: string;
  name: string;
  type: AccountType;
  offbudget?: boolean;    // Whether account is off-budget
  closed?: boolean;       // Whether account is closed
}

// Get all accounts with filtering options
export const getAccounts = async (includeOffBudget = false, includeClosed = false) => {
  try {
    const accounts = await api.getAccounts();
    
    return accounts.filter((account: any) => {
      if (!includeOffBudget && account.offbudget) return false;
      if (!includeClosed && account.closed) return false;
      return true;
    });
  } catch (error) {
    console.error('Failed to get accounts:', error);
    return [];
  }
};

// Create a new account
export const createAccount = async (accountData: Account): Promise<string | null> => {
  try {
    const accountId = await api.createAccount(accountData);
    console.log(`Created account: ${accountData.name} (ID: ${accountId})`);
    return accountId;
  } catch (error) {
    console.error('Failed to create account:', error);
    return null;
  }
};

// Create multiple accounts in batch
export const createMultipleAccounts = async (accounts: Account[]): Promise<string[]> => {
  const createdIds: string[] = [];
  
  for (const account of accounts) {
    const accountId = await createAccount(account);
    if (accountId) {
      createdIds.push(accountId);
    }
  }
  
  return createdIds;
};

// Example: Create common account structure
export const setupCommonAccounts = async () => {
  const commonAccounts: Account[] = [
    { name: 'Checking Account', type: 'checking' },
    { name: 'Savings Account', type: 'savings' },
    { name: 'Credit Card', type: 'credit' },
    { name: 'Emergency Fund', type: 'savings' },
    { name: 'Investment Account', type: 'investment', offbudget: true }
  ];
  
  const accountIds = await createMultipleAccounts(commonAccounts);
  console.log('Created accounts:', accountIds);
  return accountIds;
};

// Get transactions for an account within date range
export const getTransactions = async (
  accountId: string, 
  startDate: string, 
  endDate: string
) => {
  try {
    const transactions = await api.getTransactions(accountId, startDate, endDate);
    console.log(`Found ${transactions.length} transactions for account ${accountId}`);
    return transactions;
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
};

// Import transactions into an account
export const importTransactions = async (accountId: string, transactions: Transaction[]) => {
  try {
    await api.importTransactions(accountId, transactions);
    console.log(`Imported ${transactions.length} transactions into account ${accountId}`);
    return true;
  } catch (error) {
    console.error('Failed to import transactions:', error);
    return false;
  }
};

// Add transactions for bulk import (faster, bypasses reconciliation)
export const addBulkTransactions = async (accountId: string, transactions: Transaction[]) => {
  try {
    await api.addTransactions(accountId, transactions);
    console.log(`Added ${transactions.length} transactions to account ${accountId}`);
    return true;
  } catch (error) {
    console.error('Failed to add bulk transactions:', error);
    return false;
  }
};

// Convert dollar amount to cents (Actual's internal format)
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Convert cents to dollar amount
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

// Create sample transactions for testing
export const createSampleTransactions = (): Transaction[] => {
  return [
    {
      date: '2024-01-15',
      amount: dollarsToCents(-45.67),
      payee_name: 'Grocery Store',
      notes: 'Weekly groceries'
    },
    {
      date: '2024-01-16',
      amount: dollarsToCents(-12.50),
      payee_name: 'Coffee Shop',
      notes: 'Morning coffee'
    },
    {
      date: '2024-01-17',
      amount: dollarsToCents(2500.00),
      payee_name: 'Salary Deposit',
      notes: 'Bi-weekly salary'
    },
    {
      date: '2024-01-18',
      amount: dollarsToCents(-89.99),
      payee_name: 'Gas Station',
      notes: 'Fill up tank'
    },
    {
      date: '2024-01-19',
      amount: dollarsToCents(-25.00),
      payee_name: 'ATM Withdrawal',
      notes: 'Cash withdrawal'
    }
  ];
};

// Import CSV data (example format)
export const importCSVData = async (accountId: string, csvData: any[]) => {
  const transactions: Transaction[] = csvData.map(row => ({
    date: row.date,
    amount: dollarsToCents(parseFloat(row.amount)),
    payee_name: row.payee || row.description,
    notes: row.memo || row.notes
  }));
  
  return await importTransactions(accountId, transactions);
};

// Import bank statement data
export const importBankStatement = async (
  accountId: string,
  statementData: {
    date: string;
    description: string;
    amount: number;
    balance?: number;
  }[]
) => {
  const transactions: Transaction[] = statementData.map(item => ({
    date: item.date,
    amount: dollarsToCents(item.amount),
    payee_name: item.description,
    notes: item.balance ? `Balance: $${item.balance.toFixed(2)}` : undefined
  }));
  
  return await importTransactions(accountId, transactions);
};

// Get account balance
export const getAccountBalance = async (accountId: string): Promise<number | null> => {
  try {
    // Get recent transactions to calculate balance
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = '2000-01-01'; // Get all transactions
    
    const transactions = await api.getTransactions(accountId, startDate, endDate);
    
    const balance = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
    
    console.log(`Account ${accountId} balance: $${centsToDollars(balance).toFixed(2)}`);
    return balance;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    return null;
  }
};

// Find transactions by payee
export const findTransactionsByPayee = async (
  accountId: string,
  payeeName: string,
  startDate?: string,
  endDate?: string
) => {
  const start = startDate || '2000-01-01';
  const end = endDate || new Date().toISOString().slice(0, 10);
  
  const transactions = await getTransactions(accountId, start, end);
  
  return transactions.filter((tx: any) => 
    tx.payee?.name?.toLowerCase().includes(payeeName.toLowerCase())
  );
};

// Update transaction
export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
  try {
    await api.updateTransaction(transactionId, updates);
    console.log(`Updated transaction ${transactionId}`);
    return true;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return false;
  }
};

// Delete transaction
export const deleteTransaction = async (transactionId: string) => {
  try {
    await api.deleteTransaction(transactionId);
    console.log(`Deleted transaction ${transactionId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return false;
  }
};

// Complete account and transaction workflow
export const accountTransactionWorkflow = async () => {
  try {
    // Create a checking account
    const checkingId = await createAccount({
      name: 'Main Checking',
      type: 'checking'
    });
    
    if (!checkingId) return;
    
    // Add sample transactions
    const sampleTransactions = createSampleTransactions();
    await addBulkTransactions(checkingId, sampleTransactions);
    
    // Get account balance
    await getAccountBalance(checkingId);
    
    // Find grocery transactions
    const groceryTransactions = await findTransactionsByPayee(checkingId, 'grocery');
    console.log(`Found ${groceryTransactions.length} grocery transactions`);
    
    // Get this month's transactions
    const thisMonth = new Date().toISOString().slice(0, 7);
    const startOfMonth = `${thisMonth}-01`;
    const endOfMonth = `${thisMonth}-31`;
    
    const monthlyTransactions = await getTransactions(checkingId, startOfMonth, endOfMonth);
    console.log(`This month's transactions: ${monthlyTransactions.length}`);
    
  } catch (error) {
    console.error('Account transaction workflow failed:', error);
  }
};

// Transfer between accounts
export const createTransfer = async (
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  date: string,
  notes?: string
) => {
  try {
    // Create transfer transactions
    const transferAmount = dollarsToCents(Math.abs(amount));
    
    // Outgoing transaction
    await api.importTransactions(fromAccountId, [{
      date,
      amount: -transferAmount,
      payee_name: 'Transfer',
      notes: notes || `Transfer to account ${toAccountId}`
    }]);
    
    // Incoming transaction
    await api.importTransactions(toAccountId, [{
      date,
      amount: transferAmount,
      payee_name: 'Transfer',
      notes: notes || `Transfer from account ${fromAccountId}`
    }]);
    
    console.log(`Created transfer of $${amount} from ${fromAccountId} to ${toAccountId}`);
    return true;
  } catch (error) {
    console.error('Failed to create transfer:', error);
    return false;
  }
};