# netboot.xyz Reference

**Always remember to reference @$HOME/.claude/references/netboot-xyz.md and look for snippets and examples in @$HOME/.claude/snippets/netboot-xyz/**

## Quick Reference

## Default Usage Patterns

Default to using netboot.xyz for network-based operating system installations and rescue environments:

- **netboot.xyz**: Network bootable OS installer using iPXE with user-friendly menu
- **PXE Boot**: Network-based boot without physical media
- **Multi-Architecture**: Legacy BIOS, UEFI, x86, x86_64, ARM64 support
- **Self-Hosting**: Docker containers and Ansible deployment
- **Custom Images**: Create custom iPXE boot environments
- Homepage: <https://netboot.xyz>
- Documentation: <https://netboot.xyz/docs>
- GitHub: <https://github.com/netbootxyz/netboot.xyz>
- Docker: ghcr.io/netbootxyz/netbootxyz
- Boot URL: <https://boot.netboot.xyz>

## What is netboot.xyz?

netboot.xyz is a network-based bootable operating system installer using iPXE that provides a user-friendly menu for booting various OS and utility disks over the network. It enables booting into many types of operating systems using lightweight tooling without downloading and rewriting media.

## Resources and Documentation

- [netboot.xyz Documentation](https://netboot.xyz/docs)
  - [Quick Start](https://netboot.xyz/docs/quick-start)
  - [Self-Hosting](https://netboot.xyz/docs/selfhosting)
  - [Docker Deployment](https://netboot.xyz/docs/docker)
  - [Booting Methods](https://netboot.xyz/docs/booting)
  - [Knowledge Base](https://netboot.xyz/docs/kb)
    - [Networking Setup](https://netboot.xyz/docs/kb/networking)
    - [PXE Configuration](https://netboot.xyz/docs/kb/pxe)
    - [Hardware Support](https://netboot.xyz/docs/kb/hardware)
    - [Cloud Providers](https://netboot.xyz/docs/kb/providers)
- [Community Resources](https://netboot.xyz/community)
  - [Discord Community](https://discord.gg/4GEKyKE)
  - [GitHub Issues](https://github.com/netbootxyz/netboot.xyz/issues)
  - [Blog](https://netboot.xyz/blog)

## Supported Architectures

- x86 (32-bit)
- x86_64 (64-bit)  
- ARM64/aarch64
- Legacy BIOS (PCBIOS)
- UEFI

## Key Features

- **Network Boot**: Boot operating systems over the network without physical media
- **Multiple OS Support**: 60+ Linux distributions, utilities, and rescue systems
- **iPXE Based**: Powered by iPXE project for enhanced boot capabilities
- **Self-Hosting**: Deploy your own netboot.xyz infrastructure
- **Docker Support**: Containerized deployment with web interface
- **Custom Menus**: Create custom boot menus and configurations
- **Multi-Architecture**: Support for Legacy BIOS and UEFI systems

## Deployment Methods

### 1. Cloud/Hosted Boot

- Chain to `https://boot.netboot.xyz` from any iPXE-capable system
- No local infrastructure required
- Requires internet connectivity

### 2. Docker Container

- Self-hosted container with web interface
- Local asset mirroring and caching
- TFTP server for PXE booting
- Custom menu development

### 3. Ansible Deployment

- Infrastructure as Code deployment
- Custom menu generation
- Local web server hosting
- Template-based configuration

### 4. ISO/USB Boot

- Downloadable ISO images for CD/DVD/USB
- Direct hardware booting
- Offline menu access with network fetch

## Boot Files and Images

- **netboot.xyz.kpxe** - Legacy BIOS PXE boot
- **netboot.xyz.efi** - UEFI PXE boot  
- **netboot.xyz-arm64.efi** - ARM64 UEFI boot
- **netboot.xyz.iso** - Bootable ISO image
- **netboot.xyz.img** - USB disk image
- **netboot.xyz.lkrn** - Linux kernel format

## Network Protocols Supported

- PXE (Preboot Execution Environment)
- TFTP (Trivial File Transfer Protocol)
- HTTP/HTTPS
- NFS
- iSCSI
- AOE (ATA over Ethernet)

## Operating System Categories

- **Linux Network Installs**: Debian, Ubuntu, CentOS, Fedora, SUSE, Arch, etc.
- **Live CD/Distro Menu**: Live environments for testing and rescue
- **Utilities Menu**: System rescue, diagnostics, and maintenance tools
- **Custom Menus**: User-defined boot options

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/netboot-xyz/`:

- Basic iPXE configurations
- DHCP server setups
- Docker deployments
- Ansible playbooks
- Custom menu creation
- Network configurations

## Configuration Files

Configuration examples and templates in `$HOME/.claude/snippets/netboot-xyz/config/`:

- DHCP server configurations
- dnsmasq setups
- Router configurations (EdgeRouter, VyOS, MikroTik)
- Cloud provider integrations

## Advanced Features

- **Custom Image Creation**: Build custom iPXE images with embedded scripts
- **Automation Support**: Kickstart, Preseed, Cloud-init integrations
- **Multi-Provider**: Support for major cloud providers (AWS, GCP, Azure, etc.)
- **Hardware Compatibility**: Extensive hardware and virtualization support
- **Development Tools**: Web interface for menu editing and testing

## Security Considerations

- HTTPS support for secure boot chains
- Certificate management for authenticated boots
- Network isolation and access controls
- Asset integrity verification

## Performance Features

- Local asset caching and mirroring
- CDN distribution for global performance
- Lightweight iPXE kernel (< 1MB)
- Efficient network protocols

## Troubleshooting Resources

- Serial console access guides
- Network debugging techniques
- Hardware compatibility lists
- Common configuration issues

## Community and Support

- Active Discord community for real-time help
- GitHub issue tracking for bug reports
- Comprehensive knowledge base
- Regular updates and maintenance
