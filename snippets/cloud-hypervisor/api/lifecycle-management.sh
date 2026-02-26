#!/bin/bash
# Cloud Hypervisor REST API Lifecycle Management Examples

# Configuration
API_SOCKET="/tmp/cloud-hypervisor.sock"
KERNEL_PATH="/path/to/vmlinux"
DISK_PATH="/path/to/disk.raw"
BASE_URL="http://localhost/api/v1"

# Helper function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -n "$data" ]; then
        curl --unix-socket "$API_SOCKET" -s -i \
             -X "$method" "$BASE_URL$endpoint" \
             -H 'Content-Type: application/json' \
             -H 'Accept: application/json' \
             -d "$data"
    else
        curl --unix-socket "$API_SOCKET" -s -i \
             -X "$method" "$BASE_URL$endpoint" \
             -H 'Accept: application/json'
    fi
}

# Start Cloud Hypervisor daemon with API socket
start_daemon() {
    echo "Starting Cloud Hypervisor daemon..."
    cloud-hypervisor --api-socket "$API_SOCKET" &
    CH_PID=$!
    
    # Wait for API socket to be available
    timeout=30
    while [ $timeout -gt 0 ] && [ ! -S "$API_SOCKET" ]; do
        sleep 1
        ((timeout--))
    done
    
    if [ ! -S "$API_SOCKET" ]; then
        echo "Failed to start Cloud Hypervisor daemon"
        exit 1
    fi
    
    echo "Cloud Hypervisor daemon started (PID: $CH_PID)"
}

# Create VM configuration
create_vm() {
    echo "Creating VM..."
    
    local vm_config='{
        "cpus": {
            "boot_vcpus": 4,
            "max_vcpus": 8,
            "topology": {
                "threads_per_core": 1,
                "cores_per_die": 2,
                "dies_per_package": 2,
                "packages": 1
            },
            "kvm_hyperv": false,
            "max_phys_bits": 46,
            "affinity": [
                {"vcpu": 0, "host_cpus": [0, 1]},
                {"vcpu": 1, "host_cpus": [2, 3]}
            ],
            "features": {
                "amx": false
            }
        },
        "memory": {
            "size": 2147483648,
            "mergeable": false,
            "hotplug_method": "acpi",
            "hotplug_size": 4294967296,
            "shared": true,
            "hugepages": true,
            "hugepage_size": 2097152,
            "prefault": false,
            "thp": true
        },
        "payload": {
            "kernel": "'"$KERNEL_PATH"'",
            "cmdline": "console=hvc0 root=/dev/vda1 rw",
            "initramfs": null
        },
        "disks": [
            {
                "path": "'"$DISK_PATH"'",
                "readonly": false,
                "direct": true,
                "iommu": false,
                "num_queues": 1,
                "queue_size": 128,
                "vhost_user": false,
                "vhost_socket": null,
                "rate_limit": null
            }
        ],
        "net": [
            {
                "tap": null,
                "ip": "192.168.10.10",
                "mask": "255.255.255.0",
                "mac": "52:54:00:02:d9:01",
                "host_mac": null,
                "mtu": null,
                "iommu": false,
                "num_queues": 2,
                "queue_size": 256,
                "vhost_user": false,
                "vhost_socket": null,
                "vhost_mode": "client",
                "id": "net0",
                "pci_segment": 0
            }
        ],
        "rng": {
            "src": "/dev/urandom",
            "iommu": false
        },
        "balloon": {
            "size": 0,
            "deflate_on_oom": false,
            "free_page_reporting": false
        },
        "fs": [],
        "pmem": [],
        "serial": {
            "file": null,
            "mode": "null",
            "iommu": false
        },
        "console": {
            "file": null,
            "mode": "pty",
            "iommu": false
        },
        "devices": [],
        "user_devices": [],
        "vdpa": [],
        "vsock": null,
        "numa": [],
        "iommu": false,
        "watchdog": false,
        "platform": null
    }'
    
    api_call "PUT" "/vm.create" "$vm_config"
}

# Boot VM
boot_vm() {
    echo "Booting VM..."
    api_call "PUT" "/vm.boot"
}

# Get VM information
get_vm_info() {
    echo "Getting VM information..."
    api_call "GET" "/vm.info"
}

# Pause VM
pause_vm() {
    echo "Pausing VM..."
    api_call "PUT" "/vm.pause"
}

# Resume VM
resume_vm() {
    echo "Resuming VM..."
    api_call "PUT" "/vm.resume"
}

# Reboot VM
reboot_vm() {
    echo "Rebooting VM..."
    api_call "PUT" "/vm.reboot"
}

# Shutdown VM
shutdown_vm() {
    echo "Shutting down VM..."
    api_call "PUT" "/vm.shutdown"
}

# Delete VM
delete_vm() {
    echo "Deleting VM..."
    api_call "PUT" "/vm.delete"
}

# Resize VM CPUs
resize_cpus() {
    local desired_vcpus="$1"
    echo "Resizing VM to $desired_vcpus vCPUs..."
    
    local resize_config='{
        "desired_vcpus": '"$desired_vcpus"'
    }'
    
    api_call "PUT" "/vm.resize" "$resize_config"
}

# Resize VM memory
resize_memory() {
    local desired_ram="$1"
    echo "Resizing VM memory to $desired_ram bytes..."
    
    local resize_config='{
        "desired_ram": '"$desired_ram"'
    }'
    
    api_call "PUT" "/vm.resize" "$resize_config"
}

# Add disk to VM
add_disk() {
    local disk_path="$1"
    echo "Adding disk: $disk_path"
    
    local disk_config='{
        "path": "'"$disk_path"'",
        "readonly": false,
        "direct": true,
        "iommu": false,
        "num_queues": 1,
        "queue_size": 128,
        "id": "disk_new"
    }'
    
    api_call "PUT" "/vm.add-disk" "$disk_config"
}

# Add network interface to VM
add_net() {
    local ip="$1"
    local mac="$2"
    echo "Adding network interface: IP=$ip, MAC=$mac"
    
    local net_config='{
        "ip": "'"$ip"'",
        "mask": "255.255.255.0",
        "mac": "'"$mac"'",
        "num_queues": 2,
        "queue_size": 256,
        "id": "net_new"
    }'
    
    api_call "PUT" "/vm.add-net" "$net_config"
}

# Remove device from VM
remove_device() {
    local device_id="$1"
    echo "Removing device: $device_id"
    
    local remove_config='{
        "id": "'"$device_id"'"
    }'
    
    api_call "PUT" "/vm.remove-device" "$remove_config"
}

# Take VM snapshot
take_snapshot() {
    local snapshot_url="$1"
    echo "Taking snapshot: $snapshot_url"
    
    local snapshot_config='{
        "destination_url": "'"$snapshot_url"'"
    }'
    
    api_call "PUT" "/vm.snapshot" "$snapshot_config"
}

# Restore VM from snapshot
restore_snapshot() {
    local snapshot_url="$1"
    echo "Restoring from snapshot: $snapshot_url"
    
    local restore_config='{
        "source_url": "'"$snapshot_url"'"
    }'
    
    api_call "PUT" "/vm.restore" "$restore_config"
}

# Send migration (source side)
send_migration() {
    local destination_url="$1"
    echo "Sending migration to: $destination_url"
    
    local migration_config='{
        "destination_url": "'"$destination_url"'"
    }'
    
    api_call "PUT" "/vm.send-migration" "$migration_config"
}

# Receive migration (destination side)
receive_migration() {
    local source_url="$1"
    echo "Receiving migration from: $source_url"
    
    local migration_config='{
        "receiver_url": "'"$source_url"'"
    }'
    
    api_call "PUT" "/vm.receive-migration" "$migration_config"
}

# Get VM counters/metrics
get_counters() {
    echo "Getting VM counters..."
    api_call "GET" "/vm.counters"
}

# Monitor VM state changes
monitor_vm() {
    echo "Monitoring VM state..."
    while true; do
        echo "=== $(date) ==="
        get_vm_info | grep -E "(state|config)"
        echo ""
        sleep 5
    done
}

# Complete VM lifecycle demo
demo_lifecycle() {
    echo "Starting complete VM lifecycle demo..."
    
    start_daemon
    sleep 2
    
    echo "Step 1: Create VM"
    create_vm
    sleep 1
    
    echo "Step 2: Boot VM"
    boot_vm
    sleep 3
    
    echo "Step 3: Get VM info"
    get_vm_info
    sleep 1
    
    echo "Step 4: Resize CPUs to 6"
    resize_cpus 6
    sleep 1
    
    echo "Step 5: Resize memory to 3GB"
    resize_memory 3221225472
    sleep 1
    
    echo "Step 6: Pause VM"
    pause_vm
    sleep 1
    
    echo "Step 7: Take snapshot"
    take_snapshot "file:///tmp/vm-snapshot"
    sleep 2
    
    echo "Step 8: Resume VM"
    resume_vm
    sleep 1
    
    echo "Step 9: Shutdown VM"
    shutdown_vm
    sleep 2
    
    echo "Step 10: Delete VM"
    delete_vm
    
    echo "Demo complete!"
    
    # Clean up
    kill $CH_PID 2>/dev/null
    rm -f "$API_SOCKET"
}

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    if [ -n "$CH_PID" ]; then
        kill $CH_PID 2>/dev/null
    fi
    rm -f "$API_SOCKET"
}

# Set trap for cleanup
trap cleanup EXIT

# Main function
main() {
    case "${1:-demo}" in
        "start")
            start_daemon
            ;;
        "create")
            create_vm
            ;;
        "boot")
            boot_vm
            ;;
        "info")
            get_vm_info
            ;;
        "pause")
            pause_vm
            ;;
        "resume")
            resume_vm
            ;;
        "reboot")
            reboot_vm
            ;;
        "shutdown")
            shutdown_vm
            ;;
        "delete")
            delete_vm
            ;;
        "resize-cpu")
            resize_cpus "${2:-4}"
            ;;
        "resize-mem")
            resize_memory "${2:-2147483648}"
            ;;
        "snapshot")
            take_snapshot "${2:-file:///tmp/vm-snapshot}"
            ;;
        "restore")
            restore_snapshot "${2:-file:///tmp/vm-snapshot}"
            ;;
        "monitor")
            monitor_vm
            ;;
        "demo")
            demo_lifecycle
            ;;
        *)
            echo "Usage: $0 [command] [options]"
            echo "Commands:"
            echo "  start              - Start Cloud Hypervisor daemon"
            echo "  create             - Create VM"
            echo "  boot               - Boot VM"
            echo "  info               - Get VM information"
            echo "  pause              - Pause VM"
            echo "  resume             - Resume VM"
            echo "  reboot             - Reboot VM"
            echo "  shutdown           - Shutdown VM"
            echo "  delete             - Delete VM"
            echo "  resize-cpu [num]   - Resize CPU count"
            echo "  resize-mem [bytes] - Resize memory"
            echo "  snapshot [url]     - Take snapshot"
            echo "  restore [url]      - Restore from snapshot"
            echo "  monitor            - Monitor VM state"
            echo "  demo               - Run complete lifecycle demo"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi