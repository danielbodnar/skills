// Vue 3 Component Type Definitions
import type { App, Component, ComputedRef, Ref, UnwrapRef } from 'vue'

// Basic component props interface
export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, string>
  id?: string
}

// Common data structures
export interface User {
  id: number | string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'moderator'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Todo {
  id: number | string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  data: T
  message: string
  success: boolean
  errors?: string[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface FormField {
  value: any
  rules: ValidationRule[]
  error?: string
  touched: boolean
  valid: boolean
}

export interface FormState {
  fields: Record<string, FormField>
  isValid: boolean
  isSubmitting: boolean
  errors: Record<string, string>
}

// Navigation and routing types
export interface NavItem {
  id: string
  label: string
  path: string
  icon?: string
  children?: NavItem[]
  meta?: {
    requiresAuth?: boolean
    roles?: string[]
    exact?: boolean
  }
}

export interface BreadcrumbItem {
  label: string
  path?: string
  active?: boolean
}

// Theme and UI types
export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  error: string
  warning: string
  success: string
  info: string
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto'
  sidebarOpen: boolean
  loading: boolean
  notifications: Notification[]
  modals: Record<string, boolean>
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  createdAt: Date
}

export interface NotificationAction {
  label: string
  handler: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// Data table types
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any, row: any) => string
}

export interface TableFilter {
  column: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt'
  value: any
}

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
}

export interface TableState {
  data: any[]
  columns: TableColumn[]
  filters: TableFilter[]
  sort: TableSort[]
  pagination: {
    page: number
    limit: number
    total: number
  }
  loading: boolean
  selected: any[]
}

// File upload types
export interface FileUpload {
  file: File
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  error?: string
}

// Chart and data visualization types
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
}

export interface ChartOptions {
  responsive: boolean
  plugins: {
    legend: {
      display: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    tooltip: {
      enabled: boolean
    }
  }
  scales?: {
    x?: ChartScale
    y?: ChartScale
  }
}

export interface ChartScale {
  display: boolean
  title?: {
    display: boolean
    text: string
  }
  min?: number
  max?: number
}

// Composable return types
export interface UseAsyncReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

export interface UseFormReturn<T> {
  values: UnwrapRef<T>
  errors: Ref<Record<keyof T, string>>
  touched: Ref<Record<keyof T, boolean>>
  isValid: ComputedRef<boolean>
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
  resetForm: () => void
  validateForm: () => boolean
}

export interface UseLocalStorageReturn<T> {
  value: Ref<T>
  remove: () => void
  set: (newValue: T) => void
}

export interface UseToggleReturn {
  state: Ref<boolean>
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
}

// Event handler types
export interface ComponentEvents {
  click: (event: MouseEvent) => void
  input: (value: string) => void
  change: (value: any) => void
  submit: (data: any) => void
  cancel: () => void
  delete: (id: string | number) => void
  update: (data: any) => void
  select: (item: any) => void
}

// Prop types for common components
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  icon?: string
  iconPosition?: 'left' | 'right'
}

export interface InputProps extends BaseComponentProps {
  modelValue: any
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  label?: string
  hint?: string
}

export interface SelectProps extends BaseComponentProps {
  modelValue: any
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  error?: string
  label?: string
}

export interface SelectOption {
  value: any
  label: string
  disabled?: boolean
  group?: string
}

export interface CardProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  image?: string
  imageAlt?: string
  hoverable?: boolean
  clickable?: boolean
  loading?: boolean
}

export interface ModalProps extends BaseComponentProps {
  modelValue: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  persistent?: boolean
  closable?: boolean
  overlay?: boolean
}

export interface TabsProps extends BaseComponentProps {
  modelValue: string | number
  tabs: TabItem[]
  variant?: 'default' | 'pills' | 'underline'
  vertical?: boolean
}

export interface TabItem {
  key: string | number
  label: string
  icon?: string
  disabled?: boolean
  badge?: string | number
}

// Plugin types
export interface PluginOptions {
  [key: string]: any
}

export interface VuePlugin {
  install: (app: App, options?: PluginOptions) => void
}

// Store types (Pinia)
export interface StoreDefinition {
  id: string
  state?: () => any
  getters?: Record<string, any>
  actions?: Record<string, any>
}

// Router types
export interface RouteConfig {
  path: string
  name?: string
  component: Component
  children?: RouteConfig[]
  meta?: RouteMeta
  beforeEnter?: NavigationGuard
}

export interface RouteMeta {
  requiresAuth?: boolean
  roles?: string[]
  title?: string
  description?: string
  layout?: string
}

export interface NavigationGuard {
  (to: any, from: any, next: any): void
}

// Testing types
export interface ComponentWrapper {
  vm: any
  element: HTMLElement
  find: (selector: string) => ComponentWrapper
  findAll: (selector: string) => ComponentWrapper[]
  trigger: (event: string) => Promise<void>
  setProps: (props: any) => Promise<void>
  setValue: (value: any) => Promise<void>
  exists: () => boolean
}

export interface TestContext {
  wrapper: ComponentWrapper
  component: any
  props: any
  slots: any
  mocks: any
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type WithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}

export type WithId<T> = T & {
  id: string | number
}

// Global augmentations
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: any
    $auth: any
    $router: any
    $route: any
    $store: any
    $t: (key: string, params?: any) => string
  }
  
  interface GlobalProperties {
    $formatDate: (date: Date, format?: string) => string
    $formatCurrency: (amount: number, currency?: string) => string
    $truncate: (text: string, length: number) => string
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
    title?: string
    description?: string
    layout?: string
    breadcrumb?: BreadcrumbItem[]
  }
}