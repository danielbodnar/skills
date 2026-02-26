// Themer TypeScript Type Definitions

declare module 'themer' {
  // Color Set Types
  export interface ColorSet {
    name: string
    description?: string
    author?: string
    version?: string
    colors: {
      [variant: string]: ColorVariant
    }
    metadata?: ColorSetMetadata
  }

  export interface ColorVariant {
    // Background shades (darkest to lightest for dark themes)
    shade0: HexColor  // Primary background
    shade1: HexColor  // Secondary background
    shade2: HexColor  // Selection background
    shade3: HexColor  // Line highlight
    shade4: HexColor  // Comments
    shade5: HexColor  // Secondary text
    shade6: HexColor  // Primary text
    shade7: HexColor  // Bright text
    
    // Accent colors for syntax highlighting
    accent0: HexColor // Red - errors, deletions
    accent1: HexColor // Orange - constants, numbers
    accent2: HexColor // Yellow - strings
    accent3: HexColor // Green - additions, success
    accent4: HexColor // Cyan - info, links
    accent5: HexColor // Blue/Purple - keywords
    accent6: HexColor // Pink - storage, functions
    accent7: HexColor // Additional accent
  }

  export interface ColorSetMetadata {
    inspiration?: string
    tags?: string[]
    category?: 'dark' | 'light' | 'high-contrast' | 'colorful' | 'minimal' | 'retro' | 'modern'
    accessibility?: {
      contrastRatio?: number
      wcagLevel?: 'AA' | 'AAA'
    }
  }

  export type HexColor = string // Format: #RRGGBB

  // Template Types
  export interface Template {
    name: string
    render: (colors: ColorVariants) => TemplateOutput
    renderInstructions?: TemplateMetadata
  }

  export interface TemplateMetadata {
    name: string
    version: string
    description: string
    author: string
  }

  export type TemplateOutput = {
    [filename: string]: string
  }

  export interface ColorVariants {
    dark?: ColorVariant
    light?: ColorVariant
    [variant: string]: ColorVariant | undefined
  }

  // CLI Types
  export interface ThemerOptions {
    colorSet: string | ColorSet
    templates: string[]
    output: string
    variant?: 'dark' | 'light' | 'both'
  }

  // API Functions
  export function colorSetToVariants(colorSet: ColorSet): ColorVariants
  export function render(template: Template, variants: ColorVariants): Promise<TemplateOutput>
}

declare module 'themer/lib/color-set' {
  import { ColorSet, ColorVariants } from 'themer'
  
  export function colorSetToVariants(colorSet: ColorSet): ColorVariants
  export function validateColorSet(colorSet: ColorSet): {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
}

declare module 'themer/lib/template' {
  import { Template, ColorVariants, TemplateOutput } from 'themer'
  
  export function render(template: Template, variants: ColorVariants): Promise<TemplateOutput>
  export function loadTemplate(templateName: string): Promise<Template>
}

// Template Package Types
declare module 'themer-vim' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-vscode' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-atom-syntax' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-atom-ui' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-sublime-text' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-iterm' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-terminal' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-hyper' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-wallpaper-triangles' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-wallpaper-circuits' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

declare module 'themer-slack' {
  import { Template } from 'themer'
  const template: Template
  export = template
}

// Utility Types
export namespace Themer {
  // Color manipulation utilities
  export interface RGB {
    r: number
    g: number
    b: number
  }

  export interface HSL {
    h: number
    s: number
    l: number
  }

  export interface ColorUtils {
    hexToRgb(hex: HexColor): RGB
    rgbToHex(r: number, g: number, b: number): HexColor
    hexToHsl(hex: HexColor): HSL
    hslToHex(h: number, s: number, l: number): HexColor
    lighten(hex: HexColor, amount: number): HexColor
    darken(hex: HexColor, amount: number): HexColor
    blend(color1: HexColor, color2: HexColor, ratio?: number): HexColor
    contrastRatio(color1: HexColor, color2: HexColor): number
  }

  // Semantic color mapping
  export interface SemanticColors {
    background: {
      primary: HexColor
      secondary: HexColor
      tertiary: HexColor
    }
    text: {
      primary: HexColor
      secondary: HexColor
      disabled: HexColor
      bright: HexColor
    }
    syntax: {
      keyword: HexColor
      string: HexColor
      number: HexColor
      comment: HexColor
      function: HexColor
      variable: HexColor
      type: HexColor
      error: HexColor
    }
    ui: {
      border: HexColor
      selection: HexColor
      highlight: HexColor
      shadow: HexColor
    }
    states: {
      error: HexColor
      warning: HexColor
      success: HexColor
      info: HexColor
    }
  }

  // Template development helpers
  export interface TemplateHelpers {
    generateCSS(variant: ColorVariant, prefix?: string): string
    generateSCSS(variant: ColorVariant, prefix?: string): string
    generateJSON(variant: ColorVariant): string
    generateSemanticMapping(variant: ColorVariant): SemanticColors
  }

  // Validation types
  export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }

  export interface ValidationError {
    code: string
    message: string
    path: string
  }

  export interface ValidationWarning {
    code: string
    message: string
    path: string
    severity: 'low' | 'medium' | 'high'
  }

  // Template creation helpers
  export interface TemplateBuilder {
    name: string
    description: string
    render: (colors: ColorVariants) => TemplateOutput
    withMetadata(metadata: Partial<TemplateMetadata>): TemplateBuilder
    withValidator(validator: (colors: ColorVariants) => ValidationResult): TemplateBuilder
    build(): Template
  }

  // Batch processing types
  export interface BatchTask {
    id: string
    colorSet: ColorSet | string
    templates: string[]
    outputDir: string
    options?: {
      variant?: 'dark' | 'light' | 'both'
      overwrite?: boolean
      validate?: boolean
    }
  }

  export interface BatchResult {
    taskId: string
    success: boolean
    result?: TemplateOutput
    error?: string
    duration?: number
  }

  // Configuration types
  export interface ThemerConfig {
    colorSets: {
      [name: string]: ColorSet | string
    }
    templates: {
      [name: string]: Template | string
    }
    outputDir: string
    defaultVariant?: 'dark' | 'light' | 'both'
    validation?: {
      enabled: boolean
      strict: boolean
      contrastThreshold: number
    }
    watch?: {
      enabled: boolean
      debounceMs: number
      patterns: string[]
    }
  }

  // Plugin types for build tools
  export interface WebpackPluginOptions {
    colorSetPath: string
    templates: string[]
    outputPath: string
    watch?: boolean
  }

  export interface VitePluginOptions {
    colorSetPath: string
    templates: string[]
    outputPath: string
    hmr?: boolean
  }

  export interface GulpTaskOptions {
    colorSets: string[]
    templates: string[]
    outputDir: string
    watch?: boolean
    clean?: boolean
  }
}

// Global augmentations for popular template engines
declare global {
  namespace ThemerTemplates {
    interface AvailableTemplates {
      'vim': 'themer-vim'
      'vscode': 'themer-vscode'
      'atom-syntax': 'themer-atom-syntax'
      'atom-ui': 'themer-atom-ui'
      'sublime-text': 'themer-sublime-text'
      'emacs': 'themer-emacs'
      'brackets': 'themer-brackets'
      'iterm': 'themer-iterm'
      'terminal': 'themer-terminal'
      'hyper': 'themer-hyper'
      'windows-terminal': 'themer-windows-terminal'
      'gnome-terminal': 'themer-gnome-terminal'
      'wallpaper-triangles': 'themer-wallpaper-triangles'
      'wallpaper-circuits': 'themer-wallpaper-circuits'
      'wallpaper-dot-grid': 'themer-wallpaper-dot-grid'
      'slack': 'themer-slack'
      'chrome': 'themer-chrome'
      'firefox': 'themer-firefox'
    }
  }
}

// Export main types
export {
  ColorSet,
  ColorVariant,
  ColorVariants,
  Template,
  TemplateOutput,
  ThemerOptions,
  HexColor
} from 'themer'