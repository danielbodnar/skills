# Arch Linux Reference

**Always remember to reference $HOME/.claude/references/archlinux.md and look for snippets and examples in $HOME/.claude/snippets/archlinux/**

## Quick Reference

- Installation: `pacman -S package-name`
- Build packages: `makepkg -si`
- Update system: `pacman -Syu`
- Documentation: <https://wiki.archlinux.org/>
- GitHub: <https://github.com/archlinux>
- Package registry: <https://archlinux.org/packages/>

Default to using Arch Linux for infrastructure base images, package building, and netboot deployments.

- **Arch Linux**: Rolling-release Linux distribution with minimal base system
- **Package Management**: pacman package manager with AUR community repository
- **Build System**: makepkg and PKGBUILD for creating custom packages
- **Netboot**: iPXE-based network installation for infrastructure deployment
- **Container/VM Base**: Minimal, customizable foundation for network appliances

## Resources and Documentation

- [Arch Linux Documentation](https://wiki.archlinux.org/)
  - [Installation Guide](https://wiki.archlinux.org/title/Installation_guide)
  - [General Recommendations](https://wiki.archlinux.org/title/General_recommendations)
    - [System Administration](https://wiki.archlinux.org/title/System_administration)
    - [Package Management](https://wiki.archlinux.org/title/Pacman)
  - [Arch Build System](https://wiki.archlinux.org/title/Arch_Build_System)
    - [PKGBUILD](https://wiki.archlinux.org/title/PKGBUILD)
    - [makepkg](https://wiki.archlinux.org/title/Makepkg)
  - [Arch User Repository](https://wiki.archlinux.org/title/Arch_User_Repository)
    - [Creating packages](https://wiki.archlinux.org/title/Creating_packages)
    - [AUR helpers](https://wiki.archlinux.org/title/AUR_helpers)
  - [Network Configuration](https://wiki.archlinux.org/title/Network_configuration)
    - [Netboot](https://wiki.archlinux.org/title/Netboot)
    - [PXE](https://wiki.archlinux.org/title/PXE)
    - [iPXE](https://wiki.archlinux.org/title/IPXE)
  - [Virtualization](https://wiki.archlinux.org/title/Virtualization)
    - [Docker](https://wiki.archlinux.org/title/Docker)
    - [Podman](https://wiki.archlinux.org/title/Podman)
    - [systemd-nspawn](https://wiki.archlinux.org/title/Systemd-nspawn)
  - [Security](https://wiki.archlinux.org/title/Security)
    - [iptables](https://wiki.archlinux.org/title/Iptables)
    - [nftables](https://wiki.archlinux.org/title/Nftables)
    - [WireGuard](https://wiki.archlinux.org/title/WireGuard)

- [Community Resources](https://archlinux.org/about/)
  - [Arch Linux Forums](https://bbs.archlinux.org/)
  - [AUR Web Interface](https://aur.archlinux.org/)
  - [Package Search](https://archlinux.org/packages/)
  - [Security Advisories](https://security.archlinux.org/)

## Core Principles

- **Simplicity**: Keep it simple, follow the UNIX philosophy
- **Modernity**: Use latest stable versions of software
- **Pragmatism**: Practical over ideological considerations
- **User-centrality**: Distribution targets competent users
- **Versatility**: Minimal base system for customization

## Package Management System

- **pacman**: Fast package manager with dependency resolution
- **AUR**: Community-driven repository with build scripts
- **makepkg**: Tool for building packages from source
- **PKGBUILD**: Build script format for packages

## Package Management

**Core Commands**

- `pacman -S package-name` for installing packages
- `pacman -Syu` for system updates
- `pacman -Ss search-term` for searching packages
- `makepkg -si` for building and installing from PKGBUILD
- `yay -S aur-package` for AUR packages (if yay is installed)

**Meta-packages Creation**

```bash
# Create meta-package PKGBUILD
pkgname='network-appliance-meta'
pkgver='1.0'
pkgrel='1'
depends=('iptables' 'dnsmasq' 'openssh' 'wireguard-tools')
```

## Build System

**PKGBUILD Structure**

```bash
# Basic PKGBUILD for infrastructure packages
pkgname=custom-firewall
pkgver=1.0.0
pkgrel=1
pkgdesc="Custom firewall configuration"
arch=('any')
depends=('iptables' 'ipset')
source=("firewall.service" "firewall.sh")
sha256sums=('SKIP' 'SKIP')

package() {
    install -Dm644 firewall.service "$pkgdir/usr/lib/systemd/system/firewall.service"
    install -Dm755 firewall.sh "$pkgdir/usr/bin/firewall.sh"
}
```

**Package Building**

```bash
# Build custom packages
makepkg --clean --install --syncdeps
makepkg --printsrcinfo > .SRCINFO  # For AUR submissions
```

## Netboot and iPXE

**Basic Netboot Setup**

```bash
# Download Arch netboot images
wget http://mirror.rackspace.com/archlinux/iso/latest/archlinux-x86_64.tar.gz
tar -xzf archlinux-x86_64.tar.gz

# Configure DHCP for PXE boot
# /etc/dnsmasq.conf
dhcp-boot=ipxe.pxe
enable-tftp
tftp-root=/srv/tftp
```

**iPXE Configuration**

```bash
# Basic iPXE script for Arch installation
#!ipxe
set base-url http://mirror.rackspace.com/archlinux/iso/latest/arch/boot
kernel ${base-url}/x86_64/vmlinuz-linux archisobasedir=arch archiso_http_srv=${base-url}/..
initrd ${base-url}/x86_64/initramfs-linux.img
boot
```

## Container Base Images

**Minimal Arch Container**

```dockerfile
FROM archlinux:latest
RUN pacman -Syu --noconfirm && \
    pacman -S --noconfirm base-devel git && \
    pacman -Scc --noconfirm
```

**Network Appliance Base**

```bash
# Install network tools in container
pacman -S --noconfirm \
    iptables ipset \
    dnsmasq dhcp \
    wireguard-tools \
    openssh socat \
    tcpdump nmap
```

## VM Templates

**Automated Installation Script**

```bash
#!/bin/bash
# arch-vm-template.sh - Automated Arch VM setup
pacstrap /mnt base linux linux-firmware
genfstab -U /mnt >> /mnt/etc/fstab
arch-chroot /mnt /bin/bash << 'EOF'
ln -sf /usr/share/zoneinfo/UTC /etc/localtime
hwclock --systohc
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf
echo "arch-appliance" > /etc/hostname
EOF
```

**Firewall VM Configuration**

```bash
# Network security appliance packages
pacman -S --noconfirm \
    iptables nftables ipset \
    fail2ban \
    suricata \
    wireguard-tools strongswan \
    keepalived \
    prometheus-node-exporter
```

## Kubernetes Node Preparation

**Container Runtime Setup**

```bash
# Install containerd for Kubernetes
pacman -S --noconfirm containerd runc
systemctl enable --now containerd

# Install Kubernetes tools
pacman -S --noconfirm kubectl kubelet kubeadm
systemctl enable kubelet
```

**Network Configuration**

```bash
# Disable swap for Kubernetes
swapoff -a
sed -i '/swap/d' /etc/fstab

# Load required kernel modules
cat > /etc/modules-load.d/k8s.conf << EOF
overlay
br_netfilter
EOF

# Configure sysctl for Kubernetes
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
```

## Infrastructure Automation

**Package Repository Setup**

```bash
# Create custom repository
repo-add /srv/http/custom/custom.db.tar.gz /path/to/package.pkg.tar.xz

# Add to pacman.conf
[custom]
Server = http://repo.example.com/custom
```

**Build Environment**

```bash
# Setup clean chroot for building
mkarchroot /var/lib/archbuild/extra-x86_64 base-devel
makechrootpkg -c -r /var/lib/archbuild/ -l root
```

## Infrastructure Use Cases

- **Base Images**: Minimal containers and VMs for appliances
- **Network Services**: Routers, firewalls, DNS, DHCP servers
- **Kubernetes Nodes**: Container runtime and orchestration
- **Development Environment**: Clean, reproducible build systems
- **Automation**: Package building and deployment pipelines

## Performance Optimization

- Rolling release for latest performance improvements
- Minimal overhead from base system
- Optimized package compilation flags
- Container-friendly architecture
- Efficient package management

## Security Considerations

- Regular updates with `pacman -Syu`
- Minimal attack surface with base installation
- Strong package verification with signatures
- Secure defaults for network services
- SELinux/AppArmor integration available

## Best Practices

- Use official repositories when possible
- Maintain custom packages in AUR format
- Regular system maintenance and updates
- Proper package dependency management
- Security-first configuration approach

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/archlinux/`:

- Package building and PKGBUILD creation
- Netboot and PXE configuration
- Container and VM templates
- Network appliance configurations
- Kubernetes cluster setup
- Infrastructure automation scripts

## Schema and Type Definitions

Configuration templates and schemas in `$HOME/.claude/snippets/archlinux/schemas/`

## See Also

- Complete reference: `$HOME/.claude/references/archlinux.md`
- Code examples: `$HOME/.claude/snippets/archlinux/`
- Package building: `$HOME/.claude/snippets/archlinux/packaging/`
- Netboot setup: `$HOME/.claude/snippets/archlinux/netboot/`
- Container images: `$HOME/.claude/snippets/archlinux/containers/`
- VM templates: `$HOME/.claude/snippets/archlinux/virtualization/`
- Infrastructure automation: `$HOME/.claude/snippets/archlinux/automation/`
- Network appliances: `$HOME/.claude/snippets/archlinux/network/`
- Kubernetes setup: `$HOME/.claude/snippets/archlinux/kubernetes/`
