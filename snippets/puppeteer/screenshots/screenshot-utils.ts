import puppeteer, { type Page, type ScreenshotOptions, type PDFOptions } from 'puppeteer';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export class ScreenshotUtility {
  private page: Page;
  private outputDir: string;
  
  constructor(page: Page, outputDir: string = './screenshots') {
    this.page = page;
    this.outputDir = outputDir;
  }
  
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create output directory:', error);
    }
  }
  
  // Basic screenshot with timestamp
  async takeScreenshot(filename?: string): Promise<string> {
    await this.ensureOutputDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `screenshot-${timestamp}.png`;
    const filepath = path.join(this.outputDir, name);
    
    await this.page.screenshot({
      path: filepath,
      type: 'png',
      fullPage: false
    });
    
    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
  }
  
  // Full page screenshot
  async takeFullPageScreenshot(filename?: string): Promise<string> {
    await this.ensureOutputDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `fullpage-${timestamp}.png`;
    const filepath = path.join(this.outputDir, name);
    
    await this.page.screenshot({
      path: filepath,
      type: 'png',
      fullPage: true
    });
    
    console.log(`Full page screenshot saved: ${filepath}`);
    return filepath;
  }
  
  // Element screenshot
  async takeElementScreenshot(selector: string, filename?: string): Promise<string> {
    await this.ensureOutputDirectory();
    
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `element-${timestamp}.png`;
    const filepath = path.join(this.outputDir, name);
    
    await element.screenshot({
      path: filepath,
      type: 'png'
    });
    
    console.log(`Element screenshot saved: ${filepath}`);
    return filepath;
  }
  
  // Screenshot with custom options
  async takeCustomScreenshot(options: ScreenshotOptions & { filename?: string }): Promise<string> {
    await this.ensureOutputDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = options.filename || `custom-${timestamp}.png`;
    const filepath = path.join(this.outputDir, name);
    
    const screenshotOptions: ScreenshotOptions = {
      ...options,
      path: filepath
    };
    
    delete (screenshotOptions as any).filename;
    
    await this.page.screenshot(screenshotOptions);
    
    console.log(`Custom screenshot saved: ${filepath}`);
    return filepath;
  }
  
  // Mobile viewport screenshot
  async takeMobileScreenshot(filename?: string): Promise<string> {
    // Set mobile viewport
    await this.page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `mobile-${timestamp}.png`;
    
    return this.takeScreenshot(name);
  }
  
  // Tablet viewport screenshot
  async takeTabletScreenshot(filename?: string): Promise<string> {
    // Set tablet viewport
    await this.page.setViewport({
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `tablet-${timestamp}.png`;
    
    return this.takeScreenshot(name);
  }
  
  // Generate PDF
  async generatePDF(filename?: string, options?: PDFOptions): Promise<string> {
    await this.ensureOutputDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `page-${timestamp}.pdf`;
    const filepath = path.join(this.outputDir, name);
    
    const pdfOptions: PDFOptions = {
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      },
      ...options
    };
    
    await this.page.pdf(pdfOptions);
    
    console.log(`PDF saved: ${filepath}`);
    return filepath;
  }
  
  // Screenshot comparison utility
  async compareScreenshots(url1: string, url2: string, name: string): Promise<{
    screenshot1: string;
    screenshot2: string;
  }> {
    // Take screenshot of first URL
    await this.page.goto(url1, { waitUntil: 'networkidle0' });
    const screenshot1 = await this.takeFullPageScreenshot(`${name}-url1.png`);
    
    // Take screenshot of second URL
    await this.page.goto(url2, { waitUntil: 'networkidle0' });
    const screenshot2 = await this.takeFullPageScreenshot(`${name}-url2.png`);
    
    return { screenshot1, screenshot2 };
  }
  
  // Responsive screenshots (multiple viewports)
  async takeResponsiveScreenshots(filename: string): Promise<string[]> {
    const viewports = [
      { name: 'mobile', width: 375, height: 667, deviceScaleFactor: 2 },
      { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2 },
      { name: 'desktop', width: 1280, height: 720, deviceScaleFactor: 1 },
      { name: 'large', width: 1920, height: 1080, deviceScaleFactor: 1 }
    ];
    
    const screenshots: string[] = [];
    
    for (const viewport of viewports) {
      await this.page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor,
        isMobile: viewport.width < 768,
        hasTouch: viewport.width < 768
      });
      
      // Wait for potential layout changes
      await this.page.waitForTimeout(500);
      
      const screenshot = await this.takeScreenshot(`${filename}-${viewport.name}.png`);
      screenshots.push(screenshot);
    }
    
    return screenshots;
  }
  
  // Screenshot with scroll
  async takeScrollingScreenshot(filename?: string, scrollDelay: number = 1000): Promise<string> {
    await this.ensureOutputDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = filename || `scrolling-${timestamp}.png`;
    const filepath = path.join(this.outputDir, name);
    
    // Get page height
    const bodyHandle = await this.page.$('body');
    const { height } = await bodyHandle!.boundingBox()!;
    
    // Set viewport to match page height
    await this.page.setViewport({
      width: 1280,
      height: Math.min(height, 32767) // Max height limit
    });
    
    // Scroll to bottom gradually
    await this.page.evaluate(async (scrollDelay) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, scrollDelay / 10);
      });
    }, scrollDelay);
    
    await this.page.screenshot({
      path: filepath,
      type: 'png',
      fullPage: true
    });
    
    console.log(`Scrolling screenshot saved: ${filepath}`);
    return filepath;
  }
}

// Utility functions
export async function capturePageScreenshots(url: string, outputDir?: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const screenshotUtil = new ScreenshotUtility(page, outputDir);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Take various screenshots
    const screenshots = await Promise.all([
      screenshotUtil.takeScreenshot(),
      screenshotUtil.takeFullPageScreenshot(),
      screenshotUtil.takeMobileScreenshot(),
      screenshotUtil.takeTabletScreenshot()
    ]);
    
    console.log('All screenshots captured:', screenshots);
    return screenshots;
    
  } finally {
    await browser.close();
  }
}

// Screenshot with element highlighting
export async function highlightElementScreenshot(
  page: Page, 
  selector: string, 
  filename: string,
  highlightColor: string = '#ff0000'
) {
  // Add highlight style
  await page.evaluate((selector, color) => {
    const element = document.querySelector(selector);
    if (element) {
      (element as HTMLElement).style.outline = `3px solid ${color}`;
      (element as HTMLElement).style.outlineOffset = '2px';
    }
  }, selector, highlightColor);
  
  // Take screenshot
  const screenshotUtil = new ScreenshotUtility(page);
  return screenshotUtil.takeScreenshot(filename);
}

export { ScreenshotUtility };