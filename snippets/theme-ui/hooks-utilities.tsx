// Theme UI Hooks and Utility Functions

import { useThemeUI, useColorMode, ColorMode } from 'theme-ui'
import { Theme } from 'theme-ui'
import { useState, useEffect, useMemo, useCallback } from 'react'

// 1. Basic Theme UI Hooks
export const useTheme = () => {
  const { theme } = useThemeUI()
  return theme
}

export const useThemeValue = (path: string) => {
  const theme = useTheme()
  return path.split('.').reduce((obj, key) => obj?.[key], theme as any)
}

// 2. Color Mode Management
export const useColorModeToggle = () => {
  const [colorMode, setColorMode] = useColorMode()
  
  const toggle = useCallback(() => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark')
  }, [colorMode, setColorMode])
  
  const setMode = useCallback((mode: ColorMode) => {
    setColorMode(mode)
  }, [setColorMode])
  
  return {
    colorMode,
    toggle,
    setMode,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',
  }
}

// 3. Persistent Color Mode Hook
export const usePersistentColorMode = (storageKey = 'theme-ui-color-mode') => {
  const [colorMode, setColorMode] = useColorMode()
  
  // Load saved mode on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(storageKey)
    if (savedMode && savedMode !== colorMode) {
      setColorMode(savedMode as ColorMode)
    }
  }, [colorMode, setColorMode, storageKey])
  
  // Save mode changes
  const setPersistentMode = useCallback((mode: ColorMode) => {
    setColorMode(mode)
    localStorage.setItem(storageKey, mode)
  }, [setColorMode, storageKey])
  
  return [colorMode, setPersistentMode] as const
}

// 4. System Preference Detection
export const useSystemColorMode = () => {
  const [systemMode, setSystemMode] = useState<ColorMode>('light')
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateMode = () => {
      setSystemMode(mediaQuery.matches ? 'dark' : 'light')
    }
    
    updateMode() // Set initial value
    mediaQuery.addEventListener('change', updateMode)
    
    return () => mediaQuery.removeEventListener('change', updateMode)
  }, [])
  
  return systemMode
}

// 5. Responsive Breakpoint Hook
export const useBreakpoint = () => {
  const theme = useTheme()
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('base')
  
  useEffect(() => {
    if (!theme.breakpoints) return
    
    const breakpoints = theme.breakpoints as string[]
    const mediaQueries = breakpoints.map(bp => window.matchMedia(`(min-width: ${bp})`))
    
    const updateBreakpoint = () => {
      let current = 'base'
      for (let i = mediaQueries.length - 1; i >= 0; i--) {
        if (mediaQueries[i].matches) {
          current = `bp${i + 1}`
          break
        }
      }
      setCurrentBreakpoint(current)
    }
    
    updateBreakpoint()
    mediaQueries.forEach(mq => mq.addEventListener('change', updateBreakpoint))
    
    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updateBreakpoint))
    }
  }, [theme.breakpoints])
  
  return currentBreakpoint
}

// 6. Responsive Value Helper
export const useResponsiveValue = <T,>(values: T | T[]) => {
  const breakpoint = useBreakpoint()
  
  return useMemo(() => {
    if (!Array.isArray(values)) return values
    
    const breakpointIndex = parseInt(breakpoint.replace('bp', '')) - 1
    return values[breakpointIndex] || values[values.length - 1]
  }, [values, breakpoint])
}

// 7. Theme Color Utilities
export const useThemeColors = () => {
  const theme = useTheme()
  
  const getColor = useCallback((colorKey: string) => {
    return theme.colors?.[colorKey] || colorKey
  }, [theme.colors])
  
  const getColorWithMode = useCallback((colorKey: string, mode?: ColorMode) => {
    if (!mode || !theme.colors?.modes?.[mode]) {
      return getColor(colorKey)
    }
    return theme.colors.modes[mode][colorKey] || getColor(colorKey)
  }, [theme.colors, getColor])
  
  return {
    getColor,
    getColorWithMode,
    colors: theme.colors,
  }
}

// 8. Typography Scale Hook
export const useTypography = () => {
  const theme = useTheme()
  
  const getFontSize = useCallback((index: number | string) => {
    if (typeof index === 'string') return index
    return theme.fontSizes?.[index] || `${index}px`
  }, [theme.fontSizes])
  
  const getFont = useCallback((fontKey: string) => {
    return theme.fonts?.[fontKey] || fontKey
  }, [theme.fonts])
  
  const getFontWeight = useCallback((weightKey: string) => {
    return theme.fontWeights?.[weightKey] || weightKey
  }, [theme.fontWeights])
  
  return {
    getFontSize,
    getFont,
    getFontWeight,
    fontSizes: theme.fontSizes,
    fonts: theme.fonts,
    fontWeights: theme.fontWeights,
  }
}

// 9. Spacing and Layout Hook
export const useSpacing = () => {
  const theme = useTheme()
  
  const getSpace = useCallback((index: number | string) => {
    if (typeof index === 'string') return index
    return theme.space?.[index] || `${index * 4}px`
  }, [theme.space])
  
  const getSize = useCallback((sizeKey: string) => {
    return theme.sizes?.[sizeKey] || sizeKey
  }, [theme.sizes])
  
  return {
    getSpace,
    getSize,
    space: theme.space,
    sizes: theme.sizes,
  }
}

// 10. Theme Variant Hook
export const useVariant = (variantGroup: string, variantName = 'default') => {
  const theme = useTheme()
  
  return useMemo(() => {
    const variants = (theme as any)?.[variantGroup]
    return variants?.[variantName] || {}
  }, [theme, variantGroup, variantName])
}

// 11. Media Query Hook
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])
  
  return matches
}

// 12. Theme-aware Style Builder
export const useStyleBuilder = () => {
  const theme = useTheme()
  const { getColor } = useThemeColors()
  const { getFontSize, getFont } = useTypography()
  const { getSpace } = useSpacing()
  
  const buildStyle = useCallback((styleConfig: Record<string, any>) => {
    const processedStyle: Record<string, any> = {}
    
    Object.entries(styleConfig).forEach(([key, value]) => {
      switch (key) {
        case 'color':
        case 'bg':
        case 'backgroundColor':
        case 'borderColor':
          processedStyle[key] = getColor(value)
          break
        case 'fontSize':
          processedStyle[key] = getFontSize(value)
          break
        case 'fontFamily':
          processedStyle[key] = getFont(value)
          break
        case 'padding':
        case 'margin':
        case 'p':
        case 'm':
        case 'pt':
        case 'pb':
        case 'pl':
        case 'pr':
        case 'mt':
        case 'mb':
        case 'ml':
        case 'mr':
          processedStyle[key] = getSpace(value)
          break
        default:
          processedStyle[key] = value
      }
    })
    
    return processedStyle
  }, [getColor, getFontSize, getFont, getSpace])
  
  return buildStyle
}

// 13. Animation and Transition Helpers
export const useThemeTransitions = () => {
  const theme = useTheme()
  
  const getTransition = useCallback((property: string, duration = '0.2s', easing = 'ease') => {
    return `${property} ${duration} ${easing}`
  }, [])
  
  const commonTransitions = useMemo(() => ({
    all: getTransition('all'),
    colors: getTransition('color, background-color, border-color'),
    transform: getTransition('transform'),
    opacity: getTransition('opacity'),
  }), [getTransition])
  
  return {
    getTransition,
    commonTransitions,
  }
}

// 14. Dark Mode System Integration
export const useSystemColorModeSync = () => {
  const systemMode = useSystemColorMode()
  const [colorMode, setColorMode] = useColorMode()
  const [isManual, setIsManual] = useState(false)
  
  // Sync with system unless manually overridden
  useEffect(() => {
    if (!isManual) {
      setColorMode(systemMode)
    }
  }, [systemMode, isManual, setColorMode])
  
  const setManualMode = useCallback((mode: ColorMode) => {
    setIsManual(true)
    setColorMode(mode)
  }, [setColorMode])
  
  const resetToSystem = useCallback(() => {
    setIsManual(false)
    setColorMode(systemMode)
  }, [systemMode, setColorMode])
  
  return {
    colorMode,
    systemMode,
    isManual,
    setManualMode,
    resetToSystem,
  }
}

// 15. Theme Utilities Export
export const themeUtils = {
  useTheme,
  useThemeValue,
  useColorModeToggle,
  usePersistentColorMode,
  useSystemColorMode,
  useBreakpoint,
  useResponsiveValue,
  useThemeColors,
  useTypography,
  useSpacing,
  useVariant,
  useMediaQuery,
  useStyleBuilder,
  useThemeTransitions,
  useSystemColorModeSync,
}

// 16. Type-safe Theme Access
export const createThemeHook = <T extends Theme>(theme: T) => {
  return () => {
    const { theme: currentTheme } = useThemeUI()
    return currentTheme as T
  }
}