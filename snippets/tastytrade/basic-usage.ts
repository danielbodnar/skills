/**
 * Tastytrade API - Basic Usage Examples
 * 
 * This file demonstrates the fundamental patterns for using the Tastytrade API
 * including authentication, account access, and basic operations.
 */

import TastytradeClient from '@tastytrade/api'

// Environment configuration
const CONFIG = {
  baseUrl: process.env.TASTYTRADE_BASE_URL || 'https://api.cert.tastyworks.com',
  accountStreamerUrl: process.env.TASTYTRADE_STREAMER_URL || 'https://streamer.cert.tastyworks.com',
  username: process.env.TASTYTRADE_USERNAME!,
  password: process.env.TASTYTRADE_PASSWORD!,
}

/**
 * Basic client initialization and authentication
 */
export class TastytradeBasicClient {
  private client: TastytradeClient
  private isAuthenticated = false

  constructor() {
    this.client = new TastytradeClient({
      baseUrl: CONFIG.baseUrl,
      accountStreamerUrl: CONFIG.accountStreamerUrl
    })
  }

  /**
   * Authenticate with Tastytrade API
   */
  async login(): Promise<any> {
    try {
      const loginResponse = await this.client.sessionService.login(
        CONFIG.username,
        CONFIG.password
      )
      
      this.isAuthenticated = true
      console.log('Login successful:', loginResponse.user)
      return loginResponse
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Get all customer accounts
   */
  async getAccounts() {
    if (!this.isAuthenticated) {
      throw new Error('Must login first')
    }

    try {
      const accounts = await this.client.accountsAndCustomersService.getCustomerAccounts()
      console.log(`Found ${accounts.length} accounts`)
      return accounts
    } catch (error) {
      console.error('Failed to get accounts:', error)
      throw error
    }
  }

  /**
   * Get account positions
   */
  async getPositions(accountNumber: string) {
    try {
      const positions = await this.client.balancesAndPositionsService.getPositionsList(accountNumber)
      console.log(`Account ${accountNumber} has ${positions.length} positions`)
      return positions
    } catch (error) {
      console.error('Failed to get positions:', error)
      throw error
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string) {
    try {
      const balance = await this.client.balancesAndPositionsService.getBalances(accountNumber)
      console.log(`Account balance for ${accountNumber}:`, balance)
      return balance
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }

  /**
   * Logout and cleanup
   */
  async logout() {
    if (this.isAuthenticated) {
      try {
        await this.client.sessionService.logout()
        this.isAuthenticated = false
        console.log('Logged out successfully')
      } catch (error) {
        console.error('Logout failed:', error)
        throw error
      }
    }
  }
}

/**
 * Basic usage example
 */
export async function basicUsageExample() {
  const client = new TastytradeBasicClient()

  try {
    // Login
    await client.login()

    // Get accounts
    const accounts = await client.getAccounts()
    
    if (accounts.length > 0) {
      const firstAccount = accounts[0].account['account-number']
      
      // Get positions and balance for first account
      const positions = await client.getPositions(firstAccount)
      const balance = await client.getBalance(firstAccount)
      
      console.log('Account summary:', {
        accountNumber: firstAccount,
        positionCount: positions.length,
        buyingPower: balance['day-trading-buying-power'],
        netLiquidatingValue: balance['net-liquidating-value']
      })
    }
  } catch (error) {
    console.error('Example failed:', error)
  } finally {
    // Always logout
    await client.logout()
  }
}

/**
 * Remember token authentication example
 */
export async function rememberTokenExample() {
  const client = new TastytradeClient({
    baseUrl: CONFIG.baseUrl,
    accountStreamerUrl: CONFIG.accountStreamerUrl
  })

  try {
    // Login with remember_me to get token
    const loginResponse = await client.sessionService.login(
      CONFIG.username,
      CONFIG.password,
      { rememberMe: true }
    )

    const rememberToken = loginResponse.user['remember-token']
    console.log('Remember token obtained')

    // Logout
    await client.sessionService.logout()

    // Login again using remember token (valid for 24 hours)
    const tokenLogin = await client.sessionService.loginWithRememberToken(
      CONFIG.username,
      rememberToken
    )

    console.log('Logged in with remember token:', tokenLogin.user)
    
    // Use the session...
    const accounts = await client.accountsAndCustomersService.getCustomerAccounts()
    console.log(`Token session has access to ${accounts.length} accounts`)

  } catch (error) {
    console.error('Remember token example failed:', error)
  }
}

/**
 * Run examples if this file is executed directly
 */
if (import.meta.main) {
  console.log('Running Tastytrade basic usage examples...')
  
  await basicUsageExample()
  console.log('---')
  await rememberTokenExample()
}