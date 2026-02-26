// DuckDB Error Handling Patterns

import { DuckDBInstance } from '@duckdb/node-api';

// Custom error types
class DuckDBConnectionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DuckDBConnectionError';
  }
}

class DuckDBQueryError extends Error {
  constructor(message: string, public query?: string, public cause?: Error) {
    super(message);
    this.name = 'DuckDBQueryError';
  }
}

// Connection error handling
const safeConnect = async (dbPath: string, config?: any) => {
  try {
    const instance = await DuckDBInstance.create(dbPath, config);
    const connection = await instance.connect();
    return { instance, connection, error: null };
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    return { 
      instance: null, 
      connection: null, 
      error: new DuckDBConnectionError('Failed to connect to database', error) 
    };
  }
};

// Query error handling with retry logic
const executeWithRetry = async (
  connection: any, 
  sql: string, 
  params?: any[], 
  maxRetries: number = 3
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await connection.runAndReadAll(sql, params);
      return { result, error: null };
    } catch (error: any) {
      console.warn(`Query attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        return { 
          result: null, 
          error: new DuckDBQueryError('Query failed after retries', sql, error) 
        };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Transaction error handling
const safeTransaction = async (connection: any, operations: (() => Promise<void>)[]) => {
  try {
    await connection.run('BEGIN TRANSACTION');
    
    for (const operation of operations) {
      await operation();
    }
    
    await connection.run('COMMIT');
    return { success: true, error: null };
  } catch (error: any) {
    try {
      await connection.run('ROLLBACK');
      console.log('Transaction rolled back successfully');
    } catch (rollbackError: any) {
      console.error('Rollback failed:', rollbackError.message);
    }
    
    return { 
      success: false, 
      error: new DuckDBQueryError('Transaction failed', undefined, error) 
    };
  }
};

// Parameter validation
const validateParams = (params: any[]): string[] => {
  const errors: string[] = [];
  
  params.forEach((param, index) => {
    if (param === undefined) {
      errors.push(`Parameter ${index + 1} is undefined`);
    }
    
    if (typeof param === 'object' && param !== null && !Array.isArray(param)) {
      if (!param.constructor || param.constructor.name === 'Object') {
        errors.push(`Parameter ${index + 1} is a plain object, consider using structValue()`);
      }
    }
  });
  
  return errors;
};

// Safe query execution with validation
const safeQuery = async (connection: any, sql: string, params?: any[]) => {
  try {
    // Validate parameters
    if (params) {
      const paramErrors = validateParams(params);
      if (paramErrors.length > 0) {
        throw new Error(`Parameter validation failed: ${paramErrors.join(', ')}`);
      }
    }
    
    // Validate SQL (basic checks)
    const trimmedSQL = sql.trim().toLowerCase();
    if (trimmedSQL.startsWith('drop') || trimmedSQL.startsWith('delete')) {
      console.warn('Potentially destructive operation detected:', sql);
    }
    
    const result = await connection.runAndReadAll(sql, params);
    return { result, error: null };
  } catch (error: any) {
    console.error('Query execution failed:', {
      sql,
      params,
      error: error.message
    });
    
    return { 
      result: null, 
      error: new DuckDBQueryError(error.message, sql, error) 
    };
  }
};

// Connection pool with error handling
class DuckDBPool {
  private connections: any[] = [];
  private config: any;
  private dbPath: string;
  private maxConnections: number;

  constructor(dbPath: string, config: any = {}, maxConnections: number = 5) {
    this.dbPath = dbPath;
    this.config = config;
    this.maxConnections = maxConnections;
  }

  async getConnection() {
    if (this.connections.length > 0) {
      return this.connections.pop();
    }

    if (this.connections.length < this.maxConnections) {
      const { instance, connection, error } = await safeConnect(this.dbPath, this.config);
      
      if (error) {
        throw error;
      }

      return { instance, connection };
    }

    throw new Error('Connection pool exhausted');
  }

  async releaseConnection(connectionInfo: any) {
    if (this.connections.length < this.maxConnections) {
      this.connections.push(connectionInfo);
    } else {
      // Close excess connections
      try {
        await connectionInfo.connection.close();
        await connectionInfo.instance.close();
      } catch (error) {
        console.warn('Failed to close connection:', error);
      }
    }
  }

  async closeAll() {
    const closePromises = this.connections.map(async ({ connection, instance }) => {
      try {
        await connection.close();
        await instance.close();
      } catch (error) {
        console.warn('Failed to close connection in pool:', error);
      }
    });

    await Promise.allSettled(closePromises);
    this.connections = [];
  }
}

// Memory monitoring and cleanup
const withMemoryMonitoring = async (operation: () => Promise<any>) => {
  const initialMemory = process.memoryUsage();
  console.log('Initial memory usage:', initialMemory);

  try {
    const result = await operation();
    
    const finalMemory = process.memoryUsage();
    console.log('Final memory usage:', finalMemory);
    console.log('Memory delta:', {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      rss: finalMemory.rss - initialMemory.rss
    });

    return result;
  } catch (error) {
    console.error('Operation failed, checking memory:', process.memoryUsage());
    throw error;
  }
};

// Graceful shutdown handler
const createShutdownHandler = (connections: any[]) => {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    const closePromises = connections.map(async ({ connection, instance }) => {
      try {
        await connection.close();
        await instance.close();
        console.log('Connection closed successfully');
      } catch (error: any) {
        console.error('Error closing connection:', error.message);
      }
    });

    await Promise.allSettled(closePromises);
    console.log('All connections closed');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

// Usage example
const robustDatabaseOperations = async () => {
  const pool = new DuckDBPool('robust.db', { threads: '4' });
  const connections: any[] = [];

  try {
    // Get connection from pool
    const connInfo = await pool.getConnection();
    connections.push(connInfo);

    // Setup shutdown handler
    createShutdownHandler(connections);

    // Safe transaction
    const { success, error } = await safeTransaction(connInfo.connection, [
      async () => {
        await connInfo.connection.run('CREATE TABLE IF NOT EXISTS test (id INTEGER, data VARCHAR)');
      },
      async () => {
        await connInfo.connection.run('INSERT INTO test VALUES (1, "test data")');
      }
    ]);

    if (!success) {
      console.error('Transaction failed:', error);
    }

    // Safe query
    const { result, error: queryError } = await safeQuery(
      connInfo.connection,
      'SELECT * FROM test WHERE id = $1',
      [1]
    );

    if (queryError) {
      console.error('Query failed:', queryError);
    } else {
      console.log('Query result:', result?.getRows());
    }

    // Release connection back to pool
    await pool.releaseConnection(connInfo);

  } catch (error: any) {
    console.error('Database operations failed:', error.message);
  } finally {
    await pool.closeAll();
  }
};

export {
  DuckDBConnectionError,
  DuckDBQueryError,
  safeConnect,
  executeWithRetry,
  safeTransaction,
  validateParams,
  safeQuery,
  DuckDBPool,
  withMemoryMonitoring,
  createShutdownHandler,
  robustDatabaseOperations
};