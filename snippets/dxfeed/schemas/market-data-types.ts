/**
 * DxFeed/DxLink TypeScript Type Definitions and Schemas
 * Comprehensive type safety for market data structures
 */

// Core event types
export interface BaseEvent {
  eventType: string
  eventSymbol: string
  eventTime?: number
  eventFlags?: number
}

// Quote event with extended calculations
export interface QuoteEvent extends BaseEvent {
  eventType: 'Quote'
  sequence?: number
  timeNanoPart?: number
  bidTime?: number
  bidExchangeCode?: string
  bidPrice: number
  bidSize: number
  askTime?: number
  askExchangeCode?: string
  askPrice: number
  askSize: number
  
  // Extended calculated fields
  midPrice?: number
  spread?: number
  spreadBps?: number
  bidAskRatio?: number
  imbalance?: number
  lastUpdateTime?: number
}

// Trade event with analytics
export interface TradeEvent extends BaseEvent {
  eventType: 'Trade'
  sequence?: number
  timeNanoPart?: number
  exchangeCode?: string
  price: number
  size: number
  dayId?: number
  dayVolume?: number
  dayTurnover?: number
  tickDirection?: 'Up' | 'Down' | 'Unchanged' | 'Zero'
  condition?: string
  
  // Extended calculated fields
  vwap?: number
  priceChange?: number
  priceChangePercent?: number
  volumeRatio?: number
  isBlockTrade?: boolean
  tradeValue?: number
}

// Candle/OHLCV event
export interface CandleEvent extends BaseEvent {
  eventType: 'Candle'
  sequence?: number
  count?: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  bidVolume?: number
  askVolume?: number
  impVolatility?: number
  openInterest?: number
  
  // Extended calculated fields
  bodySize?: number
  upperWick?: number
  lowerWick?: number
  range?: number
  bodyRatio?: number
  upperWickRatio?: number
  lowerWickRatio?: number
  isGreen?: boolean
  isDoji?: boolean
  gapSize?: number
  returns?: number
}

// Options Greeks event
export interface GreeksEvent extends BaseEvent {
  eventType: 'Greeks'
  sequence?: number
  price?: number
  volatility?: number
  delta?: number
  gamma?: number
  theta?: number
  rho?: number
  vega?: number
  
  // Extended risk metrics
  gammaRisk?: number
  thetaDecay?: number
  vegaRisk?: number
  totalRisk?: number
  isATM?: boolean
  timeToExpiry?: number
  intrinsicValue?: number
  timeValue?: number
}

// Time and Sales event
export interface TimeAndSaleEvent extends BaseEvent {
  eventType: 'TimeAndSale'
  sequence?: number
  exchangeCode?: string
  price: number
  size: number
  bidPrice?: number
  askPrice?: number
  exchangeSaleCondition?: string
  tradeThroughExempt?: boolean
  aggressorSide?: 'Buy' | 'Sell' | 'Unknown'
  
  // Extended fields
  marketImpact?: number
  liquidityFlag?: 'Added' | 'Removed' | 'Neutral'
  isOddLot?: boolean
  isOpeningTrade?: boolean
  isClosingTrade?: boolean
}

// Market depth/Order book event
export interface OrderEvent extends BaseEvent {
  eventType: 'Order'
  sequence?: number
  timeNanoPart?: number
  orderId?: number
  auxOrderId?: number
  price: number
  size: number
  count?: number
  flags?: number
  tradeId?: number
  tradePrice?: number
  tradeSize?: number
  
  // Order book fields
  side?: 'Buy' | 'Sell'
  orderType?: 'Market' | 'Limit' | 'Stop' | 'StopLimit'
  timeInForce?: 'Day' | 'GTC' | 'IOC' | 'FOK'
  level?: number
  isBookEvent?: boolean
}

// Profile event for instrument information
export interface ProfileEvent extends BaseEvent {
  eventType: 'Profile'
  description?: string
  statusReason?: string
  haltStartTime?: number
  haltEndTime?: number
  highLimitPrice?: number
  lowLimitPrice?: number
  high52WeekPrice?: number
  low52WeekPrice?: number
  beta?: number
  earningsPerShare?: number
  dividendFrequency?: number
  exDividendAmount?: number
  exDividendDayId?: number
  sharesOutstanding?: number
  freeFloat?: number
  
  // Extended profile data
  sector?: string
  industry?: string
  marketCap?: number
  peRatio?: number
  dividendYield?: number
  averageVolume?: number
  institutionalOwnership?: number
}

// Summary event for daily statistics
export interface SummaryEvent extends BaseEvent {
  eventType: 'Summary'
  dayId?: number
  dayOpenPrice?: number
  dayHighPrice?: number
  dayLowPrice?: number
  dayClosePrice?: number
  dayClosePriceType?: 'Indicative' | 'Preliminary' | 'Final'
  prevDayId?: number
  prevDayClosePrice?: number
  prevDayClosePriceType?: 'Indicative' | 'Preliminary' | 'Final'
  prevDayVolume?: number
  openInterest?: number
  
  // Extended summary fields
  changeFromPrevClose?: number
  changeFromPrevClosePercent?: number
  rangePercent?: number
  volumeRatio?: number
  priceVolatility?: number
}

// Union type for all market events
export type MarketEvent = 
  | QuoteEvent 
  | TradeEvent 
  | CandleEvent 
  | GreeksEvent 
  | TimeAndSaleEvent 
  | OrderEvent 
  | ProfileEvent 
  | SummaryEvent

// Subscription types
export interface Subscription {
  type: 'Quote' | 'Trade' | 'Candle' | 'Greeks' | 'TimeAndSale' | 'Order' | 'Profile' | 'Summary'
  symbol: string
  fromTime?: number
  toTime?: number
  aggregationPeriod?: string
  source?: string
}

// Feed configuration
export interface FeedConfiguration {
  acceptAggregationPeriod?: number
  acceptDataFormat?: 'FULL' | 'COMPACT'
  acceptEventFields?: Record<string, string[]>
  acceptMessageFormat?: 'JSON' | 'BINARY'
  speed?: 'FAST' | 'NORMAL' | 'SLOW'
  bufferSize?: number
  heartbeatPeriod?: number
}

// Channel configuration
export interface ChannelConfiguration {
  contract?: string
  credentials?: string
  service?: string
  aggregationPeriod?: number
  snapshot?: boolean
  bufferSize?: number
  priority?: 'HIGH' | 'NORMAL' | 'LOW'
}

// Connection state
export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  url?: string
  connectedAt?: number
  lastHeartbeat?: number
  reconnectAttempts?: number
  error?: string
}

// Market data statistics
export interface MarketDataStats {
  symbol: string
  eventCounts: Record<string, number>
  lastUpdate: number
  avgSpread: number
  avgVolume: number
  priceRange: { high: number; low: number }
  volatility: number
  totalEvents: number
  messagesPerSecond: number
  latency: { min: number; max: number; avg: number }
}

// Depth of Market structure
export interface DepthOfMarket {
  symbol: string
  bids: Array<{ price: number; size: number; time?: number; source?: string }>
  asks: Array<{ price: number; size: number; time?: number; source?: string }>
  spread: number
  midPrice: number
  totalBidSize: number
  totalAskSize: number
  bookImbalance: number
  lastUpdate: number
}

// Options chain structure
export interface OptionsChain {
  underlyingSymbol: string
  expirationDate: string
  strikes: Array<{
    strike: number
    call?: {
      symbol: string
      lastPrice?: number
      bid?: number
      ask?: number
      volume?: number
      openInterest?: number
      impliedVol?: number
      delta?: number
      gamma?: number
      theta?: number
      vega?: number
    }
    put?: {
      symbol: string
      lastPrice?: number
      bid?: number
      ask?: number
      volume?: number
      openInterest?: number
      impliedVol?: number
      delta?: number
      gamma?: number
      theta?: number
      vega?: number
    }
  }>
  underlyingPrice?: number
  totalCallVolume: number
  totalPutVolume: number
  putCallRatio: number
  maxPain?: number
}

// Portfolio position tracking
export interface Position {
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  marketValue?: number
  unrealizedPnL?: number
  unrealizedPnLPercent?: number
  dayPnL?: number
  dayPnLPercent?: number
  beta?: number
  exposure?: number
  lastUpdate: number
}

// Risk metrics
export interface RiskMetrics {
  portfolioValue: number
  totalPnL: number
  totalPnLPercent: number
  dayPnL: number
  dayPnLPercent: number
  volatility: number
  sharpeRatio?: number
  maxDrawdown?: number
  var95?: number // Value at Risk 95%
  expectedShortfall?: number
  beta: number
  positions: Position[]
  lastCalculated: number
}

// Market screener criteria
export interface ScreenerCriteria {
  name: string
  minPrice?: number
  maxPrice?: number
  minVolume?: number
  maxVolume?: number
  minMarketCap?: number
  maxMarketCap?: number
  minPriceChange?: number
  maxPriceChange?: number
  minSpreadBps?: number
  maxSpreadBps?: number
  sectors?: string[]
  exchanges?: string[]
  customFilter?: (data: MarketEvent) => boolean
}

// Alert configuration
export interface AlertConfig {
  id: string
  name: string
  symbol: string
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_ABOVE' | 'SPREAD_ABOVE' | 'CUSTOM'
  threshold: number
  enabled: boolean
  triggeredAt?: number
  triggeredCount: number
  cooldownPeriod?: number // milliseconds
  actions: Array<{
    type: 'LOG' | 'EMAIL' | 'WEBHOOK' | 'CUSTOM'
    config: Record<string, any>
  }>
}

// Trading signal
export interface TradingSignal {
  symbol: string
  timestamp: number
  signal: 'BUY' | 'SELL' | 'HOLD'
  strength: number // 0-1
  price: number
  reason: string
  indicators: Record<string, number>
  confidence: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  targetPrice?: number
  stopLoss?: number
  expiryTime?: number
}

// Technical indicator result
export interface TechnicalIndicator {
  name: string
  value: number
  signal?: 'BUY' | 'SELL' | 'NEUTRAL'
  timestamp: number
  period?: number
  parameters?: Record<string, any>
}

// Error types
export interface DxFeedError extends Error {
  code?: string
  timestamp: number
  context?: Record<string, any>
  recoverable: boolean
}

// Event handler types
export type EventHandler<T = MarketEvent> = (events: T[]) => void
export type ErrorHandler = (error: DxFeedError) => void
export type ConnectionHandler = (state: ConnectionState) => void
export type SubscriptionHandler = (subscriptions: Subscription[]) => void

// Utility types for type guards
export const isQuoteEvent = (event: MarketEvent): event is QuoteEvent => {
  return event.eventType === 'Quote'
}

export const isTradeEvent = (event: MarketEvent): event is TradeEvent => {
  return event.eventType === 'Trade'
}

export const isCandleEvent = (event: MarketEvent): event is CandleEvent => {
  return event.eventType === 'Candle'
}

export const isGreeksEvent = (event: MarketEvent): event is GreeksEvent => {
  return event.eventType === 'Greeks'
}

// Constants
export const MARKET_DATA_TYPES = [
  'Quote', 'Trade', 'Candle', 'Greeks', 'TimeAndSale', 
  'Order', 'Profile', 'Summary'
] as const

export const DATA_FORMATS = ['FULL', 'COMPACT'] as const

export const CONNECTION_STATES = [
  'disconnected', 'connecting', 'connected', 'reconnecting', 'error'
] as const

export const AGGREGATION_PERIODS = [
  '1s', '5s', '10s', '15s', '30s',
  '1m', '2m', '3m', '5m', '10m', '15m', '20m', '30m',
  '1h', '2h', '3h', '4h', '6h', '8h', '12h',
  '1d', '1w', '1M'
] as const

export const EXCHANGES = [
  'NYSE', 'NASDAQ', 'AMEX', 'CBOE', 'BATS', 'IEX', 
  'MEMX', 'LTSE', 'MIAX', 'PHLX', 'BOX', 'C2', 'EDGX'
] as const

// Export all types for external use
export type {
  BaseEvent,
  QuoteEvent,
  TradeEvent,
  CandleEvent,
  GreeksEvent,
  TimeAndSaleEvent,
  OrderEvent,
  ProfileEvent,
  SummaryEvent,
  MarketEvent,
  Subscription,
  FeedConfiguration,
  ChannelConfiguration,
  ConnectionState,
  MarketDataStats,
  DepthOfMarket,
  OptionsChain,
  Position,
  RiskMetrics,
  ScreenerCriteria,
  AlertConfig,
  TradingSignal,
  TechnicalIndicator,
  DxFeedError,
  EventHandler,
  ErrorHandler,
  ConnectionHandler,
  SubscriptionHandler
}