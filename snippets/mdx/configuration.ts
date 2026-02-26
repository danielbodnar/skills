// MDX Configuration Examples
// Various ways to configure MDX compilation and integration

import {compile} from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

// Basic MDX compiler options
export const basicOptions = {
  // JSX runtime configuration
  jsxImportSource: 'react',
  jsxRuntime: 'automatic' as const,
  
  // Output format
  format: 'esm' as const,
  outputFormat: 'program' as const,
  
  // Development mode
  development: process.env.NODE_ENV === 'development',
  
  // Base URL for imports
  baseUrl: import.meta.url
}

// Advanced compiler options with plugins
export const advancedOptions = {
  ...basicOptions,
  
  // Remark plugins (markdown processing)
  remarkPlugins: [
    remarkGfm,                              // GitHub Flavored Markdown
    [remarkFrontmatter, 'yaml'],            // YAML frontmatter
    remarkMath,                             // Math expressions
  ],
  
  // Rehype plugins (HTML processing)
  rehypePlugins: [
    rehypeHighlight,                        // Syntax highlighting
    rehypeSlug,                             // Add IDs to headings
    [rehypeKatex, {strict: false}],         // Math rendering
  ],
  
  // Provider import source
  providerImportSource: '@mdx-js/react'
}

// Framework-specific configurations
export const frameworkConfigs = {
  // React configuration
  react: {
    jsxImportSource: 'react',
    providerImportSource: '@mdx-js/react'
  },
  
  // Preact configuration
  preact: {
    jsxImportSource: 'preact',
    providerImportSource: '@mdx-js/preact'
  },
  
  // Vue configuration
  vue: {
    jsxImportSource: 'vue',
    providerImportSource: '@mdx-js/vue'
  },
  
  // Svelte configuration
  svelte: {
    jsxImportSource: 'svelte-jsx'
  },
  
  // Solid configuration
  solid: {
    jsxImportSource: 'solid-js/h'
  },
  
  // Emotion configuration
  emotion: {
    jsxImportSource: '@emotion/react'
  }
}

// Bun configuration (bunfig.toml)
export const bunConfig = `
# bunfig.toml
preload = ["./bun-mdx.ts"]

[build]
# Optional: configure build settings
target = "bun"
splitting = true
`

// Bun MDX plugin setup
export const bunMdxPlugin = `
// bun-mdx.ts
/// <reference types="bun-types" />

import mdx from '@mdx-js/esbuild'
import {type BunPlugin, plugin} from 'bun'

await plugin(mdx({
  jsxImportSource: 'react',
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeHighlight]
}) as unknown as BunPlugin)
`

// ESBuild configuration
export const esbuildConfig = `
// build.ts
import mdx from '@mdx-js/esbuild'
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/bundle.js',
  plugins: [
    mdx({
      jsxImportSource: 'react',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight]
    })
  ],
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'file'
  }
})
`

// Vite configuration
export const viteConfig = `
// vite.config.ts
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

export default defineConfig({
  plugins: [
    react(),
    mdx({
      jsxImportSource: 'react',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight]
    })
  ],
  optimizeDeps: {
    include: ['@mdx-js/react']
  }
})
`

// Next.js configuration
export const nextjsConfig = `
// next.config.mjs
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight]
  }
})

export default withMDX({
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: true // Use Rust-based MDX compiler
  }
})
`

// Astro configuration
export const astroConfig = `
// astro.config.mjs
import {defineConfig} from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [
    react(),
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {theme: 'github-dark'},
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug]
    })
  ]
})
`

// Webpack configuration
export const webpackConfig = `
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
            options: {
              presets: ['@babel/preset-react']
            }
          },
          {
            loader: '@mdx-js/loader',
            options: {
              jsxImportSource: 'react',
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight]
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mdx']
  }
}

export default config
`

// Rollup configuration  
export const rollupConfig = `
// rollup.config.js
import mdx from '@mdx-js/rollup'
import {babel} from '@rollup/plugin-babel'

export default {
  plugins: [
    mdx({
      jsxImportSource: 'react',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight]
    }),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react']
    })
  ]
}
`

// TypeScript configuration for MDX
export const typescriptConfig = `
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx", 
    "**/*.mdx"
  ]
}
`

// MDX component types
export const mdxTypes = `
// types/mdx.d.ts
declare module '*.mdx' {
  import type {ComponentType} from 'react'
  const Component: ComponentType<{
    components?: import('mdx/types').MDXComponents
  }>
  export default Component
}

// Global MDX components
declare global {
  type MDXProvidedComponents = import('mdx/types').MDXComponents
}
`

// Environment-specific configurations
export const environmentConfigs = {
  development: {
    ...basicOptions,
    development: true,
    sourceMap: true,
    // Add more debugging info
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight]
  },
  
  production: {
    ...basicOptions,
    development: false,
    // Optimize for production
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeHighlight,
      rehypeSlug,
      [rehypeKatex, {strict: true}]
    ]
  },
  
  test: {
    ...basicOptions,
    // Minimal config for testing
    remarkPlugins: [],
    rehypePlugins: []
  }
}

// Plugin configurations
export const pluginConfigurations = {
  // GitHub Flavored Markdown
  gfm: {
    plugin: remarkGfm,
    options: {
      singleTilde: false,
      tableCellPadding: true,
      tablePipeAlign: true
    }
  },
  
  // Math support
  math: {
    remarkPlugin: remarkMath,
    rehypePlugin: [rehypeKatex, {
      strict: false,
      throwOnError: false,
      errorColor: '#cc0000'
    }]
  },
  
  // Syntax highlighting
  highlight: {
    plugin: rehypeHighlight,
    options: {
      languages: ['javascript', 'typescript', 'jsx', 'tsx', 'css', 'html'],
      plainText: ['txt', 'text']
    }
  },
  
  // Frontmatter
  frontmatter: {
    plugin: remarkFrontmatter,
    options: ['yaml', 'toml']
  }
}

export {
  basicOptions,
  advancedOptions,
  frameworkConfigs,
  environmentConfigs,
  pluginConfigurations
}