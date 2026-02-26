# Universal Blue and BlueBuild Reference

**Always remember to reference $HOME/.claude/references/universal-blue.md and look for snippets and examples in $HOME/.claude/snippets/universal-blue/**

## Quick Reference

- Installation: Create from template or rebase existing Fedora atomic system
- Tools: `podman`, `bootc`, `rpm-ostree`, `just`, `distrobox`
- Configuration: YAML recipes with BlueBuild or Containerfiles
- Documentation: [Universal Blue Learn](https://blue-build.org/learn/universal-blue)
- GitHub: [Universal Blue Organization](https://github.com/ublue-os)
- Template: [Image Template Repository](https://github.com/ublue-os/image-template)

Default to using Universal Blue and BlueBuild for creating custom immutable Linux distributions.

- **Universal Blue**: Community project building enhanced atomic Fedora desktop images
- **BlueBuild**: Tool for creating custom desktop Linux images using YAML recipes
- Use `podman` for container operations (preferred over Docker)
- Use `bootc` for bootable container management
- Leverage rpm-ostree for immutable system updates

## Resources and Documentation

- [Universal Blue Documentation](https://blue-build.org/learn/universal-blue)
  - [Getting Started](https://blue-build.org/learn/universal-blue)
  - [Custom Images](https://github.com/ublue-os/image-template)
  - [Community Images](https://github.com/ublue-os)
- [BlueBuild Documentation](https://blue-build.org)
  - [Recipe Configuration](https://blue-build.org)
  - [Module System](https://blue-build.org)
  - [CLI Usage](https://blue-build.org)
- [Universal Blue GitHub](https://github.com/ublue-os)
- [BlueBuild Template](https://github.com/ublue-os/image-template)
- [bootc Documentation](https://bootc-dev.github.io/bootc/)
  - [Bootable Containers](https://bootc-dev.github.io/bootc/)
  - [Container Image Management](https://bootc-dev.github.io/bootc/)
  - [System Updates](https://bootc-dev.github.io/bootc/)
- [Fedora Silverblue Documentation](https://docs.fedoraproject.org/en-US/fedora-silverblue)
  - [Immutable Desktop Concepts](https://docs.fedoraproject.org/en-US/fedora-silverblue/)
  - [Package Management](https://docs.fedoraproject.org/en-US/fedora-silverblue/)
  - [Developer Workflows](https://docs.fedoraproject.org/en-US/fedora-silverblue/)

## Key Features

- **Immutable Base**: Build on Fedora atomic desktop distributions
- **Container-Based**: Use OCI containers for system image delivery
- **YAML Configuration**: Simple recipe-based customization with BlueBuild
- **Automatic Updates**: Built-in support for atomic system updates
- **Hardware Support**: Enhanced codec and hardware acceleration support
- **Developer Tools**: Integrated distrobox, toolbx, and containerized workflows

## Core Technologies

- **rpm-ostree**: Immutable package management system
- **ostree**: Git-like versioning for operating system trees
- **bootc**: Bootable container management tool
- **Podman**: Container engine for building and running containers
- **Flatpak**: Application sandboxing and distribution
- **distrobox/toolbx**: Containerized development environments

## Basic Usage

```bash
# Create new custom image from template
git clone https://github.com/ublue-os/image-template.git my-custom-image
cd my-custom-image

# Build container image locally
podman build -t my-custom-image .

# Build VM image using bootc
just build-vm

# Test in virtual machine
just run-vm
```

## BlueBuild Recipe Configuration

```yaml
# recipe.yml - BlueBuild configuration
name: my-custom-image
description: Custom Universal Blue image
base-image: ghcr.io/ublue-os/silverblue-main:latest
image-version: latest

stages:
  - type: rpm-ostree
    repos:
      - https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm
    install:
      - firefox
      - code
      - distrobox

  - type: script
    scripts:
      - scripts/setup-gaming.sh
      - scripts/configure-sysctl.sh

  - type: files
    files:
      - src: files/etc/sysctl.d/99-custom.conf
        dst: /etc/sysctl.d/99-custom.conf
```

## Containerfile for Custom Images

```dockerfile
# Containerfile for Universal Blue custom image
ARG BASE_IMAGE_NAME="${BASE_IMAGE_NAME:-silverblue}"
ARG IMAGE_FLAVOR="${IMAGE_FLAVOR:-main}"
ARG SOURCE_IMAGE="${SOURCE_IMAGE:-${BASE_IMAGE_NAME}-${IMAGE_FLAVOR}}"
ARG BASE_IMAGE="ghcr.io/ublue-os/${SOURCE_IMAGE}"
ARG FEDORA_MAJOR_VERSION="${FEDORA_MAJOR_VERSION:-40}"

FROM ${BASE_IMAGE}:${FEDORA_MAJOR_VERSION}

# Install additional packages
RUN rpm-ostree install \
    firefox \
    code \
    distrobox \
    && ostree container commit

# Copy configuration files
COPY system_files/etc /etc/
COPY system_files/usr /usr/

# Run custom scripts
COPY scripts/*.sh /tmp/
RUN find /tmp -name "*.sh" -exec chmod +x {} \; && \
    find /tmp -name "*.sh" -exec {} \; && \
    rm -rf /tmp/*.sh && \
    ostree container commit
```

## System Management Commands

```bash
# Check current system version
rpm-ostree status

# Update system
rpm-ostree upgrade

# Rollback to previous version
rpm-ostree rollback

# Install packages temporarily (for testing)
rpm-ostree install --apply-live package-name

# Layer packages permanently
rpm-ostree install package-name
systemctl reboot

# Manage Flatpak applications
flatpak install flathub org.mozilla.firefox
flatpak update

# Use development containers
distrobox create --name dev --image fedora:latest
distrobox enter dev
```

## Image Types and Variants

- **Silverblue**: GNOME desktop with Universal Blue enhancements
- **Kinoite**: KDE Plasma desktop with Universal Blue enhancements
- **Bazzite**: Gaming-focused distribution with Steam, Lutris, etc.
- **Aurora**: Developer-focused distribution with IDEs and tools
- **Bluefin**: Modern desktop with cloud-native developer tools

## Container Registries and Images

- **GitHub Container Registry**: `ghcr.io/ublue-os/`
- **Base Images**:
  - `ghcr.io/ublue-os/silverblue-main:latest`
  - `ghcr.io/ublue-os/kinoite-main:latest`
  - `ghcr.io/ublue-os/bazzite:latest`
  - `ghcr.io/ublue-os/aurora:latest`
  - `ghcr.io/ublue-os/bluefin:latest`

## System Management Tools

- **rpm-ostree**: Package layering and system updates
- **bootc**: Container-based system management
- **systemctl**: Service management
- **flatpak**: Application management
- **podman**: Container operations
- **just**: Task runner for common operations

## Development Workflows

- **Local Development**: Use distrobox/toolbx for isolated environments
- **Image Building**: Containerfile or BlueBuild recipes
- **Testing**: Virtual machines with bootc-generated images
- **CI/CD**: GitHub Actions with automated building and publishing
- **Distribution**: Container registries and ISO generation

## Security Features

- **Immutable Root**: Read-only base system
- **Atomic Updates**: Complete system updates with rollback capability
- **Container Isolation**: Applications run in Flatpak sandboxes
- **Verified Boot**: Secure boot and image signing support
- **Rootless Containers**: Podman runs without root privileges

## Hardware Support Enhancements

- **Multimedia Codecs**: H.264, H.265, VP9, AV1 support
- **GPU Drivers**: NVIDIA, AMD, Intel graphics acceleration
- **Gaming**: Steam, Lutris, Heroic, Wine pre-configured
- **Peripheral Support**: Extended udev rules for devices
- **Bluetooth**: Enhanced codec support for audio devices

## Migration and Installation

- **Fresh Install**: Download ISO and install normally
- **Rebase**: Migrate from existing Fedora atomic system
- **Dual Boot**: Maintain multiple ostree deployments
- **Virtual Machine**: Test images before deployment

## Community Resources

- [Universal Blue GitHub Organization](https://github.com/ublue-os)
  - [Main Images Repository](https://github.com/ublue-os/main)
  - [Bazzite Gaming](https://github.com/ublue-os/bazzite)
  - [Aurora Developer](https://github.com/ublue-os/aurora)
  - [Bluefin Desktop](https://github.com/ublue-os/bluefin)
- [BlueBuild Community](https://blue-build.org)
  - [Discord Server](https://discord.gg/ublue)
  - [Community Forums](https://github.com/ublue-os/discussions)
  - [Awesome Universal Blue](https://github.com/ublue-os/awesome)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/universal-blue/`:

- BlueBuild recipe configurations
- Containerfile templates
- GitHub Actions workflows
- System management scripts
- Development environment setups
- Gaming and multimedia configurations
- Security and hardening examples
- Custom module development

## Schema and Type Definitions

Configuration schemas and validation in `$HOME/.claude/snippets/universal-blue/schemas/`:

- BlueBuild recipe JSON schema
- GitHub Actions workflow schemas
- Containerfile best practices
- rpm-ostree configuration schemas

## See Also

- Complete reference: `$HOME/.claude/references/universal-blue.md`
- Code examples: `$HOME/.claude/snippets/universal-blue/`
- BlueBuild recipes: `$HOME/.claude/snippets/universal-blue/recipes/`
- Containerfile examples: `$HOME/.claude/snippets/universal-blue/containerfiles/`
- Automation scripts: `$HOME/.claude/snippets/universal-blue/scripts/`
