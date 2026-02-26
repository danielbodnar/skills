#!/bin/bash
# systemd-vmspawn Advanced Usage Patterns

# Advanced VM with multiple drives and bind mounts
echo "=== Advanced VM with multiple storage ==="
systemd-vmspawn \
    --image=/var/lib/machines/app.raw \
    --extra-drive=/var/lib/machines/data.qcow2 \
    --extra-drive=/var/lib/machines/logs.qcow2 \
    --bind=/home/shared:/mnt/shared \
    --bind-ro=/etc/ssl/certs:/etc/ssl/certs \
    --machine=multi-storage-vm

# VM with custom QEMU options via environment
echo "=== VM with custom QEMU options ==="
export SYSTEMD_VMSPAWN_QEMU_EXTRA="-device e1000,netdev=net0 -netdev user,id=net0,hostfwd=tcp::8080-:80"
systemd-vmspawn \
    --image=web-server.raw \
    --machine=custom-qemu-vm

# Development VM with source code bind mounts
echo "=== Development VM with source mounts ==="
systemd-vmspawn \
    --directory=/var/lib/machines/dev-rootfs \
    --bind=/home/developer/projects:/workspace \
    --bind=/home/developer/.ssh:/root/.ssh:ro \
    --bind=/home/developer/.gitconfig:/root/.gitconfig:ro \
    --network-user-mode \
    --pass-ssh-key=yes \
    --cpus=4 \
    --ram=8G \
    --machine=development-vm

# VM cluster orchestration with dependencies
echo "=== VM cluster with service dependencies ==="
# Database VM (starts first)
systemd-vmspawn \
    --image=/var/lib/machines/postgres.raw \
    --extra-drive=/var/lib/postgres-data.qcow2 \
    --vsock=yes,201 \
    --cpus=2 \
    --ram=4G \
    --machine=postgres-vm &

# Wait for database to be ready
sleep 30

# Application VM (depends on database)
systemd-vmspawn \
    --image=/var/lib/machines/webapp.raw \
    --vsock=yes,202 \
    --network-user-mode \
    --cpus=2 \
    --ram=2G \
    --machine=webapp-vm &

# Load balancer VM (depends on application)
sleep 30
systemd-vmspawn \
    --image=/var/lib/machines/nginx.raw \
    --vsock=yes,203 \
    --network-user-mode \
    --cpus=1 \
    --ram=1G \
    --machine=nginx-vm &

# CI/CD VM with ephemeral storage
echo "=== CI/CD VM with ephemeral environment ==="
# Create temporary workspace
TEMP_WORKSPACE=$(mktemp -d)
chmod 755 "$TEMP_WORKSPACE"

systemd-vmspawn \
    --directory=/var/lib/machines/ci-rootfs \
    --bind="$TEMP_WORKSPACE":/workspace \
    --bind=/var/run/docker.sock:/var/run/docker.sock \
    --network-user-mode \
    --cpus=4 \
    --ram=8G \
    --machine=ci-vm

# Cleanup after CI run
# rm -rf "$TEMP_WORKSPACE"

# GPU passthrough VM (advanced virtualization)
echo "=== VM with GPU passthrough ==="
export SYSTEMD_VMSPAWN_QEMU_EXTRA="-device vfio-pci,host=01:00.0 -machine type=q35 -enable-kvm"
systemd-vmspawn \
    --image=/var/lib/machines/gpu-workstation.raw \
    --cpus=8 \
    --ram=16G \
    --machine=gpu-vm

# Multi-architecture VM (ARM on x86)
echo "=== Multi-architecture VM ==="
export SYSTEMD_VMSPAWN_QEMU_EXTRA="-machine virt -cpu cortex-a57"
systemd-vmspawn \
    --image=/var/lib/machines/arm64-system.raw \
    --cpus=2 \
    --ram=2G \
    --machine=arm64-vm

# VM snapshot and cloning workflow
echo "=== VM snapshot and cloning ==="
cat > /tmp/vm-snapshot-workflow.sh << 'EOF'
#!/bin/bash
# VM Snapshot and Cloning Workflow

BASE_VM="base-vm"
BASE_IMAGE="/var/lib/machines/base.raw"

# Create base VM
create_base_vm() {
    echo "Creating base VM..."
    systemd-vmspawn \
        --image="$BASE_IMAGE" \
        --machine="$BASE_VM" \
        --register=yes \
        --pass-ssh-key=yes &
    
    BASE_PID=$!
    echo "Base VM PID: $BASE_PID"
}

# Create snapshot (requires qemu-img)
snapshot_vm() {
    local snapshot_name="$1"
    echo "Creating snapshot: $snapshot_name"
    
    # Stop VM gracefully
    machinectl terminate "$BASE_VM"
    sleep 5
    
    # Create snapshot
    qemu-img create -f qcow2 -b "$BASE_IMAGE" "/var/lib/machines/${snapshot_name}.qcow2"
    echo "Snapshot created: /var/lib/machines/${snapshot_name}.qcow2"
}

# Clone VM from snapshot
clone_vm() {
    local clone_name="$1"
    local snapshot_image="$2"
    
    echo "Cloning VM: $clone_name from $snapshot_image"
    systemd-vmspawn \
        --image="$snapshot_image" \
        --machine="$clone_name" \
        --register=yes \
        --network-user-mode &
}

# Example usage
case "${1:-help}" in
    create)
        create_base_vm
        ;;
    snapshot)
        snapshot_vm "$2"
        ;;
    clone)
        clone_vm "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {create|snapshot <name>|clone <name> <snapshot-image>}"
        ;;
esac
EOF

chmod +x /tmp/vm-snapshot-workflow.sh

# VM migration script
echo "=== VM migration script ==="
cat > /tmp/vm-migration.sh << 'EOF'
#!/bin/bash
# VM Migration Script

SOURCE_HOST="$1"
TARGET_HOST="$2"
VM_NAME="$3"

if [ -z "$SOURCE_HOST" ] || [ -z "$TARGET_HOST" ] || [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <source-host> <target-host> <vm-name>"
    exit 1
fi

echo "Migrating VM $VM_NAME from $SOURCE_HOST to $TARGET_HOST"

# Stop VM on source host
echo "Stopping VM on source host..."
ssh "$SOURCE_HOST" "machinectl terminate $VM_NAME"

# Wait for VM to stop
sleep 10

# Copy VM image to target host
echo "Copying VM image..."
VM_IMAGE="/var/lib/machines/${VM_NAME}.raw"
scp "$SOURCE_HOST:$VM_IMAGE" "$TARGET_HOST:$VM_IMAGE"

# Copy VM configuration if exists
CONFIG_FILE="/etc/systemd/vmspawn/${VM_NAME}.conf"
if ssh "$SOURCE_HOST" "test -f $CONFIG_FILE"; then
    echo "Copying VM configuration..."
    scp "$SOURCE_HOST:$CONFIG_FILE" "$TARGET_HOST:$CONFIG_FILE"
fi

# Start VM on target host
echo "Starting VM on target host..."
ssh "$TARGET_HOST" "systemctl start systemd-vmspawn@${VM_NAME}.service"

echo "Migration completed"
EOF

chmod +x /tmp/vm-migration.sh

# VM monitoring and metrics collection
echo "=== VM monitoring script ==="
cat > /tmp/vm-monitoring.sh << 'EOF'
#!/bin/bash
# VM Monitoring and Metrics Collection

VM_NAME="$1"
if [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <vm-name>"
    exit 1
fi

# Function to get VM metrics
get_vm_metrics() {
    local vm_name="$1"
    
    echo "=== VM Metrics for $vm_name ==="
    echo "Timestamp: $(date)"
    
    # VM status
    echo "VM Status:"
    machinectl show "$vm_name" | grep -E "(State|Service)"
    
    # CPU usage (approximate via process monitoring)
    echo "CPU Usage:"
    VM_PID=$(pgrep -f "systemd-vmspawn.*$vm_name")
    if [ -n "$VM_PID" ]; then
        ps -p "$VM_PID" -o pid,ppid,pcpu,pmem,cmd
    fi
    
    # Memory usage
    echo "Memory Usage:"
    if [ -d "/sys/fs/cgroup/machine.slice/machine-${vm_name}.scope" ]; then
        cat "/sys/fs/cgroup/machine.slice/machine-${vm_name}.scope/memory.current" 2>/dev/null | numfmt --to=iec
    fi
    
    # Network statistics
    echo "Network Statistics:"
    ip link show | grep -A 1 -B 1 "$vm_name" || echo "No dedicated network interface"
    
    # Disk I/O (if available)
    echo "Disk I/O:"
    if command -v iostat >/dev/null; then
        iostat -x 1 1 | grep -E "(Device|vmspawn)" || echo "No VM-specific disk stats"
    fi
    
    echo "========================="
}

# Continuous monitoring
monitor_vm() {
    local vm_name="$1"
    local interval="${2:-30}"
    
    echo "Starting continuous monitoring for $vm_name (interval: ${interval}s)"
    echo "Press Ctrl+C to stop"
    
    while true; do
        get_vm_metrics "$vm_name"
        sleep "$interval"
    done
}

# Export metrics to file
export_metrics() {
    local vm_name="$1"
    local output_file="${2:-/tmp/vm-metrics-${vm_name}.log}"
    
    echo "Exporting metrics for $vm_name to $output_file"
    get_vm_metrics "$vm_name" >> "$output_file"
}

# Main execution
case "${2:-status}" in
    monitor)
        monitor_vm "$VM_NAME" "$3"
        ;;
    export)
        export_metrics "$VM_NAME" "$3"
        ;;
    status|*)
        get_vm_metrics "$VM_NAME"
        ;;
esac
EOF

chmod +x /tmp/vm-monitoring.sh

# Auto-scaling VM manager
echo "=== Auto-scaling VM manager ==="
cat > /tmp/vm-autoscale.sh << 'EOF'
#!/bin/bash
# VM Auto-scaling Manager

CONFIG_FILE="${1:-/tmp/autoscale-config.conf}"

# Default configuration
cat > "$CONFIG_FILE" << 'CONF'
# VM Auto-scaling Configuration
BASE_IMAGE="/var/lib/machines/webapp.raw"
MIN_VMS=2
MAX_VMS=10
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
SCALE_UP_COOLDOWN=300
SCALE_DOWN_COOLDOWN=600
VM_PREFIX="auto-webapp"
CONF

source "$CONFIG_FILE"

# Function to get system load
get_system_load() {
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    local load_percent=$(echo "scale=0; $load_avg * 100 / $cpu_count" | bc)
    echo "$load_percent"
}

# Function to count running VMs
count_running_vms() {
    machinectl list | grep -c "$VM_PREFIX" || echo 0
}

# Function to scale up
scale_up() {
    local current_count=$(count_running_vms)
    local new_vm_id=$((current_count + 1))
    local vm_name="${VM_PREFIX}-${new_vm_id}"
    
    if [ "$current_count" -lt "$MAX_VMS" ]; then
        echo "Scaling up: Creating $vm_name"
        systemd-vmspawn \
            --image="$BASE_IMAGE" \
            --machine="$vm_name" \
            --register=yes \
            --network-user-mode \
            --cpus=2 \
            --ram=2G &
        
        echo "$(date): VM $vm_name started" >> /var/log/vm-autoscale.log
    else
        echo "Maximum VM limit reached ($MAX_VMS)"
    fi
}

# Function to scale down
scale_down() {
    local current_count=$(count_running_vms)
    
    if [ "$current_count" -gt "$MIN_VMS" ]; then
        local vm_to_stop="${VM_PREFIX}-${current_count}"
        echo "Scaling down: Stopping $vm_to_stop"
        machinectl terminate "$vm_to_stop"
        echo "$(date): VM $vm_to_stop stopped" >> /var/log/vm-autoscale.log
    else
        echo "Minimum VM limit reached ($MIN_VMS)"
    fi
}

# Main auto-scaling loop
autoscale_loop() {
    echo "Starting VM auto-scaling manager"
    echo "Configuration: MIN=$MIN_VMS, MAX=$MAX_VMS, CPU_THRESHOLD=$CPU_THRESHOLD%"
    
    while true; do
        current_load=$(get_system_load)
        current_vms=$(count_running_vms)
        
        echo "$(date): Load: ${current_load}%, VMs: ${current_vms}"
        
        if [ "$current_load" -gt "$CPU_THRESHOLD" ]; then
            echo "High load detected, considering scale up"
            scale_up
            sleep "$SCALE_UP_COOLDOWN"
        elif [ "$current_load" -lt $((CPU_THRESHOLD / 2)) ]; then
            echo "Low load detected, considering scale down"
            scale_down
            sleep "$SCALE_DOWN_COOLDOWN"
        fi
        
        sleep 60
    done
}

# Command execution
case "${2:-run}" in
    run)
        autoscale_loop
        ;;
    status)
        echo "Current VMs: $(count_running_vms)"
        echo "System Load: $(get_system_load)%"
        machinectl list | grep "$VM_PREFIX"
        ;;
    scale-up)
        scale_up
        ;;
    scale-down)
        scale_down
        ;;
    *)
        echo "Usage: $0 [config-file] {run|status|scale-up|scale-down}"
        ;;
esac
EOF

chmod +x /tmp/vm-autoscale.sh

echo "Advanced patterns examples completed!"
echo "Scripts available in /tmp/:"
echo "- vm-snapshot-workflow.sh - VM snapshotting and cloning"
echo "- vm-migration.sh - VM migration between hosts"
echo "- vm-monitoring.sh - VM monitoring and metrics"
echo "- vm-autoscale.sh - Auto-scaling VM manager"