// Themer Template System and Custom Templates

// 1. Available Template Categories
const templateCategories = {
  editors: {
    'vim': 'Vim color scheme',
    'vscode': 'Visual Studio Code theme',
    'atom-syntax': 'Atom syntax theme',
    'atom-ui': 'Atom UI theme',
    'sublime-text': 'Sublime Text color scheme',
    'emacs': 'Emacs theme',
    'brackets': 'Brackets theme',
    'xcode': 'Xcode color scheme'
  },
  
  terminals: {
    'iterm': 'iTerm2 color scheme',
    'terminal': 'macOS Terminal profile',
    'hyper': 'Hyper terminal theme',
    'windows-terminal': 'Windows Terminal color scheme',
    'gnome-terminal': 'GNOME Terminal profile',
    'xfce-terminal': 'XFCE Terminal color scheme',
    'termite': 'Termite color configuration',
    'konsole': 'KDE Konsole color scheme'
  },
  
  applications: {
    'slack': 'Slack sidebar theme',
    'chrome': 'Chrome theme',
    'firefox': 'Firefox theme',
    'alfred': 'Alfred theme',
    'sketch-palettes': 'Sketch palette',
    'telegram': 'Telegram theme'
  },
  
  wallpapers: {
    'wallpaper-triangles': 'Triangular pattern wallpaper',
    'wallpaper-circuits': 'Circuit board pattern',
    'wallpaper-dot-grid': 'Dot grid pattern',
    'wallpaper-octagon': 'Octagonal pattern',
    'wallpaper-trianglify': 'Trianglify style wallpaper',
    'wallpaper-block-wave': 'Block wave pattern'
  },
  
  development: {
    'css': 'CSS custom properties',
    'scss': 'SCSS variables',
    'less': 'LESS variables',
    'json': 'JSON theme object',
    'yaml': 'YAML configuration'
  }
}

// 2. Custom Template Creation
class ThemerTemplate {
  constructor(name, description) {
    this.name = name
    this.description = description
  }
  
  // Template render function
  render(colors) {
    throw new Error('render method must be implemented')
  }
  
  // Helper methods for color processing
  static getRgb(hex) {
    const num = parseInt(hex.slice(1), 16)
    return {
      r: (num >> 16) & 0xff,
      g: (num >> 8) & 0xff,
      b: num & 0xff
    }
  }
  
  static toRgba(hex, alpha = 1) {
    const { r, g, b } = this.getRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  static toHsl(hex) {
    const { r, g, b } = this.getRgb(hex)
    const [h, s, l] = this.rgbToHsl(r, g, b)
    return `hsl(${h}, ${s}%, ${l}%)`
  }
  
  static rgbToHsl(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    
    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }
}

// 3. CSS Custom Properties Template
class CSSCustomPropertiesTemplate extends ThemerTemplate {
  constructor() {
    super('css-custom-properties', 'CSS custom properties theme')
  }
  
  render(colors) {
    const { dark, light } = colors
    
    return {
      'theme-dark.css': this.generateCSS(dark, 'dark'),
      'theme-light.css': this.generateCSS(light, 'light'),
      'theme-combined.css': this.generateCombinedCSS(colors)
    }
  }
  
  generateCSS(variant, name) {
    if (!variant) return ''
    
    return `/* ${name.charAt(0).toUpperCase() + name.slice(1)} Theme */
:root {
  /* Background colors */
  --color-bg-primary: ${variant.shade0};
  --color-bg-secondary: ${variant.shade1};
  --color-bg-tertiary: ${variant.shade2};
  --color-bg-selection: ${variant.shade2};
  
  /* Text colors */
  --color-text-primary: ${variant.shade6};
  --color-text-secondary: ${variant.shade5};
  --color-text-tertiary: ${variant.shade4};
  --color-text-disabled: ${variant.shade3};
  --color-text-bright: ${variant.shade7};
  
  /* Accent colors */
  --color-error: ${variant.accent0};
  --color-warning: ${variant.accent1};
  --color-info: ${variant.accent2};
  --color-success: ${variant.accent3};
  --color-primary: ${variant.accent4};
  --color-secondary: ${variant.accent5};
  --color-accent: ${variant.accent6};
  --color-highlight: ${variant.accent7};
  
  /* Semantic colors */
  --color-border: ${variant.shade2};
  --color-shadow: ${ThemerTemplate.toRgba(variant.shade0, 0.3)};
  --color-overlay: ${ThemerTemplate.toRgba(variant.shade0, 0.8)};
}

/* Component styles using custom properties */
body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-bg-primary);
}

.button-secondary {
  background-color: var(--color-secondary);
  color: var(--color-bg-primary);
}

.text-error { color: var(--color-error); }
.text-warning { color: var(--color-warning); }
.text-success { color: var(--color-success); }
.text-info { color: var(--color-info); }
`
  }
  
  generateCombinedCSS(colors) {
    const { dark, light } = colors
    
    return `/* Combined Light/Dark Theme */
:root {
  color-scheme: light dark;
}

/* Light theme (default) */
:root {
${this.generateCSSVariables(light || dark, '  ')}
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  :root {
${dark ? this.generateCSSVariables(dark, '    ') : ''}
  }
}

/* Manual theme overrides */
[data-theme="light"] {
${this.generateCSSVariables(light || dark, '  ')}
}

[data-theme="dark"] {
${dark ? this.generateCSSVariables(dark, '  ') : ''}
}
`
  }
  
  generateCSSVariables(variant, indent) {
    if (!variant) return ''
    
    return Object.entries({
      '--color-bg-primary': variant.shade0,
      '--color-bg-secondary': variant.shade1,
      '--color-text-primary': variant.shade6,
      '--color-text-secondary': variant.shade5,
      '--color-error': variant.accent0,
      '--color-warning': variant.accent1,
      '--color-info': variant.accent2,
      '--color-success': variant.accent3,
      '--color-primary': variant.accent4,
      '--color-secondary': variant.accent5
    }).map(([prop, value]) => `${indent}${prop}: ${value};`).join('\n')
  }
}

// 4. JSON Configuration Template
class JSONConfigTemplate extends ThemerTemplate {
  constructor() {
    super('json-config', 'JSON configuration theme')
  }
  
  render(colors) {
    return {
      'theme.json': JSON.stringify({
        name: 'Custom Theme',
        colors,
        semantic: this.generateSemanticMapping(colors)
      }, null, 2),
      
      'theme-flat.json': JSON.stringify(this.flattenColors(colors), null, 2)
    }
  }
  
  generateSemanticMapping(colors) {
    return {
      dark: colors.dark ? {
        background: {
          primary: colors.dark.shade0,
          secondary: colors.dark.shade1,
          tertiary: colors.dark.shade2
        },
        text: {
          primary: colors.dark.shade6,
          secondary: colors.dark.shade5,
          disabled: colors.dark.shade4
        },
        accents: {
          error: colors.dark.accent0,
          warning: colors.dark.accent1,
          success: colors.dark.accent3,
          info: colors.dark.accent4,
          primary: colors.dark.accent5
        }
      } : null,
      
      light: colors.light ? {
        background: {
          primary: colors.light.shade0,
          secondary: colors.light.shade1,
          tertiary: colors.light.shade2
        },
        text: {
          primary: colors.light.shade6,
          secondary: colors.light.shade5,
          disabled: colors.light.shade4
        },
        accents: {
          error: colors.light.accent0,
          warning: colors.light.accent1,
          success: colors.light.accent3,
          info: colors.light.accent4,
          primary: colors.light.accent5
        }
      } : null
    }
  }
  
  flattenColors(colors) {
    const flattened = {}
    
    Object.entries(colors).forEach(([variant, colorSet]) => {
      Object.entries(colorSet).forEach(([colorName, colorValue]) => {
        flattened[`${variant}-${colorName}`] = colorValue
      })
    })
    
    return flattened
  }
}

// 5. SCSS Variables Template
class SCSSVariablesTemplate extends ThemerTemplate {
  constructor() {
    super('scss-variables', 'SCSS variables theme')
  }
  
  render(colors) {
    return {
      '_theme-dark.scss': this.generateSCSS(colors.dark, 'dark'),
      '_theme-light.scss': this.generateSCSS(colors.light, 'light'),
      '_theme-mixins.scss': this.generateMixins(colors)
    }
  }
  
  generateSCSS(variant, name) {
    if (!variant) return ''
    
    return `// ${name.charAt(0).toUpperCase() + name.slice(1)} Theme Variables

// Background colors
$bg-primary: ${variant.shade0};
$bg-secondary: ${variant.shade1};
$bg-tertiary: ${variant.shade2};
$bg-selection: ${variant.shade2};

// Text colors
$text-primary: ${variant.shade6};
$text-secondary: ${variant.shade5};
$text-tertiary: ${variant.shade4};
$text-disabled: ${variant.shade3};
$text-bright: ${variant.shade7};

// Accent colors
$color-error: ${variant.accent0};
$color-warning: ${variant.accent1};
$color-info: ${variant.accent2};
$color-success: ${variant.accent3};
$color-primary: ${variant.accent4};
$color-secondary: ${variant.accent5};
$color-accent: ${variant.accent6};
$color-highlight: ${variant.accent7};

// Semantic color map
$theme-colors: (
  "primary": $color-primary,
  "secondary": $color-secondary,
  "success": $color-success,
  "info": $color-info,
  "warning": $color-warning,
  "error": $color-error
);

// Background map
$bg-colors: (
  "primary": $bg-primary,
  "secondary": $bg-secondary,
  "tertiary": $bg-tertiary
);

// Text color map
$text-colors: (
  "primary": $text-primary,
  "secondary": $text-secondary,
  "tertiary": $text-tertiary,
  "disabled": $text-disabled,
  "bright": $text-bright
);
`
  }
  
  generateMixins(colors) {
    return `// Theme Mixins

@mixin theme-variant($variant: 'dark') {
  @if $variant == 'dark' {
    @import 'theme-dark';
  } @else {
    @import 'theme-light';
  }
}

@mixin bg-color($level: 'primary') {
  background-color: map-get($bg-colors, $level);
}

@mixin text-color($level: 'primary') {
  color: map-get($text-colors, $level);
}

@mixin theme-color($color: 'primary') {
  color: map-get($theme-colors, $color);
}

@mixin theme-bg($color: 'primary') {
  background-color: map-get($theme-colors, $color);
}

// Button variant mixin
@mixin button-variant($color: 'primary') {
  $bg: map-get($theme-colors, $color);
  $text: if($color == 'warning' or $color == 'info', $text-primary, $bg-primary);
  
  background-color: $bg;
  color: $text;
  border-color: $bg;
  
  &:hover {
    background-color: darken($bg, 10%);
    border-color: darken($bg, 10%);
  }
}

// Card mixin
@mixin card($bg: 'secondary') {
  @include bg-color($bg);
  @include text-color('primary');
  border: 1px solid map-get($bg-colors, 'tertiary');
  border-radius: 4px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(map-get($bg-colors, 'primary'), 0.1);
}
`
  }
}

// 6. Template Registration System
class TemplateRegistry {
  constructor() {
    this.templates = new Map()
  }
  
  register(template) {
    this.templates.set(template.name, template)
  }
  
  get(name) {
    return this.templates.get(name)
  }
  
  list() {
    return Array.from(this.templates.keys())
  }
  
  renderAll(colors, outputDir = './output') {
    const results = {}
    
    for (const [name, template] of this.templates) {
      try {
        results[name] = template.render(colors)
        console.log(`✓ Generated ${name} template`)
      } catch (error) {
        console.error(`✗ Failed to generate ${name} template:`, error.message)
        results[name] = { error: error.message }
      }
    }
    
    return results
  }
}

// 7. Usage Examples
const registry = new TemplateRegistry()

// Register custom templates
registry.register(new CSSCustomPropertiesTemplate())
registry.register(new JSONConfigTemplate())
registry.register(new SCSSVariablesTemplate())

// Example color set
const exampleColors = {
  dark: {
    shade0: '#1a1a1a',
    shade1: '#2a2a2a',
    shade2: '#3a3a3a',
    shade3: '#4a4a4a',
    shade4: '#5a5a5a',
    shade5: '#6a6a6a',
    shade6: '#8a8a8a',
    shade7: '#ffffff',
    accent0: '#ff5555',
    accent1: '#ffb86c',
    accent2: '#f1fa8c',
    accent3: '#50fa7b',
    accent4: '#8be9fd',
    accent5: '#bd93f9',
    accent6: '#ff79c6',
    accent7: '#f8f8f2'
  }
}

module.exports = {
  templateCategories,
  ThemerTemplate,
  CSSCustomPropertiesTemplate,
  JSONConfigTemplate,
  SCSSVariablesTemplate,
  TemplateRegistry,
  registry,
  exampleColors
}