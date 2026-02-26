// MDX Basic Usage Examples
// Installation: bun add @mdx-js/mdx @mdx-js/esbuild @types/mdx

import {compile, evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

// Basic MDX compilation
export const basicCompilation = async () => {
  const mdxSource = `
# Hello World

This is a **markdown** document with some JSX:

<div style={{color: 'blue'}}>
  This is a blue div!
</div>

export const name = 'John'

Hello {name}!
`

  const code = await compile(mdxSource, {
    jsxImportSource: 'react',
    format: 'esm'
  })

  console.log(String(code))
}

// Basic MDX evaluation (runtime compilation)
export const basicEvaluation = async () => {
  const mdxSource = `
# Dynamic Content

Current time: {new Date().toISOString()}

<button onClick={() => alert('Hello!')}>
  Click me!
</button>
`

  const {default: Content} = await evaluate(mdxSource, {
    ...runtime,
    baseUrl: import.meta.url
  })

  return Content
}

// Simple component embedding
export const componentEmbedding = `
import {Chart} from './components/chart.js'
export const year = 2024

# Annual Report {year}

Here's our performance data:

<Chart 
  data={[1, 2, 3, 4, 5]} 
  title="Monthly Sales"
  color="#3b82f6" 
/>

That's a **{Math.round(Math.random() * 100)}%** improvement!
`

// MDX with frontmatter
export const withFrontmatter = `
---
title: My Blog Post
author: John Doe
date: 2024-01-01
tags: [mdx, react, blog]
---

# {frontmatter.title}

By {frontmatter.author} on {frontmatter.date}

This post covers {frontmatter.tags.join(', ')}.

<div className="meta">
  Published: {new Date(frontmatter.date).toLocaleDateString()}
</div>
`

// Interactive MDX example
export const interactiveExample = `
import {useState} from 'react'

export const Counter = () => {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

# Interactive Counter

Click the button below:

<Counter />

Pretty cool, right? The count updates in real-time!
`

// MDX with custom components
export const customComponents = `
import {Alert, CodeBlock, Image} from './components'

# Documentation Page

<Alert type="info">
  This is an informational alert!
</Alert>

Here's some code:

<CodeBlock language="javascript">
{\`
const hello = () => {
  console.log('Hello, world!')
}
\`}
</CodeBlock>

And here's an optimized image:

<Image 
  src="/hero.jpg" 
  alt="Hero image" 
  width={800} 
  height={400}
  lazy={true}
/>

<Alert type="warning">
  Remember to optimize your images!
</Alert>
`

// Export all examples
export const mdxExamples = {
  basicCompilation,
  basicEvaluation,
  componentEmbedding,
  withFrontmatter,
  interactiveExample,
  customComponents
}