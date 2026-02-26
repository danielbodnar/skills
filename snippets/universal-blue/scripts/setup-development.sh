#!/bin/bash
# Universal Blue - Development Environment Setup Script

set -euo pipefail

echo "Setting up development environment..."

# Configure Git global settings
echo "Configuring Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.editor vim

# Install development tools via alternatives
echo "Setting up development tools..."

# Install Node.js via mise
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
mise install node@lts
mise use -g node@lts

# Install Python development tools
python3 -m pip install --user pipx
pipx install poetry
pipx install black
pipx install flake8
pipx install mypy

# Install Rust development tools
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
rustup component add rustfmt clippy

# Install Go development tools
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
go install golang.org/x/tools/gopls@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Configure development directories
echo "Creating development directories..."
mkdir -p ~/Development/{projects,tools,scripts}
mkdir -p ~/.local/bin

# Install additional development tools
echo "Installing additional tools..."

# Install Docker Compose (if Docker is available)
if command -v docker &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o ~/.local/bin/docker-compose
    chmod +x ~/.local/bin/docker-compose
fi

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
install -o root -g root -m 0755 kubectl ~/.local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install development containers
echo "Setting up development containers..."
distrobox create --name ubuntu-dev --image ubuntu:22.04
distrobox create --name alpine-dev --image alpine:latest
distrobox create --name arch-dev --image archlinux:latest

# Configure shell environment
echo "Configuring shell environment..."
cat >> ~/.bashrc << 'EOF'

# Development environment
export EDITOR=vim
export BROWSER=firefox
export DEVELOPMENT_ROOT="$HOME/Development"

# Add local bin to PATH
export PATH="$HOME/.local/bin:$PATH"

# Rust environment
export PATH="$HOME/.cargo/bin:$PATH"

# Go environment
export GOPATH="$HOME/go"
export PATH="$PATH:$GOPATH/bin"

# Development aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'
alias gd='git diff'

# Development shortcuts
alias dev='cd $DEVELOPMENT_ROOT'
alias projects='cd $DEVELOPMENT_ROOT/projects'
alias tools='cd $DEVELOPMENT_ROOT/tools'

# Container shortcuts
alias ubuntu-dev='distrobox enter ubuntu-dev'
alias alpine-dev='distrobox enter alpine-dev'
alias arch-dev='distrobox enter arch-dev'
EOF

# Configure vim for development
echo "Configuring vim..."
cat > ~/.vimrc << 'EOF'
" Basic vim configuration for development
set number
set relativenumber
set autoindent
set smartindent
set expandtab
set tabstop=4
set shiftwidth=4
set softtabstop=4
set hlsearch
set incsearch
set ignorecase
set smartcase
set wildmenu
set wildmode=list:longest
set backspace=indent,eol,start
syntax on
filetype plugin indent on

" Color scheme
colorscheme desert

" File type specific settings
autocmd FileType javascript setlocal shiftwidth=2 tabstop=2
autocmd FileType typescript setlocal shiftwidth=2 tabstop=2
autocmd FileType json setlocal shiftwidth=2 tabstop=2
autocmd FileType yaml setlocal shiftwidth=2 tabstop=2
autocmd FileType html setlocal shiftwidth=2 tabstop=2
autocmd FileType css setlocal shiftwidth=2 tabstop=2
EOF

# Set up SSH for development
echo "Setting up SSH configuration..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

cat > ~/.ssh/config << 'EOF'
# SSH configuration for development
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519

# GitHub
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519

# GitLab
Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/id_ed25519
EOF

chmod 600 ~/.ssh/config

echo "Development environment setup complete!"
echo "Please restart your shell or run 'source ~/.bashrc' to apply changes."
echo ""
echo "Next steps:"
echo "1. Generate SSH key: ssh-keygen -t ed25519 -C 'your-email@example.com'"
echo "2. Add SSH key to GitHub/GitLab"
echo "3. Configure Git user: git config --global user.name 'Your Name'"
echo "4. Configure Git email: git config --global user.email 'your-email@example.com'"