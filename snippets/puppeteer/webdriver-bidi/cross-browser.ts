import puppeteer, { type Browser, type Page } from 'puppeteer';

// Cross-browser automation using WebDriver BiDi
export class CrossBrowserAutomation {
  private chromeBrowser?: Browser;
  private firefoxBrowser?: Browser;
  
  async launchBrowsers() {
    // Launch Chrome with WebDriver BiDi
    this.chromeBrowser = await puppeteer.launch({
      browser: 'chrome',
      protocol: 'webDriverBiDi',
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    // Launch Firefox with WebDriver BiDi (default)
    this.firefoxBrowser = await puppeteer.launch({
      browser: 'firefox',
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    console.log('Both browsers launched successfully with WebDriver BiDi');
  }
  
  async runParallelTests(url: string) {
    if (!this.chromeBrowser || !this.firefoxBrowser) {
      throw new Error('Browsers not launched. Call launchBrowsers() first.');
    }
    
    const chromePage = await this.chromeBrowser.newPage();
    const firefoxPage = await this.firefoxBrowser.newPage();
    
    try {
      // Navigate both browsers in parallel
      await Promise.all([
        chromePage.goto(url),
        firefoxPage.goto(url)
      ]);
      
      // Run same tests on both browsers
      const results = await Promise.all([
        this.runBrowserTests(chromePage, 'Chrome'),
        this.runBrowserTests(firefoxPage, 'Firefox')
      ]);
      
      return {
        chrome: results[0],
        firefox: results[1]
      };
    } finally {
      await Promise.all([
        chromePage.close(),
        firefoxPage.close()
      ]);
    }
  }
  
  private async runBrowserTests(page: Page, browserName: string) {
    console.log(`Running tests on ${browserName}`);
    
    // Get page title
    const title = await page.title();
    
    // Take screenshot
    await page.screenshot({ 
      path: `${browserName.toLowerCase()}-screenshot.png`,
      fullPage: true 
    });
    
    // Check for common elements
    const hasHeader = await page.$('h1') !== null;
    const hasNavigation = await page.$('nav') !== null;
    const hasFooter = await page.$('footer') !== null;
    
    // Measure performance
    const metrics = await page.metrics();
    
    return {
      browser: browserName,
      title,
      elements: {
        hasHeader,
        hasNavigation,
        hasFooter
      },
      performance: {
        jsHeapUsedSize: metrics.JSHeapUsedSize,
        jsHeapTotalSize: metrics.JSHeapTotalSize,
        scriptDuration: metrics.ScriptDuration,
        taskDuration: metrics.TaskDuration
      }
    };
  }
  
  async compareRendering(url: string) {
    if (!this.chromeBrowser || !this.firefoxBrowser) {
      throw new Error('Browsers not launched');
    }
    
    const chromePage = await this.chromeBrowser.newPage();
    const firefoxPage = await this.firefoxBrowser.newPage();
    
    try {
      // Set identical viewport
      const viewport = { width: 1280, height: 720 };
      await Promise.all([
        chromePage.setViewport(viewport),
        firefoxPage.setViewport(viewport)
      ]);
      
      // Navigate and wait for load
      await Promise.all([
        chromePage.goto(url, { waitUntil: 'networkidle0' }),
        firefoxPage.goto(url, { waitUntil: 'networkidle0' })
      ]);
      
      // Take comparison screenshots
      await Promise.all([
        chromePage.screenshot({ 
          path: 'chrome-comparison.png',
          fullPage: true 
        }),
        firefoxPage.screenshot({ 
          path: 'firefox-comparison.png',
          fullPage: true 
        })
      ]);
      
      console.log('Screenshots taken for visual comparison');
      
    } finally {
      await Promise.all([
        chromePage.close(),
        firefoxPage.close()
      ]);
    }
  }
  
  async testFormHandling(formUrl: string) {
    if (!this.chromeBrowser || !this.firefoxBrowser) {
      throw new Error('Browsers not launched');
    }
    
    const testData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Cross-browser test message'
    };
    
    const chromePage = await this.chromeBrowser.newPage();
    const firefoxPage = await this.firefoxBrowser.newPage();
    
    try {
      // Test form submission in parallel
      const results = await Promise.all([
        this.fillAndSubmitForm(chromePage, formUrl, testData, 'Chrome'),
        this.fillAndSubmitForm(firefoxPage, formUrl, testData, 'Firefox')
      ]);
      
      return results;
    } finally {
      await Promise.all([
        chromePage.close(),
        firefoxPage.close()
      ]);
    }
  }
  
  private async fillAndSubmitForm(page: Page, url: string, data: any, browserName: string) {
    await page.goto(url);
    
    // Fill form fields (adjust selectors as needed)
    await page.type('input[name="name"]', data.name);
    await page.type('input[name="email"]', data.email);
    await page.type('textarea[name="message"]', data.message);
    
    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await page.waitForNavigation();
    }
    
    const success = await page.$('.success-message') !== null;
    
    return {
      browser: browserName,
      formSubmitted: success,
      finalUrl: page.url()
    };
  }
  
  async closeBrowsers() {
    const closingPromises = [];
    
    if (this.chromeBrowser) {
      closingPromises.push(this.chromeBrowser.close());
    }
    
    if (this.firefoxBrowser) {
      closingPromises.push(this.firefoxBrowser.close());
    }
    
    await Promise.all(closingPromises);
    console.log('All browsers closed');
  }
}

// Utility functions for WebDriver BiDi specific features
export async function detectProtocolSupport() {
  // Check Chrome WebDriver BiDi support
  const chromeBrowser = await puppeteer.launch({
    browser: 'chrome',
    protocol: 'webDriverBiDi',
    headless: true
  });
  
  // Check Firefox WebDriver BiDi support (default)
  const firefoxBrowser = await puppeteer.launch({
    browser: 'firefox',
    headless: true
  });
  
  try {
    const chromeVersion = await chromeBrowser.version();
    const firefoxVersion = await firefoxBrowser.version();
    
    console.log(`Chrome version with WebDriver BiDi: ${chromeVersion}`);
    console.log(`Firefox version with WebDriver BiDi: ${firefoxVersion}`);
    
    return {
      chrome: { version: chromeVersion, webDriverBiDi: true },
      firefox: { version: firefoxVersion, webDriverBiDi: true }
    };
  } finally {
    await Promise.all([
      chromeBrowser.close(),
      firefoxBrowser.close()
    ]);
  }
}

// Usage example
async function runCrossBrowserExample() {
  const automation = new CrossBrowserAutomation();
  
  try {
    await automation.launchBrowsers();
    
    // Run parallel tests
    const testResults = await automation.runParallelTests('https://example.com');
    console.log('Test results:', testResults);
    
    // Compare visual rendering
    await automation.compareRendering('https://example.com');
    
    // Test protocol support
    const protocolSupport = await detectProtocolSupport();
    console.log('Protocol support:', protocolSupport);
    
  } finally {
    await automation.closeBrowsers();
  }
}

export { runCrossBrowserExample };