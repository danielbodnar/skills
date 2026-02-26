#!/bin/bash
# VyOS Proxmox VE Deployment Script
# Deploy VyOS virtual machines on Proxmox VE using CLI tools

set -e

# Configuration variables
PROXMOX_HOST="${PROXMOX_HOST:-localhost}"
VM_ID="${VM_ID:-200}"
VM_NAME="vyos-router"
VM_MEMORY="2048"
VM_CORES="2"
VM_SOCKETS="1"
STORAGE_POOL="local-lvm"
NETWORK_BRIDGE="vmbr0"
VYOS_QCOW2_URL="https://github.com/vyos/vyos-rolling/releases/latest/download/vyos-rolling-latest.qcow2"
VYOS_QCOW2_PATH="/tmp/vyos-rolling.qcow2"

# SSH configuration for Proxmox access
PROXMOX_USER="root"
PROXMOX_SSH_KEY="~/.ssh/id_rsa"

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

# Execute command on Proxmox host
proxmox_exec() {
    local command="$1"
    
    if [ "$PROXMOX_HOST" = "localhost" ]; then
        eval "$command"
    else
        ssh -i "$PROXMOX_SSH_KEY" "$PROXMOX_USER@$PROXMOX_HOST" "$command"
    fi
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if qm command is available (locally or remotely)
    if ! proxmox_exec "command -v qm" &> /dev/null; then
        error "Proxmox VE tools (qm) not found"
        exit 1
    fi
    
    # Check if storage pool exists
    if ! proxmox_exec "pvesm list $STORAGE_POOL" &> /dev/null; then
        error "Storage pool '$STORAGE_POOL' not found"
        info "Available storage pools:"
        proxmox_exec "pvesm status"
        exit 1
    fi
    
    info "Prerequisites check passed"
}

# Download VyOS qcow2 image
download_vyos_image() {
    info "Downloading VyOS qcow2 image..."
    
    if [ "$PROXMOX_HOST" = "localhost" ]; then
        # Download locally
        if [ ! -f "$VYOS_QCOW2_PATH" ]; then
            wget -O "$VYOS_QCOW2_PATH" "$VYOS_QCOW2_URL"
        else
            info "VyOS image already exists at $VYOS_QCOW2_PATH"
        fi
    else
        # Download on remote Proxmox host
        proxmox_exec "
            if [ ! -f '$VYOS_QCOW2_PATH' ]; then
                wget -O '$VYOS_QCOW2_PATH' '$VYOS_QCOW2_URL'
            else
                echo 'VyOS image already exists at $VYOS_QCOW2_PATH'
            fi
        "
    fi
    
    info "VyOS image ready"
}

# Create VyOS VM from qcow2 image
create_vm_from_qcow2() {
    info "Creating VyOS VM (ID: $VM_ID) from qcow2 image..."
    
    # Check if VM already exists
    if proxmox_exec "qm list | grep -q '^$VM_ID '"; then
        warn "VM with ID $VM_ID already exists"
        read -p "Destroy and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            proxmox_exec "qm stop $VM_ID || true"
            proxmox_exec "qm destroy $VM_ID"
        else
            return 0
        fi
    fi
    
    # Create VM
    proxmox_exec "qm create $VM_ID --name '$VM_NAME' --memory $VM_MEMORY --cores $VM_CORES --sockets $VM_SOCKETS --net0 virtio,bridge=$NETWORK_BRIDGE"
    
    # Import disk
    proxmox_exec "qm importdisk $VM_ID '$VYOS_QCOW2_PATH' $STORAGE_POOL"
    
    # Attach disk to VM
    proxmox_exec "qm set $VM_ID --virtio0 $STORAGE_POOL:vm-$VM_ID-disk-0"
    
    # Set boot order
    proxmox_exec "qm set $VM_ID --boot order=virtio0"
    
    # Configure additional settings
    proxmox_exec "qm set $VM_ID --ostype l26"
    proxmox_exec "qm set $VM_ID --serial0 socket --vga serial0"
    
    info "VyOS VM created successfully"
}

# Create VyOS VM from ISO
create_vm_from_iso() {
    local iso_file="$1"
    
    info "Creating VyOS VM (ID: $VM_ID) from ISO..."
    
    if [ -z "$iso_file" ]; then
        error "ISO file path required"
        return 1
    fi
    
    # Check if VM already exists
    if proxmox_exec "qm list | grep -q '^$VM_ID '"; then
        warn "VM with ID $VM_ID already exists"
        read -p "Destroy and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            proxmox_exec "qm stop $VM_ID || true"
            proxmox_exec "qm destroy $VM_ID"
        else
            return 0
        fi
    fi
    
    # Create VM
    proxmox_exec "qm create $VM_ID \
        --name '$VM_NAME' \
        --memory $VM_MEMORY \
        --cores $VM_CORES \
        --sockets $VM_SOCKETS \
        --net0 virtio,bridge=$NETWORK_BRIDGE \
        --cdrom '$iso_file' \
        --virtio0 $STORAGE_POOL:8 \
        --boot order=ide2,virtio0 \
        --ostype l26 \
        --serial0 socket \
        --vga serial0"
    
    info "VyOS VM created from ISO"
    info "Start the VM and perform manual installation"
}

# Create cloud-init configuration
create_cloud_init() {
    local vm_ip="${1:-192.168.1.100}"
    local gateway="${2:-192.168.1.1}"
    
    info "Configuring cloud-init for VM $VM_ID..."
    
    # Create cloud-init drive
    proxmox_exec "qm set $VM_ID --ide2 $STORAGE_POOL:cloudinit"
    
    # Configure cloud-init settings
    proxmox_exec "qm set $VM_ID --ciuser vyos"
    proxmox_exec "qm set $VM_ID --cipassword vyos123"
    proxmox_exec "qm set $VM_ID --ipconfig0 ip=$vm_ip/24,gw=$gateway"
    proxmox_exec "qm set $VM_ID --nameserver 8.8.8.8"
    proxmox_exec "qm set $VM_ID --searchdomain local"
    
    # Add SSH key if available
    if [ -f ~/.ssh/id_rsa.pub ]; then
        local ssh_key=$(cat ~/.ssh/id_rsa.pub)
        proxmox_exec "qm set $VM_ID --sshkey /dev/stdin" <<< "$ssh_key"
    fi
    
    info "Cloud-init configuration completed"
}

# Convert VM to template
create_template() {
    info "Converting VM $VM_ID to template..."
    
    # Ensure VM is stopped
    proxmox_exec "qm stop $VM_ID || true"
    
    # Convert to template
    proxmox_exec "qm template $VM_ID"
    
    info "VM converted to template"
}

# Clone VM from template
clone_vm() {
    local template_id="$1"
    local new_vm_id="$2"
    local new_vm_name="$3"
    
    if [ -z "$template_id" ] || [ -z "$new_vm_id" ] || [ -z "$new_vm_name" ]; then
        error "Usage: clone_vm <template_id> <new_vm_id> <new_vm_name>"
        return 1
    fi
    
    info "Cloning template $template_id to VM $new_vm_id..."
    
    # Full clone
    proxmox_exec "qm clone $template_id $new_vm_id --name '$new_vm_name' --full"
    
    info "VM cloned successfully"
}

# VM management functions
start_vm() {
    info "Starting VM $VM_ID..."
    proxmox_exec "qm start $VM_ID"
}

stop_vm() {
    info "Stopping VM $VM_ID..."
    proxmox_exec "qm stop $VM_ID"
}

restart_vm() {
    info "Restarting VM $VM_ID..."
    proxmox_exec "qm restart $VM_ID"
}

destroy_vm() {
    info "Destroying VM $VM_ID..."
    proxmox_exec "qm stop $VM_ID || true"
    proxmox_exec "qm destroy $VM_ID"
    info "VM destroyed"
}

# Show VM information
show_vm_info() {
    info "VM Information for ID $VM_ID:"
    
    if ! proxmox_exec "qm list | grep -q '^$VM_ID '"; then
        warn "VM with ID $VM_ID does not exist"
        return 1
    fi
    
    echo
    echo "VM Status:"
    proxmox_exec "qm list | grep '^$VM_ID '"
    
    echo
    echo "VM Configuration:"
    proxmox_exec "qm config $VM_ID"
    
    echo
    echo "VM Current Status:"
    proxmox_exec "qm status $VM_ID"
    
    echo
    echo "Console Access:"
    echo "  Web console: https://$PROXMOX_HOST:8006"
    echo "  Console command: qm terminal $VM_ID"
    echo "  VNC command: qm vncproxy $VM_ID"
}

# Monitor VM
monitor_vm() {
    info "Monitoring VM $VM_ID (Ctrl+C to exit)..."
    
    while true; do
        clear
        echo "=== VyOS VM Monitor - $(date) ==="
        echo
        
        proxmox_exec "qm list | grep '^$VM_ID '" || echo "VM not found"
        echo
        
        # Show resource usage if VM is running
        if proxmox_exec "qm status $VM_ID | grep -q running"; then
            echo "Resource Usage:"
            proxmox_exec "qm monitor $VM_ID info status" 2>/dev/null || true
        fi
        
        sleep 5
    done
}

# Backup VM
backup_vm() {
    local backup_storage="${1:-local}"
    
    info "Creating backup of VM $VM_ID..."
    
    # Create backup
    proxmox_exec "vzdump $VM_ID --storage $backup_storage --mode stop --compress gzip"
    
    info "Backup completed"
}

# Console access
console_vm() {
    info "Connecting to VM console..."
    
    if [ "$PROXMOX_HOST" = "localhost" ]; then
        qm terminal "$VM_ID"
    else
        ssh -t -i "$PROXMOX_SSH_KEY" "$PROXMOX_USER@$PROXMOX_HOST" "qm terminal $VM_ID"
    fi
}

# Deploy complete VyOS infrastructure
deploy_infrastructure() {
    local vm_count="${1:-1}"
    local base_ip="${2:-192.168.1.100}"
    
    info "Deploying VyOS infrastructure with $vm_count VMs..."
    
    check_prerequisites
    download_vyos_image
    
    for ((i=0; i<vm_count; i++)); do
        local current_vm_id=$((VM_ID + i))
        local current_vm_name="${VM_NAME}-${i}"
        local current_ip="${base_ip%.*}.$((${base_ip##*.} + i))"
        
        info "Creating VM $current_vm_id ($current_vm_name)..."
        
        VM_ID="$current_vm_id" VM_NAME="$current_vm_name" create_vm_from_qcow2
        create_cloud_init "$current_ip/24" "${base_ip%.*}.1"
        start_vm
        
        sleep 5
    done
    
    info "Infrastructure deployment completed"
}

# Main execution
main() {
    case "${1:-help}" in
        "create-qcow2")
            check_prerequisites
            download_vyos_image
            create_vm_from_qcow2
            ;;
        "create-iso")
            check_prerequisites
            create_vm_from_iso "$2"
            ;;
        "cloud-init")
            create_cloud_init "$2" "$3"
            ;;
        "template")
            create_template
            ;;
        "clone")
            clone_vm "$2" "$3" "$4"
            ;;
        "start")
            start_vm
            ;;
        "stop")
            stop_vm
            ;;
        "restart")
            restart_vm
            ;;
        "destroy")
            destroy_vm
            ;;
        "info")
            show_vm_info
            ;;
        "monitor")
            monitor_vm
            ;;
        "backup")
            backup_vm "$2"
            ;;
        "console")
            console_vm
            ;;
        "deploy")
            deploy_infrastructure "$2" "$3"
            ;;
        "list")
            info "All VMs on Proxmox host:"
            proxmox_exec "qm list"
            ;;
        "help"|*)
            echo "VyOS Proxmox VE Deployment Script"
            echo "Usage: $0 <command> [arguments]"
            echo
            echo "Environment Variables:"
            echo "  PROXMOX_HOST    - Proxmox host (default: localhost)"
            echo "  VM_ID           - VM ID to use (default: 200)"
            echo "  STORAGE_POOL    - Storage pool (default: local-lvm)"
            echo
            echo "Commands:"
            echo "  create-qcow2                        - Create VM from qcow2 image"
            echo "  create-iso <iso_path>              - Create VM from ISO"
            echo "  cloud-init [ip] [gateway]          - Configure cloud-init"
            echo "  template                           - Convert VM to template"
            echo "  clone <template_id> <vm_id> <name> - Clone from template"
            echo "  start                              - Start VM"
            echo "  stop                               - Stop VM"
            echo "  restart                            - Restart VM"
            echo "  destroy                            - Destroy VM"
            echo "  info                               - Show VM information"
            echo "  monitor                            - Monitor VM"
            echo "  backup [storage]                   - Backup VM"
            echo "  console                            - Connect to VM console"
            echo "  deploy [count] [base_ip]           - Deploy infrastructure"
            echo "  list                               - List all VMs"
            echo "  help                               - Show this help"
            echo
            echo "Examples:"
            echo "  VM_ID=201 $0 create-qcow2"
            echo "  $0 cloud-init 192.168.1.100 192.168.1.1"
            echo "  $0 deploy 3 192.168.1.100"
            echo "  PROXMOX_HOST=pve.example.com $0 info"
            ;;
    esac
}

# Execute main function
main "$@"