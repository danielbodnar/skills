// Themer Configuration and Advanced Usage

// 1. Package.json Scripts for Theme Management
const packageJsonScripts = {
  "scripts": {
    "theme:generate": "themer -c my-theme -t vim -t vscode -t iterm -o themes",
    "theme:dark": "themer -c my-theme -t vim --dark -o themes/dark",
    "theme:light": "themer -c my-theme -t vim --light -o themes/light",
    "theme:wallpaper": "themer -c my-theme -t wallpaper-triangles -o wallpapers",
    "theme:all": "npm run theme:generate && npm run theme:wallpaper",
    "theme:preview": "node scripts/generate-preview.js"
  },
  "devDependencies": {
    "themer": "^4.1.2",
    "themer-vim": "^2.0.2",
    "themer-vscode": "^2.2.1",
    "themer-iterm": "^5.0.1",
    "themer-wallpaper-triangles": "^2.0.2"
  }
}

// 2. Advanced Color Set with Semantic Naming
const advancedColorSet = {
  name: 'semantic-theme',
  colors: {
    dark: {
      // Base colors
      shade0: '#0d1117',   // editor.background
      shade1: '#161b22',   // editor.lineHighlightBackground
      shade2: '#21262d',   // editor.selectionBackground
      shade3: '#262c36',   // editorIndentGuide.background
      shade4: '#484f58',   // editorLineNumber.foreground
      shade5: '#6e7681',   // editor.foreground (dimmed)
      shade6: '#c9d1d9',   // editor.foreground
      shade7: '#f0f6fc',   // editor.foreground (bright)
      
      // Semantic accent colors
      accent0: '#f85149',  // errorForeground, diffEditor.removedTextBackground
      accent1: '#ff8c00',  // warningForeground, constant.numeric
      accent2: '#f0e68c',  // string, variable.other.enummember
      accent3: '#56d364',  // diffEditor.insertedTextBackground, string.regexp
      accent4: '#79c0ff',  // variable.other.readwrite, support.type
      accent5: '#d2a8ff',  // keyword, storage.type
      accent6: '#ffa198',  // support.function, entity.name.function
      accent7: '#e6edf3',  // punctuation, meta.brace
    },
    light: {
      // Base colors
      shade0: '#ffffff',   // editor.background
      shade1: '#f6f8fa',   // editor.lineHighlightBackground
      shade2: '#0969da20', // editor.selectionBackground
      shade3: '#d0d7de',   // editorIndentGuide.background
      shade4: '#656d76',   // editorLineNumber.foreground
      shade5: '#6f7682',   // editor.foreground (dimmed)
      shade6: '#24292f',   // editor.foreground
      shade7: '#1b1f23',   // editor.foreground (bright)
      
      // Semantic accent colors
      accent0: '#cf222e',  // errorForeground, diffEditor.removedTextBackground
      accent1: '#fb8500',  // warningForeground, constant.numeric
      accent2: '#0550ae',  // string, variable.other.enummember
      accent3: '#1a7f37',  // diffEditor.insertedTextBackground, string.regexp
      accent4: '#0969da',  // variable.other.readwrite, support.type
      accent5: '#8250df',  // keyword, storage.type
      accent6: '#a40e26',  // support.function, entity.name.function
      accent7: '#656d76',  // punctuation, meta.brace
    }
  }
}

// 3. Color Set Generator Functions
class ThemerColorGenerator {
  // Generate color variations
  static lighten(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, (num >> 8 & 0x00FF) + amount)
    const b = Math.min(255, (num & 0x0000FF) + amount)
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
  }
  
  static darken(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - amount)
    const g = Math.max(0, (num >> 8 & 0x00FF) - amount)
    const b = Math.max(0, (num & 0x0000FF) - amount)
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
  }
  
  // Generate shade progression
  static generateShades(baseBackground, baseForeground) {
    const bg = baseBackground
    const fg = baseForeground
    
    return {
      shade0: bg,
      shade1: this.lighten(bg, 15),
      shade2: this.lighten(bg, 25),
      shade3: this.lighten(bg, 35),
      shade4: this.lighten(bg, 60),
      shade5: this.darken(fg, 60),
      shade6: this.darken(fg, 15),
      shade7: fg
    }
  }
  
  // Generate accent colors from primary palette
  static generateAccents(primary) {
    return {
      accent0: primary.red || '#ff5555',
      accent1: primary.orange || '#ffb86c',
      accent2: primary.yellow || '#f1fa8c',
      accent3: primary.green || '#50fa7b',
      accent4: primary.cyan || '#8be9fd',
      accent5: primary.blue || '#bd93f9',
      accent6: primary.purple || '#ff79c6',
      accent7: primary.white || '#f8f8f2'
    }
  }
  
  // Create complete color set
  static createColorSet(name, config) {
    const { dark, light, accents } = config
    
    return {
      name,
      colors: {
        dark: {
          ...this.generateShades(dark.background, dark.foreground),
          ...this.generateAccents(accents.dark || accents)
        },
        light: {
          ...this.generateShades(light.background, light.foreground),
          ...this.generateAccents(accents.light || accents)
        }
      }
    }
  }
}

// 4. Template Configuration
const templateConfig = {
  // Configure specific template options
  vim: {
    variant: 'both',
    italics: true,
    background: 'dark'
  },
  vscode: {
    variant: 'both',
    italics: true,
    tokenColorCustomizations: {
      comments: '#6A9955',
      functions: '#DCDCAA',
      keywords: '#569CD6',
      strings: '#CE9178'
    }
  },
  iterm: {
    variant: 'both',
    ansiColors: true,
    brightColors: true
  },
  wallpaper: {
    variant: 'dark',
    size: '1920x1080',
    pattern: 'triangles'
  }
}

// 5. Workflow Automation
class ThemerWorkflow {
  constructor(colorSetPath, outputDir) {
    this.colorSetPath = colorSetPath
    this.outputDir = outputDir
  }
  
  async generateAll() {
    const templates = [
      'vim', 'vscode', 'atom-syntax', 'sublime-text',
      'iterm', 'terminal', 'hyper',
      'wallpaper-triangles', 'wallpaper-circuits'
    ]
    
    for (const template of templates) {
      await this.generateTemplate(template)
    }
  }
  
  async generateTemplate(template) {
    const { spawn } = require('child_process')
    
    return new Promise((resolve, reject) => {
      const args = [
        '-c', this.colorSetPath,
        '-t', template,
        '-o', `${this.outputDir}/${template}`
      ]
      
      const child = spawn('themer', args, { stdio: 'inherit' })
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✓ Generated ${template} theme`)
          resolve()
        } else {
          reject(new Error(`Failed to generate ${template} theme`))
        }
      })
    })
  }
  
  async createPreview() {
    // Generate HTML preview of all themes
    const colorSet = require(this.colorSetPath)
    const previewHTML = this.generatePreviewHTML(colorSet)
    
    require('fs').writeFileSync(
      `${this.outputDir}/preview.html`,
      previewHTML
    )
  }
  
  generatePreviewHTML(colorSet) {
    // Implementation from basic-usage.js
    return `<!-- Preview HTML content -->`
  }
}

// 6. Custom Template Creation
const customTemplate = {
  name: 'my-custom-app',
  render: (colors) => {
    const { dark, light } = colors
    
    return {
      'dark-theme.css': `
        :root {
          --bg-primary: ${dark.shade0};
          --bg-secondary: ${dark.shade1};
          --text-primary: ${dark.shade6};
          --text-secondary: ${dark.shade5};
          --accent-primary: ${dark.accent5};
          --accent-danger: ${dark.accent0};
          --accent-success: ${dark.accent3};
        }
      `,
      'light-theme.css': `
        :root {
          --bg-primary: ${light.shade0};
          --bg-secondary: ${light.shade1};
          --text-primary: ${light.shade6};
          --text-secondary: ${light.shade5};
          --accent-primary: ${light.accent5};
          --accent-danger: ${light.accent0};
          --accent-success: ${light.accent3};
        }
      `
    }
  }
}

// 7. Theme Testing and Validation
class ThemerValidator {
  static validateColorSet(colorSet) {
    const errors = []
    const warnings = []
    
    // Check required properties
    if (!colorSet.name) errors.push('Color set must have a name')
    if (!colorSet.colors) errors.push('Color set must have colors object')
    
    // Check variants
    const variants = ['dark', 'light']
    variants.forEach(variant => {
      if (!colorSet.colors[variant]) {
        errors.push(`Missing ${variant} variant`)
        return
      }
      
      // Check contrast ratios
      const bg = colorSet.colors[variant].shade0
      const text = colorSet.colors[variant].shade6
      const contrast = this.getContrastRatio(bg, text)
      
      if (contrast < 4.5) {
        warnings.push(`Low contrast ratio (${contrast.toFixed(2)}) in ${variant} variant`)
      }
    })
    
    return { errors, warnings }
  }
  
  static getContrastRatio(color1, color2) {
    // Simplified contrast ratio calculation
    const l1 = this.getLuminance(color1)
    const l2 = this.getLuminance(color2)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }
  
  static getLuminance(hex) {
    const rgb = parseInt(hex.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }
}

// 8. Integration with Build Tools
const gulpConfig = `
const gulp = require('gulp')
const { spawn } = require('child_process')

gulp.task('themes', () => {
  return new Promise((resolve, reject) => {
    const child = spawn('themer', [
      '-c', 'src/colors.js',
      '-t', 'vim',
      '-t', 'vscode',
      '-o', 'dist/themes'
    ], { stdio: 'inherit' })
    
    child.on('close', (code) => {
      code === 0 ? resolve() : reject()
    })
  })
})

gulp.task('watch-themes', () => {
  gulp.watch('src/colors.js', gulp.series('themes'))
})
`

module.exports = {
  packageJsonScripts,
  advancedColorSet,
  ThemerColorGenerator,
  templateConfig,
  ThemerWorkflow,
  customTemplate,
  ThemerValidator,
  gulpConfig
}