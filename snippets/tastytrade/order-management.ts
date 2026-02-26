/**
 * Tastytrade API - Order Management Examples
 * 
 * This file demonstrates order placement, monitoring, and management
 * including equity orders, options strategies, and order lifecycle management.
 */

import TastytradeClient from '@tastytrade/api'
import type { 
  NewOrder, 
  OrderType, 
  OrderTimeInForce, 
  OrderAction,
  InstrumentType 
} from '@tastytrade/api'

interface OrderConfig {
  symbol: string
  quantity: number
  price?: number
  orderType: OrderType
  timeInForce: OrderTimeInForce
  action: OrderAction
}

interface OptionsStrategy {
  legs: Array<{
    symbol: string
    quantity: number
    action: OrderAction
    strike?: number
    expiration?: string
    optionType?: 'call' | 'put'
  }>
  netPrice: number
  strategy: string
}

/**
 * Order management class for Tastytrade trading operations
 */
export class TastytradeOrderManager {
  private client: TastytradeClient
  private accountNumber: string | null = null

  constructor(config: { baseUrl: string; accountStreamerUrl: string }) {
    this.client = new TastytradeClient(config)
  }

  /**
   * Initialize and authenticate
   */
  async initialize(username: string, password: string, accountNumber: string): Promise<void> {
    try {
      await this.client.sessionService.login(username, password)
      this.accountNumber = accountNumber
      console.log(`Initialized order manager for account ${accountNumber}`)
    } catch (error) {
      console.error('Failed to initialize order manager:', error)
      throw error
    }
  }

  /**
   * Place a simple equity order
   */
  async placeEquityOrder(config: OrderConfig, dryRun: boolean = true): Promise<any> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      // Get instrument information
      const instruments = await this.client.instrumentsService.getEquities([config.symbol])
      if (instruments.length === 0) {
        throw new Error(`Instrument ${config.symbol} not found`)
      }

      const instrument = instruments[0]

      // Build order leg
      const leg = {
        instrumentType: InstrumentType.EQUITY,
        symbol: config.symbol,
        quantity: config.quantity,
        action: config.action
      }

      // Create order
      const order: NewOrder = {
        timeInForce: config.timeInForce,
        orderType: config.orderType,
        legs: [leg],
        ...(config.price && { price: config.price })
      }

      console.log(`${dryRun ? 'DRY RUN' : 'LIVE'} - Placing equity order:`, {
        symbol: config.symbol,
        action: config.action,
        quantity: config.quantity,
        type: config.orderType,
        price: config.price
      })

      const response = await this.client.ordersService.placeOrder(
        this.accountNumber,
        order,
        dryRun
      )

      console.log('Order response:', response)
      return response

    } catch (error) {
      console.error('Failed to place equity order:', error)
      throw error
    }
  }

  /**
   * Place a limit buy order
   */
  async placeLimitBuy(symbol: string, quantity: number, limitPrice: number, dryRun: boolean = true): Promise<any> {
    return this.placeEquityOrder({
      symbol,
      quantity,
      price: limitPrice,
      orderType: OrderType.LIMIT,
      timeInForce: OrderTimeInForce.DAY,
      action: OrderAction.BUY_TO_OPEN
    }, dryRun)
  }

  /**
   * Place a market sell order
   */
  async placeMarketSell(symbol: string, quantity: number, dryRun: boolean = true): Promise<any> {
    return this.placeEquityOrder({
      symbol,
      quantity,
      orderType: OrderType.MARKET,
      timeInForce: OrderTimeInForce.DAY,
      action: OrderAction.SELL_TO_CLOSE
    }, dryRun)
  }

  /**
   * Place a stop-loss order
   */
  async placeStopLoss(symbol: string, quantity: number, stopPrice: number, dryRun: boolean = true): Promise<any> {
    return this.placeEquityOrder({
      symbol,
      quantity,
      price: stopPrice,
      orderType: OrderType.STOP,
      timeInForce: OrderTimeInForce.GTC, // Good Till Canceled
      action: OrderAction.SELL_TO_CLOSE
    }, dryRun)
  }

  /**
   * Place an options strategy order
   */
  async placeOptionsStrategy(strategy: OptionsStrategy, dryRun: boolean = true): Promise<any> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      // Build order legs
      const legs = strategy.legs.map(leg => ({
        instrumentType: InstrumentType.EQUITY_OPTION,
        symbol: leg.symbol,
        quantity: leg.quantity,
        action: leg.action
      }))

      // Create order
      const order: NewOrder = {
        timeInForce: OrderTimeInForce.DAY,
        orderType: OrderType.LIMIT,
        legs,
        price: strategy.netPrice
      }

      console.log(`${dryRun ? 'DRY RUN' : 'LIVE'} - Placing ${strategy.strategy} strategy:`, {
        legs: strategy.legs.length,
        netPrice: strategy.netPrice,
        strategy: strategy.strategy
      })

      const response = await this.client.ordersService.placeOrder(
        this.accountNumber,
        order,
        dryRun
      )

      console.log('Strategy order response:', response)
      return response

    } catch (error) {
      console.error('Failed to place options strategy:', error)
      throw error
    }
  }

  /**
   * Get all live orders
   */
  async getLiveOrders(): Promise<any[]> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      const orders = await this.client.ordersService.getLiveOrders(this.accountNumber)
      console.log(`Found ${orders.length} live orders`)
      return orders
    } catch (error) {
      console.error('Failed to get live orders:', error)
      throw error
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(startDate?: Date, endDate?: Date): Promise<any[]> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      const params: any = {}
      if (startDate) params.startDate = startDate.toISOString().split('T')[0]
      if (endDate) params.endDate = endDate.toISOString().split('T')[0]

      const orders = await this.client.ordersService.getOrders(this.accountNumber, params)
      console.log(`Retrieved ${orders.length} historical orders`)
      return orders
    } catch (error) {
      console.error('Failed to get order history:', error)
      throw error
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<any> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      const response = await this.client.ordersService.cancelOrder(this.accountNumber, orderId)
      console.log(`Cancelled order ${orderId}`)
      return response
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(orderId: string, newPrice?: number, newQuantity?: number): Promise<any> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      const updateData: any = {}
      if (newPrice !== undefined) updateData.price = newPrice
      if (newQuantity !== undefined) updateData.quantity = newQuantity

      const response = await this.client.ordersService.replaceOrder(
        this.accountNumber,
        orderId,
        updateData
      )
      
      console.log(`Modified order ${orderId}:`, updateData)
      return response
    } catch (error) {
      console.error(`Failed to modify order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<any> {
    if (!this.accountNumber) {
      throw new Error('Account number not set')
    }

    try {
      const order = await this.client.ordersService.getOrder(this.accountNumber, orderId)
      console.log(`Order ${orderId} status: ${order.status}`)
      return order
    } catch (error) {
      console.error(`Failed to get order status for ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Close connections
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.sessionService.logout()
      this.accountNumber = null
      console.log('Disconnected from Tastytrade')
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }
}

/**
 * Example: Basic equity trading
 */
export async function basicTradingExample() {
  const orderManager = new TastytradeOrderManager({
    baseUrl: process.env.TASTYTRADE_BASE_URL || 'https://api.cert.tastyworks.com',
    accountStreamerUrl: process.env.TASTYTRADE_STREAMER_URL || 'https://streamer.cert.tastyworks.com'
  })

  try {
    await orderManager.initialize(
      process.env.TASTYTRADE_USERNAME!,
      process.env.TASTYTRADE_PASSWORD!,
      process.env.TASTYTRADE_ACCOUNT_NUMBER!
    )

    // Get current live orders
    const liveOrders = await orderManager.getLiveOrders()
    console.log('Current live orders:', liveOrders.length)

    // Place a dry-run limit buy order
    const buyOrder = await orderManager.placeLimitBuy('SPY', 10, 400.00, true)
    console.log('Buy order placed (dry run):', buyOrder.order?.id)

    // Get recent order history
    const history = await orderManager.getOrderHistory(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      new Date()
    )
    console.log(`Order history: ${history.length} orders in last 7 days`)

  } catch (error) {
    console.error('Basic trading example failed:', error)
  } finally {
    await orderManager.disconnect()
  }
}

/**
 * Example: Options strategies
 */
export async function optionsStrategyExample() {
  const orderManager = new TastytradeOrderManager({
    baseUrl: process.env.TASTYTRADE_BASE_URL || 'https://api.cert.tastyworks.com',
    accountStreamerUrl: process.env.TASTYTRADE_STREAMER_URL || 'https://streamer.cert.tastyworks.com'
  })

  try {
    await orderManager.initialize(
      process.env.TASTYTRADE_USERNAME!,
      process.env.TASTYTRADE_PASSWORD!,
      process.env.TASTYTRADE_ACCOUNT_NUMBER!
    )

    // Example: Iron Condor strategy (this would need real option symbols)
    const ironCondor: OptionsStrategy = {
      legs: [
        {
          symbol: 'SPY_240119C00450000', // Short call
          quantity: 1,
          action: OrderAction.SELL_TO_OPEN
        },
        {
          symbol: 'SPY_240119C00460000', // Long call
          quantity: 1,
          action: OrderAction.BUY_TO_OPEN
        },
        {
          symbol: 'SPY_240119P00430000', // Short put
          quantity: 1,
          action: OrderAction.SELL_TO_OPEN
        },
        {
          symbol: 'SPY_240119P00420000', // Long put
          quantity: 1,
          action: OrderAction.BUY_TO_OPEN
        }
      ],
      netPrice: 1.25, // Net credit received
      strategy: 'Iron Condor'
    }

    // Place strategy (dry run)
    const strategyOrder = await orderManager.placeOptionsStrategy(ironCondor, true)
    console.log('Iron Condor placed (dry run):', strategyOrder.order?.id)

  } catch (error) {
    console.error('Options strategy example failed:', error)
  } finally {
    await orderManager.disconnect()
  }
}

/**
 * Example: Order monitoring and management
 */
export async function orderMonitoringExample() {
  const orderManager = new TastytradeOrderManager({
    baseUrl: process.env.TASTYTRADE_BASE_URL || 'https://api.cert.tastyworks.com',
    accountStreamerUrl: process.env.TASTYTRADE_STREAMER_URL || 'https://streamer.cert.tastyworks.com'
  })

  try {
    await orderManager.initialize(
      process.env.TASTYTRADE_USERNAME!,
      process.env.TASTYTRADE_PASSWORD!,
      process.env.TASTYTRADE_ACCOUNT_NUMBER!
    )

    // Get live orders
    const liveOrders = await orderManager.getLiveOrders()
    
    for (const order of liveOrders) {
      console.log(`Order ${order.id}: ${order.status} - ${order.instrument} ${order.action} ${order.quantity} @ ${order.price}`)
      
      // Example: Cancel old orders (be very careful with this in production!)
      const orderAge = Date.now() - new Date(order.time_placed).getTime()
      if (orderAge > 24 * 60 * 60 * 1000) { // Older than 1 day
        console.log(`Would cancel old order ${order.id} (dry run)`)
        // await orderManager.cancelOrder(order.id)
      }
    }

    // Monitor order status changes (in real implementation, this would use WebSocket)
    console.log('In a real application, you would monitor order status changes via WebSocket')

  } catch (error) {
    console.error('Order monitoring example failed:', error)
  } finally {
    await orderManager.disconnect()
  }
}

/**
 * Run examples if this file is executed directly
 */
if (import.meta.main) {
  console.log('Running Tastytrade order management examples...')
  
  await basicTradingExample()
  console.log('---')
  await optionsStrategyExample()
  console.log('---')
  await orderMonitoringExample()
}