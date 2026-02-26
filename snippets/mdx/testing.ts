// MDX Testing Examples
// Comprehensive testing strategies for MDX components and compilation

import {compile, evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import {render, screen} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'
import React from 'react'

// Unit testing MDX compilation
export const compilationTests = {
  // Test basic compilation
  async testBasicCompilation() {
    const mdxSource = '# Hello World'
    const result = await compile(mdxSource, {
      jsxImportSource: 'react'
    })
    
    const code = String(result)
    expect(code).toContain('h1')
    expect(code).toContain('Hello World')
    expect(code).toContain('jsx')
  },

  // Test compilation with components
  async testComponentCompilation() {
    const mdxSource = '<CustomButton>Click me</CustomButton>'
    const result = await compile(mdxSource, {
      jsxImportSource: 'react'
    })
    
    const code = String(result)
    expect(code).toContain('CustomButton')
    expect(code).toContain('Click me')
  },

  // Test compilation errors
  async testCompilationErrors() {
    const invalidMdx = '<UnclosedTag>Content'
    
    await expect(
      compile(invalidMdx, {jsxImportSource: 'react'})
    ).rejects.toThrow()
  }
}

// Testing compiled MDX components
export const componentTests = {
  // Test rendered output
  async testRenderedComponent() {
    const mdxSource = '# Test Heading\n\nSome **bold** text.'
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      baseUrl: import.meta.url
    })
    
    render(React.createElement(Content))
    
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Test Heading')
    expect(screen.getByText('bold')).toBeInTheDocument()
  },

  // Test component props
  async testComponentProps() {
    const mdxSource = '# Hello {props.name}!'
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      baseUrl: import.meta.url
    })
    
    render(React.createElement(Content, {name: 'World'}))
    
    expect(screen.getByRole('heading')).toHaveTextContent('Hello World!')
  },

  // Test custom components
  async testCustomComponents() {
    const mdxSource = '<Alert type="success">Success message</Alert>'
    
    const Alert = vi.fn(({type, children}) =>
      React.createElement('div', {
        className: `alert alert-${type}`,
        'data-testid': 'alert'
      }, children)
    )
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      Alert,
      baseUrl: import.meta.url
    })
    
    render(React.createElement(Content))
    
    expect(Alert).toHaveBeenCalledWith(
      {type: 'success', children: 'Success message'},
      {}
    )
    
    const alertElement = screen.getByTestId('alert')
    expect(alertElement).toHaveClass('alert', 'alert-success')
  }
}

// Testing MDX with providers
export const providerTests = {
  // Test MDXProvider integration
  async testMDXProvider() {
    const {MDXProvider} = await import('@mdx-js/react')
    const mdxSource = '# Custom Heading\n\n<CustomComponent />'
    
    const CustomComponent = () =>
      React.createElement('div', {
        'data-testid': 'custom-component'
      }, 'Custom content')
    
    const customH1 = ({children}: {children: React.ReactNode}) =>
      React.createElement('h1', {
        'data-testid': 'custom-heading',
        style: {color: 'blue'}
      }, children)
    
    const components = {
      h1: customH1,
      CustomComponent
    }
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      baseUrl: import.meta.url
    })
    
    render(
      React.createElement(MDXProvider, {components},
        React.createElement(Content)
      )
    )
    
    const heading = screen.getByTestId('custom-heading')
    expect(heading).toHaveTextContent('Custom Heading')
    expect(heading).toHaveStyle({color: 'blue'})
    
    expect(screen.getByTestId('custom-component')).toBeInTheDocument()
  }
}

// Testing MDX with plugins
export const pluginTests = {
  // Test remark plugins
  async testRemarkPlugins() {
    const remarkGfm = (await import('remark-gfm')).default
    
    const mdxSource = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

~~strikethrough~~
`
    
    const result = await compile(mdxSource, {
      jsxImportSource: 'react',
      remarkPlugins: [remarkGfm]
    })
    
    const code = String(result)
    expect(code).toContain('table')
    expect(code).toContain('del') // strikethrough becomes <del>
  },

  // Test rehype plugins
  async testRehypePlugins() {
    const rehypeSlug = (await import('rehype-slug')).default
    const mdxSource = '# Heading with ID'
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      baseUrl: import.meta.url
    }, {
      rehypePlugins: [rehypeSlug]
    })
    
    render(React.createElement(Content))
    
    const heading = screen.getByRole('heading')
    expect(heading).toHaveAttribute('id', 'heading-with-id')
  }
}

// Performance testing
export const performanceTests = {
  // Test compilation performance
  async testCompilationPerformance() {
    const mdxSource = `
# Performance Test

${Array(100).fill('').map((_, i) => `
## Section ${i}

This is section ${i} with some content.

<Component${i} prop="value${i}" />
`).join('\n')}
`
    
    const startTime = performance.now()
    await compile(mdxSource, {jsxImportSource: 'react'})
    const endTime = performance.now()
    
    const compilationTime = endTime - startTime
    expect(compilationTime).toBeLessThan(5000) // Should compile in less than 5 seconds
  },

  // Test memory usage
  async testMemoryUsage() {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Compile multiple MDX documents
    const promises = Array(50).fill(0).map(async (_, i) => {
      const mdxSource = `# Document ${i}\n\nContent for document ${i}.`
      return compile(mdxSource, {jsxImportSource: 'react'})
    })
    
    await Promise.all(promises)
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
  }
}

// Error handling tests
export const errorTests = {
  // Test syntax errors
  async testSyntaxErrors() {
    const invalidMdx = '<div>Unclosed div'
    
    await expect(
      compile(invalidMdx, {jsxImportSource: 'react'})
    ).rejects.toThrow(/Expected/)
  },

  // Test runtime errors
  async testRuntimeErrors() {
    const mdxSource = '{undefined.property}'
    
    await expect(
      evaluate(mdxSource, {
        ...runtime,
        baseUrl: import.meta.url
      })
    ).rejects.toThrow()
  },

  // Test error boundaries
  async testErrorBoundary() {
    class ErrorBoundary extends React.Component<
      {children: React.ReactNode},
      {hasError: boolean}
    > {
      constructor(props: {children: React.ReactNode}) {
        super(props)
        this.state = {hasError: false}
      }
      
      static getDerivedStateFromError() {
        return {hasError: true}
      }
      
      render() {
        if (this.state.hasError) {
          return React.createElement('div', {
            'data-testid': 'error-fallback'
          }, 'Something went wrong.')
        }
        
        return this.props.children
      }
    }
    
    const ProblematicComponent = () => {
      throw new Error('Component error')
    }
    
    const mdxSource = '<ProblematicComponent />'
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      ProblematicComponent,
      baseUrl: import.meta.url
    })
    
    render(
      React.createElement(ErrorBoundary, {},
        React.createElement(Content)
      )
    )
    
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
  }
}

// Integration tests
export const integrationTests = {
  // Test with Next.js
  async testNextjsIntegration() {
    // Mock Next.js dynamic imports
    const mockDynamic = vi.fn().mockImplementation((importFn) => {
      return React.forwardRef((props, ref) =>
        React.createElement('div', {
          ...props,
          ref,
          'data-testid': 'dynamic-component'
        })
      )
    })
    
    const mdxSource = `
import dynamic from 'next/dynamic'

export const DynamicComponent = dynamic(() => import('./component'))

# Next.js Integration

<DynamicComponent />
`
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      dynamic: mockDynamic,
      baseUrl: import.meta.url
    })
    
    render(React.createElement(Content))
    
    expect(screen.getByTestId('dynamic-component')).toBeInTheDocument()
  },

  // Test with TypeScript
  async testTypeScriptIntegration() {
    interface ButtonProps {
      variant: 'primary' | 'secondary'
      children: React.ReactNode
    }
    
    const TypedButton: React.FC<ButtonProps> = ({variant, children}) =>
      React.createElement('button', {
        className: `btn btn-${variant}`,
        'data-testid': 'typed-button'
      }, children)
    
    const mdxSource = '<TypedButton variant="primary">Click me</TypedButton>'
    
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      TypedButton,
      baseUrl: import.meta.url
    })
    
    render(React.createElement(Content))
    
    const button = screen.getByTestId('typed-button')
    expect(button).toHaveClass('btn', 'btn-primary')
    expect(button).toHaveTextContent('Click me')
  }
}

// Test utilities
export const testUtils = {
  // Helper to render MDX content
  async renderMDX(mdxSource: string, components = {}, props = {}) {
    const {default: Content} = await evaluate(mdxSource, {
      ...runtime,
      ...components,
      baseUrl: import.meta.url
    })
    
    return render(React.createElement(Content, props))
  },

  // Helper to compile and check output
  async compileAndCheck(mdxSource: string, expectedContent: string[]) {
    const result = await compile(mdxSource, {
      jsxImportSource: 'react'
    })
    
    const code = String(result)
    
    expectedContent.forEach(content => {
      expect(code).toContain(content)
    })
    
    return code
  },

  // Mock component factory
  createMockComponent(testId: string) {
    return vi.fn(({children, ...props}) =>
      React.createElement('div', {
        'data-testid': testId,
        ...props
      }, children)
    )
  }
}

// Test suite setup
export const testSetup = {
  // Setup for Vitest
  vitestSetup: `
// vitest.config.ts
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
})

// src/test-setup.ts
import '@testing-library/jest-dom'
`,

  // Setup for Jest
  jestSetup: `
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapping: {
    '\\\\.(css|less|scss)$': 'identity-obj-proxy'
  }
}

// src/test-setup.ts
import '@testing-library/jest-dom'
`
}

// Export all test examples
export const mdxTestExamples = {
  compilationTests,
  componentTests,
  providerTests,
  pluginTests,
  performanceTests,
  errorTests,
  integrationTests,
  testUtils,
  testSetup
}