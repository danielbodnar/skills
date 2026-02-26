// ElysiaJS Testing Examples

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

// Test Server Setup
const createTestServer = () => new Elysia()
    .get('/', 'Hello Test')
    .get('/user/:id', ({ params: { id } }) => ({ id, name: `User ${id}` }))
    .post('/user', ({ body }) => ({ ...body, id: crypto.randomUUID() }), {
        body: t.Object({
            name: t.String(),
            email: t.String()
        })
    })
    .put('/user/:id', ({ body, params: { id }, set }) => {
        if (body.username === 'taken') {
            set.status = 400
            return { error: 'Username already taken' }
        }
        return { id, ...body }
    }, {
        body: t.Object({
            username: t.String(),
            email: t.Optional(t.String())
        })
    })
    .get('/error', () => {
        throw new Error('Test error')
    })
    .onError(({ error, set }) => {
        set.status = 500
        return { message: error.message }
    })

// 1. Unit Testing with Direct Handle Method
describe('Elysia Unit Tests', () => {
    it('should return hello message', async () => {
        const app = new Elysia().get('/', () => 'Hello World')
        
        const response = await app.handle(new Request('http://localhost/'))
        const text = await response.text()
        
        expect(response.status).toBe(200)
        expect(text).toBe('Hello World')
    })

    it('should handle path parameters', async () => {
        const app = new Elysia()
            .get('/user/:id', ({ params: { id } }) => ({ userId: id }))
        
        const response = await app.handle(new Request('http://localhost/user/123'))
        const json = await response.json()
        
        expect(json.userId).toBe('123')
    })

    it('should validate request body', async () => {
        const app = new Elysia()
            .post('/user', ({ body }) => body, {
                body: t.Object({
                    name: t.String(),
                    age: t.Number()
                })
            })
        
        const validRequest = new Request('http://localhost/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'John', age: 30 })
        })
        
        const response = await app.handle(validRequest)
        const json = await response.json()
        
        expect(response.status).toBe(200)
        expect(json.name).toBe('John')
        expect(json.age).toBe(30)
    })

    it('should handle validation errors', async () => {
        const app = new Elysia()
            .post('/user', ({ body }) => body, {
                body: t.Object({
                    name: t.String(),
                    age: t.Number()
                })
            })
        
        const invalidRequest = new Request('http://localhost/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'John' }) // Missing age
        })
        
        const response = await app.handle(invalidRequest)
        expect(response.status).toBe(400)
    })
})

// 2. Integration Testing with Eden Treaty
describe('Eden Treaty Integration Tests', () => {
    let app: Elysia
    let client: ReturnType<typeof treaty<typeof app>>

    beforeEach(() => {
        app = createTestServer()
        client = treaty(app)
    })

    it('should fetch home page', async () => {
        const { data, status } = await client.get()
        
        expect(status).toBe(200)
        expect(data).toBe('Hello Test')
    })

    it('should get user by id', async () => {
        const { data, error, status } = await client.user({ id: '123' }).get()
        
        expect(status).toBe(200)
        expect(error).toBeNull()
        expect(data).toEqual({ id: '123', name: 'User 123' })
    })

    it('should create a new user', async () => {
        const { data, error, status } = await client.user.post({
            name: 'Jane Doe',
            email: 'jane@example.com'
        })
        
        expect(status).toBe(200)
        expect(error).toBeNull()
        expect(data.name).toBe('Jane Doe')
        expect(data.email).toBe('jane@example.com')
        expect(data.id).toBeDefined()
    })

    it('should handle error responses', async () => {
        const { data, error, status } = await client.user({ id: '123' }).put({
            username: 'taken',
            email: 'test@example.com'
        })
        
        expect(status).toBe(400)
        expect(error).toBeDefined()
        expect(error?.value).toEqual({ error: 'Username already taken' })
    })
})

// 3. Mock Testing
describe('Elysia Mock Tests', () => {
    it('should test with mocked dependencies', async () => {
        const mockUserService = {
            getUser: (id: string) => ({ id, name: `Mock User ${id}`, email: 'mock@test.com' })
        }

        const app = new Elysia()
            .decorate('userService', mockUserService)
            .get('/user/:id', ({ params: { id }, userService }) => userService.getUser(id))

        const response = await app.handle(new Request('http://localhost/user/456'))
        const json = await response.json()

        expect(json).toEqual({
            id: '456',
            name: 'Mock User 456',
            email: 'mock@test.com'
        })
    })
})

// 4. Error Handling Tests
describe('Error Handling Tests', () => {
    it('should handle thrown errors', async () => {
        const app = createTestServer()
        const client = treaty(app)

        const { data, error, status } = await client.error.get()

        expect(status).toBe(500)
        expect(error).toBeDefined()
        expect(error?.value.message).toBe('Test error')
    })

    it('should test custom error responses', async () => {
        const app = new Elysia()
            .get('/not-found', ({ set }) => {
                set.status = 404
                return { message: 'Resource not found' }
            })

        const response = await app.handle(new Request('http://localhost/not-found'))
        const json = await response.json()

        expect(response.status).toBe(404)
        expect(json.message).toBe('Resource not found')
    })
})

// 5. Middleware Testing
describe('Middleware Tests', () => {
    it('should test request middleware', async () => {
        const app = new Elysia()
            .onBeforeHandle(({ set }) => {
                set.headers['x-custom-header'] = 'test-value'
            })
            .get('/', () => 'Hello')

        const response = await app.handle(new Request('http://localhost/'))

        expect(response.headers.get('x-custom-header')).toBe('test-value')
    })

    it('should test authentication middleware', async () => {
        const app = new Elysia()
            .onBeforeHandle(({ headers, set }) => {
                if (!headers.authorization) {
                    set.status = 401
                    return { error: 'Unauthorized' }
                }
            })
            .get('/protected', () => 'Protected resource')

        // Test without auth
        const unauthResponse = await app.handle(new Request('http://localhost/protected'))
        expect(unauthResponse.status).toBe(401)

        // Test with auth
        const authResponse = await app.handle(
            new Request('http://localhost/protected', {
                headers: { 'Authorization': 'Bearer token' }
            })
        )
        expect(authResponse.status).toBe(200)
    })
})

// 6. Plugin Testing
describe('Plugin Tests', () => {
    it('should test custom plugin', async () => {
        const testPlugin = new Elysia()
            .state('counter', 0)
            .get('/count', ({ store }) => ({ count: store.counter }))
            .post('/increment', ({ store }) => {
                store.counter++
                return { count: store.counter }
            })

        const app = new Elysia().use(testPlugin)
        const client = treaty(app)

        // Test initial count
        const { data: initial } = await client.count.get()
        expect(initial.count).toBe(0)

        // Test increment
        const { data: incremented } = await client.increment.post()
        expect(incremented.count).toBe(1)

        // Test count after increment
        const { data: final } = await client.count.get()
        expect(final.count).toBe(1)
    })
})

// 7. Performance Testing
describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
        const app = new Elysia()
            .get('/concurrent/:id', ({ params: { id } }) => ({ id, timestamp: Date.now() }))

        const client = treaty(app)
        const requests = Array.from({ length: 100 }, (_, i) => 
            client.concurrent({ id: i.toString() }).get()
        )

        const responses = await Promise.all(requests)
        
        expect(responses.length).toBe(100)
        responses.forEach((response, index) => {
            expect(response.status).toBe(200)
            expect(response.data?.id).toBe(index.toString())
        })
    })
})

// 8. File Upload Testing
describe('File Upload Tests', () => {
    it('should test file upload', async () => {
        const app = new Elysia()
            .post('/upload', ({ body }) => {
                const file = body.file as File
                return {
                    filename: file.name,
                    size: file.size,
                    type: file.type
                }
            }, {
                body: t.Object({
                    file: t.File()
                })
            })

        const formData = new FormData()
        formData.append('file', new File(['test content'], 'test.txt', { type: 'text/plain' }))

        const response = await app.handle(new Request('http://localhost/upload', {
            method: 'POST',
            body: formData
        }))

        const json = await response.json()
        expect(json.filename).toBe('test.txt')
        expect(json.type).toBe('text/plain')
    })
})

// 9. WebSocket Testing (if applicable)
describe('WebSocket Tests', () => {
    it('should test websocket connection', async () => {
        // WebSocket testing would require special setup
        // This is a placeholder for WebSocket testing patterns
        expect(true).toBe(true)
    })
})

// 10. Test Utilities
export class TestUtils {
    static createMockRequest(url: string, options: RequestInit = {}): Request {
        return new Request(`http://localhost${url}`, options)
    }

    static async expectJSON(response: Response, expected: any) {
        const json = await response.json()
        expect(json).toEqual(expected)
    }

    static async expectStatus(response: Response, status: number) {
        expect(response.status).toBe(status)
    }
}

export {
    createTestServer,
    TestUtils
}