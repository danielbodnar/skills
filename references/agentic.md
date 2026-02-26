# Agentic Reference

**Always remember to reference @$HOME/.claude/references/agentic.md and look for snippets and examples in @$HOME/.claude/snippets/agentic/**

## Quick Reference

- Installation: `bun --bun add @agentic/ai-sdk @agentic/langchain @agentic/platform-tool-client`
- Import: `import { createAISDKTools } from '@agentic/ai-sdk'` or `import { createLangChainTools } from '@agentic/langchain'`
- Documentation: <https://docs.agentic.so>
- NPM: <https://www.npmjs.com/package/@agentic/ai-sdk>
- GitHub: <https://github.com/agentic-labs>

## Overview

Agentic is "the App Store for LLM Tools" - a marketplace platform that enables developers to:

- Publish and monetize AI-powered tools and services
- Integrate tools seamlessly with popular AI frameworks
- Access a curated collection of AI tools through a unified interface
- Use Model Context Protocol (MCP) for standardized tool interactions

## Installation Options

### For Vercel AI SDK Integration

```bash
bun --bun add ai @agentic/ai-sdk @agentic/platform-tool-client zod
```

### For LangChain Integration

```bash
bun --bun add langchain @langchain/core @langchain/agents @agentic/langchain @agentic/platform-tool-client
```

### Additional Dependencies (for examples)

```bash
bun --bun add @langchain/openai @ai-sdk/openai dotenv
```

## Resources and Documentation

- [Agentic Documentation](https://docs.agentic.so)
  - [Getting Started](https://docs.agentic.so/getting-started)
  - [MCP Marketplace](https://docs.agentic.so/marketplace)
  - [Publishing MCP Tools](https://docs.agentic.so/publishing)
  - [TypeScript SDKs](https://docs.agentic.so/marketplace/ts-sdks)
    - [Vercel AI SDK](https://docs.agentic.so/marketplace/ts-sdks/ai-sdk)
    - [LangChain](https://docs.agentic.so/marketplace/ts-sdks/langchain)
    - [LlamaIndex](https://docs.agentic.so/marketplace/ts-sdks/llamaindex)
    - [OpenAI](https://docs.agentic.so/marketplace/ts-sdks/openai)
    - [Firebase Genkit](https://docs.agentic.so/marketplace/ts-sdks/genkit)
    - [Mastra](https://docs.agentic.so/marketplace/ts-sdks/mastra)
  - [MCP Clients](https://docs.agentic.so/clients)
- [NPM Packages](https://www.npmjs.com/org/agentic)
  - [@agentic/ai-sdk](https://www.npmjs.com/package/@agentic/ai-sdk)
  - [@agentic/langchain](https://www.npmjs.com/package/@agentic/langchain)
  - [@agentic/platform-tool-client](https://www.npmjs.com/package/@agentic/platform-tool-client)
  - [@agentic/core](https://www.npmjs.com/package/@agentic/core)

## Supported Integrations

### TypeScript AI SDKs

1. **Vercel AI SDK** - v4 (v5 beta coming soon)
2. **OpenAI Chat Completions** - Direct OpenAI integration
3. **OpenAI Responses** - Structured response handling
4. **LangChain** - Full LangChain TypeScript support
5. **LlamaIndex** - Document indexing and retrieval
6. **Firebase Genkit** - Google's AI framework
7. **Mastra** - AI workflow automation

### MCP Clients

1. Claude Code
2. Claude Desktop
3. Cline
4. Cursor
5. Raycast
6. Trae
7. VS Code
8. Warp
9. Windsurf

## Core APIs

### Vercel AI SDK Integration (@agentic/ai-sdk)

```typescript
import { createAISDKTools } from '@agentic/ai-sdk'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
```

Key Functions:

- `createAISDKTools(tool)` - Converts Agentic tools to AI SDK format
- `AgenticToolClient.fromIdentifier(id)` - Loads a tool by identifier
- Integration with `generateText()` from Vercel AI SDK

### LangChain Integration (@agentic/langchain)

```typescript
import { createLangChainTools } from '@agentic/langchain'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
```

Key Functions:

- `createLangChainTools(tool)` - Converts Agentic tools to LangChain format
- Works with `AgentExecutor` and `createToolCallingAgent`
- Full compatibility with LangChain's agent system

### Platform Tool Client (@agentic/platform-tool-client)

Core client for accessing Agentic tools:

- `AgenticToolClient.fromIdentifier(identifier)` - Load tools by ID
- Handles authentication and API communication
- Provides unified interface across different tools

## Configuration

### Environment Variables

```bash
# Required for OpenAI integration examples
OPENAI_API_KEY=your-openai-api-key

# Optional for advanced Agentic features
AGENTIC_API_KEY=your-agentic-api-key
```

### TypeScript Configuration

Both SDKs include built-in TypeScript declarations and full type safety:

- Bundled types in `./dist/index.ts`
- Full TypeScript support out of the box
- Compatible with strict mode

## Available Tools

Common tool identifiers:

- `@agentic/search` - Web search capabilities
- `@agentic/calculator` - Mathematical computations
- `@agentic/weather` - Weather information
- Additional tools available in the marketplace

## Best Practices

### General Guidelines

1. **Use TypeScript** - All SDKs have full TypeScript support
2. **Handle Async Operations** - All tool calls are asynchronous
3. **Error Handling** - Wrap tool calls in try-catch blocks
4. **Temperature Settings** - Use low temperature (0) for deterministic responses
5. **Tool Selection** - Choose appropriate tools for your use case

### Performance Optimization

- Cache tool instances when possible
- Reuse client connections
- Batch tool calls when appropriate
- Use streaming for long-running operations

### Security

- Store API keys in environment variables
- Never commit API keys to version control
- Use appropriate authentication for production
- Validate tool responses before processing

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/agentic/`:

- Basic usage patterns
- Vercel AI SDK integration examples
- LangChain integration examples
- Error handling patterns
- Authentication setup
- Tool chaining examples
- Streaming responses
- Multi-tool orchestration
- Production deployment patterns

## Common Use Cases

### 1. AI-Powered Search Assistant

Integrate web search capabilities into AI applications

### 2. Tool-Augmented Chatbots

Build chatbots that can perform actions beyond text generation

### 3. Automated Research Agents

Create agents that can gather and synthesize information

### 4. Workflow Automation

Chain multiple tools together for complex workflows

### 5. API Gateway for AI Tools

Unified access to various AI services and tools

## Migration Guide

### From Raw OpenAI to Agentic + AI SDK

```typescript
// Before: Raw OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "What's the weather?" }]
})

// After: Agentic + AI SDK
const searchTool = await AgenticToolClient.fromIdentifier('@agentic/weather')
const result = await generateText({
  model: openai('gpt-4o-mini'),
  tools: createAISDKTools(searchTool),
  toolChoice: 'required',
  prompt: 'What is the weather in San Francisco?'
})
```

### From Basic LangChain to Agentic + LangChain

```typescript
// Before: Basic LangChain
const chain = new LLMChain({ llm, prompt })
const result = await chain.call({ input })

// After: Agentic + LangChain
const tool = await AgenticToolClient.fromIdentifier('@agentic/search')
const tools = createLangChainTools(tool)
const agent = createToolCallingAgent({ llm, tools })
const executor = new AgentExecutor({ agent, tools })
const result = await executor.invoke({ input })
```

## Troubleshooting

### Common Issues

1. **Tool not found**: Ensure tool identifier is correct
2. **Authentication errors**: Check API key configuration
3. **Type errors**: Update to latest SDK versions
4. **Async issues**: Properly await all async operations
5. **Network errors**: Check internet connection and firewall settings

### Debugging Tips

- Enable verbose logging for detailed error messages
- Check SDK version compatibility
- Verify environment variables are loaded
- Test tools individually before chaining
- Use TypeScript for better error detection

## Version Compatibility

- @agentic/ai-sdk: 8.4.4+ (supports Vercel AI SDK v4)
- @agentic/langchain: 8.4.4+ (supports latest LangChain)
- @agentic/platform-tool-client: Latest version recommended
- Node.js: 18+ recommended
- Bun: Latest version recommended

## See Also

- Complete examples: `$HOME/.claude/snippets/agentic/`
- TypeScript types: `$HOME/.claude/snippets/agentic/types/`
- Configuration templates: `$HOME/.claude/snippets/agentic/config/`
