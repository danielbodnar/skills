# Themer Reference

**Always remember to reference @$HOME/.claude/references/themer.md and look for snippets and examples in @$HOME/.claude/snippets/themer/**

## Quick Reference

- Installation: `bun add -g themer` (global) or `bun add -D themer` (local)
- CLI: `themer -c <colorset> -t <template> -o <output>`
- Documentation: <https://themer.dev>
- GitHub: <https://github.com/mjswensen/themer>
- Package: <https://www.npmjs.com/package/themer>

## Resources and Documentation

- [Themer GitHub Repository](https://github.com/mjswensen/themer)
  - [Getting Started](https://github.com/mjswensen/themer#getting-started)
  - [CLI Usage](https://github.com/mjswensen/themer#usage)
    - [Color Sets](https://github.com/mjswensen/themer#color-sets)
    - [Templates](https://github.com/mjswensen/themer#templates)
    - [Command Line Options](https://github.com/mjswensen/themer#command-line-interface)
  - [API Reference](https://github.com/mjswensen/themer#api)
    - [colorSetToVariants](https://github.com/mjswensen/themer#colorsettovariants)
    - [render](https://github.com/mjswensen/themer#render)
  - [Color Set Specification](https://github.com/mjswensen/themer#color-sets)
    - [Shade Colors](https://github.com/mjswensen/themer#shade-colors)
    - [Accent Colors](https://github.com/mjswensen/themer#accent-colors)
    - [Base16 Integration](https://github.com/mjswensen/themer#base16)
  - [Template Development](https://github.com/mjswensen/themer#creating-your-own-template)
    - [Template Structure](https://github.com/mjswensen/themer#template-structure)
    - [Color Processing](https://github.com/mjswensen/themer#color-processing)
    - [Output Generation](https://github.com/mjswensen/themer#output-generation)
- [Themer Website](https://themer.dev)
  - [Online Theme Generator](https://themer.dev)
  - [Color Palette Picker](https://themer.dev)
  - [Theme Previews](https://themer.dev)
  - [Pre-made Themes](https://themer.dev)
- [Community Resources](https://github.com/mjswensen/themer/discussions)
  - [Theme Gallery](https://github.com/mjswensen/themer/discussions/categories/show-and-tell)
  - [Template Requests](https://github.com/mjswensen/themer/discussions/categories/ideas)
  - [Support Forum](https://github.com/mjswensen/themer/discussions/categories/q-a)

## Core Concepts

### Color Set Structure

Themer uses a standardized color set format with 8 shades and 8 accents:

- **Shades**: Background and text colors (shade0-shade7)
- **Accents**: Syntax highlighting and UI accent colors (accent0-accent7)
- **Variants**: Support for dark, light, and custom variants

### Template System

- **Templates**: Convert color sets into application-specific themes
- **Rendering**: Programmatic generation of theme files
- **Output**: Multiple file formats per template (CSS, JSON, config files)

### Base16 Compatibility

- Full Base16 color scheme support
- Standard Base16 color mapping
- Integration with existing Base16 themes

## Installation and Setup

### Global Installation (Recommended)

```bash
# Install globally for CLI usage
bun add -g themer

# Verify installation
themer --version
```

### Local Project Installation

```bash
# Install as development dependency
bun add -D themer

# Add to package.json scripts
"scripts": {
  "theme:generate": "themer -c colors.js -t vim -t vscode -o themes"
}
```

### Template Package Installation

```bash
# Install specific template packages
bun add -D themer-vim themer-vscode themer-iterm
bun add -D themer-wallpaper-triangles themer-wallpaper-circuits
```

## CLI Usage

### Basic Commands

```bash
# Generate with built-in color set
themer -c default -t vim -o output

# Generate with custom color set
themer -c ./my-colors.js -t vscode -o themes

# Generate multiple templates
themer -c night-sky -t vim -t vscode -t iterm -o output

# Generate specific variant only
themer -c default --dark -t vim -o themes/dark
themer -c default --light -t vim -o themes/light
```

### List Available Options

```bash
# List built-in color sets
themer --list-color-sets

# List available templates
themer --list-templates

# Show help
themer --help
```

### Advanced Usage

```bash
# Generate wallpapers
themer -c dracula -t wallpaper-triangles -t wallpaper-circuits -o wallpapers

# Batch generation for development environments
themer -c my-theme -t vim -t vscode -t atom-syntax -t sublime-text -o editors

# Terminal theme generation
themer -c solarized -t iterm -t terminal -t hyper -o terminals
```

## Color Set Definition

### Basic Structure

```javascript
module.exports = {
  name: 'my-theme',
  colors: {
    dark: {
      // Background shades (darkest to lightest)
      shade0: '#000000',  // Primary background
      shade1: '#111111',  // Secondary background
      shade2: '#222222',  // Selection background
      shade3: '#333333',  // Line highlight
      shade4: '#444444',  // Comments
      shade5: '#555555',  // Secondary text
      shade6: '#cccccc',  // Primary text
      shade7: '#ffffff',  // Bright text
      
      // Accent colors for syntax highlighting
      accent0: '#ff0000', // Red - errors, deletions
      accent1: '#ff8800', // Orange - constants, numbers
      accent2: '#ffff00', // Yellow - strings
      accent3: '#00ff00', // Green - additions, success
      accent4: '#00ffff', // Cyan - info, links
      accent5: '#0088ff', // Blue - keywords
      accent6: '#8800ff', // Purple - storage, functions
      accent7: '#ff0088', // Pink - additional accent
    },
    light: {
      // Light variant colors...
    }
  }
}
```

### Color Semantic Mapping

- **shade0**: Editor background, primary background
- **shade1**: Sidebar background, secondary background
- **shade2**: Selection background, hover states
- **shade3**: Line numbers, guides
- **shade4**: Comments, disabled text
- **shade5**: Secondary text
- **shade6**: Primary text, foreground
- **shade7**: Bright text, emphasis

- **accent0**: Errors, deletions, danger states
- **accent1**: Warnings, constants, numbers
- **accent2**: Strings, text literals
- **accent3**: Success states, additions, strings
- **accent4**: Info states, functions, links
- **accent5**: Keywords, control flow
- **accent6**: Types, storage, functions
- **accent7**: Special characters, operators

## Available Templates

### Editors

- **vim**: Vim color scheme (.vim files)
- **vscode**: Visual Studio Code theme (JSON)
- **atom-syntax**: Atom syntax theme
- **atom-ui**: Atom UI theme
- **sublime-text**: Sublime Text color scheme
- **emacs**: Emacs theme
- **brackets**: Brackets theme

### Terminals

- **iterm**: iTerm2 color scheme
- **terminal**: macOS Terminal profile
- **hyper**: Hyper terminal theme
- **windows-terminal**: Windows Terminal scheme
- **gnome-terminal**: GNOME Terminal profile
- **xfce-terminal**: XFCE Terminal configuration

### Applications

- **slack**: Slack sidebar theme
- **chrome**: Chrome browser theme
- **firefox**: Firefox theme
- **alfred**: Alfred theme
- **sketch-palettes**: Sketch color palettes

### Wallpapers

- **wallpaper-triangles**: Triangular pattern wallpaper
- **wallpaper-circuits**: Circuit board pattern
- **wallpaper-dot-grid**: Dot grid pattern
- **wallpaper-octagon**: Octagonal pattern
- **wallpaper-trianglify**: Trianglify style wallpaper
- **wallpaper-block-wave**: Block wave pattern

## Programmatic API

### Basic API Usage

```javascript
const { colorSetToVariants } = require('themer/lib/color-set')
const { render } = require('themer/lib/template')

// Load color set
const colorSet = require('./my-colors.js')

// Generate variants
const variants = colorSetToVariants(colorSet)

// Load and render template
const vimTemplate = require('themer-vim')
const output = await render(vimTemplate, variants)

// Write files
Object.entries(output).forEach(([filename, content]) => {
  fs.writeFileSync(`output/${filename}`, content)
})
```

### Advanced API Features

- Color set validation
- Template development helpers
- Batch processing
- Custom template creation
- Build tool integration

## Template Development

### Template Structure

```javascript
module.exports = {
  name: 'my-template',
  render: (colors) => {
    const { dark, light } = colors
    
    return {
      'theme-dark.ext': generateDarkTheme(dark),
      'theme-light.ext': generateLightTheme(light)
    }
  }
}
```

### Color Processing Utilities

- Color format conversion (hex, rgb, hsl)
- Color manipulation (lighten, darken, blend)
- Contrast ratio calculation
- Accessibility validation

## Build Tool Integration

### Package.json Scripts

```json
{
  "scripts": {
    "theme:generate": "themer -c colors.js -t vim -t vscode -o themes",
    "theme:watch": "chokidar colors.js -c 'npm run theme:generate'",
    "theme:validate": "node scripts/validate-colors.js"
  }
}
```

### Webpack Plugin

```javascript
const ThemerWebpackPlugin = require('./themer-webpack-plugin')

module.exports = {
  plugins: [
    new ThemerWebpackPlugin({
      colorSetPath: './src/colors.js',
      templates: ['css'],
      outputPath: './src/generated'
    })
  ]
}
```

### Vite Plugin

```javascript
import { themerVitePlugin } from './themer-vite-plugin'

export default {
  plugins: [
    themerVitePlugin({
      colorSetPath: './src/colors.js',
      templates: ['css'],
      outputPath: './src/generated'
    })
  ]
}
```

## Validation and Testing

### Color Set Validation

- Required color properties
- Hex color format validation
- Contrast ratio checking
- WCAG compliance verification

### Theme Testing

- Generated file validation
- Output format verification
- Template compatibility testing
- Accessibility auditing

## Best Practices

### Color Set Design

1. Maintain sufficient contrast ratios (4.5:1 minimum)
2. Use semantic color assignments consistently
3. Test themes across multiple applications
4. Provide both dark and light variants
5. Consider accessibility requirements

### Development Workflow

1. Create color set with semantic naming
2. Generate themes for primary tools first
3. Test and iterate on color choices
4. Expand to additional templates
5. Automate generation in build process

### Template Usage

1. Start with popular templates (vim, vscode, iterm)
2. Install template packages as needed
3. Use batch generation for efficiency
4. Organize output by template type
5. Version control generated themes

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/themer/`:

- **basic-usage.js**: CLI and API fundamentals
- **configuration.js**: Advanced configuration patterns
- **color-sets.js**: Color set examples and builders
- **cli-usage.sh**: Command-line usage scripts
- **templates.js**: Template development and customization
- **api-usage.js**: Programmatic API examples
- **automation.js**: Build tool integration and automation

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/themer/schemas/`:

- **types.d.ts**: Complete TypeScript definitions
- **themer.schema.json**: JSON Schema for color set validation

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/themer/linting/`:

- **biome.json**: Biome configuration for Themer projects

## Common Workflows

### Creating a New Theme

1. Define color palette with semantic meanings
2. Create color set file with proper structure
3. Generate themes for primary development tools
4. Test and refine color choices
5. Generate additional templates as needed

### Maintaining Themes

1. Use file watching for automatic regeneration
2. Version control color set definitions
3. Test themes across different applications
4. Update templates when new versions are available
5. Share color sets with team members

### Contributing Templates

1. Study existing template structure
2. Understand target application's theme format
3. Implement render function with color mapping
4. Test with various color sets
5. Submit as npm package following naming convention

## Troubleshooting

### Common Issues

- **Template not found**: Install template package with `bun add themer-<template-name>`
- **Invalid color set**: Validate structure and hex color formats
- **Generation fails**: Check file permissions and output directory
- **Missing variants**: Ensure color set includes required variants
- **Poor contrast**: Use contrast checking tools to validate accessibility

### Debug Tips

- Use `--list-templates` to verify available templates
- Validate color set structure before generation
- Test with built-in color sets first
- Check template package compatibility
- Review generated files for correctness

### Performance Optimization

- Use programmatic API for batch operations
- Cache color set processing results
- Optimize file writing operations
- Use incremental generation for large projects
- Implement proper error handling and recovery
