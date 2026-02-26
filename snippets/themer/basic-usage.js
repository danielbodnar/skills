// Themer Basic Usage Examples

// 1. CLI Installation and Setup
// Global installation: bun add -g themer
// Local installation: bun add themer

// 2. Basic CLI Commands
const basicCommands = `
# Generate themes with default color set
themer -c default -t vim -t iterm -o output

# Generate dark variant only
themer -c default -t vim --dark -o output

# Generate light variant only 
themer -c default -t vim --light -o output

# List available color sets
themer --list-color-sets

# List available templates
themer --list-templates

# Generate wallpaper themes
themer -c night-sky -t wallpaper-triangles -t wallpaper-circuits -o wallpapers

# Generate multiple editor themes
themer -c green-as-a-whistle -t vim -t vscode -t atom -o editors
`

// 3. Custom Color Set Example
const customColorSet = {
  name: 'my-custom-theme',
  colors: {
    dark: {
      // Background shades (darkest to lightest)
      shade0: '#1a1a1a',   // Primary background
      shade1: '#2a2a2a',   // Secondary background
      shade2: '#3a3a3a',   // Selection background
      shade3: '#4a4a4a',   // Line highlight
      shade4: '#5a5a5a',   // Comments
      shade5: '#6a6a6a',   // Secondary text
      shade6: '#8a8a8a',   // Primary text
      shade7: '#ffffff',   // Bright text
      
      // Accent colors for syntax highlighting
      accent0: '#ff5555',  // Red - errors, deletions
      accent1: '#ffb86c',  // Orange - constants, numbers
      accent2: '#f1fa8c',  // Yellow - strings
      accent3: '#50fa7b',  // Green - additions, success
      accent4: '#8be9fd',  // Cyan - info, links
      accent5: '#bd93f9',  // Purple - keywords
      accent6: '#ff79c6',  // Pink - storage, functions
      accent7: '#f8f8f2',  // White - plain text
    },
    light: {
      // Background shades (lightest to darkest)
      shade0: '#ffffff',   // Primary background
      shade1: '#f5f5f5',   // Secondary background
      shade2: '#e5e5e5',   // Selection background
      shade3: '#d5d5d5',   // Line highlight
      shade4: '#a5a5a5',   // Comments
      shade5: '#656565',   // Secondary text
      shade6: '#2a2a2a',   // Primary text
      shade7: '#000000',   // Bright text
      
      // Accent colors for syntax highlighting
      accent0: '#dc322f',  // Red - errors, deletions
      accent1: '#cb4b16',  // Orange - constants, numbers
      accent2: '#b58900',  // Yellow - strings
      accent3: '#859900',  // Green - additions, success
      accent4: '#2aa198',  // Cyan - info, links
      accent5: '#6c71c4',  // Purple - keywords
      accent6: '#d33682',  // Pink - storage, functions
      accent7: '#073642',  // Dark text
    }
  }
}

// 4. Programmatic API Usage
const { colorSetToVariants } = require('themer/lib/color-set')
const { render } = require('themer/lib/template')

// Generate color variants from color set
const variants = colorSetToVariants(customColorSet)

// Apply template to generate theme files
async function generateTheme() {
  const vimTemplate = require('themer-vim')
  const result = await render(vimTemplate, variants)
  
  // result contains generated theme files
  console.log('Generated files:', Object.keys(result))
  
  // Write files to disk
  Object.entries(result).forEach(([filename, content]) => {
    require('fs').writeFileSync(`output/${filename}`, content)
  })
}

// 5. Base16 Integration
const base16ColorSet = {
  name: 'base16-custom',
  colors: {
    dark: {
      shade0: '#2b303b',  // base00 - Default Background
      shade1: '#343d46',  // base01 - Lighter Background
      shade2: '#4f5b66',  // base02 - Selection Background
      shade3: '#65737e',  // base03 - Comments
      shade4: '#a7adba',  // base04 - Dark Foreground
      shade5: '#c0c5ce',  // base05 - Default Foreground
      shade6: '#dfe1e8',  // base06 - Light Foreground
      shade7: '#eff1f5',  // base07 - Light Background
      
      accent0: '#bf616a',  // base08 - Red
      accent1: '#d08770',  // base09 - Orange  
      accent2: '#ebcb8b',  // base0A - Yellow
      accent3: '#a3be8c',  // base0B - Green
      accent4: '#96b5b4',  // base0C - Cyan
      accent5: '#8fa1b3',  // base0D - Blue
      accent6: '#b48ead',  // base0E - Purple
      accent7: '#ab7967',  // base0F - Brown
    }
  }
}

// 6. Template Selection Examples
const templateExamples = {
  editors: [
    'atom-syntax',
    'atom-ui',
    'vim',
    'vscode',
    'sublime-text',
    'emacs',
    'brackets'
  ],
  terminals: [
    'iterm',
    'terminal',
    'windows-terminal',
    'gnome-terminal',
    'xfce-terminal',
    'termite'
  ],
  apps: [
    'slack',
    'chrome',
    'firefox',
    'alfred',
    'sketch-palettes'
  ],
  wallpapers: [
    'wallpaper-block-wave',
    'wallpaper-circuits',
    'wallpaper-dot-grid',
    'wallpaper-octagon',
    'wallpaper-triangles',
    'wallpaper-trianglify'
  ]
}

// 7. Batch Generation Script
function generateAllThemes(colorSetName) {
  const templates = [
    'vim', 'vscode', 'iterm', 'atom-syntax',
    'wallpaper-triangles', 'slack'
  ]
  
  templates.forEach(template => {
    const outputDir = `themes/${colorSetName}/${template}`
    const command = `themer -c ${colorSetName} -t ${template} -o ${outputDir}`
    
    console.log(`Generating ${template} theme...`)
    require('child_process').execSync(command, { stdio: 'inherit' })
  })
}

// 8. Color Validation Function
function validateColorSet(colorSet) {
  const requiredShades = ['shade0', 'shade1', 'shade2', 'shade3', 'shade4', 'shade5', 'shade6', 'shade7']
  const requiredAccents = ['accent0', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'accent7']
  
  const variants = ['dark', 'light']
  const errors = []
  
  variants.forEach(variant => {
    if (!colorSet.colors[variant]) {
      errors.push(`Missing ${variant} variant`)
      return
    }
    
    const colors = colorSet.colors[variant]
    
    requiredShades.forEach(shade => {
      if (!colors[shade]) {
        errors.push(`Missing ${shade} in ${variant} variant`)
      }
    })
    
    requiredAccents.forEach(accent => {
      if (!colors[accent]) {
        errors.push(`Missing ${accent} in ${variant} variant`)
      }
    })
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 9. Theme Preview Generator
function generatePreviewHTML(colorSet) {
  const { dark, light } = colorSet.colors
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Theme Preview: ${colorSet.name}</title>
  <style>
    .variant { display: inline-block; margin: 20px; padding: 20px; }
    .color-swatch { 
      display: inline-block; 
      width: 50px; 
      height: 50px; 
      margin: 5px;
      border: 1px solid #ccc;
    }
    .shade { background: var(--color); }
  </style>
</head>
<body>
  <div class="variant">
    <h2>Dark Variant</h2>
    ${Object.entries(dark).map(([name, color]) => 
      `<div class="color-swatch" style="background: ${color}" title="${name}: ${color}"></div>`
    ).join('')}
  </div>
  
  <div class="variant">
    <h2>Light Variant</h2>
    ${Object.entries(light).map(([name, color]) => 
      `<div class="color-swatch" style="background: ${color}" title="${name}: ${color}"></div>`
    ).join('')}
  </div>
</body>
</html>
  `
}

module.exports = {
  customColorSet,
  base16ColorSet,
  templateExamples,
  generateAllThemes,
  validateColorSet,
  generatePreviewHTML
}