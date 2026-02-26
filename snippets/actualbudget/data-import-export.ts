/**
 * Data Import and Export Examples
 * 
 * This file demonstrates comprehensive data import/export patterns
 * for migrating to/from Actual Budget and various formats.
 */

import api from '@actual-app/api';
import * as fs from 'fs';
import * as path from 'path';

// Import format interfaces
export interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  account?: string;
  memo?: string;
}

export interface YNABTransaction {
  Account: string;
  Flag: string;
  Date: string;
  Payee: string;
  Memo: string;
  Outflow: string;
  Inflow: string;
  Cleared: string;
  Running: string;
}

export interface MintTransaction {
  Date: string;
  Description: string;
  'Original Description': string;
  Amount: number;
  'Transaction Type': string;
  Category: string;
  'Account Name': string;
  Labels: string;
  Notes: string;
}

// CSV parser utility
export const parseCSV = (csvContent: string, delimiter = ','): any[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
};

// Generic CSV transaction importer
export const importCSVTransactions = async (
  csvFilePath: string,
  accountId: string,
  mapping: {
    date: string;
    amount: string;
    payee: string;
    memo?: string;
    category?: string;
  },
  delimiter = ','
) => {
  try {
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const rows = parseCSV(csvContent, delimiter);
    
    console.log(`Importing ${rows.length} transactions from ${csvFilePath}`);
    
    const transactions = rows.map(row => {
      // Parse amount - handle both string and number formats
      let amount = parseFloat(row[mapping.amount].toString().replace(/[,$]/g, ''));
      if (isNaN(amount)) amount = 0;
      
      // Convert to cents
      amount = Math.round(amount * 100);
      
      return {
        date: row[mapping.date],
        amount,
        payee_name: row[mapping.payee] || 'Unknown',
        notes: mapping.memo ? row[mapping.memo] : undefined,
        category_name: mapping.category ? row[mapping.category] : undefined
      };
    }).filter(t => t.date && !isNaN(new Date(t.date).getTime())); // Filter invalid dates
    
    // Import in batches for better performance
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await api.addTransactions(accountId, batch);
      imported += batch.length;
      console.log(`Imported ${imported}/${transactions.length} transactions`);
    }
    
    console.log(`Successfully imported ${imported} transactions`);
    return imported;
  } catch (error) {
    console.error('Failed to import CSV transactions:', error);
    return 0;
  }
};

// YNAB4 import
export const importYNAB4Data = async (ynabFilePath: string) => {
  try {
    console.log('Starting YNAB4 import...');
    
    const csvContent = fs.readFileSync(ynabFilePath, 'utf8');
    const transactions = parseCSV(csvContent) as YNABTransaction[];
    
    // Group transactions by account
    const accountGroups = transactions.reduce((groups: any, transaction) => {
      const accountName = transaction.Account;
      if (!groups[accountName]) {
        groups[accountName] = [];
      }
      groups[accountName].push(transaction);
      return groups;
    }, {});
    
    // Create accounts and import transactions
    const importResults = [];
    
    for (const [accountName, accountTransactions] of Object.entries(accountGroups) as any) {
      console.log(`Processing account: ${accountName}`);
      
      // Create account
      const accountId = await api.createAccount({
        name: accountName,
        type: 'checking' // Default type, adjust as needed
      });
      
      if (!accountId) {
        console.error(`Failed to create account: ${accountName}`);
        continue;
      }
      
      // Convert YNAB transactions to Actual format
      const actualTransactions = accountTransactions.map((ynabTx: YNABTransaction) => {
        // YNAB uses separate Inflow/Outflow columns
        const inflow = parseFloat(ynabTx.Inflow) || 0;
        const outflow = parseFloat(ynabTx.Outflow) || 0;
        const amount = Math.round((inflow - outflow) * 100); // Convert to cents
        
        return {
          date: ynabTx.Date,
          amount,
          payee_name: ynabTx.Payee,
          notes: ynabTx.Memo,
          cleared: ynabTx.Cleared === 'C'
        };
      });
      
      await api.addTransactions(accountId, actualTransactions);
      
      importResults.push({
        account: accountName,
        accountId,
        transactionCount: actualTransactions.length
      });
      
      console.log(`Imported ${actualTransactions.length} transactions for ${accountName}`);
    }
    
    console.log('YNAB4 import completed:', importResults);
    return importResults;
  } catch (error) {
    console.error('YNAB4 import failed:', error);
    return [];
  }
};

// Mint.com import
export const importMintData = async (mintFilePath: string) => {
  try {
    console.log('Starting Mint import...');
    
    const csvContent = fs.readFileSync(mintFilePath, 'utf8');
    const transactions = parseCSV(csvContent) as MintTransaction[];
    
    // Group by account
    const accountGroups = transactions.reduce((groups: any, transaction) => {
      const accountName = transaction['Account Name'];
      if (!groups[accountName]) {
        groups[accountName] = [];
      }
      groups[accountName].push(transaction);
      return groups;
    }, {});
    
    const importResults = [];
    
    for (const [accountName, accountTransactions] of Object.entries(accountGroups) as any) {
      console.log(`Processing account: ${accountName}`);
      
      // Determine account type based on name (basic heuristics)
      let accountType = 'checking';
      const name = accountName.toLowerCase();
      if (name.includes('savings')) accountType = 'savings';
      else if (name.includes('credit')) accountType = 'credit';
      else if (name.includes('investment')) accountType = 'investment';
      
      const accountId = await api.createAccount({
        name: accountName,
        type: accountType as any
      });
      
      if (!accountId) continue;
      
      // Convert Mint transactions
      const actualTransactions = accountTransactions.map((mintTx: MintTransaction) => {
        // Mint uses positive/negative amounts
        let amount = mintTx.Amount;
        if (mintTx['Transaction Type'] === 'debit') {
          amount = -Math.abs(amount);
        }
        
        return {
          date: mintTx.Date,
          amount: Math.round(amount * 100),
          payee_name: mintTx.Description,
          notes: mintTx.Notes || mintTx['Original Description'],
          category_name: mintTx.Category
        };
      });
      
      await api.addTransactions(accountId, actualTransactions);
      
      importResults.push({
        account: accountName,
        accountId,
        transactionCount: actualTransactions.length
      });
    }
    
    console.log('Mint import completed:', importResults);
    return importResults;
  } catch (error) {
    console.error('Mint import failed:', error);
    return [];
  }
};

// Bank statement import (generic format)
export const importBankStatement = async (
  statementPath: string,
  accountId: string,
  format: 'csv' | 'qif' | 'ofx' = 'csv'
) => {
  try {
    if (format === 'csv') {
      // Assume standard bank CSV format
      return await importCSVTransactions(statementPath, accountId, {
        date: 'Date',
        amount: 'Amount',
        payee: 'Description',
        memo: 'Memo'
      });
    } else if (format === 'qif') {
      return await importQIFFile(statementPath, accountId);
    } else if (format === 'ofx') {
      return await importOFXFile(statementPath, accountId);
    }
    
    throw new Error(`Unsupported format: ${format}`);
  } catch (error) {
    console.error('Bank statement import failed:', error);
    return 0;
  }
};

// QIF file import (simplified)
export const importQIFFile = async (qifPath: string, accountId: string) => {
  try {
    const qifContent = fs.readFileSync(qifPath, 'utf8');
    const transactions = parseQIF(qifContent);
    
    const actualTransactions = transactions.map(qifTx => ({
      date: qifTx.date,
      amount: Math.round(qifTx.amount * 100),
      payee_name: qifTx.payee,
      notes: qifTx.memo,
      category_name: qifTx.category
    }));
    
    await api.addTransactions(accountId, actualTransactions);
    console.log(`Imported ${actualTransactions.length} transactions from QIF`);
    return actualTransactions.length;
  } catch (error) {
    console.error('QIF import failed:', error);
    return 0;
  }
};

// Simple QIF parser
const parseQIF = (qifContent: string) => {
  const transactions = [];
  const lines = qifContent.split('\n');
  let currentTransaction: any = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const code = trimmed.charAt(0);
    const value = trimmed.substring(1);
    
    switch (code) {
      case 'D': // Date
        currentTransaction.date = value;
        break;
      case 'T': // Amount
        currentTransaction.amount = parseFloat(value);
        break;
      case 'P': // Payee
        currentTransaction.payee = value;
        break;
      case 'M': // Memo
        currentTransaction.memo = value;
        break;
      case 'L': // Category
        currentTransaction.category = value;
        break;
      case '^': // End of transaction
        if (currentTransaction.date && currentTransaction.amount !== undefined) {
          transactions.push({ ...currentTransaction });
        }
        currentTransaction = {};
        break;
    }
  }
  
  return transactions;
};

// OFX import (basic implementation)
export const importOFXFile = async (ofxPath: string, accountId: string) => {
  try {
    const ofxContent = fs.readFileSync(ofxPath, 'utf8');
    // This would require a proper OFX parser library
    // For now, return 0 as a placeholder
    console.log('OFX import not fully implemented');
    return 0;
  } catch (error) {
    console.error('OFX import failed:', error);
    return 0;
  }
};

// Export budget data
export const exportBudgetData = async (
  outputPath: string,
  format: 'csv' | 'json' = 'json',
  options: {
    includeAccounts?: boolean;
    includeTransactions?: boolean;
    includeCategories?: boolean;
    includeBudgets?: boolean;
    dateRange?: { start: string; end: string };
  } = {}
) => {
  try {
    const exportData: any = {
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Export accounts
    if (options.includeAccounts !== false) {
      exportData.accounts = await api.getAccounts();
      console.log(`Exported ${exportData.accounts.length} accounts`);
    }
    
    // Export categories
    if (options.includeCategories !== false) {
      exportData.categories = await api.getCategories();
      exportData.categoryGroups = await api.getCategoryGroups();
      console.log(`Exported ${exportData.categories.length} categories`);
    }
    
    // Export transactions
    if (options.includeTransactions !== false) {
      const { q, runQuery } = api;
      let query = q('transactions').select('*');
      
      if (options.dateRange) {
        query = query.filter({
          $and: [
            { date: { $gte: options.dateRange.start } },
            { date: { $lte: options.dateRange.end } }
          ]
        });
      }
      
      const { data: transactions } = await runQuery(query);
      exportData.transactions = transactions;
      console.log(`Exported ${transactions.length} transactions`);
    }
    
    // Export budget data
    if (options.includeBudgets !== false) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      exportData.budget = await api.getBudgetMonth(currentMonth);
      console.log('Exported budget data');
    }
    
    // Write to file
    if (format === 'json') {
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    } else if (format === 'csv') {
      // Convert to CSV format (simplified)
      if (exportData.transactions) {
        const csvLines = [
          'Date,Amount,Payee,Category,Account,Notes'
        ];
        
        exportData.transactions.forEach((tx: any) => {
          csvLines.push([
            tx.date,
            (tx.amount / 100).toFixed(2),
            tx['payee.name'] || '',
            tx['category.name'] || '',
            tx['account.name'] || '',
            tx.notes || ''
          ].map(field => `"${field}"`).join(','));
        });
        
        fs.writeFileSync(outputPath, csvLines.join('\n'));
      }
    }
    
    console.log(`Export completed: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

// Complete migration workflow
export const migrateFromApp = async (
  sourceApp: 'ynab' | 'mint' | 'csv',
  dataPath: string,
  budgetName: string
) => {
  try {
    console.log(`Starting migration from ${sourceApp}...`);
    
    // Create new budget for import
    await api.runImport(budgetName, async () => {
      switch (sourceApp) {
        case 'ynab':
          await importYNAB4Data(dataPath);
          break;
        case 'mint':
          await importMintData(dataPath);
          break;
        case 'csv':
          // For CSV, you'd need to specify account and mapping
          console.log('CSV import requires specific account and field mapping');
          break;
      }
    });
    
    console.log(`Migration from ${sourceApp} completed successfully`);
    return true;
  } catch (error) {
    console.error(`Migration from ${sourceApp} failed:`, error);
    return false;
  }
};

// Backup and restore utilities
export const createBackup = async (backupPath: string) => {
  try {
    const backupData = await exportBudgetData(backupPath, 'json', {
      includeAccounts: true,
      includeTransactions: true,
      includeCategories: true,
      includeBudgets: true
    });
    
    if (backupData) {
      console.log(`Backup created: ${backupPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Backup failed:', error);
    return false;
  }
};

// Scheduled backup function
export const setupScheduledBackup = (backupDir: string, intervalHours = 24) => {
  const performBackup = async () => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `actual-backup-${timestamp}.json`);
    
    await createBackup(backupPath);
    
    // Clean up old backups (keep last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    fs.readdirSync(backupDir)
      .filter(file => file.startsWith('actual-backup-') && file.endsWith('.json'))
      .forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old backup: ${file}`);
        }
      });
  };
  
  // Perform initial backup
  performBackup();
  
  // Schedule recurring backups
  const intervalMs = intervalHours * 60 * 60 * 1000;
  return setInterval(performBackup, intervalMs);
};

// Data validation utilities
export const validateImportData = (transactions: any[]) => {
  const errors = [];
  const validTransactions = [];
  
  transactions.forEach((tx, index) => {
    const txErrors = [];
    
    // Validate date
    if (!tx.date || isNaN(new Date(tx.date).getTime())) {
      txErrors.push('Invalid date');
    }
    
    // Validate amount
    if (tx.amount === undefined || isNaN(parseFloat(tx.amount))) {
      txErrors.push('Invalid amount');
    }
    
    if (txErrors.length > 0) {
      errors.push({ index, errors: txErrors, transaction: tx });
    } else {
      validTransactions.push(tx);
    }
  });
  
  if (errors.length > 0) {
    console.warn(`Found ${errors.length} invalid transactions:`);
    errors.slice(0, 5).forEach(error => { // Show first 5 errors
      console.warn(`Transaction ${error.index}: ${error.errors.join(', ')}`);
    });
  }
  
  console.log(`Validated ${validTransactions.length}/${transactions.length} transactions`);
  return { validTransactions, errors };
};