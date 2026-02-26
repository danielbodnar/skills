#!/bin/bash
# Advanced Networking Examples
# Various networking configurations and optimizations

set -euo pipefail

BINARY="./cloud-hypervisor"
API_SOCKET="/tmp/ch-net-demo.sock"

# Example 1: Basic TAP networking
echo "=== Basic TAP Networking ==="
$BINARY \
    --cpus boot=2 \
    --memory size=1G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net "tap=,mac=52:54:00:12:34:56,ip=192.168.100.10,mask=255.255.255.0" \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 2: vhost-user networking with DPDK
echo "=== vhost-user DPDK Networking ==="

# Start OVS with DPDK (prerequisite)
echo "# Prerequisites: Configure OVS with DPDK"
echo "modprobe openvswitch"
echo "ovs-vsctl set Open_vSwitch . other_config:dpdk-init=true"

$BINARY \
    --cpus boot=4 \
    --memory size=2G,hugepages=on,shared=true \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net mac=52:54:00:02:d9:01,vhost_user=true,socket=/tmp/vhost-user1,num_queues=4,vhost_mode=server \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 3: SR-IOV passthrough
echo "=== SR-IOV Network Passthrough ==="
$BINARY \
    --cpus boot=4 \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --device path=/sys/bus/pci/devices/0000:03:10.0/ \
    --cmdline "console=hvc0 root=/dev/vda1 rw intel_iommu=on" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 4: MACVTAP networking
echo "=== MACVTAP Networking ==="

# Setup MACVTAP interface
MAC="c2:67:4f:53:29:cb"
HOST_NET="eth0"

echo "Setting up MACVTAP interface..."
sudo ip link add link "$HOST_NET" name macvtap0 type macvtap
sudo ip link set macvtap0 address "$MAC" up

TAPINDEX=$(< /sys/class/net/macvtap0/ifindex)
TAPDEVICE="/dev/tap$TAPINDEX"
sudo chown $USER:$USER "$TAPDEVICE"

$BINARY \
    --cpus boot=2 \
    --memory size=1G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net fd=3,mac=$MAC \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET 3<>"$TAPDEVICE" &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Cleanup MACVTAP
sudo ip link delete macvtap0 2>/dev/null || true

# Example 5: Multi-queue networking
echo "=== Multi-Queue Networking ==="
$BINARY \
    --cpus boot=8,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7],4@[8,9],5@[10,11],6@[12,13],7@[14,15]] \
    --memory size=4G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net tap=,mac=52:54:00:12:34:56,ip=192.168.100.10,mask=255.255.255.0,num_queues=8 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 6: Multiple network interfaces
echo "=== Multiple Network Interfaces ==="
$BINARY \
    --cpus boot=4 \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net tap=,mac=52:54:00:12:34:56,ip=192.168.100.10,mask=255.255.255.0,id=net0 \
    --net tap=,mac=52:54:00:12:34:57,ip=192.168.101.10,mask=255.255.255.0,id=net1 \
    --net vhost_user=true,socket=/tmp/vhost-user1,mac=52:54:00:12:34:58,id=net2 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 7: Network hotplug
echo "=== Network Hotplug ==="
$BINARY \
    --cpus boot=2 \
    --memory size=1G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net tap=,mac=52:54:00:12:34:56,ip=192.168.100.10,mask=255.255.255.0 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 3

# Add second network interface via API
echo "Adding network interface via hotplug..."
NET_CONFIG='{
    "tap": null,
    "ip": "192.168.101.10",
    "mask": "255.255.255.0",
    "mac": "52:54:00:12:34:57",
    "host_mac": null,
    "id": "net1",
    "num_queues": 2,
    "queue_size": 256,
    "iommu": false,
    "vhost_user": false,
    "vhost_socket": null,
    "vhost_mode": "Client",
    "fd": null
}'

curl --unix-socket $API_SOCKET -X PUT \
     'http://localhost/api/v1/vm.add-net' \
     -H 'Content-Type: application/json' \
     -d "$NET_CONFIG"

sleep 2
kill $CH_PID 2>/dev/null || true

# Example 8: vDPA networking
echo "=== vDPA Networking ==="
$BINARY \
    --cpus boot=2 \
    --memory size=2G,hugepages=on \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --vdpa path=/dev/vhost-vdpa-0,num_queues=2 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 9: Custom bridge networking
echo "=== Custom Bridge Networking ==="

# Create custom bridge
BRIDGE_NAME="ch-br0"
echo "Creating custom bridge: $BRIDGE_NAME"
sudo ip link add name $BRIDGE_NAME type bridge
sudo ip link set $BRIDGE_NAME up
sudo ip addr add 192.168.200.1/24 dev $BRIDGE_NAME

$BINARY \
    --cpus boot=2 \
    --memory size=1G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net tap=$BRIDGE_NAME,mac=52:54:00:12:34:56,ip=192.168.200.10,mask=255.255.255.0 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Cleanup bridge
sudo ip link delete $BRIDGE_NAME 2>/dev/null || true

# Example 10: Network performance testing setup
echo "=== Network Performance Testing Setup ==="
$BINARY \
    --cpus boot=4,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7]] \
    --memory size=4G,hugepages=on \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net tap=,mac=52:54:00:12:34:56,ip=192.168.100.10,mask=255.255.255.0,num_queues=4,queue_size=1024 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --rng src=/dev/urandom \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

echo "Advanced networking examples completed!"

# Network performance testing commands
echo "=== Network Performance Testing Commands ==="
echo "# In guest VM:"
echo "iperf3 -s  # Start server"
echo "# On host:"
echo "iperf3 -c 192.168.100.10 -t 60 -P 4  # Test with 4 parallel streams"
echo ""
echo "# Latency testing:"
echo "ping -c 100 192.168.100.10"
echo ""
echo "# Throughput testing with netperf:"
echo "netperf -H 192.168.100.10 -t TCP_STREAM"

# Cleanup
rm -f $API_SOCKET