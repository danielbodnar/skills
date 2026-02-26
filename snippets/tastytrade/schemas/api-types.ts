/**
 * Tastytrade API Type Definitions
 * 
 * This file contains TypeScript type definitions for the Tastytrade API
 * based on the official API documentation and SDK.
 */

// ===== Authentication & Session Types =====

export interface LoginRequest {
  login: string
  password: string
  'remember-me'?: boolean
}

export interface LoginResponse {
  user: User
  'session-token': string
}

export interface User {
  email: string
  username: string
  'external-id': string
  'remember-token'?: string
  id: number
}

export interface Session {
  user: User
  'session-token': string
}

// ===== Account Types =====

export interface Account {
  account: AccountDetails
  'margin-requirements': MarginRequirements
  'authority-level': string
}

export interface AccountDetails {
  'account-number': string
  'external-id': string
  'opened-at': string
  nickname: string
  'account-type-name': string
  'day-trader-status': boolean
  'is-closed': boolean
  'is-firm-error': boolean
  'is-firm-proprietary': boolean
  'is-futures-approved': boolean
  'is-test-drive': boolean
  'margin-or-cash': string
  'is-foreign': boolean
  'funding-date': string
  'investment-objective': string
  'liquidity-needs': string
  'risk-tolerance': string
  'investment-time-horizon': string
  'futures-account-purpose': string
  'external-fdid': string
}

export interface MarginRequirements {
  'non-marginable-buying-power': string
  'day-trading-buying-power': string
  'overnight-buying-power': string
  'regt-buying-power': string
  'maintenance-requirement': string
  'available-trading-funds': string
  'excess-liquidity': string
}

// ===== Balance & Position Types =====

export interface AccountBalance {
  'account-number': string
  'cash-balance': string
  'long-equity-value': string
  'short-equity-value': string
  'long-derivative-value': string
  'short-derivative-value': string
  'long-futures-value': string
  'short-futures-value': string
  'long-futures-derivative-value': string
  'short-futures-derivative-value': string
  'long-margineable-value': string
  'short-margineable-value': string
  'margin-equity': string
  'equity-buying-power': string
  'derivative-buying-power': string
  'day-trading-buying-power': string
  'futures-margin-requirement': string
  'available-trading-funds': string
  'maintenance-requirement': string
  'maintenance-call-value': string
  'reg-t-call-value': string
  'day-trading-call-value': string
  'day-equity-call-value': string
  'net-liquidating-value': string
  'cash-available-to-withdraw': string
  'day-trade-excess': string
  'pending-cash': string
  'pending-cash-effect': 'Credit' | 'Debit'
  'long-cryptocurrency-value': string
  'short-cryptocurrency-value': string
  'cryptocurrency-margin-requirement': string
  'unsettled-cryptocurrency-fiat-amount': string
  'unsettled-cryptocurrency-fiat-effect': 'Credit' | 'Debit'
  'closed-loop-available-balance': string
  'equity-offering-margin-requirement': string
  'long-bond-value': string
  'bond-margin-requirement': string
  'snapshot-date': string
  'reg-t-margin-requirement': string
  'futures-overnight-margin-requirement': string
  'futures-intraday-margin-requirement': string
  'maintenance-excess': string
  'pending-margin-interest': string
  'effective-cryptocurrency-buying-power': string
  'updated-at': string
}

export interface Position {
  'account-number': string
  symbol: string
  'instrument-type': InstrumentType
  'underlying-symbol': string
  quantity: string
  'quantity-direction': 'Long' | 'Short'
  'close-price': string
  'average-open-price': string
  'average-yearly-market-close-price': string
  'average-daily-market-close-price': string
  multiplier: number
  'cost-effect': 'Credit' | 'Debit'
  'is-suppressed': boolean
  'is-frozen': boolean
  'restricted-quantity': string
  'expires-at'?: string
  'realized-day-gain': string
  'realized-day-gain-effect': 'Credit' | 'Debit'
  'realized-day-gain-date': string
  'realized-today': string
  'realized-today-effect': 'Credit' | 'Debit'
  'realized-today-date': string
  'created-at': string
  'updated-at': string
  'mark'?: string
  'mark-price'?: string
  'fixing-price'?: string
  'deliverable-type'?: string
}

// ===== Order Types =====

export enum OrderType {
  MARKET = 'Market',
  LIMIT = 'Limit',
  STOP = 'Stop',
  STOP_LIMIT = 'Stop Limit',
  NOTIONAL_MARKET = 'Notional Market'
}

export enum OrderTimeInForce {
  DAY = 'Day',
  GTC = 'GTC', // Good Till Canceled
  GTD = 'GTD', // Good Till Date
  EXT = 'EXT', // Extended Hours
  GTC_EXT = 'GTC EXT',
  IOC = 'IOC', // Immediate or Cancel
  FOK = 'FOK'  // Fill or Kill
}

export enum OrderAction {
  BUY_TO_OPEN = 'Buy to Open',
  BUY_TO_CLOSE = 'Buy to Close',
  SELL_TO_OPEN = 'Sell to Open',
  SELL_TO_CLOSE = 'Sell to Close',
  BUY = 'Buy',
  SELL = 'Sell'
}

export enum InstrumentType {
  EQUITY = 'Equity',
  EQUITY_OPTION = 'Equity Option',
  FUTURE = 'Future',
  FUTURE_OPTION = 'Future Option',
  INDEX = 'Index',
  CRYPTOCURRENCY = 'Cryptocurrency',
  BOND = 'Bond'
}

export interface OrderLeg {
  'instrument-type': InstrumentType
  symbol: string
  action: OrderAction
  quantity: string
}

export interface NewOrder {
  'time-in-force': OrderTimeInForce
  'order-type': OrderType
  legs: OrderLeg[]
  price?: string
  'price-effect'?: 'Credit' | 'Debit'
  'value-effect'?: 'Credit' | 'Debit'
  'stop-trigger'?: string
  'gtd-date'?: string
  'partition-key'?: string
  'preference-key'?: string
  'source'?: string
}

export interface PlacedOrder {
  'buying-power-effect': {
    'change-in-margin-requirement': string
    'change-in-margin-requirement-effect': 'Credit' | 'Debit'
    'change-in-buying-power': string
    'change-in-buying-power-effect': 'Credit' | 'Debit'
    'current-buying-power': string
    'current-buying-power-effect': 'Credit' | 'Debit'
    'new-buying-power': string
    'new-buying-power-effect': 'Credit' | 'Debit'
    'isolated-order-margin-requirement': string
    'isolated-order-margin-requirement-effect': 'Credit' | 'Debit'
    'is-spread': boolean
    'impact': string
    'effect': 'Credit' | 'Debit'
  }
  'fee-calculation': {
    'regulatory-fees': string
    'regulatory-fees-effect': 'Credit' | 'Debit'
    'clearing-fees': string
    'clearing-fees-effect': 'Credit' | 'Debit'
    'commission': string
    'commission-effect': 'Credit' | 'Debit'
    'proprietary-index-option-fees': string
    'proprietary-index-option-fees-effect': 'Credit' | 'Debit'
    'total-fees': string
    'total-fees-effect': 'Credit' | 'Debit'
  }
  order: Order
  warnings?: Warning[]
  'buying-power-change'?: {
    'change-in-buying-power': string
    'change-in-buying-power-effect': 'Credit' | 'Debit'
    'new-buying-power': string
    'new-buying-power-effect': 'Credit' | 'Debit'
  }
}

export interface Order {
  id: string
  'account-number': string
  'time-in-force': OrderTimeInForce
  'order-type': OrderType
  size: string
  'underlying-symbol': string
  'underlying-instrument-type': InstrumentType
  status: OrderStatus
  'cancellable': boolean
  'editable': boolean
  'edited': boolean
  'updated-at': string
  legs: OrderLegFilled[]
  price?: string
  'price-effect'?: 'Credit' | 'Debit'
  'value-effect'?: 'Credit' | 'Debit'
  'stop-trigger'?: string
  'contingent-status'?: string
  'confirmation-status'?: string
  'cancelled-at'?: string
  'cancel-user-id'?: string
  'cancel-username'?: string
  'replacing-order-id'?: string
  'replaces-order-id'?: string
  'in-flight-at'?: string
  'live-at'?: string
  'received-at': string
  'reject-reason'?: string
  'user-id'?: string
  username?: string
  'terminal-at'?: string
  'complex-order-id'?: string
  'complex-order-tag'?: string
  'preflight-id'?: string
  'order-rule'?: string
}

export enum OrderStatus {
  RECEIVED = 'Received',
  CANCELLED = 'Cancelled',
  FILLED = 'Filled',
  EXPIRED = 'Expired',
  LIVE = 'Live',
  REJECTED = 'Rejected',
  CONTINGENT = 'Contingent',
  ROUTED = 'Routed',
  IN_FLIGHT = 'In Flight',
  REPLACE_REQUESTED = 'Replace Requested',
  CANCEL_REQUESTED = 'Cancel Requested',
  PARTIALLY_FILLED = 'Partially Filled'
}

export interface OrderLegFilled extends OrderLeg {
  id: string
  fills: Fill[]
}

export interface Fill {
  'external-group-fill-id': string
  'external-exec-id': string
  'fill-id': string
  quantity: string
  'fill-price': string
  'filled-at': string
  'destination-venue': string
}

export interface Warning {
  code: string
  message: string
}

// ===== Market Data Types =====

export interface MarketData {
  symbol: string
  'instrument-type': InstrumentType
  'updated-at': string
  'bid-size'?: string
  'ask-size'?: string
  'mark': string
  'mark-price'?: string
  'close-price-type': ClosePriceType
  'prev-close'?: string
  'prev-close-price-type'?: ClosePriceType
  'summary-date': string
  'prev-close-date': string
  'halt-start-time': number
  'halt-end-time': number
  ask?: string
  beta?: string
  bid?: string
  close?: string
  'day-high-price'?: string
  'day-low-price'?: string
  'dividend-amount'?: string
  'dividend-frequency'?: string
  'high-limit-price'?: string
  last?: string
  'last-mkt'?: string
  'low-limit-price'?: string
  mid?: string
  open?: string
  volume?: string
  'year-low-price'?: string
  'year-high-price'?: string
}

export enum ClosePriceType {
  REGULAR = 'Regular',
  FINAL = 'Final',
  PRELIMINARY = 'Preliminary',
  INDICATIVE = 'Indicative'
}

// ===== Instrument Types =====

export interface Equity {
  id: string
  symbol: string
  'instrument-type': InstrumentType.EQUITY
  'cusip': string
  description: string
  'listed-market': string
  'tick-sizes': TickSize[]
  'option-tick-sizes': TickSize[]
  'deliverable-type': string
  'market-time-instrument-collection': string
  'shares-per-point': number
  'is-closing-only': boolean
  'is-options-closing-only': boolean
  'active': boolean
  'is-illiquid': boolean
  'is-etf': boolean
  'streamer-symbol': string
  'market-time-gaps': MarketTimeGap[]
}

export interface FutureOption {
  symbol: string
  'root-symbol': string
  'option-root-symbol': string
  'option-type': 'C' | 'P'
  'strike-price': string
  'expiration-date': string
  'days-to-expiration': number
  'expiration-type': string
  'settlement-type': string
  'shares-per-point': number
  tick: string
  'tick-value': string
  'multiplier': string
  'underlying-symbol': string
  'underlying-instrument-type': InstrumentType
  'expiration-date': string
  'last-trading-date': string
  'is-closing-only': boolean
  'active': boolean
  'streamer-symbol': string
}

export interface TickSize {
  threshold: string
  'tick-size': string
}

export interface MarketTimeGap {
  'start-time': string
  'end-time': string
  description: string
}

// ===== Quote Token Types =====

export interface QuoteToken {
  token: string
  'dxlink-url': string
  'websocket-url': string
  level: string
}

// ===== Watchlist Types =====

export interface Watchlist {
  name: string
  'watchlist-entries': WatchlistEntry[]
}

export interface WatchlistEntry {
  symbol: string
  'instrument-type': InstrumentType
}

// ===== Utility Types =====

export type PriceEffect = 'Credit' | 'Debit'

export interface APIResponse<T> {
  data: T
  context?: string
  'pagination-id'?: string
}

export interface APIError {
  code: string
  message: string
  details?: any
}

// ===== Configuration Types =====

export interface TastytradeConfig {
  baseUrl: string
  accountStreamerUrl?: string
  timeout?: number
  retries?: number
}