#!/bin/bash

# Podman Installation Examples

# Ubuntu/Debian
apt update && apt install -y podman

# RHEL/CentOS/Fedora
dnf install -y podman

# Arch Linux
pacman -S podman

# macOS (requires Homebrew)
brew install podman

# Windows (PowerShell as Admin)
# winget install RedHat.Podman

# Verify installation
podman --version

# Initialize machine (macOS/Windows)
podman machine init
podman machine start

# Test with hello world
podman run quay.io/podman/hello