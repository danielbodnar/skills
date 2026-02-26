#!/bin/bash
# Basic VM Creation with Cloud Hypervisor
# This script demonstrates the simplest way to create and boot a VM

set -euo pipefail

# Configuration
KERNEL_PATH="./vmlinux"
DISK_IMAGE="ubuntu-server.raw"
MEMORY_SIZE="1024M"
CPU_COUNT=2
API_SOCKET="/tmp/cloud-hypervisor.sock"

# Ensure Cloud Hypervisor has proper capabilities
if ! getcap ./cloud-hypervisor | grep -q cap_net_admin; then
    echo "Setting NET_ADMIN capabilities for Cloud Hypervisor..."
    sudo setcap cap_net_admin+ep ./cloud-hypervisor
fi

# Create basic VM configuration
echo "Starting Cloud Hypervisor VM..."
./cloud-hypervisor \
    --kernel "${KERNEL_PATH}" \
    --disk path="${DISK_IMAGE}" \
    --cpus boot="${CPU_COUNT}" \
    --memory size="${MEMORY_SIZE}" \
    --net "tap=,mac=,ip=,mask=" \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket "${API_SOCKET}" \
    --serial tty \
    --console off

echo "VM started successfully. API socket: ${API_SOCKET}"