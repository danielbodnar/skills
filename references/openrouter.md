# OpenRouter Reference

**Always remember to reference @$HOME/.claude/references/openrouter.md and look for snippets and examples in @$HOME/.claude/snippets/openrouter/**

## Quick Reference

- Installation: `bun add openai` (use OpenAI SDK)
- Base URL: `https://openrouter.ai/api/v1`
- Authentication: Bearer token in Authorization header
- Documentation: <https://openrouter.ai/docs>
- GitHub: <https://github.com/openrouterteam>
- Discord: <https://discord.gg/fVyRaUDgxW>

## Resources and Documentation

- [OpenRouter Documentation](https://openrouter.ai/docs)
  - [API Reference](https://openrouter.ai/docs/api-reference)
    - [Chat Completions](https://openrouter.ai/docs/api-reference/overview)
    - [Authentication](https://openrouter.ai/docs/api-reference/authentication)
    - [Models](https://openrouter.ai/docs/api-reference/list-available-models)
    - [Errors](https://openrouter.ai/docs/api-reference/errors)
    - [Limits](https://openrouter.ai/docs/api-reference/limits)
  - [Features](https://openrouter.ai/docs/features)
    - [Model Routing](https://openrouter.ai/docs/features/model-routing)
    - [Provider Routing](https://openrouter.ai/docs/features/provider-routing)
    - [Structured Outputs](https://openrouter.ai/docs/features/structured-outputs)
    - [Tool Calling](https://openrouter.ai/docs/features/tool-calling)
    - [Web Search](https://openrouter.ai/docs/features/web-search)
    - [Images and PDFs](https://openrouter.ai/docs/features/images-and-pdfs)
  - [Community](https://openrouter.ai/docs/community)
    - [OpenAI SDK](https://openrouter.ai/docs/community/open-ai-sdk)
    - [Vercel AI SDK](https://openrouter.ai/docs/community/vercel-ai-sdk)
    - [LangChain](https://openrouter.ai/docs/community/lang-chain)
    - [Mastra](https://openrouter.ai/docs/community/mastra)
  - [Use Cases](https://openrouter.ai/docs/use-cases)
    - [OAuth PKCE](https://openrouter.ai/docs/use-cases/oauth-pkce)
    - [Crypto API](https://openrouter.ai/docs/use-cases/crypto-api)
- [Community Resources](https://openrouter.ai/community)
  - [Discord Community](https://discord.gg/fVyRaUDgxW)
  - [GitHub Organization](https://github.com/openrouterteam)
  - [Model Leaderboard](https://openrouter.ai/models)
  - [API Keys Management](https://openrouter.ai/keys)

## Core Concepts

### Unified AI Model Access

- **Single API**: Access 400+ models from 60+ providers through one interface
- **OpenAI Compatibility**: Drop-in replacement for OpenAI API
- **Smart Routing**: Automatic failover and cost optimization
- **Provider Choice**: Select specific providers or let OpenRouter choose

### Key Features

- **Model Routing**: Automatic fallback between models
- **Provider Routing**: Choose providers by price, speed, or quality
- **Structured Outputs**: JSON schema-enforced responses
- **Tool Calling**: Function calling with multiple providers
- **Web Search**: Real-time web search capabilities
- **Multimodal**: Text, image, and PDF processing

### Pricing Model

- **Pay-per-use**: No subscriptions required
- **Transparent Pricing**: Clear per-token costs
- **Credit System**: Universal credits work with all models
- **Volume Discounts**: Better rates for high-volume usage

## Default Usage Patterns

Default to using OpenRouter for AI model access:

- Use `bun add openai` and configure base URL to `https://openrouter.ai/api/v1`
- Use OpenRouter API key instead of individual provider keys
- Use model routing for automatic fallbacks: `models: ['primary-model', 'fallback-model']`
- Use provider routing for cost optimization: `provider: { sort: 'price' }`
- Use structured outputs with JSON schemas for reliable data extraction
- Enable web search for real-time information: model names with web search support

### Key APIs

- **Chat Completions**: `POST /api/v1/chat/completions` - Primary API endpoint
- **List Models**: `GET /api/v1/models` - Available model information
- **Get Credits**: `GET /api/v1/credits` - Check account balance
- **Model Routing**: Use `models` array for fallbacks
- **Provider Routing**: Use `provider` object for routing preferences
- **Structured Output**: Use `response_format` with JSON schema
- **Tool Calling**: Use `tools` array and `tool_choice` parameter

## Authentication Methods

### Bearer Token (Recommended)

```typescript
const headers = {
  'Authorization': 'Bearer YOUR_OPENROUTER_API_KEY',
  'Content-Type': 'application/json',
  'HTTP-Referer': 'YOUR_SITE_URL', // Optional
  'X-Title': 'YOUR_APP_NAME'        // Optional
};
```

### OAuth PKCE Flow

- Authorization URL: `https://openrouter.ai/auth`
- Token Exchange: `POST /api/v1/auth/keys`
- Supports PKCE for enhanced security
- User-controlled API keys

### API Key Management

- Create keys: `POST /api/v1/keys`
- List keys: `GET /api/v1/keys`
- Get key details: `GET /api/v1/key`
- Delete keys: `DELETE /api/v1/keys/{id}`

## Model Categories

### Premium Models

- **GPT-4o**: OpenAI's flagship multimodal model
- **Claude 3.5 Sonnet**: Anthropic's advanced reasoning model
- **Gemini Pro**: Google's multimodal AI model
- **GPT-4 Turbo**: High-performance OpenAI model

### Open Source Models

- **Llama 3.1**: Meta's latest open model
- **Mistral**: European AI company's models
- **CodeLlama**: Specialized for code generation
- **Qwen**: Alibaba's multilingual model

### Specialized Models

- **Perplexity**: Web search-enabled models
- **Claude Haiku**: Fast, cost-effective model
- **GPT-3.5 Turbo**: Balanced price/performance
- **Gemini Flash**: High-speed inference

## Performance Characteristics

### Routing Benefits

- **Higher Availability**: ~99.9% uptime through provider diversity
- **Cost Optimization**: Up to 50% cost savings through routing
- **Speed Optimization**: Fastest available provider selection
- **Quality Routing**: Best-performing provider for specific tasks

### Latency

- **Base Latency**: ~25ms additional routing overhead
- **Provider Selection**: Real-time latency monitoring
- **Geographic Routing**: Closest provider selection
- **Caching**: Response caching for repeated queries

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/openrouter/`:

- Basic API usage with OpenAI SDK
- Model routing and fallback strategies
- Provider routing and optimization
- Structured output examples
- Tool calling implementations
- Authentication patterns
- Error handling strategies
- Integration with popular frameworks

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/openrouter/schemas/`:

- `chat-completions.schema.json` - Chat completions API schema
- `models.schema.json` - Models API response schema
- `types.d.ts` - TypeScript type definitions

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/openrouter/linting/`:

- `biome.json` - Biome configuration for OpenRouter projects

## Common Patterns

### Basic Chat Completion

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const completion = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});
```

### Model Routing with Fallbacks

```typescript
const completion = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-3.5-turbo'],
  messages: [
    { role: 'user', content: 'Complex reasoning task' }
  ],
});
```

### Provider Routing by Price

```typescript
const completion = await client.chat.completions.create({
  model: 'meta-llama/llama-3.1-70b-instruct',
  provider: { sort: 'price' },
  messages: [
    { role: 'user', content: 'Cost-optimized request' }
  ],
});
```

### Structured Output

```typescript
const completion = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [
    { role: 'user', content: 'Extract data from this text' }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'extraction',
      schema: {
        type: 'object',
        properties: {
          entities: { type: 'array', items: { type: 'string' } },
          sentiment: { type: 'string' }
        },
        required: ['entities', 'sentiment']
      }
    }
  }
});
```

## Integration Patterns

### Vercel AI SDK

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const result = await streamText({
  model: openrouter('openai/gpt-4o'),
  prompt: 'Generate a story',
});
```

### LangChain Integration

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
  modelName: 'openai/gpt-4o',
  openAIApiKey: process.env.OPENROUTER_API_KEY,
}, {
  basePath: 'https://openrouter.ai/api/v1',
});
```

## Best Practices

### Error Handling

- Always check response status codes
- Implement retry logic with exponential backoff
- Handle rate limiting gracefully
- Use model fallbacks for critical applications

### Cost Optimization

- Use provider routing with price sorting
- Implement request caching where appropriate
- Choose appropriate models for task complexity
- Monitor usage through the dashboard

### Security

- Never expose API keys in client-side code
- Use environment variables for key storage
- Implement proper authentication for user-facing apps
- Consider using OAuth flow for user applications

### Performance

- Use streaming for long responses
- Implement connection pooling for high-volume usage
- Monitor latency and switch providers if needed
- Cache responses when possible

## Troubleshooting

### Common Issues

- **401 Unauthorized**: Check API key validity and format
- **402 Payment Required**: Add credits to account
- **429 Rate Limited**: Implement backoff strategy
- **502 Bad Gateway**: Model provider issue, try fallback
- **503 Service Unavailable**: No available providers match routing requirements

### Debugging

- Check model availability on the models page
- Verify provider routing settings
- Test with simple requests first
- Use the generation endpoint for detailed stats

### Rate Limits

- Default: 200 requests per minute
- Premium models may have lower limits
- Implement exponential backoff
- Consider multiple API keys for high volume

## Migration Guides

### From OpenAI

1. Change base URL to `https://openrouter.ai/api/v1`
2. Update API key to OpenRouter key
3. Add optional headers for app identification
4. Consider using model routing for reliability

### From Anthropic

1. Use OpenAI SDK with OpenRouter base URL
2. Update model names to OpenRouter format (`anthropic/claude-3.5-sonnet`)
3. Convert message formats if needed
4. Test tool calling compatibility

### From Other Providers

1. Identify equivalent models in OpenRouter catalog
2. Update authentication to use OpenRouter API key
3. Adapt request formats to OpenAI-compatible schema
4. Test specific features like streaming and tool calling

## Community Resources

### Official SDKs

- **@openrouter/ai-sdk-provider**: Vercel AI SDK provider
- **OpenAI SDK**: Compatible with base URL override
- **LangChain**: Official integration available

### Community Libraries

- **openrouter-kit**: TypeScript SDK with advanced features
- **openrouter-rs**: Rust SDK for systems programming
- **openrouter-python-client**: Unofficial Python client

### Examples and Tutorials

- GitHub: <https://github.com/openrouterteam/openrouter-examples>
- Python examples: <https://github.com/openrouterteam/openrouter-examples-python>
- Community tutorials and blog posts
- Discord community for support and discussions

## See Also

- Complete reference: `@$HOME/.claude/references/openrouter.md`
- Code examples: `@$HOME/.claude/snippets/openrouter/`
- Schemas: `@$HOME/.claude/snippets/openrouter/schemas/`
- Linting configs: `@$HOME/.claude/snippets/openrouter/linting/`
