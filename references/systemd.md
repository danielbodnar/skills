# systemd Reference

**Always remember to reference @$HOME/.claude/references/systemd.md and look for snippets and examples in @$HOME/.claude/snippets/systemd/**

## Quick Reference

- Main website: <https://systemd.io/>
- Manual pages: <https://www.freedesktop.org/software/systemd/man/latest/>
- Container management: `systemd-nspawn` and `systemd-vmspawn`
- Service deployment: Portable Services with `portablectl`
- Image building: `mkosi` for custom OS images
- Network management: `systemd-networkd`
- User management: `systemd-homed`
- Boot management: `systemd-boot`

## Resources and Documentation

- [systemd.io](https://systemd.io/)
  - [Getting Started](https://systemd.io/)
  - [Portable Services](https://systemd.io/PORTABLE_SERVICES/)
  - [Container Interface](https://systemd.io/CONTAINER_INTERFACE/)
  - [Boot Loader](https://systemd.io/BOOT_LOADER_INTERFACE/)
  - [Home Directories](https://systemd.io/HOME_DIRECTORY/)
- [Manual Pages](https://www.freedesktop.org/software/systemd/man/latest/)
  - [systemd-nspawn(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd-nspawn.html)
  - [systemd-vmspawn(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd-vmspawn.html)
  - [portablectl(1)](https://www.freedesktop.org/software/systemd/man/latest/portablectl.html)
  - [systemd-networkd(8)](https://www.freedesktop.org/software/systemd/man/latest/systemd-networkd.html)
  - [systemd-homed(8)](https://www.freedesktop.org/software/systemd/man/latest/systemd-homed.html)
  - [systemd-boot(7)](https://www.freedesktop.org/software/systemd/man/latest/systemd-boot.html)
- [mkosi GitHub](https://github.com/systemd/mkosi)
  - [mkosi Documentation](https://github.com/systemd/mkosi/blob/main/docs/index.md)
  - [Configuration Reference](https://github.com/systemd/mkosi/blob/main/docs/configuration.md)
- [Community Resources](https://systemd.io/)
  - [Mailing Lists](https://lists.freedesktop.org/mailman/listinfo/systemd-devel)
  - [GitHub Issues](https://github.com/systemd/systemd/issues)
  - [IRC Channel](irc://irc.libera.chat/systemd)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/systemd/`:

- Container management with systemd-nspawn
- Virtual machine management with systemd-vmspawn
- Portable service creation and deployment
- Custom OS image building with mkosi
- Network configuration with systemd-networkd
- User management with systemd-homed
- Boot configuration with systemd-boot
- Security profiles and hardening

## Configuration Files and Schemas

Configuration templates and examples in `$HOME/.claude/snippets/systemd/configs/`

## Core Tools and Components

### Container Management

- **systemd-nspawn**: Lightweight container solution
  - Namespace isolation without full virtualization
  - Direct systemd integration
  - Network namespacing with `--network-veth`
  - Resource limits via systemd units
  - Security profiles and sandboxing

### Virtual Machine Management

- **systemd-vmspawn**: Full virtualization support
  - UEFI and BIOS boot support
  - TPM and secure boot integration
  - Memory and CPU resource allocation
  - Network bridging and isolation
  - Snapshot and image management

### Portable Services

- **portablectl**: Container-like service deployment
  - Service bundling without full containers
  - Multiple security profiles (default, trusted, strict, nonetwork)
  - OverlayFS support for layered images
  - System integration with host systemd
  - Extension support (sysexts and confexts)

### Image Building

- **mkosi**: Bespoke OS image creation
  - Multi-distribution support (Fedora, Ubuntu, Arch, SUSE)
  - Declarative configuration files
  - Kernel-install plugins for UKI and addon generation
  - CI/CD integration capabilities
  - Multiple output formats (raw, qcow2, tar, etc.)

### Network Management

- **systemd-networkd**: Network configuration daemon
  - Declarative network configuration
  - DHCP client and server support
  - Bridge and bonding configuration
  - VLAN and tunnel support
  - Network namespacing integration

### User Management

- **systemd-homed**: Modern user account management
  - Encrypted home directories
  - JSON user records
  - Dynamic user creation/removal
  - Resource quotas and limits
  - Integration with systemd services

### Boot Management

- **systemd-boot**: UEFI boot manager
  - Simple UEFI boot loader
  - Boot entry management
  - Secure boot support
  - Boot assessment and fallback
  - Integration with kernel-install

## Key Configuration Concepts

### Container Interface

Standard environment variables and setup for containers:

- `$container`: Container type identifier
- `$container_uuid`: Unique container identifier
- `$container_ttys`: Additional login terminals
- `/run/host/`: Host system access hierarchy
- Device node requirements and limitations

### Portable Service Architecture

Service packaging and deployment model:

- Root filesystem with service binaries
- Matching systemd unit files
- os-release identification file
- Security profile application
- OverlayFS extension support

### Network Configuration

Modern network setup patterns:

- `.network` files for interface configuration
- Bridge and VLAN management
- Container networking integration
- Predictable interface naming
- Network online detection

### User Record Format

JSON-based user definitions:

- Identity information (name, email, real name)
- Authentication methods (passwords, SSH keys, PKCS#11)
- Resource limits (disk quota, process limits)
- Home directory encryption settings
- Service integration properties

## Security Features

### Container Security

- Namespace isolation (PID, network, mount, user)
- Capability dropping and filtering
- Seccomp system call filtering
- SELinux/AppArmor integration
- Resource limits via cgroups

### Portable Service Security Profiles

- **default**: Basic security restrictions
- **trusted**: Relaxed restrictions for trusted services
- **strict**: Maximum security restrictions
- **nonetwork**: Network isolation profile
- Custom profile creation support

### User Security

- Encrypted home directories (LUKS)
- Authentication method flexibility
- Resource quota enforcement
- Service isolation per user
- Automatic cleanup on logout

## Integration Patterns

### Development Environments

- Isolated development containers with systemd-nspawn
- Project-specific OS images with mkosi
- Network isolation for testing
- Resource-constrained environments

### Service Deployment

- Portable service packaging
- Multi-environment deployment
- Service versioning and rollback
- Security profile application

### System Administration

- User account automation
- Network configuration management
- Boot environment setup
- System image creation and deployment

## Performance Considerations

### Container Performance

- Lower overhead than full virtualization
- Direct kernel integration
- Efficient resource sharing
- Fast startup times

### Image Building Performance

- Incremental builds with caching
- Parallel package installation
- Efficient layer management
- Build artifact reuse

### Network Performance

- Zero-copy networking with veth pairs
- Hardware offloading support
- Efficient bridge configuration
- Minimal latency overhead

## Common Use Cases

### Development Workflows

- Isolated build environments
- Reproducible development setups
- Testing with different OS versions
- Container-based CI/CD

### Server Management

- Service isolation without containers
- User environment management
- Network configuration automation
- Boot environment standardization

### Edge Computing

- Minimal OS images for embedded systems
- Secure service deployment
- Resource-constrained environments
- Offline operation capabilities

## Troubleshooting and Debugging

### Container Issues

- Journal inspection with `journalctl -M container-name`
- Resource usage monitoring
- Network connectivity debugging
- File system permission issues

### Service Deployment Issues

- Portable service validation
- Security profile conflicts
- Dependency resolution
- Unit file syntax errors

### Network Configuration Issues

- Interface state inspection with `networkctl`
- DHCP lease debugging
- Bridge configuration verification
- DNS resolution troubleshooting

## Migration from Traditional Tools

### From Docker

- Container workload migration to systemd-nspawn
- Service definition translation
- Network configuration adaptation
- Security policy conversion

### From Traditional VMs

- Image conversion to mkosi-built images
- Resource allocation translation
- Network bridge migration
- Storage configuration adaptation

### From Traditional Package Management

- Service bundling into portable services
- Dependency management strategies
- Update and rollback procedures
- Configuration management integration

## Best Practices

### Container Management

- Use appropriate resource limits
- Implement proper security profiles
- Plan network topology carefully
- Monitor resource usage

### Service Deployment

- Version portable services properly
- Test security profiles thoroughly
- Document service dependencies
- Implement proper logging

### System Configuration

- Use declarative configuration files
- Implement configuration validation
- Plan for rollback scenarios
- Document system architecture

## Advanced Features

### Custom Security Profiles

- Creating application-specific security restrictions
- Capability analysis and minimization
- System call filtering optimization
- Resource limit tuning

### Advanced Networking

- Complex bridge topologies
- VLAN segmentation strategies
- Network namespacing patterns
- Performance optimization techniques

### Image Customization

- Custom package repositories
- Build-time configuration injection
- Multi-stage build processes
- Automated testing integration

## See Also

- Complete examples: `@$HOME/.claude/snippets/systemd/`
- Configuration templates: `@$HOME/.claude/snippets/systemd/configs/`
- Security profiles: `@$HOME/.claude/snippets/systemd/security/`
- Network configs: `@$HOME/.claude/snippets/systemd/network/`
- mkosi configurations: `@$HOME/.claude/snippets/systemd/mkosi/`
- Portable service examples: `@$HOME/.claude/snippets/systemd/portable/`
