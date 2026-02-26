// Bunny.net Security and Authentication Patterns
// Secure API access, token management, and request validation

interface BunnyAuthConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
}

// Secure API client with built-in security features
class SecureBunnyClient {
  private apiKey: string;
  private timeout: number;
  private retries: number;
  private rateLimit: { requests: number; window: number };
  private requestTimes: number[] = [];

  constructor(config: BunnyAuthConfig) {
    this.apiKey = this.validateApiKey(config.apiKey);
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.rateLimit = config.rateLimit || { requests: 100, window: 60000 };
  }

  private validateApiKey(apiKey: string): string {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required and must be a string');
    }
    
    if (apiKey.length < 20) {
      throw new Error('API key appears to be invalid (too short)');
    }
    
    // Don't log or expose the actual API key
    console.log('API key validated successfully');
    return apiKey;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.rateLimit.window;
    
    // Remove old requests outside the window
    this.requestTimes = this.requestTimes.filter(time => time > windowStart);
    
    if (this.requestTimes.length >= this.rateLimit.requests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.rateLimit.window - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds`);
    }
    
    this.requestTimes.push(now);
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS for production
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
      }
      
      // Validate domain
      const allowedDomains = [
        'api.bunny.net',
        'video.bunnycdn.com',
        'storage.bunnycdn.com',
      ];
      
      if (!allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain))) {
        throw new Error(`Domain ${parsedUrl.hostname} is not allowed`);
      }
      
      return url;
    } catch (error) {
      throw new Error(`Invalid URL: ${error}`);
    }
  }

  private getSecureHeaders(additionalHeaders?: HeadersInit): HeadersInit {
    return {
      'AccessKey': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'SecureBunnyClient/1.0',
      'X-Request-ID': crypto.randomUUID(),
      'X-Timestamp': Date.now().toString(),
      ...additionalHeaders,
    };
  }

  private async secureRequest(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<Response> {
    await this.checkRateLimit();
    
    const sanitizedUrl = this.sanitizeUrl(url);
    const headers = this.getSecureHeaders(options.headers);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(sanitizedUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting from server
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        if (attempt <= this.retries) {
          console.warn(`Rate limited, retrying in ${waitTime}ms (attempt ${attempt}/${this.retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.secureRequest(url, options, attempt + 1);
        }
      }
      
      // Retry on server errors
      if (response.status >= 500 && attempt <= this.retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`Server error ${response.status}, retrying in ${waitTime}ms (attempt ${attempt}/${this.retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.secureRequest(url, options, attempt + 1);
      }
      
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      if (attempt <= this.retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Request failed, retrying in ${waitTime}ms (attempt ${attempt}/${this.retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.secureRequest(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  async secureApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `https://api.bunny.net${endpoint}`;
    const response = await this.secureRequest(url, options);
    
    if (!response.ok) {
      // Don't expose sensitive information in error messages
      const error = new Error(`API request failed: ${response.status}`);
      error.name = 'BunnyAPIError';
      throw error;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  }
}

// Token-based authentication for video libraries
class BunnyStreamAuth {
  private libraryId: number;
  private readOnlyApiKey: string;
  private fullApiKey: string;

  constructor(libraryId: number, readOnlyApiKey: string, fullApiKey?: string) {
    this.libraryId = libraryId;
    this.readOnlyApiKey = readOnlyApiKey;
    this.fullApiKey = fullApiKey || '';
  }

  // Generate signed URL for video access
  generateSignedUrl(
    videoId: string,
    expirationTime?: number,
    userIp?: string
  ): string {
    const expires = expirationTime || Math.floor(Date.now() / 1000) + 3600; // 1 hour default
    
    // Create signature base
    const signatureBase = `${this.libraryId}${videoId}${expires}${userIp || ''}`;
    
    // Generate signature (simplified - use proper HMAC in production)
    const signature = this.createSignature(signatureBase);
    
    const params = new URLSearchParams({
      expires: expires.toString(),
      signature,
    });
    
    if (userIp) {
      params.append('ip', userIp);
    }
    
    return `https://video.bunnycdn.com/play/${this.libraryId}/${videoId}?${params}`;
  }

  // Generate player token for authenticated playback
  generatePlayerToken(
    videoId: string,
    userId?: string,
    userIp?: string,
    expirationTime?: number
  ): string {
    const expires = expirationTime || Math.floor(Date.now() / 1000) + 3600;
    
    const tokenData = {
      lib: this.libraryId,
      vid: videoId,
      exp: expires,
      ...(userId && { uid: userId }),
      ...(userIp && { ip: userIp }),
    };
    
    // In production, use proper JWT signing
    return this.createJWT(tokenData);
  }

  private createSignature(data: string): string {
    // Simplified signature - use proper HMAC-SHA256 in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private createJWT(payload: any): string {
    // Simplified JWT - use proper library like 'jose' in production
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerEncoded = btoa(JSON.stringify(header));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = this.createSignature(`${headerEncoded}.${payloadEncoded}`);
    
    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  // Validate token on server side
  validateToken(token: string, expectedVideoId?: string): boolean {
    try {
      const [headerEncoded, payloadEncoded, signature] = token.split('.');
      const payload = JSON.parse(atob(payloadEncoded));
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }
      
      // Check library ID
      if (payload.lib !== this.libraryId) {
        return false;
      }
      
      // Check video ID if provided
      if (expectedVideoId && payload.vid !== expectedVideoId) {
        return false;
      }
      
      // Verify signature
      const expectedSignature = this.createSignature(`${headerEncoded}.${payloadEncoded}`);
      return signature === expectedSignature;
      
    } catch (error) {
      return false;
    }
  }
}

// Zone security for pull zones
class BunnyZoneSecurity {
  private securityKey: string;

  constructor(securityKey: string) {
    this.securityKey = securityKey;
  }

  // Generate security token for zone access
  generateSecurityToken(path: string, userIp?: string, expirationTime?: number): string {
    const expires = expirationTime || Math.floor(Date.now() / 1000) + 3600;
    
    // Create hash base
    const hashBase = `${this.securityKey}${path}${expires}${userIp || ''}`;
    
    // Generate MD5 hash (simplified - use crypto library in production)
    const authHash = this.generateMD5(hashBase);
    
    return `${authHash}-${expires}`;
  }

  // Generate secure URL with token
  generateSecureUrl(baseUrl: string, path: string, userIp?: string): string {
    const token = this.generateSecurityToken(path, userIp);
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    return `${baseUrl}${separator}token=${token}`;
  }

  private generateMD5(input: string): string {
    // Simplified hash - use proper crypto.createHash('md5') in production
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }
}

// Environment-based configuration with security validation
export class BunnySecurityManager {
  private client: SecureBunnyClient;
  private streamAuth?: BunnyStreamAuth;
  private zoneSecurity?: BunnyZoneSecurity;

  constructor() {
    this.validateEnvironment();
    
    this.client = new SecureBunnyClient({
      apiKey: this.getSecureApiKey(),
      timeout: 30000,
      retries: 3,
      rateLimit: { requests: 100, window: 60000 },
    });
  }

  private validateEnvironment(): void {
    const requiredVars = ['BUNNY_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Validate we're not in development with production keys
    if (process.env.NODE_ENV === 'development' && process.env.BUNNY_API_KEY?.startsWith('prod_')) {
      throw new Error('Production API key detected in development environment');
    }
  }

  private getSecureApiKey(): string {
    const apiKey = process.env.BUNNY_API_KEY;
    if (!apiKey) {
      throw new Error('BUNNY_API_KEY environment variable is required');
    }
    
    // Mask API key in logs
    const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
    console.log(`Using API key: ${maskedKey}`);
    
    return apiKey;
  }

  getSecureClient(): SecureBunnyClient {
    return this.client;
  }

  getStreamAuth(libraryId: number): BunnyStreamAuth {
    if (!this.streamAuth) {
      const readOnlyKey = process.env.BUNNY_VIDEO_READONLY_KEY;
      const fullKey = process.env.BUNNY_VIDEO_API_KEY;
      
      if (!readOnlyKey) {
        throw new Error('BUNNY_VIDEO_READONLY_KEY is required for stream authentication');
      }
      
      this.streamAuth = new BunnyStreamAuth(libraryId, readOnlyKey, fullKey);
    }
    
    return this.streamAuth;
  }

  getZoneSecurity(): BunnyZoneSecurity {
    if (!this.zoneSecurity) {
      const securityKey = process.env.BUNNY_ZONE_SECURITY_KEY;
      if (!securityKey) {
        throw new Error('BUNNY_ZONE_SECURITY_KEY is required for zone security');
      }
      
      this.zoneSecurity = new BunnyZoneSecurity(securityKey);
    }
    
    return this.zoneSecurity;
  }
}

// Usage examples
export async function securityExamples() {
  const securityManager = new BunnySecurityManager();
  
  try {
    // Secure API operations
    const client = securityManager.getSecureClient();
    const pullZones = await client.secureApiCall('/pullzone');
    console.log('Retrieved pull zones securely');
    
    // Stream authentication
    const streamAuth = securityManager.getStreamAuth(12345);
    const signedUrl = streamAuth.generateSignedUrl('video-guid', undefined, '192.168.1.1');
    console.log('Generated signed video URL');
    
    const playerToken = streamAuth.generatePlayerToken('video-guid', 'user-123');
    console.log('Generated player token');
    
    // Zone security
    const zoneSecurity = securityManager.getZoneSecurity();
    const secureUrl = zoneSecurity.generateSecureUrl(
      'https://example.b-cdn.net/file.jpg',
      '/file.jpg',
      '192.168.1.1'
    );
    console.log('Generated secure zone URL');
    
  } catch (error) {
    console.error('Security operation failed:', error);
  }
}