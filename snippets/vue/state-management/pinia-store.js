// stores/counter.js - Basic counter store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Counter')

  // Getters (computed values)
  const doubleCount = computed(() => count.value * 2)
  const isPositive = computed(() => count.value > 0)
  const isNegative = computed(() => count.value < 0)

  // Actions
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function incrementBy(amount) {
    count.value += amount
  }

  function reset() {
    count.value = 0
  }

  function setName(newName) {
    name.value = newName
  }

  return {
    // State
    count,
    name,
    // Getters
    doubleCount,
    isPositive,
    isNegative,
    // Actions
    increment,
    decrement,
    incrementBy,
    reset,
    setName
  }
})

// stores/user.js - User authentication store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const userName = computed(() => user.value?.name || 'Guest')
  const userRole = computed(() => user.value?.role || 'user')
  const isAdmin = computed(() => userRole.value === 'admin')

  // Actions
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock response
      const mockUser = {
        id: 1,
        name: credentials.username,
        email: credentials.username + '@example.com',
        role: credentials.username === 'admin' ? 'admin' : 'user',
        avatar: 'https://via.placeholder.com/100'
      }

      const mockToken = 'mock-jwt-token-' + Date.now()

      user.value = mockUser
      token.value = mockToken
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))

      return mockUser
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return

    loading.value = true
    error.value = null

    try {
      // Try to get user from localStorage first
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        user.value = JSON.parse(savedUser)
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock user data
      user.value = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        avatar: 'https://via.placeholder.com/100'
      }
    } catch (err) {
      error.value = err.message
      // Clear invalid token
      token.value = null
      localStorage.removeItem('token')
    } finally {
      loading.value = false
    }
  }

  function updateProfile(updates) {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    userName,
    userRole,
    isAdmin,
    // Actions
    login,
    logout,
    fetchProfile,
    updateProfile,
    clearError
  }
})

// stores/todos.js - Todo list store with persistence
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTodosStore = defineStore('todos', () => {
  // State
  const todos = ref([])
  const filter = ref('all') // 'all', 'active', 'completed'
  const loading = ref(false)

  // Getters
  const filteredTodos = computed(() => {
    switch (filter.value) {
      case 'active':
        return todos.value.filter(todo => !todo.completed)
      case 'completed':
        return todos.value.filter(todo => todo.completed)
      default:
        return todos.value
    }
  })

  const totalCount = computed(() => todos.value.length)
  const activeCount = computed(() => todos.value.filter(todo => !todo.completed).length)
  const completedCount = computed(() => todos.value.filter(todo => todo.completed).length)
  const hasCompleted = computed(() => completedCount.value > 0)
  const allCompleted = computed(() => totalCount.value > 0 && activeCount.value === 0)

  // Actions
  function addTodo(text) {
    if (!text.trim()) return

    const todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    todos.value.push(todo)
    saveTodos()
  }

  function removeTodo(id) {
    const index = todos.value.findIndex(todo => todo.id === id)
    if (index > -1) {
      todos.value.splice(index, 1)
      saveTodos()
    }
  }

  function toggleTodo(id) {
    const todo = todos.value.find(todo => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.updatedAt = new Date()
      saveTodos()
    }
  }

  function updateTodo(id, updates) {
    const todo = todos.value.find(todo => todo.id === id)
    if (todo) {
      Object.assign(todo, updates, { updatedAt: new Date() })
      saveTodos()
    }
  }

  function clearCompleted() {
    todos.value = todos.value.filter(todo => !todo.completed)
    saveTodos()
  }

  function toggleAll() {
    const shouldComplete = !allCompleted.value
    todos.value.forEach(todo => {
      todo.completed = shouldComplete
      todo.updatedAt = new Date()
    })
    saveTodos()
  }

  function setFilter(newFilter) {
    if (['all', 'active', 'completed'].includes(newFilter)) {
      filter.value = newFilter
    }
  }

  function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos.value))
  }

  function loadTodos() {
    const saved = localStorage.getItem('todos')
    if (saved) {
      todos.value = JSON.parse(saved).map(todo => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt)
      }))
    }
  }

  async function fetchTodos() {
    loading.value = true
    
    try {
      // First try to load from localStorage
      loadTodos()
      
      // Simulate API call for fresh data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, you would merge or replace with server data
      console.log('Todos synced with server')
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      loading.value = false
    }
  }

  // Initialize todos on store creation
  loadTodos()

  return {
    // State
    todos,
    filter,
    loading,
    // Getters
    filteredTodos,
    totalCount,
    activeCount,
    completedCount,
    hasCompleted,
    allCompleted,
    // Actions
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    clearCompleted,
    toggleAll,
    setFilter,
    fetchTodos,
    loadTodos,
    saveTodos
  }
})

// stores/theme.js - Theme and UI state store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref(localStorage.getItem('theme') || 'light')
  const sidebarOpen = ref(false)
  const notifications = ref([])
  const preferences = ref({
    fontSize: 'medium',
    animations: true,
    sound: false,
    language: 'en'
  })

  // Getters
  const isDark = computed(() => theme.value === 'dark')
  const bodyClass = computed(() => `theme-${theme.value}`)
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read).length
  )

  // Actions
  function setTheme(newTheme) {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      theme.value = newTheme
      localStorage.setItem('theme', newTheme)
      updateBodyClass()
    }
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      read: false,
      createdAt: new Date(),
      type: 'info',
      ...notification
    }
    notifications.value.unshift(newNotification)
    
    // Auto-remove after 5 seconds for temporary notifications
    if (newNotification.temporary !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function markNotificationRead(id) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function markAllNotificationsRead() {
    notifications.value.forEach(n => n.read = true)
  }

  function clearNotifications() {
    notifications.value = []
  }

  function updatePreference(key, value) {
    preferences.value[key] = value
    localStorage.setItem('preferences', JSON.stringify(preferences.value))
  }

  function loadPreferences() {
    const saved = localStorage.getItem('preferences')
    if (saved) {
      preferences.value = { ...preferences.value, ...JSON.parse(saved) }
    }
  }

  function updateBodyClass() {
    document.body.className = bodyClass.value
  }

  // Initialize
  loadPreferences()
  updateBodyClass()

  return {
    // State
    theme,
    sidebarOpen,
    notifications,
    preferences,
    // Getters
    isDark,
    bodyClass,
    unreadNotifications,
    // Actions
    setTheme,
    toggleTheme,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    addNotification,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    updatePreference,
    loadPreferences
  }
})

// stores/api.js - API management store
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useApiStore = defineStore('api', () => {
  // State
  const baseURL = ref(import.meta.env.VITE_API_BASE_URL || 'https://api.example.com')
  const requestsInFlight = ref(new Map())
  const cache = ref(new Map())
  const rateLimitRemaining = ref(100)
  const rateLimitReset = ref(null)

  // Actions
  async function makeRequest(endpoint, options = {}) {
    const url = `${baseURL.value}${endpoint}`
    const requestKey = `${options.method || 'GET'}-${url}`
    
    // Check if request is already in flight
    if (requestsInFlight.value.has(requestKey)) {
      return requestsInFlight.value.get(requestKey)
    }

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      if (cache.value.has(url)) {
        const cached = cache.value.get(url)
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.data
        }
      }
    }

    const requestPromise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }).then(async response => {
      // Update rate limit info
      rateLimitRemaining.value = parseInt(response.headers.get('X-RateLimit-Remaining') || '100')
      rateLimitReset.value = new Date(response.headers.get('X-RateLimit-Reset'))

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Cache GET requests
      if (!options.method || options.method === 'GET') {
        cache.value.set(url, {
          data,
          timestamp: Date.now()
        })
      }

      return data
    }).finally(() => {
      requestsInFlight.value.delete(requestKey)
    })

    requestsInFlight.value.set(requestKey, requestPromise)
    return requestPromise
  }

  function clearCache() {
    cache.value.clear()
  }

  function removeCacheEntry(url) {
    cache.value.delete(url)
  }

  function setBaseURL(url) {
    baseURL.value = url
  }

  return {
    // State
    baseURL,
    requestsInFlight,
    cache,
    rateLimitRemaining,
    rateLimitReset,
    // Actions
    makeRequest,
    clearCache,
    removeCacheEntry,
    setBaseURL
  }
})

// main.js - Store setup example
/*
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// Add Pinia plugins
pinia.use(({ store }) => {
  // Add $reset helper to all stores
  store.$reset = () => {
    const initial = store.$state
    store.$patch(($state) => {
      Object.assign($state, initial)
    })
  }
})

app.use(pinia)
app.mount('#app')
*/