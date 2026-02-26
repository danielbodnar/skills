# bootc Reference

**Always remember to reference @$HOME/.claude/references/bootc.md and look for snippets and examples in @$HOME/.claude/snippets/bootc/**

## Quick Reference

- Installation: Built into Fedora, CentOS Stream, RHEL image mode base containers
- Usage: `bootc status`, `bootc upgrade`, `bootc switch <image>`
- Documentation: <https://bootc-dev.github.io/bootc/>
- GitHub: <https://github.com/bootc-dev/bootc>
- License: MIT and Apache 2.0

## Resources and Documentation

- [bootc Documentation](https://bootc-dev.github.io/bootc/)
  - [Introduction](https://bootc-dev.github.io/bootc/)
  - [Installation Guide](https://bootc-dev.github.io/bootc/bootc-install.html)
  - [Building Images](https://bootc-dev.github.io/bootc/building/guidance.html)
  - [Upgrade and Rollback](https://bootc-dev.github.io/bootc/upgrades.html)
  - [Man Pages](https://bootc-dev.github.io/bootc/man/)
- [Fedora Documentation](https://docs.fedoraproject.org/en-US/bootc/)
  - [Getting Started](https://docs.fedoraproject.org/en-US/bootc/getting-started/)
  - [Building Containers](https://docs.fedoraproject.org/en-US/bootc/building-containers/)
  - [Understanding bootc and rpm-ostree](https://docs.fedoraproject.org/en-US/bootc/rpm-ostree/)
- [Red Hat Documentation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html-single/using_image_mode_for_rhel_to_build_deploy_and_manage_operating_systems/)
  - [Managing RHEL bootc Images](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_image_mode_for_rhel_to_build_deploy_and_manage_operating_systems/managing-rhel-bootc-images)
  - [Image Mode Overview](https://developers.redhat.com/articles/2024/05/07/announcing-image-mode-red-hat-enterprise-linux)
- [Community Resources](https://github.com/bootc-dev/bootc)
  - [GitHub Repository](https://github.com/bootc-dev/bootc)
  - [GitHub Discussions](https://github.com/bootc-dev/bootc/discussions)
  - [CNCF Slack #bootc-dev](https://slack.cncf.io/)
  - [Examples Repository](https://github.com/redhat-cop/rhel-bootc-examples)

## Core Concepts

### Bootable Container Technology

- **Container-Native OS**: Complete operating systems packaged as OCI containers
- **Transactional Updates**: In-place, atomic OS updates using container layers
- **Immutable Infrastructure**: Read-only system with mutable `/etc` and `/var`
- **Container Image Transport**: Uses standard container registries for OS distribution

### Key Architecture Components

- **Linux Kernel Inclusion**: Container images include kernel in `/usr/lib/modules`
- **ostree Foundation**: Built on ostree for filesystem snapshots and rollbacks
- **systemd Integration**: Normal systemd as PID 1, not containerized runtime
- **OCI Compatibility**: Standard container tools for building and distribution

### System Characteristics

- **Image Mode**: OS treated as immutable container image
- **Layer-Based Updates**: Uses Docker/OCI layer model for system changes
- **Registry Distribution**: OS updates delivered via container registries
- **Atomic Operations**: Updates are atomic with automatic rollback capability

## Command Line Interface

### System Status and Information

```bash
# Check current system status
bootc status

# Show deployment history
bootc status --booted

# Display system image information
bootc status --json
```

### System Updates and Upgrades

```bash
# Check for available updates
bootc upgrade --check

# Download and stage updates
bootc upgrade

# Apply updates and reboot automatically
bootc upgrade --apply

# Force update check and apply
bootc upgrade --apply --check
```

### Image Switching and Management

```bash
# Switch to different container image
bootc switch quay.io/fedora/fedora-bootc:40

# Switch with automatic application
bootc switch --apply registry.example.com/myorg/myimage:latest

# Target specific image transport
bootc switch --transport registry myimage:latest
```

### System Installation

```bash
# Install to disk (run from container)
bootc install to-disk /dev/sda

# Install to filesystem
bootc install to-filesystem --root-path /mnt

# Create disk image via loopback
bootc install to-disk --via-loopback /output/disk.raw

# Install with generic image options
bootc install to-disk --generic-image /output/generic.raw
```

### System Rollback and Recovery

```bash
# Rollback to previous deployment
bootc rollback

# List available rollback targets
bootc status

# Boot into specific deployment (via bootloader)
# Select deployment from GRUB menu
```

### Container Operations

```bash
# Lint container image for bootc compatibility
bootc container lint

# Check image signatures and policies
bootc upgrade --enforce-container-sigpolicy

# Retain previous deployments
bootc upgrade --retain
```

## Base Images and Distributions

### Available Base Images

- **Fedora**: `quay.io/fedora/fedora-bootc:40` (and newer versions)
- **CentOS Stream**: `quay.io/centos-bootc/centos-bootc:stream9`
- **RHEL**: Available through Red Hat registry for subscribers

### Building Custom Images

```dockerfile
# Example Containerfile
FROM quay.io/fedora/fedora-bootc:40

# Install system packages
RUN dnf install -y \
    vim \
    git \
    htop \
    && dnf clean all

# Copy configuration files
COPY etc/ /etc/
COPY usr/ /usr/

# Run configuration scripts
RUN systemctl enable my-service.service

# Verify image integrity
RUN bootc container lint
```

### Multi-Stage Build Example

```dockerfile
# Build stage
FROM registry.fedoraproject.org/fedora:40 AS builder
RUN dnf install -y gcc make
COPY src/ /src/
RUN make -C /src install

# Runtime stage
FROM quay.io/fedora/fedora-bootc:40
COPY --from=builder /usr/local/bin/myapp /usr/local/bin/
RUN systemctl enable myapp.service
```

## System Management

### Deployment Lifecycle

- **Build**: Create container image with Containerfile
- **Distribute**: Push to container registry
- **Install**: Deploy to target systems using bootc install
- **Update**: Pull new images and apply with bootc upgrade
- **Rollback**: Revert to previous working deployment

### Update Strategies

- **Manual Updates**: Administrator-triggered via `bootc upgrade`
- **Automatic Updates**: Using `bootc-fetch-apply-updates.timer`
- **Scheduled Updates**: Custom systemd timers for controlled updates
- **Staged Updates**: Updates prepared but not applied until reboot

### Configuration Management

- **Static Configuration**: Baked into container image
- **Dynamic Configuration**: Managed in `/etc` and `/var`
- **systemd Services**: Configure services and system behavior
- **Artifact Pattern**: Reference external configuration containers

## Installation Methods

### Bare Metal Installation

```bash
# Create bootable installer ISO (using bootc-image-builder)
podman run --rm -it --privileged \
    -v $(pwd)/output:/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type iso myimage:latest

# Direct installation to disk
podman run --rm --privileged \
    -v /dev:/dev \
    --pid=host \
    myimage:latest \
    bootc install to-disk /dev/sda
```

### Virtual Machine Deployment

```bash
# Create VM disk image
podman run --rm --privileged \
    -v $(pwd)/output:/output \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type qcow2 myimage:latest

# Boot with QEMU/KVM
qemu-system-x86_64 \
    -M accel=kvm:tcg \
    -cpu host \
    -m 4G \
    -bios /usr/share/OVMF/OVMF_CODE.fd \
    -drive file=output/disk.qcow2
```

### Cloud Image Creation

```bash
# AWS AMI
podman run --rm --privileged \
    -v $(pwd)/output:/output \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type ami myimage:latest

# Azure VHD
podman run --rm --privileged \
    -v $(pwd)/output:/output \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type vhd myimage:latest
```

## Security and Authentication

### Container Registry Authentication

```bash
# Login to registry
podman login quay.io

# Configure system-wide registry authentication
mkdir -p /etc/containers/auth.json

# Use authenticated registries for updates
bootc upgrade --transport registry
```

### Image Signature Verification

```bash
# Enable signature policy enforcement
bootc upgrade --enforce-container-sigpolicy

# Configure signature verification
/etc/containers/policy.json
```

### Security Best Practices

- **Minimal Base Images**: Use minimal base containers
- **Regular Updates**: Keep base images and packages updated
- **Signature Verification**: Enable container image signature checking
- **Registry Security**: Use private registries for sensitive workloads
- **Immutable Infrastructure**: Leverage read-only filesystem benefits

## Development and Testing

### Local Development with Podman

```bash
# Initialize rootful podman machine
podman machine init --rootful --now

# Build bootc image
podman build -t mybuild:latest .

# Test with podman-bootc
podman run --rm --privileged \
    -v /var/lib/containers:/var/lib/containers \
    mybuild:latest \
    bootc install to-disk --via-loopback /tmp/test.raw
```

### Testing and Validation

```bash
# Lint bootc container image
bootc container lint

# Validate image structure
podman run --rm mybuild:latest bootc status

# Test upgrades in VM environment
# (Deploy test image, upgrade, verify functionality)
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Build bootc image
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: podman build -t myorg/myimage:${{ github.sha }} .
      - name: Test image
        run: podman run --rm myorg/myimage:${{ github.sha }} bootc container lint
      - name: Push image
        run: podman push myorg/myimage:${{ github.sha }}
```

## Advanced Configuration

### Custom Partitioning

```toml
# /usr/lib/bootc/install/50-custom.toml
[install.filesystem.root]
type = "xfs"

[install.filesystem.separate-var]
path = "/var"
size_mb = 10240
type = "xfs"
```

### User and SSH Configuration

```dockerfile
# In Containerfile
RUN useradd -m -G wheel admin
RUN mkdir -p /home/admin/.ssh
COPY admin.pub /home/admin/.ssh/authorized_keys
RUN chown -R admin:admin /home/admin/.ssh
RUN chmod 700 /home/admin/.ssh
RUN chmod 600 /home/admin/.ssh/authorized_keys
```

### Service Configuration

```dockerfile
# Enable custom services
RUN systemctl enable my-app.service
RUN systemctl enable my-monitoring.service

# Configure systemd units
COPY services/ /etc/systemd/system/
RUN systemctl daemon-reload
```

### Environment-Specific Configuration

```dockerfile
# Multi-environment approach
ARG ENVIRONMENT=production
COPY configs/${ENVIRONMENT}/ /etc/
RUN systemctl enable environment-${ENVIRONMENT}.target
```

## Troubleshooting

### Common Issues and Solutions

#### Boot Failures

- Check bootloader configuration
- Verify container image integrity
- Review systemd logs: `journalctl -b`
- Use rescue mode from bootloader

#### Update Problems

- Verify registry connectivity: `podman pull <image>`
- Check available disk space
- Review bootc logs: `journalctl -u bootc-fetch-apply-updates`
- Rollback to previous deployment: `bootc rollback`

#### Network Issues

- Verify container registry access
- Check DNS resolution
- Review firewall settings
- Test with `podman pull` manually

#### Storage Issues

- Check disk space: `df -h`
- Review ostree storage: `ostree admin status`
- Clean up old deployments: manual cleanup via ostree

### Diagnostic Commands

```bash
# System status and health
bootc status
systemctl status bootc-fetch-apply-updates
journalctl -u bootc-fetch-apply-updates

# Container and registry diagnostics
podman system info
podman system df
podman image ls

# Storage and filesystem
df -h
ostree admin status
ostree log
```

### Log Analysis

```bash
# bootc-specific logs
journalctl -u bootc-fetch-apply-updates.service
journalctl -u bootc-fetch-apply-updates.timer

# System boot logs
journalctl -b
dmesg

# Container runtime logs
journalctl -u podman
```

## Performance Considerations

### Update Optimization

- **Layer Caching**: Structure Containerfiles for optimal layer reuse
- **Minimal Changes**: Keep updates focused to reduce download size
- **Registry Proximity**: Use geographically close registries
- **Bandwidth Management**: Schedule updates during low-usage periods

### Storage Management

- **Deployment Retention**: Configure appropriate deployment history
- **Container Storage**: Optimize container storage settings
- **Filesystem Choice**: Choose appropriate filesystem for workload
- **Cleanup Automation**: Implement automated cleanup of old deployments

### Resource Monitoring

- **Disk Usage**: Monitor ostree and container storage usage
- **Network Usage**: Track registry bandwidth consumption
- **Update Duration**: Monitor update download and application times
- **System Performance**: Track impact of updates on system performance

## Migration Strategies

### From Traditional Package Management

1. **Assessment**: Inventory current system configuration
2. **Containerization**: Package system state in container image
3. **Testing**: Validate container image functionality
4. **Migration**: Convert systems using bootc install to-existing-root
5. **Validation**: Verify system functionality post-migration

### From Other Immutable Systems

- **From rpm-ostree**: Direct migration path available
- **From Flatcar/CoreOS**: Rebuild system configuration in bootc
- **From NixOS**: Translate system configuration to Containerfile

### Hybrid Deployments

- **Gradual Migration**: Phase migration across system fleet
- **A/B Testing**: Deploy bootc alongside existing systems
- **Rollback Planning**: Maintain rollback procedures during transition

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/bootc/`:

- Basic system operations and management
- Container image building and deployment
- Update and rollback procedures
- Installation and configuration examples
- Troubleshooting and diagnostic scripts
- Security and authentication setup
- Performance optimization techniques

## Schema and Type Definitions

Configuration schemas and templates in `$HOME/.claude/snippets/bootc/schemas/`:

- Containerfile templates
- Installation configuration files
- systemd service definitions
- Registry authentication configurations

## Configuration Examples

Configuration files and templates in `$HOME/.claude/snippets/bootc/configs/`:

- System configuration examples
- Service definitions
- Registry and authentication setup
- Partitioning and storage configurations

## See Also

- Code examples: `@$HOME/.claude/snippets/bootc/`
- Schemas: `@$HOME/.claude/snippets/bootc/schemas/`
- Configs: `@$HOME/.claude/snippets/bootc/configs/`
- Related tools: podman, ostree, systemd, container registries
