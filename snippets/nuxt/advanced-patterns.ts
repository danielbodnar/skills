// Advanced Nuxt 4 patterns and techniques

// 1. Custom hook system with dependency injection
interface ServiceContainer {
  [key: string]: any
}

const serviceContainer: ServiceContainer = {}

export const useContainer = () => {
  const register = <T>(key: string, service: T): void => {
    serviceContainer[key] = service
  }
  
  const resolve = <T>(key: string): T => {
    if (!(key in serviceContainer)) {
      throw new Error(`Service '${key}' not found in container`)
    }
    return serviceContainer[key] as T
  }
  
  const has = (key: string): boolean => {
    return key in serviceContainer
  }
  
  return { register, resolve, has }
}

// 2. Advanced state management with Pinia and persistence
import { defineStore } from 'pinia'

interface AppState {
  user: User | null
  preferences: UserPreferences
  cache: Map<string, { data: any; timestamp: number; ttl: number }>
  notifications: Notification[]
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    user: null,
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifications: {
        email: true,
        push: true,
        inApp: true
      }
    },
    cache: new Map(),
    notifications: []
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    hasRole: (state) => (role: string) => state.user?.role === role,
    unreadNotifications: (state) => state.notifications.filter(n => !n.read),
    
    // Cached data getter with TTL
    getCachedData: (state) => (key: string) => {
      const cached = state.cache.get(key)
      if (!cached) return null
      
      const isExpired = Date.now() > cached.timestamp + cached.ttl
      if (isExpired) {
        state.cache.delete(key)
        return null
      }
      
      return cached.data
    }
  },
  
  actions: {
    // Advanced user management
    async setUser(user: User) {
      this.user = user
      await this.syncUserPreferences()
    },
    
    async syncUserPreferences() {
      if (!this.user) return
      
      try {
        const prefs = await $fetch(`/api/users/${this.user.id}/preferences`)
        this.preferences = { ...this.preferences, ...prefs }
      } catch (error) {
        console.error('Failed to sync user preferences:', error)
      }
    },
    
    async updatePreferences(updates: Partial<UserPreferences>) {
      this.preferences = { ...this.preferences, ...updates }
      
      if (this.user) {
        try {
          await $fetch(`/api/users/${this.user.id}/preferences`, {
            method: 'PATCH',
            body: updates
          })
        } catch (error) {
          console.error('Failed to update preferences:', error)
        }
      }
    },
    
    // Advanced caching with TTL
    setCachedData(key: string, data: any, ttl = 300000) { // 5 minutes default
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
    },
    
    clearExpiredCache() {
      const now = Date.now()
      for (const [key, value] of this.cache.entries()) {
        if (now > value.timestamp + value.ttl) {
          this.cache.delete(key)
        }
      }
    },
    
    // Notification system
    addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        read: false,
        ...notification
      }
      
      this.notifications.unshift(newNotification)
      
      // Auto-remove after timeout
      if (notification.timeout) {
        setTimeout(() => {
          this.removeNotification(newNotification.id)
        }, notification.timeout)
      }
    },
    
    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },
    
    markNotificationAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },
    
    clearAllNotifications() {
      this.notifications = []
    }
  },
  
  // Persist state
  persist: {
    key: 'app-store',
    storage: persistedState.localStorage,
    pick: ['preferences'],
    beforeRestore: (context) => {
      console.log('About to restore state:', context.store)
    },
    afterRestore: (context) => {
      console.log('State restored:', context.store)
    }
  }
})

// 3. Advanced composable with reactive transforms
export const useAdvancedCounter = (initialValue = 0) => {
  // Using reactive transforms (experimental)
  let count = $ref(initialValue)
  let history = $ref<number[]>([initialValue])
  const isEven = $computed(() => count % 2 === 0)
  const operations = $ref({
    increments: 0,
    decrements: 0,
    resets: 0
  })
  
  const increment = () => {
    count++
    history.push(count)
    operations.increments++
  }
  
  const decrement = () => {
    count--
    history.push(count)
    operations.decrements++
  }
  
  const reset = () => {
    count = initialValue
    history = [initialValue]
    operations.resets++
  }
  
  const undo = () => {
    if (history.length > 1) {
      history.pop()
      count = history[history.length - 1]
    }
  }
  
  const getStats = () => ({
    current: count,
    isEven,
    total_operations: operations.increments + operations.decrements + operations.resets,
    history_length: history.length,
    operations: { ...operations }
  })
  
  // Return reactive refs
  return $$({
    count,
    history,
    isEven,
    operations,
    increment,
    decrement,
    reset,
    undo,
    getStats
  })
}

// 4. Plugin with advanced configuration and hooks
export default defineNuxtPlugin({
  name: 'advanced-plugin',
  dependsOn: ['other-plugin'],
  parallel: true,
  setup(nuxtApp) {
    // Advanced error handling
    const errorHandler = (error: any, context: string) => {
      console.error(`[${context}] Error:`, error)
      
      // Send to error tracking service
      if (process.client && window.Sentry) {
        window.Sentry.captureException(error, {
          tags: { context }
        })
      }
      
      // Show user-friendly notification
      const store = useAppStore()
      store.addNotification({
        type: 'error',
        title: 'Something went wrong',
        message: 'We\'re working to fix this issue',
        timeout: 5000
      })
    }
    
    // Global error handlers
    if (process.client) {
      window.addEventListener('error', (event) => {
        errorHandler(event.error, 'window')
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        errorHandler(event.reason, 'promise')
      })
    }
    
    // Vue error handler
    nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
      errorHandler(error, `vue:${info}`)
    }
    
    // Advanced performance monitoring
    const perfMonitor = {
      startTiming: (label: string) => {
        if (process.client && performance.mark) {
          performance.mark(`${label}-start`)
        }
      },
      
      endTiming: (label: string) => {
        if (process.client && performance.mark && performance.measure) {
          performance.mark(`${label}-end`)
          performance.measure(label, `${label}-start`, `${label}-end`)
          
          const measure = performance.getEntriesByName(label)[0]
          if (measure) {
            console.log(`[Performance] ${label}: ${measure.duration.toFixed(2)}ms`)
          }
        }
      }
    }
    
    // Advanced caching layer
    const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
    
    const cacheManager = {
      get: (key: string) => {
        const cached = cache.get(key)
        if (!cached) return null
        
        if (Date.now() > cached.timestamp + cached.ttl) {
          cache.delete(key)
          return null
        }
        
        return cached.data
      },
      
      set: (key: string, data: any, ttl = 300000) => {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        })
      },
      
      invalidate: (pattern: string) => {
        const regex = new RegExp(pattern)
        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key)
          }
        }
      },
      
      clear: () => cache.clear(),
      
      stats: () => ({
        size: cache.size,
        keys: Array.from(cache.keys())
      })
    }
    
    // Provide services
    return {
      provide: {
        errorHandler,
        perfMonitor,
        cache: cacheManager
      }
    }
  }
})

// 5. Advanced server middleware with rate limiting and auth
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const method = getMethod(event)
  
  // Skip middleware for certain paths
  if (url.pathname.startsWith('/_nuxt') || url.pathname.startsWith('/api/_')) {
    return
  }
  
  // Rate limiting
  const clientIp = getClientIP(event)
  const rateLimitKey = `rate_limit:${clientIp}`
  const storage = useStorage('redis')
  
  const rateLimit = await storage.getItem(rateLimitKey) || { count: 0, resetTime: Date.now() + 60000 }
  
  if (Date.now() > rateLimit.resetTime) {
    rateLimit.count = 0
    rateLimit.resetTime = Date.now() + 60000
  }
  
  rateLimit.count++
  
  if (rateLimit.count > 100) { // 100 requests per minute
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }
    })
  }
  
  await storage.setItem(rateLimitKey, rateLimit, { ttl: 60 })
  
  // Authentication for protected routes
  if (url.pathname.startsWith('/api/protected')) {
    const token = getCookie(event, 'auth-token') || 
                  getHeader(event, 'authorization')?.replace('Bearer ', '')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    try {
      const payload = await verifyJWT(token)
      event.context.user = payload
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }
  }
  
  // Security headers
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  })
  
  // CORS for API routes
  if (url.pathname.startsWith('/api') && method === 'OPTIONS') {
    setHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    })
    return ''
  }
  
  // Logging
  console.log(`[${new Date().toISOString()}] ${method} ${url.pathname} - ${clientIp}`)
})

// 6. Advanced routing with dynamic imports and code splitting
export const useAdvancedRouter = () => {
  const router = useRouter()
  const route = useRoute()
  
  const preloadRoute = async (path: string) => {
    try {
      await router.preloadRoute(path)
    } catch (error) {
      console.warn('Failed to preload route:', path, error)
    }
  }
  
  const navigateWithTransition = async (to: string, transition = 'fade') => {
    const nuxtApp = useNuxtApp()
    
    // Set page transition
    nuxtApp.hook('page:transition:finish', () => {
      console.log('Navigation complete')
    })
    
    await navigateTo(to)
  }
  
  const getRouteLevel = () => {
    return route.path.split('/').filter(Boolean).length
  }
  
  const getBreadcrumbs = () => {
    const pathSegments = route.path.split('/').filter(Boolean)
    const breadcrumbs = []
    
    let currentPath = ''
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      breadcrumbs.push({
        text: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        active: currentPath === route.path
      })
    }
    
    return breadcrumbs
  }
  
  return {
    preloadRoute,
    navigateWithTransition,
    getRouteLevel,
    getBreadcrumbs
  }
}

// 7. Advanced WebSocket implementation with reconnection
export const useAdvancedWebSocket = (url: string, options: {
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
} = {}) => {
  const {
    protocols,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options
  
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const lastMessage = ref<any>(null)
  const messageHistory = ref<any[]>([])
  const connectionId = ref<string | null>(null)
  
  let heartbeatTimer: NodeJS.Timeout | null = null
  let reconnectTimer: NodeJS.Timeout | null = null
  
  const connect = () => {
    if (process.client) {
      try {
        socket.value = new WebSocket(url, protocols)
        
        socket.value.onopen = () => {
          isConnected.value = true
          reconnectAttempts.value = 0
          connectionId.value = Math.random().toString(36).substr(2, 9)
          
          console.log('WebSocket connected:', connectionId.value)
          
          // Start heartbeat
          startHeartbeat()
        }
        
        socket.value.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            lastMessage.value = data
            messageHistory.value.push({
              ...data,
              timestamp: Date.now(),
              connectionId: connectionId.value
            })
            
            // Handle heartbeat response
            if (data.type === 'pong') {
              console.log('Heartbeat received')
            }
          } catch {
            lastMessage.value = event.data
          }
        }
        
        socket.value.onclose = () => {
          isConnected.value = false
          stopHeartbeat()
          
          console.log('WebSocket disconnected')
          
          // Attempt reconnection
          if (reconnectAttempts.value < maxReconnectAttempts) {
            reconnectAttempts.value++
            console.log(`Reconnecting... (${reconnectAttempts.value}/${maxReconnectAttempts})`)
            
            reconnectTimer = setTimeout(connect, reconnectInterval)
          } else {
            console.error('Max reconnection attempts reached')
          }
        }
        
        socket.value.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
      }
    }
  }
  
  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    
    stopHeartbeat()
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }
  
  const send = (data: any) => {
    if (socket.value && isConnected.value) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      socket.value.send(message)
      return true
    }
    return false
  }
  
  const startHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    
    heartbeatTimer = setInterval(() => {
      if (isConnected.value) {
        send({ type: 'ping', timestamp: Date.now() })
      }
    }, heartbeatInterval)
  }
  
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }
  
  const getConnectionInfo = () => ({
    isConnected: isConnected.value,
    connectionId: connectionId.value,
    reconnectAttempts: reconnectAttempts.value,
    messageCount: messageHistory.value.length,
    lastMessageAt: messageHistory.value[messageHistory.value.length - 1]?.timestamp
  })
  
  onMounted(connect)
  onUnmounted(disconnect)
  
  return {
    isConnected: readonly(isConnected),
    lastMessage: readonly(lastMessage),
    messageHistory: readonly(messageHistory),
    send,
    connect,
    disconnect,
    getConnectionInfo
  }
}

// Helper functions
async function verifyJWT(token: string): Promise<any> {
  // JWT verification implementation
  return { id: '1', email: 'user@example.com' }
}