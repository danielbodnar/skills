import puppeteer, { type Page, type HTTPRequest, type HTTPResponse } from 'puppeteer';

export class NetworkInterceptor {
  private page: Page;
  private interceptedRequests: HTTPRequest[] = [];
  private blockedUrls: Set<string> = new Set();
  private responseOverrides: Map<string, any> = new Map();
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async enableInterception(): Promise<void> {
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      this.handleRequest(request);
    });
    
    this.page.on('response', (response) => {
      this.handleResponse(response);
    });
  }
  
  private handleRequest(request: HTTPRequest): void {
    this.interceptedRequests.push(request);
    
    const url = request.url();
    
    // Check if URL should be blocked
    if (this.shouldBlockUrl(url)) {
      console.log(`Blocking request: ${url}`);
      request.abort();
      return;
    }
    
    // Check for response overrides
    if (this.responseOverrides.has(url)) {
      const override = this.responseOverrides.get(url);
      console.log(`Overriding response for: ${url}`);
      request.respond(override);
      return;
    }
    
    // Continue with the request
    request.continue();
  }
  
  private handleResponse(response: HTTPResponse): void {
    console.log(`Response: ${response.status()} ${response.url()}`);
  }
  
  private shouldBlockUrl(url: string): boolean {
    // Check exact URL matches
    if (this.blockedUrls.has(url)) {
      return true;
    }
    
    // Check URL patterns
    for (const blockedUrl of this.blockedUrls) {
      if (blockedUrl.includes('*') && this.matchesPattern(url, blockedUrl)) {
        return true;
      }
    }
    
    return false;
  }
  
  private matchesPattern(url: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }
  
  // Block specific URLs
  blockUrl(url: string): void {
    this.blockedUrls.add(url);
  }
  
  // Block URL patterns (with wildcards)
  blockUrlPattern(pattern: string): void {
    this.blockedUrls.add(pattern);
  }
  
  // Override response for specific URL
  overrideResponse(url: string, response: {
    status?: number;
    headers?: Record<string, string>;
    body?: string;
    contentType?: string;
  }): void {
    this.responseOverrides.set(url, {
      status: response.status || 200,
      headers: response.headers || {},
      body: response.body || '',
      contentType: response.contentType || 'text/html'
    });
  }
  
  // Get intercepted requests
  getInterceptedRequests(): HTTPRequest[] {
    return [...this.interceptedRequests];
  }
  
  // Clear intercepted requests
  clearInterceptedRequests(): void {
    this.interceptedRequests = [];
  }
  
  // Filter requests by type
  getRequestsByType(resourceType: string): HTTPRequest[] {
    return this.interceptedRequests.filter(req => req.resourceType() === resourceType);
  }
  
  // Get failed requests
  getFailedRequests(): HTTPRequest[] {
    return this.interceptedRequests.filter(req => req.response()?.status() >= 400);
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private page: Page;
  private startTime: number = 0;
  private metrics: any[] = [];
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async startMonitoring(): Promise<void> {
    this.startTime = Date.now();
    
    // Enable request monitoring
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    this.page.on('response', (response) => {
      const duration = Date.now() - this.startTime;
      console.log(`← ${response.status()} ${response.url()} (${duration}ms)`);
    });
    
    // Continue all requests
    this.page.on('request', request => request.continue());
  }
  
  async getPerformanceMetrics(): Promise<any> {
    const metrics = await this.page.metrics();
    return {
      timestamp: Date.now(),
      ...metrics
    };
  }
  
  async measurePageLoad(url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    networkIdle: number;
    metrics: any;
  }> {
    const startTime = Date.now();
    
    // Navigate and measure different load events
    const navigationPromise = this.page.goto(url, { waitUntil: 'networkidle0' });
    
    const domContentLoadedTime = await this.page.evaluate(() => {
      return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    });
    
    await navigationPromise;
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    const networkIdleTime = await this.page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    
    const metrics = await this.getPerformanceMetrics();
    
    return {
      loadTime,
      domContentLoaded: domContentLoadedTime,
      networkIdle: networkIdleTime,
      metrics
    };
  }
}

// Network conditions emulator
export class NetworkEmulator {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async emulateSlowConnection(): Promise<void> {
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 500 * 1024, // 500 KB/s
      uploadThroughput: 500 * 1024,   // 500 KB/s
      latency: 200                     // 200ms latency
    });
  }
  
  async emulateFastConnection(): Promise<void> {
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 10 * 1024 * 1024, // 10 MB/s
      uploadThroughput: 10 * 1024 * 1024,   // 10 MB/s
      latency: 10                           // 10ms latency
    });
  }
  
  async emulateOffline(): Promise<void> {
    await this.page.emulateNetworkConditions({
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    });
  }
  
  async resetNetworkConditions(): Promise<void> {
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: -1, // No throttling
      uploadThroughput: -1,   // No throttling
      latency: 0
    });
  }
}

// Example usage classes
export class ImageBlocker {
  private interceptor: NetworkInterceptor;
  
  constructor(page: Page) {
    this.interceptor = new NetworkInterceptor(page);
  }
  
  async setup(): Promise<void> {
    await this.interceptor.enableInterception();
    
    // Block all image requests
    this.interceptor.blockUrlPattern('*.jpg');
    this.interceptor.blockUrlPattern('*.png');
    this.interceptor.blockUrlPattern('*.gif');
    this.interceptor.blockUrlPattern('*.jpeg');
    this.interceptor.blockUrlPattern('*.webp');
    this.interceptor.blockUrlPattern('*.svg');
  }
  
  getBlockedImageCount(): number {
    return this.interceptor.getRequestsByType('image').length;
  }
}

export class AdBlocker {
  private interceptor: NetworkInterceptor;
  
  constructor(page: Page) {
    this.interceptor = new NetworkInterceptor(page);
  }
  
  async setup(): Promise<void> {
    await this.interceptor.enableInterception();
    
    // Block common ad domains
    const adDomains = [
      '*doubleclick.net*',
      '*googlesyndication.com*',
      '*googleadservices.com*',
      '*facebook.com/tr*',
      '*google-analytics.com*',
      '*googletagmanager.com*'
    ];
    
    adDomains.forEach(domain => {
      this.interceptor.blockUrlPattern(domain);
    });
  }
}

export class APITester {
  private interceptor: NetworkInterceptor;
  
  constructor(page: Page) {
    this.interceptor = new NetworkInterceptor(page);
  }
  
  async setup(): Promise<void> {
    await this.interceptor.enableInterception();
  }
  
  mockAPIResponse(endpoint: string, mockData: any): void {
    this.interceptor.overrideResponse(endpoint, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });
  }
  
  simulateAPIError(endpoint: string, statusCode: number = 500): void {
    this.interceptor.overrideResponse(endpoint, {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Simulated API error' })
    });
  }
  
  getAPIRequests(): HTTPRequest[] {
    return this.interceptor.getRequestsByType('xhr').concat(
      this.interceptor.getRequestsByType('fetch')
    );
  }
}

// Complete example
export async function networkInterceptionExample() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Set up image blocking
    const imageBlocker = new ImageBlocker(page);
    await imageBlocker.setup();
    
    // Set up performance monitoring
    const performanceMonitor = new PerformanceMonitor(page);
    await performanceMonitor.startMonitoring();
    
    // Navigate to a page
    await page.goto('https://example.com');
    
    // Check results
    console.log('Blocked images:', imageBlocker.getBlockedImageCount());
    
    const metrics = await performanceMonitor.getPerformanceMetrics();
    console.log('Performance metrics:', metrics);
    
  } finally {
    await browser.close();
  }
}