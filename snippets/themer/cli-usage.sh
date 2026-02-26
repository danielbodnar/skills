#!/bin/bash
# Themer CLI Usage Examples and Scripts

# 1. Basic Installation
echo "=== Themer Installation ==="

# Global installation (recommended)
bun add -g themer

# Local project installation
bun add -D themer

# Verify installation
themer --version

# 2. Basic Usage Patterns
echo "=== Basic Usage ==="

# Generate single theme
themer -c default -t vim -o output

# Generate multiple templates
themer -c night-sky -t vim -t vscode -t iterm -o themes

# Generate only dark variant
themer -c default -t vim --dark -o themes/dark

# Generate only light variant
themer -c default -t vim --light -o themes/light

# 3. List Available Options
echo "=== Available Options ==="

# List all available color sets
themer --list-color-sets

# List all available templates
themer --list-templates

# Get help
themer --help

# 4. Popular Template Combinations
echo "=== Popular Template Combinations ==="

# Complete editor setup
themer -c dracula \
  -t vim \
  -t vscode \
  -t atom-syntax \
  -t sublime-text \
  -o editors

# Terminal themes
themer -c solarized \
  -t iterm \
  -t terminal \
  -t hyper \
  -t windows-terminal \
  -o terminals

# Application themes
themer -c one-dark \
  -t slack \
  -t chrome \
  -t firefox \
  -o apps

# Wallpaper generation
themer -c night-sky \
  -t wallpaper-triangles \
  -t wallpaper-circuits \
  -t wallpaper-dot-grid \
  -o wallpapers

# 5. Custom Color Set Usage
echo "=== Custom Color Sets ==="

# Create custom color set file (colors.js)
cat > colors.js << 'EOF'
module.exports = {
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
EOF

# Use custom color set
themer -c colors.js -t vim -t vscode -o my-themes

# 6. Batch Processing Scripts
echo "=== Batch Processing ==="

# Generate all editor themes
generate_editor_themes() {
  local colorset=$1
  local output_dir=$2
  
  local templates=(
    "vim"
    "vscode" 
    "atom-syntax"
    "atom-ui"
    "sublime-text"
    "emacs"
    "brackets"
  )
  
  for template in "${templates[@]}"; do
    echo "Generating $template theme..."
    themer -c "$colorset" -t "$template" -o "$output_dir/$template"
  done
}

# Generate all terminal themes
generate_terminal_themes() {
  local colorset=$1
  local output_dir=$2
  
  local templates=(
    "iterm"
    "terminal"
    "hyper"
    "windows-terminal"
    "gnome-terminal"
    "xfce-terminal"
    "termite"
  )
  
  for template in "${templates[@]}"; do
    echo "Generating $template theme..."
    themer -c "$colorset" -t "$template" -o "$output_dir/$template"
  done
}

# Generate all wallpapers
generate_wallpapers() {
  local colorset=$1
  local output_dir=$2
  
  local templates=(
    "wallpaper-triangles"
    "wallpaper-circuits"
    "wallpaper-dot-grid"
    "wallpaper-octagon"
    "wallpaper-trianglify"
    "wallpaper-block-wave"
  )
  
  for template in "${templates[@]}"; do
    echo "Generating $template wallpaper..."
    themer -c "$colorset" -t "$template" -o "$output_dir/wallpapers"
  done
}

# 7. Development Workflow Scripts
echo "=== Development Workflow ==="

# Watch and regenerate themes
watch_themes() {
  local colorset_file=$1
  local output_dir=$2
  
  echo "Watching $colorset_file for changes..."
  
  # Using fswatch (install: brew install fswatch)
  fswatch -o "$colorset_file" | while read; do
    echo "Color set changed, regenerating themes..."
    themer -c "$colorset_file" -t vim -t vscode -o "$output_dir"
    echo "Themes regenerated at $(date)"
  done
}

# Preview theme generation
preview_theme() {
  local colorset=$1
  local template=${2:-vim}
  local temp_dir=$(mktemp -d)
  
  echo "Generating preview for $colorset using $template..."
  themer -c "$colorset" -t "$template" -o "$temp_dir"
  
  echo "Preview generated in: $temp_dir"
  ls -la "$temp_dir"
  
  # Open preview (macOS)
  if command -v open &> /dev/null; then
    open "$temp_dir"
  fi
}

# 8. Color Set Validation
echo "=== Color Set Validation ==="

# Validate color set structure
validate_colorset() {
  local colorset_file=$1
  
  echo "Validating color set: $colorset_file"
  
  # Test generation to validate structure
  local temp_dir=$(mktemp -d)
  
  if themer -c "$colorset_file" -t vim -o "$temp_dir" &> /dev/null; then
    echo "✓ Color set is valid"
    rm -rf "$temp_dir"
    return 0
  else
    echo "✗ Color set validation failed"
    rm -rf "$temp_dir"
    return 1
  fi
}

# 9. Theme Installation Helpers
echo "=== Theme Installation ==="

# Install vim theme
install_vim_theme() {
  local theme_dir=$1
  local vim_dir="$HOME/.vim/colors"
  
  mkdir -p "$vim_dir"
  
  find "$theme_dir" -name "*.vim" -exec cp {} "$vim_dir/" \;
  echo "Vim themes installed to $vim_dir"
}

# Install VSCode theme
install_vscode_theme() {
  local theme_dir=$1
  local vscode_dir="$HOME/.vscode/extensions"
  
  # VSCode themes need to be packaged as extensions
  echo "Copy theme files to VSCode extension directory"
  echo "Theme directory: $theme_dir"
  echo "VSCode extensions: $vscode_dir"
}

# Install iTerm theme
install_iterm_theme() {
  local theme_dir=$1
  local iterm_dir="$HOME/Library/Application Support/iTerm2/DynamicProfiles"
  
  mkdir -p "$iterm_dir"
  
  find "$theme_dir" -name "*.json" -exec cp {} "$iterm_dir/" \;
  echo "iTerm themes installed to $iterm_dir"
}

# 10. Complete Setup Script
complete_setup() {
  local colorset=${1:-default}
  local output_dir=${2:-./themes}
  
  echo "=== Complete Themer Setup ==="
  echo "Color set: $colorset"
  echo "Output directory: $output_dir"
  
  # Create output directory
  mkdir -p "$output_dir"
  
  # Generate all theme types
  echo "Generating editor themes..."
  generate_editor_themes "$colorset" "$output_dir"
  
  echo "Generating terminal themes..."
  generate_terminal_themes "$colorset" "$output_dir"
  
  echo "Generating wallpapers..."
  generate_wallpapers "$colorset" "$output_dir"
  
  echo "=== Setup Complete ==="
  echo "Themes generated in: $output_dir"
  
  # Show summary
  find "$output_dir" -type f | wc -l | xargs echo "Total files generated:"
  
  # List generated themes
  echo "Generated theme types:"
  find "$output_dir" -mindepth 1 -maxdepth 1 -type d | sort
}

# 11. Package.json Scripts Integration
create_package_scripts() {
  cat > package.json << 'EOF'
{
  "name": "my-themes",
  "scripts": {
    "theme:generate": "themer -c colors.js -t vim -t vscode -t iterm -o themes",
    "theme:editors": "themer -c colors.js -t vim -t vscode -t atom-syntax -o editors",
    "theme:terminals": "themer -c colors.js -t iterm -t terminal -o terminals", 
    "theme:wallpapers": "themer -c colors.js -t wallpaper-triangles -o wallpapers",
    "theme:all": "npm run theme:editors && npm run theme:terminals && npm run theme:wallpapers",
    "theme:watch": "chokidar colors.js -c 'npm run theme:generate'",
    "theme:validate": "node -e 'require(\"./colors.js\"); console.log(\"Valid color set\")'",
    "theme:preview": "themer -c colors.js -t vim -o preview && open preview"
  },
  "devDependencies": {
    "themer": "^4.1.2",
    "chokidar-cli": "^3.0.0"
  }
}
EOF
  
  echo "Package.json with theme scripts created"
}

# Usage examples
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Themer CLI Usage Examples"
  echo "Run functions like: generate_editor_themes default ./themes"
fi