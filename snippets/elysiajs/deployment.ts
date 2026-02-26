// ElysiaJS Deployment Examples

import { Elysia } from 'elysia'

// 1. Production Build Script
export const buildCommands = {
    // Single binary compilation
    compile: `bun build --compile --minify-whitespace --minify-syntax --target bun --outfile server ./src/index.ts`,
    
    // Docker build
    dockerBuild: 'docker build -t my-elysia-app .',
    
    // Install production dependencies only
    installProd: 'bun install --production --frozen-lockfile'
}

// 2. Dockerfile for Bun
export const dockerfile = `
# Use the official Bun image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Build the application
RUN bun build --compile --minify-whitespace --minify-syntax --target bun --outfile server ./src/index.ts

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Run the compiled binary
CMD ["./server"]
`

// 3. Docker Compose Configuration
export const dockerCompose = `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PASSWORD=\${DB_PASSWORD}
      - JWT_SECRET=\${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
`

// 4. Nginx Configuration
export const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        listen 80;
        server_name example.com;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name example.com;
        
        ssl_certificate /etc/ssl/certs/cert.pem;
        ssl_certificate_key /etc/ssl/certs/key.pem;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        
        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Static files
        location /static/ {
            alias /app/public/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
`

// 5. Kubernetes Deployment
export const kubernetesDeployment = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elysia-app
  labels:
    app: elysia-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elysia-app
  template:
    metadata:
      labels:
        app: elysia-app
    spec:
      containers:
      - name: elysia-app
        image: my-elysia-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: elysia-service
spec:
  selector:
    app: elysia-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
`

// 6. Production Server Configuration
const productionServer = new Elysia({
    serve: {
        hostname: '0.0.0.0',
        port: parseInt(process.env.PORT || '3000'),
        development: false,
        
        // Performance settings
        reusePort: true,
        
        // Security
        ...(process.env.SSL_CERT && {
            tls: {
                cert: Bun.file(process.env.SSL_CERT),
                key: Bun.file(process.env.SSL_KEY)
            }
        })
    },
    
    // Production optimizations
    aot: true,
    precompile: true,
    nativeStaticResponse: true
})
    // Health check endpoint
    .get('/health', () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0'
    }))
    
    // Ready check endpoint
    .get('/ready', async () => {
        // Check database connectivity, external services, etc.
        const checks = {
            database: await checkDatabase(),
            cache: await checkCache(),
            externalApi: await checkExternalApi()
        }
        
        const allHealthy = Object.values(checks).every(check => check.healthy)
        
        return {
            ready: allHealthy,
            checks,
            timestamp: new Date().toISOString()
        }
    })
    
    // Graceful shutdown handling
    .onStop(async () => {
        console.log('Shutting down gracefully...')
        // Close database connections, finish pending requests, etc.
        await cleanup()
    })

// 7. Health Check Functions
async function checkDatabase(): Promise<{ healthy: boolean; latency?: number }> {
    try {
        const start = Date.now()
        // Perform database ping
        // await db.query('SELECT 1')
        const latency = Date.now() - start
        return { healthy: true, latency }
    } catch (error) {
        return { healthy: false }
    }
}

async function checkCache(): Promise<{ healthy: boolean }> {
    try {
        // Check Redis/cache connectivity
        // await redis.ping()
        return { healthy: true }
    } catch (error) {
        return { healthy: false }
    }
}

async function checkExternalApi(): Promise<{ healthy: boolean }> {
    try {
        // Check external service connectivity
        const response = await fetch('https://api.external-service.com/health', {
            signal: AbortSignal.timeout(5000)
        })
        return { healthy: response.ok }
    } catch (error) {
        return { healthy: false }
    }
}

async function cleanup(): Promise<void> {
    // Cleanup database connections, background jobs, etc.
    console.log('Cleanup complete')
}

// 8. Environment Variables Template
export const envTemplate = `
# Application
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# SSL/TLS
SSL_CERT=/path/to/cert.pem
SSL_KEY=/path/to/key.pem

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# External Services
EXTERNAL_API_URL=https://api.external-service.com
EXTERNAL_API_KEY=your_api_key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`

// 9. PM2 Configuration
export const pm2Config = `
module.exports = {
  apps: [{
    name: 'elysia-app',
    script: './server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
}
`

// 10. GitHub Actions CI/CD
export const githubActions = `
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun test
      - run: bun run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun build --compile --outfile server ./src/index.ts
      - uses: actions/upload-artifact@v3
        with:
          name: server-binary
          path: ./server

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: server-binary
      - name: Deploy to server
        run: |
          # Deploy to your server (e.g., via SSH, Docker, etc.)
          echo "Deploying to production..."
`

// 11. Monitoring Setup
const monitoringServer = new Elysia()
    // Prometheus metrics endpoint
    .get('/metrics', () => {
        // Return Prometheus metrics
        return `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234
`
    })
    
    // Application metrics
    .get('/metrics/app', () => ({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.APP_VERSION || '1.0.0'
    }))

// 12. Load Balancer Configuration (HAProxy)
export const haproxyConfig = `
global
    daemon
    maxconn 2048

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend http_front
    bind *:80
    redirect scheme https if !{ ssl_fc }

frontend https_front
    bind *:443 ssl crt /etc/ssl/certs/cert.pem
    default_backend http_back

backend http_back
    balance roundrobin
    option httpchk GET /health
    server app1 app1:3000 check
    server app2 app2:3000 check
    server app3 app3:3000 check
`

export {
    productionServer,
    monitoringServer,
    checkDatabase,
    checkCache,
    checkExternalApi,
    cleanup
}