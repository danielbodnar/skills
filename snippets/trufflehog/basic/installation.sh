#!/bin/bash
# TruffleHog Installation Scripts
# Various methods to install TruffleHog

# Method 1: Homebrew (macOS)
install_with_homebrew() {
    echo "Installing TruffleHog with Homebrew..."
    brew install trufflehog
    echo "✅ TruffleHog installed via Homebrew"
}

# Method 2: Installation script (Linux/macOS)
install_with_script() {
    echo "Installing TruffleHog with installation script..."
    curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
    echo "✅ TruffleHog installed via script"
}

# Method 3: Installation script with signature verification
install_with_verification() {
    echo "Installing TruffleHog with signature verification..."
    # Requires cosign to be installed first
    if ! command -v cosign &> /dev/null; then
        echo "Installing cosign for signature verification..."
        go install github.com/sigstore/cosign/v2/cmd/cosign@latest
    fi
    
    curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -v -b /usr/local/bin
    echo "✅ TruffleHog installed with signature verification"
}

# Method 4: Install specific version
install_specific_version() {
    local version="${1:-v3.81.9}"
    echo "Installing TruffleHog version: $version"
    curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin "$version"
    echo "✅ TruffleHog $version installed"
}

# Method 5: Docker usage (no installation needed)
use_with_docker() {
    echo "Using TruffleHog with Docker (no installation needed)..."
    echo "Example: docker run --rm -it -v \"\$PWD:/pwd\" trufflesecurity/trufflehog:latest --help"
}

# Method 6: Compile from source
compile_from_source() {
    echo "Compiling TruffleHog from source..."
    if ! command -v go &> /dev/null; then
        echo "❌ Go is required to compile from source"
        return 1
    fi
    
    git clone https://github.com/trufflesecurity/trufflehog.git
    cd trufflehog
    go install
    echo "✅ TruffleHog compiled and installed from source"
}

# Verify installation
verify_installation() {
    echo "Verifying TruffleHog installation..."
    if command -v trufflehog &> /dev/null; then
        echo "✅ TruffleHog is installed"
        trufflehog --version
    else
        echo "❌ TruffleHog is not installed or not in PATH"
        return 1
    fi
}

# Main installation function
main() {
    echo "TruffleHog Installation Options:"
    echo "1. Homebrew (macOS)"
    echo "2. Installation script"
    echo "3. With signature verification"
    echo "4. Specific version"
    echo "5. Docker usage info"
    echo "6. Compile from source"
    
    read -p "Choose installation method (1-6): " choice
    
    case $choice in
        1) install_with_homebrew ;;
        2) install_with_script ;;
        3) install_with_verification ;;
        4) 
            read -p "Enter version (e.g., v3.81.9): " version
            install_specific_version "$version"
            ;;
        5) use_with_docker ;;
        6) compile_from_source ;;
        *) echo "Invalid choice" ;;
    esac
    
    verify_installation
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi