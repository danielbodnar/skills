// Security Best Practices for Voyage AI
import { VoyageAIClient } from "voyageai";
import { createHash, createHmac } from 'node:crypto';

// Secure client initialization
export function createSecureVoyageClient(options: {
  environment: 'development' | 'staging' | 'production';
  useProxy?: boolean;
  proxyUrl?: string;
  validateCertificates?: boolean;
}) {
  const { environment, useProxy = false, proxyUrl, validateCertificates = true } = options;
  
  // Get API key from environment variable
  const apiKey = process.env[`VOYAGE_API_KEY_${environment.toUpperCase()}`];
  
  if (!apiKey) {
    throw new Error(`VOYAGE_API_KEY_${environment.toUpperCase()} environment variable is required`);
  }
  
  // Validate API key format
  if (!apiKey.startsWith('pa-') || apiKey.length < 50) {
    throw new Error('Invalid API key format');
  }
  
  const clientConfig: any = {
    apiKey,
    timeout: 30000,
    maxRetries: 3
  };
  
  if (useProxy && proxyUrl) {
    clientConfig.baseURL = proxyUrl;
  }
  
  return new VoyageAIClient(clientConfig);
}

// Input sanitization
export function sanitizeInput(input: string | string[]): string | string[] {
  if (Array.isArray(input)) {
    return input.map(text => sanitizeText(text));
  }
  return sanitizeText(input);
}

function sanitizeText(text: string): string {
  // Remove potentially harmful characters
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim()
    .slice(0, 32000); // Limit length
}

// Request validation
export function validateEmbedRequest(request: any): boolean {
  if (!request.input || (!request.model)) {
    return false;
  }
  
  // Validate input length
  if (Array.isArray(request.input)) {
    if (request.input.length > 1000) {
      return false;
    }
    
    for (const text of request.input) {
      if (typeof text !== 'string' || text.length > 32000) {
        return false;
      }
    }
  } else {
    if (typeof request.input !== 'string' || request.input.length > 32000) {
      return false;
    }
  }
  
  // Validate model
  const validModels = [
    'voyage-3-large', 'voyage-3.5', 'voyage-3.5-lite',
    'voyage-code-3', 'voyage-finance-2', 'voyage-law-2'
  ];
  
  if (!validModels.includes(request.model)) {
    return false;
  }
  
  return true;
}

// Rate limiting with token bucket
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  
  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed * this.refillRate / 1000);
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Secure embedding service
export class SecureEmbeddingService {
  private client: VoyageAIClient;
  private rateLimiter: TokenBucket;
  private requestLog: Map<string, number[]> = new Map();
  
  constructor(client: VoyageAIClient, rateLimit: { tokens: number; refillRate: number }) {
    this.client = client;
    this.rateLimiter = new TokenBucket(rateLimit.tokens, rateLimit.refillRate);
  }
  
  async embed(request: any, clientId: string): Promise<any> {
    // Validate request
    if (!validateEmbedRequest(request)) {
      throw new Error('Invalid request format');
    }
    
    // Check rate limit
    const tokensNeeded = Array.isArray(request.input) ? request.input.length : 1;
    if (!this.rateLimiter.consume(tokensNeeded)) {
      throw new Error('Rate limit exceeded');
    }
    
    // Log request
    this.logRequest(clientId, tokensNeeded);
    
    // Sanitize input
    const sanitizedRequest = {
      ...request,
      input: sanitizeInput(request.input)
    };
    
    try {
      const result = await this.client.embed(sanitizedRequest);
      
      // Log success
      console.log(`Embedding request successful for client ${clientId}`);
      
      return result;
    } catch (error) {
      // Log error (without sensitive details)
      console.error(`Embedding request failed for client ${clientId}:`, error.message);
      throw error;
    }
  }
  
  private logRequest(clientId: string, tokens: number) {
    const now = Date.now();
    
    if (!this.requestLog.has(clientId)) {
      this.requestLog.set(clientId, []);
    }
    
    const log = this.requestLog.get(clientId)!;
    log.push(now);
    
    // Keep only last 100 requests
    if (log.length > 100) {
      log.shift();
    }
    
    // Clean up old entries (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentRequests = log.filter(timestamp => timestamp > oneHourAgo);
    this.requestLog.set(clientId, recentRequests);
  }
  
  getUsageStats(clientId: string): { requestCount: number; averageInterval: number } {
    const log = this.requestLog.get(clientId) || [];
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const recentRequests = log.filter(timestamp => timestamp > oneHourAgo);
    
    if (recentRequests.length < 2) {
      return { requestCount: recentRequests.length, averageInterval: 0 };
    }
    
    const intervals = [];
    for (let i = 1; i < recentRequests.length; i++) {
      intervals.push(recentRequests[i] - recentRequests[i - 1]);
    }
    
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    return { requestCount: recentRequests.length, averageInterval };
  }
}

// Content filtering
export class ContentFilter {
  private static readonly BLOCKED_PATTERNS = [
    /\b(password|secret|token|key)\s*[:=]\s*\S+/gi,
    /\b[A-Za-z0-9+/]{40,}={0,2}\b/g, // Base64 patterns
    /\b[0-9]{13,19}\b/g, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email addresses
  ];
  
  static filter(text: string): { filtered: string; blocked: boolean } {
    let filtered = text;
    let blocked = false;
    
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(filtered)) {
        blocked = true;
        filtered = filtered.replace(pattern, '[FILTERED]');
      }
    }
    
    return { filtered, blocked };
  }
  
  static isBlocked(text: string): boolean {
    return this.BLOCKED_PATTERNS.some(pattern => pattern.test(text));
  }
}

// Request signing for webhooks
export function signRequest(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = signRequest(payload, secret);
  return signature === expectedSignature;
}

// Environment variable validation
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required environment variables
  const requiredVars = [
    'VOYAGE_API_KEY_PRODUCTION',
    'VOYAGE_API_KEY_STAGING',
    'VOYAGE_API_KEY_DEVELOPMENT'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else if (!value.startsWith('pa-') || value.length < 50) {
      errors.push(`Invalid format for ${varName}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Usage example
export async function createSecureService() {
  // Validate environment
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    throw new Error(`Environment validation failed: ${envCheck.errors.join(', ')}`);
  }
  
  // Create secure client
  const client = createSecureVoyageClient({
    environment: 'production',
    validateCertificates: true
  });
  
  // Create secure service
  const service = new SecureEmbeddingService(client, {
    tokens: 1000,
    refillRate: 10 // 10 tokens per second
  });
  
  return service;
}