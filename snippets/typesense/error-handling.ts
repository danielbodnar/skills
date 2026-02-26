// Typesense Error Handling and Retry Logic

import Typesense from 'typesense';

// Custom error types
class TypesenseCustomError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly operation?: string,
    public readonly collection?: string
  ) {
    super(message);
    this.name = 'TypesenseCustomError';
  }
}

class RetryableError extends TypesenseCustomError {
  constructor(message: string, originalError?: any, operation?: string) {
    super(message, originalError, operation);
    this.name = 'RetryableError';
  }
}

class NonRetryableError extends TypesenseCustomError {
  constructor(message: string, originalError?: any, operation?: string) {
    super(message, originalError, operation);
    this.name = 'NonRetryableError';
  }
}

// Error classification utility
class ErrorClassifier {
  static isRetryable(error: any): boolean {
    // Network errors are retryable
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return true;
    }

    // HTTP status codes that are retryable
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    if (error.httpStatus && retryableStatusCodes.includes(error.httpStatus)) {
      return true;
    }

    // Timeout errors are retryable
    if (error.message && error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  static classify(error: any, operation?: string, collection?: string): TypesenseCustomError {
    const message = error.message || 'Unknown error';
    
    if (this.isRetryable(error)) {
      return new RetryableError(message, error, operation);
    }

    // Check for specific error types
    if (error.httpStatus === 400) {
      return new NonRetryableError(`Bad request: ${message}`, error, operation);
    }
    
    if (error.httpStatus === 401) {
      return new NonRetryableError(`Unauthorized: Check your API key`, error, operation);
    }
    
    if (error.httpStatus === 404) {
      return new NonRetryableError(`Not found: ${collection || 'Resource'} does not exist`, error, operation);
    }
    
    if (error.httpStatus === 409) {
      return new NonRetryableError(`Conflict: ${collection || 'Resource'} already exists`, error, operation);
    }
    
    if (error.httpStatus === 422) {
      return new NonRetryableError(`Unprocessable entity: ${message}`, error, operation);
    }

    return new NonRetryableError(message, error, operation);
  }
}

// Retry utility with exponential backoff
class RetryManager {
  constructor(
    private maxRetries = 3,
    private baseDelay = 1000,
    private maxDelay = 10000,
    private backoffFactor = 2
  ) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName = 'operation'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const classifiedError = ErrorClassifier.classify(error, operationName);
        
        // Don't retry non-retryable errors
        if (classifiedError instanceof NonRetryableError) {
          throw classifiedError;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          throw classifiedError;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(this.backoffFactor, attempt),
          this.maxDelay
        );
        
        console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} for ${operationName} in ${delay}ms`);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName = 'operation'): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new NonRetryableError(`Circuit breaker is OPEN for ${operationName}`);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Resilient Typesense client wrapper
class ResilientTypesenseClient {
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreaker;

  constructor(
    private client: Typesense.Client,
    retryOptions: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
    } = {},
    circuitBreakerOptions: {
      failureThreshold?: number;
      recoveryTimeout?: number;
    } = {}
  ) {
    this.retryManager = new RetryManager(
      retryOptions.maxRetries,
      retryOptions.baseDelay,
      retryOptions.maxDelay,
      retryOptions.backoffFactor
    );
    
    this.circuitBreaker = new CircuitBreaker(
      circuitBreakerOptions.failureThreshold,
      circuitBreakerOptions.recoveryTimeout
    );
  }

  // Resilient search
  async search(collectionName: string, searchParams: any) {
    return this.circuitBreaker.execute(
      () => this.retryManager.executeWithRetry(
        () => this.client.collections(collectionName).documents().search(searchParams),
        `search-${collectionName}`
      ),
      `search-${collectionName}`
    );
  }

  // Resilient document creation
  async createDocument(collectionName: string, document: any) {
    return this.circuitBreaker.execute(
      () => this.retryManager.executeWithRetry(
        () => this.client.collections(collectionName).documents().create(document),
        `create-document-${collectionName}`
      ),
      `create-document-${collectionName}`
    );
  }

  // Resilient document update
  async updateDocument(collectionName: string, id: string, updates: any) {
    return this.circuitBreaker.execute(
      () => this.retryManager.executeWithRetry(
        () => this.client.collections(collectionName).documents(id).update(updates),
        `update-document-${collectionName}-${id}`
      ),
      `update-document-${collectionName}-${id}`
    );
  }

  // Resilient collection creation
  async createCollection(schema: any) {
    return this.circuitBreaker.execute(
      () => this.retryManager.executeWithRetry(
        () => this.client.collections().create(schema),
        `create-collection-${schema.name}`
      ),
      `create-collection-${schema.name}`
    );
  }

  // Health check with timeout
  async healthCheck(timeout = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      await this.client.health.retrieve();
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get circuit breaker status
  getStatus() {
    return {
      circuitBreaker: this.circuitBreaker.getState(),
      isHealthy: this.healthCheck()
    };
  }
}

// Error monitoring and logging
class ErrorMonitor {
  private errorCounts: Map<string, number> = new Map();
  private errorHistory: Array<{
    timestamp: number;
    error: string;
    operation: string;
    collection?: string;
  }> = [];

  logError(error: any, operation: string, collection?: string) {
    const errorKey = `${operation}-${error.httpStatus || error.code || 'unknown'}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    this.errorHistory.push({
      timestamp: Date.now(),
      error: error.message || String(error),
      operation,
      collection
    });

    // Keep only last 1000 errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }

    // Log to console (replace with your logging system)
    console.error(`Typesense Error [${operation}${collection ? ` on ${collection}` : ''}]:`, error);
  }

  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => e.timestamp > oneHourAgo);

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      mostCommonErrors: Array.from(this.errorCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    };
  }

  clearStats() {
    this.errorCounts.clear();
    this.errorHistory = [];
  }
}

// Example usage
async function errorHandlingExamples() {
  const client = new Typesense.Client({
    nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
    apiKey: 'your-api-key',
    connectionTimeoutSeconds: 2
  });

  // Create resilient client
  const resilientClient = new ResilientTypesenseClient(
    client,
    { maxRetries: 3, baseDelay: 1000 },
    { failureThreshold: 5, recoveryTimeout: 60000 }
  );

  // Error monitor
  const errorMonitor = new ErrorMonitor();

  try {
    // This will automatically retry on transient errors
    const results = await resilientClient.search('products', {
      q: 'test',
      query_by: 'title'
    });
    console.log('Search successful:', results.found);
  } catch (error) {
    errorMonitor.logError(error, 'search', 'products');
    
    if (error instanceof NonRetryableError) {
      console.error('Non-retryable error occurred:', error.message);
    } else {
      console.error('All retries exhausted:', error.message);
    }
  }

  // Check status
  const status = await resilientClient.getStatus();
  console.log('Client status:', status);

  // Get error statistics
  const errorStats = errorMonitor.getErrorStats();
  console.log('Error statistics:', errorStats);
}

export {
  TypesenseCustomError,
  RetryableError,
  NonRetryableError,
  ErrorClassifier,
  RetryManager,
  CircuitBreaker,
  ResilientTypesenseClient,
  ErrorMonitor,
  errorHandlingExamples
};