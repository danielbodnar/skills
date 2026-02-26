#!/bin/bash
# Cloud Hypervisor Installation Examples

# Method 1: Install from package repository (Ubuntu/Debian)
install_package() {
    echo "Installing Cloud Hypervisor from package repository..."
    sudo apt update
    sudo apt install -y cloud-hypervisor
    
    # Verify installation
    cloud-hypervisor --version
}

# Method 2: Build from source
build_from_source() {
    echo "Building Cloud Hypervisor from source..."
    
    # Install prerequisites
    sudo apt-get update
    sudo apt-get install -y git build-essential m4 bison flex uuid-dev qemu-utils musl-tools
    
    # Install Rust if not already installed
    if ! command -v cargo &> /dev/null; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
        source ~/.cargo/env
    fi
    
    # Add musl targets for static linking
    rustup target add x86_64-unknown-linux-musl
    rustup target add aarch64-unknown-linux-musl
    
    # Clone repository
    git clone https://github.com/cloud-hypervisor/cloud-hypervisor.git
    cd cloud-hypervisor
    
    # Build release binary
    cargo build --release
    
    # Set required capabilities for network interface management
    sudo setcap cap_net_admin+ep ./target/release/cloud-hypervisor
    
    # Build statically linked binary (optional)
    cargo build --release --target=x86_64-unknown-linux-musl --all
    
    echo "Build complete. Binary available at: $(pwd)/target/release/cloud-hypervisor"
}

# Method 3: Download pre-built binaries
download_prebuilt() {
    echo "Downloading pre-built Cloud Hypervisor binary..."
    
    # Get latest release version
    LATEST_VERSION=$(curl -s https://api.github.com/repos/cloud-hypervisor/cloud-hypervisor/releases/latest | grep tag_name | cut -d '"' -f 4)
    
    # Detect architecture
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            BINARY_NAME="cloud-hypervisor-static"
            ;;
        aarch64)
            BINARY_NAME="cloud-hypervisor-static-aarch64"
            ;;
        *)
            echo "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    
    # Download binary
    wget -O cloud-hypervisor "https://github.com/cloud-hypervisor/cloud-hypervisor/releases/download/${LATEST_VERSION}/${BINARY_NAME}"
    chmod +x cloud-hypervisor
    
    # Set capabilities
    sudo setcap cap_net_admin+ep ./cloud-hypervisor
    
    echo "Downloaded Cloud Hypervisor ${LATEST_VERSION} for ${ARCH}"
}

# Method 4: Using containerized build environment
build_containerized() {
    echo "Building Cloud Hypervisor using containerized environment..."
    
    git clone https://github.com/cloud-hypervisor/cloud-hypervisor.git
    cd cloud-hypervisor
    
    # Use dev_cli.sh for containerized build
    ./scripts/dev_cli.sh build --release
    
    # Set capabilities
    sudo setcap cap_net_admin+ep ./target/release/cloud-hypervisor
}

# Verify installation
verify_installation() {
    echo "Verifying Cloud Hypervisor installation..."
    
    # Check binary exists and has correct capabilities
    if command -v cloud-hypervisor &> /dev/null; then
        BINARY_PATH=$(which cloud-hypervisor)
    elif [ -f "./target/release/cloud-hypervisor" ]; then
        BINARY_PATH="./target/release/cloud-hypervisor"
    elif [ -f "./cloud-hypervisor" ]; then
        BINARY_PATH="./cloud-hypervisor"
    else
        echo "Cloud Hypervisor binary not found"
        exit 1
    fi
    
    echo "Binary found: $BINARY_PATH"
    
    # Check version
    $BINARY_PATH --version
    
    # Check capabilities
    getcap $BINARY_PATH
    
    # Verify KVM support
    if [ -r /dev/kvm ]; then
        echo "KVM support available"
    else
        echo "Warning: KVM support not available or insufficient permissions"
    fi
    
    echo "Installation verification complete"
}

# Prerequisites check
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check kernel version (recommended 5.13+)
    KERNEL_VERSION=$(uname -r)
    echo "Kernel version: $KERNEL_VERSION"
    
    # Check KVM module
    if lsmod | grep -q kvm; then
        echo "KVM module loaded"
    else
        echo "Warning: KVM module not loaded"
    fi
    
    # Check /dev/kvm permissions
    if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then
        echo "/dev/kvm accessible"
    else
        echo "Warning: /dev/kvm not accessible. May need to add user to kvm group:"
        echo "  sudo usermod -a -G kvm $USER"
    fi
    
    # Check virtualization support
    if grep -q vmx /proc/cpuinfo || grep -q svm /proc/cpuinfo; then
        echo "Hardware virtualization supported"
    else
        echo "Warning: Hardware virtualization not detected"
    fi
}

# Main function
main() {
    echo "Cloud Hypervisor Installation Script"
    echo "======================================"
    
    check_prerequisites
    
    case "${1:-package}" in
        "package")
            install_package
            ;;
        "source")
            build_from_source
            ;;
        "download")
            download_prebuilt
            ;;
        "container")
            build_containerized
            ;;
        "verify")
            verify_installation
            ;;
        *)
            echo "Usage: $0 [package|source|download|container|verify]"
            echo "  package   - Install from package repository (default)"
            echo "  source    - Build from source code"
            echo "  download  - Download pre-built binary"
            echo "  container - Build using containerized environment"
            echo "  verify    - Verify existing installation"
            exit 1
            ;;
    esac
    
    verify_installation
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi