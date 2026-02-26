// Theme UI Dark Mode Implementation

/** @jsxImportSource theme-ui */
import { useColorMode, ColorMode } from 'theme-ui'
import { Theme } from 'theme-ui'
import { ReactNode, useEffect } from 'react'

// 1. Dark Mode Theme Configuration
export const darkModeTheme: Theme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    accent: '#609',
    muted: '#f6f6f6',
    gray: '#666',
    modes: {
      dark: {
        text: '#fff',
        background: '#111',
        primary: '#0cf',
        secondary: '#96c',
        accent: '#90f',
        muted: '#222',
        gray: '#999',
      },
    },
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'inherit',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
  space: [0, 4, 8, 16, 32, 64, 128, 256],
  // Enable color mode
  config: {
    initialColorModeName: 'light',
    useCustomProperties: true,
    useColorSchemeMediaQuery: true,
  },
}

// 2. Color Mode Toggle Button
export const ColorModeToggle = () => {
  const [colorMode, setColorMode] = useColorMode()
  
  return (
    <button
      sx={{
        appearance: 'none',
        bg: 'transparent',
        border: '2px solid',
        borderColor: 'primary',
        borderRadius: 'circle',
        color: 'primary',
        cursor: 'pointer',
        fontSize: 2,
        padding: 2,
        width: 48,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
          bg: 'primary',
          color: 'background',
          transform: 'scale(1.1)',
        },
        '&:focus': {
          outline: 'none',
          boxShadow: '0 0 0 3px rgba(0, 123, 204, 0.3)',
        },
      }}
      onClick={() => {
        setColorMode(colorMode === 'dark' ? 'light' : 'dark')
      }}
      title={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {colorMode === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

// 3. Advanced Color Mode Toggle with Animation
export const AnimatedColorModeToggle = () => {
  const [colorMode, setColorMode] = useColorMode()
  const isDark = colorMode === 'dark'
  
  return (
    <button
      sx={{
        position: 'relative',
        width: 64,
        height: 32,
        bg: isDark ? 'primary' : 'muted',
        border: 'none',
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:focus': {
          outline: 'none',
          boxShadow: '0 0 0 3px rgba(0, 123, 204, 0.3)',
        },
      }}
      onClick={() => setColorMode(isDark ? 'light' : 'dark')}
    >
      <div
        sx={{
          position: 'absolute',
          top: 2,
          left: isDark ? 34 : 2,
          width: 28,
          height: 28,
          bg: 'background',
          borderRadius: 'circle',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 1,
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  )
}

// 4. Color Mode Aware Component
export const ColorModeCard = ({ children }: { children: ReactNode }) => {
  const [colorMode] = useColorMode()
  
  return (
    <div
      sx={{
        padding: 4,
        borderRadius: 'default',
        bg: 'background',
        color: 'text',
        border: '1px solid',
        borderColor: colorMode === 'dark' ? 'gray' : 'muted',
        boxShadow: colorMode === 'dark' 
          ? '0 4px 20px rgba(255, 255, 255, 0.1)' 
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </div>
  )
}

// 5. System Preference Detection
export const useSystemColorMode = () => {
  const [colorMode, setColorMode] = useColorMode()
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setColorMode])
  
  return colorMode
}

// 6. Color Mode Status Indicator
export const ColorModeIndicator = () => {
  const [colorMode] = useColorMode()
  
  return (
    <div
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 2,
        bg: 'muted',
        borderRadius: 'default',
        fontSize: 1,
        fontWeight: 'bold',
      }}
    >
      <div
        sx={{
          width: 12,
          height: 12,
          bg: colorMode === 'dark' ? 'secondary' : 'primary',
          borderRadius: 'circle',
        }}
      />
      {colorMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
    </div>
  )
}

// 7. Multi-Color Mode Theme
export const multiModeTheme: Theme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    modes: {
      dark: {
        text: '#fff',
        background: '#111',
        primary: '#0cf',
        secondary: '#96c',
      },
      sepia: {
        text: '#5d4037',
        background: '#f5f5dc',
        primary: '#8d6e63',
        secondary: '#a1887f',
      },
      high_contrast: {
        text: '#000',
        background: '#fff',
        primary: '#0000ff',
        secondary: '#ff0000',
      },
    },
  },
  fonts: {
    body: 'system-ui, sans-serif',
  },
  fontSizes: [12, 14, 16, 20, 24, 32],
  space: [0, 4, 8, 16, 32, 64],
}

// 8. Multi-Mode Selector
export const ColorModeSelector = () => {
  const [colorMode, setColorMode] = useColorMode()
  
  const modes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'sepia', label: 'Sepia', icon: '📜' },
    { value: 'high_contrast', label: 'High Contrast', icon: '⚫' },
  ]
  
  return (
    <div
      sx={{
        display: 'flex',
        gap: 2,
        padding: 2,
        bg: 'muted',
        borderRadius: 'default',
      }}
    >
      {modes.map((mode) => (
        <button
          key={mode.value}
          sx={{
            padding: 2,
            border: 'none',
            borderRadius: 'default',
            bg: colorMode === mode.value ? 'primary' : 'transparent',
            color: colorMode === mode.value ? 'background' : 'text',
            cursor: 'pointer',
            fontSize: 1,
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            '&:hover': {
              bg: colorMode === mode.value ? 'secondary' : 'background',
            },
          }}
          onClick={() => setColorMode(mode.value as ColorMode)}
        >
          <span sx={{ mr: 1 }}>{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  )
}

// 9. Persistent Color Mode Hook
export const usePersistentColorMode = () => {
  const [colorMode, setColorMode] = useColorMode()
  
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-ui-color-mode')
    if (savedMode && savedMode !== colorMode) {
      setColorMode(savedMode as ColorMode)
    }
  }, [colorMode, setColorMode])
  
  const setPersistentColorMode = (mode: ColorMode) => {
    setColorMode(mode)
    localStorage.setItem('theme-ui-color-mode', mode)
  }
  
  return [colorMode, setPersistentColorMode] as const
}