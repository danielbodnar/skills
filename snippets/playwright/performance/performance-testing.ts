import { test, expect } from '@playwright/test';

// Performance testing patterns
test.describe('Performance Testing', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/performance-test');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Assert load time is under threshold
    expect(loadTime).toBeLessThan(3000); // 3 seconds
    
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('first contentful paint', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/performance-test');
    await page.waitForSelector('h1'); // Wait for first content
    
    const fcpTime = Date.now() - startTime;
    
    expect(fcpTime).toBeLessThan(1500); // 1.5 seconds
    console.log(`First Contentful Paint: ${fcpTime}ms`);
  });

  test('time to interactive', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/interactive-page');
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('button:not([disabled])');
    
    const ttiTime = Date.now() - startTime;
    
    expect(ttiTime).toBeLessThan(5000); // 5 seconds
    console.log(`Time to Interactive: ${ttiTime}ms`);
  });

  test('resource loading performance', async ({ page }) => {
    const resourceTimings: any[] = [];
    
    // Monitor resource loading
    page.on('response', response => {
      resourceTimings.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'],
        timing: response.timing()
      });
    });

    await page.goto('/resource-heavy-page');
    await page.waitForLoadState('networkidle');
    
    // Analyze resource performance
    const slowResources = resourceTimings.filter(resource => 
      resource.timing && resource.timing.responseEnd > 2000
    );
    
    expect(slowResources.length).toBe(0); // No resources should take > 2s
    
    console.log(`Total resources loaded: ${resourceTimings.length}`);
  });
});

// Memory and CPU performance
test.describe('Memory and CPU Performance', () => {
  test('memory usage monitoring', async ({ page }) => {
    await page.goto('/memory-test-page');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform memory-intensive operations
    await page.getByRole('button', { name: 'Load Large Dataset' }).click();
    await page.waitForTimeout(2000);
    
    // Get memory usage after operation
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    
    // Assert memory increase is reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    
    console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
  });

  test('CPU intensive operations', async ({ page }) => {
    await page.goto('/cpu-test-page');
    
    const startTime = Date.now();
    
    // Trigger CPU-intensive operation
    await page.getByRole('button', { name: 'Start Heavy Computation' }).click();
    
    // Wait for computation to complete
    await expect(page.getByText('Computation completed')).toBeVisible({ timeout: 10000 });
    
    const executionTime = Date.now() - startTime;
    
    // Assert computation time is reasonable
    expect(executionTime).toBeLessThan(5000); // Less than 5 seconds
    
    console.log(`CPU operation time: ${executionTime}ms`);
  });
});

// API performance testing
test.describe('API Performance', () => {
  test('API response time', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/performance-test');
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Less than 1 second
    
    console.log(`API response time: ${responseTime}ms`);
  });

  test('concurrent API requests', async ({ request }) => {
    const startTime = Date.now();
    
    // Make multiple concurrent requests
    const requests = Array(10).fill(0).map(() => 
      request.get('/api/concurrent-test')
    );
    
    const responses = await Promise.all(requests);
    
    const totalTime = Date.now() - startTime;
    
    // Verify all requests succeeded
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // Assert concurrent requests completed reasonably fast
    expect(totalTime).toBeLessThan(3000); // Less than 3 seconds for 10 requests
    
    console.log(`10 concurrent requests completed in: ${totalTime}ms`);
  });

  test('API throughput testing', async ({ request }) => {
    const requestCount = 100;
    const startTime = Date.now();
    
    // Send requests in batches
    const batchSize = 10;
    const batches = Math.ceil(requestCount / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batchRequests = Array(batchSize).fill(0).map(() => 
        request.get('/api/throughput-test')
      );
      
      await Promise.all(batchRequests);
    }
    
    const totalTime = Date.now() - startTime;
    const requestsPerSecond = (requestCount / totalTime) * 1000;
    
    // Assert minimum throughput
    expect(requestsPerSecond).toBeGreaterThan(10); // At least 10 requests per second
    
    console.log(`API throughput: ${requestsPerSecond.toFixed(2)} requests/second`);
  });
});

// Visual performance testing
test.describe('Visual Performance', () => {
  test('layout shift detection', async ({ page }) => {
    await page.goto('/layout-shift-page');
    
    // Measure layout shift
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Trigger layout shift
        document.body.innerHTML += '<div style="height: 200px;">New content</div>';
        
        setTimeout(() => resolve(clsValue), 1000);
      });
    });
    
    // Assert minimal layout shift
    expect(cls).toBeLessThan(0.1); // CLS should be less than 0.1
    
    console.log(`Cumulative Layout Shift: ${cls}`);
  });

  test('animation performance', async ({ page }) => {
    await page.goto('/animation-page');
    
    // Start animation
    await page.getByRole('button', { name: 'Start Animation' }).click();
    
    // Measure animation frame rate
    const frameRate = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = Date.now();
        
        const countFrames = () => {
          frameCount++;
          const elapsed = Date.now() - startTime;
          
          if (elapsed < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        };
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // Assert smooth animation (close to 60fps)
    expect(frameRate).toBeGreaterThan(50);
    
    console.log(`Animation frame rate: ${frameRate} fps`);
  });
});

// Bundle size and network performance
test.describe('Bundle and Network Performance', () => {
  test('bundle size analysis', async ({ page }) => {
    const resourceSizes: { [key: string]: number } = {};
    
    // Monitor resource downloads
    page.on('response', response => {
      const contentLength = response.headers()['content-length'];
      if (contentLength) {
        resourceSizes[response.url()] = parseInt(contentLength);
      }
    });

    await page.goto('/bundle-test-page');
    await page.waitForLoadState('networkidle');
    
    // Analyze JavaScript bundle sizes
    const jsBundles = Object.entries(resourceSizes)
      .filter(([url]) => url.includes('.js'))
      .reduce((total, [, size]) => total + size, 0);
    
    // Assert reasonable bundle size
    expect(jsBundles).toBeLessThan(1024 * 1024); // Less than 1MB
    
    console.log(`Total JS bundle size: ${jsBundles / 1024}KB`);
  });

  test('network waterfall analysis', async ({ page }) => {
    const networkEvents: any[] = [];
    
    // Track network events
    page.on('request', request => {
      networkEvents.push({
        type: 'request',
        url: request.url(),
        timestamp: Date.now()
      });
    });
    
    page.on('response', response => {
      networkEvents.push({
        type: 'response',
        url: response.url(),
        timestamp: Date.now(),
        status: response.status()
      });
    });

    await page.goto('/network-test-page');
    await page.waitForLoadState('networkidle');
    
    // Analyze network timing
    const totalNetworkTime = Math.max(...networkEvents.map(e => e.timestamp)) - 
                           Math.min(...networkEvents.map(e => e.timestamp));
    
    expect(totalNetworkTime).toBeLessThan(5000); // Less than 5 seconds
    
    console.log(`Total network time: ${totalNetworkTime}ms`);
  });
});

// Real User Monitoring (RUM) simulation
test.describe('Real User Monitoring', () => {
  test('web vitals collection', async ({ page }) => {
    await page.goto('/web-vitals-page');
    
    // Collect Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // First Contentful Paint
        new PerformanceObserver((entryList) => {
          vitals.fcp = entryList.getEntries()[0].startTime;
        }).observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          vitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        new PerformanceObserver((entryList) => {
          vitals.fid = entryList.getEntries()[0].processingStart - entryList.getEntries()[0].startTime;
        }).observe({ entryTypes: ['first-input'] });
        
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    // Assert Web Vitals thresholds
    expect(vitals.fcp).toBeLessThan(1800); // FCP < 1.8s
    expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    if (vitals.fid) {
      expect(vitals.fid).toBeLessThan(100); // FID < 100ms
    }
    
    console.log('Web Vitals:', vitals);
  });
});