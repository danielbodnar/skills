// Nuxt 4 TypeScript type definitions and interfaces

// Global type augmentations
declare global {
  interface Window {
    // Analytics
    gtag?: (...args: any[]) => void
    plausible?: (...args: any[]) => void
    
    // Payment processors
    Stripe?: any
    PayPal?: any
    
    // Social integrations
    FB?: any
    gapi?: any
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createdAt: string
  updatedAt: string
  emailVerified: boolean
  lastLoginAt?: string
}

export type UserRole = 'admin' | 'user' | 'moderator' | 'editor'

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  avatar?: string
  role?: UserRole
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
  expiresAt: string
}

export interface JWTPayload {
  sub: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

// Component Props Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: string
  type?: 'button' | 'submit' | 'reset'
}

export interface ModalProps {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  persistent?: boolean
  hideCloseButton?: boolean
}

export interface FormFieldProps {
  modelValue: any
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: string
  hint?: string
}

// Data Fetching Types
export interface UseFetchOptions<T> {
  key?: string
  baseURL?: string
  query?: Record<string, any>
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  transform?: (data: any) => T
  default?: () => T
  server?: boolean
  lazy?: boolean
  immediate?: boolean
}

export interface AsyncDataOptions<T> {
  key?: string
  server?: boolean
  default?: () => T
  transform?: (data: any) => T
  lazy?: boolean
}

// Store Types (Pinia)
export interface StoreState {
  // Global app state
  loading: boolean
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timeout?: number
  persistent?: boolean
}

// Route Types
export interface RouteMiddleware {
  (to: any, from: any): Promise<void> | void
}

export interface PageMeta {
  title?: string
  description?: string
  layout?: string
  middleware?: string | string[]
  auth?: boolean
  roles?: UserRole[]
  keepAlive?: boolean
}

// Module Types
export interface NuxtModule<TOptions = any> {
  meta: {
    name: string
    configKey?: string
    compatibility?: {
      nuxt?: string
      bridge?: boolean
    }
  }
  defaults?: TOptions | ((nuxt: any) => TOptions)
  schema?: any
  hooks?: Record<string, Function>
  setup?: (options: TOptions, nuxt: any) => Promise<void> | void
}

export interface ModuleOptions {
  [key: string]: any
}

// Configuration Types
export interface RuntimeConfig {
  // Private config (server-only)
  apiSecret: string
  databaseUrl: string
  jwtSecret: string
  
  // Public config (client + server)
  public: {
    apiBase: string
    siteUrl: string
    appName: string
    version: string
  }
}

export interface AppConfig {
  theme: {
    primaryColor: string
    darkMode: 'class' | 'media'
  }
  ui: {
    primary: string
    gray: string
  }
  seo: {
    siteName: string
    siteDescription: string
    twitterHandle?: string
  }
}

// SEO Types
export interface SeoMeta {
  title?: string
  description?: string
  keywords?: string
  author?: string
  robots?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  twitterCreator?: string
}

// Error Types
export interface NuxtError {
  statusCode: number
  statusMessage: string
  data?: any
  stack?: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// Event Types
export interface AppEvent {
  type: string
  payload?: any
  timestamp: number
}

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  anonymousId?: string
}

// WebSocket Types
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: number
  id?: string
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

// File Upload Types
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export interface FileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  multiple?: boolean
  immediate?: boolean
}

// Payment Types
export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  paymentMethod?: string
  metadata?: Record<string, any>
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

// Content Types (for @nuxt/content)
export interface ContentDocument {
  _path: string
  _id: string
  _type: string
  title: string
  description?: string
  body: any
  createdAt: string
  updatedAt: string
  tags?: string[]
  published?: boolean
}

export interface ContentQueryBuilder {
  where(query: Record<string, any>): ContentQueryBuilder
  only(fields: string[]): ContentQueryBuilder
  without(fields: string[]): ContentQueryBuilder
  sort(options: Record<string, 1 | -1>): ContentQueryBuilder
  limit(count: number): ContentQueryBuilder
  skip(count: number): ContentQueryBuilder
  find(): Promise<ContentDocument[]>
  findOne(): Promise<ContentDocument | null>
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Awaitable<T> = T | Promise<T>

export type MaybeRef<T> = T | Ref<T>

export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)

// Composable Return Types
export interface UseApiReturn {
  $api: typeof $fetch
}

export interface UseAuthReturn {
  user: Readonly<Ref<User | null>>
  isLoggedIn: ComputedRef<boolean>
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

export interface UseThemeReturn {
  theme: Readonly<Ref<'light' | 'dark' | 'system'>>
  isDark: Readonly<Ref<boolean>>
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
}

// Extend Nuxt types
declare module '@nuxt/schema' {
  interface AppConfigInput {
    myModule?: {
      theme: 'light' | 'dark'
      apiUrl: string
    }
  }
  
  interface RuntimeConfig {
    mySecret: string
    public: {
      myPublicConfig: string
    }
  }
}

declare module 'nuxt/app' {
  interface NuxtApp {
    $analytics: {
      track: (event: AnalyticsEvent) => void
      identify: (userId: string, traits?: Record<string, any>) => void
    }
    $payment: {
      createIntent: (amount: number, currency: string) => Promise<PaymentIntent>
      confirmPayment: (intentId: string) => Promise<boolean>
    }
  }
}

// Vue component types
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: typeof $fetch
    $analytics: NuxtApp['$analytics']
    $payment: NuxtApp['$payment']
  }
}

export {} // Make this a module