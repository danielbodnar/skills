/**
 * ActualQL Query System Examples
 * 
 * This file demonstrates the powerful ActualQL query language for 
 * advanced data analysis and reporting in Actual Budget.
 */

import api from '@actual-app/api';

// Import ActualQL query builders
const { q, runQuery } = api;

// Basic query examples
export const basicQueries = {
  // Get all transactions
  allTransactions: () => q('transactions').select('*'),
  
  // Get all accounts
  allAccounts: () => q('accounts').select('*'),
  
  // Get all categories
  allCategories: () => q('categories').select('*'),
  
  // Get all payees
  allPayees: () => q('payees').select('*')
};

// Execute a basic query
export const runBasicQuery = async (queryName: keyof typeof basicQueries) => {
  try {
    const query = basicQueries[queryName]();
    const { data } = await runQuery(query);
    
    console.log(`${queryName} returned ${data.length} records`);
    return data;
  } catch (error) {
    console.error(`Failed to run query ${queryName}:`, error);
    return [];
  }
};

// Advanced filtering examples
export const getTransactionsByDateRange = async (startDate: string, endDate: string) => {
  try {
    const query = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } }
        ]
      })
      .select(['id', 'date', 'amount', 'payee.name', 'category.name', 'account.name']);
    
    const { data } = await runQuery(query);
    console.log(`Found ${data.length} transactions between ${startDate} and ${endDate}`);
    return data;
  } catch (error) {
    console.error('Failed to get transactions by date range:', error);
    return [];
  }
};

// Get transactions by category
export const getTransactionsByCategory = async (categoryName: string) => {
  try {
    const query = q('transactions')
      .filter({ 'category.name': categoryName })
      .select(['id', 'date', 'amount', 'payee.name', 'notes'])
      .orderBy([{ date: 'desc' }]);
    
    const { data } = await runQuery(query);
    console.log(`Found ${data.length} transactions in category: ${categoryName}`);
    return data;
  } catch (error) {
    console.error('Failed to get transactions by category:', error);
    return [];
  }
};

// Get transactions by payee with pattern matching
export const getTransactionsByPayee = async (payeePattern: string) => {
  try {
    const query = q('transactions')
      .filter({ 
        'payee.name': { $like: `%${payeePattern}%` }
      })
      .select(['id', 'date', 'amount', 'payee.name', 'category.name'])
      .orderBy([{ date: 'desc' }]);
    
    const { data } = await runQuery(query);
    console.log(`Found ${data.length} transactions matching payee pattern: ${payeePattern}`);
    return data;
  } catch (error) {
    console.error('Failed to get transactions by payee:', error);
    return [];
  }
};

// Spending analysis by category
export const getSpendingByCategory = async (startDate: string, endDate: string) => {
  try {
    const query = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } },
          { amount: { $lt: 0 } } // Only expenses (negative amounts)
        ]
      })
      .groupBy(['category.group.name', 'category.name'])
      .orderBy(['category.group.sort_order', 'category.sort_order'])
      .select([
        'category.group.name',
        'category.name', 
        { total: { $sum: '$amount' } },
        { count: { $count: '*' } },
        { average: { $avg: '$amount' } }
      ]);
    
    const { data } = await runQuery(query);
    
    // Convert amounts from cents to dollars and format results
    const formattedData = data.map((row: any) => ({
      categoryGroup: row['category.group.name'],
      category: row['category.name'],
      totalSpent: Math.abs(row.total / 100), // Convert to positive dollars
      transactionCount: row.count,
      averageAmount: Math.abs(row.average / 100)
    }));
    
    console.log('Spending by category:');
    formattedData.forEach(item => {
      console.log(`${item.categoryGroup}/${item.category}: $${item.totalSpent.toFixed(2)} (${item.transactionCount} transactions, avg: $${item.averageAmount.toFixed(2)})`);
    });
    
    return formattedData;
  } catch (error) {
    console.error('Failed to get spending by category:', error);
    return [];
  }
};

// Monthly spending trends
export const getMonthlySpendingTrends = async (months: number = 12) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const query = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate.toISOString().slice(0, 10) } },
          { date: { $lte: endDate.toISOString().slice(0, 10) } },
          { amount: { $lt: 0 } } // Only expenses
        ]
      })
      .groupBy([{ month: { $month: '$date' } }, { year: { $year: '$date' } }])
      .select([
        { month: { $month: '$date' } },
        { year: { $year: '$date' } },
        { totalSpent: { $sum: '$amount' } },
        { transactionCount: { $count: '*' } }
      ])
      .orderBy([{ year: 'asc' }, { month: 'asc' }]);
    
    const { data } = await runQuery(query);
    
    const formattedData = data.map((row: any) => ({
      period: `${row.year}-${String(row.month).padStart(2, '0')}`,
      totalSpent: Math.abs(row.totalSpent / 100),
      transactionCount: row.transactionCount
    }));
    
    console.log('Monthly spending trends:');
    formattedData.forEach(item => {
      console.log(`${item.period}: $${item.totalSpent.toFixed(2)} (${item.transactionCount} transactions)`);
    });
    
    return formattedData;
  } catch (error) {
    console.error('Failed to get monthly spending trends:', error);
    return [];
  }
};

// Top payees by spending
export const getTopPayeesBySpending = async (
  startDate: string, 
  endDate: string, 
  limit: number = 10
) => {
  try {
    const query = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } },
          { amount: { $lt: 0 } } // Only expenses
        ]
      })
      .groupBy('payee.name')
      .select([
        'payee.name',
        { totalSpent: { $sum: '$amount' } },
        { transactionCount: { $count: '*' } }
      ])
      .orderBy([{ totalSpent: 'asc' }]) // Ascending because amounts are negative
      .limit(limit);
    
    const { data } = await runQuery(query);
    
    const formattedData = data.map((row: any) => ({
      payee: row['payee.name'],
      totalSpent: Math.abs(row.totalSpent / 100),
      transactionCount: row.transactionCount
    }));
    
    console.log(`Top ${limit} payees by spending:`);
    formattedData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.payee}: $${item.totalSpent.toFixed(2)} (${item.transactionCount} transactions)`);
    });
    
    return formattedData;
  } catch (error) {
    console.error('Failed to get top payees by spending:', error);
    return [];
  }
};

// Account balances over time
export const getAccountBalanceHistory = async (accountId: string, months: number = 6) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const query = q('transactions')
      .filter({
        $and: [
          { 'account.id': accountId },
          { date: { $gte: startDate.toISOString().slice(0, 10) } },
          { date: { $lte: endDate.toISOString().slice(0, 10) } }
        ]
      })
      .select(['id', 'date', 'amount'])
      .orderBy([{ date: 'asc' }]);
    
    const { data } = await runQuery(query);
    
    // Calculate running balance
    let runningBalance = 0;
    const balanceHistory = data.map((tx: any) => {
      runningBalance += tx.amount;
      return {
        date: tx.date,
        transaction: tx.amount / 100,
        balance: runningBalance / 100
      };
    });
    
    console.log(`Account ${accountId} balance history:`);
    balanceHistory.slice(-10).forEach(item => { // Show last 10 entries
      console.log(`${item.date}: Transaction $${item.transaction.toFixed(2)}, Balance $${item.balance.toFixed(2)}`);
    });
    
    return balanceHistory;
  } catch (error) {
    console.error('Failed to get account balance history:', error);
    return [];
  }
};

// Budget vs actual analysis
export const getBudgetVsActualAnalysis = async (month: string) => {
  try {
    // Get budget data
    const budget = await api.getBudgetMonth(month);
    
    // Get actual spending for the month
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    const query = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } },
          { amount: { $lt: 0 } } // Only expenses
        ]
      })
      .groupBy('category.id')
      .select([
        'category.id',
        'category.name',
        { actualSpent: { $sum: '$amount' } }
      ]);
    
    const { data: actualData } = await runQuery(query);
    
    // Combine budget and actual data
    const analysis = budget.categoryAmounts.map((budgetItem: any) => {
      const actualItem = actualData.find((a: any) => a['category.id'] === budgetItem.id);
      const actualSpent = actualItem ? Math.abs(actualItem.actualSpent) : 0;
      const budgeted = budgetItem.budgeted;
      
      return {
        categoryId: budgetItem.id,
        categoryName: actualItem?.['category.name'] || 'Unknown',
        budgeted: budgeted / 100,
        actualSpent: actualSpent / 100,
        difference: (budgeted - actualSpent) / 100,
        percentUsed: budgeted !== 0 ? (actualSpent / budgeted * 100).toFixed(1) : 'N/A'
      };
    });
    
    console.log(`Budget vs Actual analysis for ${month}:`);
    analysis.forEach(item => {
      const status = item.difference >= 0 ? 'Under' : 'Over';
      console.log(`${item.categoryName}: Budgeted $${item.budgeted.toFixed(2)}, Spent $${item.actualSpent.toFixed(2)} (${item.percentUsed}% used, ${status} by $${Math.abs(item.difference).toFixed(2)})`);
    });
    
    return analysis;
  } catch (error) {
    console.error('Failed to get budget vs actual analysis:', error);
    return [];
  }
};

// Income vs expenses comparison
export const getIncomeVsExpenses = async (startDate: string, endDate: string) => {
  try {
    const incomeQuery = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } },
          { amount: { $gt: 0 } } // Only income (positive amounts)
        ]
      })
      .select([{ totalIncome: { $sum: '$amount' } }]);
    
    const expenseQuery = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } },
          { amount: { $lt: 0 } } // Only expenses (negative amounts)
        ]
      })
      .select([{ totalExpenses: { $sum: '$amount' } }]);
    
    const [incomeResult, expenseResult] = await Promise.all([
      runQuery(incomeQuery),
      runQuery(expenseQuery)
    ]);
    
    const totalIncome = incomeResult.data[0]?.totalIncome || 0;
    const totalExpenses = Math.abs(expenseResult.data[0]?.totalExpenses || 0);
    const netAmount = totalIncome - totalExpenses;
    
    const analysis = {
      period: `${startDate} to ${endDate}`,
      totalIncome: totalIncome / 100,
      totalExpenses: totalExpenses / 100,
      netAmount: netAmount / 100,
      savingsRate: totalIncome !== 0 ? ((netAmount / totalIncome) * 100).toFixed(1) : '0'
    };
    
    console.log('Income vs Expenses Analysis:');
    console.log(`Period: ${analysis.period}`);
    console.log(`Total Income: $${analysis.totalIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${analysis.totalExpenses.toFixed(2)}`);
    console.log(`Net Amount: $${analysis.netAmount.toFixed(2)}`);
    console.log(`Savings Rate: ${analysis.savingsRate}%`);
    
    return analysis;
  } catch (error) {
    console.error('Failed to get income vs expenses analysis:', error);
    return null;
  }
};

// Complex query with multiple joins and conditions
export const getDetailedTransactionAnalysis = async (startDate: string, endDate: string) => {
  try {
    const query = q('transactions')
      .filter({
        $and: [
          { date: { $gte: startDate } },
          { date: { $lte: endDate } }
        ]
      })
      .select([
        'id',
        'date',
        'amount',
        'notes',
        'account.name',
        'account.type',
        'payee.name',
        'category.name',
        'category.group.name',
        'category.is_income'
      ])
      .orderBy([{ date: 'desc' }])
      .options({ splits: 'inline' }); // Include split transaction details
    
    const { data } = await runQuery(query);
    
    // Group and analyze the data
    const analysis = {
      totalTransactions: data.length,
      incomeTransactions: data.filter((t: any) => t.amount > 0).length,
      expenseTransactions: data.filter((t: any) => t.amount < 0).length,
      totalIncome: data.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0) / 100,
      totalExpenses: Math.abs(data.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + t.amount, 0)) / 100,
      uniquePayees: new Set(data.map((t: any) => t['payee.name'])).size,
      uniqueCategories: new Set(data.map((t: any) => t['category.name'])).size,
      accountBreakdown: {}
    };
    
    // Account breakdown
    const accountGroups = data.reduce((acc: any, transaction: any) => {
      const accountName = transaction['account.name'];
      if (!acc[accountName]) {
        acc[accountName] = { count: 0, totalAmount: 0 };
      }
      acc[accountName].count++;
      acc[accountName].totalAmount += transaction.amount;
      return acc;
    }, {});
    
    analysis.accountBreakdown = Object.entries(accountGroups).map(([account, data]: [string, any]) => ({
      account,
      transactionCount: data.count,
      netAmount: data.totalAmount / 100
    }));
    
    console.log('Detailed Transaction Analysis:');
    console.log(`Period: ${startDate} to ${endDate}`);
    console.log(`Total Transactions: ${analysis.totalTransactions}`);
    console.log(`Income Transactions: ${analysis.incomeTransactions}`);
    console.log(`Expense Transactions: ${analysis.expenseTransactions}`);
    console.log(`Total Income: $${analysis.totalIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${analysis.totalExpenses.toFixed(2)}`);
    console.log(`Unique Payees: ${analysis.uniquePayees}`);
    console.log(`Unique Categories: ${analysis.uniqueCategories}`);
    
    console.log('\nAccount Breakdown:');
    analysis.accountBreakdown.forEach((item: any) => {
      console.log(`${item.account}: ${item.transactionCount} transactions, Net: $${item.netAmount.toFixed(2)}`);
    });
    
    return analysis;
  } catch (error) {
    console.error('Failed to get detailed transaction analysis:', error);
    return null;
  }
};

// Custom query builder helper
export const createCustomQuery = (
  table: string,
  filters: any = {},
  selections: string[] = ['*'],
  orderBy: any[] = [],
  limit?: number
) => {
  let query = q(table);
  
  if (Object.keys(filters).length > 0) {
    query = query.filter(filters);
  }
  
  query = query.select(selections);
  
  if (orderBy.length > 0) {
    query = query.orderBy(orderBy);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  return query;
};

// Execute custom query
export const runCustomQuery = async (
  table: string,
  filters: any = {},
  selections: string[] = ['*'],
  orderBy: any[] = [],
  limit?: number
) => {
  try {
    const query = createCustomQuery(table, filters, selections, orderBy, limit);
    const { data } = await runQuery(query);
    
    console.log(`Custom query on ${table} returned ${data.length} records`);
    return data;
  } catch (error) {
    console.error('Failed to run custom query:', error);
    return [];
  }
};