# Actual Budget Reference

**Always remember to reference ./references/actualbudget.md and look for snippets and examples in ./snippets/actualbudget/**

## Quick Reference

- Installation: `bun add @actual-app/api` (API client) or `bun add --location=global @actual-app/sync-server` (server)
- Import: `import api from '@actual-app/api'` or `const api = require('@actual-app/api')`
- Documentation: <https://actualbudget.org/docs/>
- GitHub: <https://github.com/actualbudget/actual>
- Package: <https://www.npmjs.com/package/@actual-app/api>

## Default Usage Patterns

Actual Budget is a local-first personal finance application designed for envelope budgeting with these key characteristics:

- **Local-First Design**: Budget data stored locally for privacy and performance
- **Optional Synchronization**: Self-hosted sync server for multi-device access  
- **Envelope Budgeting**: Assign every dollar to specific categories/envelopes
- **Developer-Friendly API**: Full programmatic access to budget data
- **Bank Integration**: Support for bank syncing via GoCardless and SimpleFIN
- **Import/Export**: Multiple format support (QIF, OFX, CSV, etc.)
- **End-to-End Encryption**: Optional encryption for synced data

## Resources and Documentation

- [Actual Budget Website](https://actualbudget.org/)
  - [Getting Started](https://actualbudget.org/docs/getting-started/)
  - [Installation Guide](https://actualbudget.org/docs/install/)
    - [Docker Installation](https://actualbudget.org/docs/install/docker)
    - [CLI Tool](https://actualbudget.org/docs/install/cli-tool)
    - [Fly.io Deployment](https://actualbudget.org/docs/install/fly)
    - [Build from Source](https://actualbudget.org/docs/install/build-from-source)
  - [API Reference](https://actualbudget.org/docs/api/)
    - [Core API Methods](https://actualbudget.org/docs/api/reference)
    - [ActualQL Query Language](https://actualbudget.org/docs/api/actual-ql)
    - [Query Examples](https://actualbudget.org/docs/api/actual-ql/examples)
  - [Configuration](https://actualbudget.org/docs/config/)
    - [Server Configuration](https://actualbudget.org/docs/config)
    - [HTTPS Setup](https://actualbudget.org/docs/config/https)
    - [Reverse Proxies](https://actualbudget.org/docs/config/reverse-proxies)
    - [OAuth Authentication](https://actualbudget.org/docs/config/oauth-auth)
  - [Bank Sync](https://actualbudget.org/docs/advanced/bank-sync/)
    - [GoCardless Integration](https://actualbudget.org/docs/advanced/bank-sync/gocardless)
    - [SimpleFIN Integration](https://actualbudget.org/docs/advanced/bank-sync/simplefin)
  - [Migration Guides](https://actualbudget.org/docs/migration/)
    - [From YNAB](https://actualbudget.org/docs/migration/ynab4)
    - [From nYNAB](https://actualbudget.org/docs/migration/nynab)
    - [From Mint](https://actualbudget.org/docs/migration/mint)
- [Community Resources](https://actualbudget.org/docs/community/)
  - [Discord Community](https://discord.gg/8JfNDDdp6F)
  - [Contributing Guide](https://actualbudget.org/docs/contributing/)
  - [Project Details](https://actualbudget.org/docs/contributing/project-details)
  - [Release Notes](https://actualbudget.org/docs/releases/)

## Core Concepts

### Local-First Architecture

- Budget data stored locally on device for privacy and performance
- Optional self-hosted sync server for multi-device synchronization
- Data ownership remains with the user
- Works offline by default

### Envelope Budgeting Method

- Assign every dollar to specific categories (envelopes)
- Track spending against allocated amounts
- Visualize overspending and available funds
- Monthly budget planning and review

### API-Driven Access

- Full programmatic access to budget data
- Custom importer development
- Data analysis and reporting
- Integration with external systems

### Security and Privacy

- No data sent to third parties
- Optional end-to-end encryption
- Self-hosted synchronization
- Open source codebase for transparency

## Core APIs

### Server Installation and Management

```bash
# Install sync server globally
npm install --location=global @actual-app/sync-server

# Run server with default config
actual-server

# Run with custom configuration
actual-server --config ./config.json

# Reset password
actual-server --reset-password
```

### API Client Installation

```bash
# Install API client for Node.js projects
npm install --save @actual-app/api
# or with Bun
bun add @actual-app/api
```

### Basic API Connection

```javascript
const api = require('@actual-app/api');

// Initialize connection to server
await api.init({
  dataDir: '/path/to/local/cache',     // Local data cache directory
  serverURL: 'http://localhost:5006',  // Actual server URL
  password: 'your-server-password'     // Server password
});

// Download specific budget
await api.downloadBudget('budget-sync-id');
// With encryption
await api.downloadBudget('budget-sync-id', { password: 'encryption-key' });

// Get budget data
const budget = await api.getBudgetMonth('2024-01');

// Clean shutdown
await api.shutdown();
```

### Data Management

```javascript
// Account operations  
const accounts = await api.getAccounts();
const newAccountId = await api.createAccount({
  name: "Ally Savings",
  type: "savings"
});

// Transaction operations
const transactions = await api.getTransactions(accountId, '2024-01-01', '2024-01-31');
await api.importTransactions(accountId, [
  {
    date: '2024-01-15',
    amount: 1200, // $12.00 (amounts in cents)
    payee_name: 'Grocery Store',
    category_id: 'food-category-id'
  }
]);

// Category management
const categories = await api.getCategories();
const newCategoryId = await api.createCategory({
  name: "Food",
  group_id: "bills-group-id"
});
```

### Custom Data Import

```javascript
// Bulk data import for new budget
await api.runImport('My Budget', async () => {
  // Create accounts
  const checkingId = await api.createAccount({
    name: 'Checking Account',
    type: 'checking'
  });
  
  // Import transactions in bulk
  await api.addTransactions(checkingId, transactionData);
});
```

### Query System (ActualQL)

```javascript
const { q, runQuery } = require('@actual-app/api');

// Query transactions with filtering
const query = q('transactions')
  .filter({
    'category.name': 'Food',
    date: { $gte: '2024-01-01' }
  })
  .select(['id', 'date', 'amount', 'payee.name']);

const { data } = await runQuery(query);

// Aggregate queries
const summaryQuery = q('transactions')
  .filter({ date: { $gte: '2024-01-01' } })
  .groupBy('category.name')
  .select([
    'category.name',
    { total: { $sum: '$amount' } }
  ]);
```

## Server Configuration

### Basic Configuration (config.json)

```json
{
  "port": 5006,
  "hostname": "::",
  "serverFiles": "./server-files",
  "userFiles": "./user-files",
  "loginMethod": "password"
}
```

### HTTPS Configuration

```json
{
  "https": {
    "key": "/path/to/private.key",
    "cert": "/path/to/certificate.crt"
  },
  "port": 443
}
```

### Environment Variables

```bash
# Server configuration
export ACTUAL_PORT=5006
export ACTUAL_HOSTNAME="::"
export ACTUAL_DATA_DIR="/data"

# HTTPS setup
export ACTUAL_HTTPS_KEY="/path/to/private.key"
export ACTUAL_HTTPS_CERT="/path/to/certificate.crt"

# File size limits
export ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB=20
export ACTUAL_UPLOAD_SYNC_ENCRYPTED_FILE_SYNC_SIZE_LIMIT_MB=50

# Authentication
export ACTUAL_LOGIN_METHOD="password"
export ACTUAL_TRUSTED_PROXIES="10.0.0.0/8,172.16.0.0/12"
```

## Deployment Patterns

### Docker Deployment

```bash
# Run with Docker
docker run -d \
  -p 5006:5006 \
  -v actual-data:/data \
  --name actual-server \
  actualbudget/actual-server:latest

# With custom configuration
docker run -d \
  -p 5006:5006 \
  -v actual-data:/data \
  -v $(pwd)/config.json:/data/config.json \
  actualbudget/actual-server:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  actual-server:
    image: actualbudget/actual-server:latest
    restart: unless-stopped
    ports:
      - "5006:5006"
    volumes:
      - actual-data:/data
    environment:
      - ACTUAL_PORT=5006
      - ACTUAL_LOGIN_METHOD=password

volumes:
  actual-data:
```

### Fly.io Deployment

```bash
# Initialize Fly app
fly launch --image actualbudget/actual-server:latest

# Create persistent volume
fly volumes create actual_data

# Deploy application
fly deploy
```

## Bank Integration

### GoCardless Setup

```javascript
// Enable GoCardless bank sync
// Configure through Actual UI: Settings -> Experimental Features
// Requires GoCardless institution ID and user credentials
```

### SimpleFIN Setup  

```javascript
// Configure SimpleFIN connection
// Requires SimpleFIN token and setup key
// Set up through Actual UI bank sync configuration
```

## Advanced Patterns

### Custom Rule Engine

```javascript
// Create automated transaction rules
const ruleConfig = {
  conditions: [
    {
      field: 'payee.name',
      op: 'contains',
      value: 'GROCERY'
    }
  ],
  actions: [
    {
      field: 'category_id', 
      value: 'food-category-id'
    }
  ]
};
```

### Data Analysis

```javascript
// Monthly spending analysis
const monthlySpending = await runQuery(
  q('transactions')
    .filter({
      date: { $gte: '2024-01-01', $lte: '2024-12-31' }
    })
    .groupBy(['date', 'category.name'])
    .select([
      'date',
      'category.name',
      { amount: { $sum: '$amount' } }
    ])
);

// Budget vs actual comparison
const budgetComparison = await api.getBudgetMonth('2024-01');
```

### Backup and Restore

```javascript
// Export budget data
const exportData = await api.exportBudget();

// Import budget data  
await api.importBudget(exportData);

// Sync with server
await api.sync();
```

## Testing Patterns

### API Testing Setup

```javascript
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import api from '@actual-app/api';

describe('Actual Budget Integration', () => {
  beforeEach(async () => {
    await api.init({
      dataDir: './test-data',
      serverURL: 'http://localhost:5006',
      password: 'test-password'
    });
  });

  afterEach(async () => {
    await api.shutdown();
  });

  it('should create account and add transactions', async () => {
    const accountId = await api.createAccount({
      name: 'Test Account',
      type: 'checking'
    });

    await api.importTransactions(accountId, [
      {
        date: '2024-01-01',
        amount: 1000,
        payee_name: 'Test Payee'
      }
    ]);

    const transactions = await api.getTransactions(accountId, '2024-01-01', '2024-01-31');
    expect(transactions).toHaveLength(1);
  });
});
```

### Mock Server Setup

```javascript
// Mock server for testing
const mockServer = {
  init: vi.fn(),
  shutdown: vi.fn(),
  createAccount: vi.fn().mockResolvedValue('mock-account-id'),
  getAccounts: vi.fn().mockResolvedValue([])
};
```

## Code Examples Location

Comprehensive examples available in `./snippets/actualbudget/`:

- Basic API usage and server setup
- Advanced data import and export patterns  
- Bank synchronization integration
- Custom query and reporting examples
- Docker deployment configurations
- OAuth and authentication setup
- Testing utilities and mocks
- Performance optimization techniques

## Schema and Type Definitions

Type definitions and validation schemas in `./snippets/actualbudget/schemas/`

## Linting and Formatting

Latest configuration files in `./snippets/actualbudget/linting/`

## Migration Guides

### From YNAB

```javascript
// Import YNAB data
const ynabData = require('./ynab-export.json');

await api.runImport('YNAB Migration', async () => {
  // Convert YNAB accounts to Actual format
  for (const account of ynabData.accounts) {
    const accountId = await api.createAccount({
      name: account.name,
      type: mapYnabAccountType(account.type)
    });
    
    // Import transactions
    await api.addTransactions(accountId, 
      account.transactions.map(convertYnabTransaction)
    );
  }
});
```

### From Mint

```javascript
// Import Mint CSV data
const mintTransactions = parseMintCSV('./mint-transactions.csv');

await api.runImport('Mint Migration', async () => {
  const accountMap = new Map();
  
  // Group transactions by account
  for (const transaction of mintTransactions) {
    if (!accountMap.has(transaction.account)) {
      const accountId = await api.createAccount({
        name: transaction.account,
        type: 'checking'
      });
      accountMap.set(transaction.account, accountId);
    }
  }
  
  // Import transactions by account
  for (const [accountName, accountId] of accountMap) {
    const accountTransactions = mintTransactions
      .filter(t => t.account === accountName)
      .map(convertMintTransaction);
    
    await api.addTransactions(accountId, accountTransactions);
  }
});
```

## Performance Optimization

### Batch Operations

```javascript
// Batch transaction imports for better performance
const batchSize = 1000;
const transactionBatches = chunkArray(transactions, batchSize);

for (const batch of transactionBatches) {
  await api.addTransactions(accountId, batch);
}
```

### Query Optimization

```javascript
// Use efficient queries with proper filtering
const efficientQuery = q('transactions')
  .filter({ 
    date: { $gte: '2024-01-01' },
    account_id: accountId
  })
  .select(['id', 'amount', 'date']) // Only select needed fields
  .orderBy([{ date: 'desc' }])
  .limit(100);
```

### Caching Strategies

```javascript
// Cache frequently accessed data
const accountCache = new Map();

const getAccountCached = async (accountId) => {
  if (!accountCache.has(accountId)) {
    const account = await api.getAccount(accountId);
    accountCache.set(accountId, account);
  }
  return accountCache.get(accountId);
};
```

## Security Best Practices

### Environment Configuration

```bash
# Store sensitive configuration in environment variables
export ACTUAL_PASSWORD="$(cat /run/secrets/actual_password)"
export ACTUAL_ENCRYPTION_KEY="$(cat /run/secrets/encryption_key)"
```

### HTTPS and Proxy Setup

```nginx
# NGINX reverse proxy with SSL
server {
  listen 443 ssl http2;
  server_name budget.example.com;
  
  ssl_certificate /etc/ssl/certs/budget.example.com.pem;
  ssl_certificate_key /etc/ssl/private/budget.example.com.key;
  
  location / {
    proxy_pass http://localhost:5006;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Access Control

```javascript
// Implement access controls for API usage
const rateLimiter = new Map();

const checkRateLimit = (clientId) => {
  const now = Date.now();
  const requests = rateLimiter.get(clientId) || [];
  const recentRequests = requests.filter(time => now - time < 60000); // 1 minute window
  
  if (recentRequests.length >= 100) { // 100 requests per minute
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimiter.set(clientId, recentRequests);
};
```
