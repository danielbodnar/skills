#!/bin/bash
# systemd-vmspawn Security Configuration Examples

# Secure Boot configuration
echo "=== Secure Boot VM ==="
systemd-vmspawn \
    --image=secure-vm.raw \
    --secure-boot=yes \
    --machine=secure-vm

# VM with TPM enabled (systemd 256+)
echo "=== VM with TPM support ==="
systemd-vmspawn \
    --image=tpm-vm.raw \
    --tpm=yes \
    --secure-boot=yes \
    --machine=tpm-enabled-vm

# User namespace mapping for unprivileged operation
echo "=== VM with user namespace mapping ==="
# First, check user's subordinate user/group IDs
echo "User subordinate UIDs/GIDs:"
grep "$(whoami)" /etc/subuid /etc/subgid

# Get the starting UID for user namespace mapping
SUBUID_START=$(grep "$(whoami)" /etc/subuid | cut -d: -f2)

systemd-vmspawn \
    --directory=/var/lib/machines/unprivileged-rootfs \
    --private-users="$SUBUID_START" \
    --machine=unprivileged-vm

# VM with SSH key management
echo "=== VM with SSH key security ==="
systemd-vmspawn \
    --image=ssh-vm.raw \
    --pass-ssh-key=yes \
    --ssh-key-type=ed25519 \
    --machine=ssh-secure-vm

# Inspect generated SSH keys
echo "Generated SSH keys location:"
echo "/run/user/$UID/systemd/vmspawn/"

# VM with disabled SSH key generation (more secure for production)
echo "=== VM without SSH key generation ==="
systemd-vmspawn \
    --image=production-vm.raw \
    --pass-ssh-key=no \
    --machine=production-secure-vm

# VM with credential passing
echo "=== VM with secure credential passing ==="
# Create credential file
echo "sensitive-data-here" > /tmp/vm-secret
chmod 600 /tmp/vm-secret

systemd-vmspawn \
    --image=app-vm.raw \
    --set-credential=database-password:/tmp/vm-secret \
    --machine=credential-vm

# VM with read-only bind mounts for security
echo "=== VM with read-only mounts ==="
systemd-vmspawn \
    --image=readonly-vm.raw \
    --bind-ro=/etc/ssl/certs:/etc/ssl/certs \
    --bind-ro=/usr/share/ca-certificates:/usr/share/ca-certificates \
    --machine=readonly-mounts-vm

# Isolated VM with no networking
echo "=== Fully isolated VM ==="
systemd-vmspawn \
    --image=isolated-vm.raw \
    --machine=isolated-vm
# Note: No network flags = completely isolated

# VM with VSock-only networking (more secure than TAP)
echo "=== VM with VSock-only networking ==="
systemd-vmspawn \
    --image=vsock-only-vm.raw \
    --vsock=yes,1000 \
    --machine=vsock-only-vm

# Security audit script for VM configuration
echo "=== Security audit script ==="
cat > /tmp/vm-security-audit.sh << 'EOF'
#!/bin/bash
# VM Security Audit Script

VM_NAME="$1"
if [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <vm-name>"
    exit 1
fi

echo "=== Security Audit for VM: $VM_NAME ==="

# Check if VM is registered
if machinectl show "$VM_NAME" >/dev/null 2>&1; then
    echo "✓ VM is registered with machined"
    
    # Get VM information
    machinectl show "$VM_NAME" | grep -E "(State|Service|RootDirectory)"
else
    echo "✗ VM is not registered with machined"
    exit 1
fi

# Check for SSH keys
SSH_KEY_DIR="/run/user/$UID/systemd/vmspawn"
if ls $SSH_KEY_DIR/machine-*-${VM_NAME}-* 2>/dev/null; then
    echo "⚠ SSH keys found for VM:"
    ls -la $SSH_KEY_DIR/machine-*-${VM_NAME}-*
    echo "⚠ Consider rotating keys regularly"
else
    echo "✓ No SSH keys found (good for production)"
fi

# Check VM processes and their privileges
echo "VM processes:"
ps aux | grep -E "(qemu.*$VM_NAME|systemd-vmspawn.*$VM_NAME)" | grep -v grep

# Check network configuration
echo "Network interfaces for VM:"
ip link show | grep -i vmspawn | grep -i "$VM_NAME" || echo "No dedicated network interfaces found"

# Check VSock connections
echo "VSock connections:"
ss -l | grep vsock || echo "No VSock listeners found"

# Check systemd service configuration if running as service
SERVICE_FILE="/etc/systemd/system/systemd-vmspawn@${VM_NAME}.service"
if [ -f "$SERVICE_FILE" ]; then
    echo "Service configuration found:"
    grep -E "(ExecStart|User|Group|PrivateUsers|ReadOnly)" "$SERVICE_FILE"
fi

echo "=== Security audit completed ==="
EOF

chmod +x /tmp/vm-security-audit.sh

# Secure VM creation script
echo "=== Secure VM creation script ==="
cat > /tmp/create-secure-vm.sh << 'EOF'
#!/bin/bash
# Create Secure VM Script

VM_NAME="$1"
VM_IMAGE="$2"

if [ -z "$VM_NAME" ] || [ -z "$VM_IMAGE" ]; then
    echo "Usage: $0 <vm-name> <vm-image>"
    echo "Example: $0 secure-app /var/lib/machines/app.raw"
    exit 1
fi

echo "Creating secure VM: $VM_NAME"

# Check if image exists
if [ ! -f "$VM_IMAGE" ]; then
    echo "Error: VM image $VM_IMAGE not found"
    exit 1
fi

# Check user namespace support
if ! grep -q "$(whoami)" /etc/subuid; then
    echo "Warning: User namespaces not configured for $(whoami)"
    echo "Consider adding user to /etc/subuid and /etc/subgid"
fi

# Get subordinate UID for user namespace mapping
SUBUID_START=$(grep "$(whoami)" /etc/subuid | cut -d: -f2)

# Create secure VM with best practices
systemd-vmspawn \
    --image="$VM_IMAGE" \
    --machine="$VM_NAME" \
    --secure-boot=yes \
    --tpm=yes \
    --vsock=yes \
    --pass-ssh-key=no \
    --private-users="${SUBUID_START:-}" \
    --console=read-only \
    --register=yes

echo "Secure VM $VM_NAME created and started"
echo "Access via: machinectl shell $VM_NAME"
EOF

chmod +x /tmp/create-secure-vm.sh

# Security hardening checklist
echo "=== Security hardening checklist ==="
cat > /tmp/vm-security-checklist.md << 'EOF'
# systemd-vmspawn Security Checklist

## VM Image Security
- [ ] Use trusted base images
- [ ] Regularly update VM images
- [ ] Minimize installed packages
- [ ] Remove unnecessary services
- [ ] Configure proper firewall rules

## Access Control
- [ ] Disable SSH key generation for production VMs
- [ ] Use VSock instead of TAP networking when possible
- [ ] Implement proper authentication mechanisms
- [ ] Use user namespace mapping when possible
- [ ] Restrict console access (read-only mode)

## Network Security
- [ ] Use isolated networking when possible
- [ ] Implement network segmentation
- [ ] Configure proper firewall rules
- [ ] Monitor network traffic
- [ ] Use encrypted communications

## Resource Isolation
- [ ] Set appropriate CPU/memory limits
- [ ] Use read-only bind mounts
- [ ] Implement proper user namespace mapping
- [ ] Monitor resource usage
- [ ] Set up resource alerting

## Monitoring and Logging
- [ ] Enable journal forwarding
- [ ] Set up log monitoring
- [ ] Implement security event logging
- [ ] Regular security audits
- [ ] Monitor VM lifecycle events

## Credential Management
- [ ] Use secure credential passing
- [ ] Rotate credentials regularly
- [ ] Avoid hardcoded secrets
- [ ] Use proper secret management
- [ ] Audit credential access

## System Integration
- [ ] Register VMs with machined
- [ ] Use systemd services for management
- [ ] Implement health checks
- [ ] Set up proper backup procedures
- [ ] Document VM configurations
EOF

# Permission checker script
echo "=== Permission checker script ==="
cat > /tmp/check-vm-permissions.sh << 'EOF'
#!/bin/bash
# Check VM Permissions Script

echo "=== systemd-vmspawn Permission Check ==="

# Check user groups
echo "Current user groups:"
groups

# Check KVM access
if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then
    echo "✓ KVM access: OK"
else
    echo "✗ KVM access: FAILED"
    echo "  Add user to 'kvm' group: sudo usermod -a -G kvm \$(whoami)"
fi

# Check systemd version
SYSTEMD_VERSION=$(systemctl --version | head -1 | cut -d' ' -f2)
echo "systemd version: $SYSTEMD_VERSION"

if [ "$SYSTEMD_VERSION" -ge 255 ]; then
    echo "✓ systemd-vmspawn supported"
else
    echo "✗ systemd-vmspawn requires systemd 255+"
fi

# Check user namespace support
if [ -f /etc/subuid ] && grep -q "$(whoami)" /etc/subuid; then
    echo "✓ User namespace mapping available"
    echo "  UID range: $(grep "$(whoami)" /etc/subuid)"
else
    echo "⚠ User namespace mapping not configured"
    echo "  Consider configuring /etc/subuid and /etc/subgid"
fi

# Check VSock support
if lsmod | grep -q vsock; then
    echo "✓ VSock support loaded"
else
    echo "⚠ VSock support not loaded"
    echo "  Load with: sudo modprobe vsock"
fi

# Check systemd-networkd
if systemctl is-active --quiet systemd-networkd; then
    echo "✓ systemd-networkd is active (required for TAP networking)"
else
    echo "⚠ systemd-networkd not active (TAP networking unavailable)"
fi

echo "=== Permission check completed ==="
EOF

chmod +x /tmp/check-vm-permissions.sh

echo "Security configuration examples completed!"
echo "Run permission check: /tmp/check-vm-permissions.sh"
echo "Run security audit: /tmp/vm-security-audit.sh <vm-name>"
echo "Create secure VM: /tmp/create-secure-vm.sh <name> <image>"