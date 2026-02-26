// Basic Theme UI Setup and Usage Examples

import { ThemeUIProvider } from 'theme-ui'
import { ReactNode } from 'react'

// 1. Basic Theme Definition
export const baseTheme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    accent: '#609',
    muted: '#f6f6f6',
    gray: '#666',
  },
  fonts: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '"Avenir Next", sans-serif',
    monospace: '"SF Mono", Monaco, Consolas, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.25,
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  breakpoints: ['40em', '52em', '64em'],
}

// 2. Theme Provider Setup
interface AppProviderProps {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => (
  <ThemeUIProvider theme={baseTheme}>
    {children}
  </ThemeUIProvider>
)

// 3. Basic Component with sx prop
/** @jsxImportSource theme-ui */
export const BasicComponent = () => (
  <div
    sx={{
      fontWeight: 'bold',
      fontSize: 4, // references theme.fontSizes[4]
      color: 'primary', // references theme.colors.primary
      padding: 3, // references theme.space[3]
      margin: 2,
      bg: 'muted',
      borderRadius: 4,
    }}
  >
    Hello Theme UI!
  </div>
)

// 4. Responsive Styling
export const ResponsiveComponent = () => (
  <div
    sx={{
      fontSize: [2, 3, 4], // responsive font sizes
      padding: [2, 3, 4], // responsive padding
      color: ['primary', 'secondary', 'accent'], // responsive colors
      display: ['block', 'flex'], // responsive display
    }}
  >
    Responsive Text
  </div>
)

// 5. Using Theme Values in JavaScript
import { useThemeUI } from 'theme-ui'

export const ThemeAwareComponent = () => {
  const { theme } = useThemeUI()
  
  return (
    <div
      sx={{
        color: theme.colors?.primary,
        fontSize: theme.fontSizes?.[3],
        fontFamily: theme.fonts?.heading,
      }}
    >
      Using theme values dynamically
    </div>
  )
}

// 6. Conditional Styling
export const ConditionalComponent = ({ isActive }: { isActive: boolean }) => (
  <button
    sx={{
      bg: isActive ? 'primary' : 'muted',
      color: isActive ? 'background' : 'text',
      border: 'none',
      padding: 2,
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 2,
      '&:hover': {
        bg: isActive ? 'secondary' : 'gray',
      },
    }}
  >
    {isActive ? 'Active' : 'Inactive'}
  </button>
)