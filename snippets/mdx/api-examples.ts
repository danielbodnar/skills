// MDX API Examples
// Comprehensive examples of MDX API usage patterns

import {compile, evaluate, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import * as provider from '@mdx-js/react'
import {createProcessor} from '@mdx-js/mdx'

// Core compilation API
export const compilationExamples = {
  // Basic compilation
  async basic() {
    const mdxSource = '# Hello *world*!'
    
    const code = await compile(mdxSource, {
      jsxImportSource: 'react'
    })
    
    return String(code)
  },

  // Compilation with custom options
  async withOptions() {
    const mdxSource = `
# My Document

<CustomComponent prop="value" />

export const metadata = {title: 'My Doc'}
`
    
    const code = await compile(mdxSource, {
      jsxImportSource: 'react',
      format: 'esm',
      outputFormat: 'program',
      development: false,
      providerImportSource: '@mdx-js/react'
    })
    
    return {
      code: String(code),
      length: String(code).length
    }
  },

  // Function body output format
  async functionBody() {
    const mdxSource = '# Hello {props.name}!'
    
    const code = await compile(mdxSource, {
      jsxImportSource: 'react',
      outputFormat: 'function-body'
    })
    
    return String(code)
  }
}

// Runtime evaluation API
export const evaluationExamples = {
  // Basic evaluation
  async basic() {
    const mdxSource = '# Current time: {new Date().toISOString()}'
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      baseUrl: import.meta.url
    })
    
    return Content
  },

  // Evaluation with provider
  async withProvider() {
    const mdxSource = `
# Custom Component Test

<Alert type="success">
  This uses a custom Alert component!
</Alert>
`
    
    const components = {
      Alert: ({type, children}: {type: string, children: React.ReactNode}) => (
        runtime.jsx('div', {
          className: `alert alert-${type}`,
          children
        })
      )
    }
    
    const {default: Content} = await evaluate(mdxSource, {
      ...provider,
      ...runtime,
      baseUrl: import.meta.url
    })
    
    return () => runtime.jsx(provider.MDXProvider, {
      components,
      children: runtime.jsx(Content, {})
    })
  },

  // Evaluation with custom scope
  async withScope() {
    const mdxSource = `
# Welcome {user.name}!

Your score is: **{score}**

{score >= 100 ? '🏆 Champion!' : '💪 Keep going!'}
`
    
    const scope = {
      user: {name: 'Alice'},
      score: 150
    }
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      ...scope,
      baseUrl: import.meta.url
    })
    
    return Content
  }
}

// Run API for pre-compiled MDX
export const runExamples = {
  // Basic run usage
  async basic() {
    // First compile to function body
    const mdxSource = '# Hello from run API!'
    const code = String(await compile(mdxSource, {
      outputFormat: 'function-body',
      jsxImportSource: 'react'
    }))
    
    // Then run the compiled code
    const {default: Content} = await run(code, {
      ...runtime,
      baseUrl: import.meta.url
    })
    
    return Content
  },

  // Run with components
  async withComponents() {
    const mdxSource = '<Button>Click me!</Button>'
    const code = String(await compile(mdxSource, {
      outputFormat: 'function-body',
      jsxImportSource: 'react'
    }))
    
    const Button = ({children}: {children: React.ReactNode}) =>
      runtime.jsx('button', {
        className: 'btn btn-primary',
        children
      })
    
    const {default: Content} = await run(code, {
      ...runtime,
      Button,
      baseUrl: import.meta.url
    })
    
    return Content
  }
}

// Processor API for advanced usage
export const processorExamples = {
  // Create reusable processor
  createProcessor() {
    return createProcessor({
      jsxImportSource: 'react',
      remarkPlugins: [],
      rehypePlugins: []
    })
  },

  // Use processor multiple times
  async useProcessor() {
    const processor = createProcessor({
      jsxImportSource: 'react'
    })
    
    const docs = [
      '# Document 1\n\nFirst document content.',
      '# Document 2\n\nSecond document content.',
      '# Document 3\n\nThird document content.'
    ]
    
    const compiled = await Promise.all(
      docs.map(doc => processor.process(doc))
    )
    
    return compiled.map(result => String(result))
  }
}

// Error handling examples
export const errorHandlingExamples = {
  // Handle compilation errors
  async compilationError() {
    const invalidMdx = '<UnknownComponent prop={unclosedBrace'
    
    try {
      await compile(invalidMdx, {jsxImportSource: 'react'})
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'compilation'
      }
    }
  },

  // Handle evaluation errors
  async evaluationError() {
    const problematicMdx = '{nonExistentVariable.property}'
    
    try {
      await evaluate(problematicMdx, {
        ...runtime,
        baseUrl: import.meta.url
      })
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'evaluation'
      }
    }
  },

  // Safe evaluation with fallbacks
  async safeEvaluation() {
    const mdxSource = '{user?.name || "Anonymous"} - {new Date().getFullYear()}'
    
    try {
      const {default: Content} = await evaluate(mdxSource, {
        ...runtime,
        user: undefined, // Simulate missing user
        baseUrl: import.meta.url
      })
      
      return {success: true, Content}
    } catch (error) {
      // Fallback content
      const fallbackMdx = 'Anonymous - 2024'
      const {default: FallbackContent} = await evaluate(fallbackMdx, {
        ...runtime,
        baseUrl: import.meta.url
      })
      
      return {success: false, Content: FallbackContent}
    }
  }
}

// Performance optimization examples
export const performanceExamples = {
  // Compilation caching
  compilationCache: new Map<string, string>(),
  
  async cachedCompile(mdxSource: string) {
    const cacheKey = Buffer.from(mdxSource).toString('base64')
    
    if (this.compilationCache.has(cacheKey)) {
      return this.compilationCache.get(cacheKey)!
    }
    
    const code = String(await compile(mdxSource, {
      jsxImportSource: 'react'
    }))
    
    this.compilationCache.set(cacheKey, code)
    return code
  },

  // Lazy compilation
  async lazyCompile(mdxSources: string[]) {
    const compileQueue = mdxSources.map(async (source, index) => ({
      index,
      code: await compile(source, {jsxImportSource: 'react'})
    }))
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 3
    const results = []
    
    for (let i = 0; i < compileQueue.length; i += batchSize) {
      const batch = compileQueue.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
    }
    
    return results.sort((a, b) => a.index - b.index)
  }
}

// Advanced integration examples
export const integrationExamples = {
  // Custom JSX pragma
  async customPragma() {
    const mdxSource = '<div>Custom pragma test</div>'
    
    const code = await compile(mdxSource, {
      jsxRuntime: 'classic',
      pragma: 'h',
      pragmaFrag: 'Fragment',
      pragmaImportSource: 'preact'
    })
    
    return String(code)
  },

  // Server-side rendering integration
  async serverSideRender() {
    const mdxSource = '# Server Rendered Content\n\nGenerated at: {new Date().toISOString()}'
    
    const code = String(await compile(mdxSource, {
      outputFormat: 'function-body',
      jsxImportSource: 'react'
    }))
    
    // This would typically be done on the server
    const {default: Content} = await run(code, {
      ...runtime,
      baseUrl: 'file:///server/'
    })
    
    return Content
  },

  // Dynamic import resolution
  async dynamicImports() {
    const mdxSource = `
import {DynamicChart} from './charts/dynamic.js'

# Dynamic Chart Example

<DynamicChart data={chartData} />
`
    
    // Mock dynamic import resolver
    const mockResolver = {
      './charts/dynamic.js': {
        DynamicChart: ({data}: {data: number[]}) =>
          runtime.jsx('div', {
            children: `Chart with ${data.length} data points`
          })
      }
    }
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      ...mockResolver,
      chartData: [1, 2, 3, 4, 5],
      baseUrl: import.meta.url
    })
    
    return Content
  }
}

// Export all examples
export const mdxAPIExamples = {
  compilationExamples,
  evaluationExamples,
  runExamples,
  processorExamples,
  errorHandlingExamples,
  performanceExamples,
  integrationExamples
}