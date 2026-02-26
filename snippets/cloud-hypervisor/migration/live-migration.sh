#!/bin/bash
# Live Migration Examples
# Demonstrates VM migration between hosts

set -euo pipefail

BINARY="./cloud-hypervisor"
CH_REMOTE="./ch-remote"

# Example 1: Local live migration (same host)
echo "=== Local Live Migration ==="

# Start source VM
echo "Starting source VM..."
$BINARY \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cpus boot=2 \
    --memory size=1G,shared=on \
    --cmdline "root=/dev/vda1 console=ttyS0" \
    --serial tty \
    --console off \
    --api-socket=/tmp/api1 &

SOURCE_PID=$!
sleep 3

# Start destination VM (empty)
echo "Starting destination VM..."
$BINARY --api-socket=/tmp/api2 &
DEST_PID=$!
sleep 2

# Configure destination VM for receiving migration
echo "Configuring destination VM..."
$CH_REMOTE --api-socket=/tmp/api2 receive-migration unix:/tmp/migration.sock

# Send migration from source to destination
echo "Initiating migration..."
$CH_REMOTE --api-socket=/tmp/api1 send-migration unix:/tmp/migration.sock

echo "Local migration completed!"

# Cleanup
kill $SOURCE_PID $DEST_PID 2>/dev/null || true
rm -f /tmp/api1 /tmp/api2 /tmp/migration.sock

# Example 2: TCP-based migration between hosts
echo "=== TCP Live Migration ==="

DEST_HOST="192.168.1.100"
MIGRATION_PORT="6000"

# On source host
echo "Starting source VM for TCP migration..."
$BINARY \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cpus boot=2 \
    --memory size=1G,shared=on \
    --cmdline "root=/dev/vda1 console=ttyS0" \
    --api-socket=/tmp/tcp-source &

SOURCE_PID=$!
sleep 3

# Simulate destination host preparation (normally run on destination)
echo "# On destination host ($DEST_HOST), run:"
echo "$BINARY --api-socket=/tmp/api"
echo "$CH_REMOTE --api-socket=/tmp/api receive-migration tcp:0.0.0.0:$MIGRATION_PORT"

# Send migration to destination host
echo "Initiating TCP migration to $DEST_HOST:$MIGRATION_PORT..."
echo "$CH_REMOTE --api-socket=/tmp/tcp-source send-migration tcp:$DEST_HOST:$MIGRATION_PORT"

# Cleanup source
kill $SOURCE_PID 2>/dev/null || true
rm -f /tmp/tcp-source

# Example 3: Migration with snapshot
echo "=== Migration with Snapshot ==="

# Start VM
echo "Starting VM for snapshot migration..."
$BINARY \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cpus boot=2 \
    --memory size=1G \
    --cmdline "root=/dev/vda1 console=hvc0" \
    --api-socket=/tmp/snapshot-source &

SNAP_PID=$!
sleep 3

# Pause VM
echo "Pausing VM..."
$CH_REMOTE --api-socket=/tmp/snapshot-source pause

# Create snapshot
echo "Creating snapshot..."
SNAPSHOT_CONFIG='{
    "destination_url": "file:///tmp/vm-snapshot"
}'
curl --unix-socket /tmp/snapshot-source -X PUT \
     'http://localhost/api/v1/vm.snapshot' \
     -H 'Content-Type: application/json' \
     -d "$SNAPSHOT_CONFIG"

# Resume original VM
echo "Resuming original VM..."
$CH_REMOTE --api-socket=/tmp/snapshot-source resume

# Start new VM from snapshot
echo "Starting VM from snapshot..."
$BINARY --api-socket=/tmp/snapshot-dest &
DEST_SNAP_PID=$!
sleep 2

# Restore from snapshot
echo "Restoring from snapshot..."
RESTORE_CONFIG='{
    "source_url": "file:///tmp/vm-snapshot"
}'
curl --unix-socket /tmp/snapshot-dest -X PUT \
     'http://localhost/api/v1/vm.restore' \
     -H 'Content-Type: application/json' \
     -d "$RESTORE_CONFIG"

echo "Snapshot migration completed!"

# Cleanup
kill $SNAP_PID $DEST_SNAP_PID 2>/dev/null || true
rm -f /tmp/snapshot-source /tmp/snapshot-dest
rm -rf /tmp/vm-snapshot

# Example 4: Migration with device hotplug
echo "=== Migration with Hot-plugged Devices ==="

# Start VM with hotplug capability
echo "Starting VM with hotplug support..."
$BINARY \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cpus boot=2,max=4 \
    --memory size=1G,hotplug_size=2G,shared=on \
    --cmdline "root=/dev/vda1 console=hvc0" \
    --api-socket=/tmp/hotplug-source &

HOTPLUG_PID=$!
sleep 3

# Add additional CPU
echo "Adding CPU..."
$CH_REMOTE --api-socket=/tmp/hotplug-source resize --cpus 4

# Add additional memory
echo "Adding memory..."
$CH_REMOTE --api-socket=/tmp/hotplug-source resize --memory 2G

# Add disk
echo "Adding disk..."
DISK_CONFIG='{
    "path": "/tmp/additional-disk.raw",
    "readonly": false,
    "id": "extra_disk"
}'
curl --unix-socket /tmp/hotplug-source -X PUT \
     'http://localhost/api/v1/vm.add-disk' \
     -H 'Content-Type: application/json' \
     -d "$DISK_CONFIG"

# Now perform migration with hot-plugged devices
echo "Starting destination for hotplug migration..."
$BINARY --api-socket=/tmp/hotplug-dest &
HOTPLUG_DEST_PID=$!
sleep 2

# Configure destination
$CH_REMOTE --api-socket=/tmp/hotplug-dest receive-migration unix:/tmp/hotplug-migration.sock

# Perform migration
$CH_REMOTE --api-socket=/tmp/hotplug-source send-migration unix:/tmp/hotplug-migration.sock

echo "Hotplug migration completed!"

# Cleanup
kill $HOTPLUG_PID $HOTPLUG_DEST_PID 2>/dev/null || true
rm -f /tmp/hotplug-source /tmp/hotplug-dest /tmp/hotplug-migration.sock

# Example 5: Migration verification script
echo "=== Migration Verification Script ==="

cat > /tmp/verify-migration.sh << 'EOF'
#!/bin/bash
# Migration verification script

API_SOCKET="$1"
EXPECTED_CPUS="$2"
EXPECTED_MEMORY="$3"

if [ -z "$API_SOCKET" ] || [ -z "$EXPECTED_CPUS" ] || [ -z "$EXPECTED_MEMORY" ]; then
    echo "Usage: $0 <api_socket> <expected_cpus> <expected_memory_gb>"
    exit 1
fi

echo "Verifying migration to VM at $API_SOCKET..."

# Get VM info
VM_INFO=$(curl --unix-socket "$API_SOCKET" -s 'http://localhost/api/v1/vm.info')

# Extract CPU count
CPU_COUNT=$(echo "$VM_INFO" | jq -r '.config.cpus.boot_vcpus')

# Extract memory size (convert from bytes to GB)
MEMORY_BYTES=$(echo "$VM_INFO" | jq -r '.config.memory.size')
MEMORY_GB=$((MEMORY_BYTES / 1024 / 1024 / 1024))

echo "Current configuration:"
echo "  CPUs: $CPU_COUNT (expected: $EXPECTED_CPUS)"
echo "  Memory: ${MEMORY_GB}GB (expected: ${EXPECTED_MEMORY}GB)"

# Verify configuration
if [ "$CPU_COUNT" -eq "$EXPECTED_CPUS" ] && [ "$MEMORY_GB" -eq "$EXPECTED_MEMORY" ]; then
    echo "✓ Migration verification successful!"
    exit 0
else
    echo "✗ Migration verification failed!"
    exit 1
fi
EOF

chmod +x /tmp/verify-migration.sh

echo "Migration examples completed!"
echo "Verification script created: /tmp/verify-migration.sh"