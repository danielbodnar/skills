# Vue.js Reference

**Always remember to reference @$HOME/.claude/references/vue.md and look for snippets and examples in @$HOME/.claude/snippets/vue/**

## Quick Reference

- Installation: `bun add vue`
- Create project: `bun create vue@latest`
- Development: `bun dev`
- Build: `bun build`
- Documentation: <https://vuejs.org/>
- GitHub: <https://github.com/vuejs/core>
- Package: <https://www.npmjs.com/package/vue>

## Resources and Documentation

- [Vue.js Documentation](https://vuejs.org/)
  - [Getting Started](https://vuejs.org/guide/quick-start.html)
  - [Guide](https://vuejs.org/guide/)
    - [Essentials](https://vuejs.org/guide/essentials/application.html)
    - [Components In-Depth](https://vuejs.org/guide/components/registration.html)
    - [Reusability](https://vuejs.org/guide/reusability/composables.html)
    - [Built-in Components](https://vuejs.org/guide/built-ins/transition.html)
    - [Scaling Up](https://vuejs.org/guide/scaling-up/routing.html)
    - [Best Practices](https://vuejs.org/guide/best-practices/production-deployment.html)
  - [API Reference](https://vuejs.org/api/)
    - [Composition API](https://vuejs.org/api/composition-api-setup.html)
    - [Options API](https://vuejs.org/api/options-state.html)
    - [Built-in Components](https://vuejs.org/api/built-in-components.html)
    - [Single-File Components](https://vuejs.org/api/sfc-spec.html)
    - [Advanced APIs](https://vuejs.org/api/advanced-reactivity.html)
  - [Tutorial](https://vuejs.org/tutorial/)
  - [Examples](https://vuejs.org/examples/)
  - [Style Guide](https://vuejs.org/style-guide/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia (State Management)](https://pinia.vuejs.org/)
- [VueUse (Composition Utilities)](https://vueuse.org/)
- [Vuetify (Component Framework)](https://vuetifyjs.com/)
- [Quasar Framework](https://quasar.dev/)
- [Nuxt.js (Full-stack Framework)](https://nuxt.com/)
- [Vite (Build Tool)](https://vitejs.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vue DevTools](https://devtools.vuejs.org/)

## Key Features

- **Progressive Framework**: Incrementally adoptable, can be used for part of a page or entire applications
- **Reactive System**: Declarative reactivity with automatic dependency tracking
- **Component-Based**: Encapsulated components with their own state and logic
- **Composition API**: Flexible logic composition and reuse (Vue 3+)
- **Options API**: Classic object-based component definition
- **Single-File Components**: Combine template, script, and style in one file
- **TypeScript Support**: First-class TypeScript integration
- **Performance**: Optimized virtual DOM with compile-time optimizations
- **Developer Experience**: Excellent tooling and debugging support

## Core Concepts

- **Reactivity**: Automatic dependency tracking and updates
- **Templates**: Declarative syntax with directives and interpolation
- **Components**: Reusable UI building blocks
- **Props**: Data flow from parent to child components
- **Events**: Communication from child to parent components
- **Slots**: Content distribution mechanism
- **Directives**: Special attributes for DOM manipulation
- **Lifecycle Hooks**: Component lifecycle management
- **Computed Properties**: Derived reactive data
- **Watchers**: React to data changes

## Architecture Patterns

- **Options API**: Traditional object-based component definition
- **Composition API**: Function-based logic composition (recommended for Vue 3+)
- **Single-File Components (SFC)**: `.vue` files with template, script, and style
- **Render Functions**: Programmatic template creation with `h()` function
- **JSX**: React-like syntax support
- **Functional Components**: Stateless components for performance

## State Management

- **Local State**: Component-level reactive data
- **Props/Events**: Parent-child communication
- **Provide/Inject**: Dependency injection for deeply nested components
- **Pinia**: Official state management library (recommended)
- **Vuex**: Legacy state management (Vue 2/3)
- **Global State**: Simple reactive objects for shared state

## Build Tools and Ecosystem

- **Vite**: Fast build tool and dev server (recommended)
- **Vue CLI**: Webpack-based tooling (legacy)
- **Nuxt.js**: Full-stack Vue framework
- **Quasar**: Cross-platform Vue framework
- **VitePress**: Static site generator
- **Vue Test Utils**: Official testing utilities

## TypeScript Integration

- **defineComponent()**: Enhanced type inference for Options API
- **Script Setup**: Type-safe Composition API with `<script setup lang="ts">`
- **Props Typing**: Runtime and type-based prop declarations
- **Emit Typing**: Type-safe event emission
- **Template Refs**: Type-safe DOM element access
- **Generic Components**: Reusable components with type parameters

## Performance Features

- **Virtual DOM**: Efficient rendering with minimal DOM updates
- **Compile-time Optimizations**: Static hoisting and patch flag generation
- **Tree-shaking**: Dead code elimination
- **Lazy Loading**: Code splitting with dynamic imports
- **Server-Side Rendering**: Pre-rendered HTML for better performance
- **Hydration**: Client-side takeover of server-rendered content

## Development Tools

- **Vue DevTools**: Browser extension for debugging
- **Volar**: VS Code extension for Vue 3 support
- **Vue Language Server**: Language support for IDEs
- **ESLint Plugin**: Code quality and style enforcement
- **Prettier**: Code formatting

## Latest Features (Vue 3.5+)

- **Reactivity Transform**: Compile-time reactivity (experimental)
- **Script Setup**: Simplified Composition API syntax
- **Suspense**: Async component handling
- **Teleport**: Render content outside component tree
- **Multiple Root Nodes**: Fragment support
- **Custom Directives**: Enhanced directive API
- **Composition API Improvements**: Better TypeScript support

## Migration Notes

- **Vue 2 to Vue 3**: Breaking changes in reactivity system and API
- **Options API**: Still supported in Vue 3 for backward compatibility
- **Composition API**: Recommended for new Vue 3 projects
- **Build Tools**: Migrate from Vue CLI to Vite for better performance
- **State Management**: Migrate from Vuex to Pinia

## Browser Support

- **Vue 3**: Modern browsers (ES2015+)
- **Vue 2**: IE11+ (with polyfills)
- **Progressive Enhancement**: Works without JavaScript for basic content

## Community and Learning

- **Awesome Vue**: Curated list of Vue resources
- **Vue.js Forums**: Official community discussion
- **Discord**: Real-time chat support
- **Vue Mastery**: Premium Vue training
- **Vue School**: Video courses and tutorials

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/vue/`:

- Basic usage patterns and project setup
- Composition API examples and patterns
- Options API examples and migration
- Component development and communication
- State management with Pinia
- Routing with Vue Router
- TypeScript integration
- Testing strategies
- Performance optimization
- Build and deployment configurations

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/vue/schemas/`

- Component type definitions
- Props and emit interfaces
- Composition API types
- Router and store types

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/vue/linting/`

- ESLint configuration for Vue 3
- Biome configuration for modern linting
- Vue-specific linting rules
- TypeScript strict mode settings
