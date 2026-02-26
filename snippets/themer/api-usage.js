// Themer Programmatic API Usage Examples

// 1. Basic API Usage
const themer = require('themer')
const { colorSetToVariants } = require('themer/lib/color-set')
const { render } = require('themer/lib/template')
const fs = require('fs').promises
const path = require('path')

// 2. Color Set Processing
class ThemerAPI {
  constructor() {
    this.templates = new Map()
    this.colorSets = new Map()
  }
  
  // Load color set from file or object
  async loadColorSet(source) {
    if (typeof source === 'string') {
      // Load from file
      const colorSetPath = path.resolve(source)
      delete require.cache[colorSetPath] // Clear cache
      return require(colorSetPath)
    } else {
      // Use provided object
      return source
    }
  }
  
  // Generate variants from color set
  generateVariants(colorSet) {
    return colorSetToVariants(colorSet)
  }
  
  // Load and register template
  async loadTemplate(templateName) {
    try {
      const template = require(`themer-${templateName}`)
      this.templates.set(templateName, template)
      return template
    } catch (error) {
      throw new Error(`Template '${templateName}' not found. Install with: npm install themer-${templateName}`)
    }
  }
  
  // Render template with color variants
  async renderTemplate(templateName, variants) {
    const template = this.templates.get(templateName) || await this.loadTemplate(templateName)
    return render(template, variants)
  }
  
  // Generate themes for multiple templates
  async generateThemes(colorSet, templates, outputDir = './output') {
    const variants = this.generateVariants(colorSet)
    const results = {}
    
    for (const templateName of templates) {
      try {
        const output = await this.renderTemplate(templateName, variants)
        const templateDir = path.join(outputDir, templateName)
        
        // Ensure output directory exists
        await fs.mkdir(templateDir, { recursive: true })
        
        // Write generated files
        for (const [filename, content] of Object.entries(output)) {
          const filePath = path.join(templateDir, filename)
          await fs.writeFile(filePath, content, 'utf8')
        }
        
        results[templateName] = {
          success: true,
          files: Object.keys(output),
          directory: templateDir
        }
        
        console.log(`✓ Generated ${templateName} theme (${Object.keys(output).length} files)`)
      } catch (error) {
        results[templateName] = {
          success: false,
          error: error.message
        }
        console.error(`✗ Failed to generate ${templateName} theme:`, error.message)
      }
    }
    
    return results
  }
}

// 3. Advanced Color Set Manipulation
class ColorSetProcessor {
  // Merge multiple color sets
  static merge(...colorSets) {
    const merged = {
      name: colorSets.map(cs => cs.name).join('-'),
      colors: {}
    }
    
    // Merge variants
    const allVariants = new Set(
      colorSets.flatMap(cs => Object.keys(cs.colors || {}))
    )
    
    for (const variant of allVariants) {
      merged.colors[variant] = {}
      
      // Merge colors for this variant
      for (const colorSet of colorSets) {
        if (colorSet.colors && colorSet.colors[variant]) {
          Object.assign(merged.colors[variant], colorSet.colors[variant])
        }
      }
    }
    
    return merged
  }
  
  // Transform color set
  static transform(colorSet, transformer) {
    const transformed = JSON.parse(JSON.stringify(colorSet))
    
    Object.keys(transformed.colors).forEach(variant => {
      Object.keys(transformed.colors[variant]).forEach(colorKey => {
        transformed.colors[variant][colorKey] = transformer(
          transformed.colors[variant][colorKey],
          colorKey,
          variant
        )
      })
    })
    
    return transformed
  }
  
  // Create variant from existing variant
  static createVariant(colorSet, sourceVariant, targetVariant, transformer) {
    const source = colorSet.colors[sourceVariant]
    if (!source) {
      throw new Error(`Source variant '${sourceVariant}' not found`)
    }
    
    const result = JSON.parse(JSON.stringify(colorSet))
    result.colors[targetVariant] = {}
    
    Object.entries(source).forEach(([colorKey, colorValue]) => {
      result.colors[targetVariant][colorKey] = transformer 
        ? transformer(colorValue, colorKey)
        : colorValue
    })
    
    return result
  }
  
  // Validate color set structure
  static validate(colorSet) {
    const errors = []
    const warnings = []
    
    // Check required properties
    if (!colorSet.name) {
      errors.push('Color set must have a name')
    }
    
    if (!colorSet.colors || typeof colorSet.colors !== 'object') {
      errors.push('Color set must have a colors object')
      return { valid: false, errors, warnings }
    }
    
    // Check variants
    const variants = Object.keys(colorSet.colors)
    if (variants.length === 0) {
      errors.push('Color set must have at least one variant')
    }
    
    // Check each variant
    variants.forEach(variant => {
      const colors = colorSet.colors[variant]
      if (!colors || typeof colors !== 'object') {
        errors.push(`Variant '${variant}' must be an object`)
        return
      }
      
      // Check required shades
      for (let i = 0; i < 8; i++) {
        const shadeKey = `shade${i}`
        if (!colors[shadeKey]) {
          errors.push(`Missing ${shadeKey} in ${variant} variant`)
        } else if (!this.isValidHexColor(colors[shadeKey])) {
          errors.push(`Invalid hex color for ${shadeKey} in ${variant} variant`)
        }
      }
      
      // Check required accents
      for (let i = 0; i < 8; i++) {
        const accentKey = `accent${i}`
        if (!colors[accentKey]) {
          errors.push(`Missing ${accentKey} in ${variant} variant`)
        } else if (!this.isValidHexColor(colors[accentKey])) {
          errors.push(`Invalid hex color for ${accentKey} in ${variant} variant`)
        }
      }
      
      // Check contrast ratios (warnings)
      if (colors.shade0 && colors.shade6) {
        const contrast = this.calculateContrastRatio(colors.shade0, colors.shade6)
        if (contrast < 4.5) {
          warnings.push(`Low contrast ratio (${contrast.toFixed(2)}) between background and text in ${variant} variant`)
        }
      }
    })
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  static isValidHexColor(color) {
    return /^#[0-9A-Fa-f]{6}$/.test(color)
  }
  
  static calculateContrastRatio(color1, color2) {
    // Simplified contrast calculation
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
    const b = rgb & 0xff
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }
}

// 4. Template Development Helpers
class TemplateHelpers {
  // Color manipulation utilities
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
  
  static hexToRgb(hex) {
    const num = parseInt(hex.slice(1), 16)
    return {
      r: (num >> 16) & 0xff,
      g: (num >> 8) & 0xff,
      b: num & 0xff
    }
  }
  
  static rgbToHex(r, g, b) {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
  }
  
  static blend(color1, color2, ratio = 0.5) {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio)
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio)
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio)
    
    return this.rgbToHex(r, g, b)
  }
  
  // Template file generators
  static generateTemplate(templateName, renderFunction) {
    return {
      name: templateName,
      render: renderFunction,
      renderInstructions: {
        // Template metadata
        name: templateName,
        version: '1.0.0',
        description: `Generated template for ${templateName}`,
        author: 'Themer API'
      }
    }
  }
}

// 5. Batch Processing and Automation
class ThemeBatchProcessor {
  constructor(api = new ThemerAPI()) {
    this.api = api
    this.queue = []
  }
  
  // Add generation task to queue
  addTask(colorSet, templates, outputDir, options = {}) {
    this.queue.push({
      colorSet,
      templates,
      outputDir,
      options,
      id: Date.now() + Math.random()
    })
  }
  
  // Process all queued tasks
  async processQueue(options = {}) {
    const { parallel = false, maxConcurrency = 3 } = options
    
    if (parallel) {
      return this.processQueueParallel(maxConcurrency)
    } else {
      return this.processQueueSequential()
    }
  }
  
  async processQueueSequential() {
    const results = []
    
    for (const task of this.queue) {
      console.log(`Processing task ${task.id}...`)
      try {
        const result = await this.api.generateThemes(
          task.colorSet,
          task.templates,
          task.outputDir
        )
        results.push({ taskId: task.id, success: true, result })
      } catch (error) {
        results.push({ taskId: task.id, success: false, error: error.message })
      }
    }
    
    this.queue = []
    return results
  }
  
  async processQueueParallel(maxConcurrency) {
    const results = []
    const chunks = this.chunkArray(this.queue, maxConcurrency)
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async task => {
        try {
          const result = await this.api.generateThemes(
            task.colorSet,
            task.templates,
            task.outputDir
          )
          return { taskId: task.id, success: true, result }
        } catch (error) {
          return { taskId: task.id, success: false, error: error.message }
        }
      })
      
      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
    }
    
    this.queue = []
    return results
  }
  
  chunkArray(array, size) {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// 6. Usage Examples
async function examples() {
  const api = new ThemerAPI()
  
  // Example 1: Basic theme generation
  const colorSet = {
    name: 'my-theme',
    colors: {
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
  }
  
  try {
    const results = await api.generateThemes(
      colorSet,
      ['vim', 'vscode'],
      './themes'
    )
    console.log('Generation results:', results)
  } catch (error) {
    console.error('Generation failed:', error)
  }
  
  // Example 2: Color set transformation
  const lighterColorSet = ColorSetProcessor.transform(colorSet, (color, key, variant) => {
    if (key.startsWith('shade')) {
      return TemplateHelpers.lighten(color, 20)
    }
    return color
  })
  
  // Example 3: Batch processing
  const batchProcessor = new ThemeBatchProcessor(api)
  
  batchProcessor.addTask(colorSet, ['vim'], './themes/original')
  batchProcessor.addTask(lighterColorSet, ['vim'], './themes/lighter')
  
  const batchResults = await batchProcessor.processQueue({ parallel: true })
  console.log('Batch results:', batchResults)
  
  // Example 4: Color set validation
  const validation = ColorSetProcessor.validate(colorSet)
  if (!validation.valid) {
    console.error('Color set validation errors:', validation.errors)
  }
  if (validation.warnings.length > 0) {
    console.warn('Color set warnings:', validation.warnings)
  }
}

// 7. Export API classes and helpers
module.exports = {
  ThemerAPI,
  ColorSetProcessor,
  TemplateHelpers,
  ThemeBatchProcessor,
  examples
}

// Run examples if this file is executed directly
if (require.main === module) {
  examples().catch(console.error)
}