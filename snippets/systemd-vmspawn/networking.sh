#!/bin/bash
# systemd-vmspawn Networking Configuration Examples

# Basic user-mode networking (no root required)
echo "=== User-mode networking ==="
systemd-vmspawn \
    --image=vm.raw \
    --network-user-mode \
    --machine=usermode-network-vm

# TAP networking (requires root privileges)
echo "=== TAP networking (requires root) ==="
sudo systemd-vmspawn \
    --image=vm.raw \
    --network-tap \
    --machine=tap-network-vm

# VSock networking with automatic CID
echo "=== VSock networking ==="
systemd-vmspawn \
    --image=vm.raw \
    --vsock=yes \
    --machine=vsock-vm

# VSock networking with specific CID
echo "=== VSock with specific CID ==="
systemd-vmspawn \
    --image=vm.raw \
    --vsock=yes,42 \
    --machine=vsock-cid-42

# Multiple networking modes example
echo "=== Multiple networking configuration ==="
systemd-vmspawn \
    --image=vm.raw \
    --network-user-mode \
    --vsock=yes,100 \
    --machine=multi-network-vm

# SSH access via VSock example
echo "=== SSH via VSock setup ==="
# Start VM with VSock and SSH key generation
systemd-vmspawn \
    --image=vm.raw \
    --vsock=yes,200 \
    --pass-ssh-key=yes \
    --ssh-key-type=ed25519 \
    --machine=ssh-vsock-vm &

# Wait for VM to boot (in practice, check VM status)
sleep 30

# SSH into the VM via VSock
# ssh root@vsock/200 -i /run/user/$UID/systemd/vmspawn/machine-*-ssh-vsock-vm-ed25519

# Network configuration with systemd-networkd integration
echo "=== systemd-networkd TAP setup ==="
cat > /tmp/vmspawn-tap.network << 'EOF'
[Match]
Name=vmspawn-*

[Network]
DHCP=yes
IPForward=yes
IPMasquerade=yes
EOF

# Copy network config (requires root)
# sudo cp /tmp/vmspawn-tap.network /etc/systemd/network/
# sudo systemctl reload systemd-networkd

# VM with TAP and custom network config
sudo systemd-vmspawn \
    --image=vm.raw \
    --network-tap \
    --machine=custom-network-vm

# Advanced VSock example with journal forwarding
echo "=== VSock with journal forwarding ==="
systemd-vmspawn \
    --image=vm.raw \
    --vsock=yes,300 \
    --forward-journal=/var/log/vm-journal.log \
    --pass-ssh-key=yes \
    --machine=journal-forward-vm

# Network isolation example
echo "=== Isolated VM (no networking) ==="
systemd-vmspawn \
    --image=vm.raw \
    --machine=isolated-vm
# Note: No network flags = no networking

# Development environment with port forwarding concept
echo "=== Development VM with service access ==="
# Start VM with user-mode networking
systemd-vmspawn \
    --image=dev-vm.raw \
    --network-user-mode \
    --machine=dev-environment &

# In practice, you would configure port forwarding via QEMU options
# using SYSTEMD_VMSPAWN_QEMU_EXTRA environment variable
export SYSTEMD_VMSPAWN_QEMU_EXTRA="-netdev user,id=net0,hostfwd=tcp::8080-:80"

# Multi-VM networking setup
echo "=== Multi-VM network setup ==="
# VM 1 with specific VSock CID
systemd-vmspawn \
    --image=vm1.raw \
    --vsock=yes,101 \
    --network-user-mode \
    --machine=vm1 &

# VM 2 with different VSock CID
systemd-vmspawn \
    --image=vm2.raw \
    --vsock=yes,102 \
    --network-user-mode \
    --machine=vm2 &

# Bridge networking setup (advanced)
echo "=== Bridge networking preparation ==="
cat > /tmp/vm-bridge-setup.sh << 'EOF'
#!/bin/bash
# Create bridge interface
sudo ip link add name br-vmspawn type bridge
sudo ip link set dev br-vmspawn up
sudo ip addr add 192.168.100.1/24 dev br-vmspawn

# Enable IP forwarding
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# Configure iptables for NAT
sudo iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -j MASQUERADE
sudo iptables -A FORWARD -i br-vmspawn -j ACCEPT
sudo iptables -A FORWARD -o br-vmspawn -j ACCEPT
EOF

chmod +x /tmp/vm-bridge-setup.sh

# Network troubleshooting commands
echo "=== Network troubleshooting ==="
cat > /tmp/network-debug.sh << 'EOF'
#!/bin/bash
# Check VSock support
echo "VSock support:"
lsmod | grep vsock

# Check KVM permissions
echo "KVM permissions:"
ls -la /dev/kvm

# Check systemd-networkd status
echo "systemd-networkd status:"
systemctl status systemd-networkd

# List VM network interfaces
echo "VM network interfaces:"
ip link show | grep vmspawn

# Check running VMs
echo "Running VMs:"
machinectl list
EOF

chmod +x /tmp/network-debug.sh

echo "Networking examples completed!"
echo "Run with: bash $HOME/.claude/snippets/systemd-vmspawn/networking.sh"