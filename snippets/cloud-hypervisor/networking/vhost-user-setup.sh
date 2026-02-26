#!/bin/bash
# Cloud Hypervisor vhost-user Networking Setup Examples

# Configuration
BINARY="./cloud-hypervisor"
API_SOCKET="/tmp/ch-net.sock"

# Setup vhost-user backend with DPDK
setup_dpdk_vhost_user() {
    echo "Setting up DPDK vhost-user backend..."
    
    # Install DPDK if not available
    if ! command -v dpdk-testpmd &> /dev/null; then
        echo "Installing DPDK..."
        sudo apt update
        sudo apt install -y dpdk dpdk-dev
    fi
    
    # Setup hugepages for DPDK
    echo "Configuring hugepages..."
    echo 1024 | sudo tee /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages
    sudo mkdir -p /mnt/huge
    sudo mount -t hugetlbfs hugetlbfs /mnt/huge
    
    # Configure DPDK environment
    export RTE_SDK=/usr/share/dpdk
    export RTE_TARGET=x86_64-default-linuxapp-gcc
    
    # Start testpmd with vhost-user
    sudo dpdk-testpmd \
        --vdev 'net_vhost0,iface=/tmp/vhost-user1,queues=4' \
        --vdev 'net_vhost1,iface=/tmp/vhost-user2,queues=4' \
        -- --nb-cores=2 --rxq=4 --txq=4 --forward-mode=io &
    
    TESTPMD_PID=$!
    echo "DPDK testpmd started with PID: $TESTPMD_PID"
    sleep 3
}

# Launch VM with vhost-user networking (client mode)
launch_vm_vhost_user_client() {
    local guest_image="${1:-/path/to/focal-server-cloudimg-amd64.raw}"
    local kernel_path="${2:-/path/to/vmlinux}"
    
    echo "Launching VM with vhost-user networking (client mode)..."
    
    $BINARY \
        --cpus boot=2 \
        --memory size=512M,hugepages=on,shared=true \
        --kernel "$kernel_path" \
        --cmdline "console=ttyS0 console=hvc0 root=/dev/vda1 rw" \
        --disk path="$guest_image" \
        --net mac=52:54:00:02:d9:01,vhost_user=true,socket=/tmp/vhost-user1,num_queues=4,vhost_mode=client \
        --api-socket "$API_SOCKET" &
    
    VM_PID=$!
    echo "VM started with PID: $VM_PID (client mode)"
}

# Launch VM with vhost-user networking (server mode)
launch_vm_vhost_user_server() {
    local guest_image="${1:-/path/to/focal-server-cloudimg-amd64.raw}"
    local kernel_path="${2:-/path/to/vmlinux}"
    
    echo "Launching VM with vhost-user networking (server mode)..."
    
    $BINARY \
        --cpus boot=2 \
        --memory size=512M,hugepages=on,shared=true \
        --kernel "$kernel_path" \
        --cmdline "console=ttyS0 console=hvc0 root=/dev/vda1 rw" \
        --disk path="$guest_image" \
        --net mac=52:54:20:11:C5:02,vhost_user=true,socket=/tmp/vhost-user2,num_queues=4,vhost_mode=server \
        --api-socket "$API_SOCKET" &
    
    VM_PID=$!
    echo "VM started with PID: $VM_PID (server mode)"
}

# Setup TAP interface networking
setup_tap_networking() {
    echo "Setting up TAP interface networking..."
    
    # Create TAP interface
    sudo ip tuntap add tap0 mode tap
    sudo ip link set tap0 up
    sudo ip addr add 192.168.100.1/24 dev tap0
    
    # Enable IP forwarding
    echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
    
    # Configure iptables for NAT
    sudo iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -j MASQUERADE
    sudo iptables -A FORWARD -i tap0 -j ACCEPT
    sudo iptables -A FORWARD -o tap0 -j ACCEPT
    
    echo "TAP interface tap0 configured with IP 192.168.100.1/24"
}

# Launch VM with TAP networking
launch_vm_tap() {
    local guest_image="${1:-/path/to/focal-server-cloudimg-amd64.raw}"
    local kernel_path="${2:-/path/to/vmlinux}"
    
    echo "Launching VM with TAP networking..."
    
    $BINARY \
        --cpus boot=2 \
        --memory size=1G \
        --kernel "$kernel_path" \
        --cmdline "console=hvc0 root=/dev/vda1 rw" \
        --disk path="$guest_image" \
        --net tap=tap0,mac=52:54:00:12:34:56,ip=192.168.100.10,mask=255.255.255.0 \
        --api-socket "$API_SOCKET" &
    
    VM_PID=$!
    echo "VM started with PID: $VM_PID (TAP mode)"
}

# Setup MACVTAP interface
setup_macvtap() {
    local host_interface="${1:-eth0}"
    local mac_address="${2:-c2:67:4f:53:29:cb}"
    
    echo "Setting up MACVTAP interface..."
    
    # Create MACVTAP interface
    sudo ip link add link "$host_interface" name macvtap0 type macvtap
    sudo ip link set macvtap0 address "$mac_address" up
    sudo ip link show macvtap0
    
    # Get TAP device index
    local tap_index=$(< /sys/class/net/macvtap0/ifindex)
    local tap_device="/dev/tap$tap_index"
    
    # Set permissions
    sudo chown "$USER:$USER" "$tap_device"
    
    echo "MACVTAP interface created: $tap_device"
    echo "MAC address: $mac_address"
}

# Launch VM with MACVTAP
launch_vm_macvtap() {
    local guest_image="${1:-/path/to/focal-server-cloudimg-amd64.raw}"
    local kernel_path="${2:-/path/to/vmlinux}"
    local mac_address="${3:-c2:67:4f:53:29:cb}"
    
    # Setup MACVTAP first
    setup_macvtap eth0 "$mac_address"
    
    local tap_index=$(< /sys/class/net/macvtap0/ifindex)
    local tap_device="/dev/tap$tap_index"
    
    echo "Launching VM with MACVTAP networking..."
    
    # Use file descriptor redirection for MACVTAP
    exec 3<>"$tap_device"
    
    $BINARY \
        --cpus boot=1 \
        --memory size=512M \
        --kernel "$kernel_path" \
        --cmdline "root=/dev/vda1 console=hvc0" \
        --disk path="$guest_image" \
        --net fd=3,mac="$mac_address" \
        --api-socket "$API_SOCKET" &
    
    VM_PID=$!
    echo "VM started with PID: $VM_PID (MACVTAP mode)"
}

# Setup SR-IOV networking
setup_sriov() {
    local pf_interface="${1:-eth0}"
    local num_vfs="${2:-4}"
    
    echo "Setting up SR-IOV networking..."
    
    # Enable SR-IOV virtual functions
    echo "$num_vfs" | sudo tee "/sys/class/net/$pf_interface/device/sriov_numvfs"
    
    # Wait for VFs to be created
    sleep 2
    
    # List available VFs
    echo "Available SR-IOV VFs:"
    ls -la /sys/class/net/ | grep "$pf_interface"
    
    # Bind VF to vfio-pci driver
    local pci_device=$(readlink "/sys/class/net/${pf_interface}v0/device" | sed 's/.*\///')
    if [ -n "$pci_device" ]; then
        echo "$pci_device" | sudo tee /sys/bus/pci/devices/"$pci_device"/driver/unbind
        echo vfio-pci | sudo tee /sys/bus/pci/devices/"$pci_device"/driver_override
        echo "$pci_device" | sudo tee /sys/bus/pci/drivers/vfio-pci/bind
        echo "VF $pci_device bound to vfio-pci"
    fi
}

# Setup network bridge
setup_bridge() {
    local bridge_name="${1:-br0}"
    local bridge_ip="${2:-192.168.50.1/24}"
    
    echo "Setting up network bridge: $bridge_name"
    
    # Create bridge
    sudo ip link add name "$bridge_name" type bridge
    sudo ip link set "$bridge_name" up
    sudo ip addr add "$bridge_ip" dev "$bridge_name"
    
    # Create TAP interfaces for VMs
    for i in {1..4}; do
        local tap_name="tap$i"
        sudo ip tuntap add "$tap_name" mode tap
        sudo ip link set "$tap_name" up
        sudo ip link set "$tap_name" master "$bridge_name"
        echo "Created TAP interface: $tap_name"
    done
    
    # Configure DHCP (optional - requires dnsmasq)
    if command -v dnsmasq &> /dev/null; then
        sudo dnsmasq \
            --interface="$bridge_name" \
            --bind-interfaces \
            --dhcp-range=192.168.50.100,192.168.50.200,12h \
            --dhcp-option=3,192.168.50.1 \
            --dhcp-option=6,8.8.8.8 \
            --pid-file=/var/run/dnsmasq-"$bridge_name".pid &
        echo "DHCP server started on $bridge_name"
    fi
}

# Network performance testing
test_network_performance() {
    local test_type="${1:-throughput}"
    
    echo "Testing network performance: $test_type"
    
    case "$test_type" in
        "throughput")
            # Test throughput with iperf3
            if command -v iperf3 &> /dev/null; then
                echo "Starting iperf3 server..."
                iperf3 -s -D
                sleep 2
                echo "Run this in the VM: iperf3 -c <host_ip> -t 30"
            else
                echo "iperf3 not available. Install with: sudo apt install iperf3"
            fi
            ;;
        "latency")
            # Test latency
            echo "Test latency from VM with: ping -c 100 <host_ip>"
            ;;
        "pps")
            # Packets per second test
            echo "Use pktgen or similar tools for PPS testing"
            ;;
    esac
}

# Monitor network traffic
monitor_network() {
    local interface="${1:-tap0}"
    local duration="${2:-30}"
    
    echo "Monitoring network traffic on $interface for ${duration}s..."
    
    if command -v tcpdump &> /dev/null; then
        sudo timeout "$duration" tcpdump -i "$interface" -c 100
    elif command -v wireshark &> /dev/null; then
        echo "Use Wireshark to capture on interface: $interface"
    else
        echo "Install tcpdump or wireshark for network monitoring"
    fi
}

# Cleanup networking
cleanup_networking() {
    echo "Cleaning up networking configuration..."
    
    # Kill any running VMs
    if [ -n "$VM_PID" ]; then
        kill "$VM_PID" 2>/dev/null
        wait "$VM_PID" 2>/dev/null
    fi
    
    # Kill testpmd
    if [ -n "$TESTPMD_PID" ]; then
        sudo kill "$TESTPMD_PID" 2>/dev/null
    fi
    
    # Remove TAP interfaces
    for interface in tap0 tap1 tap2 tap3 tap4 macvtap0; do
        sudo ip link delete "$interface" 2>/dev/null || true
    done
    
    # Remove bridge
    sudo ip link delete br0 2>/dev/null || true
    
    # Clean up hugepages
    sudo umount /mnt/huge 2>/dev/null || true
    
    # Remove API socket
    rm -f "$API_SOCKET"
    
    echo "Cleanup completed"
}

# Set cleanup trap
trap cleanup_networking EXIT

# Main function
main() {
    case "${1:-help}" in
        "setup-dpdk")
            setup_dpdk_vhost_user
            ;;
        "vm-vhost-client")
            launch_vm_vhost_user_client "$2" "$3"
            ;;
        "vm-vhost-server")
            launch_vm_vhost_user_server "$2" "$3"
            ;;
        "setup-tap")
            setup_tap_networking
            ;;
        "vm-tap")
            launch_vm_tap "$2" "$3"
            ;;
        "setup-macvtap")
            setup_macvtap "$2" "$3"
            ;;
        "vm-macvtap")
            launch_vm_macvtap "$2" "$3" "$4"
            ;;
        "setup-sriov")
            setup_sriov "$2" "$3"
            ;;
        "setup-bridge")
            setup_bridge "$2" "$3"
            ;;
        "test-perf")
            test_network_performance "$2"
            ;;
        "monitor")
            monitor_network "$2" "$3"
            ;;
        "cleanup")
            cleanup_networking
            ;;
        *)
            echo "Usage: $0 [command] [options]"
            echo "Commands:"
            echo "  setup-dpdk                      - Setup DPDK vhost-user backend"
            echo "  vm-vhost-client [img] [kernel]  - Launch VM with vhost-user (client)"
            echo "  vm-vhost-server [img] [kernel]  - Launch VM with vhost-user (server)"
            echo "  setup-tap                       - Setup TAP networking"
            echo "  vm-tap [img] [kernel]           - Launch VM with TAP"
            echo "  setup-macvtap [iface] [mac]     - Setup MACVTAP interface"
            echo "  vm-macvtap [img] [kernel] [mac] - Launch VM with MACVTAP"
            echo "  setup-sriov [pf] [numvfs]       - Setup SR-IOV"
            echo "  setup-bridge [name] [ip]        - Setup network bridge"
            echo "  test-perf [type]                - Test network performance"
            echo "  monitor [iface] [duration]      - Monitor network traffic"
            echo "  cleanup                         - Cleanup networking"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi