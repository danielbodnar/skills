# ElysiaJS Reference

**Always remember to reference /home/bodnar/.claude/references/elysiajs.md and look for snippets and examples in /home/bodnar/.claude/snippets/elysiajs/**

## Quick Reference

- Installation: `bun create elysia app` or `bun add elysia`
- Import: `import { Elysia } from 'elysia'`
- Documentation: <https://elysiajs.com/>
- GitHub: <https://github.com/elysiajs/elysia>
- Package: <https://www.npmjs.com/package/elysia>

## Default Usage Patterns

ElysiaJS is an ergonomic TypeScript web framework designed for humans with end-to-end type safety:

- **Performance**: 21x faster than Express, 6x faster than Fastify
- **Type Safety**: Dynamic type inference with compile-time and runtime validation
- **Developer Experience**: Minimal boilerplate with intuitive API design
- **Bun Optimized**: Built specifically for Bun runtime performance
- **Eden Client**: End-to-end type safety without code generation
- **Plugin Ecosystem**: Modular architecture with official and community plugins

## Resources and Documentation

- [ElysiaJS Documentation](https://elysiajs.com/)
  - [Quick Start Guide](https://elysiajs.com/quick-start.html)
  - [At a Glance](https://elysiajs.com/at-glance.html)
  - [Tutorial](https://elysiajs.com/tutorial.html)
  - [Essential Concepts](https://elysiajs.com/essential/)
    - [Handler](https://elysiajs.com/essential/handler.html)
    - [Route](https://elysiajs.com/essential/route.html)
    - [Schema](https://elysiajs.com/essential/schema.html)
    - [Plugin](https://elysiajs.com/essential/plugin.html)
    - [Best Practices](https://elysiajs.com/essential/best-practice.html)
  - [Patterns](https://elysiajs.com/patterns/)
    - [Configuration](https://elysiajs.com/patterns/configuration.html)
    - [Mount](https://elysiajs.com/patterns/mount.html)
    - [Unit Test](https://elysiajs.com/patterns/unit-test.html)
    - [Deploy](https://elysiajs.com/patterns/deploy.html)
  - [Integrations](https://elysiajs.com/integrations/)
    - [OpenAPI](https://elysiajs.com/integrations/openapi.html)
    - [Astro](https://elysiajs.com/integrations/astro.html)
    - [OpenTelemetry](https://elysiajs.com/integrations/opentelemetry.html)
    - [Cheat Sheet](https://elysiajs.com/integrations/cheat-sheet.html)
- [Eden Documentation](https://elysiajs.com/eden/)
  - [Overview](https://elysiajs.com/eden/overview.html)
  - [Installation](https://elysiajs.com/eden/installation.html)
  - [Eden Treaty](https://elysiajs.com/eden/treaty/)
    - [Overview](https://elysiajs.com/eden/treaty/overview.html)
    - [Unit Test](https://elysiajs.com/eden/treaty/unit-test.html)
    - [Config](https://elysiajs.com/eden/treaty/config.html)
    - [Legacy](https://elysiajs.com/eden/treaty/legacy.html)
  - [Eden Fetch](https://elysiajs.com/eden/fetch.html)
  - [Test](https://elysiajs.com/eden/test.html)
- [Plugins](https://elysiajs.com/plugins/)
  - [Overview](https://elysiajs.com/plugins/overview.html)
  - [CORS](https://elysiajs.com/plugins/cors.html)
  - [Swagger](https://elysiajs.com/plugins/swagger.html)
  - [JWT](https://elysiajs.com/plugins/jwt.html)
  - [Static](https://elysiajs.com/plugins/static.html)
  - [Bearer](https://elysiajs.com/plugins/bearer.html)
  - [tRPC](https://elysiajs.com/plugins/trpc.html)
  - [OpenTelemetry](https://elysiajs.com/plugins/opentelemetry.html)
- [Community Resources](https://elysiajs.com/community/)
  - [Discord Community](https://discord.gg/eaFJ2KDJck)
  - [GitHub Discussions](https://github.com/elysiajs/elysia/discussions)
  - [Blog Posts](https://elysiajs.com/blog/)

## Core Concepts

### Basic Server Setup

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', 'Hello Elysia')
    .get('/user/:id', ({ params: { id } }) => id)
    .post('/form', ({ body }) => body)
    .listen(3000)
```

### Type-Safe Schema Validation

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .post('/user', ({ body }) => body, {
        body: t.Object({
            name: t.String(),
            age: t.Number()
        })
    })
```

### Plugin System

```typescript
const plugin = new Elysia()
    .decorate('version', '1.0.0')
    .get('/version', ({ version }) => version)

const app = new Elysia()
    .use(plugin)
    .listen(3000)
```

### Eden Client Integration

```typescript
// Server
export const app = new Elysia()
    .get('/api/users/:id', ({ params: { id } }) => ({ id, name: 'User' }))
    .listen(3000)

export type App = typeof app

// Client
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const client = treaty<App>('localhost:3000')
const { data } = await client.api.users({ id: '123' }).get()
```

## Performance Features

### Bun Runtime Optimization

- Native Bun.serve integration
- Optimized static file serving
- Fast JSON parsing and serialization
- Minimal memory footprint

### Ahead-of-Time Compilation

```typescript
const app = new Elysia({
    aot: true,
    precompile: true
})
```

### Native Static Response

```typescript
const app = new Elysia({
    nativeStaticResponse: true
})
```

## Plugin Ecosystem

### Official Plugins

- **@elysiajs/cors**: Cross-Origin Resource Sharing
- **@elysiajs/swagger**: OpenAPI documentation
- **@elysiajs/jwt**: JSON Web Token authentication
- **@elysiajs/bearer**: Bearer token authentication
- **@elysiajs/static**: Static file serving
- **@elysiajs/trpc**: tRPC integration
- **@elysiajs/opentelemetry**: Observability and tracing
- **@elysiajs/apollo**: GraphQL Apollo server
- **@elysiajs/graphql-yoga**: GraphQL Yoga integration

### Eden Ecosystem

- **@elysiajs/eden**: End-to-end type safety client
- Eden Treaty: Object-like server representation
- Eden Fetch: Fetch-like API client

## Testing Patterns

### Unit Testing with Bun

```typescript
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Elysia', () => {
    it('returns a response', async () => {
        const app = new Elysia().get('/', () => 'hi')
        const response = await app.handle(new Request('http://localhost/'))
        expect(await response.text()).toBe('hi')
    })
})
```

### Integration Testing with Eden

```typescript
import { treaty } from '@elysiajs/eden'
import { describe, expect, it } from 'bun:test'

const app = new Elysia().get('/hello', 'Hello World')
const api = treaty(app)

describe('GET /hello', () => {
    it('should return Hello World', async () => {
        const { data, status } = await api.hello.get()
        expect(status).toBe(200)
        expect(data).toBe('Hello World')
    })
})
```

## Configuration Patterns

### Server Configuration

```typescript
const app = new Elysia({
    serve: {
        hostname: '0.0.0.0',
        port: 3000,
        tls: {
            cert: Bun.file('cert.pem'),
            key: Bun.file('key.pem')
        }
    }
})
```

### Environment-Specific Settings

```typescript
const app = new Elysia({
    prefix: process.env.API_PREFIX || '/api',
    serve: {
        port: parseInt(process.env.PORT || '3000')
    }
})
```

## Deployment Patterns

### Production Build

```bash
bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts
```

### Docker Deployment

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun build --compile --outfile server ./src/index.ts

EXPOSE 3000
CMD ["./server"]
```

## Best Practices

### Code Organization

- Use feature-based folder structure
- Separate controllers, services, and models
- Leverage method chaining for type integrity
- Create reusable plugins for common functionality

### Performance Optimization

- Enable AOT compilation for production
- Use native static response for static content
- Implement proper caching strategies
- Leverage Bun's built-in optimizations

### Type Safety

- Always export server types for Eden
- Use schema validation for all inputs
- Leverage TypeScript strict mode
- Implement proper error handling

### Security

- Use CORS plugin for cross-origin requests
- Implement JWT authentication where needed
- Validate all user inputs with schemas
- Use HTTPS in production

## Code Examples Location

Comprehensive examples available in `/home/bodnar/.claude/snippets/elysiajs/`:

- Basic usage patterns
- Advanced routing configurations
- Plugin development examples
- Eden client integration
- Testing strategies
- Performance optimization techniques
- Production deployment setups
- Security implementations

## Schema and Type Definitions

Type definitions and validation schemas in `/home/bodnar/.claude/snippets/elysiajs/schemas/`

## Linting and Formatting

Latest configuration files in `/home/bodnar/.claude/snippets/elysiajs/linting/`

## Migration Guides

### From Express

```typescript
// Express
app.get('/user/:id', (req, res) => {
    res.json({ id: req.params.id })
})

// Elysia
app.get('/user/:id', ({ params: { id } }) => ({ id }))
```

### From Fastify

```typescript
// Fastify
fastify.get('/user/:id', async (request, reply) => {
    return { id: request.params.id }
})

// Elysia
app.get('/user/:id', ({ params: { id } }) => ({ id }))
```

## Advanced Patterns

### Custom Plugin Development

```typescript
const customPlugin = (config: { prefix: string }) => 
    new Elysia({
        name: 'custom-plugin',
        seed: config
    })
    .get(`${config.prefix}/health`, () => 'OK')
```

### WebSocket Integration

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .ws('/ws', {
        message(ws, message) {
            ws.send('Hello ' + message)
        }
    })
```

### File Upload Handling

```typescript
app.post('/upload', ({ body }) => {
    const file = body.file as File
    return { filename: file.name, size: file.size }
}, {
    body: t.Object({
        file: t.File()
    })
})
```

## Observability

### OpenTelemetry Integration

```typescript
import { opentelemetry } from '@elysiajs/opentelemetry'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

const app = new Elysia()
    .use(opentelemetry({
        spanProcessors: [
            new BatchSpanProcessor(/* exporter */)
        ]
    }))
```

### Logging and Monitoring

```typescript
app.use(({ request, set }) => {
    console.log(`${request.method} ${request.url}`)
    set.headers['x-request-id'] = crypto.randomUUID()
})
```
