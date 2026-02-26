#!/bin/bash
# systemd-vmspawn Service Integration Examples

# Create a systemd service for a VM
echo "=== Creating systemd service for VM ==="
cat > /tmp/myvm.service << 'EOF'
[Unit]
Description=My Virtual Machine
After=systemd-vmspawn@.service

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --image=/var/lib/machines/myvm.raw \
    --machine=myvm \
    --register=yes \
    --network-user-mode \
    --pass-ssh-key=yes
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Install the service
echo "To install the service:"
echo "sudo cp /tmp/myvm.service /etc/systemd/system/"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable myvm.service"
echo "sudo systemctl start myvm.service"

# Using the built-in systemd-vmspawn@.service template
echo "=== Using systemd-vmspawn@.service template ==="
# Create VM configuration directory
mkdir -p /tmp/vmspawn-config

# Create configuration for VM
cat > /tmp/vmspawn-config/development.conf << 'EOF'
[Spawn]
Image=/var/lib/machines/development.raw
CPUs=2
Memory=4G
NetworkUserMode=yes
PassSSHKey=yes
Register=yes
EOF

echo "To use the template service:"
echo "sudo cp /tmp/vmspawn-config/development.conf /etc/systemd/vmspawn/"
echo "sudo systemctl start systemd-vmspawn@development.service"
echo "sudo systemctl enable systemd-vmspawn@development.service"

# VM with journal forwarding as service
echo "=== VM service with journal forwarding ==="
cat > /tmp/logging-vm.service << 'EOF'
[Unit]
Description=Logging VM with Journal Forwarding
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --image=/var/lib/machines/logging-vm.raw \
    --machine=logging-vm \
    --register=yes \
    --forward-journal=/var/log/logging-vm.journal \
    --network-user-mode \
    --cpus=1 \
    --ram=1G
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Development VM service with auto-restart
echo "=== Development VM with auto-restart ==="
cat > /tmp/dev-vm.service << 'EOF'
[Unit]
Description=Development Virtual Machine
After=systemd-networkd.service

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --directory=/var/lib/machines/dev-rootfs \
    --machine=dev-vm \
    --register=yes \
    --network-tap \
    --bind=/home/developer:/home/developer:ro \
    --cpus=4 \
    --ram=8G \
    --pass-ssh-key=yes
Restart=on-failure
RestartSec=30
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

# Multi-VM orchestration example
echo "=== Multi-VM orchestration ==="
cat > /tmp/vm-cluster.target << 'EOF'
[Unit]
Description=VM Cluster
Wants=database-vm.service web-vm.service cache-vm.service
After=database-vm.service

[Install]
WantedBy=multi-user.target
EOF

cat > /tmp/database-vm.service << 'EOF'
[Unit]
Description=Database VM
PartOf=vm-cluster.target

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --image=/var/lib/machines/database.raw \
    --machine=database-vm \
    --register=yes \
    --network-user-mode \
    --extra-drive=/var/lib/databases/data.qcow2 \
    --cpus=2 \
    --ram=4G
Restart=always
RestartSec=15

[Install]
WantedBy=vm-cluster.target
EOF

cat > /tmp/web-vm.service << 'EOF'
[Unit]
Description=Web Server VM
PartOf=vm-cluster.target
After=database-vm.service

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --image=/var/lib/machines/webserver.raw \
    --machine=web-vm \
    --register=yes \
    --network-user-mode \
    --cpus=2 \
    --ram=2G
Restart=always
RestartSec=10

[Install]
WantedBy=vm-cluster.target
EOF

# VM with resource limits using systemd
echo "=== VM with systemd resource limits ==="
cat > /tmp/resource-limited-vm.service << 'EOF'
[Unit]
Description=Resource Limited VM
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --image=/var/lib/machines/limited.raw \
    --machine=limited-vm \
    --register=yes \
    --network-user-mode \
    --cpus=1 \
    --ram=1G

# systemd resource limits
MemoryHigh=2G
MemoryMax=2.5G
CPUQuota=150%
TasksMax=100

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# VM service with health checking
echo "=== VM service with health checking ==="
cat > /tmp/monitored-vm.service << 'EOF'
[Unit]
Description=Monitored VM with Health Checks
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/systemd-vmspawn \
    --image=/var/lib/machines/monitored.raw \
    --machine=monitored-vm \
    --register=yes \
    --network-user-mode \
    --pass-ssh-key=yes \
    --vsock=yes,500
ExecStartPost=/bin/sleep 30
ExecStartPost=/usr/local/bin/vm-health-check monitored-vm
Restart=on-failure
RestartSec=30
WatchdogSec=60

[Install]
WantedBy=multi-user.target
EOF

# Create health check script
cat > /tmp/vm-health-check << 'EOF'
#!/bin/bash
# VM Health Check Script
VM_NAME="$1"

if [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <vm-name>"
    exit 1
fi

# Check if VM is registered with machined
if ! machinectl show "$VM_NAME" >/dev/null 2>&1; then
    echo "VM $VM_NAME is not registered with machined"
    exit 1
fi

# Check if VM is responsive via SSH (if SSH keys are configured)
SSH_KEY="/run/user/$UID/systemd/vmspawn/machine-*-${VM_NAME}-ed25519"
if [ -f $SSH_KEY ]; then
    if ! timeout 10 ssh -o ConnectTimeout=5 -i $SSH_KEY root@vsock/500 'echo "VM responsive"' >/dev/null 2>&1; then
        echo "VM $VM_NAME is not responsive via SSH"
        exit 1
    fi
fi

echo "VM $VM_NAME health check passed"
exit 0
EOF

chmod +x /tmp/vm-health-check

# Service management commands
echo "=== Service management commands ==="
cat > /tmp/vm-service-management.sh << 'EOF'
#!/bin/bash
# VM Service Management Commands

# Start a VM service
start_vm() {
    local vm_name="$1"
    echo "Starting VM: $vm_name"
    sudo systemctl start "systemd-vmspawn@${vm_name}.service"
}

# Stop a VM service
stop_vm() {
    local vm_name="$1"
    echo "Stopping VM: $vm_name"
    sudo systemctl stop "systemd-vmspawn@${vm_name}.service"
}

# Restart a VM service
restart_vm() {
    local vm_name="$1"
    echo "Restarting VM: $vm_name"
    sudo systemctl restart "systemd-vmspawn@${vm_name}.service"
}

# Check VM service status
status_vm() {
    local vm_name="$1"
    echo "Status of VM: $vm_name"
    sudo systemctl status "systemd-vmspawn@${vm_name}.service"
}

# Enable VM service for automatic start
enable_vm() {
    local vm_name="$1"
    echo "Enabling VM for automatic start: $vm_name"
    sudo systemctl enable "systemd-vmspawn@${vm_name}.service"
}

# Disable VM service
disable_vm() {
    local vm_name="$1"
    echo "Disabling VM: $vm_name"
    sudo systemctl disable "systemd-vmspawn@${vm_name}.service"
}

# List all VM services
list_vm_services() {
    echo "VM services:"
    systemctl list-units --type=service | grep vmspawn
}

# Show logs for VM service
logs_vm() {
    local vm_name="$1"
    echo "Logs for VM: $vm_name"
    sudo journalctl -u "systemd-vmspawn@${vm_name}.service" -f
}

# Example usage
case "${1:-help}" in
    start)
        start_vm "$2"
        ;;
    stop)
        stop_vm "$2"
        ;;
    restart)
        restart_vm "$2"
        ;;
    status)
        status_vm "$2"
        ;;
    enable)
        enable_vm "$2"
        ;;
    disable)
        disable_vm "$2"
        ;;
    list)
        list_vm_services
        ;;
    logs)
        logs_vm "$2"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|enable|disable|list|logs} [vm-name]"
        ;;
esac
EOF

chmod +x /tmp/vm-service-management.sh

echo "Service integration examples completed!"
echo "Scripts created in /tmp/ - copy to appropriate locations as needed"
echo "Run management script: /tmp/vm-service-management.sh"