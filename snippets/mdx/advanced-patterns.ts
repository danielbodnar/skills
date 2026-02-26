// MDX Advanced Patterns
// Complex usage patterns and advanced techniques for MDX

import {compile, evaluate, run, createProcessor} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import * as devRuntime from 'react/jsx-dev-runtime'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

// Custom MDX processor with plugins
export const customProcessor = {
  // Create a reusable processor
  createCustomProcessor() {
    return createProcessor({
      jsxImportSource: 'react',
      format: 'mdx',
      development: process.env.NODE_ENV === 'development',
      remarkPlugins: [
        // Custom remark plugin
        function remarkCustom() {
          return (tree: any) => {
            // Transform AST
            visit(tree, 'heading', (node: any) => {
              if (node.depth === 1) {
                node.data = node.data || {}
                node.data.hProperties = {
                  className: 'hero-heading',
                  id: node.children[0]?.value?.toLowerCase().replace(/\s+/g, '-')
                }
              }
            })
          }
        }
      ],
      rehypePlugins: [
        // Custom rehype plugin
        function rehypeCustom() {
          return (tree: any) => {
            // Transform HTML AST
            visit(tree, 'element', (node: any) => {
              if (node.tagName === 'pre') {
                node.properties.className = [
                  ...(node.properties.className || []),
                  'code-block'
                ]
              }
            })
          }
        }
      ]
    })
  },

  // Batch processing multiple files
  async batchProcess(files: {path: string, content: string}[]) {
    const processor = this.createCustomProcessor()
    
    return Promise.all(
      files.map(async ({path, content}) => ({
        path,
        compiled: String(await processor.process(content))
      }))
    )
  }
}

// Dynamic component loading
export const dynamicComponents = {
  // Component registry
  componentRegistry: new Map<string, React.ComponentType<any>>(),

  // Register components
  registerComponent(name: string, component: React.ComponentType<any>) {
    this.componentRegistry.set(name, component)
  },

  // Dynamic component resolver
  async resolveDynamicComponents(mdxSource: string) {
    // Extract component imports from MDX
    const importMatches = mdxSource.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)
    const components: Record<string, React.ComponentType<any>> = {}

    if (importMatches) {
      for (const match of importMatches) {
        const [, componentNames, modulePath] = match.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/) || []
        
        if (componentNames && modulePath) {
          const names = componentNames.split(',').map(name => name.trim())
          
          // Simulate dynamic import
          for (const name of names) {
            const component = this.componentRegistry.get(name)
            if (component) {
              components[name] = component
            }
          }
        }
      }
    }

    return components
  },

  // Evaluate with dynamic components
  async evaluateWithDynamicComponents(mdxSource: string) {
    const dynamicComponents = await this.resolveDynamicComponents(mdxSource)
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      ...dynamicComponents,
      baseUrl: import.meta.url
    })

    return Content
  }
}

// Code splitting and lazy loading
export const codeSplitting = {
  // Create lazy MDX component
  createLazyMDXComponent(mdxPromise: Promise<string>) {
    return React.lazy(async () => {
      const mdxSource = await mdxPromise
      const {default: Content} = await evaluate(mdxSource, {
        ...runtime,
        baseUrl: import.meta.url
      })
      
      return {default: Content}
    })
  },

  // Chunked compilation
  async compileInChunks(mdxSources: string[], chunkSize = 5) {
    const results = []
    
    for (let i = 0; i < mdxSources.length; i += chunkSize) {
      const chunk = mdxSources.slice(i, i + chunkSize)
      const chunkResults = await Promise.all(
        chunk.map(source => compile(source, {jsxImportSource: 'react'}))
      )
      results.push(...chunkResults)
    }
    
    return results
  },

  // Progressive loading
  async progressiveLoad(mdxSources: string[], onProgress?: (progress: number) => void) {
    const results = []
    
    for (let i = 0; i < mdxSources.length; i++) {
      const compiled = await compile(mdxSources[i], {jsxImportSource: 'react'})
      results.push(compiled)
      
      if (onProgress) {
        onProgress((i + 1) / mdxSources.length)
      }
    }
    
    return results
  }
}

// Server-side rendering patterns
export const ssrPatterns = {
  // Pre-compile for SSR
  async preCompileForSSR(mdxSource: string) {
    const code = String(await compile(mdxSource, {
      jsxImportSource: 'react',
      outputFormat: 'function-body',
      development: false
    }))
    
    return {
      code,
      hash: Buffer.from(code).toString('base64').substring(0, 8)
    }
  },

  // Hydration-safe evaluation
  async evaluateForHydration(mdxSource: string, isServer = false) {
    const runtimeToUse = isServer ? runtime : devRuntime
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtimeToUse,
      development: !isServer,
      baseUrl: import.meta.url
    })
    
    return Content
  },

  // Streaming SSR
  async *streamingSSR(mdxSources: string[]) {
    for (const source of mdxSources) {
      const {default: Content} = await evaluate(source, {
        ...runtime,
        baseUrl: import.meta.url
      })
      
      yield Content
    }
  }
}

// Cache strategies
export const cacheStrategies = {
  // In-memory cache
  compilationCache: new Map<string, {code: string, timestamp: number}>(),
  
  // Cache with TTL
  async cachedCompile(mdxSource: string, ttl = 5 * 60 * 1000) {
    const cacheKey = this.generateCacheKey(mdxSource)
    const cached = this.compilationCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.code
    }
    
    const code = String(await compile(mdxSource, {jsxImportSource: 'react'}))
    
    this.compilationCache.set(cacheKey, {
      code,
      timestamp: Date.now()
    })
    
    return code
  },

  // Generate cache key
  generateCacheKey(mdxSource: string): string {
    // Simple hash function
    let hash = 0
    for (let i = 0; i < mdxSource.length; i++) {
      const char = mdxSource.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  },

  // File system cache
  async fileSystemCache(mdxSource: string, cacheDir = '.mdx-cache') {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    
    const cacheKey = this.generateCacheKey(mdxSource)
    const cachePath = path.join(cacheDir, `${cacheKey}.js`)
    
    try {
      // Try to read from cache
      const cached = await fs.readFile(cachePath, 'utf-8')
      return cached
    } catch {
      // Compile and cache
      const code = String(await compile(mdxSource, {jsxImportSource: 'react'}))
      
      // Ensure cache directory exists
      await fs.mkdir(cacheDir, {recursive: true})
      await fs.writeFile(cachePath, code)
      
      return code
    }
  }
}

// Plugin development
export const customPlugins = {
  // Custom remark plugin for alerts
  remarkAlerts() {
    return (tree: any) => {
      visit(tree, 'blockquote', (node: any) => {
        const firstChild = node.children[0]
        if (firstChild?.type === 'paragraph') {
          const firstText = firstChild.children[0]
          if (firstText?.type === 'text') {
            const alertTypes = ['info', 'warning', 'error', 'success']
            const alertType = alertTypes.find(type => 
              firstText.value.toLowerCase().startsWith(`[!${type}]`)
            )
            
            if (alertType) {
              // Remove alert prefix from text
              firstText.value = firstText.value.replace(`[!${alertType}]`, '').trim()
              
              // Transform to custom alert node
              node.type = 'mdxJsxFlowElement'
              node.name = 'Alert'
              node.attributes = [{
                type: 'mdxJsxAttribute',
                name: 'type',
                value: alertType
              }]
            }
          }
        }
      })
    }
  },

  // Custom rehype plugin for code blocks
  rehypeCodeBlocks() {
    return (tree: any) => {
      visit(tree, 'element', (node: any) => {
        if (node.tagName === 'pre' && node.children[0]?.tagName === 'code') {
          const codeNode = node.children[0]
          const className = codeNode.properties?.className?.[0]
          
          if (className?.startsWith('language-')) {
            const language = className.replace('language-', '')
            
            // Transform to custom code block
            node.tagName = 'CodeBlock'
            node.properties = {
              language,
              code: codeNode.children[0]?.value || ''
            }
            node.children = []
          }
        }
      })
    }
  }
}

// Performance optimization
export const performanceOptimization = {
  // Compilation worker
  async compileWithWorker(mdxSource: string) {
    const {Worker, isMainThread, parentPort, workerData} = await import('node:worker_threads')
    
    if (isMainThread) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: {mdxSource}
        })
        
        worker.on('message', resolve)
        worker.on('error', reject)
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      })
    } else {
      // Worker thread
      const {mdxSource} = workerData
      const result = String(await compile(mdxSource, {jsxImportSource: 'react'}))
      parentPort?.postMessage(result)
    }
  },

  // Streaming compilation
  async *streamingCompile(mdxSources: AsyncIterable<string>) {
    for await (const source of mdxSources) {
      const compiled = await compile(source, {jsxImportSource: 'react'})
      yield String(compiled)
    }
  },

  // Memory-efficient processing
  async processLargeFile(mdxContent: string, chunkSize = 1000) {
    const chunks = []
    
    // Split content into manageable chunks
    for (let i = 0; i < mdxContent.length; i += chunkSize) {
      chunks.push(mdxContent.slice(i, i + chunkSize))
    }
    
    // Process chunks sequentially to avoid memory issues
    const results = []
    for (const chunk of chunks) {
      const compiled = await compile(chunk, {jsxImportSource: 'react'})
      results.push(String(compiled))
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
    }
    
    return results.join('\n')
  }
}

// Error recovery and resilience
export const errorRecovery = {
  // Graceful error handling
  async safeCompile(mdxSource: string, fallback = '# Error loading content') {
    try {
      return String(await compile(mdxSource, {jsxImportSource: 'react'}))
    } catch (error) {
      console.error('MDX compilation failed:', error)
      return String(await compile(fallback, {jsxImportSource: 'react'}))
    }
  },

  // Retry compilation with different options
  async retryCompile(mdxSource: string, maxRetries = 3) {
    const optionsSets = [
      {jsxImportSource: 'react', development: false},
      {jsxImportSource: 'react', development: true},
      {jsxImportSource: 'react', format: 'esm'},
      {jsxImportSource: 'react', outputFormat: 'function-body'}
    ]
    
    let lastError: Error | null = null
    
    for (let i = 0; i < Math.min(maxRetries, optionsSets.length); i++) {
      try {
        const options = optionsSets[i]
        return String(await compile(mdxSource, options))
      } catch (error) {
        lastError = error as Error
        console.warn(`Compilation attempt ${i + 1} failed:`, error)
      }
    }
    
    throw lastError
  },

  // Partial compilation recovery
  async partialCompile(mdxSource: string) {
    const lines = mdxSource.split('\n')
    const compiledLines = []
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const lineResult = await compile(lines[i], {jsxImportSource: 'react'})
        compiledLines.push(String(lineResult))
      } catch (error) {
        // Skip problematic lines or replace with safe content
        compiledLines.push(`<!-- Line ${i + 1} failed to compile -->`)
      }
    }
    
    return compiledLines.join('\n')
  }
}

// Security patterns
export const securityPatterns = {
  // Sanitize MDX content
  sanitizeMDXContent(mdxSource: string) {
    // Remove potentially dangerous imports
    const sanitized = mdxSource
      .replace(/import\s+.*?from\s+['"](?![@./])[^'"]*['"]/g, '') // Remove external imports
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/dangerouslySetInnerHTML/g, '') // Remove dangerous props
      .replace(/javascript:/gi, '') // Remove javascript: URLs
    
    return sanitized
  },

  // Validate component usage
  validateComponents(mdxSource: string, allowedComponents: string[]) {
    const componentMatches = mdxSource.match(/<(\w+)[\s\/>]/g) || []
    const usedComponents = componentMatches.map(match => 
      match.replace(/<(\w+)[\s\/>]/, '$1')
    )
    
    const invalidComponents = usedComponents.filter(component => 
      !allowedComponents.includes(component) && 
      !component.match(/^[a-z]/) // Allow HTML elements
    )
    
    if (invalidComponents.length > 0) {
      throw new Error(`Invalid components used: ${invalidComponents.join(', ')}`)
    }
    
    return true
  },

  // Content Security Policy for MDX
  generateCSP(allowedDomains: string[] = []) {
    return {
      'script-src': ["'self'", "'unsafe-inline'", ...allowedDomains],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', ...allowedDomains],
      'connect-src': ["'self'", ...allowedDomains]
    }
  }
}

// Utility functions
function visit(tree: any, type: string, visitor: (node: any) => void) {
  if (tree.type === type) {
    visitor(tree)
  }
  
  if (tree.children) {
    for (const child of tree.children) {
      visit(child, type, visitor)
    }
  }
}

// Export all advanced patterns
export const mdxAdvancedPatterns = {
  customProcessor,
  dynamicComponents,
  codeSplitting,
  ssrPatterns,
  cacheStrategies,
  customPlugins,
  performanceOptimization,
  errorRecovery,
  securityPatterns
}