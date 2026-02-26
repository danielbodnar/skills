/**
 * DxFeed Market Data Streaming Examples
 * Real-time market data processing, filtering, and analysis patterns
 */

import { DXLinkWebSocketClient, DXLinkFeed, FeedDataFormat } from '@dxfeed/dxlink-api'
import type { QuoteEvent, TradeEvent, CandleEvent, GreeksEvent } from '@dxfeed/dxlink-api'

/**
 * Market data processor with real-time calculations
 */
export class MarketDataProcessor {
  private client: DXLinkWebSocketClient | null = null
  private feeds: Map<string, DXLinkFeed> = new Map()
  private priceData: Map<string, {
    lastPrice: number
    lastQuote: QuoteEvent | null
    lastTrade: TradeEvent | null
    volume: number
    high: number
    low: number
    open: number
    trades: TradeEvent[]
    quotes: QuoteEvent[]
  }> = new Map()
  
  private updateCallbacks: Map<string, Function[]> = new Map()

  /**
   * Initialize connection and setup feeds
   */
  async initialize(endpoint: string, token?: string): Promise<void> {
    try {
      this.client = new DXLinkWebSocketClient()
      await this.client.connect(endpoint)
      
      if (token) {
        this.client.setAuthToken(token)
      }
      
      console.log('Market data processor initialized')
    } catch (error) {
      console.error('Failed to initialize market data processor:', error)
      throw error
    }
  }

  /**
   * Create a streaming feed for quotes and trades
   */
  createStreamingFeed(feedId: string, symbols: string[]): void {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    const feed = new DXLinkFeed(this.client, feedId)
    
    // Configure for optimal streaming
    feed.configure({
      acceptAggregationPeriod: 5, // 5ms aggregation
      acceptDataFormat: FeedDataFormat.COMPACT,
      acceptEventFields: {
        Quote: [
          'eventSymbol', 'askPrice', 'bidPrice', 'askSize', 'bidSize', 
          'askTime', 'bidTime', 'askExchangeCode', 'bidExchangeCode'
        ],
        Trade: [
          'eventSymbol', 'price', 'size', 'time', 'exchangeCode', 
          'condition', 'dayVolume', 'dayTurnover'
        ]
      }
    })

    // Initialize symbol data
    symbols.forEach(symbol => {
      this.priceData.set(symbol, {
        lastPrice: 0,
        lastQuote: null,
        lastTrade: null,
        volume: 0,
        high: 0,
        low: Number.MAX_VALUE,
        open: 0,
        trades: [],
        quotes: []
      })
    })

    // Subscribe to quotes and trades
    const subscriptions = []
    symbols.forEach(symbol => {
      subscriptions.push(
        { type: 'Quote', symbol },
        { type: 'Trade', symbol }
      )
    })

    feed.addSubscriptions(subscriptions)

    // Setup event processing
    feed.addEventListener((events) => {
      this.processMarketEvents(events)
    })

    this.feeds.set(feedId, feed)
    console.log(`Created streaming feed ${feedId} for ${symbols.length} symbols`)
  }

  /**
   * Process incoming market events
   */
  private processMarketEvents(events: any[]): void {
    const processedData: Map<string, any> = new Map()

    for (const event of events) {
      const symbol = event.eventSymbol
      const symbolData = this.priceData.get(symbol)
      
      if (!symbolData) continue

      switch (event.eventType) {
        case 'Quote':
          this.processQuoteEvent(event as QuoteEvent, symbolData)
          break
          
        case 'Trade':
          this.processTradeEvent(event as TradeEvent, symbolData)
          break
      }

      // Collect processed data
      processedData.set(symbol, {
        symbol,
        ...symbolData,
        timestamp: Date.now()
      })
    }

    // Notify subscribers
    this.notifySubscribers(processedData)
  }

  /**
   * Process quote events with spread calculations
   */
  private processQuoteEvent(quote: QuoteEvent, symbolData: any): void {
    symbolData.lastQuote = quote
    
    // Keep recent quotes for analysis
    symbolData.quotes.push(quote)
    if (symbolData.quotes.length > 100) {
      symbolData.quotes.shift()
    }

    // Calculate bid-ask spread
    const spread = quote.askPrice - quote.bidPrice
    const midPrice = (quote.askPrice + quote.bidPrice) / 2
    const spreadBps = midPrice > 0 ? (spread / midPrice) * 10000 : 0

    // Add calculated fields
    quote.midPrice = midPrice
    quote.spread = spread
    quote.spreadBps = spreadBps
    quote.bidAskRatio = quote.askSize > 0 ? quote.bidSize / quote.askSize : 0

    console.log(`QUOTE ${quote.eventSymbol}: Mid=${midPrice.toFixed(4)}, Spread=${spreadBps.toFixed(2)}bps`)
  }

  /**
   * Process trade events with VWAP and volume analysis
   */
  private processTradeEvent(trade: TradeEvent, symbolData: any): void {
    symbolData.lastTrade = trade
    symbolData.lastPrice = trade.price
    symbolData.volume += trade.size

    // Update OHLC
    if (symbolData.open === 0) symbolData.open = trade.price
    symbolData.high = Math.max(symbolData.high, trade.price)
    symbolData.low = Math.min(symbolData.low, trade.price)

    // Keep recent trades for VWAP calculation
    symbolData.trades.push(trade)
    if (symbolData.trades.length > 500) {
      symbolData.trades.shift()
    }

    // Calculate VWAP
    const vwap = this.calculateVWAP(symbolData.trades)
    trade.vwap = vwap

    // Calculate price change
    if (symbolData.open > 0) {
      trade.priceChange = trade.price - symbolData.open
      trade.priceChangePercent = (trade.priceChange / symbolData.open) * 100
    }

    console.log(`TRADE ${trade.eventSymbol}: Price=${trade.price}, Size=${trade.size}, VWAP=${vwap?.toFixed(4)}`)
  }

  /**
   * Calculate Volume Weighted Average Price
   */
  private calculateVWAP(trades: TradeEvent[]): number {
    if (trades.length === 0) return 0

    let totalValue = 0
    let totalVolume = 0

    for (const trade of trades) {
      totalValue += trade.price * trade.size
      totalVolume += trade.size
    }

    return totalVolume > 0 ? totalValue / totalVolume : 0
  }

  /**
   * Subscribe to real-time updates for specific symbols
   */
  onSymbolUpdate(symbols: string[], callback: (data: Map<string, any>) => void): void {
    symbols.forEach(symbol => {
      if (!this.updateCallbacks.has(symbol)) {
        this.updateCallbacks.set(symbol, [])
      }
      this.updateCallbacks.get(symbol)!.push(callback)
    })
  }

  /**
   * Notify all subscribers of updates
   */
  private notifySubscribers(processedData: Map<string, any>): void {
    for (const [symbol, data] of processedData) {
      const callbacks = this.updateCallbacks.get(symbol)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(new Map([[symbol, data]]))
          } catch (error) {
            console.error(`Error in callback for ${symbol}:`, error)
          }
        })
      }
    }
  }

  /**
   * Get current market data snapshot
   */
  getSnapshot(symbols?: string[]): Map<string, any> {
    const result = new Map()
    const targetSymbols = symbols || Array.from(this.priceData.keys())
    
    targetSymbols.forEach(symbol => {
      const data = this.priceData.get(symbol)
      if (data) {
        result.set(symbol, { ...data, timestamp: Date.now() })
      }
    })

    return result
  }

  /**
   * Create a candlestick feed for historical analysis
   */
  createCandleFeed(feedId: string, symbols: string[], period: string = '1m'): void {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    const feed = new DXLinkFeed(this.client, feedId)
    
    feed.configure({
      acceptAggregationPeriod: 60, // 1 minute aggregation
      acceptDataFormat: FeedDataFormat.COMPACT,
      acceptEventFields: {
        Candle: [
          'eventSymbol', 'open', 'high', 'low', 'close', 'volume',
          'vwap', 'bidVolume', 'askVolume', 'time'
        ]
      }
    })

    // Subscribe to candles
    const subscriptions = symbols.map(symbol => ({
      type: 'Candle',
      symbol: `${symbol}{=${period}}`
    }))

    feed.addSubscriptions(subscriptions)

    // Process candle events
    feed.addEventListener((events) => {
      events.forEach(event => {
        if (event.eventType === 'Candle') {
          this.processCandleEvent(event as CandleEvent)
        }
      })
    })

    this.feeds.set(feedId, feed)
    console.log(`Created candle feed ${feedId} with ${period} period`)
  }

  /**
   * Process candle events with technical indicators
   */
  private processCandleEvent(candle: CandleEvent): void {
    // Calculate additional technical indicators
    const bodySize = Math.abs(candle.close - candle.open)
    const upperWick = candle.high - Math.max(candle.open, candle.close)
    const lowerWick = Math.min(candle.open, candle.close) - candle.low
    const range = candle.high - candle.low
    
    const enhancedCandle = {
      ...candle,
      bodySize,
      upperWick,
      lowerWick,
      range,
      bodyRatio: range > 0 ? bodySize / range : 0,
      upperWickRatio: range > 0 ? upperWick / range : 0,
      lowerWickRatio: range > 0 ? lowerWick / range : 0,
      isGreen: candle.close > candle.open,
      isDoji: Math.abs(candle.close - candle.open) < (range * 0.1)
    }

    console.log(`CANDLE ${candle.eventSymbol}: OHLCV=${candle.open}/${candle.high}/${candle.low}/${candle.close}/${candle.volume} (${enhancedCandle.isGreen ? 'GREEN' : 'RED'})`)
  }

  /**
   * Create options Greeks feed
   */
  createGreeksFeed(feedId: string, optionSymbols: string[]): void {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    const feed = new DXLinkFeed(this.client, feedId)
    
    feed.configure({
      acceptAggregationPeriod: 10,
      acceptDataFormat: FeedDataFormat.COMPACT,
      acceptEventFields: {
        Greeks: [
          'eventSymbol', 'price', 'volatility', 'delta', 'gamma', 
          'theta', 'rho', 'vega', 'time'
        ]
      }
    })

    // Subscribe to Greeks
    const subscriptions = optionSymbols.map(symbol => ({
      type: 'Greeks',
      symbol
    }))

    feed.addSubscriptions(subscriptions)

    // Process Greeks events
    feed.addEventListener((events) => {
      events.forEach(event => {
        if (event.eventType === 'Greeks') {
          this.processGreeksEvent(event as GreeksEvent)
        }
      })
    })

    this.feeds.set(feedId, feed)
    console.log(`Created Greeks feed ${feedId} for ${optionSymbols.length} options`)
  }

  /**
   * Process Greeks events with risk analysis
   */
  private processGreeksEvent(greeks: GreeksEvent): void {
    // Calculate additional risk metrics
    const gammaRisk = Math.abs(greeks.gamma) * 100 // Per $1 move
    const thetaDecay = Math.abs(greeks.theta) // Daily decay
    const vegaRisk = Math.abs(greeks.vega) / 100 // Per 1% vol change
    
    const riskMetrics = {
      ...greeks,
      gammaRisk,
      thetaDecay,
      vegaRisk,
      totalRisk: gammaRisk + thetaDecay + vegaRisk,
      isATM: Math.abs(greeks.delta) > 0.45 && Math.abs(greeks.delta) < 0.55
    }

    console.log(`GREEKS ${greeks.eventSymbol}: Δ=${greeks.delta?.toFixed(3)}, Γ=${greeks.gamma?.toFixed(3)}, Θ=${greeks.theta?.toFixed(3)}, Risk=${riskMetrics.totalRisk.toFixed(2)}`)
  }

  /**
   * Close all feeds and disconnect
   */
  async shutdown(): Promise<void> {
    try {
      // Close all feeds
      for (const [feedId, feed] of this.feeds) {
        await feed.close()
        console.log(`Closed feed: ${feedId}`)
      }
      this.feeds.clear()

      // Disconnect client
      if (this.client) {
        this.client.close()
        this.client = null
      }

      // Clear data
      this.priceData.clear()
      this.updateCallbacks.clear()

      console.log('Market data processor shutdown complete')
      
    } catch (error) {
      console.error('Error during shutdown:', error)
    }
  }
}

/**
 * Real-time market screener
 */
export class MarketScreener {
  private processor: MarketDataProcessor
  private screeningRules: Array<{
    name: string
    condition: (data: any) => boolean
    action: (symbol: string, data: any) => void
  }> = []

  constructor(processor: MarketDataProcessor) {
    this.processor = processor
  }

  /**
   * Add screening rule
   */
  addRule(name: string, condition: (data: any) => boolean, action: (symbol: string, data: any) => void): void {
    this.screeningRules.push({ name, condition, action })
    console.log(`Added screening rule: ${name}`)
  }

  /**
   * Start screening with symbol updates
   */
  startScreening(symbols: string[]): void {
    this.processor.onSymbolUpdate(symbols, (updates) => {
      for (const [symbol, data] of updates) {
        this.screeningRules.forEach(rule => {
          try {
            if (rule.condition(data)) {
              rule.action(symbol, data)
            }
          } catch (error) {
            console.error(`Error in screening rule ${rule.name}:`, error)
          }
        })
      }
    })

    console.log(`Started screening ${symbols.length} symbols with ${this.screeningRules.length} rules`)
  }
}

/**
 * Example: Real-time market data streaming
 */
export async function streamingExample(): Promise<void> {
  const processor = new MarketDataProcessor()
  
  try {
    // Initialize processor
    await processor.initialize('wss://demo.dxfeed.com/dxlink-ws')
    
    // Create streaming feed for major stocks
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
    processor.createStreamingFeed('main', symbols)
    
    // Subscribe to updates
    processor.onSymbolUpdate(symbols, (updates) => {
      for (const [symbol, data] of updates) {
        const quote = data.lastQuote
        const trade = data.lastTrade
        
        if (quote) {
          console.log(`📊 ${symbol}: Bid=${quote.bidPrice} Ask=${quote.askPrice} Mid=${quote.midPrice?.toFixed(4)} Spread=${quote.spreadBps?.toFixed(2)}bps`)
        }
        
        if (trade) {
          console.log(`💰 ${symbol}: Price=${trade.price} Size=${trade.size} VWAP=${trade.vwap?.toFixed(4)} Change=${trade.priceChangePercent?.toFixed(2)}%`)
        }
      }
    })

    // Create candle feed for technical analysis
    processor.createCandleFeed('candles', ['AAPL', 'TSLA'], '1m')

    // Run for 2 minutes
    console.log('Streaming market data for 2 minutes...')
    await new Promise(resolve => setTimeout(resolve, 120000))

    // Get final snapshot
    const snapshot = processor.getSnapshot()
    console.log('\nFinal snapshot:')
    for (const [symbol, data] of snapshot) {
      console.log(`${symbol}: Last=${data.lastPrice}, Vol=${data.volume}, H=${data.high}, L=${data.low}`)
    }

  } catch (error) {
    console.error('Streaming example failed:', error)
  } finally {
    await processor.shutdown()
  }
}

/**
 * Example: Market screening with real-time alerts
 */
export async function marketScreeningExample(): Promise<void> {
  const processor = new MarketDataProcessor()
  const screener = new MarketScreener(processor)
  
  try {
    await processor.initialize('wss://demo.dxfeed.com/dxlink-ws')
    
    // Create streaming feed
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']
    processor.createStreamingFeed('screening', symbols)

    // Add screening rules
    screener.addRule(
      'Large Spread Alert',
      (data) => data.lastQuote && data.lastQuote.spreadBps > 50,
      (symbol, data) => console.log(`🚨 LARGE SPREAD: ${symbol} spread is ${data.lastQuote.spreadBps.toFixed(2)}bps`)
    )

    screener.addRule(
      'High Volume Trade',
      (data) => data.lastTrade && data.lastTrade.size > 10000,
      (symbol, data) => console.log(`📈 HIGH VOLUME: ${symbol} trade size ${data.lastTrade.size}`)
    )

    screener.addRule(
      'Price Movement Alert',
      (data) => data.lastTrade && Math.abs(data.lastTrade.priceChangePercent || 0) > 1.0,
      (symbol, data) => console.log(`⚡ PRICE MOVE: ${symbol} ${data.lastTrade.priceChangePercent > 0 ? '+' : ''}${data.lastTrade.priceChangePercent.toFixed(2)}%`)
    )

    // Start screening
    screener.startScreening(symbols)

    // Run for 3 minutes
    console.log('Running market screening for 3 minutes...')
    await new Promise(resolve => setTimeout(resolve, 180000))

  } catch (error) {
    console.error('Market screening example failed:', error)
  } finally {
    await processor.shutdown()
  }
}

// Export for use in other modules
export { MarketDataProcessor, MarketScreener }