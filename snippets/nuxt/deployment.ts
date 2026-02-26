// Nuxt 4 deployment patterns and configurations

// 1. Vercel deployment (vercel.json)
/*
{
  "builds": [
    {
      "src": "nuxt.config.ts",
      "use": "@nuxtjs/vercel-builder"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/.nuxt/output/server/index.mjs"
    },
    {
      "src": "/(.*)",
      "dest": "/.nuxt/output/public/$1"
    }
  ],
  "env": {
    "NUXT_PUBLIC_API_BASE": "@nuxt_public_api_base"
  },
  "functions": {
    ".nuxt/output/server/index.mjs": {
      "maxDuration": 30
    }
  }
}
*/

// 2. Netlify deployment (_redirects)
/*
# SPA fallback for client-side routing
/*    /index.html   200

# API routes
/api/*  /.netlify/functions/server/:splat  200

# Static assets
/assets/*  /assets/:splat  200
/_nuxt/*   /_nuxt/:splat   200
*/

// netlify.toml
/*
[build]
  command = "bun run build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/_nuxt/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
*/

// 3. Docker deployment (Dockerfile)
/*
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install bun
RUN npm install -g bun

# Create non-root user
RUN addgroup --system --gid 1001 nuxtjs
RUN adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder --chown=nuxtjs:nuxtjs /app/.output ./

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Start application
CMD ["node", "server/index.mjs"]
*/

// docker-compose.yml
/*
version: '3.8'

services:
  nuxt-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NUXT_DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
*/

// 4. Cloudflare Pages deployment (wrangler.toml)
/*
name = "my-nuxt-app"
compatibility_date = "2024-07-17"

[build]
command = "bun run build"
cwd = "."

[env.production]
[env.production.vars]
NUXT_PUBLIC_API_BASE = "https://my-app.pages.dev/api"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[env.production.d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "your-database-id"

[env.staging]
[env.staging.vars]
NUXT_PUBLIC_API_BASE = "https://staging.my-app.pages.dev/api"
*/

// 5. AWS Lambda deployment (serverless.yml)
/*
service: nuxt-app

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
  environment:
    NODE_ENV: production
    NUXT_API_SECRET: ${env:NUXT_API_SECRET}
    NUXT_DATABASE_URL: ${env:NUXT_DATABASE_URL}

functions:
  nuxtApp:
    handler: .output/server/index.handler
    events:
      - http:
          path: /
          method: ANY
      - http:
          path: /{proxy+}
          method: ANY

plugins:
  - serverless-finch

custom:
  client:
    bucketName: my-nuxt-app-${self:provider.stage}
    distributionFolder: .output/public
    indexDocument: index.html
    errorDocument: index.html
*/

// 6. Railway deployment (railway.toml)
/*
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[environments.production]
variables = { NODE_ENV = "production" }
*/

// 7. DigitalOcean App Platform (.do/app.yaml)
/*
name: nuxt-app
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: bun run start
  build_command: bun install && bun run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  
  envs:
  - key: NODE_ENV
    value: production
  - key: NUXT_PUBLIC_API_BASE
    value: ${_self.DOMAIN}/api

databases:
- name: db
  engine: PG
  version: "15"
  
static_sites:
- name: assets
  source_dir: /.output/public
  catchall_document: index.html
*/

// 8. GitHub Actions CI/CD (.github/workflows/deploy.yml)
/*
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install --frozen-lockfile
    
    - name: Run linting
      run: bun run lint
    
    - name: Run type checking
      run: bun run typecheck
    
    - name: Run tests
      run: bun run test
    
    - name: Run E2E tests
      run: bun run test:e2e
      env:
        CI: true

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
    
    - name: Install dependencies
      run: bun install --frozen-lockfile
    
    - name: Build application
      run: bun run build
      env:
        NUXT_PUBLIC_API_BASE: ${{ secrets.NUXT_PUBLIC_API_BASE }}
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-files
        path: .output/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-files
        path: .output/
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
*/

// 9. Production configuration (nuxt.config.production.ts)
export default defineNuxtConfig({
  // Production optimizations
  nitro: {
    minify: true,
    compressPublicAssets: true,
    storage: {
      redis: {
        driver: 'redis',
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    }
  },
  
  // Enable compression
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Cache-Control': 's-maxage=300'
      }
    },
    '/_nuxt/**': {
      headers: {
        'Cache-Control': 'max-age=31536000'
      }
    }
  },
  
  // Performance monitoring
  experimental: {
    buildCache: true
  },
  
  // Security headers
  app: {
    head: {
      meta: [
        { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
        { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
        { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
      ]
    }
  }
})

// 10. Environment-specific deployment scripts

// scripts/deploy-staging.sh
/*
#!/bin/bash
set -e

echo "🚀 Deploying to staging..."

# Build for staging
export NODE_ENV=staging
export NUXT_PUBLIC_API_BASE=https://staging-api.myapp.com

bun run build

# Deploy to staging server
rsync -avz --delete .output/ user@staging-server:/var/www/myapp/

# Restart application
ssh user@staging-server "sudo systemctl restart myapp"

echo "✅ Staging deployment complete!"
*/

// scripts/deploy-production.sh
/*
#!/bin/bash
set -e

echo "🚀 Deploying to production..."

# Safety check
read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Build for production
export NODE_ENV=production
export NUXT_PUBLIC_API_BASE=https://api.myapp.com

bun run build

# Run production tests
bun run test:prod

# Create backup
ssh user@prod-server "sudo tar -czf /backups/myapp-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/myapp/"

# Deploy to production
rsync -avz --delete .output/ user@prod-server:/var/www/myapp/

# Restart application with zero downtime
ssh user@prod-server "sudo systemctl reload myapp"

# Health check
sleep 10
curl -f https://myapp.com/api/health || {
    echo "❌ Health check failed, rolling back..."
    ssh user@prod-server "sudo systemctl rollback myapp"
    exit 1
}

echo "✅ Production deployment complete!"
*/

// Performance monitoring setup
export const setupProductionMonitoring = () => {
  // Add error tracking
  if (process.env.SENTRY_DSN) {
    // Sentry configuration
  }
  
  // Add performance monitoring
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    // New Relic configuration
  }
  
  // Add uptime monitoring
  if (process.env.UPTIME_ROBOT_API_KEY) {
    // UptimeRobot configuration
  }
}