#!/bin/bash

# Script to generate shell completions for a Usage CLI
# Usage: ./generate-completions.sh <cli-name> <usage-file>

set -euo pipefail

CLI_NAME="${1:-mycli}"
USAGE_FILE="${2:-${CLI_NAME}.usage.kdl}"
COMPLETIONS_DIR="${3:-completions}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if usage CLI is installed
if ! command -v usage &> /dev/null; then
    error "Usage CLI not found. Install it with: mise use -g usage"
    exit 1
fi

# Check if usage file exists
if [[ ! -f "$USAGE_FILE" ]]; then
    error "Usage file not found: $USAGE_FILE"
    exit 1
fi

log "Generating completions for CLI: $CLI_NAME"
log "Using usage file: $USAGE_FILE"
log "Output directory: $COMPLETIONS_DIR"

# Create completions directory
mkdir -p "$COMPLETIONS_DIR"

# Generate Bash completion
log "Generating Bash completion..."
usage generate completion bash "$CLI_NAME" -f "$USAGE_FILE" > "$COMPLETIONS_DIR/${CLI_NAME}.bash"
success "Bash completion saved to: $COMPLETIONS_DIR/${CLI_NAME}.bash"

# Generate Zsh completion
log "Generating Zsh completion..."
usage generate completion zsh "$CLI_NAME" -f "$USAGE_FILE" > "$COMPLETIONS_DIR/_${CLI_NAME}"
success "Zsh completion saved to: $COMPLETIONS_DIR/_${CLI_NAME}"

# Generate Fish completion
log "Generating Fish completion..."
usage generate completion fish "$CLI_NAME" -f "$USAGE_FILE" > "$COMPLETIONS_DIR/${CLI_NAME}.fish"
success "Fish completion saved to: $COMPLETIONS_DIR/${CLI_NAME}.fish"

# Generate Fig completion
log "Generating Fig completion..."
usage generate fig -f "$USAGE_FILE" > "$COMPLETIONS_DIR/${CLI_NAME}.fig.ts"
success "Fig completion saved to: $COMPLETIONS_DIR/${CLI_NAME}.fig.ts"

# Generate installation script for Bash
cat > "$COMPLETIONS_DIR/install-bash.sh" << EOF
#!/bin/bash
# Install Bash completion for $CLI_NAME

# System-wide installation (requires sudo)
sudo cp "${CLI_NAME}.bash" /etc/bash_completion.d/

# User installation
mkdir -p ~/.bash_completions
cp "${CLI_NAME}.bash" ~/.bash_completions/

# Add to ~/.bashrc if not already present
if ! grep -q "~/.bash_completions/${CLI_NAME}.bash" ~/.bashrc; then
    echo "source ~/.bash_completions/${CLI_NAME}.bash" >> ~/.bashrc
fi

echo "Bash completion installed. Restart your shell or run:"
echo "source ~/.bash_completions/${CLI_NAME}.bash"
EOF

chmod +x "$COMPLETIONS_DIR/install-bash.sh"
success "Bash installation script created: $COMPLETIONS_DIR/install-bash.sh"

# Generate installation script for Zsh
cat > "$COMPLETIONS_DIR/install-zsh.sh" << EOF
#!/bin/bash
# Install Zsh completion for $CLI_NAME

# System-wide installation (requires sudo)
sudo cp "_${CLI_NAME}" /usr/local/share/zsh/site-functions/

# User installation
mkdir -p ~/.zsh_completions
cp "_${CLI_NAME}" ~/.zsh_completions/

# Add completion directory to fpath in ~/.zshrc if not present
if ! grep -q 'fpath=(~/.zsh_completions \$fpath)' ~/.zshrc; then
    echo 'fpath=(~/.zsh_completions \$fpath)' >> ~/.zshrc
    echo 'autoload -U compinit && compinit' >> ~/.zshrc
fi

echo "Zsh completion installed. Restart your shell or run:"
echo "autoload -U compinit && compinit"
EOF

chmod +x "$COMPLETIONS_DIR/install-zsh.sh"
success "Zsh installation script created: $COMPLETIONS_DIR/install-zsh.sh"

# Generate installation script for Fish
cat > "$COMPLETIONS_DIR/install-fish.sh" << EOF
#!/bin/bash
# Install Fish completion for $CLI_NAME

# User installation (Fish automatically loads from this directory)
mkdir -p ~/.config/fish/completions
cp "${CLI_NAME}.fish" ~/.config/fish/completions/

echo "Fish completion installed. Completions will be available immediately."
EOF

chmod +x "$COMPLETIONS_DIR/install-fish.sh"
success "Fish installation script created: $COMPLETIONS_DIR/install-fish.sh"

# Generate universal installation script
cat > "$COMPLETIONS_DIR/install-all.sh" << EOF
#!/bin/bash
# Universal completion installer for $CLI_NAME

set -e

detect_shell() {
    if [[ -n "\$ZSH_VERSION" ]]; then
        echo "zsh"
    elif [[ -n "\$BASH_VERSION" ]]; then
        echo "bash"
    elif [[ -n "\$FISH_VERSION" ]]; then
        echo "fish"
    else
        echo "unknown"
    fi
}

SHELL_TYPE=\$(detect_shell)

echo "Detected shell: \$SHELL_TYPE"

case "\$SHELL_TYPE" in
    "bash")
        echo "Installing Bash completions..."
        ./install-bash.sh
        ;;
    "zsh")
        echo "Installing Zsh completions..."
        ./install-zsh.sh
        ;;
    "fish")
        echo "Installing Fish completions..."
        ./install-fish.sh
        ;;
    *)
        echo "Unknown shell. Please run the appropriate install script manually:"
        echo "  ./install-bash.sh   - for Bash"
        echo "  ./install-zsh.sh    - for Zsh"
        echo "  ./install-fish.sh   - for Fish"
        ;;
esac
EOF

chmod +x "$COMPLETIONS_DIR/install-all.sh"
success "Universal installation script created: $COMPLETIONS_DIR/install-all.sh"

# Generate README for completions
cat > "$COMPLETIONS_DIR/README.md" << EOF
# Shell Completions for $CLI_NAME

This directory contains shell completion files for the \`$CLI_NAME\` command.

## Files

- \`${CLI_NAME}.bash\` - Bash completion script
- \`_${CLI_NAME}\` - Zsh completion script
- \`${CLI_NAME}.fish\` - Fish completion script
- \`${CLI_NAME}.fig.ts\` - Fig/Amazon Q completion script

## Installation

### Automatic Installation

Run the universal installer:
\`\`\`bash
./install-all.sh
\`\`\`

### Manual Installation

#### Bash
\`\`\`bash
# System-wide (requires sudo)
sudo cp ${CLI_NAME}.bash /etc/bash_completion.d/

# User-specific
mkdir -p ~/.bash_completions
cp ${CLI_NAME}.bash ~/.bash_completions/
echo "source ~/.bash_completions/${CLI_NAME}.bash" >> ~/.bashrc
\`\`\`

#### Zsh
\`\`\`bash
# System-wide (requires sudo)
sudo cp _${CLI_NAME} /usr/local/share/zsh/site-functions/

# User-specific
mkdir -p ~/.zsh_completions
cp _${CLI_NAME} ~/.zsh_completions/
echo 'fpath=(~/.zsh_completions \$fpath)' >> ~/.zshrc
echo 'autoload -U compinit && compinit' >> ~/.zshrc
\`\`\`

#### Fish
\`\`\`bash
# User-specific (Fish automatically loads from this directory)
mkdir -p ~/.config/fish/completions
cp ${CLI_NAME}.fish ~/.config/fish/completions/
\`\`\`

#### Fig/Amazon Q
\`\`\`bash
# Copy to your Fig configuration directory
cp ${CLI_NAME}.fig.ts ~/.fig/autocomplete/
\`\`\`

## Testing

After installation, restart your shell or source the completion file:

\`\`\`bash
# Test completions by typing the command and pressing TAB
$CLI_NAME <TAB>
$CLI_NAME --<TAB>
\`\`\`

## Regenerating

To regenerate these completion files, run:
\`\`\`bash
usage generate completion bash $CLI_NAME -f $USAGE_FILE > ${CLI_NAME}.bash
usage generate completion zsh $CLI_NAME -f $USAGE_FILE > _${CLI_NAME}
usage generate completion fish $CLI_NAME -f $USAGE_FILE > ${CLI_NAME}.fish
usage generate fig -f $USAGE_FILE > ${CLI_NAME}.fig.ts
\`\`\`
EOF

success "README created: $COMPLETIONS_DIR/README.md"

# Summary
echo
log "Completion generation complete!"
echo
log "Generated files:"
echo "  📁 $COMPLETIONS_DIR/"
echo "    ├── ${CLI_NAME}.bash (Bash completion)"
echo "    ├── _${CLI_NAME} (Zsh completion)"
echo "    ├── ${CLI_NAME}.fish (Fish completion)"
echo "    ├── ${CLI_NAME}.fig.ts (Fig completion)"
echo "    ├── install-bash.sh (Bash installer)"
echo "    ├── install-zsh.sh (Zsh installer)"
echo "    ├── install-fish.sh (Fish installer)"
echo "    ├── install-all.sh (Universal installer)"
echo "    └── README.md (Installation guide)"
echo
log "To install completions for your shell, run:"
echo "  cd $COMPLETIONS_DIR && ./install-all.sh"