// DuckDB Security Best Practices

import { DuckDBInstance } from '@duckdb/node-api';
import { createHash, randomBytes } from 'node:crypto';

// Secure connection configuration
const createSecureInstance = async (dbPath: string, userRole: 'admin' | 'read' | 'write' = 'read') => {
  const secureConfig = {
    access_mode: userRole === 'read' ? 'READ_ONLY' : 'READ_WRITE',
    allow_unsigned_extensions: 'false', // Disable unsigned extensions
    enable_external_access: 'false',    // Disable external file access
    enable_object_cache: 'true',
    threads: '4',
    max_memory: '1GB'
  };

  // Additional restrictions for non-admin users
  if (userRole !== 'admin') {
    secureConfig.allow_unsigned_extensions = 'false';
    secureConfig.enable_external_access = 'false';
  }

  return await DuckDBInstance.create(dbPath, secureConfig);
};

// SQL injection prevention
const sanitizeInput = (input: string): string => {
  // Remove or escape potentially dangerous characters
  return input
    .replace(/[';--]/g, '') // Remove SQL comment and statement terminators
    .replace(/\s+(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\s+/gi, '') // Remove dangerous keywords
    .trim();
};

// Parameterized query builder
class SecureQueryBuilder {
  private query: string = '';
  private parameters: any[] = [];

  select(columns: string[]): this {
    // Validate column names (only alphanumeric and underscore)
    const validColumns = columns.filter(col => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col));
    this.query = `SELECT ${validColumns.join(', ')}`;
    return this;
  }

  from(table: string): this {
    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error('Invalid table name');
    }
    this.query += ` FROM ${table}`;
    return this;
  }

  where(condition: string, value: any): this {
    // Use parameterized queries
    this.parameters.push(value);
    this.query += ` WHERE ${condition} = $${this.parameters.length}`;
    return this;
  }

  and(condition: string, value: any): this {
    this.parameters.push(value);
    this.query += ` AND ${condition} = $${this.parameters.length}`;
    return this;
  }

  limit(count: number): this {
    if (!Number.isInteger(count) || count < 0 || count > 10000) {
      throw new Error('Invalid limit value');
    }
    this.query += ` LIMIT ${count}`;
    return this;
  }

  build(): { sql: string; params: any[] } {
    return { sql: this.query, params: this.parameters };
  }
}

// Input validation
const validateUserInput = (input: any, type: 'string' | 'number' | 'email' | 'date'): boolean => {
  switch (type) {
    case 'string':
      return typeof input === 'string' && input.length <= 1000 && !/[<>'"&]/.test(input);
    
    case 'number':
      return typeof input === 'number' && Number.isFinite(input);
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof input === 'string' && emailRegex.test(input) && input.length <= 255;
    
    case 'date':
      return input instanceof Date && !isNaN(input.getTime());
    
    default:
      return false;
  }
};

// Access control
class DatabaseAccessControl {
  private permissions: Map<string, Set<string>> = new Map();

  grantPermission(userId: string, permission: string): void {
    if (!this.permissions.has(userId)) {
      this.permissions.set(userId, new Set());
    }
    this.permissions.get(userId)!.add(permission);
  }

  revokePermission(userId: string, permission: string): void {
    const userPerms = this.permissions.get(userId);
    if (userPerms) {
      userPerms.delete(permission);
    }
  }

  hasPermission(userId: string, permission: string): boolean {
    const userPerms = this.permissions.get(userId);
    return userPerms ? userPerms.has(permission) : false;
  }

  async executeWithPermissionCheck(
    userId: string, 
    permission: string, 
    connection: any, 
    query: string, 
    params?: any[]
  ) {
    if (!this.hasPermission(userId, permission)) {
      throw new Error(`Access denied: User ${userId} lacks permission ${permission}`);
    }

    return await connection.runAndReadAll(query, params);
  }
}

// Audit logging
class SecurityAuditLogger {
  private logs: Array<{
    timestamp: Date;
    userId: string;
    action: string;
    query?: string;
    success: boolean;
    ipAddress?: string;
  }> = [];

  logQuery(userId: string, query: string, success: boolean, ipAddress?: string): void {
    this.logs.push({
      timestamp: new Date(),
      userId,
      action: 'QUERY',
      query: this.sanitizeQueryForLog(query),
      success,
      ipAddress
    });

    // Keep only recent logs (e.g., last 10000)
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }
  }

  logConnection(userId: string, success: boolean, ipAddress?: string): void {
    this.logs.push({
      timestamp: new Date(),
      userId,
      action: 'CONNECTION',
      success,
      ipAddress
    });
  }

  private sanitizeQueryForLog(query: string): string {
    // Remove sensitive data from query logs
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .substring(0, 500); // Limit length
  }

  getRecentFailures(minutes: number = 30): typeof this.logs {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => 
      log.timestamp >= cutoff && !log.success
    );
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Rate limiting
class QueryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkRateLimit(userId: string, maxRequests: number = 100, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return true;
  }

  getRemainingRequests(userId: string, maxRequests: number = 100, windowMs: number = 60000): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    return Math.max(0, maxRequests - validRequests.length);
  }
}

// Secure session management
class SecureSession {
  private sessions: Map<string, {
    userId: string;
    created: Date;
    lastAccess: Date;
    ipAddress: string;
  }> = new Map();

  createSession(userId: string, ipAddress: string): string {
    const sessionId = randomBytes(32).toString('hex');
    const session = {
      userId,
      created: new Date(),
      lastAccess: new Date(),
      ipAddress
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  validateSession(sessionId: string, ipAddress: string): string | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null; // Session not found
    }

    // Check IP address consistency
    if (session.ipAddress !== ipAddress) {
      this.sessions.delete(sessionId);
      return null; // IP mismatch
    }

    // Check session expiry (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - session.created.getTime() > maxAge) {
      this.sessions.delete(sessionId);
      return null; // Session expired
    }

    // Update last access
    session.lastAccess = new Date();
    return session.userId;
  }

  revokeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): void {
    const maxAge = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.created.getTime() > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Secure database wrapper
class SecureDuckDB {
  private accessControl = new DatabaseAccessControl();
  private auditLogger = new SecurityAuditLogger();
  private rateLimiter = new QueryRateLimiter();
  private sessionManager = new SecureSession();
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
  }

  async secureQuery(
    sessionId: string,
    ipAddress: string,
    query: string,
    params?: any[],
    requiredPermission: string = 'read'
  ) {
    try {
      // Validate session
      const userId = this.sessionManager.validateSession(sessionId, ipAddress);
      if (!userId) {
        throw new Error('Invalid or expired session');
      }

      // Check rate limit
      const rateLimitOk = await this.rateLimiter.checkRateLimit(userId);
      if (!rateLimitOk) {
        throw new Error('Rate limit exceeded');
      }

      // Check permissions
      if (!this.accessControl.hasPermission(userId, requiredPermission)) {
        throw new Error(`Insufficient permissions: ${requiredPermission}`);
      }

      // Execute query
      const result = await this.connection.runAndReadAll(query, params);
      
      // Log successful query
      this.auditLogger.logQuery(userId, query, true, ipAddress);
      
      return result;
      
    } catch (error: any) {
      // Log failed query
      const userId = this.sessionManager.validateSession(sessionId, ipAddress) || 'unknown';
      this.auditLogger.logQuery(userId, query, false, ipAddress);
      throw error;
    }
  }

  // Grant user permissions
  grantUserPermission(userId: string, permission: string): void {
    this.accessControl.grantPermission(userId, permission);
  }

  // Create secure session
  login(userId: string, ipAddress: string): string {
    const sessionId = this.sessionManager.createSession(userId, ipAddress);
    this.auditLogger.logConnection(userId, true, ipAddress);
    return sessionId;
  }

  // Revoke session
  logout(sessionId: string): void {
    this.sessionManager.revokeSession(sessionId);
  }

  // Get security metrics
  getSecurityMetrics() {
    return {
      recentFailures: this.auditLogger.getRecentFailures(),
      activeSessions: this.sessionManager.sessions?.size || 0
    };
  }
}

// Usage example
const secureUsageExample = async () => {
  // Create secure instance
  const instance = await createSecureInstance('secure.db', 'read');
  const connection = await instance.connect();
  
  // Wrap with security layer
  const secureDB = new SecureDuckDB(connection);
  
  // Grant permissions
  secureDB.grantUserPermission('user123', 'read');
  secureDB.grantUserPermission('admin456', 'write');
  
  // Login user
  const sessionId = secureDB.login('user123', '192.168.1.100');
  
  try {
    // Build secure query
    const queryBuilder = new SecureQueryBuilder()
      .select(['id', 'name', 'email'])
      .from('users')
      .where('active', true)
      .limit(100);
    
    const { sql, params } = queryBuilder.build();
    
    // Execute secure query
    const result = await secureDB.secureQuery(
      sessionId,
      '192.168.1.100',
      sql,
      params,
      'read'
    );
    
    console.log('Secure query result:', result.getRows());
    
  } catch (error: any) {
    console.error('Security error:', error.message);
  } finally {
    // Logout
    secureDB.logout(sessionId);
    await connection.close();
    await instance.close();
  }
};

export {
  createSecureInstance,
  sanitizeInput,
  SecureQueryBuilder,
  validateUserInput,
  DatabaseAccessControl,
  SecurityAuditLogger,
  QueryRateLimiter,
  SecureSession,
  SecureDuckDB,
  secureUsageExample
};