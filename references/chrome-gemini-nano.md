# Chrome Gemini Nano Reference

**Always remember to reference @$HOME/.claude/references/chrome-gemini-nano.md and look for snippets and examples in @$HOME/.claude/snippets/chrome-gemini-nano/**

## Quick Reference

- API: `window.ai.languageModel` (Chrome 138+)
- Availability: Desktop only (Windows 10/11, macOS 13+, Linux)
- Hardware: >4GB GPU VRAM, 22GB storage
- Documentation: [developer.chrome.com/docs/ai/built-in](https://developer.chrome.com/docs/ai/built-in)
- Early Preview: [Chrome Built-in AI Challenge](https://googlechromeai.devpost.com/)

## Resources and Documentation

### Official Documentation

- [Chrome Built-in AI Overview](https://developer.chrome.com/docs/ai/built-in)
  - [Getting Started Guide](https://developer.chrome.com/docs/ai/get-started)
  - [Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis)
  - [Early Preview Program](https://developer.chrome.com/blog/august2024-built-in-ai)

### Prompt API Documentation

- [Prompt API Overview](https://developer.chrome.com/docs/ai/prompt-api)
  - [JavaScript API Reference](https://developer.chrome.com/docs/ai/prompt-api)
  - [Configuration Options](https://developer.chrome.com/docs/ai/prompt-api#configuration)
  - [Streaming Responses](https://developer.chrome.com/docs/ai/prompt-api#streaming)

### Chrome Extensions Integration

- [Extensions AI Integration](https://developer.chrome.com/docs/extensions/ai/prompt-api)
  - [Manifest Configuration](https://developer.chrome.com/docs/extensions/ai/prompt-api#manifest)
  - [Background Script Usage](https://developer.chrome.com/docs/extensions/ai/prompt-api#background)
  - [Content Script Integration](https://developer.chrome.com/docs/extensions/ai/prompt-api#content-scripts)

### Web Standards and Specifications

- [Web Machine Learning Prompt API Proposal](https://github.com/webmachinelearning/prompt-api)
  - [API Specification](https://github.com/webmachinelearning/prompt-api/blob/main/explainer.md)
  - [Use Cases and Requirements](https://github.com/webmachinelearning/prompt-api/blob/main/use-cases.md)
  - [Privacy and Security Considerations](https://github.com/webmachinelearning/prompt-api/blob/main/security-privacy.md)

### Developer Resources

- [Chrome AI on Chrome for Developers](https://developer.chrome.com/docs/ai)
  - [AI in Chrome DevTools](https://developer.chrome.com/docs/devtools/console/ai-assistance)
  - [2024 Chrome AI Recap](https://developer.chrome.com/blog/chrome-2024-recap)
  - [Participate in Built-in AI Experiment](https://developer.chrome.com/blog/august2024-built-in-ai)

### Community and Examples

- [Google Chrome Built-in AI Challenge - Devpost](https://googlechromeai.devpost.com/)
  - [Sample Projects and Demos](https://googlechromeai.devpost.com/project-gallery)
  - [Community Discussions](https://googlechromeai.devpost.com/forum)
  - [Winner Showcases](https://googlechromeai.devpost.com/winners)

### Related AI APIs

- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
  - [Content Summarization](https://developer.chrome.com/docs/ai/summarizer-api#usage)
  - [Configuration Options](https://developer.chrome.com/docs/ai/summarizer-api#options)

- [Writer API](https://developer.chrome.com/docs/ai/writer-api)
  - [Content Generation](https://developer.chrome.com/docs/ai/writer-api#generation)
  - [Writing Assistance](https://developer.chrome.com/docs/ai/writer-api#assistance)

- [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
  - [Text Rewriting](https://developer.chrome.com/docs/ai/rewriter-api#rewriting)
  - [Style Adaptation](https://developer.chrome.com/docs/ai/rewriter-api#styles)

- [Translator API](https://developer.chrome.com/docs/ai/translator-api)
  - [Language Translation](https://developer.chrome.com/docs/ai/translator-api#translation)
  - [Language Detection](https://developer.chrome.com/docs/ai/translator-api#detection)

## Core API Methods

### Availability Detection

```typescript
// Check if AI is available
const capabilities = await window.ai.languageModel.capabilities();
// Returns: { available: 'readily' | 'after-download' | 'no' }

// Browser support detection
const hasAI = !!window.ai?.languageModel;
```

### Session Management

```typescript
// Create session with configuration
const session = await window.ai.languageModel.create({
  temperature: 0.7,           // Creativity (0-2)
  topK: 3,                   // Token diversity (1-40)
  systemPrompt: 'You are a helpful assistant.',
  signal: abortController.signal  // Cancellation support
});

// Always destroy sessions to free resources
session.destroy();
```

### Prompting Methods

```typescript
// Synchronous prompting
const response = await session.prompt('Your prompt here');

// Streaming responses
const stream = session.promptStreaming('Your prompt here');
for await (const chunk of stream) {
  console.log(chunk);
}

// Clone session with preserved context
const newSession = session.clone();
```

## Configuration Parameters

### Temperature Settings

- **0.0 - 0.3**: Precise, factual, deterministic responses
- **0.4 - 0.7**: Balanced creativity and accuracy
- **0.8 - 1.2**: Creative, varied responses
- **1.3 - 2.0**: Highly creative, experimental output

### TopK Settings

- **1-2**: Most conservative, predictable
- **3-5**: Good balance for most use cases
- **6-10**: More diverse, creative responses
- **11-40**: Maximum diversity, experimental

### System Prompts

- **Role Definition**: "You are a [role] assistant..."
- **Behavior Guidelines**: "Be concise and accurate..."
- **Context Setting**: "You are helping with [specific task]..."
- **Output Format**: "Respond in [specific format]..."

## Error Types and Handling

### Common Error Scenarios

```typescript
// AI not available
if (capabilities.available === 'no') {
  throw new Error('AI not supported on this device');
}

// Model download required
if (capabilities.available === 'after-download') {
  // Show download UI, wait for completion
}

// Session errors
try {
  const response = await session.prompt(text);
} catch (error) {
  if (error.message.includes('session')) {
    // Recreate session
    session = await window.ai.languageModel.create(config);
  }
}

// Quota/rate limiting
if (error.message.includes('quota')) {
  // Implement backoff and retry
}
```

### Browser Compatibility

```typescript
// Progressive enhancement
if (!window.ai?.languageModel) {
  // Fallback to server-side AI
  return await fetchServerAI(prompt);
}

// Feature detection with graceful degradation
async function getAIResponse(prompt) {
  try {
    return await chromeAI.prompt(prompt);
  } catch {
    return await fallbackService.prompt(prompt);
  }
}
```

## Performance Optimization

### Resource Management

- Always call `session.destroy()` when done
- Use session pooling for multiple requests
- Implement response caching for repeated prompts
- Monitor memory usage with large sessions

### Best Practices

- Check availability before creating sessions
- Use appropriate temperature/topK for use case
- Implement timeout handling for long responses
- Cache responses for identical prompts
- Use streaming for long-form content
- Handle network interruptions gracefully

## Security and Privacy

### Privacy Advantages

- All processing happens locally on device
- No data sent to external servers
- Offline functionality available
- User data remains private

### Security Considerations

- Validate and sanitize user inputs
- Implement content safety checks
- Handle prompt injection attempts
- Respect Google's Prohibited Uses Policy
- Monitor for unusual usage patterns

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/chrome-gemini-nano/`:

- `basic-usage.ts` - Basic setup and initialization
- `streaming-responses.ts` - Streaming API patterns
- `chrome-extension.ts` - Extension integration
- `error-handling.ts` - Error handling and resilience
- `configuration.ts` - Session and config management
- `performance-optimization.ts` - Performance patterns
- `testing.ts` - Testing utilities and mocks

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/chrome-gemini-nano/schemas/`

## Testing and Development

Testing patterns and mock implementations in `$HOME/.claude/snippets/chrome-gemini-nano/testing.ts`

## Hardware Requirements

### Minimum Requirements

- **Operating System**: Windows 10/11, macOS 13+, or Linux
- **Storage**: 22GB available disk space
- **Memory**: >4GB GPU VRAM
- **Network**: Unmetered connection for initial download
- **Browser**: Chrome 138+ (stable channel)

### Optimal Performance

- **GPU**: Dedicated graphics card with 8GB+ VRAM
- **CPU**: Modern multi-core processor
- **Storage**: SSD for faster model loading
- **RAM**: 16GB+ system memory

## Model Capabilities

### Gemini Nano Features

- **Text Generation**: Creative and factual content
- **Code Understanding**: Programming assistance
- **Language Tasks**: Translation, summarization
- **Reasoning**: Logical analysis and problem-solving
- **Context Awareness**: Multi-turn conversations

### Limitations

- **Desktop Only**: No mobile device support
- **English Primary**: Best performance in English
- **Context Length**: Limited conversation history
- **Specialized Tasks**: May need fine-tuning for domain-specific work
- **Real-time Data**: No access to current events or web data

## Integration Patterns

### Web Applications

```typescript
// Progressive enhancement
class AIEnhancedApp {
  async initialize() {
    if (await this.checkAISupport()) {
      await this.enableAIFeatures();
    } else {
      await this.setupFallbacks();
    }
  }
}
```

### Chrome Extensions

```typescript
// Background script integration
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'AI_REQUEST') {
    const response = await processWithAI(message.prompt);
    return { response };
  }
});
```

### Content Scripts

```typescript
// Page enhancement
document.addEventListener('selectionchange', async () => {
  const selection = window.getSelection().toString();
  if (selection.length > 50) {
    const summary = await generateSummary(selection);
    showSummaryTooltip(summary);
  }
});
```

## Future Roadmap

### Upcoming Features

- **Additional Models**: More specialized AI models
- **Mobile Support**: Potential mobile device compatibility
- **Enhanced APIs**: More task-specific endpoints
- **Performance Improvements**: Faster inference and loading
- **Standards Adoption**: Web standards compliance

### Experimental Features

- **Multimodal Input**: Image and audio processing
- **Tool Use**: Function calling capabilities
- **Memory Management**: Persistent conversation context
- **Custom Models**: User-provided model support
