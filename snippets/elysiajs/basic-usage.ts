// ElysiaJS Basic Usage Examples

import { Elysia, t } from 'elysia'

// 1. Basic Server Setup
const basicServer = new Elysia()
    .get('/', 'Hello Elysia')
    .get('/user/:id', ({ params: { id } }) => id)
    .post('/form', ({ body }) => body)
    .listen(3000)

// 2. Type-Safe Route with Schema Validation
const typedServer = new Elysia()
    .post('/user', ({ body }) => body, {
        body: t.Object({
            name: t.String(),
            email: t.String().email(),
            age: t.Number({ minimum: 0, maximum: 150 })
        })
    })
    .get('/health', () => ({ status: 'ok', timestamp: Date.now() }))

// 3. Query Parameters and Headers
const queryServer = new Elysia()
    .get('/search', ({ query }) => {
        return {
            term: query.q,
            limit: query.limit ? parseInt(query.limit) : 10
        }
    }, {
        query: t.Object({
            q: t.String(),
            limit: t.Optional(t.String())
        })
    })
    .get('/protected', ({ headers }) => {
        return { authorization: headers.authorization }
    }, {
        headers: t.Object({
            authorization: t.String()
        })
    })

// 4. File Upload Handling
const fileServer = new Elysia()
    .post('/upload', ({ body }) => {
        const file = body.file as File
        return {
            filename: file.name,
            size: file.size,
            type: file.type
        }
    }, {
        body: t.Object({
            file: t.File(),
            description: t.Optional(t.String())
        })
    })

// 5. Error Handling
const errorServer = new Elysia()
    .get('/error', () => {
        throw new Error('Something went wrong!')
    })
    .onError(({ code, error, set }) => {
        if (code === 'NOT_FOUND') {
            set.status = 404
            return { message: 'Route not found' }
        }

        set.status = 500
        return { message: error.message }
    })

// 6. Middleware and Hooks
const middlewareServer = new Elysia()
    .onBeforeHandle(({ request, set }) => {
        console.log(`${request.method} ${request.url}`)
        set.headers['x-request-id'] = crypto.randomUUID()
    })
    .get('/middleware-test', () => 'Middleware applied')

// 7. Static File Serving (with manual implementation)
const staticServer = new Elysia()
    .get('/static/*', ({ params }) => {
        const filename = params['*']
        return Bun.file(`./public/${filename}`)
    })

// 8. JSON Response with Custom Status
const statusServer = new Elysia()
    .post('/create-user', ({ body, set }) => {
        set.status = 201
        return {
            id: crypto.randomUUID(),
            ...body,
            createdAt: new Date().toISOString()
        }
    }, {
        body: t.Object({
            name: t.String(),
            email: t.String()
        })
    })

// 9. Multiple HTTP Methods on Same Route
const methodServer = new Elysia()
    .get('/resource/:id', ({ params: { id } }) => ({ id, method: 'GET' }))
    .put('/resource/:id', ({ params: { id }, body }) => ({ id, method: 'PUT', data: body }))
    .delete('/resource/:id', ({ params: { id } }) => ({ id, method: 'DELETE', deleted: true }))

// 10. Server Configuration
const configuredServer = new Elysia({
    prefix: '/api/v1',
    serve: {
        hostname: '0.0.0.0',
        port: parseInt(process.env.PORT || '3000')
    }
})
    .get('/status', () => ({ version: '1.0.0', uptime: process.uptime() }))

export {
    basicServer,
    typedServer,
    queryServer,
    fileServer,
    errorServer,
    middlewareServer,
    staticServer,
    statusServer,
    methodServer,
    configuredServer
}