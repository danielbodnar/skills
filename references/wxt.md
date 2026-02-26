# WXT Reference

**Always remember to reference @$HOME/.claude/references/wxt.md and look for snippets and examples in @$HOME/.claude/snippets/wxt/**

## Quick Reference

- Installation: `bunx wxt@latest init` or `npx wxt@latest init`
- Package Manager: `bun add -D wxt`
- Import: `import { defineConfig, defineBackground, defineContentScript } from 'wxt'`
- Browser API: `import { browser } from 'wxt/browser'`
- Documentation: <https://wxt.dev/>
- GitHub: <https://github.com/wxt-dev/wxt>
- Package: <https://www.npmjs.com/package/wxt>
- Version: v0.20.7+

## Resources and Documentation

- [WXT Documentation](https://wxt.dev/)
  - [Installation Guide](https://wxt.dev/guide/installation.html)
  - [Getting Started](https://wxt.dev/guide/)
  - [API Reference](https://wxt.dev/api/)
    - [Configuration](https://wxt.dev/api/config/)
    - [Entrypoints](https://wxt.dev/guide/essentials/entrypoints.html)
    - [Content Scripts](https://wxt.dev/guide/essentials/content-scripts.html)
    - [Background Scripts](https://wxt.dev/guide/essentials/background-scripts.html)
  - [Framework Integration](https://wxt.dev/guide/essentials/frontend-frameworks.html)
    - [React Module](https://wxt.dev/guide/essentials/frontend-frameworks.html#react)
    - [Vue Module](https://wxt.dev/guide/essentials/frontend-frameworks.html#vue)
    - [Svelte Module](https://wxt.dev/guide/essentials/frontend-frameworks.html#svelte)
    - [Solid Module](https://wxt.dev/guide/essentials/frontend-frameworks.html#solid)
  - [Manifest Configuration](https://wxt.dev/guide/essentials/config/manifest.html)
  - [TypeScript Configuration](https://wxt.dev/guide/essentials/config/typescript.html)
  - [Unit Testing](https://wxt.dev/guide/essentials/unit-testing.html)
  - [Publishing](https://wxt.dev/guide/essentials/publishing.html)
- [WXT Examples Repository](https://github.com/wxt-dev/examples)
  - [Content Script Examples](https://github.com/wxt-dev/examples/tree/main/examples)
  - [React Examples](https://github.com/wxt-dev/examples/tree/main/examples/react-content-script-ui)
  - [Vue Examples](https://github.com/wxt-dev/examples/tree/main/examples/vue-overlay)
  - [Storage Examples](https://github.com/wxt-dev/examples/tree/main/examples/vue-storage-composable)
- [Community Resources](https://wxt.dev/community/)
  - [Discord Community](https://discord.gg/ZFsZqGery9)
  - [GitHub Discussions](https://github.com/wxt-dev/wxt/discussions)
  - [Contributing Guide](https://github.com/wxt-dev/wxt/blob/main/CONTRIBUTING.md)

## Core Concepts

### Next-Generation Web Extension Framework

- **Modern Development Experience**: Like Nuxt, but for web extensions
- **File-based Architecture**: Convention over configuration approach
- **Framework Agnostic**: Works with React, Vue, Svelte, Solid, or vanilla JavaScript
- **TypeScript First**: Built-in TypeScript support with auto-generated types
- **Hot Module Replacement**: Lightning-fast development with HMR

### Cross-Browser Support

- **Universal Compatibility**: Chrome, Firefox, Edge, Safari support
- **Manifest V2/V3**: Seamless support for both manifest versions
- **Automatic Polyfills**: Built-in browser API normalization
- **Unified Development**: Write once, deploy everywhere

### Developer Experience

- **Auto-imports**: Automatic imports for WXT APIs and utilities
- **Module System**: Reusable code modules and plugins
- **Vite Integration**: Modern build tooling with Vite
- **Extension Publishing**: Automated store submission tools

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/wxt/`:

- **Basic Usage**: Project initialization and configuration
- **Entrypoints**: Background scripts, content scripts, popups
- **Framework Integration**: React, Vue, Svelte examples
- **Storage**: Extension storage patterns
- **Messaging**: Inter-component communication
- **Content Script UI**: Shadow DOM and UI injection
- **Publishing**: Build and deployment workflows
- **Testing**: Unit and E2E testing patterns
- **Advanced Patterns**: Complex extension architectures

## Schema and Type Definitions

Type definitions and configuration schemas in `$HOME/.claude/snippets/wxt/schemas/`:

- **wxt.config.ts**: Complete configuration schema
- **manifest.schema.json**: Extension manifest types
- **entrypoint.types.ts**: Entrypoint type definitions

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/wxt/linting/`:

- **biome.json**: Biome configuration for WXT projects
- **.eslintrc.js**: ESLint configuration with WXT-specific rules

## Key Features and Best Practices

### Project Initialization

- **Quick Start**: Use `bunx wxt@latest init` for new projects
- **Template Selection**: Choose from React, Vue, Svelte, or vanilla templates
- **Package Manager**: Supports npm, pnpm, yarn, and Bun
- **TypeScript by Default**: Full TypeScript support out of the box

### File-Based Entrypoints

- **Entrypoints Directory**: Organize extension parts in `entrypoints/`
- **Automatic Registration**: Files automatically become extension components
- **Type Safety**: Auto-generated types for all entrypoints
- **Manifest Generation**: Automatic manifest.json generation

### Configuration System

- **wxt.config.ts**: Central configuration file
- **Manifest Customization**: Override generated manifest properties
- **Build Options**: Customize build process and outputs
- **Framework Integration**: Easy framework module configuration

### Development Workflow

- **Hot Reloading**: Instant updates during development
- **Browser Startup**: Automatic browser launching with extension
- **Multi-Browser**: Develop for multiple browsers simultaneously
- **Debug Support**: Full debugging capabilities

### Production Ready

- **Automated Building**: Production-ready builds
- **Store Publishing**: Automated Chrome/Firefox store submission
- **Source Maps**: Debug production issues
- **ZIP Generation**: Ready-to-upload extension packages

## Installation and Setup

### Quick Start

```bash
# Initialize new project
bunx wxt@latest init my-extension
cd my-extension

# Install dependencies
bun install

# Start development
bun dev
```

### Manual Installation

```bash
# Add to existing project
bun add -D wxt

# Initialize configuration
bunx wxt prepare
```

### Project Structure

```
my-extension/
├── entrypoints/          # Extension entrypoints
│   ├── background.ts     # Background script
│   ├── popup/            # Popup UI
│   └── content.ts        # Content scripts
├── assets/               # Static assets
├── public/               # Public files
├── wxt.config.ts         # WXT configuration
├── package.json          # Project metadata
└── tsconfig.json         # TypeScript config
```

## Framework Integration Patterns

### React Integration

- **@wxt-dev/module-react**: Official React module
- **Auto-imports**: React hooks and components
- **Shadow DOM Support**: Isolated React apps in content scripts
- **TypeScript**: Full React TypeScript support

### Vue Integration

- **@wxt-dev/module-vue**: Official Vue module
- **Composition API**: Modern Vue 3 patterns
- **Single File Components**: .vue file support
- **Pinia Integration**: State management support

### Svelte Integration

- **@wxt-dev/module-svelte**: Official Svelte module
- **Vite Integration**: Optimized Svelte builds
- **Stores**: Svelte store patterns
- **TypeScript**: SvelteKit-style TypeScript

## Storage and State Management

### WXT Storage

- **@wxt-dev/storage**: Type-safe extension storage
- **Area Support**: sync, local, session, managed storage
- **Bulk Operations**: Efficient multi-item operations
- **Metadata**: Storage item metadata tracking
- **Reactive**: Watch storage changes

### Cross-Context Communication

- **Message Passing**: Type-safe message systems
- **Runtime Messaging**: Background ↔ content script communication
- **Port Connections**: Long-lived connections
- **Tab Communication**: Cross-tab messaging

## Testing Strategies

### Unit Testing

- **Vitest Integration**: Modern test runner
- **WxtVitest Plugin**: Extension-specific test utilities
- **Mock Browser APIs**: Fake browser environment
- **Component Testing**: Test React/Vue components

### E2E Testing

- **@wxt-dev/runner**: Programmatic browser control
- **Playwright Support**: Full E2E testing
- **Extension Installation**: Automated extension loading
- **Cross-Browser Testing**: Test multiple browsers

## Publishing and Deployment

### Build Process

- **Multi-Target Builds**: Chrome, Firefox, Safari builds
- **Source Maps**: Debug production issues
- **Asset Optimization**: Minimized bundles
- **Manifest Generation**: Version-specific manifests

### Store Submission

- **Automated Publishing**: CLI store submission
- **Chrome Web Store**: Automated Chrome uploads
- **Firefox Add-ons**: AMO submission support
- **CI/CD Integration**: GitHub Actions workflows

## Advanced Features

### Module System

- **WXT Modules**: Reusable functionality
- **Plugin Architecture**: Extend WXT capabilities
- **Community Modules**: Third-party integrations
- **Custom Modules**: Build your own modules

### Vite Integration

- **Plugin Support**: Any Vite plugin works
- **Build Optimization**: Tree shaking, code splitting
- **Asset Processing**: Image, CSS, font optimization
- **Development Server**: Fast dev builds

### Browser API Access

- **Unified Browser API**: Cross-browser compatibility
- **Type Definitions**: Full TypeScript types
- **Feature Detection**: Runtime capability checking
- **Polyfill System**: Automatic API normalization

## Performance Optimization

### Bundle Optimization

- **Tree Shaking**: Remove unused code
- **Code Splitting**: Optimize loading
- **Dynamic Imports**: Lazy load features
- **Asset Optimization**: Compress images and fonts

### Runtime Performance

- **Lazy Loading**: Load components on demand
- **Memory Management**: Efficient resource usage
- **Background Efficiency**: Minimize background impact
- **Content Script Optimization**: Reduce page impact

## Security Best Practices

### Content Security Policy

- **CSP Configuration**: Secure manifest settings
- **Inline Script Restrictions**: Avoid inline code
- **Resource Loading**: Secure asset loading
- **API Permissions**: Minimal permission requests

### Extension Security

- **Input Sanitization**: Prevent XSS attacks
- **API Validation**: Secure message handling
- **Dependency Auditing**: Regular security updates
- **Permission Auditing**: Minimize requested permissions

## Migration and Upgrading

### From Other Frameworks

- **Webpack Extensions**: Migration guide available
- **Vanilla Extensions**: Easy conversion process
- **Legacy Projects**: Incremental adoption
- **Build Tool Migration**: Replace existing toolchains

### Version Updates

- **Breaking Changes**: Documented migration paths
- **Automated Updates**: CLI update assistance
- **Compatibility**: Backward compatibility support
- **Best Practices**: Updated patterns and recommendations

## Troubleshooting

### Common Issues

- **Build Errors**: Configuration troubleshooting
- **Hot Reload**: Development server issues
- **Browser Compatibility**: Cross-browser problems
- **TypeScript**: Type definition issues

### Debug Tools

- **Development Mode**: Enhanced debugging
- **Source Maps**: Production debugging
- **Browser DevTools**: Extension debugging
- **Console Logging**: Structured logging

### Performance Issues

- **Bundle Analysis**: Size optimization
- **Memory Leaks**: Resource cleanup
- **Hot Reload Slowness**: Development optimization
- **Build Times**: Configuration tuning

## See Also

- Complete reference: `@$HOME/.claude/references/wxt.md`
- Code examples: `@$HOME/.claude/snippets/wxt/`
- Schemas: `@$HOME/.claude/snippets/wxt/schemas/`
- Linting configs: `@$HOME/.claude/snippets/wxt/linting/`
