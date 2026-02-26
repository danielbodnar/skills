# Theme UI Reference

**Always remember to reference @$HOME/.claude/references/theme-ui.md and look for snippets and examples in @$HOME/.claude/snippets/theme-ui/**

## Quick Reference

- Installation: `bun add theme-ui @emotion/react`
- Import: `import { ThemeUIProvider, Box, useThemeUI } from 'theme-ui'`
- Documentation: <https://theme-ui.com>
- GitHub: <https://github.com/system-ui/theme-ui>
- Package: <https://www.npmjs.com/package/theme-ui>

## Resources and Documentation

- [Theme UI Documentation](https://theme-ui.com)
  - [Getting Started](https://theme-ui.com/getting-started)
  - [Theme Specification](https://theme-ui.com/theme-spec)
    - [Colors](https://theme-ui.com/theme-spec#colors)
    - [Typography](https://theme-ui.com/theme-spec#typography)
    - [Layout](https://theme-ui.com/theme-spec#layout)
    - [Responsive](https://theme-ui.com/theme-spec#responsive)
  - [API Reference](https://theme-ui.com/components)
    - [ThemeUIProvider](https://theme-ui.com/components/theme-provider)
    - [Box](https://theme-ui.com/components/box)
    - [Flex](https://theme-ui.com/components/flex)
    - [Grid](https://theme-ui.com/components/grid)
    - [Text](https://theme-ui.com/components/text)
    - [Heading](https://theme-ui.com/components/heading)
    - [Button](https://theme-ui.com/components/button)
    - [Input](https://theme-ui.com/components/forms)
    - [Card](https://theme-ui.com/components/card)
  - [Hooks](https://theme-ui.com/api)
    - [useThemeUI](https://theme-ui.com/api#usethemeui)
    - [useColorMode](https://theme-ui.com/api#usecolormode)
  - [Theming](https://theme-ui.com/theming)
    - [Color Modes](https://theme-ui.com/color-modes)
    - [Responsive Styles](https://theme-ui.com/responsive-styles)
    - [Variants](https://theme-ui.com/variants)
  - [Styling](https://theme-ui.com/sx-prop)
    - [sx Prop](https://theme-ui.com/sx-prop)
    - [Styled System](https://theme-ui.com/styled-system)
  - [Recipes](https://theme-ui.com/recipes)
    - [Dark Mode](https://theme-ui.com/recipes/dark-mode)
    - [Typography](https://theme-ui.com/recipes/typography)
    - [Layout](https://theme-ui.com/recipes/layout)
- [Community Resources](https://github.com/system-ui/theme-ui/blob/master/docs/awesome.md)
  - [Awesome Theme UI](https://github.com/system-ui/theme-ui/blob/master/docs/awesome.md)
  - [Examples](https://github.com/system-ui/theme-ui/tree/master/examples)
  - [Starters](https://theme-ui.com/demo)

## Core Concepts

### Theme Specification

- **Colors**: Primary color palette with modes support
- **Typography**: Font families, sizes, weights, and line heights
- **Space**: Consistent spacing scale for margins and padding
- **Breakpoints**: Responsive design breakpoints
- **Variants**: Reusable style groups for components

### sx Prop

- Theme-aware styling prop for any element
- Responsive array syntax: `[mobile, tablet, desktop]`
- Pseudo-selector support: `&:hover`, `&:focus`
- Direct theme value access: `color: 'primary'`

### Color Modes

- Built-in dark mode support
- Custom color mode definitions
- System preference detection
- Persistent mode storage

### Responsive Design

- Mobile-first responsive arrays
- Flexible breakpoint system
- Responsive typography scales
- Grid and flexbox utilities

## Installation and Setup

### Basic Installation

```bash
bun add theme-ui @emotion/react
```

### TypeScript Support

```bash
bun add -d @types/react @types/react-dom
```

### JSX Pragma Setup

Add to tsconfig.json:

```json
{
  "compilerOptions": {
    "jsxImportSource": "theme-ui"
  }
}
```

Or use the pragma comment:

```tsx
/** @jsxImportSource theme-ui */
```

## Theme Configuration

### Basic Theme Structure

```typescript
export const theme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    muted: '#f6f6f6',
    modes: {
      dark: {
        text: '#fff',
        background: '#111',
        primary: '#0cf',
      },
    },
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'inherit',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
  space: [0, 4, 8, 16, 32, 64, 128, 256],
  breakpoints: ['40em', '52em', '64em'],
}
```

### Provider Setup

```tsx
import { ThemeUIProvider } from 'theme-ui'
import { theme } from './theme'

export const App = () => (
  <ThemeUIProvider theme={theme}>
    {/* Your app */}
  </ThemeUIProvider>
)
```

## Component API

### Layout Components

- **Box**: Base component with sx prop
- **Flex**: Flexbox container
- **Grid**: CSS Grid container

### Typography

- **Text**: Text with variant support
- **Heading**: Heading elements (h1-h6)

### Interactive Elements

- **Button**: Themed button component
- **Link**: Styled link component

### Form Elements

- **Input**: Text input
- **Textarea**: Multi-line text input
- **Select**: Dropdown select
- **Label**: Form label
- **Checkbox**: Checkbox input
- **Radio**: Radio button

### Display Components

- **Card**: Content container
- **Badge**: Status indicator
- **Alert**: Message component
- **Avatar**: User image
- **Image**: Responsive image

## Hooks and Utilities

### useThemeUI()

Access theme object and color mode:

```tsx
const { theme, colorMode, setColorMode } = useThemeUI()
```

### useColorMode()

Color mode management:

```tsx
const [colorMode, setColorMode] = useColorMode()
```

## Styling Patterns

### Responsive Styling

```tsx
<Box
  sx={{
    fontSize: [2, 3, 4], // 16px, 18px, 20px
    padding: [2, 3, 4],  // 8px, 16px, 32px
    color: ['primary', 'secondary'], // responsive colors
  }}
/>
```

### Pseudo-selectors

```tsx
<Button
  sx={{
    '&:hover': {
      bg: 'secondary',
    },
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(0, 123, 204, 0.3)',
    },
  }}
>
  Hover me
</Button>
```

### Variants

```tsx
// Theme definition
const theme = {
  buttons: {
    primary: {
      bg: 'primary',
      color: 'background',
    },
    secondary: {
      bg: 'secondary',
      color: 'background',
    },
  },
}

// Usage
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
```

## Performance Best Practices

### Memoization

- Memoize theme objects
- Use React.memo for styled components
- Cache computed styles

### Bundle Optimization

- Tree shake unused components
- Use dynamic imports for large themes
- Optimize CSS-in-JS performance

### Memory Management

- Clean up event listeners
- Avoid memory leaks in theme hooks
- Use efficient responsive patterns

## Testing

### Test Setup

```tsx
import { render } from '@testing-library/react'
import { ThemeUIProvider } from 'theme-ui'

const renderWithTheme = (ui, { theme = testTheme } = {}) =>
  render(<ThemeUIProvider theme={theme}>{ui}</ThemeUIProvider>)
```

### Testing Patterns

- Test theme application
- Verify responsive behavior
- Test color mode switching
- Validate accessibility

## Migration Guides

### From Styled Components

- Replace styled components with sx prop
- Convert theme objects to Theme UI format
- Update responsive syntax

### From Emotion

- Add Theme UI provider
- Convert css prop to sx prop
- Migrate theme structure

### From Chakra UI

- Map Chakra theme to Theme UI
- Convert component API
- Update responsive patterns

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/theme-ui/`:

- **basic-usage.tsx**: Setup and basic patterns
- **configuration.tsx**: Advanced theme configuration
- **components.tsx**: Component examples and patterns
- **dark-mode.tsx**: Color mode implementation
- **responsive-design.tsx**: Responsive patterns
- **hooks-utilities.tsx**: Custom hooks and utilities
- **testing.tsx**: Testing patterns and setup
- **performance-optimization.tsx**: Performance best practices

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/theme-ui/schemas/`:

- **types.d.ts**: Complete TypeScript definitions
- **theme.schema.json**: JSON Schema for theme validation

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/theme-ui/linting/`:

- **biome.json**: Biome configuration for Theme UI projects

## Common Patterns

### Design System Setup

1. Define consistent color palette
2. Create typography scale
3. Establish spacing system
4. Set up component variants
5. Configure responsive breakpoints

### Component Development

1. Use sx prop for styling
2. Support responsive values
3. Implement dark mode
4. Add proper TypeScript types
5. Test across breakpoints

### Performance Optimization

1. Memoize theme objects
2. Use React.memo for components
3. Optimize responsive hooks
4. Tree shake unused code
5. Monitor bundle size

## Troubleshooting

### Common Issues

- **sx prop not working**: Check JSX pragma or tsconfig
- **Theme not applied**: Verify ThemeUIProvider setup
- **TypeScript errors**: Update type definitions
- **Performance issues**: Check for unnecessary re-renders
- **Color mode not persisting**: Configure localStorage

### Debug Tips

- Use React DevTools to inspect theme context
- Check computed styles in browser DevTools
- Verify theme object structure
- Test responsive breakpoints manually
- Monitor performance with React Profiler
