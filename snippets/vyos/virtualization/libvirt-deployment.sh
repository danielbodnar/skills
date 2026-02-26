#!/bin/bash
# VyOS Libvirt/KVM Deployment Script
# Deploy VyOS virtual machines using libvirt and KVM

set -e

# Configuration variables
VM_NAME="vyos-router"
VM_MEMORY="4096"  # Memory in MB
VM_VCPUS="2"
VM_DISK_SIZE="8G"
VYOS_ISO_URL="https://github.com/vyos/vyos-rolling/releases/latest/download/vyos-rolling-latest.iso"
VYOS_ISO_PATH="/var/lib/libvirt/images/vyos-rolling-latest.iso"
VM_DISK_PATH="/var/lib/libvirt/images/${VM_NAME}.qcow2"
BRIDGE_NAME="virbr0"
MAC_ADDRESS=""  # Auto-generate if empty

# Network configuration
VM_IP="192.168.122.10"
GATEWAY="192.168.122.1"
NETMASK="255.255.255.0"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root"
        exit 1
    fi
    
    # Check required packages
    local required_packages=("virt-install" "virsh" "qemu-kvm" "libvirt-daemon")
    local missing_packages=()
    
    for package in "${required_packages[@]}"; do
        if ! command -v "$package" &> /dev/null; then
            missing_packages+=("$package")
        fi
    done
    
    if [ ${#missing_packages[@]} -ne 0 ]; then
        error "Missing required packages: ${missing_packages[*]}"
        info "Install with: apt-get install qemu-kvm libvirt-daemon-system libvirt-clients virtinst"
        exit 1
    fi
    
    # Check if libvirt service is running
    if ! systemctl is-active --quiet libvirtd; then
        info "Starting libvirt service..."
        systemctl start libvirtd
        systemctl enable libvirtd
    fi
    
    # Check if default network exists
    if ! virsh net-list --all | grep -q "default"; then
        info "Creating default libvirt network..."
        virsh net-define /usr/share/libvirt/networks/default.xml
        virsh net-start default
        virsh net-autostart default
    fi
    
    info "Prerequisites check passed"
}

# Download VyOS ISO
download_vyos_iso() {
    info "Downloading VyOS ISO..."
    
    if [ -f "$VYOS_ISO_PATH" ]; then
        warn "VyOS ISO already exists at $VYOS_ISO_PATH"
        read -p "Download latest version? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$VYOS_ISO_PATH")"
    
    # Download ISO
    info "Downloading from $VYOS_ISO_URL"
    wget -O "$VYOS_ISO_PATH" "$VYOS_ISO_URL"
    
    if [ $? -eq 0 ]; then
        info "VyOS ISO downloaded successfully"
    else
        error "Failed to download VyOS ISO"
        exit 1
    fi
}

# Generate MAC address
generate_mac_address() {
    if [ -z "$MAC_ADDRESS" ]; then
        MAC_ADDRESS=$(printf '52:54:00:%02x:%02x:%02x\n' $((RANDOM%256)) $((RANDOM%256)) $((RANDOM%256)))
        debug "Generated MAC address: $MAC_ADDRESS"
    fi
}

# Create VM disk
create_vm_disk() {
    info "Creating VM disk: $VM_DISK_PATH"
    
    if [ -f "$VM_DISK_PATH" ]; then
        warn "VM disk already exists"
        read -p "Recreate disk? This will destroy existing data! (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$VM_DISK_PATH"
        else
            return 0
        fi
    fi
    
    # Create qcow2 disk
    qemu-img create -f qcow2 "$VM_DISK_PATH" "$VM_DISK_SIZE"
    
    info "VM disk created successfully"
}

# Create cloud-init configuration
create_cloud_init() {
    local cloud_init_dir="/tmp/vyos-cloud-init"
    local iso_path="/var/lib/libvirt/images/${VM_NAME}-cloud-init.iso"
    
    info "Creating cloud-init configuration..."
    
    mkdir -p "$cloud_init_dir"
    
    # Create meta-data
    cat > "$cloud_init_dir/meta-data" << EOF
instance-id: vyos-vm-001
local-hostname: $VM_NAME
EOF
    
    # Create user-data
    cat > "$cloud_init_dir/user-data" << EOF
#cloud-config
vyos_config_commands:
  - set system host-name '$VM_NAME'
  - set system domain-name 'local'
  - set interfaces ethernet eth0 address '$VM_IP/24'
  - set interfaces ethernet eth0 description 'Primary Interface'
  - set system gateway '$GATEWAY'
  - set system name-server '8.8.8.8'
  - set system name-server '8.8.4.4'
  - set service ssh port '22'
  - set service ssh disable-password-authentication
  - set system login user vyos authentication public-keys admin key 'AAAAB3NzaC1yc2EAAAADAQABAAABAQC...'
  - set system login user vyos authentication public-keys admin type 'ssh-rsa'
EOF
    
    # Create network-config
    cat > "$cloud_init_dir/network-config" << EOF
version: 2
ethernets:
  eth0:
    dhcp4: false
    addresses: [$VM_IP/24]
    gateway4: $GATEWAY
    nameservers:
      addresses: [8.8.8.8, 8.8.4.4]
EOF
    
    # Create cloud-init ISO
    genisoimage -output "$iso_path" -volid cidata -joliet -rock "$cloud_init_dir"/
    
    info "Cloud-init ISO created at $iso_path"
    
    # Cleanup
    rm -rf "$cloud_init_dir"
    
    echo "$iso_path"
}

# Install VyOS VM using virt-install
install_vyos_vm() {
    info "Installing VyOS VM: $VM_NAME"
    
    # Check if VM already exists
    if virsh list --all | grep -q "$VM_NAME"; then
        warn "VM $VM_NAME already exists"
        read -p "Destroy and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            virsh destroy "$VM_NAME" 2>/dev/null || true
            virsh undefine "$VM_NAME" 2>/dev/null || true
        else
            return 0
        fi
    fi
    
    generate_mac_address
    
    # Create cloud-init ISO
    local cloud_init_iso
    cloud_init_iso=$(create_cloud_init)
    
    # Install VM
    virt-install \
        --name "$VM_NAME" \
        --memory "$VM_MEMORY" \
        --vcpus "$VM_VCPUS" \
        --disk path="$VM_DISK_PATH,format=qcow2" \
        --disk path="$cloud_init_iso,device=cdrom" \
        --cdrom "$VYOS_ISO_PATH" \
        --network bridge="$BRIDGE_NAME,mac=$MAC_ADDRESS" \
        --graphics spice \
        --console pty,target_type=serial \
        --os-variant debian11 \
        --boot uefi \
        --noautoconsole
    
    info "VyOS VM installation started"
    info "Use 'virsh console $VM_NAME' to access the console"
    info "Use 'virt-viewer $VM_NAME' for graphical console"
}

# Install VyOS from existing qcow2 image
install_from_qcow2() {
    local qcow2_url="$1"
    local qcow2_path="/var/lib/libvirt/images/vyos-rolling.qcow2"
    
    info "Installing VyOS from qcow2 image..."
    
    # Download qcow2 image if URL provided
    if [ -n "$qcow2_url" ]; then
        info "Downloading qcow2 image from $qcow2_url"
        wget -O "$qcow2_path" "$qcow2_url"
    elif [ ! -f "$qcow2_path" ]; then
        error "qcow2 image not found at $qcow2_path"
        return 1
    fi
    
    # Copy image to VM disk location
    cp "$qcow2_path" "$VM_DISK_PATH"
    
    generate_mac_address
    
    # Create VM definition
    virt-install \
        --name "$VM_NAME" \
        --memory "$VM_MEMORY" \
        --vcpus "$VM_VCPUS" \
        --disk path="$VM_DISK_PATH,format=qcow2" \
        --network bridge="$BRIDGE_NAME,mac=$MAC_ADDRESS" \
        --graphics spice \
        --console pty,target_type=serial \
        --os-variant debian11 \
        --import \
        --noautoconsole
    
    info "VyOS VM created from qcow2 image"
}

# Show VM information
show_vm_info() {
    info "VyOS VM Information:"
    
    if ! virsh list --all | grep -q "$VM_NAME"; then
        warn "VM $VM_NAME does not exist"
        return 1
    fi
    
    echo
    echo "VM Status:"
    virsh list --all | grep "$VM_NAME"
    
    echo
    echo "VM Configuration:"
    virsh dominfo "$VM_NAME"
    
    echo
    echo "Network Information:"
    virsh domifaddr "$VM_NAME" 2>/dev/null || echo "Network information not available"
    
    echo
    echo "Console Access:"
    echo "  Text console: virsh console $VM_NAME"
    echo "  VNC console:  virt-viewer $VM_NAME"
    
    if virsh list | grep -q "$VM_NAME.*running"; then
        echo
        echo "SSH Access (once configured):"
        echo "  ssh vyos@$VM_IP"
    fi
}

# VM management functions
start_vm() {
    info "Starting VyOS VM..."
    virsh start "$VM_NAME"
}

stop_vm() {
    info "Stopping VyOS VM..."
    virsh shutdown "$VM_NAME"
}

destroy_vm() {
    info "Destroying VyOS VM..."
    virsh destroy "$VM_NAME" 2>/dev/null || true
    virsh undefine "$VM_NAME" 2>/dev/null || true
    rm -f "$VM_DISK_PATH"
    rm -f "/var/lib/libvirt/images/${VM_NAME}-cloud-init.iso"
    info "VM destroyed and files removed"
}

# Console access
console_vm() {
    info "Connecting to VM console (Ctrl+] to exit)..."
    virsh console "$VM_NAME"
}

# Backup VM
backup_vm() {
    local backup_dir="${1:-/var/backups/libvirt}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$backup_dir/${VM_NAME}_${timestamp}"
    
    info "Backing up VM to $backup_path"
    
    mkdir -p "$backup_path"
    
    # Export VM configuration
    virsh dumpxml "$VM_NAME" > "$backup_path/${VM_NAME}.xml"
    
    # Copy disk image
    cp "$VM_DISK_PATH" "$backup_path/"
    
    # Create backup info
    cat > "$backup_path/backup_info.txt" << EOF
VM Name: $VM_NAME
Backup Date: $(date)
VM State: $(virsh list --all | grep "$VM_NAME" | awk '{print $3}')
Memory: $VM_MEMORY MB
vCPUs: $VM_VCPUS
Disk Size: $VM_DISK_SIZE
EOF
    
    info "Backup completed: $backup_path"
}

# Main execution
main() {
    case "${1:-help}" in
        "install")
            check_prerequisites
            download_vyos_iso
            create_vm_disk
            install_vyos_vm
            ;;
        "install-qcow2")
            check_prerequisites
            create_vm_disk
            install_from_qcow2 "$2"
            ;;
        "start")
            start_vm
            ;;
        "stop")
            stop_vm
            ;;
        "destroy")
            destroy_vm
            ;;
        "info")
            show_vm_info
            ;;
        "console")
            console_vm
            ;;
        "backup")
            backup_vm "$2"
            ;;
        "viewer")
            info "Starting graphical console..."
            virt-viewer "$VM_NAME" &
            ;;
        "help"|*)
            echo "VyOS Libvirt/KVM Deployment Script"
            echo "Usage: $0 <command> [arguments]"
            echo
            echo "Commands:"
            echo "  install                     - Install VyOS VM from ISO"
            echo "  install-qcow2 [url]        - Install VyOS VM from qcow2 image"
            echo "  start                      - Start VyOS VM"
            echo "  stop                       - Stop VyOS VM"
            echo "  destroy                    - Destroy VyOS VM"
            echo "  info                       - Show VM information"
            echo "  console                    - Connect to VM console"
            echo "  viewer                     - Open graphical console"
            echo "  backup [directory]         - Backup VM"
            echo "  help                       - Show this help"
            echo
            echo "Examples:"
            echo "  $0 install"
            echo "  $0 install-qcow2 https://example.com/vyos.qcow2"
            echo "  $0 start"
            echo "  $0 console"
            echo "  $0 backup /tmp/backups"
            ;;
    esac
}

# Execute main function
main "$@"