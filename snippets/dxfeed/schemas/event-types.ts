/**
 * DxFeed/DxLink Event Type Definitions
 * 
 * This file contains TypeScript type definitions for DxFeed dxLink API events
 * based on the official API specification and documentation.
 */

// ===== Base Event Types =====

export interface BaseEvent {
  eventType?: string
  eventSymbol: string
  eventTime?: number
  eventFlags?: number
  index?: number
}

// ===== Quote Event =====

export interface QuoteEvent extends BaseEvent {
  eventType: 'Quote'
  timeNanoPart?: number
  bidTime?: number
  bidExchangeCode?: string
  bidPrice?: number
  bidSize?: number
  askTime?: number
  askExchangeCode?: string
  askPrice?: number
  askSize?: number
  sequence?: number
}

// ===== Trade Event =====

export interface TradeEvent extends BaseEvent {
  eventType: 'Trade'
  timeNanoPart?: number
  exchangeCode?: string
  price?: number
  size?: number
  tick?: number
  change?: number
  dayId?: number
  dayVolume?: number
  dayTurnover?: number
  direction?: TradeDirection
  isETH?: boolean
  scope?: TradeScope
}

export enum TradeDirection {
  UNDEFINED = 0,
  UP = 1,
  DOWN = 2,
  ZERO_UP = 3,
  ZERO_DOWN = 4
}

export enum TradeScope {
  COMPOSITE = 0,
  REGIONAL = 1
}

// ===== TimeAndSale Event =====

export interface TimeAndSaleEvent extends BaseEvent {
  eventType: 'TimeAndSale'
  timeNanoPart?: number
  exchangeCode?: string
  price?: number
  size?: number
  bid?: number
  ask?: number
  exchangeSaleConditions?: string
  isValidTick?: boolean
  type?: TimeAndSaleType
  buyer?: string
  seller?: string
  side?: Side
  scope?: TradeScope
}

export enum TimeAndSaleType {
  NEW = 0,
  CORRECTION = 1,
  CANCEL = 2
}

export enum Side {
  UNDEFINED = 0,
  BUY = 1,
  SELL = 2
}

// ===== Candle Event =====

export interface CandleEvent extends BaseEvent {
  eventType: 'Candle'
  time?: number
  sequence?: number
  count?: number
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  vwap?: number
  bidVolume?: number
  askVolume?: number
  impVolatility?: number
  openInterest?: number
}

// ===== Greeks Event =====

export interface GreeksEvent extends BaseEvent {
  eventType: 'Greeks'
  time?: number
  sequence?: number
  price?: number
  volatility?: number
  delta?: number
  gamma?: number
  theta?: number
  rho?: number
  vega?: number
}

// ===== TheoPrice Event =====

export interface TheoPriceEvent extends BaseEvent {
  eventType: 'TheoPrice'
  time?: number
  sequence?: number
  price?: number
  underlyingPrice?: number
  delta?: number
  gamma?: number
  dividend?: number
  interest?: number
}

// ===== Underlying Event =====

export interface UnderlyingEvent extends BaseEvent {
  eventType: 'Underlying'
  time?: number
  sequence?: number
  volatility?: number
  frontVolatility?: number
  backVolatility?: number
  callVolume?: number
  putVolume?: number
  putCallRatio?: number
}

// ===== Series Event =====

export interface SeriesEvent extends BaseEvent {
  eventType: 'Series'
  time?: number
  sequence?: number
  expiration?: number
  volatility?: number
  callVolume?: number
  putVolume?: number
  putCallRatio?: number
  forwardPrice?: number
  dividend?: number
  interest?: number
}

// ===== Profile Event =====

export interface ProfileEvent extends BaseEvent {
  eventType: 'Profile'
  description?: string
  shortSaleRestriction?: ShortSaleRestriction
  tradingStatus?: TradingStatus
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
}

export enum ShortSaleRestriction {
  UNDEFINED = 0,
  ACTIVE = 1,
  INACTIVE = 2
}

export enum TradingStatus {
  UNDEFINED = 0,
  HALTED = 1,
  ACTIVE = 2
}

// ===== Summary Event =====

export interface SummaryEvent extends BaseEvent {
  eventType: 'Summary'
  dayId?: number
  dayOpenPrice?: number
  dayHighPrice?: number
  dayLowPrice?: number
  dayClosePrice?: number
  dayClosePriceType?: PriceType
  prevDayId?: number
  prevDayClosePrice?: number
  prevDayClosePriceType?: PriceType
  prevDayVolume?: number
  openInterest?: number
}

export enum PriceType {
  REGULAR = 0,
  INDICATIVE = 1,
  PRELIMINARY = 2,
  FINAL = 3
}

// ===== Order Events (Level II) =====

export interface OrderEvent extends BaseEvent {
  eventType: 'Order'
  source?: string
  time?: number
  timeNanoPart?: number
  sequence?: number
  price?: number
  size?: number
  count?: number
  scope?: OrderScope
  side?: Side
  exchangeCode?: string
  orderSide?: OrderSide
  hasSize?: boolean
}

export enum OrderScope {
  COMPOSITE = 0,
  REGIONAL = 1,
  AGGREGATE = 2,
  ORDER = 3
}

export enum OrderSide {
  UNDEFINED = 0,
  BUY = 1,
  SELL = 2
}

// ===== AnalyticOrder Event =====

export interface AnalyticOrderEvent extends OrderEvent {
  eventType: 'AnalyticOrder'
  iceberg?: number
  icebergPart?: number
  icebergExecuted?: number
  executionTime?: number
  tradeId?: number
  tradePrice?: number
  tradeSize?: number
}

// ===== SpreadOrder Event =====

export interface SpreadOrderEvent extends OrderEvent {
  eventType: 'SpreadOrder'
  spreadSymbol?: string
}

// ===== Configuration Event =====

export interface ConfigurationEvent extends BaseEvent {
  eventType: 'Configuration'
  version?: number
  attachment?: Uint8Array
}

// ===== Message Event =====

export interface MessageEvent extends BaseEvent {
  eventType: 'Message'
  time?: number
  sequence?: number
  text?: string
}

// ===== Union Types =====

export type DXEvent = 
  | QuoteEvent
  | TradeEvent
  | TimeAndSaleEvent
  | CandleEvent
  | GreeksEvent
  | TheoPriceEvent
  | UnderlyingEvent
  | SeriesEvent
  | ProfileEvent
  | SummaryEvent
  | OrderEvent
  | AnalyticOrderEvent
  | SpreadOrderEvent
  | ConfigurationEvent
  | MessageEvent

// ===== Subscription Types =====

export interface Subscription {
  type: string
  symbol: string
  source?: string
  fromTime?: number
  toTime?: number
}

export interface QuoteSubscription extends Subscription {
  type: 'Quote'
}

export interface TradeSubscription extends Subscription {
  type: 'Trade'
}

export interface TimeAndSaleSubscription extends Subscription {
  type: 'TimeAndSale'
}

export interface CandleSubscription extends Subscription {
  type: 'Candle'
  aggregationPeriod?: string
}

export interface GreeksSubscription extends Subscription {
  type: 'Greeks'
}

export interface TheoPriceSubscription extends Subscription {
  type: 'TheoPrice'
}

export interface UnderlyingSubscription extends Subscription {
  type: 'Underlying'
}

export interface SeriesSubscription extends Subscription {
  type: 'Series'
}

export interface ProfileSubscription extends Subscription {
  type: 'Profile'
}

export interface SummarySubscription extends Subscription {
  type: 'Summary'
}

export interface OrderSubscription extends Subscription {
  type: 'Order'
  source?: string
}

export type DXSubscription = 
  | QuoteSubscription
  | TradeSubscription  
  | TimeAndSaleSubscription
  | CandleSubscription
  | GreeksSubscription
  | TheoPriceSubscription
  | UnderlyingSubscription
  | SeriesSubscription
  | ProfileSubscription
  | SummarySubscription
  | OrderSubscription

// ===== Feed Configuration Types =====

export interface FeedConfiguration {
  acceptAggregationPeriod?: number
  acceptDataFormat?: FeedDataFormat
  acceptEventFields?: Record<string, string[]>
}

export enum FeedDataFormat {
  FULL = 'FULL',
  COMPACT = 'COMPACT'
}

export interface DepthOfMarketConfiguration {
  acceptAggregationPeriod?: number
  acceptDepthLimit?: number
  acceptDataFormat?: FeedDataFormat
}

// ===== WebSocket Message Types =====

export interface WebSocketMessage {
  channel: number
  type: string
  data?: any
}

export interface AuthMessage extends WebSocketMessage {
  type: 'AUTH'
  data: {
    token: string
  }
}

export interface SetupMessage extends WebSocketMessage {
  type: 'SETUP'
  data: {
    acceptKeepaliveTimeout?: number
    acceptVersion?: string
    acceptEncoding?: string
    channel?: number
  }
}

export interface FeedSetupMessage extends WebSocketMessage {
  type: 'FEED_SETUP'
  data: FeedConfiguration & {
    channel: number
  }
}

export interface FeedSubscriptionMessage extends WebSocketMessage {
  type: 'FEED_SUBSCRIPTION'
  data: {
    channel: number
    add?: DXSubscription[]
    remove?: DXSubscription[]
    reset?: boolean
  }
}

export interface FeedDataMessage extends WebSocketMessage {
  type: 'FEED_DATA'
  data: DXEvent[]
}

// ===== Error Types =====

export interface DXError {
  code: string
  message: string
  channel?: number
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'ERROR'
  data: DXError
}

// ===== Utility Types =====

export interface EventFieldSelection {
  [eventType: string]: string[]
}

export interface SymbolMapping {
  [symbol: string]: string
}

export interface MarketDataSnapshot {
  symbol: string
  quotes?: QuoteEvent[]
  trades?: TradeEvent[]
  summary?: SummaryEvent
  profile?: ProfileEvent
  timestamp: number
}

// ===== Constants =====

export const DEFAULT_EVENT_FIELDS: EventFieldSelection = {
  Quote: ['eventSymbol', 'bidPrice', 'askPrice', 'bidSize', 'askSize', 'bidTime', 'askTime'],
  Trade: ['eventSymbol', 'price', 'size', 'time', 'exchangeCode', 'change'],
  TimeAndSale: ['eventSymbol', 'price', 'size', 'time', 'exchangeCode', 'bid', 'ask'],
  Candle: ['eventSymbol', 'time', 'open', 'high', 'low', 'close', 'volume', 'vwap'],
  Greeks: ['eventSymbol', 'time', 'price', 'volatility', 'delta', 'gamma', 'theta', 'rho', 'vega'],
  Summary: ['eventSymbol', 'dayOpenPrice', 'dayHighPrice', 'dayLowPrice', 'dayClosePrice', 'dayClosePriceType', 'prevDayClosePrice'],
  Profile: ['eventSymbol', 'description', 'high52WeekPrice', 'low52WeekPrice', 'beta', 'earningsPerShare']
}

export const AGGREGATION_PERIODS = {
  TICK: 'TICK',
  SECOND: 's',
  MINUTE: 'm', 
  HOUR: 'h',
  DAY: 'd',
  WEEK: 'w',
  MONTH: 'mo',
  QUARTER: 'q',
  YEAR: 'y'
} as const

export type AggregationPeriod = typeof AGGREGATION_PERIODS[keyof typeof AGGREGATION_PERIODS]