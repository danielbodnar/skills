// MDX Deployment Examples
// Production deployment strategies and configurations for MDX applications

import {compile} from '@mdx-js/mdx'
import {promises as fs} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

// Static Site Generation (SSG)
export const staticSiteGeneration = {
  // Pre-compile MDX files for production
  async preCompileMDXFiles(sourceDir: string, outputDir: string) {
    const files = await this.findMDXFiles(sourceDir)
    const compilationResults = []
    
    for (const file of files) {
      try {
        const mdxContent = await fs.readFile(file.path, 'utf-8')
        const compiled = await compile(mdxContent, {
          jsxImportSource: 'react',
          development: false,
          format: 'esm'
        })
        
        const outputPath = join(
          outputDir,
          file.relativePath.replace('.mdx', '.js')
        )
        
        // Ensure output directory exists
        await fs.mkdir(dirname(outputPath), {recursive: true})
        
        // Write compiled file
        await fs.writeFile(outputPath, String(compiled))
        
        compilationResults.push({
          source: file.path,
          output: outputPath,
          success: true
        })
      } catch (error) {
        compilationResults.push({
          source: file.path,
          output: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return compilationResults
  },

  // Find all MDX files in directory
  async findMDXFiles(dir: string, baseDir = dir): Promise<Array<{path: string, relativePath: string}>> {
    const files = []
    const entries = await fs.readdir(dir, {withFileTypes: true})
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...await this.findMDXFiles(fullPath, baseDir))
      } else if (entry.name.endsWith('.mdx')) {
        files.push({
          path: fullPath,
          relativePath: fullPath.replace(baseDir, '').replace(/^\//, '')
        })
      }
    }
    
    return files
  },

  // Generate static exports
  async generateStaticExports(mdxFiles: string[], outputDir: string) {
    const exports = []
    
    for (const [index, file] of mdxFiles.entries()) {
      const mdxContent = await fs.readFile(file, 'utf-8')
      const compiled = await compile(mdxContent, {
        jsxImportSource: 'react',
        outputFormat: 'function-body'
      })
      
      const exportName = `MDXContent${index}`
      exports.push(`
const ${exportName} = ${String(compiled)}
export {${exportName}}
      `.trim())
    }
    
    const indexContent = `
// Auto-generated MDX exports
${exports.join('\n\n')}

export const mdxComponents = [
${mdxFiles.map((_, index) => `  MDXContent${index}`).join(',\n')}
]
    `.trim()
    
    await fs.writeFile(join(outputDir, 'index.js'), indexContent)
    return indexContent
  }
}

// Docker deployment
export const dockerDeployment = {
  // Multi-stage Dockerfile for MDX applications
  dockerfile: `
# Multi-stage Dockerfile for MDX applications
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production=false

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pre-compile MDX files
RUN bun run build:mdx

# Build the application
RUN bun run build

# Production image
FROM oven/bun:1 AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["bun", "start"]
`,

  // Docker Compose for development and production
  dockerCompose: `
version: '3.8'

services:
  mdx-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      # For development, mount source code
      - ./src:/app/src:ro
      - ./content:/app/content:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - mdx-app
    restart: unless-stopped
`,

  // Nginx configuration
  nginxConfig: `
events {
    worker_connections 1024;
}

http {
    upstream mdx_app {
        server mdx-app:3000;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    server {
        listen 80;
        server_name localhost;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name localhost;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Proxy to MDX application
        location / {
            proxy_pass http://mdx_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://mdx_app;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://mdx_app/health;
            access_log off;
        }
    }
}
`
}

// Serverless deployment
export const serverlessDeployment = {
  // Vercel configuration
  vercelConfig: `
{
  "version": 2,
  "name": "mdx-app",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/blog/:path*",
      "destination": "/api/mdx/:path*"
    }
  ]
}
`,

  // Netlify configuration
  netlifyConfig: `
[build]
  publish = "dist"
  command = "bun run build"

[build.environment]
  NODE_VERSION = "18"
  BUN_VERSION = "1.0.0"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/blog/*"
  to = "/api/mdx/:splat"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "bun"
`,

  // AWS Lambda function for MDX rendering
  awsLambdaFunction: `
// netlify/functions/mdx-renderer.ts
import {Handler} from '@netlify/functions'
import {compile, evaluate} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import {renderToString} from 'react-dom/server'

export const handler: Handler = async (event, context) => {
  try {
    const {mdxSource, components = {}} = JSON.parse(event.body || '{}')
    
    if (!mdxSource) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: 'MDX source is required'})
      }
    }
    
    // Compile MDX
    const compiled = await compile(mdxSource, {
      jsxImportSource: 'react',
      development: false
    })
    
    // Evaluate and render
    const {default: Content} = await evaluate(String(compiled), {
      ...runtime,
      ...components,
      baseUrl: import.meta.url
    })
    
    const html = renderToString(React.createElement(Content))
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      },
      body: html
    }
  } catch (error) {
    console.error('MDX rendering error:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to render MDX',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
`
}

// Content Delivery Network (CDN)
export const cdnOptimization = {
  // CloudFront configuration
  cloudfrontConfig: `
{
  "CallerReference": "mdx-app-distribution",
  "DefaultRootObject": "index.html",
  "Comment": "MDX Application CDN",
  "Enabled": true,
  "PriceClass": "PriceClass_100",
  "DefaultCacheBehavior": {
    "TargetOriginId": "mdx-app-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CacheBehaviors": [
    {
      "PathPattern": "/api/*",
      "TargetOriginId": "mdx-app-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false
      },
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {
          "Forward": "all"
        },
        "Headers": {
          "Quantity": 1,
          "Items": ["Authorization"]
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 0,
      "MaxTTL": 0
    },
    {
      "PathPattern": "*.js",
      "TargetOriginId": "mdx-app-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 31536000,
      "DefaultTTL": 31536000,
      "MaxTTL": 31536000,
      "Compress": true
    }
  ]
}
`,

  // Cache optimization strategies
  cacheOptimization: {
    // Generate cache keys for MDX content
    generateCacheKey(mdxSource: string, components: Record<string, any> = {}) {
      const hash = require('crypto')
        .createHash('sha256')
        .update(mdxSource + JSON.stringify(components))
        .digest('hex')
      
      return `mdx-${hash.substring(0, 16)}`
    },

    // Cache compiled MDX with Redis
    async cacheCompiledMDX(key: string, compiledCode: string, ttl = 3600) {
      // This would use your Redis client
      // await redis.setex(key, ttl, compiledCode)
      console.log(`Caching compiled MDX with key: ${key}, TTL: ${ttl}`)
    },

    // Retrieve cached MDX
    async getCachedMDX(key: string) {
      // This would use your Redis client
      // return await redis.get(key)
      console.log(`Retrieving cached MDX with key: ${key}`)
      return null // Placeholder
    },

    // Invalidate cache
    async invalidateCache(pattern: string) {
      // This would use your Redis client
      // const keys = await redis.keys(pattern)
      // if (keys.length > 0) {
      //   await redis.del(...keys)
      // }
      console.log(`Invalidating cache with pattern: ${pattern}`)
    }
  }
}

// Performance monitoring in production
export const performanceMonitoring = {
  // Application Performance Monitoring (APM)
  apmIntegration: `
// lib/apm.ts
import {init as initSentry} from '@sentry/node'
import {nodeProfilingIntegration} from '@sentry/profiling-node'

export function initAPM() {
  initSentry({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      nodeProfilingIntegration()
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out MDX compilation errors that are expected
      if (event.exception?.values?.[0]?.type === 'MDXCompilationError') {
        return null
      }
      return event
    }
  })
}

// Measure MDX compilation performance
export async function measureMDXCompilation<T>(
  operation: () => Promise<T>,
  metadata: {source: string, size: number}
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - start
    
    // Log performance metrics
    console.log('MDX compilation completed', {
      duration,
      size: metadata.size,
      throughput: metadata.size / duration
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    // Log error with context
    console.error('MDX compilation failed', {
      duration,
      size: metadata.size,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    throw error
  }
}
`,

  // Health check endpoints
  healthCheck: `
// api/health.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkMDXCompilation(),
    checkMemoryUsage(),
    checkDependencies()
  ])
  
  const results = {
    status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      mdx: checks[0].status === 'fulfilled' ? 'ok' : 'error',
      memory: checks[1].status === 'fulfilled' ? 'ok' : 'error',
      dependencies: checks[2].status === 'fulfilled' ? 'ok' : 'error'
    }
  }
  
  return new Response(JSON.stringify(results), {
    status: results.status === 'healthy' ? 200 : 503,
    headers: {'Content-Type': 'application/json'}
  })
}

async function checkMDXCompilation() {
  const testMDX = '# Health Check\\n\\nMDX compilation is working.'
  const compiled = await compile(testMDX, {jsxImportSource: 'react'})
  return String(compiled).length > 0
}

async function checkMemoryUsage() {
  const usage = process.memoryUsage()
  const maxHeapSize = 512 * 1024 * 1024 // 512MB
  return usage.heapUsed < maxHeapSize
}

async function checkDependencies() {
  // Check if critical dependencies are available
  try {
    await import('@mdx-js/mdx')
    await import('react/jsx-runtime')
    return true
  } catch {
    return false
  }
}
`
}

// Security configurations
export const securityConfigurations = {
  // Content Security Policy for MDX apps
  cspHeaders: {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://api.github.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim()
  },

  // Rate limiting configuration
  rateLimiting: `
// middleware/rate-limit.ts
import {Ratelimit} from '@upstash/ratelimit'
import {Redis} from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true
})

export async function rateLimitMiddleware(request: Request) {
  const ip = request.headers.get('X-Forwarded-For') ?? 'anonymous'
  const {success, limit, reset, remaining} = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString()
      }
    })
  }
  
  return null // Continue processing
}
`,

  // Input sanitization
  inputSanitization: `
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeMDXInput(mdxSource: string): string {
  // Remove potentially dangerous content
  let sanitized = mdxSource
  
  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\\/script>/gis, '')
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/on\\w+\\s*=\\s*["'][^"']*["']/gi, '')
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:[^\\s]*/gi, '')
  
  // Sanitize HTML content
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'a', 'img', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'className', 'id']
  })
  
  return sanitized
}

export function validateMDXComponents(components: Record<string, any>): Record<string, any> {
  const allowedComponents = ['Alert', 'CodeBlock', 'Image', 'Card'] // Define your allowed components
  
  return Object.fromEntries(
    Object.entries(components).filter(([key]) => 
      allowedComponents.includes(key)
    )
  )
}
`
}

// Export all deployment examples
export const mdxDeploymentExamples = {
  staticSiteGeneration,
  dockerDeployment,
  serverlessDeployment,
  cdnOptimization,
  performanceMonitoring,
  securityConfigurations
}