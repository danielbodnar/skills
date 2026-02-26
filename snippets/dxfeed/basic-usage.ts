/**
 * DxFeed/DxLink API - Basic Usage Examples
 * 
 * This file demonstrates fundamental patterns for using DxFeed's dxLink API
 * including WebSocket connections, feed management, and basic subscriptions.
 */

import { 
  DXLinkWebSocketClient, 
  DXLinkFeed, 
  FeedDataFormat 
} from '@dxfeed/dxlink-api'

// For Node.js compatibility
if (typeof globalThis.WebSocket === 'undefined') {
  const WebSocket = require('isomorphic-ws')
  globalThis.WebSocket = WebSocket
}

interface ConnectionConfig {
  url: string
  token?: string
  reconnectOnFailure?: boolean
}

interface FeedConfig {
  feedId: string
  aggregationPeriod?: number
  dataFormat?: FeedDataFormat
  eventFields?: Record<string, string[]>
}

/**
 * Basic DxFeed client wrapper with connection management
 */
export class DxFeedBasicClient {
  private client: DXLinkWebSocketClient | null = null
  private feeds: Map<string, DXLinkFeed> = new Map()
  private isConnected = false
  private connectionConfig: ConnectionConfig | null = null

  /**
   * Connect to DxFeed WebSocket server
   */
  async connect(config: ConnectionConfig): Promise<void> {
    try {
      this.connectionConfig = config
      this.client = new DXLinkWebSocketClient()
      
      console.log(`Connecting to ${config.url}...`)
      await this.client.connect(config.url)
      
      // Set authentication token if provided
      if (config.token) {
        this.client.setAuthToken(config.token)
        console.log('Authentication token set')
      }
      
      this.isConnected = true
      console.log('Connected to DxFeed successfully')
      
      // Setup reconnection handling if enabled
      if (config.reconnectOnFailure) {
        this.setupReconnectionHandling()
      }
      
    } catch (error) {
      console.error('Failed to connect to DxFeed:', error)
      this.isConnected = false
      throw error
    }
  }

  /**
   * Setup automatic reconnection handling
   */
  private setupReconnectionHandling(): void {
    if (!this.client || !this.connectionConfig) return

    // Handle disconnection
    this.client.addDisconnectListener(() => {
      console.warn('DxFeed connection lost')
      this.isConnected = false
    })

    // Handle reconnection
    this.client.addReconnectListener(() => {
      console.log('DxFeed reconnected successfully')
      this.isConnected = true
      
      // Re-authenticate if token was provided
      if (this.connectionConfig?.token) {
        this.client?.setAuthToken(this.connectionConfig.token)
      }
      
      // Resubscribe to all feeds
      this.resubscribeFeeds()
    })
  }

  /**
   * Resubscribe to all feeds after reconnection
   */
  private async resubscribeFeeds(): Promise<void> {
    console.log(`Resubscribing to ${this.feeds.size} feeds...`)
    
    for (const [feedId, feed] of this.feeds) {
      try {
        // Note: In a real implementation, you would store subscription details
        // and reapply them here
        console.log(`Resubscribed to feed: ${feedId}`)
      } catch (error) {
        console.error(`Failed to resubscribe to feed ${feedId}:`, error)
      }
    }
  }

  /**
   * Create a new feed with configuration
   */
  createFeed(config: FeedConfig): DXLinkFeed {
    if (!this.client) {
      throw new Error('Not connected to DxFeed')
    }

    const feed = new DXLinkFeed(this.client, config.feedId)
    
    // Configure the feed
    const feedConfiguration: any = {}
    
    if (config.aggregationPeriod) {
      feedConfiguration.acceptAggregationPeriod = config.aggregationPeriod
    }
    
    if (config.dataFormat) {
      feedConfiguration.acceptDataFormat = config.dataFormat
    }
    
    if (config.eventFields) {
      feedConfiguration.acceptEventFields = config.eventFields
    }

    if (Object.keys(feedConfiguration).length > 0) {
      feed.configure(feedConfiguration)
      console.log(`Configured feed ${config.feedId}:`, feedConfiguration)
    }

    this.feeds.set(config.feedId, feed)
    return feed
  }

  /**
   * Get an existing feed by ID
   */
  getFeed(feedId: string): DXLinkFeed | undefined {
    return this.feeds.get(feedId)
  }

  /**
   * Subscribe to quotes for symbols
   */
  async subscribeToQuotes(feedId: string, symbols: string[]): Promise<void> {
    const feed = this.getFeed(feedId)
    if (!feed) {
      throw new Error(`Feed ${feedId} not found`)
    }

    const subscriptions = symbols.map(symbol => ({
      type: 'Quote' as const,
      symbol
    }))

    await feed.addSubscriptions(subscriptions)
    console.log(`Subscribed to quotes for ${symbols.length} symbols on feed ${feedId}`)
  }

  /**
   * Subscribe to trades for symbols
   */
  async subscribeToTrades(feedId: string, symbols: string[]): Promise<void> {
    const feed = this.getFeed(feedId)
    if (!feed) {
      throw new Error(`Feed ${feedId} not found`)
    }

    const subscriptions = symbols.map(symbol => ({
      type: 'Trade' as const,
      symbol
    }))

    await feed.addSubscriptions(subscriptions)
    console.log(`Subscribed to trades for ${symbols.length} symbols on feed ${feedId}`)
  }

  /**
   * Add event listener to a feed
   */
  onFeedEvents(feedId: string, callback: (events: any[]) => void): void {
    const feed = this.getFeed(feedId)
    if (!feed) {
      throw new Error(`Feed ${feedId} not found`)
    }

    feed.addEventListener(callback)
  }

  /**
   * Remove subscriptions
   */
  async unsubscribe(feedId: string, subscriptions: Array<{type: string, symbol: string}>): Promise<void> {
    const feed = this.getFeed(feedId)
    if (!feed) {
      throw new Error(`Feed ${feedId} not found`)
    }

    await feed.removeSubscriptions(subscriptions)
    console.log(`Removed ${subscriptions.length} subscriptions from feed ${feedId}`)
  }

  /**
   * Close a specific feed
   */
  async closeFeed(feedId: string): Promise<void> {
    const feed = this.feeds.get(feedId)
    if (feed) {
      await feed.close()
      this.feeds.delete(feedId)
      console.log(`Closed feed: ${feedId}`)
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Get connection statistics
   */
  getStats(): { connected: boolean; feedCount: number } {
    return {
      connected: this.isConnected,
      feedCount: this.feeds.size
    }
  }

  /**
   * Disconnect and cleanup all resources
   */
  async disconnect(): Promise<void> {
    try {
      // Close all feeds
      for (const [feedId, feed] of this.feeds) {
        await feed.close()
        console.log(`Closed feed: ${feedId}`)
      }
      this.feeds.clear()

      // Disconnect client
      if (this.client) {
        await this.client.disconnect()
        this.client = null
      }

      this.isConnected = false
      this.connectionConfig = null
      console.log('Disconnected from DxFeed')
      
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }
}

/**
 * Example: Basic connection and quote subscription
 */
export async function basicConnectionExample(): Promise<void> {
  const client = new DxFeedBasicClient()

  try {
    // Connect to demo server
    await client.connect({
      url: 'wss://demo.dxfeed.com/dxlink-ws',
      reconnectOnFailure: true
    })

    // Create a feed for equity quotes
    const equityFeed = client.createFeed({
      feedId: 'equity-quotes',
      aggregationPeriod: 10,
      dataFormat: FeedDataFormat.COMPACT,
      eventFields: {
        Quote: ['eventSymbol', 'askPrice', 'bidPrice', 'askSize', 'bidSize', 'askTime', 'bidTime']
      }
    })

    // Subscribe to popular stocks
    await client.subscribeToQuotes('equity-quotes', ['AAPL', 'GOOGL', 'MSFT', 'TSLA'])

    // Listen for quote events
    client.onFeedEvents('equity-quotes', (events) => {
      events.forEach(event => {
        if (event.type === 'Quote') {
          const midPrice = (event.askPrice + event.bidPrice) / 2
          const spread = event.askPrice - event.bidPrice
          console.log(`${event.eventSymbol}: Mid=${midPrice.toFixed(2)}, Spread=${spread.toFixed(4)}`)
        }
      })
    })

    // Run for 30 seconds
    console.log('Listening for quotes for 30 seconds...')
    await new Promise(resolve => setTimeout(resolve, 30000))

  } catch (error) {
    console.error('Basic connection example failed:', error)
  } finally {
    await client.disconnect()
  }
}

/**
 * Example: Multiple feeds for different data types
 */
export async function multipleFeedsExample(): Promise<void> {
  const client = new DxFeedBasicClient()

  try {
    await client.connect({
      url: 'wss://demo.dxfeed.com/dxlink-ws',
      reconnectOnFailure: true
    })

    // Create separate feeds for quotes and trades
    const quoteFeed = client.createFeed({
      feedId: 'quotes',
      dataFormat: FeedDataFormat.COMPACT,
      eventFields: {
        Quote: ['eventSymbol', 'askPrice', 'bidPrice']
      }
    })

    const tradeFeed = client.createFeed({
      feedId: 'trades',
      dataFormat: FeedDataFormat.COMPACT,
      eventFields: {
        Trade: ['eventSymbol', 'price', 'size', 'time']
      }
    })

    // Subscribe to different symbols on different feeds
    await client.subscribeToQuotes('quotes', ['AAPL', 'GOOGL'])
    await client.subscribeToTrades('trades', ['MSFT', 'TSLA'])

    // Handle quote events
    client.onFeedEvents('quotes', (events) => {
      events.forEach(event => {
        if (event.type === 'Quote') {
          console.log(`QUOTE ${event.eventSymbol}: ${event.bidPrice} x ${event.askPrice}`)
        }
      })
    })

    // Handle trade events
    client.onFeedEvents('trades', (events) => {
      events.forEach(event => {
        if (event.type === 'Trade') {
          console.log(`TRADE ${event.eventSymbol}: ${event.price} (${event.size} shares)`)
        }
      })
    })

    // Run for 30 seconds
    console.log('Listening to multiple feeds for 30 seconds...')
    await new Promise(resolve => setTimeout(resolve, 30000))

  } catch (error) {
    console.error('Multiple feeds example failed:', error)
  } finally {
    await client.disconnect()
  }
}

/**
 * Example: Dynamic subscription management
 */
export async function dynamicSubscriptionExample(): Promise<void> {
  const client = new DxFeedBasicClient()

  try {
    await client.connect({
      url: 'wss://demo.dxfeed.com/dxlink-ws'
    })

    const feed = client.createFeed({
      feedId: 'dynamic',
      dataFormat: FeedDataFormat.COMPACT
    })

    let eventCount = 0
    const symbolQueue = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
    let currentSymbolIndex = 0

    client.onFeedEvents('dynamic', (events) => {
      events.forEach(event => {
        eventCount++
        console.log(`Event ${eventCount}: ${event.eventSymbol} - ${event.type}`)
        
        // Change subscriptions every 10 events
        if (eventCount % 10 === 0) {
          changSubscription()
        }
      })
    })

    const changSubscription = async () => {
      const oldSymbol = symbolQueue[currentSymbolIndex]
      currentSymbolIndex = (currentSymbolIndex + 1) % symbolQueue.length
      const newSymbol = symbolQueue[currentSymbolIndex]

      console.log(`Switching from ${oldSymbol} to ${newSymbol}`)

      // Remove old subscription
      await client.unsubscribe('dynamic', [{ type: 'Quote', symbol: oldSymbol }])
      
      // Add new subscription
      await client.subscribeToQuotes('dynamic', [newSymbol])
    }

    // Start with first symbol
    await client.subscribeToQuotes('dynamic', [symbolQueue[0]])

    // Run for 60 seconds
    console.log('Running dynamic subscription example for 60 seconds...')
    await new Promise(resolve => setTimeout(resolve, 60000))

  } catch (error) {
    console.error('Dynamic subscription example failed:', error)
  } finally {
    await client.disconnect()
  }
}

/**
 * Run examples if this file is executed directly
 */
if (import.meta.main) {
  console.log('Running DxFeed basic usage examples...')
  
  await basicConnectionExample()
  console.log('---')
  await multipleFeedsExample()
  console.log('---')
  await dynamicSubscriptionExample()
}