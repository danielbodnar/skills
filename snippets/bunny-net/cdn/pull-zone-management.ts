// Bunny.net CDN Pull Zone Management
// Complete CDN configuration and optimization

interface PullZone {
  Id: number;
  Name: string;
  OriginUrl: string;
  Enabled: boolean;
  Hostnames: Array<{ Id: number; Value: string; ForceSSL: boolean }>;
  StorageZoneId?: number;
  EnableGeoProtection: boolean;
  GeoBlockedCountries: string[];
  CacheControlMaxAge: number;
  BrowserCacheMaxAge: number;
  EnableSmartCache: boolean;
  EnableQueryStringOrdering: boolean;
  EnableWebP: boolean;
  EnableAvifOrAuto: boolean;
  EnableLogging: boolean;
  LoggingIPAnonymizationEnabled: boolean;
  ZoneSecurityEnabled: boolean;
  ZoneSecurityIncludeHashRemoteIP: boolean;
}

interface CacheTag {
  Tag: string;
}

class BunnyCDN {
  private apiKey: string;
  private baseUrl = 'https://api.bunny.net';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'AccessKey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`CDN API error: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  // Pull Zone Management
  async listPullZones(): Promise<PullZone[]> {
    return this.request('/pullzone');
  }

  async getPullZone(id: number): Promise<PullZone> {
    return this.request(`/pullzone/${id}`);
  }

  async createPullZone(config: {
    name: string;
    originUrl: string;
    type?: number; // 0 = Standard, 1 = High Volume, 2 = Volume
    storageZoneId?: number;
    enableSmartCache?: boolean;
    enableGeoProtection?: boolean;
    geoBlockedCountries?: string[];
  }): Promise<PullZone> {
    return this.request('/pullzone', {
      method: 'POST',
      body: JSON.stringify({
        Name: config.name,
        OriginUrl: config.originUrl,
        Type: config.type || 0,
        StorageZoneId: config.storageZoneId,
        EnableSmartCache: config.enableSmartCache || true,
        EnableGeoProtection: config.enableGeoProtection || false,
        GeoBlockedCountries: config.geoBlockedCountries || [],
      }),
    });
  }

  async updatePullZone(id: number, updates: Partial<PullZone>): Promise<PullZone> {
    return this.request(`/pullzone/${id}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async deletePullZone(id: number): Promise<void> {
    await this.request(`/pullzone/${id}`, { method: 'DELETE' });
  }

  // Hostname Management
  async addHostname(pullZoneId: number, hostname: string, forceSSL: boolean = true) {
    return this.request(`/pullzone/${pullZoneId}/addHostname`, {
      method: 'POST',
      body: JSON.stringify({
        Hostname: hostname,
        ForceSSL: forceSSL,
      }),
    });
  }

  async removeHostname(pullZoneId: number, hostname: string) {
    return this.request(`/pullzone/${pullZoneId}/removeHostname`, {
      method: 'DELETE',
      body: JSON.stringify({ Hostname: hostname }),
    });
  }

  async setForceSSL(pullZoneId: number, hostname: string, forceSSL: boolean) {
    return this.request(`/pullzone/${pullZoneId}/setForceSSL`, {
      method: 'POST',
      body: JSON.stringify({
        Hostname: hostname,
        ForceSSL: forceSSL,
      }),
    });
  }

  // Cache Management
  async purgeCache(pullZoneId: number): Promise<void> {
    await this.request(`/pullzone/${pullZoneId}/purgeCache`, { method: 'POST' });
  }

  async purgeCacheByUrl(pullZoneId: number, url: string): Promise<void> {
    await this.request(`/pullzone/${pullZoneId}/purgeCache`, {
      method: 'POST',
      body: JSON.stringify({ Url: url }),
    });
  }

  async purgeCacheByTag(pullZoneId: number, tag: string): Promise<void> {
    await this.request(`/pullzone/${pullZoneId}/purgeCache`, {
      method: 'POST',
      body: JSON.stringify({ CacheTag: tag }),
    });
  }

  // Edge Rules (Advanced Routing)
  async addEdgeRule(pullZoneId: number, rule: {
    guid: string;
    actionType: number;
    actionParameter1?: string;
    actionParameter2?: string;
    triggers: Array<{
      type: number;
      patternMatches: string[];
      patternMatchingType: number;
      parameter1?: string;
    }>;
    description?: string;
    enabled?: boolean;
  }) {
    return this.request(`/pullzone/${pullZoneId}/edgerules/addOrUpdate`, {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async deleteEdgeRule(pullZoneId: number, ruleGuid: string) {
    return this.request(`/pullzone/${pullZoneId}/edgerules/${ruleGuid}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getStatistics(pullZoneId: number, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    return this.request(`/pullzone/${pullZoneId}/statistics?${params}`);
  }

  // SSL Certificate Management
  async addFreeSSL(pullZoneId: number, hostname: string) {
    return this.request(`/pullzone/${pullZoneId}/addCertificate`, {
      method: 'POST',
      body: JSON.stringify({ Hostname: hostname }),
    });
  }

  async addCustomSSL(pullZoneId: number, hostname: string, certificate: string, certificateKey: string) {
    return this.request(`/pullzone/${pullZoneId}/addCertificate`, {
      method: 'POST',
      body: JSON.stringify({
        Hostname: hostname,
        Certificate: certificate,
        CertificateKey: certificateKey,
      }),
    });
  }

  // Security
  async enableZoneSecurity(pullZoneId: number, securityKey: string) {
    return this.updatePullZone(pullZoneId, {
      ZoneSecurityEnabled: true,
      ZoneSecurityKey: securityKey,
      ZoneSecurityIncludeHashRemoteIP: false,
    });
  }

  async setGeoBlocking(pullZoneId: number, countries: string[], blockType: 'allow' | 'block' = 'block') {
    return this.updatePullZone(pullZoneId, {
      EnableGeoProtection: true,
      GeoBlockedCountries: countries,
      GeoBlockedCountriesBlockType: blockType === 'block' ? 0 : 1,
    });
  }
}

// High-level CDN operations
class BunnyCDNManager extends BunnyCDN {
  // Complete website setup
  async setupWebsite(config: {
    name: string;
    domain: string;
    originUrl: string;
    enableSSL?: boolean;
    enableCompression?: boolean;
    cacheMaxAge?: number;
    geoBlockedCountries?: string[];
  }) {
    // Create pull zone
    const pullZone = await this.createPullZone({
      name: config.name,
      originUrl: config.originUrl,
      enableSmartCache: true,
      enableGeoProtection: config.geoBlockedCountries ? true : false,
      geoBlockedCountries: config.geoBlockedCountries,
    });

    // Add custom domain
    await this.addHostname(pullZone.Id, config.domain, config.enableSSL !== false);

    // Configure caching
    if (config.cacheMaxAge) {
      await this.updatePullZone(pullZone.Id, {
        CacheControlMaxAge: config.cacheMaxAge,
        BrowserCacheMaxAge: config.cacheMaxAge,
      });
    }

    // Enable optimizations
    await this.updatePullZone(pullZone.Id, {
      EnableWebP: true,
      EnableAvifOrAuto: true,
      EnableQueryStringOrdering: true,
      EnableLogging: true,
    });

    // Add free SSL if enabled
    if (config.enableSSL !== false) {
      try {
        await this.addFreeSSL(pullZone.Id, config.domain);
      } catch (error) {
        console.warn('SSL setup failed:', error);
      }
    }

    return pullZone;
  }

  // Performance optimization
  async optimizeForPerformance(pullZoneId: number) {
    await this.updatePullZone(pullZoneId, {
      EnableSmartCache: true,
      EnableWebP: true,
      EnableAvifOrAuto: true,
      EnableQueryStringOrdering: true,
      CacheControlMaxAge: 86400, // 24 hours
      BrowserCacheMaxAge: 86400,
    });

    // Add cache optimization edge rules
    await this.addEdgeRule(pullZoneId, {
      guid: crypto.randomUUID(),
      actionType: 2, // Set cache time
      actionParameter1: '31536000', // 1 year for static assets
      triggers: [{
        type: 0, // URL pattern
        patternMatches: ['*.css', '*.js', '*.jpg', '*.png', '*.gif', '*.ico', '*.woff2'],
        patternMatchingType: 0, // Match any
      }],
      description: 'Cache static assets for 1 year',
      enabled: true,
    });
  }

  // Security hardening
  async hardenSecurity(pullZoneId: number, securityKey?: string) {
    const updates: Partial<PullZone> = {
      EnableLogging: true,
      LoggingIPAnonymizationEnabled: true,
    };

    if (securityKey) {
      updates.ZoneSecurityEnabled = true;
      updates.ZoneSecurityKey = securityKey;
    }

    await this.updatePullZone(pullZoneId, updates);

    // Add security headers via edge rules
    await this.addEdgeRule(pullZoneId, {
      guid: crypto.randomUUID(),
      actionType: 4, // Add response header
      actionParameter1: 'X-Frame-Options',
      actionParameter2: 'DENY',
      triggers: [{
        type: 0,
        patternMatches: ['*'],
        patternMatchingType: 0,
      }],
      description: 'Add X-Frame-Options header',
      enabled: true,
    });
  }
}

// Usage examples
export async function cdnExamples() {
  const cdn = new BunnyCDNManager(process.env.BUNNY_API_KEY!);

  try {
    // Setup a complete website
    const website = await cdn.setupWebsite({
      name: 'my-website',
      domain: 'www.example.com',
      originUrl: 'https://origin.example.com',
      enableSSL: true,
      cacheMaxAge: 3600,
    });

    console.log('Website setup complete:', website);

    // Optimize for performance
    await cdn.optimizeForPerformance(website.Id);

    // Harden security
    await cdn.hardenSecurity(website.Id, 'secret-key-123');

    // Purge cache when deploying
    await cdn.purgeCache(website.Id);

    // Get statistics
    const stats = await cdn.getStatistics(website.Id);
    console.log('CDN Statistics:', stats);

  } catch (error) {
    console.error('CDN operation failed:', error);
  }
}