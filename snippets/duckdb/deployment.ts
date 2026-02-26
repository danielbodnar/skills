// DuckDB Deployment and Production Configuration

import { DuckDBInstance } from '@duckdb/node-api';
import { cpus, totalmem } from 'node:os';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Production configuration builder
const createProductionConfig = (environment: 'development' | 'staging' | 'production') => {
  const totalMemoryGB = Math.floor(totalmem() / (1024 * 1024 * 1024));
  const cpuCount = cpus().length;
  
  const configs = {
    development: {
      threads: String(Math.min(4, cpuCount)),
      max_memory: '2GB',
      memory_limit: '2GB',
      checkpoint_threshold: '16MB',
      wal_autocheckpoint: '1000',
      temp_directory: './tmp/duckdb-dev',
      enable_object_cache: 'true',
      preserve_insertion_order: 'false'
    },
    
    staging: {
      threads: String(Math.min(8, cpuCount)),
      max_memory: `${Math.min(8, Math.floor(totalMemoryGB * 0.6))}GB`,
      memory_limit: `${Math.min(8, Math.floor(totalMemoryGB * 0.6))}GB`,
      checkpoint_threshold: '64MB',
      wal_autocheckpoint: '5000',
      temp_directory: '/tmp/duckdb-staging',
      enable_object_cache: 'true',
      preserve_insertion_order: 'false'
    },
    
    production: {
      threads: String(Math.max(1, Math.floor(cpuCount * 0.8))),
      max_memory: `${Math.floor(totalMemoryGB * 0.7)}GB`,
      memory_limit: `${Math.floor(totalMemoryGB * 0.7)}GB`,
      checkpoint_threshold: '256MB',
      wal_autocheckpoint: '10000',
      temp_directory: '/var/tmp/duckdb',
      enable_object_cache: 'true',
      preserve_insertion_order: 'false',
      enable_profiling: 'false',
      enable_progress_bar: 'false'
    }
  };
  
  return configs[environment];
};

// Database initialization for production
const initializeProductionDatabase = async (dbPath: string, environment: string) => {
  const config = createProductionConfig(environment as any);
  
  // Ensure directories exist
  await mkdir(config.temp_directory, { recursive: true });
  
  const instance = await DuckDBInstance.create(dbPath, config);
  const connection = await instance.connect();
  
  // Set up production-ready extensions
  const extensions = ['httpfs', 'json', 'parquet'];
  
  for (const ext of extensions) {
    try {
      await connection.run(`INSTALL ${ext}`);
      await connection.run(`LOAD ${ext}`);
      console.log(`Extension ${ext} loaded successfully`);
    } catch (error: any) {
      console.warn(`Failed to load extension ${ext}:`, error.message);
    }
  }
  
  // Create system tables for monitoring
  await connection.run(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      timestamp TIMESTAMP DEFAULT NOW(),
      metric_name VARCHAR,
      metric_value DOUBLE,
      instance_id VARCHAR
    )
  `);
  
  await connection.run(`
    CREATE TABLE IF NOT EXISTS query_performance (
      timestamp TIMESTAMP DEFAULT NOW(),
      query_hash VARCHAR,
      execution_time_ms BIGINT,
      rows_processed BIGINT,
      memory_used_mb DOUBLE,
      instance_id VARCHAR
    )
  `);
  
  return { instance, connection };
};

// Health check system
class DatabaseHealthCheck {
  private connection: any;
  private instanceId: string;
  
  constructor(connection: any, instanceId: string = 'default') {
    this.connection = connection;
    this.instanceId = instanceId;
  }
  
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: Record<string, number>;
  }> {
    const checks: Record<string, boolean> = {};
    const metrics: Record<string, number> = {};
    let healthyChecks = 0;
    const totalChecks = 4;
    
    try {
      // Check basic connectivity
      const startTime = performance.now();
      await this.connection.run('SELECT 1');
      const responseTime = performance.now() - startTime;
      checks.connectivity = true;
      metrics.responseTime = responseTime;
      healthyChecks++;
    } catch (error) {
      checks.connectivity = false;
      metrics.responseTime = -1;
    }
    
    try {
      // Check memory usage
      const memoryResult = await this.connection.runAndReadAll(`
        SELECT 
          database_size,
          memory_usage,
          memory_limit
        FROM duckdb_memory()
      `);
      const memoryData = memoryResult.getRows()[0];
      const memoryUsagePercent = (Number(memoryData[1]) / Number(memoryData[2])) * 100;
      
      checks.memoryUsage = memoryUsagePercent < 85; // Alert if > 85%
      metrics.memoryUsagePercent = memoryUsagePercent;
      if (checks.memoryUsage) healthyChecks++;
    } catch (error) {
      checks.memoryUsage = false;
      metrics.memoryUsagePercent = -1;
    }
    
    try {
      // Check query performance
      const perfStart = performance.now();
      await this.connection.runAndReadAll('SELECT COUNT(*) FROM range(10000)');
      const perfTime = performance.now() - perfStart;
      
      checks.queryPerformance = perfTime < 1000; // Alert if > 1 second
      metrics.queryPerformanceMs = perfTime;
      if (checks.queryPerformance) healthyChecks++;
    } catch (error) {
      checks.queryPerformance = false;
      metrics.queryPerformanceMs = -1;
    }
    
    try {
      // Check extensions
      const extensionsResult = await this.connection.runAndReadAll('SELECT * FROM duckdb_extensions()');
      const loadedExtensions = extensionsResult.getRows().filter(row => row[2] === true).length;
      
      checks.extensions = loadedExtensions >= 3; // Expect at least 3 extensions
      metrics.loadedExtensions = loadedExtensions;
      if (checks.extensions) healthyChecks++;
    } catch (error) {
      checks.extensions = false;
      metrics.loadedExtensions = -1;
    }
    
    // Record metrics
    await this.recordMetrics(metrics);
    
    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return { status, checks, metrics };
  }
  
  private async recordMetrics(metrics: Record<string, number>) {
    try {
      for (const [name, value] of Object.entries(metrics)) {
        await this.connection.run(`
          INSERT INTO system_metrics (metric_name, metric_value, instance_id)
          VALUES (?, ?, ?)
        `, [name, value, this.instanceId]);
      }
    } catch (error) {
      console.warn('Failed to record metrics:', error);
    }
  }
}

// Configuration management
class ConfigurationManager {
  private configPath: string;
  private currentConfig: any = {};
  
  constructor(configPath: string) {
    this.configPath = configPath;
  }
  
  async loadConfig(): Promise<any> {
    try {
      const configData = await readFile(this.configPath, 'utf-8');
      this.currentConfig = JSON.parse(configData);
      return this.currentConfig;
    } catch (error) {
      console.warn('Config file not found, using defaults');
      return this.getDefaultConfig();
    }
  }
  
  async saveConfig(config: any): Promise<void> {
    this.currentConfig = config;
    await writeFile(this.configPath, JSON.stringify(config, null, 2));
  }
  
  private getDefaultConfig() {
    return {
      database: {
        path: './data/production.db',
        environment: 'production'
      },
      monitoring: {
        healthCheckInterval: 30000,
        metricsRetention: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      backup: {
        enabled: true,
        interval: 6 * 60 * 60 * 1000, // 6 hours
        retentionCount: 10
      }
    };
  }
  
  getConfig(): any {
    return this.currentConfig;
  }
}

// Backup and restore system
class BackupManager {
  private connection: any;
  private backupDir: string;
  
  constructor(connection: any, backupDir: string = './backups') {
    this.connection = connection;
    this.backupDir = backupDir;
  }
  
  async createBackup(): Promise<string> {
    await mkdir(this.backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.backupDir, `backup-${timestamp}.db`);
    
    try {
      // Export database
      await this.connection.run(`EXPORT DATABASE '${backupPath}' (FORMAT PARQUET)`);
      
      console.log(`Backup created: ${backupPath}`);
      return backupPath;
    } catch (error: any) {
      console.error('Backup failed:', error.message);
      throw error;
    }
  }
  
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      await this.connection.run(`IMPORT DATABASE '${backupPath}'`);
      console.log(`Database restored from: ${backupPath}`);
    } catch (error: any) {
      console.error('Restore failed:', error.message);
      throw error;
    }
  }
  
  async cleanupOldBackups(retentionCount: number = 10): Promise<void> {
    // Implementation would list backup files and remove old ones
    console.log(`Cleaning up backups, keeping ${retentionCount} most recent`);
  }
}

// Production deployment orchestrator
class ProductionDeployment {
  private config: any;
  private database: any;
  private healthCheck: DatabaseHealthCheck;
  private backupManager: BackupManager;
  private configManager: ConfigurationManager;
  
  constructor(configPath: string = './config/production.json') {
    this.configManager = new ConfigurationManager(configPath);
  }
  
  async initialize(): Promise<void> {
    // Load configuration
    this.config = await this.configManager.loadConfig();
    
    console.log('Initializing production database...');
    const { instance, connection } = await initializeProductionDatabase(
      this.config.database.path,
      this.config.database.environment
    );
    
    this.database = { instance, connection };
    this.healthCheck = new DatabaseHealthCheck(connection);
    this.backupManager = new BackupManager(connection);
    
    // Setup monitoring
    this.startHealthMonitoring();
    
    // Setup backup schedule
    if (this.config.backup.enabled) {
      this.startBackupSchedule();
    }
    
    console.log('Production deployment initialized successfully');
  }
  
  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        const health = await this.healthCheck.performHealthCheck();
        
        if (health.status !== 'healthy') {
          console.warn('Health check warning:', health);
          // Could send alerts here
        }
        
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.config.monitoring.healthCheckInterval);
  }
  
  private startBackupSchedule(): void {
    setInterval(async () => {
      try {
        await this.backupManager.createBackup();
        await this.backupManager.cleanupOldBackups(this.config.backup.retentionCount);
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, this.config.backup.interval);
  }
  
  async gracefulShutdown(): Promise<void> {
    console.log('Initiating graceful shutdown...');
    
    try {
      // Create final backup
      if (this.config.backup.enabled) {
        await this.backupManager.createBackup();
      }
      
      // Close database connections
      await this.database.connection.close();
      await this.database.instance.close();
      
      console.log('Graceful shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
  
  getDatabase() {
    return this.database;
  }
  
  async getHealthStatus() {
    return await this.healthCheck.performHealthCheck();
  }
}

// Docker deployment configuration
const generateDockerConfig = () => {
  return {
    dockerfile: `
FROM oven/bun:1-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata

# Copy package files
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy application code
COPY . .

# Create data and backup directories
RUN mkdir -p /app/data /app/backups /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV DUCKDB_PATH=/app/data/production.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run health-check || exit 1

# Run as non-root user
USER 1000:1000

EXPOSE 3000
CMD ["bun", "start"]
    `,
    
    dockerCompose: `
version: '3.8'

services:
  duckdb-app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - DUCKDB_PATH=/app/data/production.db
    healthcheck:
      test: ["CMD", "bun", "run", "health-check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - duckdb-app
    `
  };
};

export {
  createProductionConfig,
  initializeProductionDatabase,
  DatabaseHealthCheck,
  ConfigurationManager,
  BackupManager,
  ProductionDeployment,
  generateDockerConfig
};