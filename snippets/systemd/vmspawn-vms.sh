#!/bin/bash
# systemd-vmspawn Virtual Machine Management Examples
# Comprehensive guide for managing full virtualization with systemd-vmspawn

set -euo pipefail

# VM configuration
VM_NAME="testvm"
VM_IMAGE_DIR="/var/lib/machines"
VM_IMAGE="${VM_IMAGE_DIR}/${VM_NAME}.raw"
VM_SIZE="20G"
VM_RAM="2G"
VM_CPUS="2"

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

# VM image creation
create_vm_image() {
    log "Creating VM image: ${VM_IMAGE}"
    
    # Create raw disk image
    sudo qemu-img create -f raw "${VM_IMAGE}" "${VM_SIZE}"
    
    # Create GPT partition table
    sudo sgdisk --clear \
        --new=1:0:+512M --typecode=1:ef00 --change-name=1:"EFI System" \
        --new=2:0:+1G --typecode=2:8300 --change-name=2:"Linux Boot" \
        --new=3:0:0 --typecode=3:8300 --change-name=3:"Linux Root" \
        "${VM_IMAGE}"
    
    log "VM image created successfully"
}

create_vm_image_with_mkosi() {
    log "Creating VM image with mkosi"
    
    # Create mkosi configuration
    cat << EOF > "/tmp/mkosi-${VM_NAME}.conf"
[Config]
ImageId=${VM_NAME}
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=${VM_NAME}.raw
OutputDirectory=${VM_IMAGE_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         kernel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Password=root
Bootable=yes
BiosBootloader=grub
EOF

    # Build image with mkosi
    sudo mkosi -f "/tmp/mkosi-${VM_NAME}.conf" build
    
    # Clean up config file
    rm "/tmp/mkosi-${VM_NAME}.conf"
    
    log "VM image created with mkosi"
}

# Basic VM operations
start_vm_basic() {
    log "Starting VM: ${VM_NAME}"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}"
}

start_vm_with_uefi() {
    log "Starting VM with UEFI firmware"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi
}

start_vm_with_tpm() {
    log "Starting VM with TPM support"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --tpm
}

start_vm_with_secure_boot() {
    log "Starting VM with Secure Boot"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --tpm \
        --secure-boot
}

# Advanced VM configurations
start_vm_with_networking() {
    log "Starting VM with custom networking"
    
    # Create bridge if it doesn't exist
    if ! ip link show br0 >/dev/null 2>&1; then
        sudo ip link add name br0 type bridge
        sudo ip link set br0 up
        sudo ip addr add 192.168.100.1/24 dev br0
    fi
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --network-bridge=br0
}

start_vm_with_host_networking() {
    log "Starting VM with host networking"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --network-user-mode
}

start_vm_with_bind_mounts() {
    log "Starting VM with bind mounts"
    
    # Create shared directory
    sudo mkdir -p /var/lib/shared
    sudo chmod 755 /var/lib/shared
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --bind=/var/lib/shared:/shared \
        --bind-ro=/etc/resolv.conf:/etc/resolv.conf
}

start_vm_with_console() {
    log "Starting VM with console access"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --console=pty
}

start_vm_with_vnc() {
    log "Starting VM with VNC display"
    
    sudo systemd-vmspawn \
        --image="${VM_IMAGE}" \
        --ram="${VM_RAM}" \
        --cpus="${VM_CPUS}" \
        --firmware=uefi \
        --console=gui \
        --background
    
    log "VM started in background. Connect via VNC to localhost:5900"
}

# VM management with systemd services
create_vm_service() {
    log "Creating systemd service for VM: ${VM_NAME}"
    
    cat << EOF | sudo tee "/etc/systemd/system/vm-${VM_NAME}.service" > /dev/null
[Unit]
Description=Virtual Machine ${VM_NAME}
After=network.target

[Service]
Type=notify
ExecStart=/usr/lib/systemd/systemd-vmspawn \\
    --image=${VM_IMAGE} \\
    --ram=${VM_RAM} \\
    --cpus=${VM_CPUS} \\
    --firmware=uefi \\
    --tpm \\
    --network-bridge=br0
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Resource limits
MemoryMax=4G
CPUQuota=200%
TasksMax=1024

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    log "VM service created: vm-${VM_NAME}.service"
}

enable_vm_service() {
    log "Enabling VM service for automatic startup"
    
    sudo systemctl enable "vm-${VM_NAME}.service"
    sudo systemctl start "vm-${VM_NAME}.service"
    
    log "VM service enabled and started"
}

# VM snapshot management
create_vm_snapshot() {
    local snapshot_name="$1"
    
    log "Creating VM snapshot: ${snapshot_name}"
    
    # Stop VM if running
    sudo systemctl stop "vm-${VM_NAME}.service" 2>/dev/null || true
    
    # Create snapshot using qemu-img
    sudo qemu-img create -f qcow2 -b "${VM_IMAGE}" \
        "${VM_IMAGE_DIR}/${VM_NAME}-${snapshot_name}.qcow2"
    
    log "Snapshot created: ${VM_NAME}-${snapshot_name}.qcow2"
}

restore_vm_snapshot() {
    local snapshot_name="$1"
    
    log "Restoring VM from snapshot: ${snapshot_name}"
    
    # Stop VM if running
    sudo systemctl stop "vm-${VM_NAME}.service" 2>/dev/null || true
    
    # Backup current image
    sudo cp "${VM_IMAGE}" "${VM_IMAGE}.backup.$(date +%s)"
    
    # Convert snapshot back to raw format
    sudo qemu-img convert -f qcow2 -O raw \
        "${VM_IMAGE_DIR}/${VM_NAME}-${snapshot_name}.qcow2" \
        "${VM_IMAGE}"
    
    log "VM restored from snapshot"
}

list_vm_snapshots() {
    log "Available snapshots for VM: ${VM_NAME}"
    
    find "${VM_IMAGE_DIR}" -name "${VM_NAME}-*.qcow2" -exec basename {} \; | \
        sed "s/${VM_NAME}-//" | sed 's/.qcow2$//' | sort
}

# VM disk management
resize_vm_disk() {
    local new_size="$1"
    
    log "Resizing VM disk to: ${new_size}"
    
    # Stop VM if running
    sudo systemctl stop "vm-${VM_NAME}.service" 2>/dev/null || true
    
    # Resize the image
    sudo qemu-img resize "${VM_IMAGE}" "${new_size}"
    
    log "VM disk resized. You may need to resize partitions inside the VM."
}

add_vm_disk() {
    local disk_name="$2"
    local disk_size="$3"
    
    log "Adding additional disk: ${disk_name} (${disk_size})"
    
    local disk_path="${VM_IMAGE_DIR}/${VM_NAME}-${disk_name}.raw"
    
    # Create additional disk
    sudo qemu-img create -f raw "${disk_path}" "${disk_size}"
    
    log "Additional disk created: ${disk_path}"
    log "Add --disk=${disk_path} to systemd-vmspawn command to attach it"
}

# VM networking setup
setup_vm_networking() {
    log "Setting up VM networking infrastructure"
    
    # Create bridge interface
    if ! ip link show br0 >/dev/null 2>&1; then
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
    fi
    
    # Create DHCP configuration for VMs
    cat << EOF | sudo tee /etc/dnsmasq.d/vm-bridge.conf > /dev/null
interface=br0
dhcp-range=192.168.100.100,192.168.100.200,12h
dhcp-option=3,192.168.100.1
dhcp-option=6,8.8.8.8,8.8.4.4
EOF

    sudo systemctl restart dnsmasq
    
    log "VM networking configured"
}

# VM monitoring and management
monitor_vm() {
    log "Monitoring VM: ${VM_NAME}"
    
    # Check service status
    echo "=== VM Service Status ==="
    sudo systemctl status "vm-${VM_NAME}.service" --no-pager
    
    # Show VM resource usage
    echo "=== Resource Usage ==="
    sudo systemctl show "vm-${VM_NAME}.service" \
        --property=MemoryCurrent,CPUUsageNSec,TasksCurrent
    
    # Show VM logs
    echo "=== VM Logs ==="
    sudo journalctl -u "vm-${VM_NAME}.service" --no-pager -n 20
    
    # Check VM network connectivity (if bridge exists)
    if ip link show br0 >/dev/null 2>&1; then
        echo "=== VM Network Status ==="
        ip addr show br0
        arp -a | grep "192.168.100"
    fi
}

list_running_vms() {
    log "Listing running VMs"
    
    # Show systemd services for VMs
    sudo systemctl list-units --type=service --state=running | grep "^vm-"
    
    # Show processes
    ps aux | grep systemd-vmspawn | grep -v grep
}

connect_to_vm() {
    log "Connecting to VM console: ${VM_NAME}"
    
    # Try to connect via console if VM supports it
    sudo virsh console "${VM_NAME}" || {
        warn "Direct console connection failed"
        log "Try SSH if network is configured:"
        log "ssh user@192.168.100.xxx"
    }
}

# VM backup and restore
backup_vm() {
    log "Backing up VM: ${VM_NAME}"
    
    local backup_dir="/var/backups/vms"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    sudo mkdir -p "${backup_dir}"
    
    # Stop VM for consistent backup
    sudo systemctl stop "vm-${VM_NAME}.service" 2>/dev/null || true
    
    # Compress and backup VM image
    sudo gzip -c "${VM_IMAGE}" > "${backup_dir}/${VM_NAME}_${timestamp}.raw.gz"
    
    # Create metadata file
    cat << EOF | sudo tee "${backup_dir}/${VM_NAME}_${timestamp}.metadata" > /dev/null
VM Name: ${VM_NAME}
Backup Date: $(date)
Image Size: $(ls -lh "${VM_IMAGE}" | awk '{print $5}')
RAM: ${VM_RAM}
CPUs: ${VM_CPUS}
Backup File: ${VM_NAME}_${timestamp}.raw.gz
EOF

    log "VM backup created: ${backup_dir}/${VM_NAME}_${timestamp}.raw.gz"
}

restore_vm() {
    local backup_file="$1"
    local restore_name="${2:-${VM_NAME}}"
    
    log "Restoring VM from: ${backup_file}"
    
    # Stop VM if running
    sudo systemctl stop "vm-${restore_name}.service" 2>/dev/null || true
    
    # Restore VM image
    local restore_image="${VM_IMAGE_DIR}/${restore_name}.raw"
    sudo gunzip -c "${backup_file}" > "${restore_image}"
    
    log "VM restored as: ${restore_name}"
}

# VM performance tuning
tune_vm_performance() {
    log "Tuning VM performance settings"
    
    # CPU performance settings
    echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
    
    # Memory settings
    echo 'never' | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
    echo 'never' | sudo tee /sys/kernel/mm/transparent_hugepage/defrag
    
    # I/O scheduler
    echo 'noop' | sudo tee /sys/block/*/queue/scheduler
    
    # Kernel parameters for virtualization
    cat << EOF | sudo tee -a /etc/sysctl.conf > /dev/null
# VM performance tuning
vm.swappiness=10
vm.dirty_ratio=10
vm.dirty_background_ratio=5
net.core.netdev_max_backlog=5000
net.ipv4.tcp_congestion_control=bbr
EOF

    sudo sysctl -p
    
    log "VM performance tuning applied"
}

# VM security hardening
harden_vm_security() {
    log "Applying security hardening for VMs"
    
    # Create systemd override for enhanced security
    sudo mkdir -p "/etc/systemd/system/vm-${VM_NAME}.service.d"
    
    cat << EOF | sudo tee "/etc/systemd/system/vm-${VM_NAME}.service.d/security.conf" > /dev/null
[Service]
# Security hardening
NoNewPrivileges=yes
PrivateDevices=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/machines
MemoryDenyWriteExecute=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
LockPersonality=yes
SystemCallArchitectures=native

# Capability restrictions
CapabilityBoundingSet=CAP_NET_ADMIN CAP_SYS_ADMIN CAP_SYS_RAWIO
AmbientCapabilities=

# Network restrictions
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
EOF

    sudo systemctl daemon-reload
    
    log "VM security hardening applied"
}

# VM cleanup
cleanup_vm() {
    log "Cleaning up VM: ${VM_NAME}"
    
    # Stop and disable VM service
    sudo systemctl stop "vm-${VM_NAME}.service" 2>/dev/null || true
    sudo systemctl disable "vm-${VM_NAME}.service" 2>/dev/null || true
    
    # Remove service file
    sudo rm -f "/etc/systemd/system/vm-${VM_NAME}.service"
    sudo rm -rf "/etc/systemd/system/vm-${VM_NAME}.service.d"
    
    # Remove VM images
    sudo rm -f "${VM_IMAGE}"
    sudo rm -f "${VM_IMAGE_DIR}/${VM_NAME}"-*.qcow2
    sudo rm -f "${VM_IMAGE_DIR}/${VM_NAME}"-*.raw
    
    sudo systemctl daemon-reload
    
    log "VM cleanup completed"
}

# Usage examples
show_usage() {
    cat << EOF
systemd-vmspawn Virtual Machine Management Examples

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    create              Create VM image
    create-mkosi        Create VM image with mkosi
    start               Start VM with basic settings
    start-uefi          Start VM with UEFI firmware
    start-secure        Start VM with Secure Boot and TPM
    start-net           Start VM with custom networking
    service             Create systemd service for VM
    enable              Enable VM service for auto-start
    snapshot NAME       Create VM snapshot
    restore NAME        Restore from snapshot
    list-snapshots      List available snapshots
    monitor             Monitor VM status and resources
    backup              Backup VM
    restore-backup FILE [NAME]  Restore VM from backup
    cleanup             Remove VM completely

VM Management:
    resize SIZE         Resize VM disk
    add-disk NAME SIZE  Add additional disk
    tune                Apply performance tuning
    harden              Apply security hardening
    setup-network       Setup VM networking infrastructure

Examples:
    # Create a new VM
    $0 create

    # Create VM with mkosi
    $0 create-mkosi

    # Start VM with UEFI and TPM
    $0 start-secure

    # Create systemd service
    $0 service

    # Enable automatic startup
    $0 enable

    # Create snapshot
    $0 snapshot before-update

    # Monitor VM
    $0 monitor

    # Backup VM
    $0 backup

Environment Variables:
    VM_NAME             VM name (default: testvm)
    VM_SIZE             VM disk size (default: 20G)
    VM_RAM              VM memory (default: 2G)
    VM_CPUS             VM CPU count (default: 2)
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        "create")
            create_vm_image
            ;;
        "create-mkosi")
            create_vm_image_with_mkosi
            ;;
        "start")
            start_vm_basic
            ;;
        "start-uefi")
            start_vm_with_uefi
            ;;
        "start-secure")
            start_vm_with_secure_boot
            ;;
        "start-net")
            start_vm_with_networking
            ;;
        "service")
            create_vm_service
            ;;
        "enable")
            enable_vm_service
            ;;
        "snapshot")
            create_vm_snapshot "$2"
            ;;
        "restore")
            restore_vm_snapshot "$2"
            ;;
        "list-snapshots")
            list_vm_snapshots
            ;;
        "resize")
            resize_vm_disk "$2"
            ;;
        "add-disk")
            add_vm_disk "$2" "$3"
            ;;
        "setup-network")
            setup_vm_networking
            ;;
        "monitor")
            monitor_vm
            ;;
        "list")
            list_running_vms
            ;;
        "backup")
            backup_vm
            ;;
        "restore-backup")
            restore_vm "$2" "$3"
            ;;
        "tune")
            tune_vm_performance
            ;;
        "harden")
            harden_vm_security
            ;;
        "cleanup")
            cleanup_vm
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