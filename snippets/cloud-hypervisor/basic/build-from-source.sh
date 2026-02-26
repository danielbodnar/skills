#!/bin/bash
# Build Cloud Hypervisor from Source
# Complete setup and build process

set -euo pipefail

# Install prerequisites for Ubuntu/Debian
echo "Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y \
    git \
    build-essential \
    m4 \
    bison \
    flex \
    uuid-dev \
    qemu-utils \
    musl-tools

# Install Rust toolchain if not present
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Add musl targets for static linking
echo "Adding musl targets..."
rustup target add x86_64-unknown-linux-musl   # x86-64
rustup target add aarch64-unknown-linux-musl  # AArch64

# Clone Cloud Hypervisor repository
if [ ! -d "cloud-hypervisor" ]; then
    echo "Cloning Cloud Hypervisor repository..."
    git clone https://github.com/cloud-hypervisor/cloud-hypervisor.git
fi

cd cloud-hypervisor

# Build release binary
echo "Building Cloud Hypervisor (release)..."
cargo build --release

# Build static binary (optional)
echo "Building static binary..."
cargo build --release --target=x86_64-unknown-linux-musl --all

# Set required capabilities
echo "Setting NET_ADMIN capabilities..."
sudo setcap cap_net_admin+ep ./target/release/cloud-hypervisor

# Verify build
echo "Verifying build..."
./target/release/cloud-hypervisor --version

echo "Build complete! Binary available at: $(pwd)/target/release/cloud-hypervisor"
echo "Static binary available at: $(pwd)/target/x86_64-unknown-linux-musl/release/cloud-hypervisor"