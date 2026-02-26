// MDX Integration Examples
// Comprehensive examples for integrating MDX with various frameworks and tools

import {compile, evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

// React Integration
export const reactIntegration = {
  // Basic React component with MDX
  basicComponent: `
// components/MDXWrapper.tsx
import React from 'react'
import {MDXProvider} from '@mdx-js/react'
import type {MDXComponents} from 'mdx/types'

const components: MDXComponents = {
  h1: ({children}) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
  h2: ({children}) => <h2 className="text-2xl font-semibold mb-3">{children}</h2>,
  p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
  code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded">{children}</code>,
  pre: ({children}) => <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">{children}</pre>
}

interface MDXWrapperProps {
  children: React.ReactNode
}

export const MDXWrapper: React.FC<MDXWrapperProps> = ({children}) => (
  <MDXProvider components={components}>
    <div className="prose max-w-none">
      {children}
    </div>
  </MDXProvider>
)
`,

  // React Hook for dynamic MDX
  dynamicHook: `
// hooks/useMDX.ts
import {useState, useEffect} from 'react'
import {evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

export const useMDX = (mdxSource: string) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const compileMDX = async () => {
      try {
        setLoading(true)
        const {default: MDXComponent} = await evaluate(mdxSource, {
          ...runtime,
          baseUrl: import.meta.url
        })
        setComponent(() => MDXComponent)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setComponent(null)
      } finally {
        setLoading(false)
      }
    }

    compileMDX()
  }, [mdxSource])

  return {Component, loading, error}
}

// Usage example
const MDXRenderer = ({source}: {source: string}) => {
  const {Component, loading, error} = useMDX(source)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!Component) return null

  return <Component />
}
`
}

// Vue Integration
export const vueIntegration = {
  // Vue 3 setup with MDX
  vueSetup: `
// composables/useMDX.ts
import {ref, watchEffect} from 'vue'
import {evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import {MDXProvider} from '@mdx-js/vue'

export const useMDX = (mdxSource: string) => {
  const component = ref(null)
  const loading = ref(true)
  const error = ref(null)

  watchEffect(async () => {
    try {
      loading.value = true
      const {default: MDXComponent} = await evaluate(mdxSource, {
        ...runtime,
        baseUrl: import.meta.url
      })
      component.value = MDXComponent
      error.value = null
    } catch (err) {
      error.value = err
      component.value = null
    } finally {
      loading.value = false
    }
  })

  return {component, loading, error}
}
`,

  vueComponent: `
<!-- components/MDXRenderer.vue -->
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <MDXProvider v-else-if="component" :components="components">
    <component :is="component" />
  </MDXProvider>
</template>

<script setup lang="ts">
import {MDXProvider} from '@mdx-js/vue'
import {useMDX} from '@/composables/useMDX'

interface Props {
  source: string
}

const props = defineProps<Props>()
const {component, loading, error} = useMDX(props.source)

const components = {
  h1: (props: any) => h('h1', {class: 'text-3xl font-bold'}, props.children),
  p: (props: any) => h('p', {class: 'mb-4'}, props.children)
}
</script>
`
}

// Astro Integration
export const astroIntegration = {
  // Astro configuration
  astroConfig: `
// astro.config.mjs
import {defineConfig} from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  integrations: [
    react(),
    tailwind(),
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark-dimmed'
      },
      remarkPlugins: [],
      rehypePlugins: []
    })
  ]
})
`,

  // Astro component with MDX
  astroComponent: `
---
// src/components/BlogPost.astro
import {type CollectionEntry} from 'astro:content'
import Layout from '@/layouts/Layout.astro'

interface Props {
  post: CollectionEntry<'blog'>
}

const {post} = Astro.props
const {Content} = await post.render()
---

<Layout title={post.data.title}>
  <article class="prose max-w-none">
    <header class="mb-8">
      <h1 class="text-4xl font-bold mb-2">{post.data.title}</h1>
      <p class="text-gray-600">
        Published on {post.data.publishDate.toLocaleDateString()}
      </p>
    </header>
    
    <Content />
  </article>
</Layout>
`,

  // Astro content collections
  contentConfig: `
// src/content/config.ts
import {defineCollection, z} from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false)
  })
})

export const collections = {
  blog: blogCollection
}
`
}

// Next.js Integration
export const nextjsIntegration = {
  // Next.js 13+ App Router with MDX
  appRouterSetup: `
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
    mdxRs: true
  }
})
`,

  // MDX components file
  mdxComponents: `
// mdx-components.tsx
import type {MDXComponents} from 'mdx/types'
import Image, {type ImageProps} from 'next/image'
import Link from 'next/link'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({children}) => (
      <h1 className="text-4xl font-bold mb-6 text-gray-900">{children}</h1>
    ),
    h2: ({children}) => (
      <h2 className="text-3xl font-semibold mb-4 text-gray-800">{children}</h2>
    ),
    p: ({children}) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    a: ({href, children}) => (
      <Link href={href as string} className="text-blue-600 hover:underline">
        {children}
      </Link>
    ),
    img: (props) => (
      <Image
        sizes="100vw"
        style={{width: '100%', height: 'auto'}}
        {...(props as ImageProps)}
      />
    ),
    blockquote: ({children}) => (
      <blockquote className="border-l-4 border-blue-500 pl-6 italic my-6">
        {children}
      </blockquote>
    ),
    ...components,
  }
}
`,

  // Dynamic MDX loading
  dynamicMDX: `
// app/blog/[...slug]/page.tsx
import {notFound} from 'next/navigation'
import {compile, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

async function getMDXContent(slug: string[]) {
  try {
    // Fetch MDX content from CMS or file system
    const mdxSource = await fetchMDXFromCMS(slug.join('/'))
    
    // Compile MDX
    const code = String(await compile(mdxSource, {
      outputFormat: 'function-body',
      jsxImportSource: 'react'
    }))
    
    // Run compiled code
    const {default: Content} = await run(code, {
      ...runtime,
      baseUrl: import.meta.url
    })
    
    return Content
  } catch (error) {
    return null
  }
}

export default async function BlogPost({
  params
}: {
  params: {slug: string[]}
}) {
  const Content = await getMDXContent(params.slug)
  
  if (!Content) {
    notFound()
  }
  
  return (
    <article className="prose max-w-none">
      <Content />
    </article>
  )
}
`
}

// Vite Plugin Integration
export const viteIntegration = {
  // Vite configuration
  viteConfig: `
// vite.config.ts
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default defineConfig({
  plugins: [
    react(),
    mdx({
      jsxImportSource: 'react',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
      providerImportSource: '@mdx-js/react'
    })
  ],
  optimizeDeps: {
    include: ['@mdx-js/react']
  }
})
`,

  // Vite plugin for dynamic MDX
  dynamicMDXPlugin: `
// plugins/mdx-loader.ts
import {Plugin} from 'vite'
import {compile} from '@mdx-js/mdx'

export function mdxLoader(): Plugin {
  return {
    name: 'mdx-loader',
    load(id) {
      if (id.endsWith('?mdx-dynamic')) {
        return \`
export async function loadMDX(source) {
  const {compile} = await import('@mdx-js/mdx')
  const code = await compile(source, {
    jsxImportSource: 'react',
    outputFormat: 'function-body'
  })
  return String(code)
}
        \`
      }
    }
  }
}
`
}

// Webpack Integration
export const webpackIntegration = {
  // Webpack configuration
  webpackConfig: `
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
              presets: ['@babel/preset-react', '@babel/preset-typescript']
            }
          },
          {
            loader: '@mdx-js/loader',
            options: {
              jsxImportSource: 'react',
              remarkPlugins: [
                ['remark-gfm', {singleTilde: false}]
              ],
              rehypePlugins: [
                ['rehype-highlight', {languages: ['javascript', 'typescript']}]
              ]
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
}

// Storybook Integration
export const storybookIntegration = {
  // Storybook configuration
  storybookConfig: `
// .storybook/main.ts
import type {StorybookConfig} from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  viteFinal: async (config) => {
    const mdx = await import('@mdx-js/rollup')
    
    config.plugins?.push(
      mdx.default({
        jsxImportSource: 'react'
      })
    )
    
    return config
  }
}

export default config
`,

  // MDX story example
  mdxStory: `
// src/components/Button/Button.stories.mdx
import {Meta, Story, Canvas, ArgsTable} from '@storybook/addon-docs'
import {Button} from './Button'

<Meta title="Components/Button" component={Button} />

# Button Component

The Button component is used for triggering actions.

## Default Button

<Canvas>
  <Story name="Default">
    <Button>Click me</Button>
  </Story>
</Canvas>

## Button Variants

<Canvas>
  <Story name="Variants">
    <div style={{display: 'flex', gap: '1rem'}}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
  </Story>
</Canvas>

## Props

<ArgsTable of={Button} />
`
}

// CMS Integration
export const cmsIntegration = {
  // Contentful integration
  contentfulIntegration: `
// lib/contentful.ts
import {compile, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import {createClient} from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!
})

export async function getContentfulPost(slug: string) {
  const entries = await client.getEntries({
    content_type: 'blogPost',
    'fields.slug': slug
  })
  
  if (entries.items.length === 0) {
    return null
  }
  
  const post = entries.items[0]
  const mdxContent = post.fields.content as string
  
  // Compile MDX content
  const code = String(await compile(mdxContent, {
    outputFormat: 'function-body',
    jsxImportSource: 'react'
  }))
  
  // Run compiled code
  const {default: Content} = await run(code, {
    ...runtime,
    baseUrl: import.meta.url
  })
  
  return {
    title: post.fields.title,
    slug: post.fields.slug,
    content: Content,
    metadata: post.fields
  }
}
`,

  // Strapi integration
  strapiIntegration: `
// lib/strapi.ts
import {compile, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'

export async function getStrapiPost(slug: string) {
  const response = await fetch(
    \`\${STRAPI_URL}/api/posts?filters[slug][\$eq]=\${slug}&populate=*\`
  )
  
  const data = await response.json()
  
  if (data.data.length === 0) {
    return null
  }
  
  const post = data.data[0]
  const mdxContent = post.attributes.content
  
  // Compile and run MDX
  const code = String(await compile(mdxContent, {
    outputFormat: 'function-body',
    jsxImportSource: 'react'
  }))
  
  const {default: Content} = await run(code, {
    ...runtime,
    baseUrl: import.meta.url
  })
  
  return {
    title: post.attributes.title,
    slug: post.attributes.slug,
    content: Content,
    publishedAt: post.attributes.publishedAt
  }
}
`
}

// TypeScript Integration
export const typescriptIntegration = {
  // TypeScript types for MDX
  mdxTypes: `
// types/mdx.d.ts
declare module '*.mdx' {
  import type {ComponentType} from 'react'
  const Component: ComponentType<{
    components?: import('mdx/types').MDXComponents
  }>
  export default Component
}

// Global MDX component types
declare global {
  type MDXProvidedComponents = import('mdx/types').MDXComponents
}

// Custom component types
export interface CustomMDXComponents {
  Alert: ComponentType<{type: 'info' | 'warning' | 'error'; children: ReactNode}>
  CodeBlock: ComponentType<{language: string; children: string}>
  Image: ComponentType<{src: string; alt: string; width?: number; height?: number}>
}
`,

  // Typed MDX wrapper
  typedWrapper: `
// components/TypedMDXWrapper.tsx
import type {MDXComponents} from 'mdx/types'
import type {ComponentProps, ReactNode} from 'react'

interface MDXWrapperProps {
  children: ReactNode
  components?: MDXComponents
}

const defaultComponents: MDXComponents = {
  h1: (props: ComponentProps<'h1'>) => (
    <h1 className="text-3xl font-bold mb-4" {...props} />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2 className="text-2xl font-semibold mb-3" {...props} />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p className="mb-4 leading-relaxed" {...props} />
  ),
  code: (props: ComponentProps<'code'>) => (
    <code className="bg-gray-100 px-2 py-1 rounded text-sm" {...props} />
  )
}

export const TypedMDXWrapper: React.FC<MDXWrapperProps> = ({
  children,
  components = {}
}) => {
  const mergedComponents = {...defaultComponents, ...components}
  
  return (
    <div className="prose max-w-none">
      <MDXProvider components={mergedComponents}>
        {children}
      </MDXProvider>
    </div>
  )
}
`
}

// Export all integration examples
export const mdxIntegrationExamples = {
  reactIntegration,
  vueIntegration,
  astroIntegration,
  nextjsIntegration,
  viteIntegration,
  webpackIntegration,
  storybookIntegration,
  cmsIntegration,
  typescriptIntegration
}