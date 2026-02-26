#!/bin/bash
# Cloud Hypervisor REST API Examples
# Comprehensive REST API usage patterns

set -euo pipefail

API_SOCKET="/tmp/cloud-hypervisor.sock"
BASE_URL="http://localhost"

# Function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    
    if [ -n "$data" ]; then
        curl --unix-socket "$API_SOCKET" -s -X "$method" \
             "$BASE_URL$endpoint" \
             -H 'Accept: application/json' \
             -H 'Content-Type: application/json' \
             -d "$data"
    else
        curl --unix-socket "$API_SOCKET" -s -X "$method" \
             "$BASE_URL$endpoint" \
             -H 'Accept: application/json'
    fi
}

# Start Cloud Hypervisor daemon
echo "Starting Cloud Hypervisor daemon..."
./cloud-hypervisor --api-socket "$API_SOCKET" &
CH_PID=$!

# Wait for API to be available
sleep 2

# Test VMM ping
echo "Testing VMM ping..."
api_call GET "/api/v1/vmm.ping"

# Create VM with comprehensive configuration
echo "Creating VM..."
VM_CONFIG='{
    "cpus": {
        "boot_vcpus": 4, 
        "max_vcpus": 8,
        "topology": {
            "threads_per_core": 1,
            "cores_per_die": 2,
            "dies_per_package": 2,
            "packages": 1
        },
        "affinity": [
            {"vcpu": 0, "host_cpus": [0, 1]},
            {"vcpu": 1, "host_cpus": [2, 3]}
        ]
    },
    "memory": {
        "size": 1073741824,
        "hotplug_size": 2147483648,
        "hugepages": true,
        "shared": true
    },
    "payload": {
        "kernel": "/opt/kernel/vmlinux",
        "cmdline": "console=hvc0 root=/dev/vda1 rw"
    },
    "disks": [
        {
            "path": "/opt/images/ubuntu.raw",
            "readonly": false,
            "iommu": false
        }
    ],
    "net": [
        {
            "ip": "192.168.10.10",
            "mask": "255.255.255.0",
            "mac": "12:34:56:78:90:01",
            "num_queues": 4
        }
    ],
    "rng": {
        "src": "/dev/urandom"
    },
    "balloon": {
        "size": 536870912,
        "deflate_on_oom": true,
        "free_page_reporting": true
    }
}'

api_call PUT "/api/v1/vm.create" "$VM_CONFIG"

# Boot the VM
echo "Booting VM..."
api_call PUT "/api/v1/vm.boot"

# Get VM information
echo "Getting VM info..."
api_call GET "/api/v1/vm.info"

# Resize CPUs (hotplug)
echo "Adding CPUs..."
RESIZE_CONFIG='{"desired_vcpus": 6}'
api_call PUT "/api/v1/vm.resize" "$RESIZE_CONFIG"

# Resize memory (hotplug)
echo "Adding memory..."
MEMORY_CONFIG='{"desired_ram": 2147483648}'
api_call PUT "/api/v1/vm.resize" "$MEMORY_CONFIG"

# Add disk (hotplug)
echo "Adding disk..."
DISK_CONFIG='{
    "path": "/opt/images/data-disk.raw",
    "readonly": false,
    "id": "data_disk"
}'
api_call PUT "/api/v1/vm.add-disk" "$DISK_CONFIG"

# Add network interface (hotplug)
echo "Adding network interface..."
NET_CONFIG='{
    "ip": "192.168.11.10",
    "mask": "255.255.255.0",
    "mac": "12:34:56:78:90:02",
    "id": "net1"
}'
api_call PUT "/api/v1/vm.add-net" "$NET_CONFIG"

# Pause VM
echo "Pausing VM..."
api_call PUT "/api/v1/vm.pause"

# Create snapshot
echo "Creating snapshot..."
SNAPSHOT_CONFIG='{
    "destination_url": "file:///tmp/vm-snapshot"
}'
api_call PUT "/api/v1/vm.snapshot" "$SNAPSHOT_CONFIG"

# Resume VM
echo "Resuming VM..."
api_call PUT "/api/v1/vm.resume"

# Remove disk
echo "Removing disk..."
api_call PUT "/api/v1/vm.remove-device" '{"id": "data_disk"}'

# Get counters
echo "Getting VM counters..."
api_call GET "/api/v1/vm.counters"

# Shutdown VM gracefully
echo "Shutting down VM..."
api_call PUT "/api/v1/vm.shutdown"

# Clean up
kill $CH_PID 2>/dev/null || true
rm -f "$API_SOCKET"

echo "API examples completed successfully!"