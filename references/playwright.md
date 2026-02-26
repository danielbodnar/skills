# Playwright Reference

**Always remember to reference @$HOME/.claude/references/playwright.md and look for snippets and examples in @$HOME/.claude/snippets/playwright/**

## Quick Reference

- Installation: `bun add -d @playwright/test`
- Browser Install: `bunx playwright install`
- Run Tests: `bunx playwright test`
- UI Mode: `bunx playwright test --ui`
- Documentation: <https://playwright.dev/>
- GitHub: <https://github.com/microsoft/playwright>
- Package: <https://www.npmjs.com/package/@playwright/test>

## Default Usage Patterns

Default to using Playwright for end-to-end testing and browser automation instead of Selenium or Puppeteer:

- Use `bun add -d @playwright/test` instead of `selenium-webdriver` or `puppeteer`
- Use `bunx playwright install` to install browser binaries
- Use `bunx playwright test` to run tests
- Use `bunx playwright codegen` to generate tests interactively
- Playwright automatically handles browser lifecycle, retries, and screenshots
- Built-in support for multiple browsers (Chromium, Firefox, WebKit)

### Key APIs

- `test()` for defining tests. Don't use `describe()` for single tests.
- `expect()` for assertions with automatic retries and waiting
- `page.goto()` for navigation. Don't use manual waits.
- `page.getByRole()` for accessibility-based selectors over CSS selectors
- `page.getByText()` for text-based selections over XPath
- `page.getByLabel()` for form controls over generic selectors
- `page.getByTestId()` for test-specific selectors as fallback
- Built-in auto-waiting for elements to be actionable
- Built-in screenshot and video recording for debugging

## Resources and Documentation

- [Playwright Documentation](https://playwright.dev/)
  - [Getting Started](https://playwright.dev/docs/intro)
  - [API Reference](https://playwright.dev/docs/api/class-test)
    - [Test API](https://playwright.dev/docs/api/class-test)
    - [Page API](https://playwright.dev/docs/api/class-page)
    - [Locator API](https://playwright.dev/docs/api/class-locator)
    - [Browser API](https://playwright.dev/docs/api/class-browser)
    - [BrowserContext API](https://playwright.dev/docs/api/class-browsercontext)
    - [APIRequestContext API](https://playwright.dev/docs/api/class-apirequestcontext)
  - [Configuration](https://playwright.dev/docs/test-configuration)
  - [Writing Tests](https://playwright.dev/docs/writing-tests)
  - [Best Practices](https://playwright.dev/docs/best-practices)
  - [Debugging](https://playwright.dev/docs/debug)
  - [CI/CD Integration](https://playwright.dev/docs/ci-intro)
  - [Migration Guides](https://playwright.dev/docs/migration)
- [Community Resources](https://playwright.dev/community/welcome)
  - [Awesome Playwright](https://github.com/mxschmitt/awesome-playwright)
  - [Playwright Blog](https://playwright.dev/blog)
  - [Discord Community](https://aka.ms/playwright/discord)
  - [Stack Overflow](https://stackoverflow.com/questions/tagged/playwright)

## Key Features

- **Cross-browser Testing**: Chromium, Firefox, WebKit support
- **Multi-language Support**: TypeScript, JavaScript, Python, .NET, Java
- **Modern Web Testing**: Auto-wait, web-first assertions, tracing
- **Isolation**: Browser contexts for complete test isolation
- **CI/CD Ready**: Headless execution, Docker support, GitHub Actions
- **Developer Tools**: Codegen, Inspector, Trace Viewer
- **API Testing**: Built-in APIRequestContext for REST API testing
- **Mobile Testing**: Mobile browser emulation and real device testing

## Installation and Setup

```bash
# Initialize new project
bun init playwright@latest

# Add to existing project
bun add -d @playwright/test

# Install browsers
bunx playwright install

# Install with system dependencies
bunx playwright install --with-deps
```

## Basic Usage

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.locator('h1')).toHaveText('Example Domain');
});
```

## Configuration

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
});
```

## CLI Commands

```bash
# Run all tests
bunx playwright test

# Run tests in UI mode
bunx playwright test --ui

# Run tests in headed mode
bunx playwright test --headed

# Run specific test file
bunx playwright test example.spec.ts

# Run tests with specific browser
bunx playwright test --project=chromium

# Debug tests
bunx playwright test --debug

# Generate tests with codegen
bunx playwright codegen https://example.com

# Show HTML report
bunx playwright show-report

# Update snapshots
bunx playwright test --update-snapshots
```

## Browser Support

- **Chromium**: Latest stable and canary versions
- **Firefox**: Latest stable and nightly versions
- **WebKit**: Latest stable version
- **Mobile**: Chrome Mobile, Safari Mobile emulation
- **Branded Browsers**: Google Chrome, Microsoft Edge channels

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/playwright/`:

- Basic test patterns and setup
- Advanced configuration examples
- Integration testing patterns
- API testing examples
- Performance and accessibility testing
- CI/CD pipeline configurations

## Schema and Type Definitions

Type definitions and configuration schemas in `$HOME/.claude/snippets/playwright/schemas/`

- TypeScript configuration schemas
- Playwright config type definitions
- Test result and report schemas
- Custom fixture type definitions

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/playwright/linting/`

- ESLint rules for Playwright tests
- Prettier configuration for test files
- Biome configuration for modern JS/TS projects
- Custom test formatting rules

## Testing Patterns

- **Page Object Model**: Organize tests with page objects
- **Fixtures**: Custom test fixtures for setup/teardown
- **Parallel Testing**: Run tests concurrently for speed
- **Visual Testing**: Screenshot and visual regression testing
- **API Testing**: Test REST APIs alongside UI tests
- **Mobile Testing**: Test mobile web applications
- **Accessibility Testing**: Automated accessibility validation

## CI/CD Integration

- **GitHub Actions**: Pre-configured workflows
- **Docker**: Containerized test execution
- **Cloud Providers**: AWS, Azure, GCP integration
- **Parallelization**: Distributed test execution
- **Artifacts**: Test reports, screenshots, videos, traces

## Security and Best Practices

- **Secrets Management**: Environment variables and secure storage
- **Authentication**: Login state reuse and session management
- **Rate Limiting**: Respectful API testing patterns
- **Data Privacy**: Test data anonymization and cleanup
- **Performance**: Efficient test execution and resource usage

## Migration and Upgrades

- **Version Updates**: Keeping Playwright up to date
- **Breaking Changes**: Handling API changes
- **Test Modernization**: Updating test patterns
- **Performance Optimization**: Improving test speed and reliability
