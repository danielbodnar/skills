// Puppeteer TypeScript type definitions and utility types

import type {
  Browser,
  Page,
  ElementHandle,
  JSHandle,
  Frame,
  Target,
  Worker,
  HTTPRequest,
  HTTPResponse,
  Dialog,
  ConsoleMessage,
  Coverage,
  Tracing,
  Accessibility,
  LaunchOptions,
  ConnectOptions,
  BrowserContextOptions,
  Viewport,
  ScreenshotOptions,
  PDFOptions,
  GoToOptions,
  WaitForOptions,
  ClickOptions,
  TypeOptions,
  KeyboardTypeOptions,
  MouseClickOptions,
  TouchscreenTapOptions,
  EvaluateFunc,
  SerializableOrJSHandle,
  Serializable,
  JSONObject
} from 'puppeteer';

// Configuration types
export interface PuppeteerConfig {
  browser: 'chrome' | 'firefox';
  protocol?: 'cdp' | 'webDriverBiDi';
  headless: boolean | 'new';
  defaultViewport: Viewport | null;
  timeout: number;
  args: string[];
  devtools?: boolean;
  slowMo?: number;
  executablePath?: string;
  userDataDir?: string;
  env?: Record<string, string>;
}

export interface TestConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  screenshots: boolean;
  video: boolean;
  trace: boolean;
  outputDir: string;
}

// Page object model types
export interface BasePageOptions {
  page: Page;
  baseUrl?: string;
  timeout?: number;
}

export interface PageElement {
  selector: string;
  name: string;
  type: 'button' | 'input' | 'link' | 'text' | 'image' | 'container';
  required: boolean;
}

export interface PageAction {
  name: string;
  method: 'click' | 'type' | 'select' | 'wait' | 'navigate';
  selector?: string;
  value?: string;
  options?: any;
}

// Test result types
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  video?: string;
  trace?: string;
}

export interface BrowserTestResult {
  browser: string;
  version: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

// Network interception types
export interface RequestFilter {
  url?: string | RegExp;
  resourceType?: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface ResponseOverride {
  status: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
}

export interface NetworkMetrics {
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  blockedRequests: number;
}

// Performance monitoring types
export interface PerformanceMetrics {
  timestamp: number;
  JSHeapUsedSize: number;
  JSHeapTotalSize: number;
  JSEventListeners: number;
  ScriptDuration: number;
  TaskDuration: number;
  LayoutDuration: number;
  RecalcStyleDuration: number;
  LayoutCount: number;
  RecalcStyleCount: number;
}

export interface LoadMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

// Screenshot and visual testing types
export interface ScreenshotConfig {
  path?: string;
  type?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  omitBackground?: boolean;
  encoding?: 'base64' | 'binary';
}

export interface VisualComparisonResult {
  match: boolean;
  difference: number;
  diffImage?: string;
  threshold: number;
}

// Mobile and device emulation types
export interface DeviceDescriptor {
  name: string;
  userAgent: string;
  viewport: Viewport;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  defaultBrowserType: 'chromium' | 'firefox' | 'webkit';
}

export interface EmulationOptions {
  device?: string | DeviceDescriptor;
  viewport?: Viewport;
  userAgent?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  colorScheme?: 'light' | 'dark' | 'no-preference';
  reducedMotion?: 'reduce' | 'no-preference';
}

// Form interaction types
export interface FormField {
  selector: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  value: string | string[] | boolean;
  label?: string;
  required?: boolean;
  validation?: (value: any) => boolean | string;
}

export interface FormData {
  fields: FormField[];
  submitSelector?: string;
  expectedRedirect?: string;
  expectedMessage?: string;
}

// Error handling types
export interface ErrorContext {
  page: string;
  action: string;
  selector?: string;
  timestamp: number;
  screenshot?: string;
  stackTrace?: string;
}

export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  shouldRetry: (error: Error) => boolean;
}

// Utility types for better type safety
export type ElementSelector = string | ElementHandle;
export type WaitForTarget = string | (() => boolean | Promise<boolean>);
export type EvaluateFunction<T = any> = string | ((this: T, ...args: any[]) => any);

// Browser context types
export interface BrowserContextConfig {
  viewport?: Viewport;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  permissions?: string[];
  extraHTTPHeaders?: Record<string, string>;
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: 'light' | 'dark' | 'no-preference';
  reducedMotion?: 'reduce' | 'no-preference';
  forcedColors?: 'active' | 'none';
}

// WebDriver BiDi specific types
export interface WebDriverBiDiOptions {
  browser: 'chrome' | 'firefox';
  protocol: 'webDriverBiDi';
  capabilities?: Record<string, any>;
  timeouts?: {
    implicit: number;
    pageLoad: number;
    script: number;
  };
}

export interface BiDiEvent {
  method: string;
  params: any;
  timestamp: number;
  context?: string;
}

// Cross-browser testing types
export interface CrossBrowserConfig {
  browsers: Array<{
    name: string;
    config: PuppeteerConfig;
  }>;
  parallel: boolean;
  sharedState?: boolean;
  compareResults?: boolean;
}

export interface CrossBrowserResults {
  browsers: BrowserTestResult[];
  comparison?: {
    identical: boolean;
    differences: string[];
  };
}

// API testing integration types
export interface APITestConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timing: {
    duration: number;
    dns: number;
    connect: number;
    firstByte: number;
    download: number;
  };
}

// Export commonly used Puppeteer types
export type {
  Browser,
  Page,
  ElementHandle,
  JSHandle,
  Frame,
  Target,
  Worker,
  HTTPRequest,
  HTTPResponse,
  Dialog,
  ConsoleMessage,
  Coverage,
  Tracing,
  Accessibility,
  LaunchOptions,
  ConnectOptions,
  BrowserContextOptions,
  Viewport,
  ScreenshotOptions,
  PDFOptions,
  GoToOptions,
  WaitForOptions,
  ClickOptions,
  TypeOptions,
  KeyboardTypeOptions,
  MouseClickOptions,
  TouchscreenTapOptions,
  EvaluateFunc,
  SerializableOrJSHandle,
  Serializable,
  JSONObject
};

// Type guards and utility functions
export function isElementHandle(obj: any): obj is ElementHandle {
  return obj && typeof obj.click === 'function' && typeof obj.type === 'function';
}

export function isPage(obj: any): obj is Page {
  return obj && typeof obj.goto === 'function' && typeof obj.$ === 'function';
}

export function isBrowser(obj: any): obj is Browser {
  return obj && typeof obj.newPage === 'function' && typeof obj.close === 'function';
}

// Configuration validation schemas (for runtime validation)
export const LaunchOptionsSchema = {
  browser: { type: 'string', enum: ['chrome', 'firefox'], default: 'chrome' },
  protocol: { type: 'string', enum: ['cdp', 'webDriverBiDi'], optional: true },
  headless: { type: ['boolean', 'string'], default: true },
  defaultViewport: { type: 'object', optional: true },
  timeout: { type: 'number', min: 0, default: 30000 },
  args: { type: 'array', items: { type: 'string' }, default: [] },
  devtools: { type: 'boolean', optional: true },
  slowMo: { type: 'number', min: 0, optional: true },
  executablePath: { type: 'string', optional: true },
  userDataDir: { type: 'string', optional: true },
  env: { type: 'object', optional: true }
};

export const ViewportSchema = {
  width: { type: 'number', min: 1, max: 32767 },
  height: { type: 'number', min: 1, max: 32767 },
  deviceScaleFactor: { type: 'number', min: 0.1, max: 10, default: 1 },
  isMobile: { type: 'boolean', default: false },
  hasTouch: { type: 'boolean', default: false },
  isLandscape: { type: 'boolean', default: false }
};