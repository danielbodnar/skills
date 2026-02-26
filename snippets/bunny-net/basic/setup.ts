// Bunny.net Basic Setup and Configuration
// Basic API client setup for Bunny.net services

interface BunnyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

class BunnyClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: BunnyConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.bunny.net';
    this.timeout = config.timeout || 30000;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'AccessKey': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Bunny.net API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // CDN Zone management
  async listPullZones() {
    return this.request('/pullzone');
  }

  async createPullZone(name: string, originUrl: string) {
    return this.request('/pullzone', {
      method: 'POST',
      body: JSON.stringify({
        Name: name,
        OriginUrl: originUrl,
        Type: 0, // Standard pull zone
      }),
    });
  }

  // Storage Zone management
  async listStorageZones() {
    return this.request('/storagezone');
  }

  async createStorageZone(name: string, region: string = 'DE') {
    return this.request('/storagezone', {
      method: 'POST',
      body: JSON.stringify({
        Name: name,
        Region: region,
      }),
    });
  }

  // Stream management
  async listVideoLibraries() {
    return this.request('/videolibrary');
  }

  async createVideoLibrary(name: string) {
    return this.request('/videolibrary', {
      method: 'POST',
      body: JSON.stringify({
        Name: name,
      }),
    });
  }
}

// Environment-based configuration
export function createBunnyClient(): BunnyClient {
  const apiKey = process.env.BUNNY_API_KEY;
  if (!apiKey) {
    throw new Error('BUNNY_API_KEY environment variable is required');
  }

  return new BunnyClient({
    apiKey,
    timeout: 30000,
  });
}

// Example usage
export async function basicExample() {
  const client = createBunnyClient();
  
  try {
    // List existing pull zones
    const pullZones = await client.listPullZones();
    console.log('Pull zones:', pullZones);

    // Create a new pull zone
    const newZone = await client.createPullZone('my-cdn', 'https://example.com');
    console.log('Created pull zone:', newZone);

    // List storage zones
    const storageZones = await client.listStorageZones();
    console.log('Storage zones:', storageZones);

  } catch (error) {
    console.error('Bunny.net API error:', error);
  }
}