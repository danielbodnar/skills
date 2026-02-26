// Theme UI Performance Optimization Patterns

/** @jsxImportSource theme-ui */
import { memo, useMemo, useCallback, lazy, Suspense } from 'react'
import { Theme, useThemeUI } from 'theme-ui'
import { Box, Text, Button, Grid } from 'theme-ui'

// 1. Memoized Theme Creation
export const createOptimizedTheme = memo((baseColors: Record<string, string>): Theme => ({
  colors: {
    ...baseColors,
    modes: {
      dark: Object.keys(baseColors).reduce((acc, key) => {
        acc[key] = key === 'background' ? baseColors.text : baseColors[key]
        return acc
      }, {} as Record<string, string>),
    },
  },
  fonts: {
    body: 'system-ui, -apple-system, sans-serif',
    heading: 'inherit',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
  space: [0, 4, 8, 16, 32, 64, 128, 256],
  breakpoints: ['40em', '52em', '64em'],
}))

// 2. Optimized sx prop patterns
const optimizedStyles = {
  card: {
    padding: 3,
    borderRadius: 'default',
    bg: 'background',
    boxShadow: 'small',
  },
  button: {
    bg: 'primary',
    color: 'background',
    border: 'none',
    padding: 2,
    borderRadius: 'default',
    cursor: 'pointer',
  },
  text: {
    fontFamily: 'body',
    lineHeight: 'body',
  },
} as const

// 3. Memoized Style Builder Hook
export const useOptimizedStyles = () => {
  const { theme } = useThemeUI()
  
  return useMemo(() => ({
    card: {
      ...optimizedStyles.card,
      bg: theme.colors?.background,
      boxShadow: theme.shadows?.small,
    },
    button: {
      ...optimizedStyles.button,
      bg: theme.colors?.primary,
      color: theme.colors?.background,
    },
    text: {
      ...optimizedStyles.text,
      fontFamily: theme.fonts?.body,
    },
  }), [theme])
}

// 4. Memoized Components
interface OptimizedCardProps {
  title: string
  content: string
  onAction?: () => void
}

export const OptimizedCard = memo(({ title, content, onAction }: OptimizedCardProps) => {
  const styles = useOptimizedStyles()
  
  const handleClick = useCallback(() => {
    onAction?.()
  }, [onAction])
  
  return (
    <Box sx={styles.card}>
      <Text as="h3" sx={{ ...styles.text, fontWeight: 'bold', mb: 2 }}>
        {title}
      </Text>
      <Text sx={{ ...styles.text, mb: 3 }}>
        {content}
      </Text>
      {onAction && (
        <Button sx={styles.button} onClick={handleClick}>
          Action
        </Button>
      )}
    </Box>
  )
})

OptimizedCard.displayName = 'OptimizedCard'

// 5. Virtualized List Component
interface VirtualizedListProps {
  items: Array<{ id: string; title: string; content: string }>
  onItemAction: (id: string) => void
}

export const VirtualizedList = memo(({ items, onItemAction }: VirtualizedListProps) => {
  const styles = useOptimizedStyles()
  
  const renderItem = useCallback((item: typeof items[0]) => (
    <OptimizedCard
      key={item.id}
      title={item.title}
      content={item.content}
      onAction={() => onItemAction(item.id)}
    />
  ), [onItemAction])
  
  return (
    <Grid
      columns={[1, 2, 3]}
      gap={3}
      sx={{ padding: 3 }}
    >
      {items.map(renderItem)}
    </Grid>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// 6. Lazy Loading Components
const LazyImageGallery = lazy(() => import('./components/ImageGallery'))
const LazyDataTable = lazy(() => import('./components/DataTable'))

export const OptimizedApp = () => (
  <Box>
    <Text sx={{ fontSize: 4, fontWeight: 'bold', mb: 4 }}>
      Optimized App
    </Text>
    
    <Suspense fallback={<Text>Loading gallery...</Text>}>
      <LazyImageGallery />
    </Suspense>
    
    <Suspense fallback={<Text>Loading table...</Text>}>
      <LazyDataTable />
    </Suspense>
  </Box>
)

// 7. Theme Caching Hook
export const useCachedTheme = (themeConfig: Partial<Theme>) => {
  return useMemo(() => ({
    colors: {
      text: '#000',
      background: '#fff',
      primary: '#07c',
      ...themeConfig.colors,
    },
    fonts: {
      body: 'system-ui, sans-serif',
      ...themeConfig.fonts,
    },
    fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
    space: [0, 4, 8, 16, 32, 64, 128, 256],
    ...themeConfig,
  }), [themeConfig])
}

// 8. Debounced Theme Updates
import { useState, useEffect } from 'react'

export const useDebouncedTheme = (theme: Theme, delay = 300) => {
  const [debouncedTheme, setDebouncedTheme] = useState(theme)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTheme(theme)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [theme, delay])
  
  return debouncedTheme
}

// 9. Optimized Responsive Hook
export const useOptimizedBreakpoint = () => {
  const { theme } = useThemeUI()
  const [breakpoint, setBreakpoint] = useState('base')
  
  useEffect(() => {
    if (!theme.breakpoints) return
    
    const breakpoints = theme.breakpoints as string[]
    const mediaQueries = breakpoints.map(bp => 
      window.matchMedia(`(min-width: ${bp})`)
    )
    
    const updateBreakpoint = () => {
      for (let i = mediaQueries.length - 1; i >= 0; i--) {
        if (mediaQueries[i].matches) {
          setBreakpoint(`bp${i + 1}`)
          return
        }
      }
      setBreakpoint('base')
    }
    
    // Throttle updates
    let ticking = false
    const throttledUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateBreakpoint()
          ticking = false
        })
        ticking = true
      }
    }
    
    throttledUpdate()
    mediaQueries.forEach(mq => mq.addEventListener('change', throttledUpdate))
    
    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', throttledUpdate))
    }
  }, [theme.breakpoints])
  
  return breakpoint
}

// 10. CSS-in-JS Optimization
export const createStaticStyles = (theme: Theme) => {
  return {
    // Pre-computed styles that don't change
    baseCard: {
      padding: theme.space?.[3] || 16,
      borderRadius: theme.radii?.default || 4,
      backgroundColor: theme.colors?.background || '#fff',
      boxShadow: theme.shadows?.small || '0 1px 3px rgba(0,0,0,0.12)',
    },
    primaryButton: {
      backgroundColor: theme.colors?.primary || '#07c',
      color: theme.colors?.background || '#fff',
      border: 'none',
      padding: `${theme.space?.[2] || 8}px ${theme.space?.[3] || 16}px`,
      borderRadius: theme.radii?.default || 4,
      cursor: 'pointer',
      fontSize: theme.fontSizes?.[2] || 16,
      fontWeight: theme.fontWeights?.bold || 700,
    },
  }
}

// 11. Bundle Size Optimization
// Use dynamic imports for large theme objects
export const loadLargeTheme = async () => {
  const { largeTheme } = await import('./themes/large-theme')
  return largeTheme
}

// 12. Memory Leak Prevention
export const useCleanupTheme = (theme: Theme) => {
  useEffect(() => {
    // Cleanup theme-related listeners or subscriptions
    return () => {
      // Cleanup logic here
    }
  }, [theme])
  
  return theme
}

// 13. Performance Monitoring
export const useThemePerformance = () => {
  const startTime = useMemo(() => performance.now(), [])
  
  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    if (renderTime > 16) { // More than one frame
      console.warn(`Theme render took ${renderTime.toFixed(2)}ms`)
    }
  })
}

// 14. Optimized Color Mode Toggle
export const useOptimizedColorMode = () => {
  const [colorMode, setColorMode] = useState<string>('light')
  
  const toggleColorMode = useCallback(() => {
    setColorMode(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])
  
  // Batch DOM updates
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-mode', colorMode)
    
    // Use CSS custom properties instead of re-rendering
    if (colorMode === 'dark') {
      root.classList.add('theme-ui-dark')
      root.classList.remove('theme-ui-light')
    } else {
      root.classList.add('theme-ui-light')
      root.classList.remove('theme-ui-dark')
    }
  }, [colorMode])
  
  return [colorMode, toggleColorMode] as const
}

// 15. Production Optimization Tips
export const productionOptimizations = {
  // Tree shake unused theme properties
  minimalTheme: {
    colors: {
      text: '#000',
      background: '#fff',
      primary: '#07c',
    },
    fonts: {
      body: 'system-ui, sans-serif',
    },
    fontSizes: [14, 16, 20, 24],
    space: [0, 8, 16, 24, 32],
  },
  
  // Use CSS custom properties for frequently changing values
  cssVariables: {
    '--color-text': 'var(--theme-colors-text)',
    '--color-background': 'var(--theme-colors-background)',
    '--color-primary': 'var(--theme-colors-primary)',
  },
  
  // Preload critical theme resources
  preloadTheme: () => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = '/themes/critical.css'
    link.as = 'style'
    document.head.appendChild(link)
  },
}