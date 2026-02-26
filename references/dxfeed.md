# DxFeed/DxLink Reference

**Always remember to reference @$HOME/.claude/references/dxfeed.md and look for snippets and examples in @$HOME/.claude/snippets/dxfeed/**

## Quick Reference

- Installation: `bun add @dxfeed/dxlink-api @dxfeed/dxlink-websocket-client @dxfeed/dxlink-feed @dxfeed/dxlink-dom`
- Import: `import { DXLinkWebSocketClient, DXLinkFeed } from '@dxfeed/dxlink-api'`
- Documentation: <https://github.com/dxFeed/dxLink>
- GitHub: <https://github.com/dxFeed/dxLink/tree/main/dxlink-javascript>
- NPM Package: <https://www.npmjs.com/package/@dxfeed/dxlink-api>

## Default Usage Patterns

DxFeed/DxLink is a comprehensive market data streaming solution providing real-time financial data access:

- **Market Data API**: Real-time quotes, candles, trades, and market depth
- **WebSocket Client**: High-performance streaming data connections
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Multi-Asset Support**: Equities, futures, options, forex, cryptocurrencies
- **Enterprise-Grade**: Millisecond time-stamped data with 24×7×365 support

## Resources and Documentation

- [DxLink Repository](https://github.com/dxFeed/dxLink)
  - [JavaScript API README](https://github.com/dxFeed/dxLink/blob/main/dxlink-javascript/dxlink-api/README.md)
  - [API Specification](https://github.com/dxFeed/dxLink/blob/main/dxlink-specification/asyncapi.yml)
  - [Demo Application](https://github.com/dxFeed/dxLink/tree/main/dxlink-javascript/dxlink-api/demo)
  - [Documentation Site](https://github.com/dxFeed/dxLink/tree/main/dxlink-javascript/dxlink-docs)
- [DxFeed Corporate Site](https://dxfeed.com/)
  - [Market Data Services](https://dxfeed.com/market-data/)
  - [API Documentation](https://dxfeed.com/api/)
  - [Integration Guides](https://dxfeed.com/integration/)
- [Multi-Language Support](https://dxfeed.com/api/)
  - [Java API](https://dxfeed.com/api/java-api/)
  - [.NET API](https://github.com/dxFeed/dxfeed-graal-net-api)
  - [C/C++ API](https://github.com/dxFeed/dxfeed-graal-cxx-api)
  - [Swift API](https://github.com/dxFeed/dxfeed-graal-swift-api)

## Core Concepts

### Market Data Streaming

- **Real-time Feeds**: Live market data via WebSocket connections
- **Event-based Architecture**: Subscribe to specific event types (Quote, Trade, Greeks)
- **Symbol Management**: Support for various symbol formats and exchanges
- **Data Compression**: Efficient data transmission with COMPACT format

### Connection Management

- **WebSocket Client**: Persistent connections to market data servers
- **Authentication**: Token-based authentication for secure access  
- **Automatic Reconnection**: Built-in reconnection logic with callbacks
- **Connection State**: Monitor connection status and handle disconnects

### Event Types

- **Quote Events**: Bid/ask prices and sizes
- **Trade Events**: Last trade price and volume
- **Greeks Events**: Options Greeks (delta, gamma, theta, vega, rho)
- **Candle Events**: OHLCV candlestick data
- **Order Events**: Depth of market data

### Feed Configuration

- **Event Filtering**: Subscribe to specific event types
- **Field Selection**: Choose which fields to receive
- **Aggregation**: Configure time-based aggregation periods
- **Data Format**: Choose between FULL and COMPACT formats

## Core APIs

### Client Initialization

```typescript
import { DXLinkWebSocketClient } from '@dxfeed/dxlink-api'

const client = new DXLinkWebSocketClient()
await client.connect('wss://demo.dxfeed.com/dxlink-ws')

// For authenticated connections
client.setAuthToken('your-auth-token')
```

### Feed Setup

```typescript
import { DXLinkFeed, FeedDataFormat } from '@dxfeed/dxlink-api'

const feed = new DXLinkFeed(client, 'AUTO')

// Configure feed options
feed.configure({
  acceptAggregationPeriod: 10,
  acceptDataFormat: FeedDataFormat.COMPACT,
  acceptEventFields: {
    Quote: ['eventSymbol', 'askPrice', 'bidPrice', 'askSize', 'bidSize'],
    Trade: ['eventSymbol', 'price', 'size', 'time']
  }
})
```

### Event Subscriptions

```typescript
// Subscribe to quotes
feed.addSubscriptions({
  type: 'Quote',
  symbol: 'AAPL'
})

// Subscribe to multiple symbols
feed.addSubscriptions([
  { type: 'Quote', symbol: 'AAPL' },
  { type: 'Quote', symbol: 'GOOGL' },
  { type: 'Trade', symbol: 'AAPL' }
])

// Remove subscriptions
feed.removeSubscriptions({
  type: 'Quote',
  symbol: 'AAPL'
})
```

### Event Listening

```typescript
// Listen for all events
feed.addEventListener((events) => {
  events.forEach(event => {
    console.log(`${event.eventSymbol}: ${event.type}`, event)
  })
})

// Type-specific event handling
feed.addEventListener((events) => {
  events.forEach(event => {
    switch (event.type) {
      case 'Quote':
        handleQuote(event)
        break
      case 'Trade':
        handleTrade(event)
        break
      case 'Greeks':
        handleGreeks(event)
        break
    }
  })
})
```

### Depth of Market (DOM)

```typescript
import { DXLinkDepthOfMarket } from '@dxfeed/dxlink-api'

const dom = new DXLinkDepthOfMarket(client, { 
  symbol: 'AAPL',
  sources: ['ntv'] 
})

dom.configure({
  acceptAggregationPeriod: 10,
  acceptDepthLimit: 10
})

dom.addSnapshotListener((snapshot) => {
  console.log('DOM Snapshot:', snapshot)
})

dom.addEventListener((events) => {
  console.log('DOM Events:', events)
})

await dom.open()
```

## Integration Patterns

### Bun/Node.js Compatibility

```typescript
// For Node.js
const WebSocket = require('isomorphic-ws')
global.WebSocket = WebSocket

// For Bun (WebSocket is built-in)
// No additional setup required
```

### TypeScript Integration

```typescript
import type { 
  QuoteEvent, 
  TradeEvent, 
  GreeksEvent,
  CandleEvent 
} from '@dxfeed/dxlink-api'

interface MarketDataHandler {
  onQuote(quote: QuoteEvent): void
  onTrade(trade: TradeEvent): void
  onGreeks(greeks: GreeksEvent): void
}
```

### Error Handling and Reconnection

```typescript
const client = new DXLinkWebSocketClient()

// Handle disconnection
client.addDisconnectListener(() => {
  console.log('Connection lost, attempting reconnection...')
})

// Handle reconnection
client.addReconnectListener(() => {
  console.log('Reconnected successfully')
  // Re-subscribe to feeds
  resubscribeToFeeds()
})

// Connection with error handling
try {
  await client.connect('wss://demo.dxfeed.com/dxlink-ws')
} catch (error) {
  console.error('Connection failed:', error)
}
```

## Advanced Features

### Candle Data Streaming

```typescript
import { DXLinkCandles } from '@dxfeed/dxlink-api'

const candles = new DXLinkCandles(client, {
  symbol: 'AAPL',
  aggregationPeriod: '1m'  // 1-minute candles
})

candles.configure({
  acceptAggregationPeriod: 5,
  acceptDataFormat: FeedDataFormat.COMPACT
})

candles.addEventListener((events) => {
  events.forEach(candle => {
    console.log(`${candle.eventSymbol}: O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close} V:${candle.volume}`)
  })
})
```

### Options Greeks Streaming

```typescript
// Subscribe to options Greeks
feed.addSubscriptions({
  type: 'Greeks',
  symbol: 'AAPL240119C00180000'  // AAPL Jan 19, 2024 $180 Call
})

feed.addEventListener((events) => {
  events.forEach(event => {
    if (event.type === 'Greeks') {
      const greeks = event as GreeksEvent
      console.log(`Greeks for ${greeks.eventSymbol}:`, {
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.theta,
        vega: greeks.vega,
        rho: greeks.rho,
        price: greeks.price,
        volatility: greeks.volatility
      })
    }
  })
})
```

### Multi-Feed Management

```typescript
class MarketDataManager {
  private client: DXLinkWebSocketClient
  private feeds: Map<string, DXLinkFeed> = new Map()

  constructor() {
    this.client = new DXLinkWebSocketClient()
  }

  async connect(url: string, token?: string) {
    await this.client.connect(url)
    if (token) {
      this.client.setAuthToken(token)
    }
  }

  createFeed(feedId: string) {
    const feed = new DXLinkFeed(this.client, feedId)
    this.feeds.set(feedId, feed)
    return feed
  }

  getFeed(feedId: string) {
    return this.feeds.get(feedId)
  }

  async closeFeed(feedId: string) {
    const feed = this.feeds.get(feedId)
    if (feed) {
      await feed.close()
      this.feeds.delete(feedId)
    }
  }
}
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/dxfeed/`:

- WebSocket connection management
- Real-time quote and trade streaming
- Options Greeks calculations
- Candle data aggregation
- Depth of market integration
- Multi-symbol subscriptions
- Error handling and reconnection
- Performance optimization patterns

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/dxfeed/schemas/`:

- Event type definitions
- WebSocket message schemas
- API response interfaces
- Configuration objects

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/dxfeed/linting/`:

- TypeScript strict configurations
- ESLint rules for financial data
- Prettier formatting standards

## Performance Considerations

### Connection Optimization

```typescript
// Use connection pooling for multiple feeds
const connectionPool = new Map<string, DXLinkWebSocketClient>()

function getConnection(url: string) {
  if (!connectionPool.has(url)) {
    const client = new DXLinkWebSocketClient()
    connectionPool.set(url, client)
  }
  return connectionPool.get(url)!
}
```

### Data Throttling

```typescript
// Implement data throttling for high-frequency updates
class ThrottledDataHandler {
  private lastUpdate: number = 0
  private throttleMs: number = 100

  handleEvent(event: any) {
    const now = Date.now()
    if (now - this.lastUpdate >= this.throttleMs) {
      this.processEvent(event)
      this.lastUpdate = now
    }
  }

  private processEvent(event: any) {
    // Process the event
  }
}
```

### Memory Management

```typescript
// Clean up subscriptions to prevent memory leaks
class SubscriptionManager {
  private subscriptions: Set<any> = new Set()

  addSubscription(feed: DXLinkFeed, subscription: any) {
    feed.addSubscriptions(subscription)
    this.subscriptions.add({ feed, subscription })
  }

  cleanup() {
    this.subscriptions.forEach(({ feed, subscription }) => {
      feed.removeSubscriptions(subscription)
    })
    this.subscriptions.clear()
  }
}
```

## Common Integration Patterns

### Tastytrade Integration

```typescript
// Use with Tastytrade for market data
import TastytradeClient from '@tastytrade/api'

const tastyClient = new TastytradeClient(config)
const tokenResponse = await tastyClient.apiQuoteTokensService.getQuoteToken()

const dxClient = new DXLinkWebSocketClient()
await dxClient.connect('wss://tasty-openapi-ws.dxfeed.com/realtime')
dxClient.setAuthToken(tokenResponse.token)
```

### Real-time Portfolio Tracking

```typescript
class PortfolioTracker {
  private feed: DXLinkFeed
  private positions: Map<string, any> = new Map()

  constructor(client: DXLinkWebSocketClient) {
    this.feed = new DXLinkFeed(client, 'portfolio')
  }

  trackPosition(symbol: string, quantity: number) {
    this.positions.set(symbol, { quantity, lastPrice: 0 })
    
    this.feed.addSubscriptions({
      type: 'Quote',
      symbol: symbol
    })
  }

  private updatePortfolioValue(quote: QuoteEvent) {
    const position = this.positions.get(quote.eventSymbol)
    if (position) {
      const midPrice = (quote.askPrice + quote.bidPrice) / 2
      position.lastPrice = midPrice
      position.marketValue = position.quantity * midPrice
    }
  }
}
```

## See Also

- Complete reference: `@$HOME/.claude/references/dxfeed.md`
- Code examples: `@$HOME/.claude/snippets/dxfeed/`
- Schemas: `@$HOME/.claude/snippets/dxfeed/schemas/`
- Linting configs: `@$HOME/.claude/snippets/dxfeed/linting/`
- Related: Tastytrade integration at `@$HOME/.claude/references/tastytrade.md`
