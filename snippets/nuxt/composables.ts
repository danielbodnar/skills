// Nuxt 4 composables and data fetching patterns

// 1. Basic data fetching composable (composables/useApi.ts)
export const useApi = () => {
  const config = useRuntimeConfig()
  
  const $api = $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ request, options }) {
      // Add auth token to requests
      const token = useCookie('auth-token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    onResponseError({ response }) {
      // Handle global error responses
      if (response.status === 401) {
        navigateTo('/login')
      }
    }
  })
  
  return { $api }
}

// 2. Advanced data fetching with caching (composables/useUsers.ts)
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UsersQuery {
  page?: number
  limit?: number
  search?: string
}

export const useUsers = (query: Ref<UsersQuery> = ref({})) => {
  const { $api } = useApi()
  
  const { data, pending, error, refresh } = useFetch<{
    users: User[]
    pagination: {
      page: number
      limit: number
      total: number
      hasMore: boolean
    }
  }>('/users', {
    baseURL: '/api',
    query,
    key: 'users',
    transform: (data: any) => {
      // Transform server response
      return {
        users: data.data || [],
        pagination: data.pagination || {}
      }
    },
    default: () => ({
      users: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false }
    })
  })
  
  const users = computed(() => data.value?.users || [])
  const pagination = computed(() => data.value?.pagination || {})
  
  const getUserById = async (id: string): Promise<User | null> => {
    try {
      return await $api(`/users/${id}`)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      return null
    }
  }
  
  const createUser = async (userData: Omit<User, 'id'>): Promise<User | null> => {
    try {
      const newUser = await $api('/users', {
        method: 'POST',
        body: userData
      })
      
      // Refresh the list
      await refresh()
      
      return newUser
    } catch (error) {
      console.error('Failed to create user:', error)
      return null
    }
  }
  
  const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
    try {
      const updatedUser = await $api(`/users/${id}`, {
        method: 'PATCH',
        body: userData
      })
      
      await refresh()
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      return null
    }
  }
  
  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      await $api(`/users/${id}`, { method: 'DELETE' })
      await refresh()
      return true
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }
  
  return {
    users,
    pagination,
    pending,
    error,
    refresh,
    getUserById,
    createUser,
    updateUser,
    deleteUser
  }
}

// 3. Authentication composable (composables/useAuth.ts)
interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

interface LoginCredentials {
  email: string
  password: string
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth.user', () => null)
  const token = useCookie('auth-token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  const isLoggedIn = computed(() => !!user.value)
  
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      token.value = response.token
      
      return { success: true, user: response.user }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.data?.message || 'Login failed' 
      }
    }
  }
  
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      token.value = null
      await navigateTo('/login')
    }
  }
  
  const register = async (userData: LoginCredentials & { name: string }) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData
      })
      
      user.value = response.user
      token.value = response.token
      
      return { success: true, user: response.user }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.data?.message || 'Registration failed' 
      }
    }
  }
  
  const refreshUser = async () => {
    if (!token.value) return
    
    try {
      const response = await $fetch('/api/auth/me')
      user.value = response.user
    } catch (error) {
      // Token might be invalid
      user.value = null
      token.value = null
    }
  }
  
  // Check auth status on app start
  const initAuth = async () => {
    if (token.value && !user.value) {
      await refreshUser()
    }
  }
  
  return {
    user: readonly(user),
    isLoggedIn,
    login,
    logout,
    register,
    refreshUser,
    initAuth
  }
}

// 4. Local storage composable (composables/useLocalStorage.ts)
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T,
  options: {
    serializer?: {
      read: (value: string) => T
      write: (value: T) => string
    }
  } = {}
) => {
  const {
    serializer = {
      read: JSON.parse,
      write: JSON.stringify
    }
  } = options
  
  const storedValue = process.client ? localStorage.getItem(key) : null
  
  const state = ref(
    storedValue !== null 
      ? serializer.read(storedValue)
      : defaultValue
  )
  
  const setValue = (value: T) => {
    state.value = value
    if (process.client) {
      localStorage.setItem(key, serializer.write(value))
    }
  }
  
  const removeValue = () => {
    state.value = defaultValue
    if (process.client) {
      localStorage.removeItem(key)
    }
  }
  
  // Watch for changes and sync to localStorage
  watch(state, (newValue) => {
    if (process.client) {
      localStorage.setItem(key, serializer.write(newValue))
    }
  }, { deep: true })
  
  return [readonly(state), setValue, removeValue] as const
}

// 5. Theme composable (composables/useTheme.ts)
type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const theme = useCookie<Theme>('theme', {
    default: () => 'system',
    sameSite: 'strict'
  })
  
  const isDark = computed(() => {
    if (theme.value === 'system') {
      return process.client ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
    }
    return theme.value === 'dark'
  })
  
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }
  
  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }
  
  // Apply theme class to document
  watch(isDark, (dark) => {
    if (process.client) {
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, { immediate: true })
  
  // Listen for system theme changes
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        // Trigger reactivity
        theme.value = 'system'
      }
    })
  })
  
  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme
  }
}

// 6. Todo list composable (composables/useTodos.ts)
interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

export const useTodos = () => {
  const todos = ref<Todo[]>([])
  
  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date()
    }
    todos.value.push(newTodo)
  }
  
  const removeTodo = (id: string) => {
    const index = todos.value.findIndex(todo => todo.id === id)
    if (index > -1) {
      todos.value.splice(index, 1)
    }
  }
  
  const toggleTodo = (id: string) => {
    const todo = todos.value.find(todo => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }
  
  const updateTodo = (id: string, text: string) => {
    const todo = todos.value.find(todo => todo.id === id)
    if (todo) {
      todo.text = text
    }
  }
  
  const clearCompleted = () => {
    todos.value = todos.value.filter(todo => !todo.completed)
  }
  
  const completedCount = computed(() => 
    todos.value.filter(todo => todo.completed).length
  )
  
  const pendingCount = computed(() => 
    todos.value.filter(todo => !todo.completed).length
  )
  
  const allCompleted = computed(() => 
    todos.value.length > 0 && todos.value.every(todo => todo.completed)
  )
  
  return {
    todos: readonly(todos),
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    clearCompleted,
    completedCount,
    pendingCount,
    allCompleted
  }
}

// 7. Form validation composable (composables/useForm.ts)
import { z } from 'zod'

export const useForm = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) => {
  const values = reactive({ ...initialValues })
  const errors = reactive({} as Record<keyof T, string>)
  const touched = reactive({} as Record<keyof T, boolean>)
  
  const isValid = computed(() => {
    try {
      schema.parse(values)
      return true
    } catch {
      return false
    }
  })
  
  const validateField = (field: keyof T) => {
    try {
      schema.pick({ [field]: true }).parse({ [field]: values[field] })
      errors[field] = ''
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors[field] = error.errors[0].message
      }
    }
    touched[field] = true
  }
  
  const validateAll = () => {
    try {
      schema.parse(values)
      Object.keys(errors).forEach(key => {
        errors[key as keyof T] = ''
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path[0] as keyof T
          errors[field] = err.message
          touched[field] = true
        })
      }
      return false
    }
  }
  
  const reset = () => {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach(key => {
      errors[key as keyof T] = ''
      touched[key as keyof T] = false
    })
  }
  
  const setValue = (field: keyof T, value: any) => {
    values[field] = value
    if (touched[field]) {
      validateField(field)
    }
  }
  
  return {
    values,
    errors: readonly(errors),
    touched: readonly(touched),
    isValid,
    validateField,
    validateAll,
    reset,
    setValue
  }
}

// 8. Debounced search composable (composables/useSearch.ts)
export const useSearch = <T>(
  searchFn: (query: string) => Promise<T[]>,
  options: {
    debounceMs?: number
    minLength?: number
  } = {}
) => {
  const { debounceMs = 300, minLength = 2 } = options
  
  const query = ref('')
  const results = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const debouncedQuery = refDebounced(query, debounceMs)
  
  const search = async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      results.value = []
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      results.value = await searchFn(searchQuery)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Search failed'
      results.value = []
    } finally {
      loading.value = false
    }
  }
  
  watch(debouncedQuery, search)
  
  const clearSearch = () => {
    query.value = ''
    results.value = []
    error.value = null
  }
  
  return {
    query,
    results: readonly(results),
    loading: readonly(loading),
    error: readonly(error),
    clearSearch
  }
}

// 9. WebSocket composable (composables/useWebSocket.ts)
export const useWebSocket = (url: string) => {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const lastMessage = ref<any>(null)
  const error = ref<string | null>(null)
  
  const connect = () => {
    if (process.client) {
      socket.value = new WebSocket(url)
      
      socket.value.onopen = () => {
        isConnected.value = true
        error.value = null
      }
      
      socket.value.onmessage = (event) => {
        try {
          lastMessage.value = JSON.parse(event.data)
        } catch {
          lastMessage.value = event.data
        }
      }
      
      socket.value.onclose = () => {
        isConnected.value = false
      }
      
      socket.value.onerror = () => {
        error.value = 'WebSocket connection error'
      }
    }
  }
  
  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
      isConnected.value = false
    }
  }
  
  const send = (data: any) => {
    if (socket.value && isConnected.value) {
      socket.value.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }
  
  onMounted(connect)
  onUnmounted(disconnect)
  
  return {
    isConnected: readonly(isConnected),
    lastMessage: readonly(lastMessage),
    error: readonly(error),
    send,
    connect,
    disconnect
  }
}

// 10. Infinite scroll composable (composables/useInfiniteScroll.ts)
export const useInfiniteScroll = <T>(
  fetchFn: (page: number) => Promise<{ items: T[], hasMore: boolean }>,
  options: {
    initialPage?: number
    enabled?: Ref<boolean>
  } = {}
) => {
  const { initialPage = 1, enabled = ref(true) } = options
  
  const items = ref<T[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(initialPage)
  const error = ref<string | null>(null)
  
  const loadMore = async () => {
    if (!enabled.value || loading.value || !hasMore.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const result = await fetchFn(page.value)
      
      if (page.value === initialPage) {
        items.value = result.items
      } else {
        items.value.push(...result.items)
      }
      
      hasMore.value = result.hasMore
      page.value++
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load items'
    } finally {
      loading.value = false
    }
  }
  
  const reset = () => {
    items.value = []
    page.value = initialPage
    hasMore.value = true
    error.value = null
  }
  
  const refresh = async () => {
    reset()
    await loadMore()
  }
  
  // Auto-load initial page
  onMounted(() => {
    if (enabled.value) {
      loadMore()
    }
  })
  
  return {
    items: readonly(items),
    loading: readonly(loading),
    hasMore: readonly(hasMore),
    error: readonly(error),
    loadMore,
    reset,
    refresh
  }
}