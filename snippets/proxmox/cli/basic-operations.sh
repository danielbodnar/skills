#!/bin/bash
# Proxmox VE CLI Basic Operations

# =============================================================================
# PVESH - Primary CLI Tool for REST API Access
# =============================================================================

# Check API version
pvesh get /version

# List cluster nodes
pvesh get /nodes

# Get node status
pvesh get /nodes/pve1/status

# List all VMs and containers
pvesh get /cluster/resources --type vm

# Get specific VM configuration
pvesh get /nodes/pve1/qemu/100/config

# Start a VM
pvesh create /nodes/pve1/qemu/100/status/start

# Stop a VM
pvesh create /nodes/pve1/qemu/100/status/stop

# Create new user
pvesh create /access/users \
    --userid testuser@pve \
    --password secret123 \
    --comment "Test user account"

# List users
pvesh get /access/users

# Create container
pvesh create /nodes/pve1/lxc \
    --vmid 200 \
    --hostname test-container \
    --memory 512 \
    --cores 1 \
    --rootfs local:8 \
    --ostemplate local:vztmpl/ubuntu-20.04-standard_20.04-1_amd64.tar.gz

# =============================================================================
# PVEUM - User and Permission Management
# =============================================================================

# List all users
pveum user list

# Create user with specific realm
pveum user add testuser@pam --password secret123 --comment "Test User"

# Add user to group
pveum user modify testuser@pam --groups admin

# Create API token
pveum user token add admin@pam monitoring \
    --privsep 1 \
    --expire 0 \
    --comment "Monitoring token"

# List user tokens
pveum user token list admin@pam

# Create role with specific permissions
pveum role add MonitorRole --privs "VM.Audit,Sys.Audit,Datastore.Audit"

# Assign role to user for specific path
pveum acl modify /vms --user testuser@pam --role PVEVMUser

# Show user permissions
pveum user permissions testuser@pam

# Create group
pveum group add administrators --comment "System Administrators"

# Add role to group
pveum acl modify / --group administrators --role Administrator

# =============================================================================
# QM - QEMU Virtual Machine Management
# =============================================================================

# List all VMs
qm list

# Show VM configuration
qm config 100

# Start VM
qm start 100

# Stop VM (graceful shutdown)
qm shutdown 100

# Force stop VM
qm stop 100

# Reset VM
qm reset 100

# Suspend VM
qm suspend 100

# Resume VM
qm resume 100

# Create VM from scratch
qm create 101 \
    --name "test-vm" \
    --memory 2048 \
    --cores 2 \
    --net0 virtio,bridge=vmbr0 \
    --scsi0 local:32 \
    --ide2 local:iso/ubuntu-22.04.iso,media=cdrom \
    --boot order=ide2

# Clone VM
qm clone 100 102 --name "cloned-vm"

# Create template from VM
qm template 100

# Clone from template
qm clone 100 103 --name "from-template" --full

# Take snapshot
qm snapshot 100 pre-update --description "Before system update"

# List snapshots
qm listsnapshot 100

# Rollback to snapshot
qm rollback 100 pre-update

# Delete snapshot
qm delsnapshot 100 pre-update

# Migrate VM to another node
qm migrate 100 pve2

# Set VM options
qm set 100 --memory 4096 --cores 4

# =============================================================================
# PCT - Proxmox Container Toolkit
# =============================================================================

# List all containers
pct list

# Show container configuration
pct config 200

# Start container
pct start 200

# Stop container
pct shutdown 200

# Enter container console
pct enter 200

# Execute command in container
pct exec 200 -- apt update

# Create container
pct create 201 \
    local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.gz \
    --hostname web-server \
    --memory 1024 \
    --cores 2 \
    --rootfs local:16 \
    --net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1

# Clone container
pct clone 200 202 --hostname cloned-container

# Take container snapshot
pct snapshot 200 backup-point --description "Pre-maintenance backup"

# Restore container from snapshot
pct rollback 200 backup-point

# Set container options
pct set 200 --memory 2048 --cores 2

# Push file to container
pct push 200 /local/file.txt /container/path/file.txt

# Pull file from container
pct pull 200 /container/path/file.txt /local/file.txt

# =============================================================================
# PVESM - Storage Management
# =============================================================================

# List storage
pvesm status

# Scan for available storage
pvesm scan nfs 192.168.1.10

# Add NFS storage
pvesm add nfs nfs-storage \
    --server 192.168.1.10 \
    --export /mnt/storage \
    --content images,vztmpl,backup

# List storage content
pvesm list local

# Allocate disk space
pvesm alloc local 100 vm-100-disk-1.raw 10G

# Free allocated space
pvesm free local:100/vm-100-disk-1.raw

# =============================================================================
# VZDUMP - Backup and Restore
# =============================================================================

# Backup single VM
vzdump 100 --storage backup-storage --compress gzip

# Backup multiple VMs
vzdump 100,101,102 --storage backup-storage --mode suspend

# Backup all VMs on node
vzdump --all --storage backup-storage --compress lzo

# Restore VM from backup
qmrestore /var/lib/vz/dump/vzdump-qemu-100-2023_01_01-12_00_00.vma.gz 100

# List backup files
pvesh get /nodes/pve1/storage/backup-storage/content --content backup

# =============================================================================
# PVECM - Cluster Management
# =============================================================================

# Show cluster status
pvecm status

# List cluster nodes
pvecm nodes

# Add node to cluster (run on new node)
pvecm add 192.168.1.10

# Remove node from cluster
pvecm delnode pve2

# Show expected votes
pvecm expected 1

# =============================================================================
# Useful One-liners and Scripts
# =============================================================================

# Get all running VMs
pvesh get /cluster/resources --type vm | jq '.[] | select(.status=="running") | {vmid, name, node}'

# Shutdown all VMs gracefully
for vmid in $(pvesh get /cluster/resources --type vm --output-format json | jq -r '.[] | select(.status=="running") | .vmid'); do
    echo "Shutting down VM $vmid"
    qm shutdown $vmid
done

# List all VM disk usage
pvesh get /cluster/resources --type vm --output-format json | jq -r '.[] | "\(.vmid): \(.name) - \(.disk)GB used"'

# Check node resources
pvesh get /nodes --output-format json | jq -r '.[] | "\(.node): CPU \(.cpu*100)% Memory \(.mem/1024/1024/1024)GB/\(.maxmem/1024/1024/1024)GB"'

# Create VM backup with email notification
vzdump 100 --storage backup-storage --mailto admin@example.com --compress gzip

# Mass VM configuration update
for vmid in 100 101 102; do
    qm set $vmid --memory 4096
done

# Check all VM boot orders
for vmid in $(qm list | awk 'NR>1 {print $1}'); do
    echo "VM $vmid:"
    qm config $vmid | grep boot
done