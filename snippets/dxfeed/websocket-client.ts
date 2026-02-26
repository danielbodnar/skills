/**
 * DxFeed WebSocket Client Examples
 * Advanced WebSocket connection management, authentication, and error handling
 */

import { DXLinkWebSocketClient } from '@dxfeed/dxlink-websocket-client'

// Advanced connection configuration
interface WebSocketConfig {
  url: string
  token?: string
  heartbeatInterval?: number
  reconnectAttempts?: number
  reconnectDelay?: number
  connectionTimeout?: number
}

/**
 * Advanced WebSocket client with comprehensive error handling and reconnection logic
 */
export class DxFeedWebSocketManager {
  private client: DXLinkWebSocketClient | null = null
  private config: WebSocketConfig | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected'
  private heartbeatTimer: NodeJS.Timeout | null = null
  private channels: Map<string, any> = new Map()

  constructor() {
    this.setupGlobalErrorHandling()
  }

  /**
   * Connect with advanced configuration
   */
  async connect(config: WebSocketConfig): Promise<void> {
    this.config = config
    this.maxReconnectAttempts = config.reconnectAttempts ?? 5
    this.reconnectDelay = config.reconnectDelay ?? 1000

    try {
      this.connectionState = 'connecting'
      console.log(`Connecting to ${config.url}...`)

      this.client = new DXLinkWebSocketClient()
      
      // Setup event handlers before connecting
      this.setupConnectionHandlers()
      
      // Connect with timeout
      await this.connectWithTimeout(config.url, config.connectionTimeout ?? 30000)
      
      // Authenticate if token provided
      if (config.token) {
        this.client.setAuthToken(config.token)
        console.log('Authentication token set')
      }

      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      
      // Start heartbeat if configured
      if (config.heartbeatInterval) {
        this.startHeartbeat(config.heartbeatInterval)
      }

      console.log('WebSocket connection established successfully')

    } catch (error) {
      this.connectionState = 'disconnected'
      console.error('Failed to establish WebSocket connection:', error)
      throw error
    }
  }

  /**
   * Connect with timeout wrapper
   */
  private async connectWithTimeout(url: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('Client not initialized'))
        return
      }

      const timer = setTimeout(() => {
        reject(new Error(`Connection timeout after ${timeout}ms`))
      }, timeout)

      this.client.connect(url).then(() => {
        clearTimeout(timer)
        resolve()
      }).catch(error => {
        clearTimeout(timer)
        reject(error)
      })
    })
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.client) return

    // Connection opened
    this.client.addEventListener('open', () => {
      console.log('WebSocket connection opened')
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
    })

    // Connection closed
    this.client.addEventListener('close', (event) => {
      console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`)
      this.connectionState = 'disconnected'
      this.stopHeartbeat()
      
      // Attempt reconnection if not intentionally closed
      if (event.code !== 1000 && this.config) {
        this.attemptReconnection()
      }
    })

    // Connection error
    this.client.addEventListener('error', (error) => {
      console.error('WebSocket error:', error)
      this.handleConnectionError(error)
    })

    // Authentication error
    this.client.addEventListener('authError', (error) => {
      console.error('Authentication error:', error)
      this.handleAuthenticationError(error)
    })
  }

  /**
   * Handle connection errors with appropriate actions
   */
  private handleConnectionError(error: any): void {
    const errorType = this.classifyError(error)
    
    switch (errorType) {
      case 'NETWORK_ERROR':
        console.log('Network error detected, will attempt reconnection')
        break
      case 'AUTH_ERROR':
        console.log('Authentication error, token may need refresh')
        this.emit('authenticationRequired')
        break
      case 'SERVER_ERROR':
        console.log('Server error, will retry with exponential backoff')
        break
      default:
        console.log('Unknown error type:', error)
    }
  }

  /**
   * Classify error types for appropriate handling
   */
  private classifyError(error: any): string {
    if (error.code === 1006) return 'NETWORK_ERROR'
    if (error.code === 1008 || error.code === 4001) return 'AUTH_ERROR'
    if (error.code >= 1011 && error.code <= 1014) return 'SERVER_ERROR'
    return 'UNKNOWN_ERROR'
  }

  /**
   * Handle authentication errors
   */
  private async handleAuthenticationError(error: any): Promise<void> {
    console.warn('Authentication failed, attempting to refresh token')
    
    // Emit event for token refresh
    this.emit('tokenRefreshRequired', error)
    
    // Wait for token refresh or timeout
    const refreshed = await this.waitForTokenRefresh(30000)
    
    if (refreshed && this.config) {
      try {
        await this.reconnect()
      } catch (reconnectError) {
        console.error('Failed to reconnect after token refresh:', reconnectError)
      }
    }
  }

  /**
   * Wait for token refresh with timeout
   */
  private async waitForTokenRefresh(timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeout)
      
      this.once('tokenRefreshed', () => {
        clearTimeout(timer)
        resolve(true)
      })
    })
  }

  /**
   * Attempt automatic reconnection with exponential backoff
   */
  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, giving up')
      this.emit('reconnectionFailed')
      return
    }

    this.connectionState = 'reconnecting'
    this.reconnectAttempts++
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`)

    setTimeout(async () => {
      try {
        if (this.config) {
          await this.connect(this.config)
          console.log('Reconnection successful')
          this.emit('reconnected')
        }
      } catch (error) {
        console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error)
        this.attemptReconnection()
      }
    }, delay)
  }

  /**
   * Manual reconnection
   */
  async reconnect(): Promise<void> {
    if (this.client) {
      this.client.close()
    }
    
    if (this.config) {
      await this.connect(this.config)
    } else {
      throw new Error('No configuration available for reconnection')
    }
  }

  /**
   * Update authentication token
   */
  updateAuthToken(token: string): void {
    if (this.client && this.connectionState === 'connected') {
      this.client.setAuthToken(token)
      console.log('Authentication token updated')
      
      if (this.config) {
        this.config.token = token
      }
      
      this.emit('tokenRefreshed')
    } else {
      throw new Error('Cannot update token: client not connected')
    }
  }

  /**
   * Open a channel with configuration
   */
  openChannel(channelType: string, config: any = {}): any {
    if (!this.client || this.connectionState !== 'connected') {
      throw new Error('Client not connected')
    }

    try {
      const channel = this.client.openChannel(channelType, config)
      const channelId = `${channelType}_${Date.now()}`
      
      // Setup channel event handlers
      channel.addMessageListener((message: any) => {
        this.handleChannelMessage(channelId, message)
      })

      channel.addErrorListener((error: any) => {
        console.error(`Channel ${channelId} error:`, error)
        this.emit('channelError', { channelId, error })
      })

      this.channels.set(channelId, channel)
      console.log(`Opened channel: ${channelId}`)
      
      return { channel, channelId }

    } catch (error) {
      console.error('Failed to open channel:', error)
      throw error
    }
  }

  /**
   * Handle channel messages
   */
  private handleChannelMessage(channelId: string, message: any): void {
    // Emit channel-specific events
    this.emit(`channelMessage:${channelId}`, message)
    this.emit('channelMessage', { channelId, message })

    // Handle specific message types
    switch (message.type) {
      case 'FEED_DATA':
        this.emit('feedData', { channelId, data: message.data })
        break
      case 'FEED_CONFIG':
        this.emit('feedConfig', { channelId, config: message })
        break
      case 'ERROR':
        console.error(`Channel ${channelId} received error:`, message.error)
        break
    }
  }

  /**
   * Close a specific channel
   */
  closeChannel(channelId: string): void {
    const channel = this.channels.get(channelId)
    if (channel) {
      channel.close()
      this.channels.delete(channelId)
      console.log(`Closed channel: ${channelId}`)
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(interval: number): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.client && this.connectionState === 'connected') {
        // Send ping message
        try {
          this.client.ping()
        } catch (error) {
          console.error('Heartbeat ping failed:', error)
        }
      }
    }, interval)

    console.log(`Heartbeat started with ${interval}ms interval`)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
      console.log('Heartbeat stopped')
    }
  }

  /**
   * Get connection status and statistics
   */
  getConnectionInfo(): {
    state: string;
    reconnectAttempts: number;
    channelCount: number;
    config: WebSocketConfig | null;
  } {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      channelCount: this.channels.size,
      config: this.config
    }
  }

  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection in WebSocket manager:', reason)
    })

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception in WebSocket manager:', error)
    })
  }

  /**
   * Graceful disconnect
   */
  async disconnect(): Promise<void> {
    try {
      this.stopHeartbeat()
      
      // Close all channels
      for (const [channelId, channel] of this.channels) {
        channel.close()
        console.log(`Closed channel: ${channelId}`)
      }
      this.channels.clear()

      // Disconnect client
      if (this.client) {
        this.client.close()
        this.client = null
      }

      this.connectionState = 'disconnected'
      this.config = null
      this.reconnectAttempts = 0

      console.log('WebSocket disconnected gracefully')

    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  // Simple event emitter implementation
  private listeners: Map<string, Function[]> = new Map()

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (data: any) => {
      listener(data)
      this.off(event, onceWrapper)
    }
    this.on(event, onceWrapper)
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }
}

/**
 * Example: Advanced WebSocket connection with full error handling
 */
export async function advancedWebSocketExample(): Promise<void> {
  const wsManager = new DxFeedWebSocketManager()

  // Setup event listeners
  wsManager.on('reconnected', () => {
    console.log('✅ Reconnection successful')
  })

  wsManager.on('reconnectionFailed', () => {
    console.log('❌ All reconnection attempts failed')
  })

  wsManager.on('tokenRefreshRequired', async (error) => {
    console.log('🔄 Token refresh required')
    // Simulate token refresh
    setTimeout(() => {
      wsManager.updateAuthToken('new-refreshed-token')
    }, 2000)
  })

  wsManager.on('channelMessage', ({ channelId, message }) => {
    console.log(`📨 Channel ${channelId}: ${message.type}`)
  })

  try {
    // Connect with advanced configuration
    await wsManager.connect({
      url: 'wss://demo.dxfeed.com/dxlink-ws',
      token: 'demo-token',
      heartbeatInterval: 30000,
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      connectionTimeout: 15000
    })

    // Open a feed channel
    const { channel, channelId } = wsManager.openChannel('FEED', { contract: 'AUTO' })

    // Subscribe to market data
    channel.subscription({
      add: [
        { type: 'Quote', symbol: 'AAPL' },
        { type: 'Trade', symbol: 'AAPL' }
      ]
    })

    // Listen for specific channel messages
    wsManager.on(`channelMessage:${channelId}`, (message) => {
      if (message.type === 'FEED_DATA') {
        console.log('Market data received:', message.data?.length || 0, 'events')
      }
    })

    // Run for 2 minutes
    console.log('Running advanced WebSocket example for 2 minutes...')
    await new Promise(resolve => setTimeout(resolve, 120000))

  } catch (error) {
    console.error('Advanced WebSocket example failed:', error)
  } finally {
    await wsManager.disconnect()
  }
}

/**
 * Example: Channel management and message handling
 */
export async function channelManagementExample(): Promise<void> {
  const wsManager = new DxFeedWebSocketManager()

  try {
    await wsManager.connect({
      url: 'wss://demo.dxfeed.com/dxlink-ws',
      reconnectAttempts: 2
    })

    // Open multiple channels for different purposes
    const quoteChannel = wsManager.openChannel('FEED', { contract: 'QUOTE_FEED' })
    const tradeChannel = wsManager.openChannel('FEED', { contract: 'TRADE_FEED' })

    // Subscribe to different data on each channel
    quoteChannel.channel.subscription({
      add: [{ type: 'Quote', symbol: 'AAPL' }, { type: 'Quote', symbol: 'GOOGL' }]
    })

    tradeChannel.channel.subscription({
      add: [{ type: 'Trade', symbol: 'MSFT' }, { type: 'Trade', symbol: 'TSLA' }]
    })

    // Handle messages from different channels
    wsManager.on('feedData', ({ channelId, data }) => {
      console.log(`📈 Data from ${channelId}:`, data.length, 'events')
    })

    // Simulate dynamic channel management
    setTimeout(() => {
      console.log('Opening additional channel...')
      const candleChannel = wsManager.openChannel('CANDLE', { period: '1m' })
      
      setTimeout(() => {
        console.log('Closing candle channel...')
        wsManager.closeChannel(candleChannel.channelId)
      }, 30000)
    }, 15000)

    // Display connection info periodically
    const infoInterval = setInterval(() => {
      const info = wsManager.getConnectionInfo()
      console.log('Connection info:', info)
    }, 20000)

    // Run example
    console.log('Running channel management example for 90 seconds...')
    await new Promise(resolve => setTimeout(resolve, 90000))
    
    clearInterval(infoInterval)

  } catch (error) {
    console.error('Channel management example failed:', error)
  } finally {
    await wsManager.disconnect()
  }
}

// Export examples for testing
export { advancedWebSocketExample, channelManagementExample }