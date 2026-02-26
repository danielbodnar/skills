// ElysiaJS Plugin Examples

import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { staticPlugin } from '@elysiajs/static'
import { trpc } from '@elysiajs/trpc'
import { opentelemetry } from '@elysiajs/opentelemetry'

// 1. Basic Plugin Creation
const customPlugin = new Elysia()
    .decorate('version', '1.0.0')
    .get('/version', ({ version }) => version)

// 2. Configurable Plugin
const authPlugin = (secret: string) => new Elysia()
    .use(jwt({ secret }))
    .derive(({ jwt, headers }) => ({
        user: jwt.verify(headers.authorization?.replace('Bearer ', ''))
    }))

// 3. Plugin with State
const counterPlugin = new Elysia()
    .state('counter', 0)
    .get('/count', ({ store }) => store.counter)
    .post('/increment', ({ store }) => {
        store.counter++
        return { count: store.counter }
    })

// 4. CORS Plugin
const corsExample = new Elysia()
    .use(cors({
        origin: ['http://localhost:3000', 'https://example.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }))
    .get('/api/data', () => ({ message: 'CORS enabled' }))

// 5. Swagger Documentation Plugin
const swaggerExample = new Elysia()
    .use(swagger({
        documentation: {
            info: {
                title: 'My API',
                version: '1.0.0',
                description: 'API documentation'
            },
            tags: [
                { name: 'Users', description: 'User management' },
                { name: 'Auth', description: 'Authentication' }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    }))
    .get('/users', () => [{ id: 1, name: 'John' }], {
        detail: {
            summary: 'Get all users',
            tags: ['Users']
        }
    })

// 6. JWT Authentication Plugin
const jwtExample = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'your-secret-key',
        exp: '7d'
    }))
    .post('/login', async ({ jwt, body, set }) => {
        // Validate user credentials (mock)
        if (body.username === 'admin' && body.password === 'password') {
            const token = await jwt.sign({ 
                username: body.username,
                role: 'admin'
            })
            return { token }
        }
        
        set.status = 401
        return { error: 'Invalid credentials' }
    })
    .get('/protected', ({ jwt, bearer, set }) => {
        if (!bearer) {
            set.status = 401
            return { error: 'Missing token' }
        }

        const payload = jwt.verify(bearer)
        if (!payload) {
            set.status = 401
            return { error: 'Invalid token' }
        }

        return { message: 'Protected resource', user: payload }
    })

// 7. Bearer Token Plugin
const bearerExample = new Elysia()
    .use(bearer())
    .get('/profile', ({ bearer, set }) => {
        if (!bearer) {
            set.status = 401
            return { error: 'Bearer token required' }
        }

        // Validate token logic here
        return { profile: 'User profile data' }
    })

// 8. Static Files Plugin
const staticExample = new Elysia()
    .use(staticPlugin({
        assets: 'public',
        prefix: '/static'
    }))
    .get('/', () => 'Server with static files')

// 9. OpenTelemetry Plugin
const telemetryExample = new Elysia()
    .use(opentelemetry({
        serviceName: 'my-elysia-app',
        serviceVersion: '1.0.0'
    }))
    .get('/traced', () => ({ message: 'This request is traced' }))

// 10. Multiple Plugins Combined
const fullApp = new Elysia()
    .use(cors())
    .use(swagger({
        documentation: {
            info: {
                title: 'Full Featured API',
                version: '1.0.0'
            }
        }
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'secret'
    }))
    .use(bearer())
    .use(staticPlugin({ assets: 'public' }))
    .use(customPlugin)
    .use(counterPlugin)
    .get('/', () => 'Full featured Elysia server')
    .listen(3000)

// 11. Custom Validation Plugin
const validationPlugin = new Elysia()
    .derive(({ body }) => ({
        validateEmail: (email: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(email)
        }
    }))

// 12. Logging Plugin
const loggingPlugin = new Elysia()
    .onBeforeHandle(({ request }) => {
        console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
    })
    .onAfterHandle(({ response, set }) => {
        console.log(`[${new Date().toISOString()}] Response: ${set.status}`)
    })

// 13. Rate Limiting Plugin (Basic Implementation)
const rateLimitPlugin = new Elysia()
    .state('requests', new Map<string, number[]>())
    .onBeforeHandle(({ request, store, set }) => {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        const now = Date.now()
        const windowMs = 60000 // 1 minute
        const maxRequests = 100

        if (!store.requests.has(ip)) {
            store.requests.set(ip, [])
        }

        const requests = store.requests.get(ip)!
        const validRequests = requests.filter(time => now - time < windowMs)
        
        if (validRequests.length >= maxRequests) {
            set.status = 429
            return { error: 'Rate limit exceeded' }
        }

        validRequests.push(now)
        store.requests.set(ip, validRequests)
    })

export {
    customPlugin,
    authPlugin,
    counterPlugin,
    corsExample,
    swaggerExample,
    jwtExample,
    bearerExample,
    staticExample,
    telemetryExample,
    fullApp,
    validationPlugin,
    loggingPlugin,
    rateLimitPlugin
}