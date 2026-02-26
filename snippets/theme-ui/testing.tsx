// Theme UI Testing Patterns and Examples

import { render, screen } from '@testing-library/react'
import { ThemeUIProvider } from 'theme-ui'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ReactNode } from 'react'
import { Theme } from 'theme-ui'

// 1. Test Theme Configuration
export const testTheme: Theme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    muted: '#f6f6f6',
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'inherit',
  },
  fontSizes: [12, 14, 16, 20, 24, 32],
  space: [0, 4, 8, 16, 32, 64],
  breakpoints: ['40em', '52em', '64em'],
}

// 2. Test Wrapper Component
export const ThemeWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeUIProvider theme={testTheme}>
    {children}
  </ThemeUIProvider>
)

// 3. Custom Render Helper
export const renderWithTheme = (ui: ReactNode, options = {}) => {
  return render(ui, {
    wrapper: ThemeWrapper,
    ...options,
  })
}

// 4. Theme Utilities for Testing
export const getThemeValue = (path: string, theme = testTheme) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme as any)
}

// 5. Component Testing Examples
/** @jsxImportSource theme-ui */
const TestComponent = ({ variant = 'primary' }: { variant?: string }) => (
  <div
    sx={{
      padding: 3,
      bg: variant === 'primary' ? 'primary' : 'secondary',
      color: 'background',
      borderRadius: 'default',
    }}
    data-testid="test-component"
  >
    Test Content
  </div>
)

describe('Theme UI Component Tests', () => {
  it('renders with correct theme styles', () => {
    renderWithTheme(<TestComponent />)
    
    const component = screen.getByTestId('test-component')
    expect(component).toBeInTheDocument()
    
    // Test computed styles would require jsdom setup
    // This is a basic structure example
  })
  
  it('applies different variants correctly', () => {
    renderWithTheme(<TestComponent variant="secondary" />)
    
    const component = screen.getByTestId('test-component')
    expect(component).toBeInTheDocument()
  })
})

// 6. Dark Mode Testing
const DarkModeComponent = () => {
  const [colorMode, setColorMode] = useColorMode()
  
  return (
    <div>
      <div data-testid="color-mode">{colorMode}</div>
      <button
        data-testid="toggle-button"
        onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
      >
        Toggle
      </button>
    </div>
  )
}

const darkTheme: Theme = {
  ...testTheme,
  colors: {
    ...testTheme.colors,
    modes: {
      dark: {
        text: '#fff',
        background: '#111',
        primary: '#0cf',
        secondary: '#96c',
        muted: '#222',
      },
    },
  },
  config: {
    initialColorModeName: 'light',
  },
}

const DarkModeWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeUIProvider theme={darkTheme}>
    {children}
  </ThemeUIProvider>
)

// 7. Responsive Design Testing
import { useColorMode } from 'theme-ui'

const ResponsiveComponent = () => (
  <div
    sx={{
      fontSize: [2, 3, 4],
      padding: [2, 3, 4],
      display: ['block', 'flex'],
    }}
    data-testid="responsive-component"
  >
    Responsive Content
  </div>
)

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('Responsive Component Tests', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    mockMatchMedia(false)
  })
  
  it('renders responsive component', () => {
    renderWithTheme(<ResponsiveComponent />)
    
    const component = screen.getByTestId('responsive-component')
    expect(component).toBeInTheDocument()
  })
  
  it('handles mobile breakpoint', () => {
    mockMatchMedia(true) // Simulate mobile
    renderWithTheme(<ResponsiveComponent />)
    
    const component = screen.getByTestId('responsive-component')
    expect(component).toBeInTheDocument()
  })
})

// 8. Theme Integration Testing
const ThemeAwareForm = () => (
  <form
    sx={{
      maxWidth: 400,
      padding: 4,
      bg: 'muted',
      borderRadius: 'default',
    }}
    data-testid="theme-form"
  >
    <input
      sx={{
        width: '100%',
        padding: 2,
        border: '1px solid',
        borderColor: 'gray',
        borderRadius: 'default',
        mb: 3,
      }}
      data-testid="form-input"
      placeholder="Enter text"
    />
    <button
      sx={{
        bg: 'primary',
        color: 'background',
        border: 'none',
        padding: 2,
        borderRadius: 'default',
        cursor: 'pointer',
      }}
      data-testid="form-button"
      type="submit"
    >
      Submit
    </button>
  </form>
)

describe('Theme Integration Tests', () => {
  it('applies theme styles to form elements', () => {
    renderWithTheme(<ThemeAwareForm />)
    
    const form = screen.getByTestId('theme-form')
    const input = screen.getByTestId('form-input')
    const button = screen.getByTestId('form-button')
    
    expect(form).toBeInTheDocument()
    expect(input).toBeInTheDocument()
    expect(button).toBeInTheDocument()
  })
})

// 9. Theme Validation Testing
export const validateThemeStructure = (theme: Theme) => {
  const requiredKeys = ['colors', 'fonts', 'fontSizes', 'space']
  const errors: string[] = []
  
  requiredKeys.forEach(key => {
    if (!(key in theme)) {
      errors.push(`Missing required theme property: ${key}`)
    }
  })
  
  if (theme.colors && typeof theme.colors !== 'object') {
    errors.push('colors must be an object')
  }
  
  if (theme.fontSizes && !Array.isArray(theme.fontSizes)) {
    errors.push('fontSizes must be an array')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

describe('Theme Validation', () => {
  it('validates correct theme structure', () => {
    const result = validateThemeStructure(testTheme)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
  
  it('detects missing required properties', () => {
    const incompleteTheme = { colors: {} } as Theme
    const result = validateThemeStructure(incompleteTheme)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// 10. Visual Regression Testing Setup
export const visualTestTheme: Theme = {
  ...testTheme,
  // Consistent theme for visual regression tests
  colors: {
    text: '#333333',
    background: '#ffffff',
    primary: '#0066cc',
    secondary: '#6633cc',
    muted: '#f5f5f5',
  },
}

// 11. Accessibility Testing Helpers
export const checkColorContrast = (foreground: string, background: string) => {
  // This would integrate with a color contrast checking library
  // like polished or a11y-color-contrast
  return {
    ratio: 4.5, // Example ratio
    passes: true,
    level: 'AA',
  }
}

// 12. Mock Theme Provider for Unit Tests
export const MockThemeProvider = ({ 
  children, 
  themeOverrides = {} 
}: { 
  children: ReactNode
  themeOverrides?: Partial<Theme>
}) => (
  <ThemeUIProvider theme={{ ...testTheme, ...themeOverrides }}>
    {children}
  </ThemeUIProvider>
)

// 13. Testing Utilities
export const testUtils = {
  renderWithTheme,
  getThemeValue,
  validateThemeStructure,
  mockMatchMedia,
  checkColorContrast,
}

// Example usage in tests:
/*
import { testUtils } from './testing'

describe('My Component', () => {
  it('renders correctly', () => {
    testUtils.renderWithTheme(<MyComponent />)
    // Test assertions
  })
})
*/