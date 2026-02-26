# AsyncAPI Reference

**Always remember to reference @$HOME/.claude/references/asyncapi.md and look for snippets and examples in @$HOME/.claude/snippets/asyncapi/**

## Quick Reference

- Installation: `bun --bun add @asyncapi/cli @asyncapi/parser @asyncapi/generator`
- CLI Installation: `bun --bun add -g @asyncapi/cli`
- Import: `import { AsyncAPIDocument } from '@asyncapi/parser'`
- Documentation: <https://www.asyncapi.com/docs>
- GitHub: <https://github.com/asyncapi/asyncapi>
- Package: <https://www.npmjs.com/package/@asyncapi/parser>

## What is AsyncAPI?

AsyncAPI is an open source initiative that provides a specification for creating machine-readable definitions of asynchronous APIs. It's designed to improve the current state of Event-Driven Architectures (EDA) by making working with event-driven APIs as straightforward as working with REST APIs.

### Key Features

- **Event-Driven Architecture Support**: Define async API interfaces for microservices
- **Multi-Protocol Support**: MQTT, Kafka, WebSockets, AMQP, HTTP, and more
- **Code Generation**: Generate documentation, server/client code, and payload models
- **Validation & Linting**: Runtime validation and specification linting
- **Schema Composition**: Support for JSON Schema, Avro, and other schema formats
- **Tooling Ecosystem**: Comprehensive CLI, generators, parsers, and IDE extensions

## Resources and Documentation

- [AsyncAPI Website](https://www.asyncapi.com/)
  - [Getting Started](https://www.asyncapi.com/docs/getting-started)
  - [Specification](https://www.asyncapi.com/docs/specifications/latest)
    - [Core Specification](https://github.com/asyncapi/spec/blob/master/spec/asyncapi.md)
    - [Message Objects](https://www.asyncapi.com/docs/specifications/latest#message-object)
    - [Channel Objects](https://www.asyncapi.com/docs/specifications/latest#channel-object)
    - [Server Objects](https://www.asyncapi.com/docs/specifications/latest#server-object)
    - [Operation Objects](https://www.asyncapi.com/docs/specifications/latest#operation-object)
  - [Tools & Ecosystem](https://www.asyncapi.com/tools)
    - [CLI Documentation](https://www.asyncapi.com/docs/tools/cli)
    - [Generator](https://www.asyncapi.com/docs/tools/generator)
    - [Parser](https://www.asyncapi.com/docs/tools/parser)
    - [Modelina](https://www.asyncapi.com/docs/tools/modelina)
  - [Examples & Tutorials](https://www.asyncapi.com/docs/tutorials)
    - [Streetlights Tutorial](https://www.asyncapi.com/docs/tutorials/streetlights-interactive)
    - [Message Validation](https://www.asyncapi.com/docs/tutorials/message-validation)
- [GitHub Organization](https://github.com/asyncapi)
  - [Specification Repository](https://github.com/asyncapi/spec)
  - [CLI Tool](https://github.com/asyncapi/cli)
  - [Parser](https://github.com/asyncapi/parser-js)
  - [Generator](https://github.com/asyncapi/generator)
  - [Bindings](https://github.com/asyncapi/bindings)
- [Community Resources](https://www.asyncapi.com/community)
  - [Slack Community](https://asyncapi.com/slack-invite)
  - [YouTube Channel](https://www.youtube.com/asyncapi)
  - [Blog Posts](https://www.asyncapi.com/blog)
  - [Newsletter](https://www.asyncapi.com/newsletter)

## Core Concepts

### AsyncAPI Document Structure

- **asyncapi**: Specification version (3.0.0, 2.6.0, etc.)
- **id**: Unique identifier for the API
- **info**: API metadata (title, version, description)
- **servers**: Connection details for message brokers
- **channels**: Communication pathways for messages
- **operations**: Actions applications can perform (send/receive)
- **components**: Reusable definitions (schemas, messages, parameters)

### Message-Driven Architecture

- **Publishers**: Send messages to channels
- **Subscribers**: Receive messages from channels
- **Channels**: Named pathways for message exchange
- **Brokers**: Message routing infrastructure (Kafka, RabbitMQ, etc.)

### Schema Validation

- **JSON Schema**: Default schema format for message payloads
- **Avro**: Apache Avro schema support
- **Protobuf**: Protocol Buffers schema support
- **Custom Formats**: Extensible schema format support

## CLI Commands

### Installation

```bash
# Global CLI installation
bun --bun add -g @asyncapi/cli

# Local project installation
bun --bun add -D @asyncapi/cli
```

### Core Commands

```bash
# Validate AsyncAPI document
asyncapi validate asyncapi.yaml

# Generate code/documentation
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/nodejs-template

# Create new AsyncAPI document
asyncapi new file

# Convert between versions
asyncapi convert asyncapi.yaml --target-version=3.0.0

# Optimize document
asyncapi optimize asyncapi.yaml

# Start AsyncAPI Studio
asyncapi start studio
```

## JavaScript/TypeScript Integration

### Parser Library

```typescript
import { Parser } from '@asyncapi/parser';

const parser = new Parser();
const { document, diagnostics } = await parser.parse(asyncapiDocument);

if (document) {
  console.log(document.info().title());
  console.log(document.channels());
} else {
  console.error('Parser errors:', diagnostics);
}
```

### Generator Usage

```typescript
import { Generator } from '@asyncapi/generator';

const generator = new Generator('@asyncapi/nodejs-template', './output');
await generator.generateFromString(asyncapiDocument, {
  server: 'production'
});
```

### Message Validation

```typescript
import { validateMessage } from '@asyncapi/message-validator';

const isValid = validateMessage(
  messagePayload,
  asyncapiDocument,
  'channelName',
  'messageName'
);
```

## Popular Tools and Libraries

### Core Libraries

- **@asyncapi/parser**: Parse and validate AsyncAPI documents
- **@asyncapi/generator**: Generate code from AsyncAPI documents  
- **@asyncapi/cli**: Command-line interface for AsyncAPI
- **@asyncapi/modelina**: Generate payload models in various languages
- **@asyncapi/message-validator**: Runtime message validation

### Framework Integrations

- **nestjs-asyncapi**: NestJS decorators for AsyncAPI generation
- **zod-sockets**: Socket.IO with Zod validation
- **asyncapi-fastify-plugin**: Fastify integration
- **asyncapi-express-template**: Express.js template

### Development Tools

- **AsyncAPI Studio**: Visual AsyncAPI document editor
- **Spectral**: JSON/YAML linter with AsyncAPI rules
- **asyncapi-github-action**: GitHub Actions integration
- **vscode-asyncapi**: Visual Studio Code extension

## Protocol Bindings

AsyncAPI supports protocol-specific bindings for:

### Supported Protocols

- **HTTP**: REST-like async operations
- **WebSockets**: Real-time bidirectional communication
- **Kafka**: Distributed event streaming
- **MQTT**: IoT and lightweight messaging
- **AMQP**: Advanced Message Queuing Protocol
- **Redis**: Pub/Sub messaging
- **Google Pub/Sub**: Cloud messaging
- **Apache Pulsar**: Multi-tenant messaging

### Binding Configuration

```yaml
servers:
  production:
    host: kafka.example.com:9092
    protocol: kafka
    bindings:
      kafka:
        schemaRegistryUrl: https://schema-registry.example.com
```

## Code Examples Location

Comprehensive examples available in `@$HOME/.claude/snippets/asyncapi/`:

- Basic AsyncAPI document structure
- Message and channel definitions
- Multi-protocol server configurations
- Schema validation patterns
- Code generation examples
- Framework integrations
- Testing patterns
- CLI usage examples
- Advanced binding configurations
- Real-world application examples

## Schema and Type Definitions

Type definitions and validation schemas in `@$HOME/.claude/snippets/asyncapi/schemas/`

## Linting and Formatting

Latest configuration files in `@$HOME/.claude/snippets/asyncapi/linting/`

## Migration Guides

### From OpenAPI to AsyncAPI

```yaml
# Key differences:
# - operations → channels + operations
# - paths → channels
# - request/response → message patterns
# - HTTP focus → multi-protocol support
```

### Version Migration

```bash
# Upgrade AsyncAPI document version
asyncapi convert asyncapi.yaml --target-version=3.0.0

# Check compatibility
asyncapi validate asyncapi.yaml --diagnostics
```

## Best Practices

### Document Structure

- Use semantic versioning for API versions
- Organize reusable components in `/components`
- Include comprehensive examples for messages
- Document all required and optional fields
- Use meaningful channel and operation names

### Schema Design

- Prefer JSON Schema for payload validation
- Use schema composition (allOf, oneOf, anyOf) for flexibility
- Include format constraints and validation rules
- Document schema evolution and backwards compatibility
- Use branded types for domain-specific identifiers

### Code Generation  

- Configure generators with appropriate templates
- Use environment-specific server configurations
- Generate both client and server code when possible
- Include comprehensive error handling
- Add integration tests for generated code

### Message Patterns

- Design idempotent message processing
- Include correlation IDs for request-reply patterns
- Use message versioning for schema evolution
- Implement dead letter queues for error handling
- Add message tracing and observability

## Common Use Cases

### Event-Driven Microservices

- Service-to-service communication
- Event sourcing and CQRS patterns
- Saga pattern orchestration
- Domain event publishing

### Real-Time Applications

- WebSocket API documentation
- Live data streaming
- Push notification systems
- Gaming and chat applications

### IoT and Sensor Networks

- MQTT device communication
- Sensor data collection
- Device command and control
- Telemetry aggregation

### Integration Patterns

- Message broker integration
- API gateway configurations
- Legacy system modernization
- Cloud-native architectures
