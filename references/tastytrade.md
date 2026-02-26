# Tastytrade Reference

**Always remember to reference @$HOME/.claude/references/tastytrade.md and look for snippets and examples in @$HOME/.claude/snippets/tastytrade/**

## Quick Reference

- Installation: `bun add @tastytrade/api`
- Import: `import TastytradeClient from '@tastytrade/api'`
- Documentation: <https://developer.tastytrade.com/>
- GitHub: <https://github.com/tastytrade/tastytrade-api-js>
- Package: <https://www.npmjs.com/package/@tastytrade/api>

## Resources and Documentation

- [Tastytrade Developer Documentation](https://developer.tastytrade.com/)
  - [Getting Started](https://developer.tastytrade.com/getting-started)
  - [API Reference](https://developer.tastytrade.com/api-reference)
    - [Authentication](https://developer.tastytrade.com/authentication)
    - [Sessions](https://developer.tastytrade.com/sessions)
    - [Accounts](https://developer.tastytrade.com/accounts)
    - [Orders](https://developer.tastytrade.com/orders)
    - [Market Data](https://developer.tastytrade.com/market-data)
    - [WebSocket Streaming](https://developer.tastytrade.com/streaming)
  - [Code Examples](https://developer.tastytrade.com/examples)
  - [Sandbox Environment](https://developer.tastytrade.com/sandbox)
- [JavaScript SDK Repository](https://github.com/tastytrade/tastytrade-api-js)
  - [README](https://github.com/tastytrade/tastytrade-api-js/blob/main/README.md)
  - [Examples](https://github.com/tastytrade/tastytrade-api-js/tree/main/examples)
  - [API Documentation](https://github.com/tastytrade/tastytrade-api-js/tree/main/lib)

## Core Concepts

### Authentication & Sessions

- **Session Management**: JWT-based authentication with login/logout flows
- **Remember Tokens**: 24-hour persistent sessions for API access
- **Account Access**: Multi-account support with account number identification
- **API Tokens**: Market data access tokens for streaming quotes

### Market Data Integration

- **Real-time Streaming**: WebSocket connections for live market data
- **Historical Data**: REST API access to historical prices and volume
- **Options Chains**: Comprehensive option chain data with Greeks
- **Market Sessions**: Trading hours and market status information

### Order Management

- **Order Types**: Market, limit, stop orders with advanced options
- **Multi-leg Orders**: Support for complex options strategies
- **Order Status**: Real-time order fill and status updates
- **Dry Run Mode**: Test orders without actual execution

### Account Features

- **Portfolio Management**: Positions, balances, and P&L tracking  
- **Transaction History**: Complete trade and transaction records
- **Risk Management**: Margin requirements and buying power calculations
- **Account Streaming**: Real-time account updates via WebSocket

## Core APIs

### Client Initialization

```typescript
import TastytradeClient from '@tastytrade/api'

const client = new TastytradeClient({ 
  baseUrl: 'https://api.tastytrade.com',
  accountStreamerUrl: 'https://streamer.tastytrade.com' 
})
```

### Authentication Flow

```typescript
// Login with credentials
const loginResponse = await client.sessionService.login(username, password)

// Get accounts
const accounts = await client.accountsAndCustomersService.getCustomerAccounts()

// Logout
await client.sessionService.logout()
```

### Market Data Access

```typescript
// Get quote token for streaming
const tokenResponse = await client.apiQuoteTokensService.getQuoteToken()

// Connect to market data (use @dxfeed/dxlink-api for streaming)
const { DXLinkWebSocketClient, DXLinkFeed } = require('@dxfeed/dxlink-api')
const client = new DXLinkWebSocketClient()
await client.connect('wss://tasty-openapi-ws.dxfeed.com/realtime')
client.setAuthToken(tokenResponse.token)
```

### Order Placement

```typescript
import { NewOrder, OrderType, OrderTimeInForce, OrderAction } from '@tastytrade/api'

const order = new NewOrder({
  timeInForce: OrderTimeInForce.DAY,
  orderType: OrderType.LIMIT,
  legs: [{
    quantity: 100,
    action: OrderAction.BUY_TO_OPEN,
    symbol: 'AAPL'
  }],
  price: 150.00
})

const response = await client.ordersService.placeOrder(accountNumber, order)
```

### Account Streaming

```typescript
const accountStreamer = client.accountStreamer

await accountStreamer.start()
await accountStreamer.subscribeToAccounts([accountNumber])

accountStreamer.addMessageObserver((message) => {
  console.log('Account update:', message)
})
```

## Integration Patterns

### Bun/Node.js Compatibility

```typescript
// For Node.js environments
global.WebSocket = require('ws')
global.window = { WebSocket, setTimeout, clearTimeout }

// For Bun (WebSocket is built-in)
// No additional setup required
```

### TypeScript Configuration

```typescript
// Type definitions are included with the package
import type { 
  Account, 
  Position, 
  Order, 
  MarketData 
} from '@tastytrade/api'
```

### Error Handling

```typescript
try {
  const response = await client.sessionService.login(username, password)
  if (!response.success) {
    throw new Error('Login failed')
  }
} catch (error) {
  console.error('API error:', error.message)
}
```

## Advanced Features

### Multi-Account Management

```typescript
const accounts = await client.accountsAndCustomersService.getCustomerAccounts()
accounts.forEach(account => {
  console.log(`Account: ${account.account['account-number']}`)
})
```

### Options Trading

```typescript
// Get option chains
const chains = await client.instrumentsService.getOptionChain('AAPL')

// Build complex options orders
const order = new NewOrder({
  legs: [
    { // Buy call
      quantity: 1,
      action: OrderAction.BUY_TO_OPEN,
      symbol: chains.calls[0].symbol
    },
    { // Sell put
      quantity: 1, 
      action: OrderAction.SELL_TO_OPEN,
      symbol: chains.puts[0].symbol
    }
  ]
})
```

### Real-time Portfolio Tracking

```typescript
// Subscribe to account updates
await accountStreamer.subscribeToAccounts(accountNumbers)

accountStreamer.addMessageObserver((message) => {
  if (message.type === 'position-update') {
    updatePortfolioDisplay(message.data)
  }
})
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/tastytrade/`:

- Authentication and session management
- Account data retrieval
- Order placement and management
- Market data integration with dxFeed
- WebSocket streaming patterns
- Portfolio tracking and analysis
- Options trading strategies
- Error handling and retry logic

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/tastytrade/schemas/`:

- API response types
- Order and position models
- Account data structures
- Market data interfaces

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/tastytrade/linting/`:

- TypeScript configurations
- ESLint rules for financial applications
- Prettier formatting standards

## Security Considerations

- **API Keys**: Store credentials securely using environment variables
- **Session Management**: Implement proper login/logout flows
- **Rate Limiting**: Respect API rate limits to avoid throttling
- **Data Privacy**: Handle financial data according to compliance requirements
- **WebSocket Security**: Validate all streaming data before processing

## Common Patterns

### Session Management

```typescript
class TastytradeSession {
  private client: TastytradeClient
  private currentSession: Session | null = null

  async login(username: string, password: string) {
    const response = await this.client.sessionService.login(username, password)
    this.currentSession = response.user
    return this.currentSession
  }

  async logout() {
    if (this.currentSession) {
      await this.client.sessionService.logout()
      this.currentSession = null
    }
  }
}
```

### Portfolio Monitoring

```typescript
class PortfolioMonitor {
  private accountStreamer: AccountStreamer

  async startMonitoring(accountNumbers: string[]) {
    await this.accountStreamer.start()
    await this.accountStreamer.subscribeToAccounts(accountNumbers)
    
    this.accountStreamer.addMessageObserver(this.handleUpdate.bind(this))
  }

  private handleUpdate(message: any) {
    switch (message.type) {
      case 'position-update':
        this.updatePositions(message.data)
        break
      case 'order-fill':
        this.updateOrders(message.data)
        break
    }
  }
}
```

## See Also

- Complete reference: `@$HOME/.claude/references/tastytrade.md`
- Code examples: `@$HOME/.claude/snippets/tastytrade/`
- Schemas: `@$HOME/.claude/snippets/tastytrade/schemas/`
- Linting configs: `@$HOME/.claude/snippets/tastytrade/linting/`
- Related: DxFeed integration at `@$HOME/.claude/references/dxfeed.md`
