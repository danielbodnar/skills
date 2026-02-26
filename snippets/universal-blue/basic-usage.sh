#!/bin/bash
# Universal Blue - Basic Usage Examples

# Create new custom image from template
echo "Creating new custom Universal Blue image..."
git clone https://github.com/ublue-os/image-template.git my-custom-image
cd my-custom-image

# Customize the image name in Containerfile
sed -i 's/ARG IMAGE_NAME="base"/ARG IMAGE_NAME="my-custom-image"/' Containerfile

# Build container image locally using Podman
echo "Building container image..."
podman build -t localhost/my-custom-image:latest .

# Test the image in a container
echo "Testing image in container..."
podman run --rm -it localhost/my-custom-image:latest bash

# Build VM image using just command (requires bootc-image-builder)
echo "Building VM image..."
just build-vm

# Build ISO image
echo "Building ISO image..."
just build-iso

# Run VM for testing
echo "Starting VM for testing..."
just run-vm

# Check current system information
echo "Current system status:"
rpm-ostree status

# Update system to latest
echo "Updating system..."
rpm-ostree upgrade

# Reboot to apply updates
echo "Rebooting to apply updates..."
systemctl reboot

# Rollback to previous version if needed
echo "Rolling back to previous version..."
rpm-ostree rollback
systemctl reboot

# Install packages temporarily for testing
echo "Installing packages temporarily..."
rpm-ostree install --apply-live htop neofetch

# Layer packages permanently
echo "Layering packages permanently..."
rpm-ostree install code firefox
systemctl reboot

# Remove layered packages
echo "Removing layered packages..."
rpm-ostree uninstall code firefox
systemctl reboot

# Create development container
echo "Creating development container..."
distrobox create --name dev --image fedora:latest
distrobox enter dev

# Install Flatpak applications
echo "Installing Flatpak applications..."
flatpak install flathub org.mozilla.firefox
flatpak install flathub org.gnome.Builder
flatpak install flathub com.visualstudio.code

# Update Flatpak applications
echo "Updating Flatpak applications..."
flatpak update

# Show system information
echo "System information:"
neofetch