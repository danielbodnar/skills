#!/bin/bash
# meta-package.sh - Create meta-packages for infrastructure deployment

create_network_appliance_meta() {
    cat > PKGBUILD << 'EOF'
# Maintainer: Infrastructure Team <infra@example.com>
pkgname=network-appliance-meta
pkgver=1.0
pkgrel=1
pkgdesc="Meta-package for network appliance deployment"
arch=('any')
url="https://internal.example.com/docs/network-appliance"
license=('custom')

# Core networking tools
depends=(
    'iptables'          # Firewall rules
    'ipset'             # IP set management
    'dnsmasq'           # DNS/DHCP server
    'openssh'           # SSH access
    'wireguard-tools'   # VPN
    'tcpdump'           # Network debugging
    'nmap'              # Network scanning
    'socat'             # Network utilities
    'htop'              # System monitoring
    'vim'               # Text editor
)

# Optional dependencies for advanced features
optdepends=(
    'fail2ban: Intrusion prevention'
    'suricata: Network security monitoring'
    'prometheus-node-exporter: Metrics collection'
    'keepalived: High availability'
    'strongswan: IPsec VPN'
    'bird: BGP routing'
)

package() {
    # Create documentation
    mkdir -p "$pkgdir/usr/share/doc/$pkgname"
    
    cat > "$pkgdir/usr/share/doc/$pkgname/README.md" << 'DOC'
# Network Appliance Meta Package

This meta-package installs all necessary components for a network appliance.

## Included Components
- iptables/ipset for firewall functionality
- dnsmasq for DNS/DHCP services
- WireGuard for VPN connectivity
- SSH for remote access
- Various network utilities for troubleshooting

## Configuration
See /etc/network-appliance/ for configuration templates.
DOC
}
EOF
}

create_kubernetes_node_meta() {
    cat > PKGBUILD << 'EOF'
# Maintainer: Infrastructure Team <infra@example.com>
pkgname=kubernetes-node-meta
pkgver=1.0
pkgrel=1
pkgdesc="Meta-package for Kubernetes node deployment"
arch=('any')
license=('Apache')

depends=(
    'containerd'        # Container runtime
    'runc'              # Container runtime
    'kubectl'           # Kubernetes CLI
    'kubelet'           # Kubernetes node agent
    'kubeadm'           # Kubernetes cluster management
    'cni-plugins'       # Container networking
    'iptables'          # Network rules
    'socat'             # Port forwarding
    'conntrack-tools'   # Connection tracking
    'ipset'             # IP sets
)

optdepends=(
    'helm: Package manager for Kubernetes'
    'docker: Alternative container runtime'
    'crictl: CRI debugging tools'
    'etcd: Distributed key-value store'
)

install=kubernetes-node.install

package() {
    # Create systemd drop-in directory
    mkdir -p "$pkgdir/etc/systemd/system/kubelet.service.d"
    
    # Create kubeconfig directory
    mkdir -p "$pkgdir/etc/kubernetes"
    
    # Create CNI config directory
    mkdir -p "$pkgdir/etc/cni/net.d"
    
    # Install documentation
    mkdir -p "$pkgdir/usr/share/doc/$pkgname"
    cat > "$pkgdir/usr/share/doc/$pkgname/README.md" << 'DOC'
# Kubernetes Node Meta Package

Installs all necessary components for a Kubernetes worker/master node.

## Post-installation steps
1. Configure container runtime: `systemctl enable --now containerd`
2. Enable kubelet: `systemctl enable kubelet`
3. Configure kernel parameters for Kubernetes
4. Join cluster with kubeadm

See the installation guide for detailed instructions.
DOC
}
EOF

    # Create install script
    cat > kubernetes-node.install << 'EOF'
post_install() {
    echo "Configuring system for Kubernetes..."
    
    # Load required kernel modules
    cat > /etc/modules-load.d/k8s.conf << 'MODULES'
overlay
br_netfilter
MODULES
    
    # Configure sysctl
    cat > /etc/sysctl.d/k8s.conf << 'SYSCTL'
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
SYSCTL
    
    # Apply sysctl settings
    sysctl --system
    
    # Disable swap
    swapoff -a
    sed -i '/swap/d' /etc/fstab
    
    echo "Kubernetes node configuration complete."
    echo "Run 'systemctl enable --now containerd' to start container runtime."
}

post_upgrade() {
    post_install
}
EOF
}

# Usage functions
case "$1" in
    "network")
        create_network_appliance_meta
        echo "Network appliance meta-package PKGBUILD created"
        ;;
    "kubernetes")
        create_kubernetes_node_meta
        echo "Kubernetes node meta-package PKGBUILD created"
        ;;
    *)
        echo "Usage: $0 {network|kubernetes}"
        echo "  network    - Create network appliance meta-package"
        echo "  kubernetes - Create Kubernetes node meta-package"
        exit 1
        ;;
esac