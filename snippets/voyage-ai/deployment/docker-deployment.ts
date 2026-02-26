// Docker and Deployment Configuration for Voyage AI
import { VoyageAIClient } from "voyageai";

// Health check endpoint
export async function healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
  try {
    const client = new VoyageAIClient({
      apiKey: process.env.VOYAGE_API_KEY!,
      timeout: 5000
    });
    
    // Test with a simple embedding
    await client.embed({
      input: "health check",
      model: "voyage-3.5-lite"
    });
    
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown"
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown"
    };
  }
}

// Service configuration
export interface ServiceConfig {
  port: number;
  host: string;
  voyageApiKey: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

export function loadConfig(): ServiceConfig {
  return {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    voyageApiKey: process.env.VOYAGE_API_KEY!,
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100')
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
      credentials: process.env.CORS_CREDENTIALS === 'true'
    }
  };
}

// Graceful shutdown handler
export class GracefulShutdown {
  private isShuttingDown = false;
  private server: any;
  
  constructor(server: any) {
    this.server = server;
    this.setupSignalHandlers();
  }
  
  private setupSignalHandlers() {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGUSR2', () => this.shutdown('SIGUSR2')); // Nodemon restart
  }
  
  private async shutdown(signal: string) {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    // Stop accepting new connections
    this.server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.log('Force closing server after timeout');
      process.exit(1);
    }, 30000);
  }
}

// Container orchestration helpers
export class ContainerOrchestration {
  static async waitForDependencies(dependencies: string[], timeout: number = 30000): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const results = await Promise.allSettled(
        dependencies.map(dep => this.checkDependency(dep))
      );
      
      if (results.every(result => result.status === 'fulfilled')) {
        console.log('All dependencies are ready');
        return;
      }
      
      console.log('Waiting for dependencies...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Timeout waiting for dependencies');
  }
  
  private static async checkDependency(dependency: string): Promise<void> {
    const [host, port] = dependency.split(':');
    
    return new Promise((resolve, reject) => {
      const socket = new (require('net').Socket)();
      
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Timeout connecting to ${dependency}`));
      });
      
      socket.on('error', (err: Error) => {
        socket.destroy();
        reject(err);
      });
      
      socket.connect(parseInt(port), host);
    });
  }
}

// Metrics collection
export class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private intervals: NodeJS.Timeout[] = [];
  
  constructor() {
    this.startCollection();
  }
  
  private startCollection() {
    // Memory usage
    const memoryInterval = setInterval(() => {
      const usage = process.memoryUsage();
      this.metrics.set('memory_heap_used', usage.heapUsed);
      this.metrics.set('memory_heap_total', usage.heapTotal);
      this.metrics.set('memory_rss', usage.rss);
    }, 5000);
    
    // CPU usage (simplified)
    let lastCpuUsage = process.cpuUsage();
    const cpuInterval = setInterval(() => {
      const currentUsage = process.cpuUsage(lastCpuUsage);
      const cpuPercent = (currentUsage.user + currentUsage.system) / 10000; // Convert to percentage
      this.metrics.set('cpu_usage_percent', cpuPercent);
      lastCpuUsage = process.cpuUsage();
    }, 5000);
    
    this.intervals.push(memoryInterval, cpuInterval);
  }
  
  recordRequest(endpoint: string, duration: number, success: boolean) {
    this.metrics.set(`request_${endpoint}_duration`, duration);
    this.metrics.set(`request_${endpoint}_success`, success ? 1 : 0);
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  
  cleanup() {
    this.intervals.forEach(interval => clearInterval(interval));
  }
}

// Logging configuration
export class Logger {
  private level: string;
  
  constructor(level: string = 'info') {
    this.level = level;
  }
  
  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.log(JSON.stringify({
        level: 'info',
        message,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  error(message: string, error?: Error) {
    if (this.shouldLog('error')) {
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

// Application bootstrap
export async function bootstrap() {
  const config = loadConfig();
  const logger = new Logger(config.logLevel);
  const metrics = new MetricsCollector();
  
  // Wait for dependencies
  const dependencies = process.env.DEPENDENCIES?.split(',') || [];
  if (dependencies.length > 0) {
    await ContainerOrchestration.waitForDependencies(dependencies);
  }
  
  // Initialize Voyage AI client
  const voyageClient = new VoyageAIClient({
    apiKey: config.voyageApiKey,
    timeout: 30000,
    maxRetries: 3
  });
  
  // Test connection
  try {
    await voyageClient.embed({
      input: "connection test",
      model: "voyage-3.5-lite"
    });
    logger.info('Voyage AI connection successful');
  } catch (error) {
    logger.error('Failed to connect to Voyage AI', error as Error);
    process.exit(1);
  }
  
  return {
    config,
    logger,
    metrics,
    voyageClient
  };
}

// Example Docker compose service
export const dockerComposeExample = `
version: '3.8'

services:
  voyage-ai-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - VOYAGE_API_KEY=\${VOYAGE_API_KEY}
      - LOG_LEVEL=info
      - RATE_LIMIT_WINDOW_MS=60000
      - RATE_LIMIT_MAX=100
      - CORS_ORIGIN=https://app.example.com
      - DEPENDENCIES=redis:6379,postgres:5432
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        max_attempts: 3
        window: 120s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=voyage_service
      - POSTGRES_USER=voyage
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
`;

// Kubernetes deployment example
export const kubernetesExample = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voyage-ai-service
  labels:
    app: voyage-ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: voyage-ai-service
  template:
    metadata:
      labels:
        app: voyage-ai-service
    spec:
      containers:
      - name: voyage-ai-service
        image: voyage-ai-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: VOYAGE_API_KEY
          valueFrom:
            secretKeyRef:
              name: voyage-secrets
              key: api-key
        - name: LOG_LEVEL
          value: "info"
        - name: PORT
          value: "3000"
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
      imagePullSecrets:
      - name: registry-secret
---
apiVersion: v1
kind: Service
metadata:
  name: voyage-ai-service
spec:
  selector:
    app: voyage-ai-service
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: Secret
metadata:
  name: voyage-secrets
type: Opaque
data:
  api-key: <base64-encoded-voyage-api-key>
`;