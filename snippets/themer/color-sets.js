// Themer Color Set Examples and Templates

// 1. Popular Color Set Examples
const colorSets = {
  // Dracula inspired
  dracula: {
    name: 'dracula-inspired',
    colors: {
      dark: {
        shade0: '#282a36',  // Background
        shade1: '#44475a',  // Current Line
        shade2: '#44475a',  // Selection
        shade3: '#6272a4',  // Comment
        shade4: '#6272a4',  // Comment
        shade5: '#f8f8f2',  // Foreground
        shade6: '#f8f8f2',  // Foreground
        shade7: '#ffffff',  // White
        
        accent0: '#ff5555', // Red
        accent1: '#ffb86c', // Orange
        accent2: '#f1fa8c', // Yellow
        accent3: '#50fa7b', // Green
        accent4: '#8be9fd', // Cyan
        accent5: '#bd93f9', // Purple
        accent6: '#ff79c6', // Pink
        accent7: '#f8f8f2', // Foreground
      }
    }
  },
  
  // Solarized inspired
  solarized: {
    name: 'solarized-inspired',
    colors: {
      dark: {
        shade0: '#002b36',  // base03
        shade1: '#073642',  // base02
        shade2: '#586e75',  // base01
        shade3: '#657b83',  // base00
        shade4: '#839496',  // base0
        shade5: '#93a1a1',  // base1
        shade6: '#eee8d5',  // base2
        shade7: '#fdf6e3',  // base3
        
        accent0: '#dc322f', // red
        accent1: '#cb4b16', // orange
        accent2: '#b58900', // yellow
        accent3: '#859900', // green
        accent4: '#2aa198', // cyan
        accent5: '#268bd2', // blue
        accent6: '#6c71c4', // violet
        accent7: '#d33682', // magenta
      },
      light: {
        shade0: '#fdf6e3',  // base3
        shade1: '#eee8d5',  // base2
        shade2: '#93a1a1',  // base1
        shade3: '#839496',  // base0
        shade4: '#657b83',  // base00
        shade5: '#586e75',  // base01
        shade6: '#073642',  // base02
        shade7: '#002b36',  // base03
        
        accent0: '#dc322f', // red
        accent1: '#cb4b16', // orange
        accent2: '#b58900', // yellow
        accent3: '#859900', // green
        accent4: '#2aa198', // cyan
        accent5: '#268bd2', // blue
        accent6: '#6c71c4', // violet
        accent7: '#d33682', // magenta
      }
    }
  },
  
  // One Dark inspired
  oneDark: {
    name: 'one-dark-inspired',
    colors: {
      dark: {
        shade0: '#282c34',  // Background
        shade1: '#2c313c',  // Gutter
        shade2: '#3e4451',  // Selection
        shade3: '#5c6370',  // Comment
        shade4: '#5c6370',  // Comment
        shade5: '#abb2bf',  // Foreground
        shade6: '#abb2bf',  // Foreground
        shade7: '#ffffff',  // White
        
        accent0: '#e06c75', // Red
        accent1: '#d19a66', // Orange
        accent2: '#e5c07b', // Yellow
        accent3: '#98c379', // Green
        accent4: '#56b6c2', // Cyan
        accent5: '#61afef', // Blue
        accent6: '#c678dd', // Purple
        accent7: '#be5046', // Dark Red
      }
    }
  },
  
  // Material Design inspired
  material: {
    name: 'material-inspired',
    colors: {
      dark: {
        shade0: '#263238',  // Background
        shade1: '#2e3c43',  // Panel
        shade2: '#314549',  // Selection
        shade3: '#546e7a',  // Comments
        shade4: '#546e7a',  // Disabled
        shade5: '#b2ccd6',  // Foreground
        shade6: '#eeffff',  // Text
        shade7: '#ffffff',  // White
        
        accent0: '#f07178', // Red
        accent1: '#f78c6c', // Orange
        accent2: '#ffcb6b', // Yellow
        accent3: '#c3e88d', // Green
        accent4: '#89ddff', // Cyan
        accent5: '#82aaff', // Blue
        accent6: '#c792ea', // Purple
        accent7: '#ff5370', // Pink
      },
      light: {
        shade0: '#fafafa',  // Background
        shade1: '#f4f4f4',  // Panel
        shade2: '#e7eaec',  // Selection
        shade3: '#90a4ae',  // Comments
        shade4: '#90a4ae',  // Disabled
        shade5: '#546e7a',  // Foreground
        shade6: '#263238',  // Text
        shade7: '#000000',  // Black
        
        accent0: '#e53935', // Red
        accent1: '#ff6f00', // Orange
        accent2: '#ffb300', // Yellow
        accent3: '#689f63', // Green
        accent4: '#39adb5', // Cyan
        accent5: '#6182b8', // Blue
        accent6: '#7c4dff', // Purple
        accent7: '#ad1457', // Pink
      }
    }
  },
  
  // Monokai inspired
  monokai: {
    name: 'monokai-inspired',
    colors: {
      dark: {
        shade0: '#272822',  // Background
        shade1: '#383830',  // Selection
        shade2: '#49483e',  // Line highlight
        shade3: '#75715e',  // Comment
        shade4: '#75715e',  // Comment
        shade5: '#f8f8f2',  // Foreground
        shade6: '#f8f8f2',  // Foreground
        shade7: '#f9f8f5',  // White
        
        accent0: '#f92672', // Red/Pink
        accent1: '#fd971f', // Orange
        accent2: '#e6db74', // Yellow
        accent3: '#a6e22e', // Green
        accent4: '#66d9ef', // Cyan
        accent5: '#ae81ff', // Purple
        accent6: '#f92672', // Pink
        accent7: '#f8f8f0', // White
      }
    }
  }
}

// 2. Color Set Builder Class
class ColorSetBuilder {
  constructor(name) {
    this.colorSet = {
      name,
      colors: {}
    }
  }
  
  addVariant(variant, colors) {
    this.colorSet.colors[variant] = colors
    return this
  }
  
  // Build from base colors
  fromBase(variant, background, foreground, accents) {
    const shades = this.generateShadeProgression(background, foreground)
    
    this.colorSet.colors[variant] = {
      ...shades,
      ...accents
    }
    
    return this
  }
  
  generateShadeProgression(bg, fg) {
    // Simplified shade generation
    return {
      shade0: bg,
      shade1: this.adjustBrightness(bg, 0.1),
      shade2: this.adjustBrightness(bg, 0.2),
      shade3: this.adjustBrightness(bg, 0.3),
      shade4: this.interpolateColors(bg, fg, 0.4),
      shade5: this.interpolateColors(bg, fg, 0.6),
      shade6: this.adjustBrightness(fg, -0.1),
      shade7: fg
    }
  }
  
  adjustBrightness(hex, factor) {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + factor * 255))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + factor * 255))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + factor * 255))
    
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
  }
  
  interpolateColors(color1, color2, factor) {
    const c1 = parseInt(color1.slice(1), 16)
    const c2 = parseInt(color2.slice(1), 16)
    
    const r1 = (c1 >> 16) & 0xff
    const g1 = (c1 >> 8) & 0xff
    const b1 = c1 & 0xff
    
    const r2 = (c2 >> 16) & 0xff
    const g2 = (c2 >> 8) & 0xff
    const b2 = c2 & 0xff
    
    const r = Math.round(r1 + (r2 - r1) * factor)
    const g = Math.round(g1 + (g2 - g1) * factor)
    const b = Math.round(b1 + (b2 - b1) * factor)
    
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
  }
  
  build() {
    return this.colorSet
  }
}

// 3. Semantic Color Roles
const semanticRoles = {
  // Editor UI elements
  editor: {
    background: 'shade0',
    lineHighlight: 'shade1',
    selection: 'shade2',
    gutterBackground: 'shade1',
    gutterForeground: 'shade4'
  },
  
  // Text elements
  text: {
    primary: 'shade6',
    secondary: 'shade5',
    disabled: 'shade4',
    comments: 'shade3',
    bright: 'shade7'
  },
  
  // Syntax highlighting
  syntax: {
    keyword: 'accent5',      // Purple - keywords, control flow
    string: 'accent2',       // Yellow - strings, text
    number: 'accent1',       // Orange - numbers, constants
    comment: 'shade3',       // Muted - comments
    function: 'accent6',     // Pink - function names
    variable: 'accent4',     // Cyan - variables
    type: 'accent3',         // Green - types, classes
    error: 'accent0'         // Red - errors, warnings
  },
  
  // UI states
  states: {
    error: 'accent0',        // Red
    warning: 'accent1',      // Orange
    success: 'accent3',      // Green
    info: 'accent4',         // Cyan
    primary: 'accent5',      // Purple/Blue
    secondary: 'accent6'     // Pink
  }
}

// 4. Color Accessibility Helpers
class ColorAccessibility {
  // Calculate contrast ratio between two colors
  static contrastRatio(color1, color2) {
    const l1 = this.relativeLuminance(color1)
    const l2 = this.relativeLuminance(color2)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }
  
  static relativeLuminance(hex) {
    const rgb = this.hexToRgb(hex)
    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  static hexToRgb(hex) {
    const num = parseInt(hex.slice(1), 16)
    return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
  }
  
  // Check WCAG compliance
  static checkWCAG(colorSet, variant = 'dark') {
    const colors = colorSet.colors[variant]
    const results = []
    
    // Check background/foreground contrast
    const bgFgRatio = this.contrastRatio(colors.shade0, colors.shade6)
    results.push({
      pair: 'background/foreground',
      ratio: bgFgRatio,
      aa: bgFgRatio >= 4.5,
      aaa: bgFgRatio >= 7
    })
    
    // Check accent colors against background
    for (let i = 0; i < 8; i++) {
      const accentKey = `accent${i}`
      const ratio = this.contrastRatio(colors.shade0, colors[accentKey])
      results.push({
        pair: `background/${accentKey}`,
        ratio,
        aa: ratio >= 4.5,
        aaa: ratio >= 7
      })
    }
    
    return results
  }
}

// 5. Export Functions
function createCustomColorSet(name, config) {
  return new ColorSetBuilder(name)
    .fromBase('dark', config.dark.bg, config.dark.fg, config.dark.accents)
    .fromBase('light', config.light.bg, config.light.fg, config.light.accents)
    .build()
}

function validateColorSetAccessibility(colorSet) {
  const results = {}
  
  Object.keys(colorSet.colors).forEach(variant => {
    results[variant] = ColorAccessibility.checkWCAG(colorSet, variant)
  })
  
  return results
}

// 6. Popular Theme Presets
const themePresets = {
  // High contrast themes for accessibility
  highContrast: {
    dark: {
      bg: '#000000',
      fg: '#ffffff',
      accents: {
        accent0: '#ff0000', // Pure red
        accent1: '#ff8800', // Orange
        accent2: '#ffff00', // Yellow
        accent3: '#00ff00', // Green
        accent4: '#00ffff', // Cyan
        accent5: '#0088ff', // Blue
        accent6: '#ff00ff', // Magenta
        accent7: '#ffffff'  // White
      }
    },
    light: {
      bg: '#ffffff',
      fg: '#000000',
      accents: {
        accent0: '#cc0000', // Dark red
        accent1: '#cc6600', // Dark orange
        accent2: '#996600', // Dark yellow
        accent3: '#006600', // Dark green
        accent4: '#006666', // Dark cyan
        accent5: '#0066cc', // Dark blue
        accent6: '#660066', // Dark magenta
        accent7: '#000000'  // Black
      }
    }
  },
  
  // Warm theme
  warm: {
    dark: {
      bg: '#2d1b15',
      fg: '#f5deb3',
      accents: {
        accent0: '#ff6b6b',
        accent1: '#ffa500',
        accent2: '#ffd700',
        accent3: '#90ee90',
        accent4: '#87ceeb',
        accent5: '#dda0dd',
        accent6: '#f0a0a0',
        accent7: '#fff8dc'
      }
    }
  },
  
  // Cool theme
  cool: {
    dark: {
      bg: '#0f1419',
      fg: '#e6e1dc',
      accents: {
        accent0: '#f07178',
        accent1: '#ff8f40',
        accent2: '#ffee99',
        accent3: '#91b362',
        accent4: '#95e6cb',
        accent5: '#5ccfe6',
        accent6: '#d4bfff',
        accent7: '#f29e74'
      }
    }
  }
}

module.exports = {
  colorSets,
  ColorSetBuilder,
  semanticRoles,
  ColorAccessibility,
  createCustomColorSet,
  validateColorSetAccessibility,
  themePresets
}