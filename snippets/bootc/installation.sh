#!/bin/bash
# bootc Installation Examples and Methods

echo "=== bootc Installation Methods ==="

# Direct disk installation from container
echo "=== Direct Disk Installation ==="

# Basic disk installation
echo "Basic installation to disk:"
cat > /tmp/install-to-disk.sh << 'EOF'
#!/bin/bash
# Install bootc image to disk

IMAGE="quay.io/fedora/fedora-bootc:40"
TARGET_DISK="/dev/sda"

# Run installation from the container image
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v /dev:/dev \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-disk "$TARGET_DISK"

echo "Installation completed to $TARGET_DISK"
echo "Reboot to start the new system"
EOF

chmod +x /tmp/install-to-disk.sh
echo "Created disk installation script: /tmp/install-to-disk.sh"

# Installation with custom configuration
echo "Installation with user injection:"
cat > /tmp/install-with-config.sh << 'EOF'
#!/bin/bash
# Install bootc with user configuration

IMAGE="quay.io/fedora/fedora-bootc:40"
TARGET_DISK="/dev/sda"

# Create user configuration
cat > /tmp/user-config.json << 'USEREOF'
{
  "users": {
    "admin": {
      "password": "$6$rounds=4096$...",
      "groups": ["wheel"],
      "ssh-authorized-keys": [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMJ... admin@example.com"
      ]
    }
  }
}
USEREOF

# Install with user configuration
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v /dev:/dev \
    -v /tmp/user-config.json:/tmp/user-config.json \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-disk \
    --config-file /tmp/user-config.json \
    "$TARGET_DISK"

# Cleanup
rm -f /tmp/user-config.json
EOF

chmod +x /tmp/install-with-config.sh
echo "Created installation with config script: /tmp/install-with-config.sh"

# Filesystem installation method
echo "=== Filesystem Installation ==="

echo "Installation to prepared filesystem:"
cat > /tmp/install-to-filesystem.sh << 'EOF'
#!/bin/bash
# Install bootc to prepared filesystem

IMAGE="quay.io/fedora/fedora-bootc:40"
ROOT_PATH="/mnt/target"

# Prepare filesystem (example)
echo "Preparing target filesystem..."
mkdir -p "$ROOT_PATH"

# Mount target filesystem
# Example: mount /dev/sda2 "$ROOT_PATH"

# Install to filesystem
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v "$ROOT_PATH":"$ROOT_PATH" \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-filesystem \
    --root-path "$ROOT_PATH"

echo "Filesystem installation completed"
EOF

chmod +x /tmp/install-to-filesystem.sh
echo "Created filesystem installation script: /tmp/install-to-filesystem.sh"

# Creating bootable disk images
echo "=== Creating Bootable Disk Images ==="

echo "Create raw disk image:"
cat > /tmp/create-disk-image.sh << 'EOF'
#!/bin/bash
# Create bootable disk image using bootc

IMAGE="quay.io/fedora/fedora-bootc:40"
OUTPUT_FILE="/tmp/bootable-disk.raw"

# Create disk image via loopback
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v /tmp:/tmp \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-disk \
    --via-loopback \
    "$OUTPUT_FILE"

echo "Disk image created: $OUTPUT_FILE"
echo "Use with: qemu-system-x86_64 -drive file=$OUTPUT_FILE,format=raw"
EOF

chmod +x /tmp/create-disk-image.sh
echo "Created disk image creation script: /tmp/create-disk-image.sh"

# Generic image creation
echo "Create generic disk image:"
cat > /tmp/create-generic-image.sh << 'EOF'
#!/bin/bash
# Create generic bootable image

IMAGE="quay.io/fedora/fedora-bootc:40"
OUTPUT_FILE="/tmp/generic-image.raw"

# Create generic image (no hardware-specific drivers)
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v /tmp:/tmp \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-disk \
    --generic-image \
    --via-loopback \
    "$OUTPUT_FILE"

echo "Generic image created: $OUTPUT_FILE"
EOF

chmod +x /tmp/create-generic-image.sh
echo "Created generic image script: /tmp/create-generic-image.sh"

# Using bootc-image-builder
echo "=== Using bootc-image-builder ==="

echo "Create various image formats with bootc-image-builder:"
cat > /tmp/bootc-image-builder-examples.sh << 'EOF'
#!/bin/bash
# bootc-image-builder examples

IMAGE="quay.io/fedora/fedora-bootc:40"
OUTPUT_DIR="$(pwd)/output"

mkdir -p "$OUTPUT_DIR"

echo "=== Creating different image formats ==="

# Create ISO installer
echo "Creating ISO installer..."
podman run --rm --privileged \
    -v "$OUTPUT_DIR":/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type iso \
    "$IMAGE"

# Create QCOW2 image for virtualization
echo "Creating QCOW2 image..."
podman run --rm --privileged \
    -v "$OUTPUT_DIR":/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type qcow2 \
    "$IMAGE"

# Create raw disk image
echo "Creating raw disk image..."
podman run --rm --privileged \
    -v "$OUTPUT_DIR":/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type raw \
    "$IMAGE"

# Create VMware VMDK
echo "Creating VMware VMDK..."
podman run --rm --privileged \
    -v "$OUTPUT_DIR":/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type vmdk \
    "$IMAGE"

# Create AWS AMI
echo "Creating AWS AMI..."
podman run --rm --privileged \
    -v "$OUTPUT_DIR":/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type ami \
    "$IMAGE"

echo "Images created in: $OUTPUT_DIR"
EOF

chmod +x /tmp/bootc-image-builder-examples.sh
echo "Created bootc-image-builder examples: /tmp/bootc-image-builder-examples.sh"

# Installation with custom partitioning
echo "=== Custom Partitioning ==="

echo "Installation with custom partition layout:"
cat > /tmp/custom-partitioning.sh << 'EOF'
#!/bin/bash
# Custom partitioning for bootc installation

# Create partition configuration
cat > /tmp/partition-config.toml << 'PARTEOF'
[install.filesystem.root]
type = "xfs"
size = "20GB"

[install.filesystem.var]
path = "/var"
type = "xfs"
size = "10GB"

[install.filesystem.home]
path = "/home"
type = "xfs"
size = "50GB"

[install.filesystem.boot]
path = "/boot"
type = "ext4"
size = "1GB"
PARTEOF

IMAGE="quay.io/fedora/fedora-bootc:40"
TARGET_DISK="/dev/sda"

# Install with custom partitioning
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v /dev:/dev \
    -v /tmp/partition-config.toml:/tmp/partition-config.toml \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-disk \
    --partition-config /tmp/partition-config.toml \
    "$TARGET_DISK"

rm -f /tmp/partition-config.toml
EOF

chmod +x /tmp/custom-partitioning.sh
echo "Created custom partitioning script: /tmp/custom-partitioning.sh"

# Existing system conversion
echo "=== Existing System Conversion ==="

echo "Convert existing Linux system to bootc:"
cat > /tmp/convert-existing-system.sh << 'EOF'
#!/bin/bash
# Convert existing Linux system to bootc

IMAGE="quay.io/fedora/fedora-bootc:40"

echo "WARNING: This will modify your existing system!"
echo "Make sure you have backups before proceeding."
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Install bootc to existing root
podman run --rm --privileged \
    --pid=host \
    -v /var/lib/containers:/var/lib/containers \
    -v /:/target \
    --security-opt label=type:unconfined_t \
    "$IMAGE" \
    bootc install to-existing-root

echo "Conversion completed. Reboot to activate bootc system."
echo "Your data in /home and /var should be preserved."
EOF

chmod +x /tmp/convert-existing-system.sh
echo "Created system conversion script: /tmp/convert-existing-system.sh"

# Virtual machine deployment
echo "=== Virtual Machine Deployment ==="

echo "Deploy bootc image to VM:"
cat > /tmp/vm-deployment.sh << 'EOF'
#!/bin/bash
# Deploy bootc image to virtual machine

IMAGE="quay.io/fedora/fedora-bootc:40"
VM_NAME="bootc-test"
DISK_SIZE="20G"
MEMORY="4G"
CPUS="2"

# Create VM disk image
echo "Creating VM disk image..."
qemu-img create -f qcow2 "/var/lib/libvirt/images/${VM_NAME}.qcow2" "$DISK_SIZE"

# Create bootable disk image
podman run --rm --privileged \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    -v /tmp:/output \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type qcow2 \
    "$IMAGE"

# Copy image to libvirt location
cp /tmp/disk.qcow2 "/var/lib/libvirt/images/${VM_NAME}.qcow2"

# Create VM with virt-install
virt-install \
    --name "$VM_NAME" \
    --memory "$MEMORY" \
    --vcpus "$CPUS" \
    --disk path="/var/lib/libvirt/images/${VM_NAME}.qcow2,format=qcow2" \
    --import \
    --os-variant fedora-unknown \
    --network network=default \
    --graphics spice \
    --console pty,target_type=serial

echo "VM '$VM_NAME' created and started"
echo "Connect with: virsh console $VM_NAME"
EOF

chmod +x /tmp/vm-deployment.sh
echo "Created VM deployment script: /tmp/vm-deployment.sh"

# Cloud deployment examples
echo "=== Cloud Deployment ==="

echo "AWS deployment preparation:"
cat > /tmp/aws-deployment.sh << 'EOF'
#!/bin/bash
# Prepare bootc image for AWS deployment

IMAGE="quay.io/fedora/fedora-bootc:40"
OUTPUT_DIR="$(pwd)/aws-output"

mkdir -p "$OUTPUT_DIR"

# Create AMI-compatible image
podman run --rm --privileged \
    -v "$OUTPUT_DIR":/output \
    -v /var/lib/containers/storage:/var/lib/containers/storage \
    quay.io/centos-bootc/bootc-image-builder:latest \
    --type ami \
    --aws-ami-name "my-bootc-image" \
    --aws-bucket "my-deployment-bucket" \
    --aws-region "us-east-1" \
    "$IMAGE"

echo "AMI image created in: $OUTPUT_DIR"
echo "Upload to AWS and create AMI from the image"
EOF

chmod +x /tmp/aws-deployment.sh
echo "Created AWS deployment script: /tmp/aws-deployment.sh"

# Installation validation and troubleshooting
echo "=== Installation Validation ==="

cat > /tmp/validate-installation.sh << 'EOF'
#!/bin/bash
# Validate bootc installation

echo "=== bootc Installation Validation ==="

# Check bootc status
echo "1. Checking bootc status:"
bootc status || echo "bootc not available or system not bootc-managed"

# Check ostree status
echo "2. Checking ostree deployments:"
ostree admin status 2>/dev/null || echo "ostree not available"

# Check systemd services
echo "3. Checking bootc services:"
systemctl status bootc-fetch-apply-updates.service --no-pager || true
systemctl status bootc-fetch-apply-updates.timer --no-pager || true

# Check filesystem layout
echo "4. Checking filesystem:"
df -h / /boot /var 2>/dev/null

# Check container runtime
echo "5. Checking container runtime:"
podman --version 2>/dev/null || echo "podman not available"

# Check network connectivity
echo "6. Testing registry connectivity:"
curl -s -I https://quay.io >/dev/null && echo "Registry accessible" || echo "Registry not accessible"

# Check system logs
echo "7. Recent system logs:"
journalctl -b --no-pager | tail -10

echo "Validation completed"
EOF

chmod +x /tmp/validate-installation.sh
echo "Created installation validation script: /tmp/validate-installation.sh"

# Installation troubleshooting
cat > /tmp/installation-troubleshooting.sh << 'EOF'
#!/bin/bash
# bootc Installation Troubleshooting

echo "=== bootc Installation Troubleshooting ==="

# Check system requirements
echo "1. System Requirements Check:"
echo "Available disk space:"
df -h /

echo "Memory:"
free -h

echo "Architecture:"
uname -m

# Check container runtime
echo "2. Container Runtime Check:"
if command -v podman >/dev/null; then
    echo "✓ Podman available"
    podman --version
    podman system info | grep -E "(version|store)"
else
    echo "✗ Podman not available"
fi

# Check privileges
echo "3. Privilege Check:"
if [ "$EUID" -eq 0 ]; then
    echo "✓ Running as root"
else
    echo "⚠ Not running as root (may need sudo for installation)"
fi

# Check disk access
echo "4. Disk Access Check:"
ls -la /dev/sd* 2>/dev/null || echo "No /dev/sd* devices found"
ls -la /dev/nvme* 2>/dev/null || echo "No /dev/nvme* devices found"

# Check SELinux status
echo "5. SELinux Status:"
if command -v getenforce >/dev/null; then
    echo "SELinux: $(getenforce)"
else
    echo "SELinux tools not available"
fi

# Check systemd
echo "6. systemd Check:"
systemctl --version | head -1

# Network connectivity
echo "7. Network Connectivity:"
ping -c 1 8.8.8.8 >/dev/null 2>&1 && echo "✓ Internet connectivity" || echo "✗ No internet connectivity"

echo "Troubleshooting check completed"
EOF

chmod +x /tmp/installation-troubleshooting.sh
echo "Created troubleshooting script: /tmp/installation-troubleshooting.sh"

echo "Installation examples completed!"
echo "Scripts created in /tmp/ - review and modify as needed"
echo "Always test installations in a safe environment first!"