# Astro Reference

**Always remember to reference @$HOME/.claude/references/astro.md and look for snippets and examples in @$HOME/.claude/snippets/astro/**

## Quick Reference

- Installation: `bun add astro`
- Create project: `bun create astro@latest`
- Development: `bun dev`
- Build: `bun build`
- Documentation: <https://docs.astro.build/>
- GitHub: <https://github.com/withastro/astro>
- Package: <https://www.npmjs.com/package/astro>

## Resources and Documentation

- [Astro Documentation](https://docs.astro.build/)
  - [Getting Started](https://docs.astro.build/en/getting-started/)
  - [Installation](https://docs.astro.build/en/install/auto/)
  - [Project Structure](https://docs.astro.build/en/core-concepts/project-structure/)
  - [API Reference](https://docs.astro.build/en/reference/api-reference/)
    - [Astro Global](https://docs.astro.build/en/reference/api-reference/#astro-global)
    - [Configuration](https://docs.astro.build/en/reference/configuration-reference/)
    - [CLI Commands](https://docs.astro.build/en/reference/cli-reference/)
    - [Integrations](https://docs.astro.build/en/reference/integrations-reference/)
  - [Guides](https://docs.astro.build/en/guides/)
    - [Content Collections](https://docs.astro.build/en/guides/content-collections/)
    - [TypeScript](https://docs.astro.build/en/guides/typescript/)
    - [Routing](https://docs.astro.build/en/guides/routing/)
    - [Middleware](https://docs.astro.build/en/guides/middleware/)
    - [Styling](https://docs.astro.build/en/guides/styling/)
    - [Imports](https://docs.astro.build/en/guides/imports/)
    - [Server-side Rendering](https://docs.astro.build/en/guides/server-side-rendering/)
  - [Recipes](https://docs.astro.build/en/recipes/)
    - [Build Forms](https://docs.astro.build/en/recipes/build-forms/)
    - [Making Toolbar Apps](https://docs.astro.build/en/recipes/making-toolbar-apps/)
    - [Using Bun](https://docs.astro.build/en/recipes/bun/)
  - [Integrations Guide](https://docs.astro.build/en/guides/integrations-guide/)
    - [MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/)
    - [Markdoc](https://docs.astro.build/en/guides/integrations-guide/markdoc/)
    - [Netlify](https://docs.astro.build/en/guides/integrations-guide/netlify/)
- [Community Resources](https://astro.build/integrations/)
  - [Awesome Astro](https://github.com/one-aalam/awesome-astro)
  - [Astro Themes](https://astro.build/themes/)
  - [Astro Showcase](https://astro.build/showcase/)
- [CMS Integrations](https://docs.astro.build/en/guides/cms/)
  - [Ghost](https://docs.astro.build/en/guides/cms/ghost/)
  - [Strapi](https://docs.astro.build/en/guides/cms/strapi/)
  - [Payload](https://docs.astro.build/en/guides/cms/payload/)
  - [Kontent.ai](https://docs.astro.build/en/guides/cms/kontent-ai/)
  - [Keystatic](https://docs.astro.build/en/guides/cms/keystatic/)
  - [Flotiq](https://docs.astro.build/en/guides/cms/flotiq/)
  - [Supabase](https://docs.astro.build/en/guides/backend/supabase/)

## Key Features

- **Server-first Rendering**: Renders HTML on the server for optimal performance
- **Zero JavaScript by Default**: Ships minimal JavaScript unless explicitly required
- **Astro Islands**: Selective hydration for interactive components
- **Content Collections**: Type-safe content management with Zod schemas
- **Multi-framework Support**: Use React, Vue, Svelte, Solid, Preact together
- **View Transitions**: Built-in smooth page transitions
- **TypeScript Support**: First-class TypeScript integration
- **Flexible Routing**: File-based routing with dynamic routes
- **Middleware Support**: Server-side request/response processing
- **Build Optimizations**: Automatic code splitting and asset optimization

## Core Concepts

- **Components**: `.astro` files with component script and template
- **Pages**: Components in `src/pages/` that generate routes
- **Layouts**: Reusable page templates
- **Islands**: Client-side interactive components
- **Content Collections**: Structured content with type safety
- **Loaders**: Data fetching from various sources
- **Adapters**: Deploy to different hosting platforms

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/astro/`:

- Basic usage patterns and project setup
- Content collections with various loaders
- Component development and island patterns
- TypeScript integration and type safety
- Routing and dynamic pages
- Styling and CSS approaches
- Integration with UI frameworks
- API routes and server endpoints
- Middleware and authentication
- Build and deployment configurations

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/astro/schemas/`

- Content collection schemas with Zod
- TypeScript interfaces for Astro globals
- API route type definitions
- Integration and plugin types

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/astro/linting/`

- ESLint configuration for Astro
- Biome configuration for modern linting
- TypeScript strict mode settings
- Prettier configuration for formatting

## Performance Features

- **Core Web Vitals**: 61% passing rate vs 24-45% for other frameworks
- **Minimal JavaScript**: Only loads JS for interactive components
- **Optimized Images**: Automatic image optimization and lazy loading
- **Code Splitting**: Automatic bundling and splitting
- **Prefetching**: Intelligent route prefetching
- **Caching**: Built-in asset caching strategies

## Deployment Adapters

- Static (default): Pre-built HTML files
- Node.js: Server-side rendering
- Netlify: Serverless functions
- Vercel: Edge functions
- Cloudflare: Workers
- Deno: Deno Deploy

## Latest Features (v5.0+)

- **Content Layer API**: Enhanced content management
- **Astro Actions**: Server-side form handling
- **Live Collections**: Runtime content updates
- **Container API**: Programmatic component rendering
- **Dev Toolbar**: Enhanced development experience
- **Experimental Features**: Content intellisense, live content collections

## Migration Notes

- v5.0 uses `.astro/types.d.ts` instead of `src/env.d.ts`
- Content collections migrated to new Content Layer API
- Improved TypeScript support with stricter types
- Enhanced error handling and debugging
