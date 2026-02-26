# Rule: No React

**React is not used in this environment.**

## Rejected Packages

- `react`, `react-dom`, `react-native`
- `next`, `next.js`, `gatsby`, `remix`
- `@types/react`, `@types/react-dom`
- `create-react-app`, `react-scripts`

## Required Alternatives

| Instead of | Use |
|------------|-----|
| React | Vue 3+, Svelte, SolidJS, Lit, Alpine.js |
| Next.js | Astro, Nuxt |
| React Native | Capacitor, native platforms |
| JSX (React) | Vue SFC, Svelte components, Astro components |

## Frontend Stack

- **Static sites**: Astro with Starlight
- **SPAs**: Vue 3 with Composition API
- **Components**: shadcn-vue, Radix Vue
- **SSR**: Nuxt
