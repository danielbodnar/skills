// ElysiaJS Eden Client Examples

// Server Setup
import { Elysia, t } from 'elysia'

export const server = new Elysia()
    .get('/', 'Hello Eden')
    .get('/user/:id', ({ params: { id } }) => ({ id, name: `User ${id}` }))
    .post('/user', ({ body }) => ({ ...body, id: crypto.randomUUID() }), {
        body: t.Object({
            name: t.String(),
            email: t.String(),
            age: t.Optional(t.Number())
        })
    })
    .put('/user/:id', ({ params: { id }, body }) => ({ id, ...body }), {
        body: t.Object({
            name: t.Optional(t.String()),
            email: t.Optional(t.String())
        })
    })
    .delete('/user/:id', ({ params: { id } }) => ({ deleted: true, id }))
    .get('/search', ({ query }) => ({
        results: [`Result for: ${query.q}`],
        count: 1
    }), {
        query: t.Object({
            q: t.String(),
            limit: t.Optional(t.String())
        })
    })
    .listen(3000)

export type App = typeof server

// Eden Treaty Client Examples
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

// 1. Basic Treaty Setup
const client = treaty<App>('http://localhost:3000')

// 2. GET Requests
async function getExamples() {
    // Simple GET
    const { data: home } = await client.get()
    console.log(home) // 'Hello Eden'

    // GET with path parameters
    const { data: user, error } = await client.user({ id: '123' }).get()
    if (error) {
        console.error('Error:', error)
    } else {
        console.log(user) // { id: '123', name: 'User 123' }
    }

    // GET with query parameters
    const { data: searchResults } = await client.search.get({
        $query: {
            q: 'typescript',
            limit: '10'
        }
    })
    console.log(searchResults)
}

// 3. POST Requests
async function postExamples() {
    const { data: newUser, error } = await client.user.post({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
    })

    if (error) {
        console.error('Failed to create user:', error)
    } else {
        console.log('Created user:', newUser)
    }
}

// 4. PUT Requests
async function putExamples() {
    const { data: updatedUser } = await client.user({ id: '123' }).put({
        name: 'Jane Doe',
        email: 'jane@example.com'
    })
    console.log('Updated user:', updatedUser)
}

// 5. DELETE Requests
async function deleteExamples() {
    const { data: result } = await client.user({ id: '123' }).delete()
    console.log('Delete result:', result)
}

// 6. Error Handling
async function errorHandling() {
    const { data, error, status } = await client.user({ id: '999' }).get()
    
    if (error) {
        switch (status) {
            case 404:
                console.log('User not found')
                break
            case 500:
                console.log('Server error')
                break
            default:
                console.log('Unknown error:', error)
        }
    } else {
        console.log('User data:', data)
    }
}

// 7. Custom Headers
async function customHeaders() {
    const { data } = await client.user({ id: '123' }).get({
        $fetch: {
            headers: {
                'Authorization': 'Bearer token',
                'x-custom-header': 'value'
            }
        }
    })
}

// Eden Fetch Client Examples
import { edenFetch } from '@elysiajs/eden'

// 1. Basic Fetch Setup
const fetchClient = edenFetch<App>('http://localhost:3000')

// 2. Fetch API Style Requests
async function fetchExamples() {
    // GET request
    const homeResponse = await fetchClient('/', {})
    console.log(homeResponse) // 'Hello Eden'

    // GET with path parameters
    const userResponse = await fetchClient('/user/:id', {
        params: { id: '123' }
    })
    console.log(userResponse)

    // POST request
    const createResponse = await fetchClient('/user', {
        method: 'POST',
        body: {
            name: 'Alice',
            email: 'alice@example.com'
        }
    })
    console.log(createResponse)

    // GET with query parameters
    const searchResponse = await fetchClient('/search', {
        query: {
            q: 'javascript',
            limit: '5'
        }
    })
    console.log(searchResponse)
}

// 3. Advanced Eden Treaty Configuration
const configuredClient = treaty<App>('http://localhost:3000', {
    // Global headers
    headers: {
        'User-Agent': 'Eden Client 1.0',
        'Accept': 'application/json'
    },
    // Global fetch options
    fetch: {
        credentials: 'include'
    }
})

// 4. Type-Safe Error Handling with Treaty
async function typeSafeErrorHandling() {
    const result = await client.user.post({
        name: 'Test User',
        email: 'test@example.com'
    })

    // TypeScript knows the shape of both data and error
    if (result.error) {
        // Handle error case
        console.error('API Error:', result.error.value)
        console.error('Status:', result.status)
    } else {
        // Handle success case
        console.log('Created user:', result.data)
        console.log('User ID:', result.data.id) // Type-safe access
    }
}

// 5. Batch Requests with Treaty
async function batchRequests() {
    const [user1, user2, searchResults] = await Promise.all([
        client.user({ id: '1' }).get(),
        client.user({ id: '2' }).get(),
        client.search.get({ $query: { q: 'elysia' } })
    ])

    console.log('User 1:', user1.data)
    console.log('User 2:', user2.data)
    console.log('Search:', searchResults.data)
}

// 6. Stream Response Handling (if supported)
async function streamExample() {
    // For endpoints that return streams
    const response = await client.user({ id: '123' }).get({
        $fetch: {
            headers: {
                'Accept': 'text/stream'
            }
        }
    })
}

// 7. WebSocket Client (Treaty supports WebSocket)
// Note: WebSocket support varies by implementation
function websocketExample() {
    // WebSocket connections would be handled differently
    // This is conceptual as it depends on server WebSocket setup
}

export {
    client,
    fetchClient,
    configuredClient,
    getExamples,
    postExamples,
    putExamples,
    deleteExamples,
    errorHandling,
    customHeaders,
    fetchExamples,
    typeSafeErrorHandling,
    batchRequests,
    streamExample
}