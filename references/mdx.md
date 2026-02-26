# MDX Reference

**Always remember to reference ~/.claude/references/mdx.md and look for snippets and examples in ~/.claude/snippets/mdx/**

## Quick Reference

- Installation: `bun add @mdx-js/mdx @mdx-js/esbuild @types/mdx`
- Import: `import {compile, evaluate} from '@mdx-js/mdx'`
- Documentation: <https://mdxjs.com/>
- GitHub: <https://github.com/mdx-js/mdx>
- Package: <https://www.npmjs.com/package/@mdx-js/mdx>

## Default Usage Patterns

MDX enables writing JSX components directly within Markdown documents:

- **MDX Format**: Seamlessly blend Markdown and JSX for interactive content
- **Component Integration**: Import React/Vue components and use them in Markdown
- **Framework Agnostic**: Supports React, Preact, Vue, Svelte, and more
- **Build-time Compilation**: Zero runtime overhead with compile-time processing
- **Plugin Ecosystem**: Extensive remark/rehype plugin support for customization
- **TypeScript Support**: Fully typed with excellent TypeScript integration

## Resources and Documentation

- [MDX Website](https://mdxjs.com/)
  - [Getting Started](https://mdxjs.com/docs/getting-started/)
  - [What is MDX?](https://mdxjs.com/docs/what-is-mdx/)
  - [Using MDX](https://mdxjs.com/docs/using-mdx/)
  - [Extending MDX](https://mdxjs.com/docs/extending-mdx/)
  - [Table of Components](https://mdxjs.com/table-of-components/)
  - [Guides](https://mdxjs.com/guides/)
    - [Injecting Components](https://mdxjs.com/guides/injecting-components/)
    - [MDX on Demand](https://mdxjs.com/guides/mdx-on-demand/)
    - [Frontmatter](https://mdxjs.com/guides/frontmatter/)
    - [Math](https://mdxjs.com/guides/math/)
    - [Syntax Highlighting](https://mdxjs.com/guides/syntax-highlighting/)
  - [API Reference](https://mdxjs.com/packages/)
    - [@mdx-js/mdx](https://mdxjs.com/packages/mdx/)
    - [@mdx-js/react](https://mdxjs.com/packages/react/)
    - [@mdx-js/vue](https://mdxjs.com/packages/vue/)
    - [@mdx-js/esbuild](https://mdxjs.com/packages/esbuild/)
    - [@mdx-js/loader](https://mdxjs.com/packages/loader/)
    - [@mdx-js/rollup](https://mdxjs.com/packages/rollup/)
    - [@mdx-js/node-loader](https://mdxjs.com/packages/node-loader/)
  - [Migration Guides](https://mdxjs.com/migrating/)
    - [Migrating from v2](https://mdxjs.com/migrating/v2/)
    - [Migrating from v1](https://mdxjs.com/migrating/v1/)
- [GitHub Repository](https://github.com/mdx-js/mdx)
  - [Packages](https://github.com/mdx-js/mdx/tree/main/packages)
  - [Documentation](https://github.com/mdx-js/mdx/tree/main/docs)
  - [Examples](https://github.com/mdx-js/mdx/tree/main/examples)
  - [Contributing](https://github.com/mdx-js/mdx/blob/main/.github/contributing.md)
- [Community Resources](https://mdxjs.com/community/)
  - [Discussions](https://github.com/mdx-js/mdx/discussions)
  - [Awesome MDX](https://github.com/transitive-bullshit/awesome-mdx)
  - [Blog Posts](https://mdxjs.com/blog/)

## Core Packages

### @mdx-js/mdx

Core MDX compiler for transforming `.mdx` files to JavaScript:

```typescript
import {compile, evaluate} from '@mdx-js/mdx'

// Compile MDX to JavaScript
const code = await compile('# Hello *world*!', {
  jsxImportSource: 'react',
  format: 'esm'
})

// Evaluate MDX directly
const {default: Content} = await evaluate('# Hello *world*!', {
  ...runtime,
  baseUrl: import.meta.url
})
```

### @mdx-js/esbuild

ESBuild plugin for processing MDX files (recommended for Bun):

```typescript
import mdx from '@mdx-js/esbuild'
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.js'],
  plugins: [mdx()],
  bundle: true,
  outfile: 'dist/bundle.js'
})
```

### @mdx-js/react

React provider and utilities for MDX components:

```typescript
import {MDXProvider} from '@mdx-js/react'

const components = {
  h1: (props) => <h1 style={{color: 'blue'}} {...props} />,
  code: (props) => <code style={{background: '#f0f0f0'}} {...props} />
}

<MDXProvider components={components}>
  <Content />
</MDXProvider>
```

### @mdx-js/vue

Vue integration for MDX components:

```typescript
import {MDXProvider} from '@mdx-js/vue'
import {createApp} from 'vue'

const app = createApp({
  components: {MDXProvider, Content},
  template: '<MDXProvider :components="components"><Content /></MDXProvider>'
})
```

## Framework Integration

### Bun Integration

```toml
# bunfig.toml
preload = ["./bun-mdx.ts"]
```

```typescript
// bun-mdx.ts
import mdx from '@mdx-js/esbuild'
import {type BunPlugin, plugin} from 'bun'

await plugin(mdx() as unknown as BunPlugin)
```

### Astro Integration

```typescript
// astro.config.mjs
import mdx from '@astrojs/mdx'

export default {
  integrations: [mdx()]
}
```

### Next.js Integration

```javascript
// next.config.mjs
import createMDX from '@next/mdx'

const withMDX = createMDX({
  extension: /\.mdx?$/
})

export default withMDX({
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx']
})
```

### Vite Integration

```typescript
// vite.config.ts
import mdx from '@mdx-js/rollup'

export default {
  plugins: [
    mdx({
      jsxImportSource: 'react'
    })
  ]
}
```

## JSX Runtime Configuration

MDX supports multiple JSX runtimes:

```typescript
// React
import * as runtime from 'react/jsx-runtime'
const {default: Content} = await evaluate(mdx, {
  ...runtime,
  baseUrl: import.meta.url
})

// Preact
import * as runtime from 'preact/jsx-runtime'
const {default: Content} = await evaluate(mdx, {
  ...runtime,
  baseUrl: import.meta.url
})

// Vue
await compile(mdx, {jsxImportSource: 'vue'})

// Svelte
await compile(mdx, {jsxImportSource: 'svelte-jsx'})

// Solid
await compile(mdx, {jsxImportSource: 'solid-js/h'})

// Emotion
await compile(mdx, {jsxImportSource: '@emotion/react'})
```

## Plugin Ecosystem

### Remark Plugins (Markdown Processing)

```typescript
import {compile} from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'

await compile(content, {
  remarkPlugins: [
    remarkGfm,
    [remarkFrontmatter, 'yaml'],
    remarkMath
  ]
})
```

### Rehype Plugins (HTML Processing)

```typescript
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

await compile(content, {
  rehypePlugins: [
    rehypeHighlight,
    rehypeSlug,
    [rehypeKatex, {strict: false}]
  ]
})
```

## Component Injection

### Via MDXProvider

```typescript
import {MDXProvider} from '@mdx-js/react'

const components = {
  // Override HTML elements
  h1: ({children}) => <h1 className="title">{children}</h1>,
  p: ({children}) => <p className="paragraph">{children}</p>,
  
  // Custom components
  Alert: ({type, children}) => (
    <div className={`alert alert-${type}`}>{children}</div>
  ),
  
  // Code blocks
  pre: ({children}) => (
    <pre className="code-block">{children}</pre>
  )
}

<MDXProvider components={components}>
  <Content />
</MDXProvider>
```

### Via Component Props

```typescript
<Content 
  components={{
    h1: (props) => <h1 className="custom-heading" {...props} />,
    MyButton: ({children}) => <button className="btn">{children}</button>
  }}
/>
```

### Via mdx-components File

```typescript
// mdx-components.tsx
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({children}) => <h1 className="heading">{children}</h1>,
    ...components,
  }
}
```

## Advanced Usage Patterns

### Dynamic MDX Compilation

```typescript
import {compile, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

// Server-side compilation
const code = String(await compile(mdxSource, {
  outputFormat: 'function-body'
}))

// Client-side execution
const {default: Content} = await run(code, {
  ...runtime,
  baseUrl: import.meta.url
})
```

### MDX with TypeScript

```typescript
// types.d.ts
declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}

// Usage
import Content from './example.mdx'

const App = () => <Content />
```

### Custom Webpack Configuration

```typescript
// webpack.config.js
import {fileURLToPath} from 'node:url'

const config = {
  module: {
    rules: [
      {
        test: /\.mdx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {presets: ['@babel/preset-react']}
          },
          {
            loader: '@mdx-js/loader',
            options: {
              jsxImportSource: 'react'
            }
          }
        ]
      }
    ]
  }
}
```

## Code Examples Location

Comprehensive examples available in `~/.claude/snippets/mdx/`:

- Basic MDX syntax and usage patterns
- Framework integration examples (React, Vue, Astro)
- Plugin configuration and customization
- Component injection techniques
- Build tool integration (Bun, esbuild, Vite, webpack)
- TypeScript integration patterns
- Dynamic compilation examples
- Advanced customization patterns
- Performance optimization techniques
- Testing MDX components

## Schema and Type Definitions

Type definitions and MDX component schemas in `~/.claude/snippets/mdx/schemas/`

## Linting and Formatting

Latest configuration files in `~/.claude/snippets/mdx/linting/`

## Migration Guides

### From MDX v2 to v3

- Modern ES2024 syntax support
- Improved TypeScript integration
- Enhanced performance
- Simplified configuration
- Better error messages

### From Markdown to MDX

- Gradual migration path
- Component integration
- Enhanced interactivity
- Maintained readability

## Performance Best Practices

### Build-time Optimization

- Use build-time compilation for static content
- Minimize runtime processing
- Optimize bundle size with tree shaking
- Cache compiled results

### Runtime Optimization

- Use React.memo for expensive components
- Implement lazy loading for heavy components
- Optimize image and media loading
- Use code splitting for large MDX bundles

## Security Considerations

### Content Sanitization

- Validate user-generated MDX content
- Use allowlists for permitted components
- Sanitize HTML output when necessary
- Implement CSP headers for web applications

### Component Security

- Validate component props
- Avoid dangerous HTML rendering
- Use secure component patterns
- Implement proper error boundaries

## Testing Strategies

### Unit Testing

- Test compiled MDX output
- Mock component dependencies
- Verify component integration
- Test plugin functionality

### Integration Testing

- Test full compilation pipeline
- Verify framework integration
- Test component rendering
- Validate build output

## Common Patterns

### Documentation Sites

- File-based routing with MDX
- Component libraries integration
- Code syntax highlighting
- Interactive examples

### Blog Systems

- Frontmatter support
- Dynamic content generation
- SEO optimization
- Social media integration

### Interactive Content

- Embedded widgets and charts
- Form integration
- Real-time data visualization
- Interactive tutorials

## Troubleshooting

### Common Issues

- JSX runtime configuration
- Component import resolution
- Plugin compatibility
- Build tool integration

### Debug Techniques

- Enable development mode
- Use source maps for debugging
- Inspect compiled output
- Validate plugin configurations
