/**
 * TypeScript Type Definitions for Actual Budget API
 * 
 * This file provides comprehensive type definitions for working with
 * the Actual Budget API in TypeScript projects.
 */

// Core primitive types used throughout the API
export type ActualId = string; // UUID format
export type ActualDate = string; // YYYY-MM-DD format  
export type ActualMonth = string; // YYYY-MM format
export type ActualAmount = number; // Amount in cents (e.g., $12.34 = 1234)

// Account types supported by Actual Budget
export type AccountType = 
  | 'checking'
  | 'savings' 
  | 'credit'
  | 'investment'
  | 'mortgage'
  | 'debt'
  | 'other';

// Login methods for server authentication
export type LoginMethod = 'password' | 'header' | 'openid';

// Transaction clearing status
export type ClearingStatus = 'cleared' | 'uncleared' | 'pending';

// API Initialization Configuration
export interface InitConfig {
  /** Directory for locally cached budget files */
  dataDir?: string;
  /** URL of the Actual Budget server */
  serverURL?: string;  
  /** Password for server authentication */
  password?: string;
}

// Account interfaces
export interface Account {
  /** Unique account identifier */
  id?: ActualId;
  /** Display name of the account */
  name: string;
  /** Type of account */
  type: AccountType;
  /** Whether account is off-budget (not included in budget calculations) */
  offbudget?: boolean;
  /** Whether account is closed */
  closed?: boolean;
  /** Current account balance in cents */
  balance?: ActualAmount;
  /** Sort order for display */
  sort_order?: number;
}

// Transaction interfaces
export interface Transaction {
  /** Unique transaction identifier */
  id?: ActualId;
  /** Transaction date in YYYY-MM-DD format */
  date: ActualDate;
  /** Transaction amount in cents (negative for expenses, positive for income) */
  amount: ActualAmount;
  /** Account this transaction belongs to */
  account_id?: ActualId;
  /** Payee ID (use payee_name for imports to auto-create payee) */
  payee_id?: ActualId;
  /** Payee name (for imports, creates payee if doesn't exist) */
  payee_name?: string;
  /** Category ID for transaction */
  category_id?: ActualId;
  /** Category name (for imports) */
  category_name?: string;
  /** Transaction notes/memo */
  notes?: string;
  /** Whether transaction is cleared */
  cleared?: boolean;
  /** Transaction clearing status */
  clearing?: ClearingStatus;
  /** Whether this is a transfer between accounts */
  transfer_id?: ActualId;
  /** Parent transaction ID for split transactions */
  parent_id?: ActualId;
  /** Whether this is a split transaction */
  is_split?: boolean;
  /** Sort order within the day */
  sort_order?: number;
  /** Whether transaction is reconciled */
  reconciled?: boolean;
}

// Payee interfaces
export interface Payee {
  /** Unique payee identifier */
  id?: ActualId;
  /** Payee display name */
  name: string;
  /** Default category for this payee */
  category?: ActualId;
  /** Account for transfer payees */
  transfer_acct?: ActualId;
  /** Number of transactions for this payee */
  count?: number;
}

// Category interfaces  
export interface CategoryGroup {
  /** Unique category group identifier */
  id?: ActualId;
  /** Display name of the category group */
  name: string;
  /** Whether this is an income category group */
  is_income?: boolean;
  /** Sort order for display */
  sort_order?: number;
  /** Whether this group is hidden */
  hidden?: boolean;
}

export interface Category {
  /** Unique category identifier */
  id?: ActualId;
  /** Display name of the category */
  name: string;
  /** Parent category group ID */
  group_id: ActualId;
  /** Whether this is an income category */
  is_income?: boolean;
  /** Sort order within the group */
  sort_order?: number;
  /** Whether this category is hidden */
  hidden?: boolean;
  /** Goal type for this category */
  goal_def?: any;
  /** Tombstone marker for deleted categories */
  tombstone?: boolean;
}

// Budget interfaces
export interface BudgetMonth {
  /** Month in YYYY-MM format */
  month: ActualMonth;
  /** Total amount budgeted for the month */
  totalBudgeted: ActualAmount;
  /** Total amount spent in the month */
  totalSpent: ActualAmount;
  /** Total balance (budgeted - spent) */
  totalBalance: ActualAmount;
  /** Per-category budget amounts */
  categoryAmounts: CategoryBudgetAmount[];
  /** Income for the month */
  totalIncome: ActualAmount;
  /** Amount available to budget */
  toBudget: ActualAmount;
  /** Amount from last month */  
  fromLastMonth: ActualAmount;
}

export interface CategoryBudgetAmount {
  /** Category identifier */
  id: ActualId;
  /** Category name */
  name?: string;
  /** Amount budgeted for this category */
  budgeted: ActualAmount;
  /** Amount spent in this category */
  spent: ActualAmount;
  /** Balance remaining (budgeted - spent) */
  balance: ActualAmount;
  /** Carryover from previous month */
  carryover?: ActualAmount;
  /** Goal information */
  goal?: any;
}

// File and budget management
export interface BudgetFile {
  /** Unique budget file identifier */
  id: ActualId;
  /** Display name of the budget */
  name: string;
  /** Whether the budget uses end-to-end encryption */
  encrypt_keyId?: string;
  /** Last modified timestamp */
  last_modified?: string;
  /** File size in bytes */
  size?: number;
  /** Budget sync ID for server sync */
  sync_id?: ActualId;
}

// Server configuration interfaces
export interface ServerConfig {
  /** Port number to listen on */
  port?: number | string;
  /** Hostname to bind to */
  hostname?: string;
  /** HTTPS configuration */
  https?: {
    /** Path to SSL private key */
    key: string;
    /** Path to SSL certificate */
    cert: string;
    /** Additional TLS options */
    [key: string]: any;
  };
  /** Directory for server files */
  serverFiles?: string;
  /** Directory for user budget files */
  userFiles?: string;
  /** Directory for web frontend files */
  webRoot?: string;
  /** Authentication method */
  loginMethod?: LoginMethod;
  /** Allowed authentication methods */
  allowedLoginMethods?: LoginMethod[];
  /** Trusted proxy IP ranges */
  trustedProxies?: string[];
  /** File upload size limit in MB */
  uploadFileSizeLimitMB?: number;
  /** Sync file size limit in MB */
  uploadSyncFileSizeLimitMB?: number;
  /** Encrypted sync file size limit in MB */
  uploadSyncEncryptedFileSizeLimitMB?: number;
}

// Query system interfaces (ActualQL)
export interface QueryResult<T = any> {
  /** Query result data */
  data: T[];
  /** Query metadata */
  meta?: {
    /** Total count of records */
    count?: number;
    /** Query execution time */
    executionTime?: number;
  };
}

export interface QueryFilter {
  /** Field equals value */
  [field: string]: any;
  /** Logical AND operation */
  $and?: QueryFilter[];
  /** Logical OR operation */ 
  $or?: QueryFilter[];
  /** Field greater than value */
  $gt?: any;
  /** Field greater than or equal to value */
  $gte?: any;
  /** Field less than value */
  $lt?: any;
  /** Field less than or equal to value */
  $lte?: any;
  /** Field matches pattern (SQL LIKE) */
  $like?: string;
  /** Field is in array of values */
  $in?: any[];
  /** Field is not in array of values */
  $nin?: any[];
  /** Field is null */
  $null?: boolean;
}

export interface QueryOrderBy {
  /** Field name */
  [field: string]: 'asc' | 'desc';
}

export interface QueryAggregation {
  /** Sum aggregation */
  $sum?: string;
  /** Count aggregation */
  $count?: string;
  /** Average aggregation */
  $avg?: string;
  /** Minimum aggregation */
  $min?: string;
  /** Maximum aggregation */
  $max?: string;
  /** Month extraction from date field */
  $month?: string;
  /** Year extraction from date field */
  $year?: string;
}

export interface QuerySelect {
  /** Field name or aggregation */
  [alias: string]: string | QueryAggregation;
}

// Bank sync interfaces
export interface BankSyncConfig {
  /** Bank sync provider */
  provider: 'gocardless' | 'simplefin' | 'pluggyai';
  /** Provider-specific configuration */
  config: {
    /** Client ID for API access */
    clientId?: string;
    /** Client secret for API access */
    clientSecret?: string;
    /** API access token */
    accessToken?: string;
    /** Bank institution ID */
    institutionId?: string;
    /** Account IDs to sync */
    accountIds?: string[];
    /** SimpleFIN setup token */
    setupToken?: string;
    /** Pluggy.ai Item IDs */
    itemIds?: string[];
  };
}

// Import/Export interfaces
export interface ImportTransaction {
  /** Transaction date */
  date: ActualDate;
  /** Transaction amount in dollars (will be converted to cents) */
  amount: number;
  /** Payee name */
  payee_name?: string;
  /** Transaction description/notes */
  description?: string;
  /** Category name */
  category_name?: string;
  /** Account name */
  account_name?: string;
  /** Transaction memo */
  memo?: string;
  /** Whether transaction is cleared */
  cleared?: boolean;
}

export interface ExportOptions {
  /** Include account data */
  includeAccounts?: boolean;
  /** Include transaction data */
  includeTransactions?: boolean;
  /** Include category data */
  includeCategories?: boolean;
  /** Include budget data */
  includeBudgets?: boolean;
  /** Date range filter */
  dateRange?: {
    start: ActualDate;
    end: ActualDate;
  };
  /** Export format */
  format?: 'json' | 'csv';
}

// API Method types
export interface ActualAPI {
  // Core methods
  init(config: InitConfig): Promise<void>;
  shutdown(): Promise<void>;
  sync(): Promise<void>;
  
  // Budget management
  getBudgets(): Promise<BudgetFile[]>;
  loadBudget(budgetId: ActualId): Promise<void>;
  downloadBudget(budgetId: ActualId, options?: { password?: string }): Promise<void>;
  getBudgetMonth(month: ActualMonth): Promise<BudgetMonth>;
  setBudgetAmount(month: ActualMonth, categoryId: ActualId, amount: ActualAmount): Promise<void>;
  
  // Account methods
  getAccounts(): Promise<Account[]>;
  createAccount(account: Omit<Account, 'id'>): Promise<ActualId>;
  updateAccount(id: ActualId, updates: Partial<Account>): Promise<void>;
  deleteAccount(id: ActualId): Promise<void>;
  
  // Transaction methods
  getTransactions(accountId: ActualId, startDate: ActualDate, endDate: ActualDate): Promise<Transaction[]>;
  importTransactions(accountId: ActualId, transactions: Transaction[]): Promise<any>;
  addTransactions(accountId: ActualId, transactions: Transaction[]): Promise<void>;
  updateTransaction(id: ActualId, updates: Partial<Transaction>): Promise<void>;
  deleteTransaction(id: ActualId): Promise<void>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id'>): Promise<ActualId>;
  updateCategory(id: ActualId, updates: Partial<Category>): Promise<void>;
  deleteCategory(id: ActualId): Promise<void>;
  getCategoryGroups(): Promise<CategoryGroup[]>;
  createCategoryGroup(group: Omit<CategoryGroup, 'id'>): Promise<ActualId>;
  updateCategoryGroup(id: ActualId, updates: Partial<CategoryGroup>): Promise<void>;
  deleteCategoryGroup(id: ActualId): Promise<void>;
  
  // Payee methods
  getPayees(): Promise<Payee[]>;
  createPayee(payee: Omit<Payee, 'id'>): Promise<ActualId>;
  updatePayee(id: ActualId, updates: Partial<Payee>): Promise<void>;
  deletePayee(id: ActualId): Promise<void>;
  mergePayees(targetId: ActualId, mergeIds: ActualId[]): Promise<void>;
  
  // Query methods
  runQuery(query: any): Promise<QueryResult>;
  
  // Import/Export methods
  runImport(budgetName: string, importFn: () => Promise<void>): Promise<void>;
  exportBudget(): Promise<any>;
  importBudget(data: any): Promise<void>;
  
  // Bank sync
  runBankSync(): Promise<void>;
}

// Utility type helpers
export type CreateAccount = Omit<Account, 'id'>;
export type CreateTransaction = Omit<Transaction, 'id'>;
export type CreateCategory = Omit<Category, 'id'>;
export type CreateCategoryGroup = Omit<CategoryGroup, 'id'>;
export type CreatePayee = Omit<Payee, 'id'>;

export type UpdateAccount = Partial<Account>;
export type UpdateTransaction = Partial<Transaction>;  
export type UpdateCategory = Partial<Category>;
export type UpdateCategoryGroup = Partial<CategoryGroup>;
export type UpdatePayee = Partial<Payee>;

// Validation schemas would go here if using a runtime validation library
// For now, these serve as TypeScript compile-time type checking

export default ActualAPI;