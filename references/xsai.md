# xsAI Reference

**Always remember to reference ./references/xsai.md and look for snippets and examples in ./snippets/xsai/**

## Quick Reference

- Installation: `bun add xsai`
- Import: `import { generateText } from 'xsai'`
- Documentation: <https://xsai.js.org/>
- GitHub: <https://github.com/moeru-ai/xsai>
- Package: <https://www.npmjs.com/package/xsai>

## Overview

xsAI is an extra-small AI SDK designed for minimal footprint and maximum compatibility across JavaScript runtimes. It provides a lightweight alternative to the Vercel AI SDK with 100x smaller installation size and 12x smaller bundle size.

### Key Features

- **Ultra-lightweight**: Only 132KB installed (vs 10.6MB for Vercel AI SDK)
- **Runtime-agnostic**: Works across Browser, Node.js, Deno, Bun, and Edge Runtime
- **ESM-only**: Modern module system support
- **Fetch API based**: Uses standard web APIs
- **OpenAI-compatible**: Works with OpenAI and compatible APIs
- **Minimal dependencies**: Reduces supply chain risks

## Resources and Documentation

- [xsAI Documentation](https://xsai.js.org/docs)
  - [Getting Started](https://xsai.js.org/docs/getting-started)
  - [API Reference](https://xsai.js.org/docs/api)
  - [Packages](https://xsai.js.org/docs/packages)
    - [Core Packages](https://xsai.js.org/docs/packages-top)
    - [Generation Packages](https://xsai.js.org/docs/packages/generate)
    - [Streaming Packages](https://xsai.js.org/docs/packages/stream)
    - [Utility Packages](https://xsai.js.org/docs/packages/utils)
  - [Extensions](https://xsai.js.org/docs/packages-ext)
  - [Integrations](https://xsai.js.org/docs/integrations)
- [Community Resources](https://github.com/moeru-ai/xsai)
  - [GitHub Issues](https://github.com/moeru-ai/xsai/issues)
  - [Blog](https://blog.moeru.ai)
  - [Releases](https://github.com/moeru-ai/xsai/releases)

## Core Packages

### Text Generation (`@xsai/generate-text`)

Generate text completions from AI models:

```typescript
import { generateText } from '@xsai/generate-text'

const { text } = await generateText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [
    { content: 'You are a helpful assistant.', role: 'system' },
    { content: 'Why is the sky blue?', role: 'user' }
  ],
  model: 'gpt-4o',
})
```

### Object Generation (`@xsai/generate-object`)

Generate structured data with schema validation:

```typescript
import { generateObject } from '@xsai/generate-object'
import * as v from 'valibot'

const { object } = await generateObject({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [
    { content: 'Extract the event information.', role: 'system' },
    { content: 'Alice and Bob are going to a science fair on Friday.', role: 'user' }
  ],
  model: 'gpt-4o',
  schema: v.object({
    name: v.string(),
    date: v.string(),
    participants: v.array(v.string()),
  })
})
```

### Text Streaming (`@xsai/stream-text`)

Stream text responses for real-time display:

```typescript
import { streamText } from '@xsai/stream-text'

const { textStream } = await streamText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [
    { content: 'You are a helpful assistant.', role: 'system' },
    { content: 'Tell me a story.', role: 'user' }
  ],
  model: 'gpt-4o',
})

for await (const textPart of textStream) {
  console.log(textPart)
}
```

### Object Streaming (`@xsai/stream-object`)

Stream structured data with partial updates:

```typescript
import { streamObject } from '@xsai/stream-object'
import * as v from 'valibot'

const { partialObjectStream } = await streamObject({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [{ content: 'Generate a user profile.', role: 'user' }],
  model: 'gpt-4o',
  schema: v.object({
    name: v.string(),
    age: v.number(),
    bio: v.string(),
  })
})

for await (const partialObject of partialObjectStream) {
  console.log(partialObject)
}
```

### Tool Calling (`@xsai/tool`)

Define and use tools for function calling:

```typescript
import { tool } from '@xsai/tool'
import { generateText } from '@xsai/generate-text'
import * as v from 'valibot'

const weather = await tool({
  description: 'Get the weather in a location',
  execute: ({ location }) => JSON.stringify({
    location,
    temperature: 42,
  }),
  name: 'weather',
  parameters: v.object({
    location: v.pipe(
      v.string(),
      v.description('The location to get the weather for'),
    ),
  }),
})

const { text } = await generateText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  maxSteps: 2,
  messages: [
    { content: 'What is the weather in San Francisco?', role: 'user' }
  ],
  model: 'gpt-4o',
  tools: [weather],
})
```

### Embeddings (`@xsai/embed`)

Generate vector embeddings for text:

```typescript
import { embed, embedMany } from '@xsai/embed'

// Single embedding
const { embedding } = await embed({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  input: 'sunny day at the beach',
  model: 'text-embedding-3-large',
})

// Multiple embeddings
const { embeddings } = await embedMany({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  input: [
    'sunny day at the beach',
    'rainy afternoon in the city',
    'snowy night in the mountains',
  ],
  model: 'text-embedding-3-large'
})
```

### Model Management (`@xsai/model`)

List and retrieve model information:

```typescript
import { listModels, retrieveModel } from '@xsai/model'

// List available models
const models = await listModels({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/'
})

// Get specific model details
const model = await retrieveModel({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  model: 'gpt-4o'
})
```

## Additional Packages

### Transcription (`@xsai/generate-transcription`)

Generate transcriptions from audio files:

```typescript
import { generateTranscription } from '@xsai/generate-transcription'
import { openAsBlob } from 'node:fs'

const { text } = await generateTranscription({
  apiKey: '',
  baseURL: 'http://localhost:8000/v1/',
  file: await openAsBlob('./audio.wav', { type: 'audio/wav' }),
  fileName: 'audio.wav',
  language: 'en',
  model: 'deepdml/faster-whisper-large-v3-turbo-ct2',
})
```

### Speech Generation (`@xsai/generate-speech`)

Convert text to speech:

```typescript
import { SpeechGenerator } from "@xsai/generate-speech"

const generator = new SpeechGenerator({
  apiKey: "YOUR_API_KEY",
  model: "tts-1"
})

const audioBuffer = await generator.generate({
  text: "Hello, this is a test of speech generation.",
  voice: "alloy"
})
```

### Image Generation (`@xsai/generate-image`)

Generate images from text prompts:

```typescript
import { generateImage } from '@xsai/generate-image'

const result = await generateImage({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  prompt: "A serene landscape with mountains",
  model: "dall-e-3"
})
```

## Utility Packages

### Chat Utilities (`@xsai/utils-chat`)

Helper functions for message creation:

```typescript
import { message } from '@xsai/utils-chat'

const messages = [
  message.system('You are a helpful assistant.'),
  message.user('Why is the sky blue?'),
]
```

### Stream Utilities (`@xsai/utils-stream`)

Tools for working with streams:

```typescript
import { simulateReadableStream } from '@xsai/utils-stream'

const stream = simulateReadableStream<number>({
  chunks: [1, 2, 3],
  chunkDelay: 100,
  initialDelay: 0,
})
```

### Reasoning Utilities (`@xsai/utils-reasoning`)

Extract reasoning from model outputs:

```typescript
import { extractReasoning, extractReasoningStream } from '@xsai/utils-reasoning'

// From text
const { reasoning, text } = extractReasoning(rawText)

// From stream
const { reasoningStream, textStream } = extractReasoningStream(rawTextStream)
```

## Extension Packages

### Schema Validation (`xsschema`)

Universal schema validation and conversion:

```typescript
import { validate, toJsonSchema } from 'xsschema'
import * as v from 'valibot'
import * as z from 'zod'

// Validate with different schema libraries
const valibotSchema = v.string()
const zodSchema = z.string()

const valibotResult = await validate(valibotSchema, '123')
const zodResult = await validate(zodSchema, '123')

// Convert to JSON Schema
const valibotJsonSchema = await toJsonSchema(valibotSchema)
const zodJsonSchema = await toJsonSchema(zodSchema)
```

### Fetch Enhancement (`xsfetch`)

Enhanced fetch with retry capabilities:

```typescript
import { createFetch } from 'xsfetch'

const fetch = createFetch({
  retry: 3,
  retryDelay: 1000,
})

// Use with generateText
const { text } = await generateText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  fetch, // Use enhanced fetch
  messages: [...],
  model: 'gpt-4o',
})
```

### Provider Support

#### Cloud Providers (`@xsai-ext/providers-cloud`)

```typescript
import { createOpenAI } from '@xsai-ext/providers-cloud'
import { generateText } from '@xsai/generate-text'

const openai = createOpenAI(env.OPENAI_API_KEY!)

const { text } = await generateText({
  ...openai.chat('gpt-4o'),
  messages: [{ content: 'Why is the sky blue?', role: 'user' }],
})
```

#### Local Providers (`@xsai-ext/providers-local`)

```typescript
import { createOllama } from '@xsai-ext/providers-local'
import { generateText } from '@xsai/generate-text'

const ollama = createOllama()

const { text } = await generateText({
  ...ollama.chat('llama3.2'),
  messages: [{ content: 'Why is the sky blue?', role: 'user' }],
})
```

### Vercel AI SDK Compatibility (`@xsai-ext/compat`)

Drop-in replacement for Vercel AI SDK:

```typescript
// Install as alias
// npm i ai@npm:@xsai-ext/compat

import { generateText } from '@xsai-ext/compat'
import { createOpenAI } from '@xsai-ext/providers-cloud'

const openai = createOpenAI(env.OPENAI_API_KEY!)

const { text } = await generateText({
  model: openai.chat('gpt-4o'),
  prompt: 'What is love?'
})
```

## Integration Examples

### Model Context Protocol (MCP)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({ 
  command: 'node', 
  args: ['server.js'] 
})
const client = new Client({ 
  name: 'example-client', 
  version: '1.0.0' 
})

await client.connect(transport)

// Convert MCP tools to xsAI format
const getTools = (mcpServers) =>
  Promise.all(
    Object.entries(mcpServers)
      .map(([serverName, client]) =>
        client.listTools().then(({ tools }) =>
          tools.map(({ description, inputSchema, name }) => ({
            execute: (args) =>
              client.callTool({
                arguments: args,
                name,
              }).then((res) => JSON.stringify(res)),
            function: {
              description,
              name: `${serverName}_${name}`,
              parameters: inputSchema,
              strict: true,
            },
            type: "function",
          }))
        )
      ),
  ).then((tools) => tools.flat())
```

### Composio Integration

```typescript
import { ComposioToolSet } from 'composio-core'

class XSAIToolSet extends ComposioToolSet {
  async getTools(filters) {
    const actionsList = await this.getToolsSchema(filters)
    return actionsList.map(schema => ({
      execute: async params => this.executeToolCall({
        arguments: JSON.stringify(params),
        name: schema.name,
      }),
      function: {
        description: schema.description,
        name: schema.name,
        parameters: schema.parameters,
        strict: true,
      },
      type: 'function',
    }))
  }
}

const toolset = new XSAIToolSet()
const tools = await toolset.getTools({ apps: ['github'] })
```

### Mastra.ai Integration

```typescript
import { Agent } from '@mastra/core/agent'
import { createOpenAI } from '@xsai-ext/providers-cloud'

const openai = createOpenAI(env.OPENAI_API_KEY!)

const weatherAgent = new Agent({
  instructions: 'You are a helpful weather assistant.',
  model: openai.chat('gpt-4o-mini'),
  name: 'Weather Agent',
  tools: { weatherTool },
})

const mastra = new Mastra({ agents: { weatherAgent } })
const agent = await mastra.getAgent('weatherAgent')
const result = await agent.generate('What is the weather in London?')
```

## Performance Comparison

### Package Sizes

- **xsai**: 132KB installed, 7KB gzipped
- **Vercel AI SDK**: 10.6MB installed, 62KB gzipped
- **@xsai/generate-text**: 21KB installed, 1.6KB gzipped

### Runtime Support

- ✅ Browser (all modern browsers)
- ✅ Node.js (18+)
- ✅ Deno
- ✅ Bun
- ✅ Edge Runtime (Cloudflare Workers, Vercel Edge)
- ✅ React Native

## Migration Guide

### From Vercel AI SDK

```typescript
// Before (Vercel AI SDK)
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Why is the sky blue?'
})

// After (xsAI)
import { generateText } from '@xsai/generate-text'

const { text } = await generateText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [
    { content: 'Why is the sky blue?', role: 'user' }
  ],
  model: 'gpt-4o',
})
```

### Package Overrides for Compatibility

```json
// package.json for npm/bun
{
  "overrides": {
    "ai": "npm:@xsai-ext/compat@latest"
  }
}

// package.json for yarn
{
  "resolutions": {
    "ai": "npm:@xsai-ext/compat@latest"
  }
}

// package.json for pnpm
{
  "pnpm": {
    "overrides": {
      "ai": "npm:@xsai-ext/compat@latest"
    }
  }
}
```

## Best Practices

### Error Handling

```typescript
try {
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [...],
    model: 'gpt-4o',
  })
} catch (error) {
  console.error('Generation failed:', error)
  // Handle specific error types
}
```

### Streaming for Better UX

```typescript
const { textStream } = await streamText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [...],
  model: 'gpt-4o',
})

// Display chunks as they arrive
for await (const chunk of textStream) {
  process.stdout.write(chunk)
}
```

### Schema Validation

```typescript
import { generateObject } from '@xsai/generate-object'
import * as v from 'valibot'

// Define strict schemas for structured output
const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  age: v.pipe(v.number(), v.min(0), v.max(150)),
  email: v.pipe(v.string(), v.email()),
})

const { object } = await generateObject({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  messages: [...],
  model: 'gpt-4o',
  schema,
})
```

## Code Examples Location

Comprehensive examples available in `./snippets/xsai/`:

- Basic usage patterns
- Advanced streaming examples
- Tool calling implementations
- Schema validation patterns
- Provider configurations
- Integration examples
- Error handling strategies
- Performance optimization techniques

## Schema and Type Definitions

Type definitions and validation schemas in `./snippets/xsai/schemas/`

## Linting and Formatting

Latest configuration files in `./snippets/xsai/linting/`

## See Also

- Complete reference: `./references/xsai.md`
- Code examples: `./snippets/xsai/`
- Schemas: `./snippets/xsai/schemas/`
- Linting configs: `./snippets/xsai/linting/`

## Version Information

- Current Version: 0.3.5
- License: MIT
- Status: Early stage development (may introduce breaking changes)

**📝 Remember**: Reference documentation is available at `./references/xsai.md` and code examples at `./snippets/xsai/`. Use these resources for comprehensive guidance and copy-paste ready examples.
