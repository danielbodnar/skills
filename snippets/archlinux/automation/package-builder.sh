#!/bin/bash
# package-builder.sh - Automated Arch Linux package building and repository management

set -euo pipefail

# Configuration
BUILD_DIR="${BUILD_DIR:-$HOME/arch-packages}"
REPO_DIR="${REPO_DIR:-$HOME/arch-repo}"
REPO_NAME="${REPO_NAME:-custom}"
CHROOT_DIR="${CHROOT_DIR:-/var/lib/archbuild}"
MAKEPKG_CONF="${MAKEPKG_CONF:-/etc/makepkg.conf}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

debug() {
    if [[ "${DEBUG:-}" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Setup build environment
setup_build_env() {
    log "Setting up build environment..."
    
    # Create directories
    mkdir -p "$BUILD_DIR" "$REPO_DIR"
    
    # Install build dependencies
    sudo pacman -S --needed --noconfirm \
        base-devel \
        devtools \
        git \
        namcap \
        pacman-contrib \
        asp \
        aurutils
    
    # Configure makepkg
    if [[ ! -f "$HOME/.makepkg.conf" ]]; then
        cp /etc/makepkg.conf "$HOME/.makepkg.conf"
        
        # Optimize build settings
        sed -i "s/^#MAKEFLAGS=.*/MAKEFLAGS=\"-j\$(nproc)\"/" "$HOME/.makepkg.conf"
        sed -i "s/^COMPRESSXZ=.*/COMPRESSXZ=(xz -c -z - --threads=0)/" "$HOME/.makepkg.conf"
        sed -i "s/^COMPRESSZST=.*/COMPRESSZST=(zstd -c -z -q - --threads=0)/" "$HOME/.makepkg.conf"
        
        # Set package output directory
        echo "PKGDEST=\"$BUILD_DIR/packages\"" >> "$HOME/.makepkg.conf"
        echo "SRCPKGDEST=\"$BUILD_DIR/sources\"" >> "$HOME/.makepkg.conf"
        echo "SRCDEST=\"$BUILD_DIR/sources\"" >> "$HOME/.makepkg.conf"
        echo "LOGDEST=\"$BUILD_DIR/logs\"" >> "$HOME/.makepkg.conf"
        
        mkdir -p "$BUILD_DIR"/{packages,sources,logs}
    fi
    
    log "Build environment setup completed"
}

# Setup clean chroot
setup_chroot() {
    log "Setting up clean chroot environment..."
    
    # Create chroot directories
    sudo mkdir -p "$CHROOT_DIR"
    
    # Create base chroot
    if [[ ! -d "$CHROOT_DIR/root" ]]; then
        sudo mkarchroot "$CHROOT_DIR/root" base-devel
    fi
    
    # Update chroot
    sudo arch-nspawn "$CHROOT_DIR/root" pacman -Syu --noconfirm
    
    log "Chroot environment ready"
}

# Clone package from ABS or AUR
clone_package() {
    local package_name="$1"
    local source="${2:-auto}"  # auto, abs, aur, git
    
    log "Cloning package: $package_name"
    
    cd "$BUILD_DIR"
    
    case "$source" in
        abs)
            asp checkout "$package_name"
            cd "$package_name"
            ;;
        aur)
            git clone "https://aur.archlinux.org/$package_name.git"
            cd "$package_name"
            ;;
        git)
            if [[ -z "${3:-}" ]]; then
                error "Git URL required for git source"
            fi
            git clone "$3" "$package_name"
            cd "$package_name"
            ;;
        auto)
            # Try ABS first, then AUR
            if asp list-all | grep -q "^$package_name$"; then
                asp checkout "$package_name"
                cd "$package_name"
            elif curl -s "https://aur.archlinux.org/rpc/?v=5&type=info&arg=$package_name" | jq -r '.resultcount' | grep -q "1"; then
                git clone "https://aur.archlinux.org/$package_name.git"
                cd "$package_name"
            else
                error "Package $package_name not found in ABS or AUR"
            fi
            ;;
        *)
            error "Unknown source: $source"
            ;;
    esac
    
    log "Package $package_name cloned successfully"
}

# Build package
build_package() {
    local package_dir="$1"
    local use_chroot="${2:-true}"
    
    log "Building package in: $package_dir"
    
    if [[ ! -d "$package_dir" ]]; then
        error "Package directory not found: $package_dir"
    fi
    
    cd "$package_dir"
    
    # Check PKGBUILD syntax
    if ! namcap PKGBUILD; then
        warn "PKGBUILD has issues, continuing anyway..."
    fi
    
    # Update checksums if needed
    if grep -q "SKIP" PKGBUILD; then
        log "Updating checksums..."
        updpkgsums
    fi
    
    # Build package
    if [[ "$use_chroot" == "true" ]]; then
        log "Building in clean chroot..."
        sudo makechrootpkg -c -r "$CHROOT_DIR"
    else
        log "Building in current environment..."
        makepkg -s --noconfirm
    fi
    
    # Check built packages
    local built_packages
    built_packages=(*.pkg.tar.*)
    
    if [[ ${#built_packages[@]} -eq 0 ]]; then
        error "No packages were built"
    fi
    
    # Validate packages
    for pkg in "${built_packages[@]}"; do
        if [[ -f "$pkg" ]]; then
            log "Validating package: $pkg"
            namcap "$pkg" || warn "Package validation issues found"
        fi
    done
    
    log "Package build completed"
}

# Build package from PKGBUILD template
create_package_from_template() {
    local pkg_name="$1"
    local pkg_version="${2:-1.0.0}"
    local pkg_type="${3:-simple}"
    
    log "Creating package from template: $pkg_name"
    
    local pkg_dir="$BUILD_DIR/$pkg_name"
    mkdir -p "$pkg_dir"
    cd "$pkg_dir"
    
    case "$pkg_type" in
        simple)
            create_simple_package_template "$pkg_name" "$pkg_version"
            ;;
        service)
            create_service_package_template "$pkg_name" "$pkg_version"
            ;;
        meta)
            create_meta_package_template "$pkg_name" "$pkg_version"
            ;;
        *)
            error "Unknown package type: $pkg_type"
            ;;
    esac
    
    log "Package template created: $pkg_dir"
}

create_simple_package_template() {
    local pkg_name="$1"
    local pkg_version="$2"
    
    cat > PKGBUILD << EOF
# Maintainer: Infrastructure Team <infra@example.com>
pkgname=$pkg_name
pkgver=$pkg_version
pkgrel=1
pkgdesc="Custom package: $pkg_name"
arch=('any')
url="https://example.com/$pkg_name"
license=('MIT')
depends=('bash')
source=("\$pkgname-\$pkgver.tar.gz")
sha256sums=('SKIP')

prepare() {
    cd "\$pkgname-\$pkgver"
    # Preparation steps here
}

build() {
    cd "\$pkgname-\$pkgver"
    # Build steps here
}

check() {
    cd "\$pkgname-\$pkgver"
    # Test steps here
}

package() {
    cd "\$pkgname-\$pkgver"
    
    # Install binary
    install -Dm755 "\$pkgname" "\$pkgdir/usr/bin/\$pkgname"
    
    # Install configuration
    install -Dm644 config.conf "\$pkgdir/etc/\$pkgname/config.conf"
    
    # Install documentation
    install -Dm644 README.md "\$pkgdir/usr/share/doc/\$pkgname/README.md"
    install -Dm644 LICENSE "\$pkgdir/usr/share/licenses/\$pkgname/LICENSE"
}
EOF
    
    # Create dummy source
    mkdir -p "$pkg_name-$pkg_version"
    echo "#!/bin/bash" > "$pkg_name-$pkg_version/$pkg_name"
    echo "echo 'Hello from $pkg_name'" >> "$pkg_name-$pkg_version/$pkg_name"
    echo "# Configuration for $pkg_name" > "$pkg_name-$pkg_version/config.conf"
    echo "# $pkg_name README" > "$pkg_name-$pkg_version/README.md"
    echo "MIT License" > "$pkg_name-$pkg_version/LICENSE"
    tar czf "$pkg_name-$pkg_version.tar.gz" "$pkg_name-$pkg_version"
    rm -rf "$pkg_name-$pkg_version"
}

create_service_package_template() {
    local pkg_name="$1"
    local pkg_version="$2"
    
    cat > PKGBUILD << EOF
# Maintainer: Infrastructure Team <infra@example.com>
pkgname=$pkg_name
pkgver=$pkg_version
pkgrel=1
pkgdesc="Service package: $pkg_name"
arch=('any')
url="https://example.com/$pkg_name"
license=('MIT')
depends=('systemd' 'bash')
backup=('etc/$pkg_name/config.conf')
source=("\$pkgname-\$pkgver.tar.gz"
        "\$pkgname.service")
sha256sums=('SKIP'
            'SKIP')

package() {
    cd "\$pkgname-\$pkgver"
    
    # Install service binary
    install -Dm755 "\$pkgname" "\$pkgdir/usr/bin/\$pkgname"
    
    # Install systemd service
    install -Dm644 "\$srcdir/\$pkgname.service" "\$pkgdir/usr/lib/systemd/system/\$pkgname.service"
    
    # Install configuration
    install -Dm644 config.conf "\$pkgdir/etc/\$pkgname/config.conf"
    
    # Install documentation
    install -Dm644 README.md "\$pkgdir/usr/share/doc/\$pkgname/README.md"
}
EOF
    
    # Create systemd service file
    cat > "$pkg_name.service" << EOF
[Unit]
Description=$pkg_name service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/$pkg_name
Restart=always
User=nobody
Group=nobody

[Install]
WantedBy=multi-user.target
EOF
    
    # Create dummy source
    create_simple_package_template "$pkg_name" "$pkg_version"
}

create_meta_package_template() {
    local pkg_name="$1"
    local pkg_version="$2"
    
    cat > PKGBUILD << EOF
# Maintainer: Infrastructure Team <infra@example.com>
pkgname=$pkg_name
pkgver=$pkg_version
pkgrel=1
pkgdesc="Meta package: $pkg_name"
arch=('any')
url="https://example.com/$pkg_name"
license=('MIT')
depends=(
    'base'
    'bash'
    # Add actual dependencies here
)
optdepends=(
    'optional-package: Optional functionality'
)

package() {
    # Create documentation
    mkdir -p "\$pkgdir/usr/share/doc/\$pkgname"
    
    cat > "\$pkgdir/usr/share/doc/\$pkgname/README.md" << DOC
# $pkg_name Meta Package

This meta-package installs a collection of related packages.

## Included Packages
- base: Base system
- bash: Shell

## Optional Packages
- optional-package: Provides additional functionality

See the PKGBUILD for a complete list of dependencies.
DOC
}
EOF
}

# Add package to repository
add_to_repo() {
    local package_file="$1"
    
    log "Adding package to repository: $(basename "$package_file")"
    
    if [[ ! -f "$package_file" ]]; then
        error "Package file not found: $package_file"
    fi
    
    # Copy package to repository
    cp "$package_file" "$REPO_DIR/"
    
    # Add to repository database
    cd "$REPO_DIR"
    repo-add "$REPO_NAME.db.tar.xz" "$(basename "$package_file")"
    
    log "Package added to repository"
}

# Serve repository via HTTP
serve_repo() {
    local port="${1:-8080}"
    
    log "Starting repository HTTP server on port $port"
    log "Repository URL: http://$(hostname -I | awk '{print $1}'):$port/"
    
    cd "$REPO_DIR"
    python -m http.server "$port"
}

# Create repository configuration
create_repo_config() {
    log "Creating repository configuration..."
    
    local server_ip
    server_ip=$(ip route get 8.8.8.8 | awk '{print $7; exit}')
    
    cat > "$REPO_DIR/pacman.conf.snippet" << EOF
# Custom repository configuration
# Add this to /etc/pacman.conf

[$REPO_NAME]
Server = http://$server_ip:8080/
EOF
    
    cat > "$REPO_DIR/setup-repo.sh" << 'EOF'
#!/bin/bash
# Setup script to add custom repository to pacman

REPO_CONF="/etc/pacman.conf"
SNIPPET_FILE="pacman.conf.snippet"

if [[ ! -f "$SNIPPET_FILE" ]]; then
    echo "Error: $SNIPPET_FILE not found"
    exit 1
fi

echo "Adding custom repository to pacman configuration..."

# Backup original configuration
sudo cp "$REPO_CONF" "$REPO_CONF.backup"

# Add repository configuration
echo "" | sudo tee -a "$REPO_CONF" > /dev/null
cat "$SNIPPET_FILE" | sudo tee -a "$REPO_CONF" > /dev/null

echo "Repository added to pacman configuration"
echo "Update package database with: sudo pacman -Sy"
EOF
    
    chmod +x "$REPO_DIR/setup-repo.sh"
    
    log "Repository configuration created"
    log "Clients can run: $REPO_DIR/setup-repo.sh"
}

# Batch build packages
batch_build() {
    local package_list="$1"
    local use_chroot="${2:-true}"
    
    log "Starting batch build from: $package_list"
    
    if [[ ! -f "$package_list" ]]; then
        error "Package list file not found: $package_list"
    fi
    
    local success_count=0
    local fail_count=0
    local failed_packages=()
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        
        # Parse package specification
        local pkg_spec=($line)
        local pkg_name="${pkg_spec[0]}"
        local pkg_source="${pkg_spec[1]:-auto}"
        local pkg_url="${pkg_spec[2]:-}"
        
        log "Processing package: $pkg_name (source: $pkg_source)"
        
        if clone_package "$pkg_name" "$pkg_source" "$pkg_url" && \
           build_package "$BUILD_DIR/$pkg_name" "$use_chroot"; then
            # Add built packages to repository
            for pkg_file in "$BUILD_DIR/$pkg_name"/*.pkg.tar.*; do
                if [[ -f "$pkg_file" ]]; then
                    add_to_repo "$pkg_file"
                fi
            done
            ((success_count++))
        else
            warn "Failed to build package: $pkg_name"
            failed_packages+=("$pkg_name")
            ((fail_count++))
        fi
        
    done < "$package_list"
    
    log "Batch build completed"
    log "Successful builds: $success_count"
    log "Failed builds: $fail_count"
    
    if [[ $fail_count -gt 0 ]]; then
        warn "Failed packages: ${failed_packages[*]}"
    fi
}

# Clean build environment
clean_build_env() {
    log "Cleaning build environment..."
    
    # Clean package build directories
    find "$BUILD_DIR" -maxdepth 1 -type d ! -path "$BUILD_DIR" ! -name "packages" ! -name "sources" ! -name "logs" -exec rm -rf {} +
    
    # Clean chroot
    if [[ -d "$CHROOT_DIR" ]]; then
        sudo rm -rf "$CHROOT_DIR"
    fi
    
    log "Build environment cleaned"
}

# Show help
show_help() {
    cat << 'EOF'
package-builder.sh - Automated Arch Linux package building and repository management

Usage: package-builder.sh COMMAND [OPTIONS]

Commands:
    setup                   Setup build environment
    clone PACKAGE [SOURCE]  Clone package (SOURCE: auto|abs|aur|git URL)
    build PACKAGE_DIR       Build package from directory
    create NAME VERSION TYPE Create package from template (TYPE: simple|service|meta)
    repo-add PACKAGE_FILE   Add package to repository
    repo-serve [PORT]       Serve repository via HTTP (default port: 8080)
    repo-config            Create repository configuration
    batch-build LIST_FILE   Build packages from list file
    clean                  Clean build environment
    help                   Show this help

Environment Variables:
    BUILD_DIR              Build directory (default: $HOME/arch-packages)
    REPO_DIR              Repository directory (default: $HOME/arch-repo)
    REPO_NAME             Repository name (default: custom)
    CHROOT_DIR            Chroot directory (default: /var/lib/archbuild)
    DEBUG                 Enable debug output (set to 'true')

Examples:
    # Setup build environment
    ./package-builder.sh setup

    # Clone and build a package from AUR
    ./package-builder.sh clone yay aur
    ./package-builder.sh build $BUILD_DIR/yay

    # Create and build a custom service package
    ./package-builder.sh create my-service 1.0.0 service
    ./package-builder.sh build $BUILD_DIR/my-service

    # Add package to repository and serve
    ./package-builder.sh repo-add $BUILD_DIR/my-service/my-service-1.0.0-1-any.pkg.tar.xz
    ./package-builder.sh repo-serve 8080

Package List File Format:
    # Package list for batch building
    # Format: PACKAGE_NAME [SOURCE] [GIT_URL]
    yay aur
    firefox abs
    my-custom-app git https://github.com/user/my-custom-app.git
EOF
}

# Main execution
main() {
    case "${1:-}" in
        setup)
            setup_build_env
            setup_chroot
            ;;
        clone)
            [[ -z "${2:-}" ]] && error "Package name required"
            clone_package "$2" "${3:-auto}" "${4:-}"
            ;;
        build)
            [[ -z "${2:-}" ]] && error "Package directory required"
            build_package "$2" "${3:-true}"
            ;;
        create)
            [[ -z "${2:-}" ]] && error "Package name required"
            create_package_from_template "$2" "${3:-1.0.0}" "${4:-simple}"
            ;;
        repo-add)
            [[ -z "${2:-}" ]] && error "Package file required"
            add_to_repo "$2"
            ;;
        repo-serve)
            serve_repo "${2:-8080}"
            ;;
        repo-config)
            create_repo_config
            ;;
        batch-build)
            [[ -z "${2:-}" ]] && error "Package list file required"
            batch_build "$2" "${3:-true}"
            ;;
        clean)
            clean_build_env
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: ${1:-}"
            echo "Use 'package-builder.sh help' for usage information"
            exit 1
            ;;
    esac
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi