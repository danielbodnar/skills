#!/bin/bash
# systemd-vmspawn Network Configuration Examples

# systemd-networkd configuration for TAP networking
echo "=== Setting up systemd-networkd for TAP networking ==="

# Create network configuration for VM TAP interfaces
cat > /tmp/10-vmspawn-tap.network << 'EOF'
[Match]
Name=vmspawn-*
Type=tap

[Network]
# Enable DHCP for the TAP interface
DHCP=yes
# Enable IP forwarding for VM traffic
IPForward=yes
# Enable IP masquerading for NAT
IPMasquerade=yes
# Configure DNS
DNS=8.8.8.8
DNS=8.8.4.4
# Configure domain search
Domains=local

[DHCP]
# Use this interface's domain for search
UseDomains=yes
# Send hostname to DHCP server
SendHostname=yes
EOF

echo "Copy to system directory with:"
echo "sudo cp /tmp/10-vmspawn-tap.network /etc/systemd/network/"

# Create bridge configuration for VM networking
cat > /tmp/20-vmspawn-bridge.netdev << 'EOF'
[NetDev]
Name=br-vmspawn
Kind=bridge
Description=Bridge for VM networking

[Bridge]
# Forward delay (default: 15s, set to 0 for faster startup)
ForwardDelaySec=2
# Hello time for spanning tree
HelloTimeSec=2
# Maximum age for spanning tree
MaxAgeSec=20
EOF

cat > /tmp/20-vmspawn-bridge.network << 'EOF'
[Match]
Name=br-vmspawn

[Network]
# Bridge configuration
IPForward=yes
IPMasquerade=yes
# Static IP for the bridge
Address=192.168.100.1/24
# DHCP server for VMs
DHCPServer=yes

[DHCPServer]
# DHCP pool for VMs
PoolOffset=100
PoolSize=50
# Default lease time
DefaultLeaseTimeSec=86400
# DNS servers to advertise
DNS=192.168.100.1
# Domain name
DomainName=vm.local
EOF

echo "Copy bridge configuration with:"
echo "sudo cp /tmp/20-vmspawn-bridge.* /etc/systemd/network/"

# VSock networking setup script
cat > /tmp/setup-vsock.sh << 'EOF'
#!/bin/bash
# VSock Networking Setup

echo "=== VSock Networking Setup ==="

# Load VSock kernel modules
echo "Loading VSock kernel modules..."
sudo modprobe vsock
sudo modprobe vmw_vsock_virtio_transport
sudo modprobe vmw_vsock_virtio_transport_common

# Make modules load at boot
echo "Making VSock modules persistent..."
echo "vsock" | sudo tee -a /etc/modules-load.d/vsock.conf
echo "vmw_vsock_virtio_transport" | sudo tee -a /etc/modules-load.d/vsock.conf

# Check VSock support
echo "VSock support status:"
lsmod | grep vsock

# VSock CID allocation helper
echo "Available VSock CIDs (3-4294967294):"
echo "Reserved CIDs:"
echo "  0: Invalid"
echo "  1: Host"
echo "  2: Reserved"
echo "  3+: Available for VMs"

# Show current VSock connections
echo "Current VSock connections:"
ss -ax | grep vsock || echo "No VSock connections found"
EOF

chmod +x /tmp/setup-vsock.sh

# Firewall configuration for VM networking
cat > /tmp/vm-firewall-setup.sh << 'EOF'
#!/bin/bash
# Firewall Configuration for VM Networking

echo "=== VM Firewall Configuration ==="

# Enable IP forwarding
echo "Enabling IP forwarding..."
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-vmspawn.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-vmspawn.conf
sudo sysctl -p /etc/sysctl.d/99-vmspawn.conf

# Configure iptables for VM NAT
echo "Configuring iptables for VM networking..."

# Allow VM traffic forwarding
sudo iptables -A FORWARD -i br-vmspawn -j ACCEPT
sudo iptables -A FORWARD -o br-vmspawn -j ACCEPT

# Enable NAT for VM traffic
sudo iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -j MASQUERADE

# Allow VM bridge traffic
sudo iptables -A INPUT -i br-vmspawn -j ACCEPT

# If using TAP networking, allow TAP interfaces
sudo iptables -A FORWARD -i vmspawn-+ -j ACCEPT
sudo iptables -A FORWARD -o vmspawn-+ -j ACCEPT
sudo iptables -t nat -A POSTROUTING -s 169.254.0.0/16 -j MASQUERADE

# Save iptables rules (method varies by distribution)
if command -v iptables-save >/dev/null; then
    echo "Saving iptables rules..."
    sudo iptables-save | sudo tee /etc/iptables/rules.v4
fi

echo "Firewall configuration completed"
EOF

chmod +x /tmp/vm-firewall-setup.sh

# Network troubleshooting script
cat > /tmp/vm-network-troubleshoot.sh << 'EOF'
#!/bin/bash
# VM Network Troubleshooting Script

VM_NAME="${1:-}"

echo "=== VM Network Troubleshooting ==="

if [ -n "$VM_NAME" ]; then
    echo "Troubleshooting VM: $VM_NAME"
else
    echo "General network troubleshooting"
fi

# Check systemd-networkd status
echo "1. systemd-networkd status:"
systemctl status systemd-networkd --no-pager

# Check network interfaces
echo "2. Network interfaces:"
ip link show | grep -E "(vmspawn|br-vmspawn|tap)"

# Check bridge status
echo "3. Bridge status:"
if command -v brctl >/dev/null; then
    brctl show
else
    echo "brctl not available, using ip command:"
    ip link show type bridge
fi

# Check IP addresses
echo "4. IP addresses on VM interfaces:"
ip addr show | grep -A 2 -B 2 -E "(vmspawn|br-vmspawn)"

# Check routing
echo "5. Routing table:"
ip route show | grep -E "(vmspawn|br-vmspawn)" || echo "No VM-related routes found"

# Check iptables rules
echo "6. Iptables rules for VM networking:"
sudo iptables -L FORWARD | grep -E "(vmspawn|br-vmspawn)" || echo "No VM-related forward rules"
sudo iptables -t nat -L POSTROUTING | grep -E "(vmspawn|MASQUERADE)" || echo "No VM-related NAT rules"

# Check VSock support
echo "7. VSock support:"
lsmod | grep vsock || echo "VSock not loaded"
ls -la /dev/vsock 2>/dev/null || echo "VSock device not found"

# Check VM-specific networking
if [ -n "$VM_NAME" ]; then
    echo "8. VM-specific network info:"
    
    # Check if VM is registered
    if machinectl show "$VM_NAME" >/dev/null 2>&1; then
        echo "VM is registered with machined"
        machinectl show "$VM_NAME" | grep -E "(State|Service)"
    else
        echo "VM is not registered with machined"
    fi
    
    # Check VM processes
    VM_PROCESSES=$(pgrep -f "systemd-vmspawn.*$VM_NAME")
    if [ -n "$VM_PROCESSES" ]; then
        echo "VM processes found: $VM_PROCESSES"
        ps aux | grep -E "(systemd-vmspawn.*$VM_NAME|qemu.*$VM_NAME)" | grep -v grep
    else
        echo "No VM processes found"
    fi
fi

# Check common network issues
echo "9. Common issue checks:"

# Check if user is in KVM group (for VSock)
if groups | grep -q kvm; then
    echo "✓ User is in KVM group"
else
    echo "✗ User is not in KVM group (required for VSock)"
fi

# Check if systemd-networkd is running
if systemctl is-active --quiet systemd-networkd; then
    echo "✓ systemd-networkd is running"
else
    echo "✗ systemd-networkd is not running (required for TAP networking)"
fi

# Check IP forwarding
if [ "$(cat /proc/sys/net/ipv4/ip_forward)" = "1" ]; then
    echo "✓ IP forwarding is enabled"
else
    echo "✗ IP forwarding is disabled"
fi

echo "=== Troubleshooting completed ==="
EOF

chmod +x /tmp/vm-network-troubleshoot.sh

# Network performance testing script
cat > /tmp/vm-network-performance.sh << 'EOF'
#!/bin/bash
# VM Network Performance Testing

VM_NAME="$1"
TEST_TYPE="${2:-basic}"

if [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <vm-name> [test-type]"
    echo "Test types: basic, throughput, latency, all"
    exit 1
fi

echo "=== VM Network Performance Testing ==="
echo "VM: $VM_NAME"
echo "Test Type: $TEST_TYPE"

# Check if VM is running
if ! machinectl show "$VM_NAME" >/dev/null 2>&1; then
    echo "Error: VM $VM_NAME is not running"
    exit 1
fi

# Basic connectivity test
test_basic() {
    echo "1. Basic connectivity test:"
    
    # Try to connect via SSH if keys are available
    SSH_KEY="/run/user/$UID/systemd/vmspawn/machine-*-${VM_NAME}-ed25519"
    if ls $SSH_KEY 2>/dev/null; then
        echo "Testing SSH connectivity..."
        timeout 10 ssh -o ConnectTimeout=5 -i $SSH_KEY root@vsock/$(machinectl show "$VM_NAME" | grep VSockCID | cut -d= -f2) 'echo "SSH connection successful"'
    else
        echo "No SSH keys found for VM"
    fi
    
    # Check VM network interfaces from host perspective
    echo "VM network interfaces from host:"
    ip link show | grep "$VM_NAME" || echo "No dedicated interfaces found"
}

# Throughput test
test_throughput() {
    echo "2. Network throughput test:"
    
    # This requires iperf3 to be installed in both host and VM
    if command -v iperf3 >/dev/null; then
        echo "Starting iperf3 server on host..."
        iperf3 -s -p 5201 -D
        
        echo "Run this command in the VM to test throughput:"
        echo "iperf3 -c <host-ip> -p 5201 -t 30"
        
        # Cleanup
        sleep 5
        pkill -f "iperf3 -s"
    else
        echo "iperf3 not available, skipping throughput test"
        echo "Install with: apt install iperf3 (or equivalent)"
    fi
}

# Latency test
test_latency() {
    echo "3. Network latency test:"
    
    # Get VM IP if possible
    VM_IP=$(machinectl show "$VM_NAME" | grep IPAddress | cut -d= -f2)
    if [ -n "$VM_IP" ]; then
        echo "Testing latency to VM IP: $VM_IP"
        ping -c 10 "$VM_IP" || echo "Ping failed to VM IP"
    else
        echo "Cannot determine VM IP address"
    fi
}

# Run tests based on type
case "$TEST_TYPE" in
    basic)
        test_basic
        ;;
    throughput)
        test_throughput
        ;;
    latency)
        test_latency
        ;;
    all)
        test_basic
        test_throughput
        test_latency
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        echo "Available types: basic, throughput, latency, all"
        exit 1
        ;;
esac

echo "=== Performance testing completed ==="
EOF

chmod +x /tmp/vm-network-performance.sh

echo "Network configuration examples created in /tmp/:"
echo "- 10-vmspawn-tap.network - TAP interface configuration"
echo "- 20-vmspawn-bridge.* - Bridge networking setup"
echo "- setup-vsock.sh - VSock networking setup"
echo "- vm-firewall-setup.sh - Firewall configuration"
echo "- vm-network-troubleshoot.sh - Network troubleshooting"
echo "- vm-network-performance.sh - Network performance testing"