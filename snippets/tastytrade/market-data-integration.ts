/**
 * Tastytrade + DxFeed Market Data Integration
 * 
 * This file demonstrates how to integrate Tastytrade API with DxFeed for real-time market data.
 * The Tastytrade API provides quote tokens, while DxFeed handles the streaming data.
 */

import TastytradeClient from '@tastytrade/api'
import { DXLinkWebSocketClient, DXLinkFeed, FeedDataFormat } from '@dxfeed/dxlink-api'

// For Node.js compatibility
if (typeof globalThis.WebSocket === 'undefined') {
  const WebSocket = require('isomorphic-ws')
  globalThis.WebSocket = WebSocket
}

interface QuoteData {
  symbol: string
  bidPrice: number
  askPrice: number
  bidSize: number
  askSize: number
  timestamp: number
}

interface OptionQuoteData extends QuoteData {
  underlying: string
  strike: number
  expiration: string
  optionType: 'call' | 'put'
}

/**
 * Market data manager that integrates Tastytrade authentication with DxFeed streaming
 */
export class TastytradeMarketData {
  private tastytradeClient: TastytradeClient
  private dxlinkClient: DXLinkWebSocketClient | null = null
  private feed: DXLinkFeed | null = null
  private quoteToken: string | null = null
  private isConnected = false

  constructor(config: { baseUrl: string; accountStreamerUrl: string }) {
    this.tastytradeClient = new TastytradeClient(config)
  }

  /**
   * Login and obtain quote token for market data access
   */
  async initialize(username: string, password: string): Promise<void> {
    try {
      // Login to Tastytrade
      await this.tastytradeClient.sessionService.login(username, password)
      console.log('Authenticated with Tastytrade')

      // Get quote token for DxFeed access
      const tokenResponse = await this.tastytradeClient.apiQuoteTokensService.getQuoteToken()
      this.quoteToken = tokenResponse.token
      console.log('Obtained quote token for market data')

      // Initialize DxLink connection
      await this.connectToDxFeed()
    } catch (error) {
      console.error('Failed to initialize market data:', error)
      throw error
    }
  }

  /**
   * Connect to DxFeed WebSocket with Tastytrade token
   */
  private async connectToDxFeed(): Promise<void> {
    if (!this.quoteToken) {
      throw new Error('No quote token available')
    }

    try {
      this.dxlinkClient = new DXLinkWebSocketClient()
      await this.dxlinkClient.connect('wss://tasty-openapi-ws.dxfeed.com/realtime')
      
      // Authenticate with the quote token
      this.dxlinkClient.setAuthToken(this.quoteToken)
      
      // Create feed
      this.feed = new DXLinkFeed(this.dxlinkClient, 'AUTO')
      
      // Configure feed for optimal performance
      this.feed.configure({
        acceptAggregationPeriod: 10,
        acceptDataFormat: FeedDataFormat.COMPACT,
        acceptEventFields: {
          Quote: ['eventSymbol', 'askPrice', 'bidPrice', 'askSize', 'bidSize', 'askTime', 'bidTime']
        }
      })

      this.isConnected = true
      console.log('Connected to DxFeed market data')
      
    } catch (error) {
      console.error('Failed to connect to DxFeed:', error)
      throw error
    }
  }

  /**
   * Subscribe to equity quotes
   */
  async subscribeToEquities(symbols: string[]): Promise<void> {
    if (!this.feed) {
      throw new Error('Feed not initialized')
    }

    const subscriptions = symbols.map(symbol => ({
      type: 'Quote' as const,
      symbol
    }))

    await this.feed.addSubscriptions(subscriptions)
    console.log(`Subscribed to equity quotes: ${symbols.join(', ')}`)
  }

  /**
   * Subscribe to options quotes using streamer symbols
   */
  async subscribeToOptions(optionSymbols: string[]): Promise<void> {
    if (!this.feed) {
      throw new Error('Feed not initialized')
    }

    const subscriptions = optionSymbols.map(symbol => ({
      type: 'Quote' as const,
      symbol
    }))

    await this.feed.addSubscriptions(subscriptions)
    console.log(`Subscribed to option quotes: ${optionSymbols.join(', ')}`)
  }

  /**
   * Subscribe to options chain for a given underlying
   */
  async subscribeToOptionsChain(underlying: string, expiration?: Date): Promise<void> {
    try {
      // Get option chain from Tastytrade
      const optionChain = await this.tastytradeClient.instrumentsService.getOptionChain(underlying)
      
      // Extract streamer symbols for options
      const streamerSymbols: string[] = []
      
      // Process the option chain data (this depends on the exact API response structure)
      if (optionChain && Array.isArray(optionChain)) {
        optionChain.forEach((option: any) => {
          if (option['streamer-symbol']) {
            streamerSymbols.push(option['streamer-symbol'])
          }
        })
      }

      if (streamerSymbols.length > 0) {
        await this.subscribeToOptions(streamerSymbols)
        console.log(`Subscribed to ${streamerSymbols.length} options for ${underlying}`)
      } else {
        console.warn(`No options found for ${underlying}`)
      }
    } catch (error) {
      console.error(`Failed to subscribe to options chain for ${underlying}:`, error)
      throw error
    }
  }

  /**
   * Listen for quote events
   */
  onQuote(callback: (quote: QuoteData) => void): void {
    if (!this.feed) {
      throw new Error('Feed not initialized')
    }

    this.feed.addEventListener((events) => {
      events.forEach(event => {
        if (event.type === 'Quote') {
          const quote: QuoteData = {
            symbol: event.eventSymbol,
            bidPrice: event.bidPrice || 0,
            askPrice: event.askPrice || 0,
            bidSize: event.bidSize || 0,
            askSize: event.askSize || 0,
            timestamp: event.time || Date.now()
          }
          callback(quote)
        }
      })
    })
  }

  /**
   * Get current market data snapshot
   */
  async getSnapshot(symbols: string[]): Promise<QuoteData[]> {
    return new Promise((resolve, reject) => {
      if (!this.feed) {
        reject(new Error('Feed not initialized'))
        return
      }

      const quotes: Map<string, QuoteData> = new Map()
      const timeout = setTimeout(() => {
        reject(new Error('Snapshot timeout'))
      }, 5000)

      // Subscribe to symbols
      const subscriptions = symbols.map(symbol => ({
        type: 'Quote' as const,
        symbol
      }))

      this.feed.addSubscriptions(subscriptions)

      // Listen for quotes
      const listener = (events: any[]) => {
        events.forEach(event => {
          if (event.type === 'Quote' && symbols.includes(event.eventSymbol)) {
            quotes.set(event.eventSymbol, {
              symbol: event.eventSymbol,
              bidPrice: event.bidPrice || 0,
              askPrice: event.askPrice || 0,
              bidSize: event.bidSize || 0,
              askSize: event.askSize || 0,
              timestamp: event.time || Date.now()
            })

            // Check if we have all quotes
            if (quotes.size === symbols.length) {
              clearTimeout(timeout)
              this.feed?.removeEventListener(listener)
              resolve(Array.from(quotes.values()))
            }
          }
        })
      }

      this.feed.addEventListener(listener)
    })
  }

  /**
   * Calculate mid-price from bid/ask
   */
  static getMidPrice(quote: QuoteData): number {
    if (quote.bidPrice && quote.askPrice) {
      return (quote.bidPrice + quote.askPrice) / 2
    }
    return quote.bidPrice || quote.askPrice || 0
  }

  /**
   * Calculate bid-ask spread
   */
  static getSpread(quote: QuoteData): number {
    if (quote.bidPrice && quote.askPrice) {
      return quote.askPrice - quote.bidPrice
    }
    return 0
  }

  /**
   * Close connections and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      if (this.feed) {
        await this.feed.close()
        this.feed = null
      }

      if (this.dxlinkClient) {
        await this.dxlinkClient.disconnect()
        this.dxlinkClient = null
      }

      if (this.tastytradeClient) {
        await this.tastytradeClient.sessionService.logout()
      }

      this.isConnected = false
      this.quoteToken = null
      console.log('Disconnected from market data')
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }
}

/**
 * Example: Basic market data streaming
 */
export async function basicMarketDataExample() {
  const marketData = new TastytradeMarketData({
    baseUrl: process.env.TASTYTRADE_BASE_URL || 'https://api.cert.tastyworks.com',
    accountStreamerUrl: process.env.TASTYTRADE_STREAMER_URL || 'https://streamer.cert.tastyworks.com'
  })

  try {
    // Initialize with credentials
    await marketData.initialize(
      process.env.TASTYTRADE_USERNAME!,
      process.env.TASTYTRADE_PASSWORD!
    )

    // Subscribe to some popular stocks
    await marketData.subscribeToEquities(['AAPL', 'GOOGL', 'MSFT', 'TSLA'])

    // Listen for quotes
    marketData.onQuote((quote) => {
      const midPrice = TastytradeMarketData.getMidPrice(quote)
      const spread = TastytradeMarketData.getSpread(quote)
      
      console.log(`${quote.symbol}: Mid=${midPrice.toFixed(2)}, Spread=${spread.toFixed(4)}, Bid=${quote.bidPrice}x${quote.bidSize}, Ask=${quote.askPrice}x${quote.askSize}`)
    })

    // Run for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000))
    
  } catch (error) {
    console.error('Market data example failed:', error)
  } finally {
    await marketData.disconnect()
  }
}

/**
 * Example: Options market data
 */
export async function optionsMarketDataExample() {
  const marketData = new TastytradeMarketData({
    baseUrl: process.env.TASTYTRADE_BASE_URL || 'https://api.cert.tastyworks.com',
    accountStreamerUrl: process.env.TASTYTRADE_STREAMER_URL || 'https://streamer.cert.tastyworks.com'
  })

  try {
    await marketData.initialize(
      process.env.TASTYTRADE_USERNAME!,
      process.env.TASTYTRADE_PASSWORD!
    )

    // Subscribe to SPY options chain
    await marketData.subscribeToOptionsChain('SPY')

    // Also subscribe to the underlying
    await marketData.subscribeToEquities(['SPY'])

    let quoteCount = 0
    marketData.onQuote((quote) => {
      quoteCount++
      
      if (quote.symbol === 'SPY') {
        console.log(`Underlying SPY: ${TastytradeMarketData.getMidPrice(quote).toFixed(2)}`)
      } else {
        console.log(`Option ${quote.symbol}: Mid=${TastytradeMarketData.getMidPrice(quote).toFixed(2)}`)
      }

      // Stop after 50 quotes
      if (quoteCount >= 50) {
        console.log('Received 50 quotes, stopping...')
        marketData.disconnect()
      }
    })

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 60000))
    
  } catch (error) {
    console.error('Options market data example failed:', error)
  } finally {
    await marketData.disconnect()
  }
}

/**
 * Run examples if this file is executed directly
 */
if (import.meta.main) {
  console.log('Running Tastytrade + DxFeed market data examples...')
  
  await basicMarketDataExample()
  console.log('---')
  await optionsMarketDataExample()
}