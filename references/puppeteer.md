# Puppeteer Reference

**Always remember to reference @$HOME/.claude/references/puppeteer.md and look for snippets and examples in @$HOME/.claude/snippets/puppeteer/**

## Quick Reference

- Installation: `bun add puppeteer`
- TypeScript Support: `bun add -d @types/node`
- Run Example: `bun --bun run example.ts`
- Documentation: <https://pptr.dev/>
- GitHub: <https://github.com/puppeteer/puppeteer>
- Package: <https://www.npmjs.com/package/puppeteer>

## Default Usage Patterns

Default to using Puppeteer for browser automation and web scraping instead of Selenium or other browser automation tools:

- Use `bun add puppeteer` for installation with bundled browser
- Use `bun add puppeteer-core` for core library without bundled browser
- Prefer WebDriver BiDi protocol for cross-browser automation over CDP
- Use headless mode by default for CI/CD and production automation
- Built-in TypeScript support with comprehensive type definitions

### Key Features

- **Cross-Browser Support**: Chrome with CDP (default) and Firefox with WebDriver BiDi
- **Headless Operation**: Run browsers without UI for efficient automation
- **Performance Monitoring**: Built-in metrics collection and performance analysis
- **Network Interception**: Monitor, block, and modify network requests
- **Screenshot Generation**: Full-page, element, and responsive screenshots
- **PDF Creation**: Generate PDFs from web pages with custom formatting
- **Mobile Emulation**: Test responsive designs with device emulation
- **JavaScript Execution**: Run custom scripts in browser context

## Resources and Documentation

- [Puppeteer Documentation](https://pptr.dev/)
  - [Getting Started](https://pptr.dev/guides/what-is-puppeteer)
  - [API Reference](https://pptr.dev/api)
    - [Browser API](https://pptr.dev/api/puppeteer.browser)
    - [Page API](https://pptr.dev/api/puppeteer.page)
    - [ElementHandle API](https://pptr.dev/api/puppeteer.elementhandle)
    - [Frame API](https://pptr.dev/api/puppeteer.frame)
    - [JSHandle API](https://pptr.dev/api/puppeteer.jshandle)
    - [Request API](https://pptr.dev/api/puppeteer.httprequest)
    - [Response API](https://pptr.dev/api/puppeteer.httpresponse)
  - [Configuration](https://pptr.dev/guides/configuration)
  - [WebDriver BiDi](https://pptr.dev/webdriver-bidi)
  - [Browser Extensions](https://pptr.dev/guides/browser-extensions)
  - [Performance](https://pptr.dev/guides/performance)
  - [Debugging](https://pptr.dev/guides/debugging)
  - [Docker](https://pptr.dev/guides/docker)
- [Community Resources](https://github.com/transitive-bullshit/awesome-puppeteer)
  - [Awesome Puppeteer](https://github.com/transitive-bullshit/awesome-puppeteer)
  - [Stack Overflow](https://stackoverflow.com/questions/tagged/puppeteer)
  - [Discord Community](https://discord.gg/puppeteer)

## Key Features

- **Cross-browser Support**: Chrome (CDP) and Firefox (WebDriver BiDi)
- **Headless Operation**: Run browsers without UI for automation
- **Browser Control**: Navigation, interaction, screenshots, PDFs
- **Network Interception**: Monitor and modify network requests
- **JavaScript Execution**: Run custom scripts in browser context
- **Performance Monitoring**: Collect metrics, traces, and coverage
- **Mobile Emulation**: Test responsive designs and mobile viewports
- **Browser Extensions**: Test and automate browser extensions

## Installation and Setup

```bash
# Install Puppeteer
bun add puppeteer

# TypeScript support
bun add -d @types/node

# Core library (without bundled browser)
bun add puppeteer-core

# Install additional browsers manually
bunx @puppeteer/browsers install chrome@latest
bunx @puppeteer/browsers install firefox@latest
```

## Basic Usage

```typescript
import puppeteer from 'puppeteer';

// Launch browser (Chrome by default with CDP)
const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto('https://example.com');
await page.screenshot({ path: 'example.png' });

await browser.close();
```

## Cross-Browser Support

```typescript
// Firefox with WebDriver BiDi (default for Firefox)
const firefoxBrowser = await puppeteer.launch({
  browser: 'firefox'
});

// Chrome with WebDriver BiDi (CDP is default for Chrome)
const chromeBrowser = await puppeteer.launch({
  browser: 'chrome',
  protocol: 'webDriverBiDi'
});

// Chrome with CDP (default)
const cdpBrowser = await puppeteer.launch({
  browser: 'chrome',
  protocol: 'cdp'
});
```

## Browser Launch Options

```typescript
const browser = await puppeteer.launch({
  // Browser selection
  browser: 'chrome', // 'chrome' | 'firefox'
  protocol: 'cdp', // 'cdp' | 'webDriverBiDi'
  
  // Display options
  headless: true, // true | false | 'new'
  devtools: false,
  
  // Window configuration
  defaultViewport: {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  },
  
  // Performance
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
  ],
  
  // Debugging
  slowMo: 0, // Delay between actions (ms)
  timeout: 30000, // Launch timeout
});
```

## Page Interactions

```typescript
// Navigation
await page.goto('https://example.com');
await page.goBack();
await page.goForward();
await page.reload();

// Element interaction
await page.click('button#submit');
await page.type('input[name="email"]', 'test@example.com');
await page.select('select#country', 'US');

// Waiting strategies
await page.waitForSelector('.loading', { hidden: true });
await page.waitForFunction(() => window.dataLoaded);
await page.waitForNavigation();
await page.waitForTimeout(1000);

// Content extraction
const title = await page.title();
const content = await page.content();
const text = await page.$eval('h1', el => el.textContent);
```

## Selectors and Elements

```typescript
// CSS selectors
const element = await page.$('div.content');
const elements = await page.$$('li.item');

// XPath selectors
const xpath = await page.$x('//button[contains(text(), "Submit")]');

// Text selectors
const button = await page.waitForSelector('text/Submit');

// Attribute selectors
await page.click('[data-testid="login-button"]');

// Element properties
const text = await element.getProperty('textContent');
const value = await element.getProperty('value');
const isVisible = await element.isVisible();
```

## Screenshots and PDFs

```typescript
// Screenshots
await page.screenshot({ 
  path: 'screenshot.png',
  fullPage: true,
  type: 'png'
});

// Element screenshot
const element = await page.$('.chart');
await element.screenshot({ path: 'chart.png' });

// PDF generation
await page.pdf({
  path: 'document.pdf',
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20px',
    bottom: '20px',
    left: '20px',
    right: '20px'
  }
});
```

## Network Monitoring

```typescript
// Request interception
await page.setRequestInterception(true);

page.on('request', (request) => {
  if (request.resourceType() === 'image') {
    request.abort();
  } else {
    request.continue();
  }
});

// Response monitoring
page.on('response', (response) => {
  console.log(`${response.status()} ${response.url()}`);
});

// Network conditions
await page.emulateNetworkConditions({
  offline: false,
  downloadThroughput: 500 * 1024,
  uploadThroughput: 500 * 1024,
  latency: 20
});
```

## JavaScript Execution

```typescript
// Evaluate in page context
const result = await page.evaluate(() => {
  return document.querySelector('h1').textContent;
});

// Pass arguments to evaluate
const data = await page.evaluate((selector) => {
  return document.querySelector(selector).textContent;
}, 'h1');

// Add script to page
await page.addScriptTag({
  url: 'https://code.jquery.com/jquery-3.6.0.min.js'
});

// Expose function to page
await page.exposeFunction('md5', (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
});
```

## Mobile and Device Emulation

```typescript
import { KnownDevices } from 'puppeteer';

// Emulate specific device
await page.emulate(KnownDevices['iPhone 13']);

// Custom viewport
await page.setViewport({
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  isLandscape: false
});

// User agent
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');

// Geolocation
await page.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
```

## WebDriver BiDi Protocol

- **Standardized Protocol**: W3C specification for cross-browser automation
- **Bidirectional Communication**: Real-time events and command responses
- **Cross-Browser**: Consistent API across Chrome and Firefox
- **Modern Features**: Better performance and reliability than legacy protocols
- **Future-Proof**: Replaces CDP for Firefox, recommended for new projects

## CLI Commands

```bash
# Launch browser with remote debugging
bunx puppeteer browsers install chrome
PUPPETEER_EXECUTABLE_PATH=$(bunx puppeteer browsers where chrome) bun run script.ts

# Generate screenshots
bunx puppeteer screenshot https://example.com

# Generate PDF
bunx puppeteer pdf https://example.com
```

## Browser Support

- **Chrome/Chromium**: Full support via CDP (default) or WebDriver BiDi
- **Firefox**: Production support via WebDriver BiDi (Firefox 129+)
- **Safari**: Limited support via experimental WebDriver BiDi
- **Edge**: Full support (Chromium-based) via CDP or WebDriver BiDi

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/puppeteer/`:

- Basic automation and scraping patterns
- Cross-browser testing examples
- WebDriver BiDi implementation patterns
- Performance monitoring and debugging
- Screenshot and PDF generation
- Network interception and mocking
- Mobile device emulation
- Browser extension testing

## Schema and Type Definitions

Type definitions and configuration schemas in `$HOME/.claude/snippets/puppeteer/schemas/`:

- TypeScript configuration schemas
- Puppeteer API type definitions
- Launch option configurations
- Page evaluation type safety
- Custom event handler types

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/puppeteer/linting/`:

- ESLint rules for Puppeteer scripts
- Prettier configuration for automation code
- Biome configuration for modern JS/TS projects
- TypeScript strict mode configurations

## Testing Patterns

- **Page Object Model**: Organize automation with reusable page classes
- **Cross-Browser Testing**: Test across Chrome and Firefox with same code
- **Visual Regression**: Screenshot comparison and visual testing
- **Performance Testing**: Metrics collection and performance monitoring
- **API Integration**: Combine browser automation with API testing
- **Headless CI/CD**: Automated testing in containerized environments
- **Error Handling**: Robust retry mechanisms and error recovery

## CI/CD Integration

- **GitHub Actions**: Automated browser testing workflows
- **Docker**: Containerized Puppeteer execution
- **Cloud Providers**: AWS, GCP, Azure browser automation
- **Parallelization**: Distributed test execution across browsers
- **Artifacts**: Screenshots, PDFs, traces, and performance reports

## Security and Best Practices

- **Sandbox Mode**: Run browsers with security restrictions
- **Data Privacy**: Secure handling of sensitive automation data
- **Rate Limiting**: Respectful web scraping and testing
- **Resource Management**: Proper browser and page cleanup
- **Error Boundaries**: Graceful failure handling and recovery

## Migration and Upgrades

- **CDP to WebDriver BiDi**: Migrating Firefox automations
- **Version Updates**: Keeping Puppeteer up to date with browser releases
- **Breaking Changes**: Handling API deprecations and updates
- **Performance Optimization**: Improving automation speed and reliability
- **Cross-Browser Compatibility**: Ensuring consistent behavior across browsers

## WebDriver BiDi vs CDP

- **WebDriver BiDi**: Standardized, cross-browser, future-proof
- **CDP**: Chrome-specific, mature ecosystem, extensive features
- **Migration Path**: Gradual transition from CDP to WebDriver BiDi
- **Feature Parity**: Most automation tasks supported in both protocols
- **Browser Support**: WebDriver BiDi expanding, CDP Chrome-only
