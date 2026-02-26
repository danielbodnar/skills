/**
 * Category and Budget Management Examples
 * 
 * This file demonstrates category creation, budget planning,
 * and spending analysis for Actual Budget.
 */

import api from '@actual-app/api';

// Category interfaces
export interface CategoryGroup {
  id?: string;
  name: string;
  is_income?: boolean;  // Whether this is an income category group
  sort_order?: number;  // Display order
}

export interface Category {
  id?: string;
  name: string;
  group_id: string;     // Parent category group ID
  is_income?: boolean;  // Whether this is an income category
  sort_order?: number;  // Display order within group
}

// Budget data interface
export interface BudgetAmount {
  category_id: string;
  amount: number;       // Amount in cents
  month: string;        // YYYY-MM format
}

// Get all category groups
export const getCategoryGroups = async () => {
  try {
    const groups = await api.getCategoryGroups();
    console.log(`Found ${groups.length} category groups`);
    return groups;
  } catch (error) {
    console.error('Failed to get category groups:', error);
    return [];
  }
};

// Create a new category group
export const createCategoryGroup = async (groupData: CategoryGroup): Promise<string | null> => {
  try {
    const groupId = await api.createCategoryGroup(groupData);
    console.log(`Created category group: ${groupData.name} (ID: ${groupId})`);
    return groupId;
  } catch (error) {
    console.error('Failed to create category group:', error);
    return null;
  }
};

// Get all categories
export const getCategories = async () => {
  try {
    const categories = await api.getCategories();
    console.log(`Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('Failed to get categories:', error);
    return [];
  }
};

// Create a new category
export const createCategory = async (categoryData: Category): Promise<string | null> => {
  try {
    const categoryId = await api.createCategory(categoryData);
    console.log(`Created category: ${categoryData.name} (ID: ${categoryId})`);
    return categoryId;
  } catch (error) {
    console.error('Failed to create category:', error);
    return null;
  }
};

// Create a complete category structure
export const setupBudgetCategories = async () => {
  try {
    // Create Income group
    const incomeGroupId = await createCategoryGroup({
      name: 'Income',
      is_income: true
    });
    
    // Create Fixed Expenses group
    const fixedExpensesId = await createCategoryGroup({
      name: 'Fixed Expenses'
    });
    
    // Create Variable Expenses group  
    const variableExpensesId = await createCategoryGroup({
      name: 'Variable Expenses'
    });
    
    // Create Savings group
    const savingsGroupId = await createCategoryGroup({
      name: 'Savings & Goals'
    });
    
    if (!incomeGroupId || !fixedExpensesId || !variableExpensesId || !savingsGroupId) {
      throw new Error('Failed to create category groups');
    }
    
    // Create income categories
    const incomeCategories = [
      { name: 'Salary', group_id: incomeGroupId, is_income: true },
      { name: 'Freelance', group_id: incomeGroupId, is_income: true },
      { name: 'Other Income', group_id: incomeGroupId, is_income: true }
    ];
    
    // Create fixed expense categories
    const fixedExpenseCategories = [
      { name: 'Rent/Mortgage', group_id: fixedExpensesId },
      { name: 'Insurance', group_id: fixedExpensesId },
      { name: 'Utilities', group_id: fixedExpensesId },
      { name: 'Phone', group_id: fixedExpensesId },
      { name: 'Internet', group_id: fixedExpensesId }
    ];
    
    // Create variable expense categories
    const variableExpenseCategories = [
      { name: 'Groceries', group_id: variableExpensesId },
      { name: 'Dining Out', group_id: variableExpensesId },
      { name: 'Transportation', group_id: variableExpensesId },
      { name: 'Entertainment', group_id: variableExpensesId },
      { name: 'Clothing', group_id: variableExpensesId },
      { name: 'Personal Care', group_id: variableExpensesId },
      { name: 'Miscellaneous', group_id: variableExpensesId }
    ];
    
    // Create savings categories
    const savingsCategories = [
      { name: 'Emergency Fund', group_id: savingsGroupId },
      { name: 'Vacation', group_id: savingsGroupId },
      { name: 'Car Replacement', group_id: savingsGroupId },
      { name: 'Home Improvement', group_id: savingsGroupId },
      { name: 'Retirement', group_id: savingsGroupId }
    ];
    
    // Create all categories
    const allCategories = [
      ...incomeCategories,
      ...fixedExpenseCategories,
      ...variableExpenseCategories,
      ...savingsCategories
    ];
    
    const createdCategories = [];
    for (const category of allCategories) {
      const categoryId = await createCategory(category);
      if (categoryId) {
        createdCategories.push({ ...category, id: categoryId });
      }
    }
    
    console.log(`Created ${createdCategories.length} categories`);
    return createdCategories;
    
  } catch (error) {
    console.error('Failed to setup budget categories:', error);
    return [];
  }
};

// Get budget data for a specific month
export const getBudgetMonth = async (month: string) => {
  try {
    const budget = await api.getBudgetMonth(month);
    console.log(`Budget data for ${month}:`, {
      totalBudgeted: budget.totalBudgeted / 100,
      totalSpent: budget.totalSpent / 100,
      totalBalance: budget.totalBalance / 100
    });
    return budget;
  } catch (error) {
    console.error(`Failed to get budget for ${month}:`, error);
    return null;
  }
};

// Set budget amount for a category in a specific month
export const setBudgetAmount = async (
  categoryId: string,
  month: string,
  amount: number // Amount in dollars
) => {
  try {
    const amountInCents = Math.round(amount * 100);
    await api.setBudgetAmount(month, categoryId, amountInCents);
    console.log(`Set budget for category ${categoryId} in ${month}: $${amount}`);
    return true;
  } catch (error) {
    console.error('Failed to set budget amount:', error);
    return false;
  }
};

// Set budget amounts for multiple categories
export const setBulkBudgetAmounts = async (
  month: string,
  budgets: Array<{ categoryId: string; amount: number }>
) => {
  const results = [];
  
  for (const budget of budgets) {
    const success = await setBudgetAmount(budget.categoryId, month, budget.amount);
    results.push({ categoryId: budget.categoryId, success });
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Successfully set ${successCount}/${budgets.length} budget amounts`);
  
  return results;
};

// Create a sample monthly budget
export const createSampleBudget = async (month: string) => {
  // First get categories to find IDs
  const categories = await getCategories();
  
  const findCategoryId = (name: string) => {
    const category = categories.find((c: any) => c.name === name);
    return category?.id;
  };
  
  // Sample budget allocations
  const budgetAllocations = [
    // Fixed Expenses
    { name: 'Rent/Mortgage', amount: 1200 },
    { name: 'Insurance', amount: 150 },
    { name: 'Utilities', amount: 120 },
    { name: 'Phone', amount: 80 },
    { name: 'Internet', amount: 60 },
    
    // Variable Expenses
    { name: 'Groceries', amount: 400 },
    { name: 'Dining Out', amount: 200 },
    { name: 'Transportation', amount: 300 },
    { name: 'Entertainment', amount: 150 },
    { name: 'Clothing', amount: 100 },
    { name: 'Personal Care', amount: 75 },
    { name: 'Miscellaneous', amount: 100 },
    
    // Savings
    { name: 'Emergency Fund', amount: 300 },
    { name: 'Vacation', amount: 200 },
    { name: 'Car Replacement', amount: 150 },
    { name: 'Home Improvement', amount: 100 },
    { name: 'Retirement', amount: 500 }
  ];
  
  const budgetAmounts = budgetAllocations.map(allocation => ({
    categoryId: findCategoryId(allocation.name),
    amount: allocation.amount
  })).filter(budget => budget.categoryId); // Remove categories that don't exist
  
  return await setBulkBudgetAmounts(month, budgetAmounts);
};

// Get spending summary by category for a month
export const getSpendingSummary = async (month: string) => {
  try {
    const budget = await getBudgetMonth(month);
    const categories = await getCategories();
    
    const summary = budget.categoryAmounts.map((item: any) => {
      const category = categories.find((c: any) => c.id === item.id);
      return {
        categoryName: category?.name || 'Unknown',
        budgeted: item.budgeted / 100,
        spent: item.spent / 100,
        balance: item.balance / 100,
        percentSpent: item.budgeted !== 0 ? (item.spent / item.budgeted * 100).toFixed(1) : 'N/A'
      };
    });
    
    console.log(`Spending summary for ${month}:`);
    summary.forEach(item => {
      console.log(`${item.categoryName}: Budgeted $${item.budgeted}, Spent $${item.spent} (${item.percentSpent}%)`);
    });
    
    return summary;
  } catch (error) {
    console.error('Failed to get spending summary:', error);
    return [];
  }
};

// Find categories that are over budget
export const findOverBudgetCategories = async (month: string) => {
  try {
    const budget = await getBudgetMonth(month);
    const categories = await getCategories();
    
    const overBudget = budget.categoryAmounts
      .filter((item: any) => item.balance < 0)
      .map((item: any) => {
        const category = categories.find((c: any) => c.id === item.id);
        return {
          categoryName: category?.name || 'Unknown',
          budgeted: item.budgeted / 100,
          spent: item.spent / 100,
          overBy: Math.abs(item.balance) / 100
        };
      });
    
    console.log(`Over-budget categories for ${month}:`);
    overBudget.forEach(item => {
      console.log(`${item.categoryName}: Over by $${item.overBy} (Budgeted: $${item.budgeted}, Spent: $${item.spent})`);
    });
    
    return overBudget;
  } catch (error) {
    console.error('Failed to find over-budget categories:', error);
    return [];
  }
};

// Move money between categories (covering)
export const moveBudgetAmount = async (
  fromCategoryId: string,
  toCategoryId: string,
  amount: number, // Amount in dollars
  month: string
) => {
  try {
    const amountInCents = Math.round(amount * 100);
    
    // Get current budget amounts
    const budget = await getBudgetMonth(month);
    const fromCategory = budget.categoryAmounts.find((c: any) => c.id === fromCategoryId);
    const toCategory = budget.categoryAmounts.find((c: any) => c.id === toCategoryId);
    
    if (!fromCategory || !toCategory) {
      throw new Error('Category not found');
    }
    
    // Update budget amounts
    await api.setBudgetAmount(month, fromCategoryId, fromCategory.budgeted - amountInCents);
    await api.setBudgetAmount(month, toCategoryId, toCategory.budgeted + amountInCents);
    
    console.log(`Moved $${amount} from category ${fromCategoryId} to ${toCategoryId}`);
    return true;
  } catch (error) {
    console.error('Failed to move budget amount:', error);
    return false;
  }
};

// Update category information
export const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
  try {
    await api.updateCategory(categoryId, updates);
    console.log(`Updated category ${categoryId}`);
    return true;
  } catch (error) {
    console.error('Failed to update category:', error);
    return false;
  }
};

// Delete a category (will move transactions to uncategorized)
export const deleteCategory = async (categoryId: string) => {
  try {
    await api.deleteCategory(categoryId);
    console.log(`Deleted category ${categoryId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete category:', error);
    return false;
  }
};

// Get budget comparison across multiple months
export const getBudgetComparison = async (months: string[]) => {
  const comparison = [];
  
  for (const month of months) {
    const budget = await getBudgetMonth(month);
    if (budget) {
      comparison.push({
        month,
        totalBudgeted: budget.totalBudgeted / 100,
        totalSpent: budget.totalSpent / 100,
        totalBalance: budget.totalBalance / 100
      });
    }
  }
  
  console.log('Budget comparison:');
  comparison.forEach(item => {
    console.log(`${item.month}: Budgeted $${item.totalBudgeted}, Spent $${item.totalSpent}, Balance $${item.totalBalance}`);
  });
  
  return comparison;
};

// Complete budget workflow example
export const budgetWorkflow = async () => {
  try {
    // Setup category structure
    await setupBudgetCategories();
    
    // Create budget for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    await createSampleBudget(currentMonth);
    
    // Get spending summary
    await getSpendingSummary(currentMonth);
    
    // Find over-budget categories
    await findOverBudgetCategories(currentMonth);
    
    // Compare last 3 months
    const lastThreeMonths = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      lastThreeMonths.push(date.toISOString().slice(0, 7));
    }
    
    await getBudgetComparison(lastThreeMonths);
    
  } catch (error) {
    console.error('Budget workflow failed:', error);
  }
};