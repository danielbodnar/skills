// Presetter Testing Configuration Examples
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';

// 1. Vitest configuration with Presetter
export default preset('testing-app', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      vitest: '^2.0.0',
      '@vitest/ui': '^2.0.0',
      '@vitest/coverage-v8': '^2.0.0',
      jsdom: '^25.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/user-event': '^14.0.0'
    }
  },
  override: {
    'vitest.config.ts': {
      import: "import { defineConfig } from 'vitest/config';",
      export: `export default defineConfig({
        test: {
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/tests/setup.ts'],
          coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
              'node_modules/',
              'dist/',
              '**/*.d.ts',
              '**/*.config.{js,ts}',
              '**/types.ts'
            ]
          },
          typecheck: {
            checker: 'tsc'
          }
        }
      });`
    },
    
    'package.json': {
      scripts: {
        'test': 'vitest',
        'test:ui': 'vitest --ui',
        'test:run': 'vitest run',
        'test:coverage': 'vitest --coverage',
        'test:watch': 'vitest --watch'
      }
    }
  },
  
  templates: {
    'src/tests/setup.ts': `import '@testing-library/jest-dom';

// Global test setup
beforeEach(() => {
  // Reset any mocks
  vi.clearAllMocks();
});

// Mock window.matchMedia for CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});`,

    'src/tests/utils.ts': `import { render, type RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };`,

    'src/tests/mocks/handlers.ts': `import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock API endpoints
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ]);
  }),
  
  http.post('/api/users', async ({ request }) => {
    const user = await request.json();
    return HttpResponse.json(
      { id: 3, ...user },
      { status: 201 }
    );
  })
];`,

    'src/tests/mocks/browser.ts': `import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);`,

    'src/tests/mocks/server.ts': `import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);`
  }
});

// 2. React Testing Library with Presetter
export const reactTestingPreset = preset('react-testing', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@testing-library/react': '^16.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/user-event': '^14.0.0',
      'msw': '^2.0.0'
    }
  },
  
  templates: {
    'src/components/__tests__/Button.test.tsx': `import { render, screen, fireEvent } from '../tests/utils';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});`,

    'src/hooks/__tests__/useCounter.test.ts': `import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should initialize with 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });
});`
  }
});

// 3. E2E Testing with Playwright
export const playwrightTestingPreset = preset('e2e-testing', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@playwright/test': '^1.40.0'
    }
  },
  
  override: {
    'playwright.config.ts': `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});`,

    'package.json': {
      scripts: {
        'test:e2e': 'playwright test',
        'test:e2e:ui': 'playwright test --ui',
        'test:e2e:debug': 'playwright test --debug'
      }
    }
  },
  
  templates: {
    'tests/e2e/example.spec.ts': `import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  await expect(page).toHaveTitle(/My App/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  await page.click('text=About');
  await expect(page).toHaveURL('/about');
  await expect(page.getByText('About Page')).toBeVisible();
});`
  }
});

// 4. Test utilities and helpers
export const testUtilitiesPreset = preset('test-utilities', {
  extends: [esm],
  
  templates: {
    'src/tests/factories.ts': `// Test data factories
export const createUser = (overrides = {}) => ({
  id: Math.random().toString(36),
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
  ...overrides
});

export const createPost = (overrides = {}) => ({
  id: Math.random().toString(36),
  title: 'Test Post',
  content: 'This is a test post content.',
  authorId: 'user-1',
  publishedAt: new Date().toISOString(),
  ...overrides
});`,

    'src/tests/custom-matchers.ts': `import { expect } from 'vitest';

// Custom matcher for testing API responses
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && 
      typeof received === 'object' && 
      'data' in received &&
      'status' in received;
    
    return {
      pass,
      message: () => 
        pass 
          ? \`Expected \${received} not to be a valid API response\`
          : \`Expected \${received} to be a valid API response with data and status\`
    };
  }
});

// Extend the expect interface
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidApiResponse(): T;
  }
}`,

    'src/tests/test-providers.tsx': `import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface TestProvidersProps {
  children: ReactNode;
}

export function TestProviders({ children }: TestProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}`
  }
});