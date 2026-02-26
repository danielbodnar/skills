// MDX Error Handling Examples
// Comprehensive error handling strategies for MDX compilation and runtime errors

import {compile, evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import React from 'react'

// Compilation error handling
export const compilationErrorHandling = {
  // Basic error handling with try-catch
  async safeCompile(mdxSource: string) {
    try {
      const result = await compile(mdxSource, {
        jsxImportSource: 'react'
      })
      return {
        success: true,
        code: String(result),
        error: null
      }
    } catch (error) {
      return {
        success: false,
        code: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown compilation error',
          type: 'compilation',
          stack: error instanceof Error ? error.stack : undefined
        }
      }
    }
  },

  // Detailed error analysis
  async analyzeCompilationError(mdxSource: string) {
    try {
      await compile(mdxSource, {jsxImportSource: 'react'})
      return {success: true, issues: []}
    } catch (error) {
      const issues = []
      
      if (error instanceof Error) {
        const message = error.message
        
        // Check for common compilation issues
        if (message.includes('Expected')) {
          issues.push({
            type: 'syntax',
            message: 'Syntax error in MDX',
            suggestion: 'Check for unclosed tags or invalid JSX syntax'
          })
        }
        
        if (message.includes('import')) {
          issues.push({
            type: 'import',
            message: 'Import error',
            suggestion: 'Verify import paths and module availability'
          })
        }
        
        if (message.includes('jsx')) {
          issues.push({
            type: 'jsx',
            message: 'JSX compilation error',
            suggestion: 'Check JSX syntax and component usage'
          })
        }
      }
      
      return {
        success: false,
        issues,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  // Incremental error recovery
  async incrementalCompile(mdxSource: string) {
    const lines = mdxSource.split('\n')
    const results = []
    let validContent = ''
    
    for (let i = 0; i < lines.length; i++) {
      const testContent = validContent + (validContent ? '\n' : '') + lines[i]
      
      try {
        await compile(testContent, {jsxImportSource: 'react'})
        validContent = testContent
        results.push({
          line: i + 1,
          content: lines[i],
          status: 'valid'
        })
      } catch (error) {
        results.push({
          line: i + 1,
          content: lines[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return {
      validContent,
      lineResults: results,
      hasErrors: results.some(r => r.status === 'error')
    }
  }
}

// Runtime error handling
export const runtimeErrorHandling = {
  // Safe MDX evaluation
  async safeEvaluate(mdxSource: string, scope = {}) {
    try {
      const {default: Content} = await evaluate(mdxSource, {
        ...runtime,
        ...scope,
        baseUrl: import.meta.url
      })
      
      return {
        success: true,
        Content,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        Content: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown runtime error',
          type: 'runtime',
          stack: error instanceof Error ? error.stack : undefined
        }
      }
    }
  },

  // Error boundary wrapper
  createErrorBoundary(fallbackComponent?: React.ComponentType<{error: Error}>) {
    return class MDXErrorBoundary extends React.Component<
      {children: React.ReactNode},
      {hasError: boolean, error: Error | null}
    > {
      constructor(props: {children: React.ReactNode}) {
        super(props)
        this.state = {hasError: false, error: null}
      }
      
      static getDerivedStateFromError(error: Error) {
        return {hasError: true, error}
      }
      
      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('MDX Error Boundary caught an error:', error, errorInfo)
      }
      
      render() {
        if (this.state.hasError) {
          if (fallbackComponent) {
            return React.createElement(fallbackComponent, {error: this.state.error!})
          }
          
          return React.createElement('div', {
            style: {
              padding: '1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '0.375rem',
              color: '#dc2626'
            }
          }, [
            React.createElement('h3', {key: 'title'}, 'MDX Error'),
            React.createElement('p', {key: 'message'}, this.state.error?.message || 'Unknown error'),
            React.createElement('details', {key: 'details'}, [
              React.createElement('summary', {key: 'summary'}, 'Error Details'),
              React.createElement('pre', {
                key: 'stack',
                style: {fontSize: '0.75rem', marginTop: '0.5rem'}
              }, this.state.error?.stack)
            ])
          ])
        }
        
        return this.props.children
      }
    }
  },

  // Resilient MDX wrapper component
  createResilientWrapper() {
    const ErrorBoundary = this.createErrorBoundary()
    
    return ({mdxSource, fallback, ...props}: {
      mdxSource: string
      fallback?: React.ComponentType
      [key: string]: any
    }) => {
      const [content, setContent] = React.useState<{
        Component: React.ComponentType | null
        error: Error | null
        loading: boolean
      }>({
        Component: null,
        error: null,
        loading: true
      })
      
      React.useEffect(() => {
        const loadMDX = async () => {
          try {
            setContent({Component: null, error: null, loading: true})
            
            const {default: Component} = await evaluate(mdxSource, {
              ...runtime,
              baseUrl: import.meta.url
            })
            
            setContent({Component, error: null, loading: false})
          } catch (error) {
            setContent({
              Component: null,
              error: error instanceof Error ? error : new Error('Unknown error'),
              loading: false
            })
          }
        }
        
        loadMDX()
      }, [mdxSource])
      
      if (content.loading) {
        return React.createElement('div', {}, 'Loading MDX content...')
      }
      
      if (content.error) {
        if (fallback) {
          return React.createElement(fallback, {error: content.error})
        }
        return React.createElement('div', {
          style: {color: 'red'}
        }, `Error loading MDX: ${content.error.message}`)
      }
      
      if (!content.Component) {
        return React.createElement('div', {}, 'No content available')
      }
      
      return React.createElement(ErrorBoundary, {},
        React.createElement(content.Component, props)
      )
    }
  }
}

// Validation and sanitization
export const validationAndSanitization = {
  // Validate MDX syntax
  async validateMDXSyntax(mdxSource: string) {
    const issues = []
    
    // Check for basic syntax issues
    const unclosedTags = mdxSource.match(/<(\w+)(?:[^>]*)(?<!\/|\/>)>/g)
    const closingTags = mdxSource.match(/<\/(\w+)>/g)
    
    if (unclosedTags && closingTags) {
      const unclosedTagNames = unclosedTags.map(tag => 
        tag.match(/<(\w+)/)?.[1]
      ).filter(Boolean)
      
      const closingTagNames = closingTags.map(tag => 
        tag.match(/<\/(\w+)>/)?.[1]
      ).filter(Boolean)
      
      const unmatched = unclosedTagNames.filter(tag => 
        !closingTagNames.includes(tag) && 
        !['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag.toLowerCase())
      )
      
      if (unmatched.length > 0) {
        issues.push({
          type: 'unclosed-tags',
          message: `Potentially unclosed tags: ${unmatched.join(', ')}`,
          severity: 'warning'
        })
      }
    }
    
    // Check for invalid JSX
    const invalidJSX = mdxSource.match(/class=/g)
    if (invalidJSX) {
      issues.push({
        type: 'invalid-jsx',
        message: 'Use "className" instead of "class" in JSX',
        severity: 'error'
      })
    }
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /dangerouslySetInnerHTML/g,
      /javascript:/gi,
      /<script/gi,
      /eval\(/g
    ]
    
    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(mdxSource)) {
        const patternNames = [
          'dangerouslySetInnerHTML',
          'javascript: URLs',
          'script tags',
          'eval() calls'
        ]
        
        issues.push({
          type: 'security',
          message: `Potentially dangerous content: ${patternNames[index]}`,
          severity: 'error'
        })
      }
    })
    
    // Try compilation to catch other issues
    try {
      await compile(mdxSource, {jsxImportSource: 'react'})
    } catch (error) {
      issues.push({
        type: 'compilation',
        message: error instanceof Error ? error.message : 'Compilation failed',
        severity: 'error'
      })
    }
    
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    }
  },

  // Sanitize MDX content
  sanitizeMDXContent(mdxSource: string) {
    let sanitized = mdxSource
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/dangerouslySetInnerHTML\s*=\s*{[^}]*}/g, '')
    
    // Replace javascript: URLs
    sanitized = sanitized.replace(/javascript:[^"']*/gi, '#')
    
    // Remove eval calls
    sanitized = sanitized.replace(/eval\s*\([^)]*\)/g, '')
    
    // Convert class to className
    sanitized = sanitized.replace(/\sclass=/g, ' className=')
    
    return sanitized
  },

  // Validate allowed components
  validateAllowedComponents(mdxSource: string, allowedComponents: string[] = []) {
    const componentMatches = mdxSource.match(/<(\w+)[\s\/>]/g) || []
    const usedComponents = componentMatches
      .map(match => match.replace(/<(\w+)[\s\/>]/, '$1'))
      .filter((component, index, array) => array.indexOf(component) === index)
    
    const htmlTags = [
      'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
      'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
      'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
      'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt',
      'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr',
      'i', 'iframe', 'img', 'input', 'ins', 'kbd',
      'label', 'legend', 'li', 'link',
      'main', 'map', 'mark', 'meta', 'meter',
      'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output',
      'p', 'param', 'picture', 'pre', 'progress',
      'q', 'rp', 'rt', 'ruby',
      's', 'samp', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
      'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
      'u', 'ul', 'var', 'video', 'wbr'
    ]
    
    const invalidComponents = usedComponents.filter(component => 
      !htmlTags.includes(component.toLowerCase()) && 
      !allowedComponents.includes(component)
    )
    
    return {
      isValid: invalidComponents.length === 0,
      usedComponents,
      invalidComponents,
      suggestions: invalidComponents.length > 0 
        ? `Add these components to allowedComponents: ${invalidComponents.join(', ')}`
        : null
    }
  }
}

// Recovery strategies
export const recoveryStrategies = {
  // Fallback content generator
  generateFallbackContent(originalMDX: string, error: Error) {
    const errorType = this.classifyError(error)
    
    switch (errorType) {
      case 'syntax':
        return `# Content Unavailable\n\nThere was a syntax error in the content. Please check the source.\n\n\`\`\`\n${error.message}\n\`\`\``
      
      case 'import':
        return `# Missing Dependencies\n\nSome required components or modules are not available.\n\n**Error:** ${error.message}`
      
      case 'runtime':
        return `# Runtime Error\n\nAn error occurred while rendering the content.\n\n**Details:** ${error.message}`
      
      default:
        return `# Error Loading Content\n\nAn unexpected error occurred:\n\n\`\`\`\n${error.message}\n\`\`\``
    }
  },

  // Classify error types
  classifyError(error: Error): 'syntax' | 'import' | 'runtime' | 'unknown' {
    const message = error.message.toLowerCase()
    
    if (message.includes('expected') || message.includes('unexpected')) {
      return 'syntax'
    }
    
    if (message.includes('import') || message.includes('module') || message.includes('cannot resolve')) {
      return 'import'
    }
    
    if (message.includes('undefined') || message.includes('null') || message.includes('not a function')) {
      return 'runtime'
    }
    
    return 'unknown'
  },

  // Progressive enhancement strategy
  async progressivelyEnhanceMDX(basicMDX: string, enhancements: string[]) {
    let workingContent = basicMDX
    const appliedEnhancements = []
    const failedEnhancements = []
    
    for (const enhancement of enhancements) {
      try {
        const enhancedContent = workingContent + '\n' + enhancement
        await compile(enhancedContent, {jsxImportSource: 'react'})
        
        workingContent = enhancedContent
        appliedEnhancements.push(enhancement)
      } catch (error) {
        failedEnhancements.push({
          enhancement,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return {
      finalContent: workingContent,
      appliedEnhancements,
      failedEnhancements
    }
  },

  // Automatic error correction
  async attemptAutoCorrection(mdxSource: string) {
    let correctedSource = mdxSource
    const corrections = []
    
    // Fix common issues
    const fixes = [
      {
        name: 'Convert class to className',
        pattern: /\sclass=/g,
        replacement: ' className=',
      },
      {
        name: 'Fix self-closing tags',
        pattern: /<(img|br|hr|input|meta|link)([^>]*?)(?<!\/)>/g,
        replacement: '<$1$2 />',
      },
      {
        name: 'Remove script tags',
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        replacement: '',
      },
      {
        name: 'Fix JavaScript URLs',
        pattern: /javascript:[^"']*/gi,
        replacement: '#',
      }
    ]
    
    for (const fix of fixes) {
      if (fix.pattern.test(correctedSource)) {
        correctedSource = correctedSource.replace(fix.pattern, fix.replacement)
        corrections.push(fix.name)
      }
    }
    
    // Test if corrections worked
    try {
      await compile(correctedSource, {jsxImportSource: 'react'})
      return {
        success: true,
        correctedSource,
        corrections
      }
    } catch (error) {
      return {
        success: false,
        correctedSource,
        corrections,
        remainingError: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Monitoring and logging
export const monitoringAndLogging = {
  // Error tracking
  errorTracker: {
    errors: [] as Array<{
      timestamp: Date
      type: string
      message: string
      source: string
      stack?: string
    }>,
    
    track(error: Error, type: string, source: string) {
      this.errors.push({
        timestamp: new Date(),
        type,
        message: error.message,
        source: source.substring(0, 100) + (source.length > 100 ? '...' : ''),
        stack: error.stack
      })
      
      // Keep only last 100 errors
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100)
      }
    },
    
    getRecentErrors(limit = 10) {
      return this.errors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    },
    
    getErrorStats() {
      const typeStats = this.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return {
        total: this.errors.length,
        byType: typeStats,
        mostRecent: this.errors[this.errors.length - 1]
      }
    }
  },

  // Performance monitoring
  performanceMonitor: {
    compilations: [] as Array<{
      duration: number
      size: number
      timestamp: Date
      success: boolean
    }>,
    
    async measureCompilation(mdxSource: string) {
      const start = performance.now()
      const size = mdxSource.length
      
      try {
        await compile(mdxSource, {jsxImportSource: 'react'})
        const duration = performance.now() - start
        
        this.compilations.push({
          duration,
          size,
          timestamp: new Date(),
          success: true
        })
        
        return {success: true, duration}
      } catch (error) {
        const duration = performance.now() - start
        
        this.compilations.push({
          duration,
          size,
          timestamp: new Date(),
          success: false
        })
        
        return {success: false, duration, error}
      }
    },
    
    getStats() {
      const successful = this.compilations.filter(c => c.success)
      const failed = this.compilations.filter(c => !c.success)
      
      return {
        total: this.compilations.length,
        successful: successful.length,
        failed: failed.length,
        successRate: successful.length / this.compilations.length,
        averageDuration: successful.reduce((sum, c) => sum + c.duration, 0) / successful.length,
        averageSize: successful.reduce((sum, c) => sum + c.size, 0) / successful.length
      }
    }
  }
}

// Export all error handling examples
export const mdxErrorHandlingExamples = {
  compilationErrorHandling,
  runtimeErrorHandling,
  validationAndSanitization,
  recoveryStrategies,
  monitoringAndLogging
}