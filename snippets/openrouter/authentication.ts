/**
 * OpenRouter Authentication Examples
 * 
 * This file demonstrates various authentication methods for OpenRouter API,
 * including Bearer tokens, OAuth PKCE flow, and API key management.
 */

import OpenAI from 'openai';

// Basic Bearer token authentication
export const createAuthenticatedClient = (apiKey: string, options?: {
  siteUrl?: string;
  appName?: string;
}) => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': options?.siteUrl || process.env.SITE_URL,
      'X-Title': options?.appName || process.env.APP_NAME,
    },
  });
};

// Check API key validity and get account info
export const validateApiKey = async (apiKey: string) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API key validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      valid: true,
      keyInfo: data.data,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

// Get current account credits
export const getAccountCredits = async (apiKey: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get credits: ${response.statusText}`);
  }

  return await response.json();
};

// OAuth PKCE Flow Implementation
export class OpenRouterOAuth {
  private clientId: string;
  private redirectUri: string;

  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  // Generate code verifier and challenge for PKCE
  private async generatePKCE() {
    // Generate code verifier
    const codeVerifier = this.generateRandomString(128);
    
    // Generate code challenge
    const codeChallenge = await this.createSHA256CodeChallenge(codeVerifier);
    
    return { codeVerifier, codeChallenge };
  }

  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return result;
  }

  private async createSHA256CodeChallenge(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to base64url
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate OAuth authorization URL
  async generateAuthUrl(scopes: string[] = []) {
    const { codeVerifier, codeChallenge } = await this.generatePKCE();
    
    // Store code verifier for later use (in session storage, etc.)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('code_verifier', codeVerifier);
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      scope: scopes.join(' '),
    });

    return `https://openrouter.ai/auth?${params.toString()}`;
  }

  // Exchange authorization code for API key
  async exchangeCodeForApiKey(authorizationCode: string, codeVerifier?: string) {
    const storedCodeVerifier = codeVerifier || 
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('code_verifier') : null);

    if (!storedCodeVerifier) {
      throw new Error('Code verifier not found. Please start the OAuth flow again.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: authorizationCode,
        code_verifier: storedCodeVerifier,
        code_challenge_method: 'S256',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Clear stored code verifier
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('code_verifier');
    }

    return {
      apiKey: data.key,
      keyInfo: data.data,
    };
  }
}

// API Key Management
export class ApiKeyManager {
  private masterApiKey: string;

  constructor(masterApiKey: string) {
    this.masterApiKey = masterApiKey;
  }

  // Create a new API key
  async createApiKey(name: string, limit?: number) {
    const response = await fetch('https://openrouter.ai/api/v1/keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.masterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        ...(limit && { limit }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create API key: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  // List all API keys
  async listApiKeys() {
    const response = await fetch('https://openrouter.ai/api/v1/keys', {
      headers: {
        'Authorization': `Bearer ${this.masterApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list API keys: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get specific API key details
  async getApiKey() {
    const response = await fetch('https://openrouter.ai/api/v1/key', {
      headers: {
        'Authorization': `Bearer ${this.masterApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get API key details: ${response.statusText}`);
    }

    return await response.json();
  }

  // Delete an API key
  async deleteApiKey(keyId: string) {
    const response = await fetch(`https://openrouter.ai/api/v1/keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.masterApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete API key: ${response.statusText}`);
    }

    return response.status === 204;
  }
}

// Secure environment variable loading
export const loadApiKeyFromEnv = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  if (!apiKey.startsWith('sk-or-')) {
    console.warn('API key format might be incorrect. OpenRouter keys typically start with "sk-or-"');
  }

  return apiKey;
};

// Rate limiting aware client
export class RateLimitedClient {
  private client: OpenAI;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 300; // 300ms between requests (200 req/min)

  constructor(apiKey: string) {
    this.client = createAuthenticatedClient(apiKey);
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        );
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        }
        this.lastRequestTime = Date.now();
      }
    }

    this.processing = false;
  }

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  async chatCompletion(params: any) {
    return this.makeRequest(() => this.client.chat.completions.create(params));
  }
}

// Authentication middleware for Express.js
export const createAuthMiddleware = (apiKey: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const validation = await validateApiKey(apiKey);
      
      if (!validation.valid) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      req.openrouter = {
        keyInfo: validation.keyInfo,
        client: createAuthenticatedClient(apiKey),
      };

      next();
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
};

// Usage examples and testing
export const authExamples = {
  // Basic authentication test
  testBasicAuth: async () => {
    try {
      const apiKey = loadApiKeyFromEnv();
      const validation = await validateApiKey(apiKey);
      
      if (validation.valid) {
        console.log('✅ API key is valid');
        console.log('Key info:', validation.keyInfo);
        
        const credits = await getAccountCredits(apiKey);
        console.log('Account credits:', credits);
      } else {
        console.log('❌ API key is invalid:', validation.error);
      }
    } catch (error) {
      console.error('Authentication test failed:', error);
    }
  },

  // OAuth flow example
  testOAuthFlow: async () => {
    const oauth = new OpenRouterOAuth('your-client-id', 'http://localhost:3000/callback');
    
    try {
      // Generate auth URL
      const authUrl = await oauth.generateAuthUrl(['read', 'write']);
      console.log('Visit this URL to authorize:', authUrl);
      
      // After user authorizes and returns with code:
      // const { apiKey } = await oauth.exchangeCodeForApiKey(authorizationCode);
      // console.log('Generated API key:', apiKey);
    } catch (error) {
      console.error('OAuth flow failed:', error);
    }
  },

  // API key management example
  testApiKeyManagement: async () => {
    try {
      const apiKey = loadApiKeyFromEnv();
      const keyManager = new ApiKeyManager(apiKey);
      
      // Create a new limited API key
      const newKey = await keyManager.createApiKey('test-key', 100);
      console.log('Created new API key:', newKey);
      
      // List all keys
      const keys = await keyManager.listApiKeys();
      console.log('All API keys:', keys);
      
      // Get key details
      const keyDetails = await keyManager.getApiKey();
      console.log('Current key details:', keyDetails);
      
    } catch (error) {
      console.error('API key management test failed:', error);
    }
  },

  // Rate limiting test
  testRateLimiting: async () => {
    try {
      const apiKey = loadApiKeyFromEnv();
      const rateLimitedClient = new RateLimitedClient(apiKey);
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        rateLimitedClient.chatCompletion({
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Test message ${i + 1}` }],
          max_tokens: 10,
        })
      );

      console.log('Making 10 concurrent requests with rate limiting...');
      const results = await Promise.all(promises);
      console.log(`✅ All ${results.length} requests completed successfully`);
      
    } catch (error) {
      console.error('Rate limiting test failed:', error);
    }
  },
};

// Example usage
export const runAuthenticationExamples = async () => {
  console.log('=== OpenRouter Authentication Examples ===\n');
  
  await authExamples.testBasicAuth();
  console.log('\n---\n');
  
  await authExamples.testOAuthFlow();
  console.log('\n---\n');
  
  await authExamples.testApiKeyManagement();
  console.log('\n---\n');
  
  await authExamples.testRateLimiting();
};