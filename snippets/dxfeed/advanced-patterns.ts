/**
 * DxFeed/DxLink API - Advanced Usage Patterns
 * 
 * This file demonstrates advanced DxFeed patterns including candle data,
 * options Greeks, depth of market, and performance optimizations.
 */

import { 
  DXLinkWebSocketClient, 
  DXLinkFeed,
  DXLinkDepthOfMarket,
  FeedDataFormat 
} from '@dxfeed/dxlink-api'

// For Node.js compatibility
if (typeof globalThis.WebSocket === 'undefined') {
  const WebSocket = require('isomorphic-ws')
  globalThis.WebSocket = WebSocket
}

interface CandleConfig {
  symbol: string
  aggregationPeriod: string // e.g., '1m', '5m', '1h', '1d'
  fromTime?: number
  toTime?: number
}

interface GreeksData {
  symbol: string
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  price: number
  volatility: number
  timestamp: number
}

interface DepthOfMarketData {
  symbol: string
  bids: Array<{ price: number; size: number }>
  asks: Array<{ price: number; size: number }>
  timestamp: number
}

/**
 * Advanced DxFeed client with specialized data handling
 */
export class DxFeedAdvancedClient {
  private client: DXLinkWebSocketClient
  private feeds: Map<string, DXLinkFeed> = new Map()
  private domFeeds: Map<string, DXLinkDepthOfMarket> = new Map()
  private candleBuffers: Map<string, any[]> = new Map()

  constructor() {
    this.client = new DXLinkWebSocketClient()
  }

  async connect(url: string, token?: string): Promise<void> {
    await this.client.connect(url)
    if (token) {
      this.client.setAuthToken(token)
    }
    console.log('Connected to DxFeed with advanced client')
  }

  /**
   * Subscribe to candlestick data with historical backfill
   */
  async subscribeToCandlesWithHistory(config: CandleConfig): Promise<void> {
    const feed = new DXLinkFeed(this.client, `candles-${config.symbol}`)
    
    // Configure for candle data
    feed.configure({
      acceptAggregationPeriod: this.parseAggregationPeriod(config.aggregationPeriod),
      acceptDataFormat: FeedDataFormat.COMPACT,
      acceptEventFields: {
        Candle: [
          'eventSymbol', 
          'time', 
          'open', 
          'high', 
          'low', 
          'close', 
          'volume',
          'vwap',
          'count'
        ]
      }
    })

    // Initialize candle buffer
    this.candleBuffers.set(config.symbol, [])

    // Subscribe to candles
    const subscription = {
      type: 'Candle' as const,
      symbol: `${config.symbol}{=m}`, // Monthly candles, adjust as needed
      fromTime: config.fromTime,
      toTime: config.toTime
    }

    await feed.addSubscriptions([subscription])
    
    // Handle candle events
    feed.addEventListener((events) => {
      events.forEach(event => {
        if (event.type === 'Candle') {
          this.processCandleEvent(event)
        }
      })
    })

    this.feeds.set(`candles-${config.symbol}`, feed)
    console.log(`Subscribed to candles for ${config.symbol} with period ${config.aggregationPeriod}`)
  }

  /**
   * Subscribe to options Greeks for a list of option symbols
   */
  async subscribeToGreeks(optionSymbols: string[]): Promise<void> {
    const feed = new DXLinkFeed(this.client, 'greeks')
    
    feed.configure({
      acceptAggregationPeriod: 5,
      acceptDataFormat: FeedDataFormat.COMPACT,
      acceptEventFields: {
        Greeks: [
          'eventSymbol',
          'price',
          'volatility',
          'delta',
          'gamma',
          'theta',
          'rho',
          'vega',
          'time'
        ]
      }
    })

    const subscriptions = optionSymbols.map(symbol => ({
      type: 'Greeks' as const,
      symbol
    }))

    await feed.addSubscriptions(subscriptions)
    
    feed.addEventListener((events) => {
      events.forEach(event => {
        if (event.type === 'Greeks') {
          this.processGreeksEvent(event)
        }
      })
    })

    this.feeds.set('greeks', feed)
    console.log(`Subscribed to Greeks for ${optionSymbols.length} options`)
  }

  /**
   * Subscribe to Level 2 market data (Depth of Market)
   */
  async subscribeToDepthOfMarket(symbol: string, sources: string[] = ['ntv']): Promise<void> {
    const dom = new DXLinkDepthOfMarket(this.client, {
      symbol,
      sources
    })

    dom.configure({
      acceptAggregationPeriod: 5,
      acceptDepthLimit: 20, // Show top 20 levels
      acceptDataFormat: FeedDataFormat.COMPACT
    })

    // Handle snapshot events (full order book)
    dom.addSnapshotListener((snapshot) => {
      this.processDepthSnapshot(symbol, snapshot)
    })

    // Handle incremental updates
    dom.addEventListener((events) => {
      this.processDepthUpdates(symbol, events)
    })

    await dom.open()
    this.domFeeds.set(symbol, dom)
    console.log(`Subscribed to Depth of Market for ${symbol}`)
  }

  /**
   * Create a multi-symbol real-time scanner
   */
  async createScanner(symbols: string[], scanCriteria: {
    minVolume?: number
    maxSpread?: number
    priceRanges?: { min: number; max: number }[]
  }): Promise<void> {
    const feed = new DXLinkFeed(this.client, 'scanner')
    
    feed.configure({
      acceptAggregationPeriod: 1,
      acceptDataFormat: FeedDataFormat.COMPACT,
      acceptEventFields: {
        Quote: ['eventSymbol', 'askPrice', 'bidPrice', 'askSize', 'bidSize'],
        Trade: ['eventSymbol', 'price', 'size', 'time']
      }
    })

    // Subscribe to both quotes and trades for all symbols
    const subscriptions = [
      ...symbols.map(symbol => ({ type: 'Quote' as const, symbol })),
      ...symbols.map(symbol => ({ type: 'Trade' as const, symbol }))
    ]

    await feed.addSubscriptions(subscriptions)
    
    const symbolData = new Map<string, any>()

    feed.addEventListener((events) => {
      events.forEach(event => {
        const symbol = event.eventSymbol
        
        if (!symbolData.has(symbol)) {
          symbolData.set(symbol, { quotes: null, trades: [] })
        }
        
        const data = symbolData.get(symbol)
        
        if (event.type === 'Quote') {
          data.quotes = event
        } else if (event.type === 'Trade') {
          data.trades.push(event)
          // Keep only recent trades
          data.trades = data.trades.slice(-100)
        }
        
        // Apply scan criteria
        if (this.passesScreenCriteria(data, scanCriteria)) {
          console.log(`Scanner alert: ${symbol} meets criteria`)
          this.handleScannerAlert(symbol, data)
        }
      })
    })

    this.feeds.set('scanner', feed)
    console.log(`Created scanner for ${symbols.length} symbols`)
  }

  /**
   * Batch subscribe to optimize connection usage
   */
  async batchSubscribe(subscriptions: Array<{
    feedId: string
    type: 'Quote' | 'Trade' | 'Greeks' | 'Candle'
    symbols: string[]
    config?: any
  }>): Promise<void> {
    const feedPromises = subscriptions.map(async sub => {
      let feed = this.feeds.get(sub.feedId)
      
      if (!feed) {
        feed = new DXLinkFeed(this.client, sub.feedId)
        
        if (sub.config) {
          feed.configure(sub.config)
        }
        
        this.feeds.set(sub.feedId, feed)
      }

      const subs = sub.symbols.map(symbol => ({
        type: sub.type,
        symbol
      }))

      await feed.addSubscriptions(subs)
      console.log(`Batch subscribed ${sub.symbols.length} ${sub.type} events to feed ${sub.feedId}`)
    })

    await Promise.all(feedPromises)
  }

  /**
   * Performance monitoring and statistics
   */
  getPerformanceStats(): {
    feedCount: number
    domCount: number
    eventsPerSecond: number
    memoryUsage: any
  } {
    // This would track actual performance metrics in a real implementation
    return {
      feedCount: this.feeds.size,
      domCount: this.domFeeds.size,
      eventsPerSecond: 0, // Would calculate from event tracking
      memoryUsage: process.memoryUsage()
    }
  }

  /**
   * Process individual candle events
   */
  private processCandleEvent(event: any): void {
    const buffer = this.candleBuffers.get(event.eventSymbol) || []
    buffer.push({
      symbol: event.eventSymbol,
      time: event.time,
      open: event.open,
      high: event.high,
      low: event.low,
      close: event.close,
      volume: event.volume,
      vwap: event.vwap
    })

    // Keep only last 1000 candles in memory
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000)
    }

    this.candleBuffers.set(event.eventSymbol, buffer)
    
    console.log(`Candle ${event.eventSymbol}: O:${event.open} H:${event.high} L:${event.low} C:${event.close} V:${event.volume}`)
  }

  /**
   * Process Greeks events
   */
  private processGreeksEvent(event: any): void {
    const greeksData: GreeksData = {
      symbol: event.eventSymbol,
      delta: event.delta,
      gamma: event.gamma,
      theta: event.theta,
      vega: event.vega,
      rho: event.rho,
      price: event.price,
      volatility: event.volatility,
      timestamp: event.time || Date.now()
    }

    console.log(`Greeks ${greeksData.symbol}: Δ=${greeksData.delta.toFixed(3)} Γ=${greeksData.gamma.toFixed(3)} Θ=${greeksData.theta.toFixed(3)}`)
    
    // You would typically emit this to subscribers or store in a database
    this.handleGreeksUpdate(greeksData)
  }

  /**
   * Process depth of market snapshot
   */
  private processDepthSnapshot(symbol: string, snapshot: any): void {
    const domData: DepthOfMarketData = {
      symbol,
      bids: snapshot.bids || [],
      asks: snapshot.asks || [],
      timestamp: Date.now()
    }

    console.log(`DOM Snapshot ${symbol}: ${domData.bids.length} bids, ${domData.asks.length} asks`)
    this.handleDepthUpdate(domData)
  }

  /**
   * Process depth of market incremental updates
   */
  private processDepthUpdates(symbol: string, events: any[]): void {
    events.forEach(event => {
      console.log(`DOM Update ${symbol}: ${event.type} @ ${event.price} size ${event.size}`)
    })
  }

  /**
   * Check if data passes scanner criteria
   */
  private passesScreenCriteria(data: any, criteria: any): boolean {
    if (!data.quotes) return false

    const quote = data.quotes
    const spread = quote.askPrice - quote.bidPrice

    // Check spread criteria
    if (criteria.maxSpread && spread > criteria.maxSpread) {
      return false
    }

    // Check volume criteria from recent trades
    if (criteria.minVolume) {
      const recentVolume = data.trades
        .filter((t: any) => Date.now() - t.time < 300000) // Last 5 minutes
        .reduce((sum: number, t: any) => sum + (t.size || 0), 0)
      
      if (recentVolume < criteria.minVolume) {
        return false
      }
    }

    return true
  }

  /**
   * Parse aggregation period string to milliseconds
   */
  private parseAggregationPeriod(period: string): number {
    const match = period.match(/^(\d+)([smhd])$/)
    if (!match) return 60000 // Default 1 minute

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 60000
    }
  }

  /**
   * Event handlers (to be implemented by users)
   */
  private handleGreeksUpdate(greeks: GreeksData): void {
    // Override this method to handle Greeks updates
  }

  private handleDepthUpdate(dom: DepthOfMarketData): void {
    // Override this method to handle DOM updates
  }

  private handleScannerAlert(symbol: string, data: any): void {
    // Override this method to handle scanner alerts
  }

  /**
   * Get historical candles from buffer
   */
  getHistoricalCandles(symbol: string, count?: number): any[] {
    const buffer = this.candleBuffers.get(symbol) || []
    return count ? buffer.slice(-count) : buffer
  }

  /**
   * Calculate technical indicators from candle data
   */
  calculateSMA(symbol: string, period: number): number | null {
    const candles = this.getHistoricalCandles(symbol, period)
    if (candles.length < period) return null

    const sum = candles.reduce((acc, candle) => acc + candle.close, 0)
    return sum / period
  }

  /**
   * Close all connections and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      // Close all feeds
      for (const [feedId, feed] of this.feeds) {
        await feed.close()
      }
      this.feeds.clear()

      // Close all DOM feeds
      for (const [symbol, dom] of this.domFeeds) {
        await dom.close()
      }
      this.domFeeds.clear()

      // Clear buffers
      this.candleBuffers.clear()

      // Disconnect client
      await this.client.disconnect()
      console.log('Advanced DxFeed client disconnected')
    } catch (error) {
      console.error('Error during advanced client disconnect:', error)
    }
  }
}

/**
 * Example: Candle data analysis
 */
export async function candleAnalysisExample(): Promise<void> {
  const client = new DxFeedAdvancedClient()

  try {
    await client.connect('wss://demo.dxfeed.com/dxlink-ws')

    // Subscribe to 1-minute candles for AAPL
    await client.subscribeToCandlesWithHistory({
      symbol: 'AAPL',
      aggregationPeriod: '1m',
      fromTime: Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    })

    // Let it collect some data
    await new Promise(resolve => setTimeout(resolve, 10000))

    // Analyze the data
    const candles = client.getHistoricalCandles('AAPL')
    console.log(`Collected ${candles.length} candles for AAPL`)

    if (candles.length > 20) {
      const sma20 = client.calculateSMA('AAPL', 20)
      console.log(`AAPL 20-period SMA: ${sma20?.toFixed(2)}`)
    }

  } catch (error) {
    console.error('Candle analysis example failed:', error)
  } finally {
    await client.disconnect()
  }
}

/**
 * Example: Options Greeks monitoring
 */
export async function greeksMonitoringExample(): Promise<void> {
  const client = new DxFeedAdvancedClient()

  try {
    await client.connect('wss://demo.dxfeed.com/dxlink-ws')

    // Example option symbols (these would need to be real symbols)
    const optionSymbols = [
      'AAPL240119C00180000', // AAPL Jan 19, 2024 $180 Call
      'AAPL240119P00180000'  // AAPL Jan 19, 2024 $180 Put
    ]

    await client.subscribeToGreeks(optionSymbols)

    // Monitor for 30 seconds
    console.log('Monitoring options Greeks for 30 seconds...')
    await new Promise(resolve => setTimeout(resolve, 30000))

  } catch (error) {
    console.error('Greeks monitoring example failed:', error)
  } finally {
    await client.disconnect()
  }
}

/**
 * Example: Multi-symbol scanner
 */
export async function scannerExample(): Promise<void> {
  const client = new DxFeedAdvancedClient()

  try {
    await client.connect('wss://demo.dxfeed.com/dxlink-ws')

    const watchlist = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'INTC']
    
    await client.createScanner(watchlist, {
      maxSpread: 0.50,   // Max 50 cent spread
      minVolume: 1000    // Min 1000 shares in last 5 minutes
    })

    console.log('Running scanner for 60 seconds...')
    await new Promise(resolve => setTimeout(resolve, 60000))

    const stats = client.getPerformanceStats()
    console.log('Performance stats:', stats)

  } catch (error) {
    console.error('Scanner example failed:', error)
  } finally {
    await client.disconnect()
  }
}

/**
 * Run examples if this file is executed directly
 */
if (import.meta.main) {
  console.log('Running DxFeed advanced pattern examples...')
  
  await candleAnalysisExample()
  console.log('---')
  await greeksMonitoringExample()
  console.log('---')
  await scannerExample()
}