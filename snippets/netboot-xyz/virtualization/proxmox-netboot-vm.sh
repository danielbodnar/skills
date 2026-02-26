#!/bin/bash
# Create Proxmox VE VM configured for netboot.xyz

# VM Configuration
VM_ID=201
VM_NAME="netboot-xyz-test"
VM_MEMORY=4096
VM_CORES=2
VM_DISK_SIZE=32G
STORAGE="local-lvm"
ISO_STORAGE="local"
ISO_FILE="netboot.xyz.iso"

# Download netboot.xyz ISO if not present
if [ ! -f "/var/lib/vz/template/iso/$ISO_FILE" ]; then
    echo "Downloading netboot.xyz ISO..."
    wget -O "/var/lib/vz/template/iso/$ISO_FILE" \
        https://boot.netboot.xyz/ipxe/netboot.xyz.iso
fi

# Create VM
echo "Creating VM $VM_ID ($VM_NAME)..."
qm create $VM_ID \
    --name $VM_NAME \
    --memory $VM_MEMORY \
    --cores $VM_CORES \
    --ostype l26 \
    --machine q35 \
    --bios ovmf \
    --efidisk0 ${STORAGE}:1,format=raw,efitype=4m,pre-enrolled-keys=0 \
    --scsihw virtio-scsi-pci \
    --scsi0 ${STORAGE}:${VM_DISK_SIZE},format=raw \
    --ide2 ${ISO_STORAGE}:iso/${ISO_FILE},media=cdrom \
    --net0 virtio,bridge=vmbr0,firewall=1 \
    --boot order=ide2 \
    --onboot 0 \
    --agent enabled=1

# Configure VM options
echo "Configuring VM options..."
qm set $VM_ID --description "netboot.xyz test VM - Network boot testing environment"

# Start VM
echo "Starting VM..."
qm start $VM_ID

echo "VM $VM_ID created and started."
echo "Access via Proxmox console or:"
echo "  qm monitor $VM_ID"
echo ""
echo "To connect to VNC console:"
echo "  Point VNC client to $(hostname -I | awk '{print $1}'):$((5900 + $VM_ID))"
echo ""
echo "To remove VM later:"
echo "  qm stop $VM_ID && qm destroy $VM_ID"