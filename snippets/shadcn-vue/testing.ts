// shadcn-vue Testing Patterns and Examples

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

// Mock components for testing
const MockButton = {
  template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
  props: ['disabled'],
  emits: ['click']
}

const MockInput = {
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" :type="type" />',
  props: ['modelValue', 'placeholder', 'type'],
  emits: ['update:modelValue']
}

// 1. Basic Component Testing
describe('shadcn-vue Button Component', () => {
  it('renders correctly', () => {
    const wrapper = mount(MockButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('emits click event', async () => {
    const wrapper = mount(MockButton)
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('can be disabled', () => {
    const wrapper = mount(MockButton, {
      props: {
        disabled: true
      }
    })
    
    expect(wrapper.find('button').element.disabled).toBe(true)
  })
})

// 2. Form Component Testing
describe('shadcn-vue Form Components', () => {
  it('Input component updates model value', async () => {
    const wrapper = mount(MockInput, {
      props: {
        modelValue: '',
        placeholder: 'Enter text'
      }
    })
    
    const input = wrapper.find('input')
    await input.setValue('test value')
    
    expect(wrapper.emitted('update:modelValue')).toEqual([['test value']])
  })

  it('Input shows placeholder', () => {
    const wrapper = mount(MockInput, {
      props: {
        placeholder: 'Enter your email',
        type: 'email'
      }
    })
    
    const input = wrapper.find('input')
    expect(input.element.placeholder).toBe('Enter your email')
    expect(input.element.type).toBe('email')
  })
})

// 3. Dialog/Modal Testing
const MockDialog = {
  template: `
    <div v-if="open" class="dialog">
      <div class="dialog-content">
        <slot />
        <button @click="$emit('close')">Close</button>
      </div>
    </div>
  `,
  props: ['open'],
  emits: ['close']
}

describe('shadcn-vue Dialog Component', () => {
  it('shows when open is true', () => {
    const wrapper = mount(MockDialog, {
      props: {
        open: true
      },
      slots: {
        default: '<p>Dialog content</p>'
      }
    })
    
    expect(wrapper.find('.dialog').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dialog content')
  })

  it('hides when open is false', () => {
    const wrapper = mount(MockDialog, {
      props: {
        open: false
      }
    })
    
    expect(wrapper.find('.dialog').exists()).toBe(false)
  })

  it('emits close event', async () => {
    const wrapper = mount(MockDialog, {
      props: {
        open: true
      }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

// 4. Table Component Testing
const MockDataTable = {
  template: `
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.id">
          <td v-for="column in columns" :key="column.key">
            {{ row[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  `,
  props: ['columns', 'data']
}

describe('shadcn-vue Data Table Component', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' }
  ]

  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
  ]

  it('renders table headers correctly', () => {
    const wrapper = mount(MockDataTable, {
      props: {
        columns,
        data
      }
    })
    
    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(3)
    expect(headers[0].text()).toBe('Name')
    expect(headers[1].text()).toBe('Email')
    expect(headers[2].text()).toBe('Role')
  })

  it('renders table data correctly', () => {
    const wrapper = mount(MockDataTable, {
      props: {
        columns,
        data
      }
    })
    
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    
    const firstRowCells = rows[0].findAll('td')
    expect(firstRowCells[0].text()).toBe('John Doe')
    expect(firstRowCells[1].text()).toBe('john@example.com')
    expect(firstRowCells[2].text()).toBe('Admin')
  })
})

// 5. Chart Component Testing
const MockChart = {
  template: `
    <div class="chart" :style="{ width: width + 'px', height: height + 'px' }">
      <div v-for="item in processedData" :key="item.label" class="chart-item">
        {{ item.label }}: {{ item.value }}
      </div>
    </div>
  `,
  props: {
    data: Array,
    width: { type: Number, default: 400 },
    height: { type: Number, default: 300 },
    categories: Array,
    index: String
  },
  computed: {
    processedData() {
      return this.data.map(item => ({
        label: item[this.index],
        value: this.categories.reduce((sum, cat) => sum + item[cat], 0)
      }))
    }
  }
}

describe('shadcn-vue Chart Component', () => {
  const chartData = [
    { month: 'Jan', desktop: 186, mobile: 80 },
    { month: 'Feb', desktop: 305, mobile: 200 }
  ]

  it('renders chart with correct dimensions', () => {
    const wrapper = mount(MockChart, {
      props: {
        data: chartData,
        categories: ['desktop', 'mobile'],
        index: 'month',
        width: 500,
        height: 400
      }
    })
    
    const chart = wrapper.find('.chart')
    expect(chart.element.style.width).toBe('500px')
    expect(chart.element.style.height).toBe('400px')
  })

  it('processes data correctly', () => {
    const wrapper = mount(MockChart, {
      props: {
        data: chartData,
        categories: ['desktop', 'mobile'],
        index: 'month'
      }
    })
    
    const items = wrapper.findAll('.chart-item')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toBe('Jan: 266')
    expect(items[1].text()).toBe('Feb: 505')
  })
})

// 6. Integration Testing Example
const MockForm = {
  template: `
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="name">Name:</label>
        <input 
          id="name" 
          v-model="form.name" 
          :class="{ error: errors.name }"
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>
      
      <div>
        <label for="email">Email:</label>
        <input 
          id="email" 
          type="email" 
          v-model="form.email"
          :class="{ error: errors.email }"
        />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>
      
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
  `,
  data() {
    return {
      form: {
        name: '',
        email: ''
      },
      errors: {},
      isSubmitting: false
    }
  },
  methods: {
    validate() {
      this.errors = {}
      
      if (!this.form.name.trim()) {
        this.errors.name = 'Name is required'
      }
      
      if (!this.form.email.trim()) {
        this.errors.email = 'Email is required'
      } else if (!this.form.email.includes('@')) {
        this.errors.email = 'Email must be valid'
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    async handleSubmit() {
      if (!this.validate()) return
      
      this.isSubmitting = true
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.$emit('submit', this.form)
      } finally {
        this.isSubmitting = false
      }
    }
  },
  emits: ['submit']
}

describe('shadcn-vue Form Integration', () => {
  it('validates required fields', async () => {
    const wrapper = mount(MockForm)
    
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.text()).toContain('Email is required')
  })

  it('validates email format', async () => {
    const wrapper = mount(MockForm)
    
    await wrapper.find('#name').setValue('John Doe')
    await wrapper.find('#email').setValue('invalid-email')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    
    expect(wrapper.text()).toContain('Email must be valid')
  })

  it('submits form with valid data', async () => {
    const wrapper = mount(MockForm)
    
    await wrapper.find('#name').setValue('John Doe')
    await wrapper.find('#email').setValue('john@example.com')
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check loading state
    expect(wrapper.find('button').text()).toBe('Submitting...')
    expect(wrapper.find('button').element.disabled).toBe(true)
    
    // Wait for submission to complete
    await new Promise(resolve => setTimeout(resolve, 1100))
    await nextTick()
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0]).toEqual([{
      name: 'John Doe',
      email: 'john@example.com'
    }])
  })
})

// 7. Theme Testing
describe('shadcn-vue Theming', () => {
  it('applies theme classes correctly', () => {
    const wrapper = mount({
      template: '<div :class="themeClass">Themed content</div>',
      data() {
        return {
          theme: 'dark'
        }
      },
      computed: {
        themeClass() {
          return this.theme === 'dark' ? 'dark' : 'light'
        }
      }
    })
    
    expect(wrapper.classes()).toContain('dark')
  })

  it('switches themes correctly', async () => {
    const wrapper = mount({
      template: `
        <div :class="theme">
          <button @click="toggleTheme">Toggle Theme</button>
          <span class="theme-indicator">{{ theme }}</span>
        </div>
      `,
      data() {
        return {
          theme: 'light'
        }
      },
      methods: {
        toggleTheme() {
          this.theme = this.theme === 'light' ? 'dark' : 'light'
        }
      }
    })
    
    expect(wrapper.find('.theme-indicator').text()).toBe('light')
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.find('.theme-indicator').text()).toBe('dark')
    expect(wrapper.classes()).toContain('dark')
  })
})

// 8. Accessibility Testing Helpers
export const accessibilityHelpers = {
  // Check for proper ARIA labels
  hasAriaLabel: (wrapper: any, selector: string) => {
    const element = wrapper.find(selector)
    return element.exists() && element.attributes('aria-label')
  },

  // Check for proper keyboard navigation
  isKeyboardAccessible: async (wrapper: any, selector: string) => {
    const element = wrapper.find(selector)
    if (!element.exists()) return false

    await element.trigger('keydown', { key: 'Enter' })
    await element.trigger('keydown', { key: ' ' })
    
    return wrapper.emitted('click') || wrapper.emitted('keydown')
  },

  // Check focus management
  checkFocusManagement: (wrapper: any, selectors: string[]) => {
    const focusableElements = selectors.map(selector => wrapper.find(selector))
    return focusableElements.every(el => el.exists() && el.element.tabIndex >= 0)
  }
}

// 9. Performance Testing Helpers
export const performanceHelpers = {
  // Measure render time
  measureRenderTime: async (component: any, props = {}) => {
    const start = performance.now()
    const wrapper = mount(component, { props })
    await nextTick()
    const end = performance.now()
    
    wrapper.unmount()
    return end - start
  },

  // Test large list rendering
  testLargeListPerformance: async (component: any, itemCount = 1000) => {
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }))

    const start = performance.now()
    const wrapper = mount(component, {
      props: { items }
    })
    await nextTick()
    const end = performance.now()

    wrapper.unmount()
    return {
      renderTime: end - start,
      itemCount,
      averageTimePerItem: (end - start) / itemCount
    }
  }
}

// 10. Mock API Helpers for Testing
export const mockApiHelpers = {
  // Mock successful API response
  mockSuccessResponse: (data: any) => {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data)
    })
  },

  // Mock error API response
  mockErrorResponse: (status = 400, message = 'Bad Request') => {
    return vi.fn().mockRejectedValue({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.resolve({ error: message })
    })
  },

  // Mock loading state
  mockLoadingResponse: (delay = 1000) => {
    return vi.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), delay)
      )
    )
  }
}

// Test Configuration for Vitest
export const vitestConfig = {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
}

// Test Setup File Example
export const testSetupExample = `
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock global components
config.global.components = {
  Button: {
    template: '<button @click="$emit(\\'click\\')"><slot /></button>',
    emits: ['click']
  },
  Input: {
    template: '<input :value="modelValue" @input="$emit(\\'update:modelValue\\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}

// Mock global properties
config.global.mocks = {
  $t: (key: string) => key // Mock translation function
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))
`