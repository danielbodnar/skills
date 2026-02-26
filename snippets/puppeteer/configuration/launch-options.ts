import puppeteer, { type LaunchOptions, type Viewport } from 'puppeteer';

// Basic launch configuration
export const basicConfig: LaunchOptions = {
  headless: true,
  defaultViewport: {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  },
  timeout: 30000,
};

// Development configuration (headed mode)
export const devConfig: LaunchOptions = {
  headless: false,
  devtools: true,
  slowMo: 100, // Slow down by 100ms for debugging
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
  args: [
    '--start-maximized',
    '--disable-extensions-except',
    '--disable-extensions',
  ],
};

// CI/CD configuration (optimized for containers)
export const ciConfig: LaunchOptions = {
  headless: 'new', // Use new headless mode
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
  timeout: 60000,
};

// Performance optimized configuration
export const performanceConfig: LaunchOptions = {
  headless: true,
  defaultViewport: {
    width: 1024,
    height: 768,
  },
  args: [
    '--disable-images',
    '--disable-javascript',
    '--disable-plugins',
    '--disable-css',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--run-all-compositor-stages-before-draw',
    '--disable-dev-shm-usage',
  ],
  timeout: 15000,
};

// Mobile testing configuration
export const mobileConfig: LaunchOptions = {
  headless: true,
  defaultViewport: {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  },
  timeout: 30000,
};

// Security focused configuration
export const secureConfig: LaunchOptions = {
  headless: true,
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-ipc-flooding-protection',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-component-extensions-with-background-pages',
  ],
  timeout: 30000,
};

// WebDriver BiDi configurations
export const webDriverBiDiChrome: LaunchOptions = {
  browser: 'chrome',
  protocol: 'webDriverBiDi',
  headless: true,
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  timeout: 30000,
};

export const webDriverBiDiFirefox: LaunchOptions = {
  browser: 'firefox',
  // WebDriver BiDi is default for Firefox
  headless: true,
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  timeout: 30000,
};

// Custom viewport configurations
export const viewports: Record<string, Viewport> = {
  mobile: {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  },
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  },
  desktop: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
  ultrawide: {
    width: 3440,
    height: 1440,
    deviceScaleFactor: 1,
  },
};

// Environment-based configuration factory
export function createConfig(environment: 'development' | 'testing' | 'production'): LaunchOptions {
  switch (environment) {
    case 'development':
      return devConfig;
    case 'testing':
      return ciConfig;
    case 'production':
      return {
        ...ciConfig,
        headless: true,
        args: [
          ...ciConfig.args!,
          '--disable-logging',
          '--disable-gpu-logging',
          '--silent',
        ],
      };
    default:
      return basicConfig;
  }
}

// Cross-browser configuration factory
export function createCrossBrowserConfig(browser: 'chrome' | 'firefox'): LaunchOptions {
  const baseConfig = {
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 720,
    },
    timeout: 30000,
  };

  switch (browser) {
    case 'chrome':
      return {
        ...baseConfig,
        browser: 'chrome',
        protocol: 'webDriverBiDi', // Use WebDriver BiDi for consistency
      };
    case 'firefox':
      return {
        ...baseConfig,
        browser: 'firefox',
        // WebDriver BiDi is default for Firefox
      };
    default:
      return baseConfig;
  }
}

// Usage examples
async function launchExamples() {
  // Basic launch
  const basicBrowser = await puppeteer.launch(basicConfig);
  
  // Environment-based launch
  const envBrowser = await puppeteer.launch(
    createConfig(process.env.NODE_ENV as any || 'development')
  );
  
  // Cross-browser launch
  const chromeBrowser = await puppeteer.launch(createCrossBrowserConfig('chrome'));
  const firefoxBrowser = await puppeteer.launch(createCrossBrowserConfig('firefox'));
  
  // Custom configuration
  const customBrowser = await puppeteer.launch({
    ...basicConfig,
    headless: false,
    defaultViewport: viewports.tablet,
    args: [
      '--start-fullscreen',
      '--disable-web-security',
    ],
  });
  
  // Don't forget to close browsers
  await Promise.all([
    basicBrowser.close(),
    envBrowser.close(),
    chromeBrowser.close(),
    firefoxBrowser.close(),
    customBrowser.close(),
  ]);
}

export { launchExamples };