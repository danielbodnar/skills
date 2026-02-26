# Firefox WebExtensions AI API Reference

**Always remember to reference @$HOME/.claude/references/firefox-webextensions-ai.md and look for snippets and examples in @$HOME/.claude/snippets/firefox-webextensions-ai/**

## Quick Reference

- Namespace: `browser.trial.ml`
- Permission: `"trialML"` (optional permission)
- Engine Creation: `browser.trial.ml.createEngine()`
- Inference: `browser.trial.ml.runEngine()`
- Progress: `browser.trial.ml.onProgress`
- Cache Management: `browser.trial.ml.deleteCachedModels()`

## Resources and Documentation

- [Firefox WebExtensions AI API](https://firefox-source-docs.mozilla.org/toolkit/components/ml/extensions.html)
  - [API Reference](https://firefox-source-docs.mozilla.org/toolkit/components/ml/extensions.html#api-reference)
  - [Configuration Options](https://firefox-source-docs.mozilla.org/toolkit/components/ml/extensions.html#configuration)
  - [Supported Tasks](https://firefox-source-docs.mozilla.org/toolkit/components/ml/extensions.html#tasks)
  - [Error Handling](https://firefox-source-docs.mozilla.org/toolkit/components/ml/extensions.html#errors)
- [Mozilla AI Toolkit](https://firefox-source-docs.mozilla.org/toolkit/components/ml/)
  - [Architecture](https://firefox-source-docs.mozilla.org/toolkit/components/ml/#architecture)
  - [Model Management](https://firefox-source-docs.mozilla.org/toolkit/components/ml/#models)
  - [Performance](https://firefox-source-docs.mozilla.org/toolkit/components/ml/#performance)
  - [Debugging](https://firefox-source-docs.mozilla.org/toolkit/components/ml/#debugging)
- [Firefox On-Device Models](https://support.mozilla.org/en-US/kb/on-device-models)
  - [Privacy Features](https://support.mozilla.org/en-US/kb/on-device-models#privacy)
  - [Model Management](https://support.mozilla.org/en-US/kb/on-device-models#management)
  - [Troubleshooting](https://support.mozilla.org/en-US/kb/on-device-models#troubleshooting)
- [Mozilla AI GitHub](https://github.com/mozilla-ai)
  - [Agents Framework](https://github.com/mozilla-ai/any-agent)
  - [AI Blueprints](https://github.com/mozilla-ai?tab=repositories&q=blueprint)
  - [Lumigator Platform](https://github.com/mozilla-ai/lumigator)
- [HuggingFace Models](https://huggingface.co/models)
  - [Mozilla Organization](https://huggingface.co/Mozilla)
  - [Smart Tab Topic Model](https://huggingface.co/Mozilla/smart-tab-topic)
  - [Transformers.js Compatible Models](https://huggingface.co/models?library=transformers.js)

## Core API Methods

### Engine Management

- `browser.trial.ml.createEngine(config)` - Initialize AI inference engine
- `browser.trial.ml.runEngine(request)` - Execute inference on created engine
- `browser.trial.ml.deleteCachedModels()` - Remove downloaded model files

### Event Handling

- `browser.trial.ml.onProgress.addListener(callback)` - Monitor progress events
- `browser.trial.ml.onProgress.removeListener(callback)` - Remove progress listener

## Supported Model Hubs

### HuggingFace Hub

- Hub ID: `"huggingface"`
- 1000+ compatible models
- Supports all major AI tasks
- Automatic model downloading
- Community-driven model ecosystem

### Mozilla Hub

- Hub ID: `"mozilla"`
- Curated Mozilla-specific models
- Optimized for Firefox integration
- Privacy-focused model selection
- Tab grouping and browser-specific tasks

## Supported AI Tasks

### Text Processing

- **summarization** - Text summarization with BART, T5 models
- **text-classification** - Sentiment analysis, topic classification
- **text-generation** - Text completion and generation
- **translation** - Language translation with Helsinki-NLP models
- **question-answering** - Reading comprehension and Q&A

### Specialized Tasks

- **image-classification** - Image recognition and labeling
- **feature-extraction** - Embedding generation
- **token-classification** - Named entity recognition
- **zero-shot-classification** - Classification without training data

## Configuration Parameters

### Required Parameters

- `taskName` - AI task to perform (required)
- `modelHub` - Model source ("huggingface" or "mozilla")

### Optional Parameters

- `modelId` - Specific model identifier
- `modelRevision` - Model version/revision
- `tokenizerId` - Custom tokenizer
- `device` - Execution device ("wasm" or "gpu")
- `quantization` - Model precision ("int8" or "fp16")

## Device and Performance Options

### Execution Devices

- **WASM** - WebAssembly runtime (default, universal compatibility)
- **GPU** - GPU acceleration (when available, better performance)

### Quantization Levels

- **int8** - 8-bit quantization (smaller, faster, lower accuracy)
- **fp16** - 16-bit precision (larger, slower, higher accuracy)

## Privacy and Security Features

### On-Device Processing

- All inference happens locally on user's device
- No data transmitted to external servers
- Complete privacy preservation
- Offline functionality after model download

### Memory Management

- Automatic model eviction under memory pressure
- Configurable cache limits
- Manual cache clearing capabilities
- Intelligent resource allocation

## Error Types and Handling

### Common Error Categories

- **Permission Errors** - trialML permission not granted
- **Network Errors** - Model download failures
- **Memory Errors** - Insufficient device memory
- **Model Errors** - Invalid model configuration
- **Input Errors** - Malformed inference requests

### Error Recovery Strategies

- Fallback to alternative models
- Device switching (GPU to WASM)
- Input preprocessing and validation
- Retry logic with exponential backoff
- Graceful degradation patterns

## Performance Optimization

### Engine Pooling

- Reuse engines across multiple requests
- Limit concurrent engine instances
- Least-recently-used eviction policy
- Resource usage monitoring

### Input Optimization

- Text length limits per task type
- Smart truncation at sentence boundaries
- Batch processing capabilities
- Caching for repeated inputs

### Memory Optimization

- Model quantization for reduced memory usage
- Automatic garbage collection
- Memory usage monitoring
- Proactive cache management

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/firefox-webextensions-ai/`:

- **basic-usage.js** - Core API usage patterns
- **progress-monitoring.js** - Progress tracking and UI updates
- **model-management.js** - Advanced model configuration
- **error-handling.js** - Robust error recovery patterns
- **real-world-examples.js** - Complete extension implementations
- **performance-optimization.js** - Performance tuning strategies
- **manifest.json** - WebExtension manifest configuration

## Browser Compatibility

### Firefox Support

- **Nightly** - Enabled by default
- **Beta/Release** - Requires preference flags
- **Minimum Version** - Firefox 128+
- **Feature Detection** - Check `browser.trial.ml` availability

### Configuration Flags

- `browser.ml.enable` - Enable ML runtime
- `browser.trial.ml.enabled` - Enable trial API
- Access via `about:config` or `about:preferences`

## Development and Debugging

### Debugging Tools

- `about:inference` - ML runtime diagnostics (Nightly only)
- `about:logging` - Machine Learning logging preset
- Browser Developer Tools console
- Extension debugging workflow

### Logging Configuration

- Enable "Machine Learning" logging preset
- Monitor model download progress
- Track inference performance
- Debug permission and API issues

### Testing Strategies

- Unit tests for AI operations
- Mock AI responses for CI/CD
- Performance benchmarking
- Cross-browser compatibility testing

## Best Practices

### Performance

- Use engine pooling for repeated tasks
- Implement input length limits
- Cache results when appropriate
- Monitor memory usage patterns

### User Experience

- Show progress indicators for model downloads
- Provide fallback content during processing
- Handle errors gracefully with user feedback
- Implement timeout mechanisms

### Privacy

- Clearly communicate on-device processing
- Provide model management controls
- Respect user privacy preferences
- Document data handling practices

### Security

- Validate all user inputs
- Implement proper error boundaries
- Use content security policies
- Follow extension security guidelines

## Migration and Adoption

### Extension Integration

- Add trialML permission to manifest
- Implement feature detection
- Provide fallbacks for unsupported browsers
- Progressive enhancement approach

### User Onboarding

- Explain privacy benefits
- Guide through permission granting
- Provide model management education
- Set appropriate user expectations

### Deployment Considerations

- Test across Firefox versions
- Monitor performance metrics
- Plan for model updates
- Handle API evolution gracefully
