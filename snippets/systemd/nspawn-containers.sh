#!/bin/bash
# systemd-nspawn Container Management Examples
# Comprehensive guide for creating and managing lightweight containers

set -euo pipefail

# Container configuration
CONTAINER_NAME="devenv"
CONTAINER_ROOT="/var/lib/machines/${CONTAINER_NAME}"
DISTRO="fedora"
RELEASE="39"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create container directory
create_container_directory() {
    log "Creating container directory: ${CONTAINER_ROOT}"
    sudo mkdir -p "${CONTAINER_ROOT}"
}

# Bootstrap container with package manager
bootstrap_fedora_container() {
    log "Bootstrapping Fedora ${RELEASE} container"
    
    sudo dnf --installroot="${CONTAINER_ROOT}" \
        --releasever="${RELEASE}" \
        --repo=fedora --repo=updates \
        --assumeyes \
        install \
        systemd \
        passwd \
        dnf \
        fedora-release \
        vim \
        curl \
        git \
        sudo \
        openssh-server \
        procps-ng \
        iputils \
        iproute \
        bind-utils
}

bootstrap_ubuntu_container() {
    log "Bootstrapping Ubuntu container"
    
    sudo debootstrap --include=systemd,passwd,apt,vim,curl,git,sudo,openssh-server,procps,iputils-ping,iproute2,dnsutils \
        jammy "${CONTAINER_ROOT}" http://archive.ubuntu.com/ubuntu/
}

bootstrap_arch_container() {
    log "Bootstrapping Arch Linux container"
    
    # Create pacman configuration
    sudo mkdir -p "${CONTAINER_ROOT}/etc/pacman.d"
    sudo cp /etc/pacman.conf "${CONTAINER_ROOT}/etc/"
    sudo cp /etc/pacman.d/mirrorlist "${CONTAINER_ROOT}/etc/pacman.d/"
    
    # Bootstrap with pacstrap
    sudo pacstrap -c "${CONTAINER_ROOT}" \
        base \
        systemd \
        vim \
        curl \
        git \
        sudo \
        openssh \
        procps-ng \
        iputils \
        iproute2 \
        bind
}

# Set up container environment
setup_container_environment() {
    log "Setting up container environment"
    
    # Set root password
    sudo systemd-nspawn -D "${CONTAINER_ROOT}" passwd root
    
    # Create a regular user
    sudo systemd-nspawn -D "${CONTAINER_ROOT}" useradd -m -G wheel,sudo developer
    sudo systemd-nspawn -D "${CONTAINER_ROOT}" passwd developer
    
    # Configure hostname
    echo "${CONTAINER_NAME}" | sudo tee "${CONTAINER_ROOT}/etc/hostname" > /dev/null
    
    # Configure hosts file
    cat << EOF | sudo tee "${CONTAINER_ROOT}/etc/hosts" > /dev/null
127.0.0.1   localhost
127.0.1.1   ${CONTAINER_NAME}
::1         localhost ip6-localhost ip6-loopback
fe00::0     ip6-localnet
ff00::0     ip6-mcastprefix
ff02::1     ip6-allnodes
ff02::2     ip6-allrouters
EOF

    # Enable SSH service
    sudo systemd-nspawn -D "${CONTAINER_ROOT}" systemctl enable sshd
    
    # Set timezone
    sudo systemd-nspawn -D "${CONTAINER_ROOT}" timedatectl set-timezone UTC
}

# Basic container operations
start_container() {
    log "Starting container: ${CONTAINER_NAME}"
    sudo systemd-nspawn -M "${CONTAINER_NAME}" -D "${CONTAINER_ROOT}" --boot
}

start_container_with_networking() {
    log "Starting container with virtual ethernet networking"
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --network-veth \
        --boot
}

start_container_with_host_networking() {
    log "Starting container with host networking"
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --network-veth \
        --network-bridge=br0 \
        --boot
}

start_container_interactive() {
    log "Starting interactive shell in container"
    sudo systemd-nspawn -M "${CONTAINER_NAME}" -D "${CONTAINER_ROOT}"
}

# Advanced container configurations
start_container_with_bind_mounts() {
    log "Starting container with bind mounts"
    
    # Mount project directory and tmp
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --bind=/home/user/projects:/workspace \
        --bind=/tmp:/host-tmp \
        --tmpfs=/tmp \
        --boot
}

start_container_with_resource_limits() {
    log "Starting container with resource limits"
    
    # Create systemd service file for resource management
    cat << EOF | sudo tee "/etc/systemd/system/systemd-nspawn@${CONTAINER_NAME}.service.d/override.conf" > /dev/null
[Service]
# Memory limit: 2GB
MemoryMax=2G
MemoryHigh=1.5G

# CPU limit: 50%
CPUQuota=50%

# Process limit
TasksMax=1024

# IO bandwidth limit
IOReadBandwidthMax=/dev/sda 50M
IOWriteBandwidthMax=/dev/sda 30M
EOF

    sudo systemctl daemon-reload
    sudo machinectl start "${CONTAINER_NAME}"
}

start_container_with_security_restrictions() {
    log "Starting container with enhanced security"
    
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --capability=CAP_NET_ADMIN,CAP_SYS_ADMIN \
        --drop-capability=CAP_SYS_MODULE,CAP_SYS_RAWIO \
        --private-network \
        --read-only \
        --tmpfs=/tmp \
        --tmpfs=/run \
        --bind-ro=/etc/resolv.conf \
        --boot
}

# Container management with machinectl
enable_container_service() {
    log "Enabling container as systemd service"
    
    # Enable the container service
    sudo systemctl enable systemd-nspawn@"${CONTAINER_NAME}".service
    
    # Set container to start automatically
    sudo machinectl enable "${CONTAINER_NAME}"
}

manage_container_with_machinectl() {
    log "Container management with machinectl"
    
    # List all containers
    echo "Available containers:"
    sudo machinectl list
    
    # Show container status
    echo "Container status:"
    sudo machinectl status "${CONTAINER_NAME}" || true
    
    # Start container
    sudo machinectl start "${CONTAINER_NAME}"
    
    # Show container properties
    echo "Container properties:"
    sudo machinectl show "${CONTAINER_NAME}"
    
    # Login to container
    echo "To login to container, run:"
    echo "sudo machinectl login ${CONTAINER_NAME}"
}

# Development environment setup
setup_development_container() {
    log "Setting up development environment in container"
    
    # Install development tools
    case "${DISTRO}" in
        "fedora")
            sudo systemd-nspawn -D "${CONTAINER_ROOT}" \
                dnf install -y \
                gcc gcc-c++ make cmake \
                nodejs npm \
                python3 python3-pip \
                rust cargo \
                go \
                docker \
                podman \
                kubernetes-client
            ;;
        "ubuntu")
            sudo systemd-nspawn -D "${CONTAINER_ROOT}" \
                apt-get update && apt-get install -y \
                build-essential cmake \
                nodejs npm \
                python3 python3-pip \
                rustc cargo \
                golang \
                docker.io \
                podman \
                kubectl
            ;;
        "arch")
            sudo systemd-nspawn -D "${CONTAINER_ROOT}" \
                pacman -Sy --noconfirm \
                base-devel cmake \
                nodejs npm \
                python python-pip \
                rust \
                go \
                docker \
                podman \
                kubectl
            ;;
    esac
    
    # Install Bun runtime
    sudo systemd-nspawn -D "${CONTAINER_ROOT}" \
        bash -c 'curl -fsSL https://bun.sh/install | bash'
    
    # Configure git (will need user input)
    echo "Configure git in container:"
    echo "sudo systemd-nspawn -D ${CONTAINER_ROOT} su - developer"
    echo "git config --global user.name 'Your Name'"
    echo "git config --global user.email 'your.email@example.com'"
}

# Container networking setup
setup_container_networking() {
    log "Setting up container networking"
    
    # Create bridge interface
    sudo ip link add name br0 type bridge
    sudo ip link set br0 up
    sudo ip addr add 192.168.100.1/24 dev br0
    
    # Enable IP forwarding
    echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    # Configure iptables for NAT
    sudo iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -o eth0 -j MASQUERADE
    sudo iptables -A FORWARD -i br0 -o eth0 -j ACCEPT
    sudo iptables -A FORWARD -i eth0 -o br0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    
    # Start container with bridge networking
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --network-bridge=br0 \
        --boot
}

# Container image management
create_container_image() {
    log "Creating container image from running container"
    
    # Stop container if running
    sudo machinectl stop "${CONTAINER_NAME}" || true
    
    # Create compressed image
    sudo tar -czf "/var/lib/machines/${CONTAINER_NAME}.tar.gz" \
        -C "/var/lib/machines" \
        "${CONTAINER_NAME}"
    
    log "Container image created: /var/lib/machines/${CONTAINER_NAME}.tar.gz"
}

import_container_image() {
    local image_path="$1"
    local new_container_name="$2"
    
    log "Importing container image: ${image_path}"
    
    # Import container image
    sudo machinectl import-tar "${image_path}" "${new_container_name}"
    
    log "Container imported as: ${new_container_name}"
}

clone_container() {
    local source_container="$1"
    local target_container="$2"
    
    log "Cloning container: ${source_container} -> ${target_container}"
    
    # Clone container
    sudo machinectl clone "${source_container}" "${target_container}"
    
    log "Container cloned successfully"
}

# Container backup and restore
backup_container() {
    log "Backing up container: ${CONTAINER_NAME}"
    
    local backup_dir="/var/backups/containers"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    sudo mkdir -p "${backup_dir}"
    
    # Stop container for consistent backup
    sudo machinectl stop "${CONTAINER_NAME}" || true
    
    # Create backup
    sudo tar -czf "${backup_dir}/${CONTAINER_NAME}_${timestamp}.tar.gz" \
        -C "/var/lib/machines" \
        "${CONTAINER_NAME}"
    
    # Create metadata file
    cat << EOF | sudo tee "${backup_dir}/${CONTAINER_NAME}_${timestamp}.metadata" > /dev/null
Container: ${CONTAINER_NAME}
Backup Date: $(date)
Distro: ${DISTRO}
Release: ${RELEASE}
Backup File: ${CONTAINER_NAME}_${timestamp}.tar.gz
EOF

    log "Backup created: ${backup_dir}/${CONTAINER_NAME}_${timestamp}.tar.gz"
}

restore_container() {
    local backup_file="$1"
    local restore_name="$2"
    
    log "Restoring container from: ${backup_file}"
    
    # Extract backup
    sudo tar -xzf "${backup_file}" -C "/var/lib/machines"
    
    # Rename if different name requested
    if [[ "${restore_name}" != "${CONTAINER_NAME}" ]]; then
        sudo mv "/var/lib/machines/${CONTAINER_NAME}" "/var/lib/machines/${restore_name}"
    fi
    
    log "Container restored as: ${restore_name}"
}

# Container monitoring and debugging
monitor_container() {
    log "Monitoring container: ${CONTAINER_NAME}"
    
    # Show container status
    echo "=== Container Status ==="
    sudo machinectl status "${CONTAINER_NAME}"
    
    # Show container logs
    echo "=== Container Logs ==="
    sudo journalctl -M "${CONTAINER_NAME}" --no-pager -n 50
    
    # Show resource usage
    echo "=== Resource Usage ==="
    sudo systemctl show "systemd-nspawn@${CONTAINER_NAME}.service" \
        --property=MemoryCurrent,CPUUsageNSec,TasksCurrent
    
    # Show network information
    echo "=== Network Information ==="
    sudo machinectl show "${CONTAINER_NAME}" --property=IPAddress,Gateway
}

debug_container() {
    log "Debugging container: ${CONTAINER_NAME}"
    
    # Check if container is running
    if ! sudo machinectl status "${CONTAINER_NAME}" >/dev/null 2>&1; then
        error "Container is not running"
        return 1
    fi
    
    # Show detailed status
    sudo systemctl status "systemd-nspawn@${CONTAINER_NAME}.service"
    
    # Show container processes
    echo "=== Container Processes ==="
    sudo machinectl list-processes "${CONTAINER_NAME}"
    
    # Check network connectivity
    echo "=== Network Connectivity ==="
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --network-veth \
        ping -c 3 8.8.8.8 || true
    
    # Check DNS resolution
    echo "=== DNS Resolution ==="
    sudo systemd-nspawn -M "${CONTAINER_NAME}" \
        -D "${CONTAINER_ROOT}" \
        --network-veth \
        nslookup google.com || true
}

# Container cleanup
cleanup_container() {
    log "Cleaning up container: ${CONTAINER_NAME}"
    
    # Stop and disable container
    sudo machinectl stop "${CONTAINER_NAME}" || true
    sudo machinectl disable "${CONTAINER_NAME}" || true
    sudo systemctl disable "systemd-nspawn@${CONTAINER_NAME}.service" || true
    
    # Remove container directory
    sudo rm -rf "${CONTAINER_ROOT}"
    
    # Clean up any leftover files
    sudo rm -f "/etc/systemd/system/systemd-nspawn@${CONTAINER_NAME}.service.d/override.conf"
    
    log "Container cleanup completed"
}

# Usage examples
show_usage() {
    cat << EOF
systemd-nspawn Container Management Examples

Usage: $0 [COMMAND]

Commands:
    create              Create and bootstrap container
    start               Start container
    start-net           Start with networking
    start-dev           Start development environment
    enable              Enable as systemd service
    backup              Backup container
    restore FILE NAME   Restore container from backup
    monitor             Monitor container status
    debug               Debug container issues
    cleanup             Remove container completely

Examples:
    # Create a new development container
    $0 create

    # Start container with networking
    $0 start-net

    # Set up development tools
    $0 start-dev

    # Enable automatic startup
    $0 enable

    # Monitor container
    $0 monitor

    # Backup container
    $0 backup

    # Clean up everything
    $0 cleanup

Environment Variables:
    CONTAINER_NAME      Container name (default: devenv)
    DISTRO              Distribution (fedora|ubuntu|arch)
    RELEASE             Release version
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        "create")
            create_container_directory
            case "${DISTRO}" in
                "fedora") bootstrap_fedora_container ;;
                "ubuntu") bootstrap_ubuntu_container ;;
                "arch") bootstrap_arch_container ;;
                *) error "Unsupported distribution: ${DISTRO}"; exit 1 ;;
            esac
            setup_container_environment
            log "Container created successfully!"
            ;;
        "start")
            start_container
            ;;
        "start-net")
            start_container_with_networking
            ;;
        "start-dev")
            setup_development_container
            start_container_with_bind_mounts
            ;;
        "enable")
            enable_container_service
            ;;
        "manage")
            manage_container_with_machinectl
            ;;
        "backup")
            backup_container
            ;;
        "restore")
            restore_container "$2" "$3"
            ;;
        "monitor")
            monitor_container
            ;;
        "debug")
            debug_container
            ;;
        "cleanup")
            cleanup_container
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi