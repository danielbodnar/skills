# TailwindCSS Reference

**Always remember to reference @$HOME/.claude/references/tailwindcss.md and look for snippets and examples in @$HOME/.claude/snippets/tailwindcss/**

## Quick Reference

- Installation: `bun add tailwindcss @tailwindcss/typography @tailwindcss/forms @tailwindcss/container-queries`
- Import: `@import "tailwindcss";` in CSS files
- Documentation: <https://tailwindcss.com>
- GitHub: <https://github.com/tailwindlabs/tailwindcss>
- Package: <https://www.npmjs.com/package/tailwindcss>

## Resources and Documentation

- [TailwindCSS Documentation](https://tailwindcss.com)
  - [Installation Guide](https://tailwindcss.com/docs/installation)
  - [Configuration](https://tailwindcss.com/docs/configuration)
    - [Theme Configuration](https://tailwindcss.com/docs/theme)
    - [Customizing Colors](https://tailwindcss.com/docs/customizing-colors)
    - [Responsive Design](https://tailwindcss.com/docs/responsive-design)
  - [Core Concepts](https://tailwindcss.com/docs/utility-first)
    - [Utility-First Fundamentals](https://tailwindcss.com/docs/utility-first)
    - [Hover, Focus, and Other States](https://tailwindcss.com/docs/hover-focus-and-other-states)
    - [Dark Mode](https://tailwindcss.com/docs/dark-mode)
  - [Layout](https://tailwindcss.com/docs/aspect-ratio)
    - [Container](https://tailwindcss.com/docs/container)
    - [Box Sizing](https://tailwindcss.com/docs/box-sizing)
    - [Display](https://tailwindcss.com/docs/display)
    - [Floats](https://tailwindcss.com/docs/float)
    - [Clear](https://tailwindcss.com/docs/clear)
    - [Object Fit](https://tailwindcss.com/docs/object-fit)
    - [Object Position](https://tailwindcss.com/docs/object-position)
    - [Overflow](https://tailwindcss.com/docs/overflow)
    - [Overscroll Behavior](https://tailwindcss.com/docs/overscroll-behavior)
    - [Position](https://tailwindcss.com/docs/position)
    - [Top / Right / Bottom / Left](https://tailwindcss.com/docs/top-right-bottom-left)
    - [Visibility](https://tailwindcss.com/docs/visibility)
    - [Z-Index](https://tailwindcss.com/docs/z-index)
  - [Flexbox & Grid](https://tailwindcss.com/docs/flex-direction)
    - [Flex Direction](https://tailwindcss.com/docs/flex-direction)
    - [Flex Wrap](https://tailwindcss.com/docs/flex-wrap)
    - [Flex](https://tailwindcss.com/docs/flex)
    - [Flex Grow](https://tailwindcss.com/docs/flex-grow)
    - [Flex Shrink](https://tailwindcss.com/docs/flex-shrink)
    - [Order](https://tailwindcss.com/docs/order)
    - [Grid Template Columns](https://tailwindcss.com/docs/grid-template-columns)
    - [Grid Template Rows](https://tailwindcss.com/docs/grid-template-rows)
    - [Grid Column Start / End](https://tailwindcss.com/docs/grid-column)
    - [Grid Row Start / End](https://tailwindcss.com/docs/grid-row)
    - [Gap](https://tailwindcss.com/docs/gap)
    - [Justify Content](https://tailwindcss.com/docs/justify-content)
    - [Justify Items](https://tailwindcss.com/docs/justify-items)
    - [Justify Self](https://tailwindcss.com/docs/justify-self)
    - [Align Content](https://tailwindcss.com/docs/align-content)
    - [Align Items](https://tailwindcss.com/docs/align-items)
    - [Align Self](https://tailwindcss.com/docs/align-self)
    - [Place Content](https://tailwindcss.com/docs/place-content)
    - [Place Items](https://tailwindcss.com/docs/place-items)
    - [Place Self](https://tailwindcss.com/docs/place-self)
  - [Spacing](https://tailwindcss.com/docs/padding)
    - [Padding](https://tailwindcss.com/docs/padding)
    - [Margin](https://tailwindcss.com/docs/margin)
    - [Space Between](https://tailwindcss.com/docs/space)
  - [Sizing](https://tailwindcss.com/docs/width)
    - [Width](https://tailwindcss.com/docs/width)
    - [Min-Width](https://tailwindcss.com/docs/min-width)
    - [Max-Width](https://tailwindcss.com/docs/max-width)
    - [Height](https://tailwindcss.com/docs/height)
    - [Min-Height](https://tailwindcss.com/docs/min-height)
    - [Max-Height](https://tailwindcss.com/docs/max-height)
    - [Size](https://tailwindcss.com/docs/size)
  - [Typography](https://tailwindcss.com/docs/font-family)
    - [Font Family](https://tailwindcss.com/docs/font-family)
    - [Font Size](https://tailwindcss.com/docs/font-size)
    - [Font Smoothing](https://tailwindcss.com/docs/font-smoothing)
    - [Font Style](https://tailwindcss.com/docs/font-style)
    - [Font Weight](https://tailwindcss.com/docs/font-weight)
    - [Font Variant Numeric](https://tailwindcss.com/docs/font-variant-numeric)
    - [Letter Spacing](https://tailwindcss.com/docs/letter-spacing)
    - [Line Clamp](https://tailwindcss.com/docs/line-clamp)
    - [Line Height](https://tailwindcss.com/docs/line-height)
    - [List Style Image](https://tailwindcss.com/docs/list-style-image)
    - [List Style Position](https://tailwindcss.com/docs/list-style-position)
    - [List Style Type](https://tailwindcss.com/docs/list-style-type)
    - [Text Align](https://tailwindcss.com/docs/text-align)
    - [Text Color](https://tailwindcss.com/docs/text-color)
    - [Text Decoration](https://tailwindcss.com/docs/text-decoration)
    - [Text Decoration Color](https://tailwindcss.com/docs/text-decoration-color)
    - [Text Decoration Style](https://tailwindcss.com/docs/text-decoration-style)
    - [Text Decoration Thickness](https://tailwindcss.com/docs/text-decoration-thickness)
    - [Text Underline Offset](https://tailwindcss.com/docs/text-underline-offset)
    - [Text Transform](https://tailwindcss.com/docs/text-transform)
    - [Text Overflow](https://tailwindcss.com/docs/text-overflow)
    - [Text Wrap](https://tailwindcss.com/docs/text-wrap)
    - [Text Indent](https://tailwindcss.com/docs/text-indent)
    - [Vertical Align](https://tailwindcss.com/docs/vertical-align)
    - [Whitespace](https://tailwindcss.com/docs/whitespace)
    - [Word Break](https://tailwindcss.com/docs/word-break)
    - [Hyphens](https://tailwindcss.com/docs/hyphens)
    - [Content](https://tailwindcss.com/docs/content)
  - [Backgrounds](https://tailwindcss.com/docs/background-attachment)
    - [Background Attachment](https://tailwindcss.com/docs/background-attachment)
    - [Background Clip](https://tailwindcss.com/docs/background-clip)
    - [Background Color](https://tailwindcss.com/docs/background-color)
    - [Background Origin](https://tailwindcss.com/docs/background-origin)
    - [Background Position](https://tailwindcss.com/docs/background-position)
    - [Background Repeat](https://tailwindcss.com/docs/background-repeat)
    - [Background Size](https://tailwindcss.com/docs/background-size)
    - [Background Image](https://tailwindcss.com/docs/background-image)
    - [Gradient Color Stops](https://tailwindcss.com/docs/gradient-color-stops)
  - [Borders](https://tailwindcss.com/docs/border-radius)
    - [Border Radius](https://tailwindcss.com/docs/border-radius)
    - [Border Width](https://tailwindcss.com/docs/border-width)
    - [Border Color](https://tailwindcss.com/docs/border-color)
    - [Border Style](https://tailwindcss.com/docs/border-style)
    - [Divide Width](https://tailwindcss.com/docs/divide-width)
    - [Divide Color](https://tailwindcss.com/docs/divide-color)
    - [Divide Style](https://tailwindcss.com/docs/divide-style)
    - [Outline Width](https://tailwindcss.com/docs/outline-width)
    - [Outline Color](https://tailwindcss.com/docs/outline-color)
    - [Outline Style](https://tailwindcss.com/docs/outline-style)
    - [Outline Offset](https://tailwindcss.com/docs/outline-offset)
    - [Ring Width](https://tailwindcss.com/docs/ring-width)
    - [Ring Color](https://tailwindcss.com/docs/ring-color)
    - [Ring Offset Width](https://tailwindcss.com/docs/ring-offset-width)
    - [Ring Offset Color](https://tailwindcss.com/docs/ring-offset-color)
  - [Effects](https://tailwindcss.com/docs/box-shadow)
    - [Box Shadow](https://tailwindcss.com/docs/box-shadow)
    - [Box Shadow Color](https://tailwindcss.com/docs/box-shadow-color)
    - [Opacity](https://tailwindcss.com/docs/opacity)
    - [Mix Blend Mode](https://tailwindcss.com/docs/mix-blend-mode)
    - [Background Blend Mode](https://tailwindcss.com/docs/background-blend-mode)
  - [Filters](https://tailwindcss.com/docs/blur)
    - [Blur](https://tailwindcss.com/docs/blur)
    - [Brightness](https://tailwindcss.com/docs/brightness)
    - [Contrast](https://tailwindcss.com/docs/contrast)
    - [Drop Shadow](https://tailwindcss.com/docs/drop-shadow)
    - [Grayscale](https://tailwindcss.com/docs/grayscale)
    - [Hue Rotate](https://tailwindcss.com/docs/hue-rotate)
    - [Invert](https://tailwindcss.com/docs/invert)
    - [Saturate](https://tailwindcss.com/docs/saturate)
    - [Sepia](https://tailwindcss.com/docs/sepia)
    - [Backdrop Blur](https://tailwindcss.com/docs/backdrop-blur)
    - [Backdrop Brightness](https://tailwindcss.com/docs/backdrop-brightness)
    - [Backdrop Contrast](https://tailwindcss.com/docs/backdrop-contrast)
    - [Backdrop Grayscale](https://tailwindcss.com/docs/backdrop-grayscale)
    - [Backdrop Hue Rotate](https://tailwindcss.com/docs/backdrop-hue-rotate)
    - [Backdrop Invert](https://tailwindcss.com/docs/backdrop-invert)
    - [Backdrop Opacity](https://tailwindcss.com/docs/backdrop-opacity)
    - [Backdrop Saturate](https://tailwindcss.com/docs/backdrop-saturate)
    - [Backdrop Sepia](https://tailwindcss.com/docs/backdrop-sepia)
  - [Tables](https://tailwindcss.com/docs/border-collapse)
    - [Border Collapse](https://tailwindcss.com/docs/border-collapse)
    - [Border Spacing](https://tailwindcss.com/docs/border-spacing)
    - [Table Layout](https://tailwindcss.com/docs/table-layout)
    - [Caption Side](https://tailwindcss.com/docs/caption-side)
  - [Transitions & Animation](https://tailwindcss.com/docs/transition-property)
    - [Transition Property](https://tailwindcss.com/docs/transition-property)
    - [Transition Duration](https://tailwindcss.com/docs/transition-duration)
    - [Transition Timing Function](https://tailwindcss.com/docs/transition-timing-function)
    - [Transition Delay](https://tailwindcss.com/docs/transition-delay)
    - [Animation](https://tailwindcss.com/docs/animation)
  - [Transforms](https://tailwindcss.com/docs/scale)
    - [Scale](https://tailwindcss.com/docs/scale)
    - [Rotate](https://tailwindcss.com/docs/rotate)
    - [Translate](https://tailwindcss.com/docs/translate)
    - [Skew](https://tailwindcss.com/docs/skew)
    - [Transform Origin](https://tailwindcss.com/docs/transform-origin)
  - [Interactivity](https://tailwindcss.com/docs/accent-color)
    - [Accent Color](https://tailwindcss.com/docs/accent-color)
    - [Appearance](https://tailwindcss.com/docs/appearance)
    - [Cursor](https://tailwindcss.com/docs/cursor)
    - [Caret Color](https://tailwindcss.com/docs/caret-color)
    - [Pointer Events](https://tailwindcss.com/docs/pointer-events)
    - [Resize](https://tailwindcss.com/docs/resize)
    - [Scroll Behavior](https://tailwindcss.com/docs/scroll-behavior)
    - [Scroll Margin](https://tailwindcss.com/docs/scroll-margin)
    - [Scroll Padding](https://tailwindcss.com/docs/scroll-padding)
    - [Scroll Snap Align](https://tailwindcss.com/docs/scroll-snap-align)
    - [Scroll Snap Stop](https://tailwindcss.com/docs/scroll-snap-stop)
    - [Scroll Snap Type](https://tailwindcss.com/docs/scroll-snap-type)
    - [Touch Action](https://tailwindcss.com/docs/touch-action)
    - [User Select](https://tailwindcss.com/docs/user-select)
    - [Will Change](https://tailwindcss.com/docs/will-change)
  - [SVG](https://tailwindcss.com/docs/fill)
    - [Fill](https://tailwindcss.com/docs/fill)
    - [Stroke](https://tailwindcss.com/docs/stroke)
    - [Stroke Width](https://tailwindcss.com/docs/stroke-width)
  - [Accessibility](https://tailwindcss.com/docs/screen-readers)
    - [Screen Readers](https://tailwindcss.com/docs/screen-readers)
    - [Forced Color Adjust](https://tailwindcss.com/docs/forced-color-adjust)
- [Official Plugins](https://tailwindcss.com/docs/plugins)
  - [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)
  - [@tailwindcss/forms](https://github.com/tailwindlabs/tailwindcss-forms)
  - [@tailwindcss/aspect-ratio](https://github.com/tailwindlabs/tailwindcss-aspect-ratio)
  - [@tailwindcss/container-queries](https://github.com/tailwindlabs/tailwindcss-container-queries)
- [Community Resources](https://tailwindcss.com/resources)
  - [Headless UI](https://headlessui.com) - Unstyled, accessible UI components
  - [Heroicons](https://heroicons.com) - SVG icons by TailwindCSS creators
  - [Tailwind UI](https://tailwindui.com) - Premium component library
  - [TailwindCSS Discord](https://tailwindcss.com/discord) - Community chat
  - [Awesome TailwindCSS](https://github.com/aniftyco/awesome-tailwindcss) - Curated resources

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/tailwindcss/`:

- Basic usage patterns and utility classes
- Responsive design examples
- Component patterns and layouts
- Form styling and validation states
- Animation and transition examples
- Dark mode implementation
- Grid and flexbox layouts
- Custom configuration examples

## Installation and Setup

### Basic Installation

```bash
# Install TailwindCSS and plugins
bun add tailwindcss @tailwindcss/typography @tailwindcss/forms @tailwindcss/container-queries

# Generate configuration file
bunx tailwindcss init

# Add to CSS file
echo '@import "tailwindcss";' > src/styles.css
```

### Framework Integration

- **Next.js**: Built-in TailwindCSS support with `@next/bundle-analyzer`
- **Vite**: Use `@vitejs/plugin-tailwindcss` or PostCSS
- **Astro**: Built-in TailwindCSS integration available
- **Vue/Nuxt**: Use `@nuxtjs/tailwindcss` module
- **Laravel**: Laravel Mix or Vite with TailwindCSS
- **Ruby on Rails**: `tailwindcss-rails` gem

### Build Process

```bash
# Development with watch mode
bunx tailwindcss -i ./src/input.css -o ./dist/output.css --watch

# Production build (automatically purges unused CSS)
bunx tailwindcss -i ./src/input.css -o ./dist/output.css --minify
```

## Configuration Examples

### Basic tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
```

### Extended Configuration

```javascript
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
```

## Performance and Best Practices

### CSS Optimization

- TailwindCSS automatically removes unused styles in production
- Most projects ship less than 10kB of CSS
- Use PurgeCSS for additional optimization if needed
- Enable JIT (Just-In-Time) mode for faster builds

### Development Workflow

- Use TailwindCSS IntelliSense extension for VS Code
- Install Prettier plugin for class sorting
- Use ESLint plugin for additional linting rules
- Configure editor to show color previews for utility classes

### Design System Integration

- Define custom colors, fonts, and spacing in theme configuration
- Use CSS custom properties for dynamic theming
- Create component classes using `@apply` directive sparingly
- Document design tokens and utility patterns

## Browser Support and Compatibility

- Modern browsers (Chrome 61+, Firefox 60+, Safari 12+, Edge 79+)
- IE 11 support with PostCSS autoprefixer
- Mobile browsers fully supported
- Progressive enhancement for newer CSS features
- Graceful degradation for unsupported features
