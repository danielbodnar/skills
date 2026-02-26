// Nuxt 4 testing patterns with Vitest and Playwright

// 1. Basic test setup (test/setup.ts)
import { beforeAll, afterAll } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'

beforeAll(async () => {
  await setup({
    // Nuxt configuration for testing
    nuxtConfig: {
      modules: ['@pinia/nuxt'],
      ssr: true
    }
  })
})

afterAll(async () => {
  // Cleanup after tests
})

// 2. Component testing (test/components/AppButton.test.ts)
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '~/components/AppButton.vue'

describe('AppButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('bg-blue-600')
  })
  
  it('applies variant classes correctly', () => {
    const wrapper = mount(AppButton, {
      props: {
        variant: 'danger'
      },
      slots: {
        default: 'Delete'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-red-600')
  })
  
  it('emits click event when clicked', async () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('does not emit click when disabled', async () => {
    const wrapper = mount(AppButton, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeFalsy()
  })
  
  it('shows loading state', () => {
    const wrapper = mount(AppButton, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading'
      }
    })
    
    expect(wrapper.find('[name="loader"]').exists()).toBe(true)
  })
})

// 3. Composable testing (test/composables/useCounter.test.ts)
import { describe, it, expect } from 'vitest'
import { useCounter } from '~/composables/useCounter'

describe('useCounter', () => {
  it('initializes with zero', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })
  
  it('increments count', () => {
    const { count, increment } = useCounter()
    
    increment()
    expect(count.value).toBe(1)
    
    increment()
    expect(count.value).toBe(2)
  })
  
  it('decrements count', () => {
    const { count, increment, decrement } = useCounter()
    
    increment()
    increment()
    decrement()
    
    expect(count.value).toBe(1)
  })
  
  it('resets count to zero', () => {
    const { count, increment, reset } = useCounter()
    
    increment()
    increment()
    reset()
    
    expect(count.value).toBe(0)
  })
})

// 4. API route testing (test/server/api/users.test.ts)
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('/api/users', () => {
  beforeEach(async () => {
    await setup()
  })
  
  it('returns list of users', async () => {
    const users = await $fetch('/api/users')
    
    expect(users).toHaveProperty('data')
    expect(users).toHaveProperty('pagination')
    expect(Array.isArray(users.data)).toBe(true)
  })
  
  it('creates a new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    }
    
    const response = await $fetch('/api/users', {
      method: 'POST',
      body: userData
    })
    
    expect(response.success).toBe(true)
    expect(response.data).toMatchObject(userData)
    expect(response.data).toHaveProperty('id')
  })
  
  it('validates user data on creation', async () => {
    const invalidData = {
      name: 'A', // Too short
      email: 'invalid-email',
      age: 16 // Too young
    }
    
    try {
      await $fetch('/api/users', {
        method: 'POST',
        body: invalidData
      })
    } catch (error: any) {
      expect(error.response.status).toBe(400)
      expect(error.response._data.success).toBe(false)
      expect(error.response._data.errors).toBeDefined()
    }
  })
  
  it('handles pagination correctly', async () => {
    const response = await $fetch('/api/users?page=2&limit=5')
    
    expect(response.pagination.page).toBe(2)
    expect(response.pagination.limit).toBe(5)
  })
})

// 5. Page testing with Nuxt Test Utils (test/pages/index.test.ts)
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('Index Page', () => {
  it('renders welcome message', async () => {
    const component = await mountSuspended(IndexPage)
    
    expect(component.text()).toContain('Welcome to Nuxt 4')
  })
  
  it('has proper meta tags', async () => {
    const component = await mountSuspended(IndexPage)
    
    // Test that useHead was called with correct values
    expect(component.vm.$head).toMatchObject({
      title: 'Home Page'
    })
  })
})

// 6. Store testing with Pinia (test/stores/main.test.ts)
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMainStore } from '~/stores/main'

describe('Main Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with default values', () => {
    const store = useMainStore()
    
    expect(store.count).toBe(0)
    expect(store.name).toBe('Nuxt')
  })
  
  it('increments count', () => {
    const store = useMainStore()
    
    store.increment()
    expect(store.count).toBe(1)
  })
  
  it('computes doubled count correctly', () => {
    const store = useMainStore()
    
    store.count = 5
    expect(store.doubledCount).toBe(10)
  })
})

// 7. Middleware testing (test/middleware/auth.test.ts)
import { describe, it, expect, vi } from 'vitest'
import { createMockNuxtContext } from '@nuxt/test-utils/runtime'
import authMiddleware from '~/middleware/auth'

// Mock the useAuth composable
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { value: null },
    isLoggedIn: false
  }))
}))

describe('Auth Middleware', () => {
  it('redirects to login when user is not authenticated', async () => {
    const mockContext = createMockNuxtContext({
      route: { path: '/dashboard' }
    })
    
    const navigateTo = vi.fn()
    vi.stubGlobal('navigateTo', navigateTo)
    
    await authMiddleware(mockContext.to, mockContext.from)
    
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })
  
  it('allows access when user is authenticated', async () => {
    // Mock authenticated user
    const { useAuth } = await import('~/composables/useAuth')
    vi.mocked(useAuth).mockReturnValue({
      user: { value: { id: '1', email: 'user@example.com' } },
      isLoggedIn: true
    } as any)
    
    const mockContext = createMockNuxtContext({
      route: { path: '/dashboard' }
    })
    
    const navigateTo = vi.fn()
    vi.stubGlobal('navigateTo', navigateTo)
    
    await authMiddleware(mockContext.to, mockContext.from)
    
    expect(navigateTo).not.toHaveBeenCalled()
  })
})

// 8. E2E testing with Playwright (test/e2e/auth.spec.ts)
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can login successfully', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to login page
    await page.click('text=Login')
    await expect(page).toHaveURL('/login')
    
    // Fill login form
    await page.fill('[data-testid="email"]', 'user@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Check successful login
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'invalid@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })
  
  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'user@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=Login')).toBeVisible()
  })
})

// 9. Mock utilities (test/utils/mocks.ts)
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
  role: 'user',
  ...overrides
})

export const createMockApiResponse = <T>(data: T, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Mock error message',
  message: success ? 'Success' : 'Error occurred'
})

export const mockFetch = (response: any, shouldError = false) => {
  global.fetch = vi.fn(() => {
    if (shouldError) {
      return Promise.reject(new Error('Network error'))
    }
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      status: 200,
      statusText: 'OK'
    } as Response)
  })
}

// 10. Test configuration files

// vitest.config.ts
/*
import { defineConfig } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'components/**/*.{vue,js,ts}',
        'composables/**/*.{js,ts}',
        'pages/**/*.vue',
        'server/**/*.{js,ts}'
      ],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true,
          indexedDb: true
        }
      }
    }
  }
})
*/

// playwright.config.ts
/*
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
*/

// Test utilities for custom assertions
export const expectValidUser = (user: any) => {
  expect(user).toHaveProperty('id')
  expect(user).toHaveProperty('email')
  expect(user).toHaveProperty('name')
  expect(typeof user.id).toBe('string')
  expect(typeof user.email).toBe('string')
  expect(typeof user.name).toBe('string')
}

export const expectValidApiResponse = (response: any) => {
  expect(response).toHaveProperty('success')
  expect(typeof response.success).toBe('boolean')
  
  if (response.success) {
    expect(response).toHaveProperty('data')
  } else {
    expect(response).toHaveProperty('error')
  }
}