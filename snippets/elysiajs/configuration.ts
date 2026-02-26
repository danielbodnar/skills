// ElysiaJS Configuration Examples

import { Elysia } from 'elysia'

// 1. Basic Server Configuration
const basicConfig = new Elysia({
    // Server prefix for all routes
    prefix: '/api/v1',
    
    // Server options extending Bun.serve
    serve: {
        hostname: '0.0.0.0',
        port: parseInt(process.env.PORT || '3000'),
        development: process.env.NODE_ENV === 'development'
    }
})

// 2. Advanced Performance Configuration
const performanceConfig = new Elysia({
    // Ahead of Time compilation
    aot: true,
    
    // Precompile routes for better performance
    precompile: true,
    
    // Use native static response optimization
    nativeStaticResponse: true,
    
    // Strict path matching
    strictPath: true,
    
    // Normalize responses to match schema
    normalize: true
})

// 3. HTTPS/TLS Configuration
const httpsConfig = new Elysia({
    serve: {
        port: 443,
        tls: {
            cert: Bun.file('./ssl/cert.pem'),
            key: Bun.file('./ssl/key.pem'),
            passphrase: process.env.SSL_PASSPHRASE,
            // Additional TLS options
            ca: Bun.file('./ssl/ca.pem'), // Certificate Authority
            dhparam: Bun.file('./ssl/dhparam.pem') // Diffie-Hellman parameters
        }
    }
})

// 4. WebSocket Configuration
const websocketConfig = new Elysia({
    websocket: {
        // Enable compression
        perMessageDeflate: true,
        
        // Maximum payload size (in bytes)
        maxPayloadLength: 16 * 1024 * 1024, // 16MB
        
        // Idle timeout (in seconds)
        idleTimeout: 30,
        
        // Maximum backpressure
        maxBackpressure: 64 * 1024, // 64KB
        
        // Enable compression
        compression: 1, // 0-9, where 9 is maximum compression
        
        // Close on backpressure limit
        closeOnBackpressureLimit: false
    }
})

// 5. Environment-Specific Configuration
const createEnvConfig = () => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isProduction = process.env.NODE_ENV === 'production'
    const isTest = process.env.NODE_ENV === 'test'

    return new Elysia({
        serve: {
            hostname: isDevelopment ? 'localhost' : '0.0.0.0',
            port: parseInt(process.env.PORT || (isDevelopment ? '3000' : '8080')),
            development: isDevelopment,
            
            // Only enable TLS in production
            ...(isProduction && {
                tls: {
                    cert: Bun.file(process.env.SSL_CERT_PATH!),
                    key: Bun.file(process.env.SSL_KEY_PATH!)
                }
            })
        },
        
        // Enable optimizations in production
        aot: isProduction,
        precompile: isProduction,
        nativeStaticResponse: isProduction,
        
        // Strict validation in development/test
        strictPath: !isProduction,
        normalize: isDevelopment || isTest
    })
}

// 6. Database Connection Configuration
interface DatabaseConfig {
    host: string
    port: number
    database: string
    username: string
    password: string
    ssl?: boolean
}

const databaseConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
}

const appWithDatabase = new Elysia()
    .decorate('db', databaseConfig)
    .get('/db-status', ({ db }) => ({
        connected: true,
        host: db.host,
        database: db.database
    }))

// 7. Logging Configuration
interface LogConfig {
    level: 'debug' | 'info' | 'warn' | 'error'
    format: 'json' | 'text'
    destination?: string
}

const logConfig: LogConfig = {
    level: (process.env.LOG_LEVEL as LogConfig['level']) || 'info',
    format: (process.env.LOG_FORMAT as LogConfig['format']) || 'text',
    destination: process.env.LOG_FILE
}

const appWithLogging = new Elysia()
    .decorate('logger', {
        info: (message: string, meta?: any) => {
            if (logConfig.level === 'debug' || logConfig.level === 'info') {
                console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date().toISOString() }))
            }
        },
        error: (message: string, meta?: any) => {
            console.error(JSON.stringify({ level: 'error', message, meta, timestamp: new Date().toISOString() }))
        }
    })
    .onBeforeHandle(({ request, logger }) => {
        logger.info(`${request.method} ${request.url}`)
    })

// 8. CORS Configuration
const corsConfig = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
}

// 9. Rate Limiting Configuration
interface RateLimitConfig {
    windowMs: number
    maxRequests: number
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
}

const rateLimitConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
}

// 10. Security Headers Configuration
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
}

const secureApp = new Elysia()
    .onBeforeHandle(({ set }) => {
        Object.entries(securityHeaders).forEach(([key, value]) => {
            set.headers[key] = value
        })
    })

// 11. JWT Configuration
interface JWTConfig {
    secret: string
    expiresIn: string
    issuer?: string
    audience?: string
    algorithm?: string
}

const jwtConfig: JWTConfig = {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'my-app',
    audience: process.env.JWT_AUDIENCE || 'my-app-users',
    algorithm: 'HS256'
}

// 12. File Upload Configuration
interface UploadConfig {
    maxFileSize: number
    allowedTypes: string[]
    uploadDir: string
}

const uploadConfig: UploadConfig = {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || './uploads'
}

// 13. API Documentation Configuration
const apiDocConfig = {
    info: {
        title: process.env.API_TITLE || 'My API',
        version: process.env.API_VERSION || '1.0.0',
        description: process.env.API_DESCRIPTION || 'API documentation',
        contact: {
            name: 'API Support',
            email: process.env.SUPPORT_EMAIL || 'support@example.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: process.env.API_BASE_URL || 'http://localhost:3000',
            description: 'Development server'
        }
    ]
}

// 14. Health Check Configuration
const healthCheckConfig = {
    path: '/health',
    checks: {
        database: true,
        redis: false,
        external_api: true
    }
}

// 15. Complete Production Configuration
const productionApp = new Elysia({
    // Performance optimizations
    aot: true,
    precompile: true,
    nativeStaticResponse: true,
    strictPath: false,
    
    // Server configuration
    serve: {
        hostname: '0.0.0.0',
        port: parseInt(process.env.PORT || '8080'),
        development: false,
        
        // TLS configuration
        tls: process.env.SSL_CERT_PATH ? {
            cert: Bun.file(process.env.SSL_CERT_PATH),
            key: Bun.file(process.env.SSL_KEY_PATH),
            ...(process.env.SSL_CA_PATH && { ca: Bun.file(process.env.SSL_CA_PATH) })
        } : undefined,
        
        // Connection limits
        maxRequestBodySize: parseInt(process.env.MAX_REQUEST_SIZE || '1048576'), // 1MB
        
        // Enable HTTP/2
        reusePort: true
    },
    
    // WebSocket configuration for production
    websocket: {
        perMessageDeflate: true,
        maxPayloadLength: 1024 * 1024, // 1MB
        idleTimeout: 60,
        maxBackpressure: 64 * 1024,
        compression: 6
    }
})
    // Add security headers
    .onBeforeHandle(({ set }) => {
        Object.entries(securityHeaders).forEach(([key, value]) => {
            set.headers[key] = value
        })
    })
    // Add request logging
    .onRequest(({ request }) => {
        console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
    })
    // Global error handling
    .onError(({ error, set }) => {
        console.error(`[ERROR] ${error.message}`)
        
        if (process.env.NODE_ENV === 'production') {
            set.status = 500
            return { error: 'Internal server error' }
        } else {
            set.status = 500
            return { error: error.message, stack: error.stack }
        }
    })

export {
    basicConfig,
    performanceConfig,
    httpsConfig,
    websocketConfig,
    createEnvConfig,
    databaseConfig,
    appWithDatabase,
    logConfig,
    appWithLogging,
    corsConfig,
    rateLimitConfig,
    secureApp,
    jwtConfig,
    uploadConfig,
    apiDocConfig,
    healthCheckConfig,
    productionApp
}