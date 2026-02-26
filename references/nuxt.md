# Nuxt Reference

**Always remember to reference @$HOME/.claude/references/nuxt.md and look for snippets and examples in @$HOME/.claude/snippets/nuxt/**

## Quick Reference

- Installation: `bun create nuxt@latest <project-name>` or `npm create nuxt@latest <project-name>`
- Import: Auto-imports for composables, components, and utilities
- Documentation: [https://nuxt.com/docs](https://nuxt.com/docs)
- GitHub: [https://github.com/nuxt/nuxt](https://github.com/nuxt/nuxt)
- Package: [https://www.npmjs.com/package/nuxt](https://www.npmjs.com/package/nuxt)

## Resources and Documentation

- [Nuxt Documentation](https://nuxt.com/docs)
  - [Getting Started](https://nuxt.com/docs/getting-started)
  - [Guide](https://nuxt.com/docs/guide)
    - [Concepts](https://nuxt.com/docs/guide/concepts)
      - [Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports)
      - [Server-Side Rendering](https://nuxt.com/docs/guide/concepts/rendering)
      - [Vue with Nuxt](https://nuxt.com/docs/guide/concepts/vuejs-development)
    - [Directory Structure](https://nuxt.com/docs/guide/directory-structure)
      - [Components](https://nuxt.com/docs/guide/directory-structure/components)
      - [Composables](https://nuxt.com/docs/guide/directory-structure/composables)
      - [Pages](https://nuxt.com/docs/guide/directory-structure/pages)
      - [Server](https://nuxt.com/docs/guide/directory-structure/server)
      - [Modules](https://nuxt.com/docs/guide/directory-structure/modules)
    - [Going Further](https://nuxt.com/docs/guide/going-further)
      - [Modules](https://nuxt.com/docs/guide/going-further/modules)
      - [Custom Routing](https://nuxt.com/docs/guide/going-further/custom-routing)
      - [Experimental Features](https://nuxt.com/docs/guide/going-further/experimental-features)
  - [API Reference](https://nuxt.com/docs/api)
    - [Components](https://nuxt.com/docs/api/components)
    - [Composables](https://nuxt.com/docs/api/composables)
    - [Utils](https://nuxt.com/docs/api/utils)
    - [Kit](https://nuxt.com/docs/api/kit)
    - [Configuration](https://nuxt.com/docs/api/nuxt-config)
  - [Migration](https://nuxt.com/docs/migration)
  - [Bridge](https://nuxt.com/docs/bridge)
- [Community Resources](https://nuxt.com/community)
  - [Modules](https://nuxt.com/modules)
  - [Examples](https://nuxt.com/examples)
  - [Discord](https://chat.nuxt.dev)
  - [GitHub Discussions](https://github.com/nuxt/nuxt/discussions)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/nuxt/`:

- Basic project setup and configuration
- Component development patterns
- Server-side rendering and API routes
- Data fetching with composables
- Module development
- Testing patterns
- Performance optimizations
- Deployment configurations

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/nuxt/schemas/`

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/nuxt/linting/`

## Core Concepts

### Framework Features

- **Vue 3 Framework**: Built on Vue 3 with Composition API support
- **Server-Side Rendering (SSR)**: Full SSR support with hydration
- **Static Site Generation (SSG)**: Generate static sites for deployment
- **Hybrid Rendering**: Mix SSR, SSG, and client-side rendering per route
- **Auto-imports**: Automatic imports for composables, components, and utilities
- **File-based Routing**: Automatic route generation from file structure
- **TypeScript**: First-class TypeScript support
- **Zero Configuration**: Works out of the box with sensible defaults

### Project Structure

- `pages/` - File-based routing system
- `components/` - Vue components with auto-import
- `composables/` - Reusable composition functions
- `server/` - Server-side API routes and middleware
- `plugins/` - Vue plugins and Nuxt plugins
- `middleware/` - Route middleware
- `layouts/` - Application layouts
- `public/` - Static assets
- `assets/` - Build-time assets

### Runtime and Build

- **Development**: Fast HMR with Vite
- **Production**: Optimized builds with code splitting
- **Nitro**: Modern server engine
- **Bun Support**: Compatible with Bun runtime
- **Edge Deployment**: Deploy to edge platforms

### Module System

- **200+ Modules**: Rich ecosystem of community modules
- **Module Development**: Create custom modules with Nuxt Kit
- **Plugin Architecture**: Extend functionality with plugins
- **Auto-installation**: Modules can auto-configure dependencies

## Key APIs and Composables

### Data Fetching

- `useFetch()` - Fetch data with SSR support
- `useAsyncData()` - Advanced async data handling
- `useLazyFetch()` - Non-blocking data fetching
- `useLazyAsyncData()` - Lazy async data loading
- `$fetch()` - Universal fetch API

### Navigation and Routing

- `useRoute()` - Access current route information
- `useRouter()` - Programmatic navigation
- `navigateTo()` - Navigate between pages
- `definePageMeta()` - Define page metadata

### State Management

- `useState()` - Reactive shared state
- `useRuntimeConfig()` - Access runtime configuration
- `useAppConfig()` - Access app configuration
- `useCookie()` - Cookie management

### SEO and Meta

- `useHead()` - Manage document head
- `useSeoMeta()` - SEO meta tags
- `useServerSeoMeta()` - Server-only SEO meta

### Server-Side

- `defineEventHandler()` - Create API routes
- `useStorage()` - Server storage access
- `sendRedirect()` - Server redirects
- `setResponseStatus()` - HTTP status codes

## Configuration

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  // Basic configuration
  ssr: true,
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss'],
  
  // Runtime configuration
  runtimeConfig: {
    apiSecret: '',
    public: {
      apiBase: '/api'
    }
  },
  
  // Route rules for hybrid rendering
  routeRules: {
    '/': { prerender: true },
    '/admin/**': { ssr: false },
    '/api/**': { cors: true }
  },
  
  // Component configuration
  components: {
    global: true,
    dirs: ['~/components']
  },
  
  // Experimental features
  experimental: {
    asyncContext: true,
    componentIslands: true
  }
})
```

### Environment Variables

- `NUXT_` prefix for runtime config
- `NUXT_PUBLIC_` prefix for public config
- `.env` file support
- Development vs production configs

## Development Patterns

### Component Development

- Auto-import from `components/` directory
- TypeScript support with `<script setup lang="ts">`
- Server components with `.server.vue`
- Client components with `.client.vue`
- Island components with `.island.vue`

### Data Fetching Patterns

- Use `useFetch()` for API calls
- Implement proper error handling
- Leverage caching strategies
- Handle loading states

### Module Development

- Use `defineNuxtModule()` for modules
- Implement proper TypeScript support
- Add configuration schemas
- Provide good developer experience

### Testing

- Unit tests with Vitest
- End-to-end tests with Playwright
- Component testing
- API testing

## Performance Optimization

### Build Optimization

- Code splitting
- Tree shaking
- Bundle analysis
- Image optimization

### Runtime Performance

- Route-level code splitting
- Lazy loading
- Caching strategies
- Service worker support

### SEO Optimization

- Server-side rendering
- Meta tag management
- Structured data
- Sitemap generation

## Deployment

### Static Hosting

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages

### Server Hosting

- Node.js servers
- Docker containers
- Serverless functions
- Edge platforms

### Hybrid Deployment

- Mix static and dynamic routes
- CDN optimization
- Database integration
- API gateway patterns

## Migration and Compatibility

### Nuxt 2 to Nuxt 3

- Use Nuxt Bridge for gradual migration
- Update composition API usage
- Migrate plugins and modules
- Update configuration format

### Vue 2 to Vue 3

- Composition API migration
- Breaking changes handling
- Plugin compatibility
- Dependency updates

## Security

### Best Practices

- Runtime config for secrets
- CSRF protection
- XSS prevention
- Content Security Policy

### Authentication

- JWT handling
- Session management
- OAuth integration
- Role-based access

## Troubleshooting

### Common Issues

- Hydration mismatches
- Auto-import conflicts
- Module compatibility
- Build errors

### Debugging

- Development tools
- Source maps
- Error reporting
- Performance monitoring

## Extensions and Modules

### Popular Modules

- `@nuxtjs/tailwindcss` - Tailwind CSS integration
- `@pinia/nuxt` - State management
- `@nuxt/content` - Content management
- `@nuxt/image` - Image optimization
- `@nuxtjs/i18n` - Internationalization
- `@sidebase/nuxt-auth` - Authentication
- `@nuxt/ui` - UI component library

### Module Categories

- UI frameworks
- Database integrations
- Authentication providers
- Analytics tools
- Development utilities
