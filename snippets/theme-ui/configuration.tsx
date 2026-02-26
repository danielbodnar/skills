// Advanced Theme UI Configuration Examples

import { Theme } from 'theme-ui'

// 1. Extended Theme with All Scales
export const advancedTheme: Theme = {
  // Color scales
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    accent: '#609',
    muted: '#f6f6f6',
    gray: '#666',
    highlight: '#efeffe',
    // Color modes
    modes: {
      dark: {
        text: '#fff',
        background: '#000',
        primary: '#0cf',
        secondary: '#96c',
        accent: '#90f',
        muted: '#111',
        gray: '#999',
        highlight: '#29112c',
      },
    },
  },
  
  // Typography scales
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
  letterSpacings: {
    body: 'normal',
    caps: '0.2em',
  },

  // Layout scales
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  sizes: {
    container: 1024,
    wide: 1280,
    narrow: 512,
  },
  
  // Design tokens
  radii: {
    default: 4,
    circle: 99999,
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.12)',
    large: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
  
  // Responsive breakpoints
  breakpoints: ['40em', '52em', '64em'],
  
  // Component variants
  text: {
    heading: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
    },
    display: {
      fontFamily: 'heading',
      fontWeight: 'heading',
      lineHeight: 'heading',
      fontSize: [5, 6, 7],
    },
    caps: {
      textTransform: 'uppercase',
      letterSpacing: 'caps',
    },
  },
  
  buttons: {
    primary: {
      fontSize: 2,
      fontWeight: 'bold',
      color: 'background',
      bg: 'primary',
      border: 'none',
      borderRadius: 'default',
      cursor: 'pointer',
    },
    secondary: {
      variant: 'buttons.primary',
      color: 'primary',
      bg: 'transparent',
      border: '2px solid',
      borderColor: 'primary',
    },
  },
  
  cards: {
    primary: {
      padding: 3,
      borderRadius: 'default',
      boxShadow: 'small',
      bg: 'background',
    },
    compact: {
      variant: 'cards.primary',
      padding: 2,
    },
  },
  
  // MDX styles
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
    },
    h1: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 5,
    },
    h2: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 4,
    },
    h3: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 3,
    },
    p: {
      color: 'text',
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
    },
    a: {
      color: 'primary',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    pre: {
      fontFamily: 'monospace',
      overflowX: 'auto',
      code: {
        color: 'inherit',
      },
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 'inherit',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    th: {
      textAlign: 'left',
      borderBottomStyle: 'solid',
    },
    td: {
      textAlign: 'left',
      borderBottomStyle: 'solid',
    },
  },
}

// 2. Theme Composition
export const createTheme = (customColors = {}) => ({
  ...advancedTheme,
  colors: {
    ...advancedTheme.colors,
    ...customColors,
  },
})

// 3. Brand-specific Theme
export const brandTheme = createTheme({
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
})

// 4. Functional Theme Utilities
export const getResponsiveValue = (values: (string | number)[], index: number) => {
  return Array.isArray(values) ? values[index] || values[values.length - 1] : values
}

export const createColorMode = (baseColors: Record<string, string>) => ({
  ...baseColors,
  modes: {
    dark: {
      ...Object.keys(baseColors).reduce((acc, key) => {
        if (key === 'background') acc[key] = baseColors.text
        else if (key === 'text') acc[key] = baseColors.background
        else acc[key] = baseColors[key]
        return acc
      }, {} as Record<string, string>),
    },
  },
})

// 5. Theme Validation Helper
export const validateTheme = (theme: Theme): boolean => {
  const requiredKeys = ['colors', 'fonts', 'fontSizes']
  return requiredKeys.every(key => key in theme)
}