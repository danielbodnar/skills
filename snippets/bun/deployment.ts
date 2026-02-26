// Bun Deployment Examples

// 1. Docker Deployment
/*
# Multi-stage Dockerfile for Bun applications
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production
WORKDIR /app

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/bun.lockb ./

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunuser
USER bunuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run health-check || exit 1

# Start the application
CMD ["bun", "dist/index.js"]
*/

// 2. Docker Compose Configuration
/*
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
*/

// 3. Kubernetes Deployment
/*
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bun-app
  labels:
    app: bun-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bun-app
  template:
    metadata:
      labels:
        app: bun-app
    spec:
      containers:
      - name: bun-app
        image: your-registry/bun-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
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
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: bun-app-service
spec:
  selector:
    app: bun-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
*/

// 4. Production Server Configuration
export const productionServer = {
  port: process.env.PORT || 3000,
  hostname: process.env.HOSTNAME || "0.0.0.0",

  async fetch(req: Request) {
    const start = performance.now();

    try {
      // Add request ID for tracing
      const requestId = crypto.randomUUID();

      // Add security headers
      const response = await handleRequest(req, requestId);

      // Add production headers
      response.headers.set("X-Request-ID", requestId);
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

      // Log request
      const duration = performance.now() - start;
      console.log(`${req.method} ${req.url} - ${response.status} - ${duration.toFixed(2)}ms`);

      return response;
    } catch (error) {
      console.error("Request error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },

  // Production error handler
  error(error: Error) {
    console.error("Server error:", error);
    return new Response("Server Error", { status: 500 });
  },
};

async function handleRequest(req: Request, requestId: string): Promise<Response> {
  const url = new URL(req.url);

  // Health check endpoint
  if (url.pathname === "/health") {
    return Response.json({
      status: "healthy",
      timestamp: Date.now(),
      requestId
    });
  }

  // Readiness check
  if (url.pathname === "/ready") {
    // Check database connectivity, etc.
    const isReady = await checkReadiness();
    return Response.json({
      status: isReady ? "ready" : "not ready",
      requestId
    }, {
      status: isReady ? 200 : 503
    });
  }

  // Metrics endpoint
  if (url.pathname === "/metrics") {
    return new Response(await getMetrics(), {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

async function checkReadiness(): Promise<boolean> {
  try {
    // Check database
    // Check external services
    // Check critical resources
    return true;
  } catch (error) {
    return false;
  }
}

async function getMetrics(): Promise<string> {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  return `
# HELP process_memory_usage_bytes Memory usage in bytes
# TYPE process_memory_usage_bytes gauge
process_memory_usage_bytes{type="rss"} ${memUsage.rss}
process_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}
process_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}
`.trim();
}

// 5. Environment Configuration
const config = {
  development: {
    port: 3000,
    database: {
      host: "localhost",
      port: 5432,
      database: "myapp_dev",
    },
    redis: {
      host: "localhost",
      port: 6379,
    },
    logLevel: "debug",
  },

  staging: {
    port: process.env.PORT || 3000,
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    logLevel: "info",
  },

  production: {
    port: process.env.PORT || 3000,
    database: {
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      pool: {
        min: 5,
        max: 20,
      },
    },
    redis: {
      url: process.env.REDIS_URL,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    },
    logLevel: "warn",
  },
};

// 6. Build Script for Production
const buildScript = `#!/bin/bash
set -e

echo "Building Bun application..."

# Clean previous build
rm -rf dist

# Install dependencies
bun install --frozen-lockfile

# Run tests
bun test

# Type check
bunx tsc --noEmit

# Lint
bunx biome check --write

# Build for production
bun build ./src/index.ts --outdir ./dist --target bun --minify --sourcemap

# Build static assets if needed
if [ -d "public" ]; then
  cp -r public dist/
fi

echo "Build completed successfully!"
`;

// 7. CI/CD Pipeline (GitHub Actions)
/*
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run tests
        run: bun test

      - name: Type check
        run: bunx tsc --noEmit

      - name: Lint
        run: bunx biome check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Login to Container Registry
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to production
        run: |
          # Deploy to your platform (AWS, GCP, etc.)
          echo "Deploying to production..."
*/

// 8. Monitoring and Logging
class ProductionLogger {
  private level: string;

  constructor(level = "info") {
    this.level = level;
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      pid: process.pid,
      ...(meta && { meta }),
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, {
        ...meta,
        ...(error && {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }),
      }));
    }
  }
}

// 9. Process Management Script
const processManager = `#!/bin/bash

PIDFILE="app.pid"
LOGFILE="app.log"

start() {
    if [ -f $PIDFILE ]; then
        echo "Application is already running (PID: $(cat $PIDFILE))"
        exit 1
    fi

    echo "Starting application..."
    nohup bun dist/index.js > $LOGFILE 2>&1 &
    echo $! > $PIDFILE
    echo "Application started (PID: $(cat $PIDFILE))"
}

stop() {
    if [ ! -f $PIDFILE ]; then
        echo "Application is not running"
        exit 1
    fi

    PID=$(cat $PIDFILE)
    echo "Stopping application (PID: $PID)..."
    kill $PID
    rm $PIDFILE
    echo "Application stopped"
}

restart() {
    stop
    sleep 2
    start
}

status() {
    if [ -f $PIDFILE ]; then
        PID=$(cat $PIDFILE)
        if ps -p $PID > /dev/null; then
            echo "Application is running (PID: $PID)"
        else
            echo "PID file exists but process is not running"
            rm $PIDFILE
        fi
    else
        echo "Application is not running"
    fi
}

case "$1" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    *)       echo "Usage: $0 {start|stop|restart|status}" ;;
esac
`;

// 10. Performance Monitoring
class PerformanceMonitor {
  private metrics = {
    requests: 0,
    errors: 0,
    totalResponseTime: 0,
  };

  recordRequest(responseTime: number, error = false): void {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;

    if (error) {
      this.metrics.errors++;
    }
  }

  getMetrics() {
    const avgResponseTime = this.metrics.requests > 0
      ? this.metrics.totalResponseTime / this.metrics.requests
      : 0;

    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errors / this.metrics.requests) * 100
      : 0;

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  reset(): void {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
    };
  }
}

const logger = new ProductionLogger(process.env.LOG_LEVEL || "info");
const monitor = new PerformanceMonitor();

export {
  productionServer,
  config,
  buildScript,
  ProductionLogger,
  PerformanceMonitor,
  processManager,
  logger,
  monitor,
  handleRequest,
  checkReadiness,
  getMetrics,
};