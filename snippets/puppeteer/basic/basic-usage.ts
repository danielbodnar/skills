import puppeteer from 'puppeteer';

// Basic browser launch and page creation
async function basicExample() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('https://example.com');
    
    // Take screenshot
    await page.screenshot({ path: 'example.png' });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Extract text content
    const heading = await page.$eval('h1', el => el.textContent);
    console.log('Main heading:', heading);
    
  } finally {
    await browser.close();
  }
}

// Cross-browser example with WebDriver BiDi
async function crossBrowserExample() {
  // Firefox with WebDriver BiDi (default)
  const firefoxBrowser = await puppeteer.launch({
    browser: 'firefox'
  });
  
  // Chrome with WebDriver BiDi
  const chromeBrowser = await puppeteer.launch({
    browser: 'chrome',
    protocol: 'webDriverBiDi'
  });
  
  try {
    const firefoxPage = await firefoxBrowser.newPage();
    const chromePage = await chromeBrowser.newPage();
    
    await Promise.all([
      firefoxPage.goto('https://example.com'),
      chromePage.goto('https://example.com')
    ]);
    
    // Same API works across browsers
    const firefoxTitle = await firefoxPage.title();
    const chromeTitle = await chromePage.title();
    
    console.log('Firefox title:', firefoxTitle);
    console.log('Chrome title:', chromeTitle);
    
  } finally {
    await Promise.all([
      firefoxBrowser.close(),
      chromeBrowser.close()
    ]);
  }
}

// Page interaction example
async function interactionExample() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://httpbin.org/forms/post');
    
    // Fill form fields
    await page.type('input[name="custname"]', 'John Doe');
    await page.type('input[name="custtel"]', '+1234567890');
    await page.type('input[name="custemail"]', 'john@example.com');
    await page.type('textarea[name="comments"]', 'Test comment');
    
    // Select dropdown option
    await page.select('select[name="size"]', 'large');
    
    // Check checkbox
    await page.check('input[name="topping"][value="cheese"]');
    
    // Submit form
    await page.click('input[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation();
    
    console.log('Form submitted successfully');
    
  } finally {
    await browser.close();
  }
}

// Error handling example
async function errorHandlingExample() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    // Set timeout for page operations
    page.setDefaultTimeout(10000);
    
    await page.goto('https://example.com');
    
    // Wait for element with error handling
    try {
      await page.waitForSelector('.non-existent-element', { timeout: 5000 });
    } catch (error) {
      console.log('Element not found, continuing with fallback');
    }
    
    // Click with error handling
    const button = await page.$('button#submit');
    if (button) {
      await button.click();
    } else {
      console.log('Submit button not found');
    }
    
  } catch (error) {
    console.error('Error during automation:', error);
  } finally {
    await browser.close();
  }
}

// Multiple pages example
async function multiplePageExample() {
  const browser = await puppeteer.launch();
  
  try {
    // Create multiple pages
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    const page3 = await browser.newPage();
    
    // Navigate pages in parallel
    await Promise.all([
      page1.goto('https://example.com'),
      page2.goto('https://httpbin.org'),
      page3.goto('https://jsonplaceholder.typicode.com')
    ]);
    
    // Get titles from all pages
    const titles = await Promise.all([
      page1.title(),
      page2.title(),
      page3.title()
    ]);
    
    console.log('Page titles:', titles);
    
  } finally {
    await browser.close();
  }
}

// Export functions for use in other modules
export {
  basicExample,
  crossBrowserExample,
  interactionExample,
  errorHandlingExample,
  multiplePageExample
};

// Run example if this file is executed directly
if (import.meta.main) {
  await basicExample();
}