// Presetter with Docker Deployment Configuration
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';

// 1. Docker-enabled preset
export default preset('docker-app', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@types/node': '^22.0.0'
    }
  },
  
  templates: {
    'Dockerfile': `# Multi-stage build for Node.js applications
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build application
FROM base AS builder
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "start"]`,

    'docker-compose.yml': `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  logs:`,

    'docker-compose.dev.yml': `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: bun run dev
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=dev
      - POSTGRES_PASSWORD=devpass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,

    'Dockerfile.dev': `FROM oven/bun:1-alpine

WORKDIR /app

# Install development dependencies
COPY package.json bun.lockb ./
RUN bun install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]`,

    '.dockerignore': `node_modules
npm-debug.log
dist
.git
.gitignore
README.md
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
coverage
.nyc_output
.cache
.temp
.DS_Store
*.log`,

    'nginx.conf': `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name localhost;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}`
  },

  override: {
    'package.json': {
      scripts: {
        'docker:build': 'docker build -t my-app .',
        'docker:run': 'docker run -p 3000:3000 my-app',
        'docker:dev': 'docker-compose -f docker-compose.dev.yml up',
        'docker:prod': 'docker-compose up -d',
        'docker:logs': 'docker-compose logs -f',
        'docker:clean': 'docker-compose down && docker system prune -f'
      }
    }
  }
});

// 2. Multi-stage production preset
export const productionDockerPreset = preset('production-docker', {
  extends: [esm],
  
  templates: {
    'Dockerfile.prod': `# Production optimized Dockerfile
FROM oven/bun:1-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Dependencies stage
FROM base AS deps
COPY --chown=nextjs:nodejs package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build stage
FROM base AS builder
COPY --chown=nextjs:nodejs package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY --chown=nextjs:nodejs . .
RUN bun run build && bun run test

# Production stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# Copy application files
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD bun run healthcheck || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "start"]`,

    'kubernetes.yml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer`
  }
});

// 3. Development Docker preset with hot reloading
export const devDockerPreset = preset('dev-docker', {
  extends: [esm],
  
  templates: {
    'Dockerfile.dev': `FROM oven/bun:1-alpine

# Install development tools
RUN apk add --no-cache git curl

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install

# Install development tools globally
RUN bun add -g nodemon concurrently

EXPOSE 3000 9229

# Enable debugger
CMD ["bun", "--inspect=0.0.0.0:9229", "run", "dev"]`,

    'docker-compose.override.yml': `version: '3.8'

services:
  app:
    build:
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app:cached
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=*
    ports:
      - "9229:9229"  # Debug port
    stdin_open: true
    tty: true`
  }
});