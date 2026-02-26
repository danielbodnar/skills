#!/bin/bash
# Memory Configuration Examples
# Demonstrates various memory configurations including zones, hugepages, and NUMA

set -euo pipefail

BINARY="./cloud-hypervisor"
API_SOCKET="/tmp/ch-memory-demo.sock"

# Example 1: Basic memory configuration
echo "=== Basic Memory Configuration ==="
$BINARY \
    --memory size=2G \
    --cpus boot=2 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 2: Memory with hotplug support
echo "=== Memory Hotplug Configuration ==="
$BINARY \
    --memory size=1G,hotplug_size=4G,hotplug_method=virtio-mem \
    --cpus boot=2 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 3: Hugepages memory
echo "=== Hugepages Memory Configuration ==="
$BINARY \
    --memory size=2G,hugepages=on,hugepage_size=2M,shared=on \
    --cpus boot=2 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 4: Memory prefaulting
echo "=== Memory Prefaulting Configuration ==="
$BINARY \
    --memory size=1G,prefault=on \
    --cpus boot=2 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 5: Transparent Huge Pages (THP)
echo "=== Transparent Huge Pages Configuration ==="
$BINARY \
    --memory size=2G,thp=on \
    --cpus boot=2 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 6: Memory zones with backing files
echo "=== Memory Zones Configuration ==="
$BINARY \
    --memory size=0 \
    --memory-zone id=mem0,size=1G,file=/tmp/mem-backing-file,shared=on,hugepages=on \
    --memory-zone id=mem1,size=1G,host_numa_node=0 \
    --cpus boot=2 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 7: NUMA configuration
echo "=== NUMA Memory Configuration ==="
$BINARY \
    --cpus boot=4 \
    --memory-zone size=2G,host_numa_node=0,id=mem0 \
    --memory-zone size=2G,host_numa_node=1,id=mem1 \
    --numa guest_numa_id=0,cpus=[0,1],memory_zones=mem0 \
    --numa guest_numa_id=1,cpus=[2,3],memory_zones=mem1 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 8: NUMA with distances
echo "=== NUMA with Distance Matrix ==="
$BINARY \
    --cpus boot=6 \
    --memory-zone size=2G,host_numa_node=0,id=mem0 \
    --memory-zone size=2G,host_numa_node=1,id=mem1 \
    --memory-zone size=2G,host_numa_node=2,id=mem2 \
    --numa guest_numa_id=0,cpus=[0,1],memory_zones=mem0,distances=[1@15,2@25] \
    --numa guest_numa_id=1,cpus=[2,3],memory_zones=mem1,distances=[0@15,2@20] \
    --numa guest_numa_id=2,cpus=[4,5],memory_zones=mem2,distances=[0@25,1@20] \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 9: Complete memory configuration
echo "=== Complete Memory Configuration ==="
$BINARY \
    --memory size=0 \
    --memory-zone id=zone0,size=2G,file=/tmp/zone0-backing,shared=on,hugepages=on,hugepage_size=1G,prefault=on,host_numa_node=0 \
    --memory-zone id=zone1,size=2G,shared=on,hugepages=on,hugepage_size=2M,host_numa_node=1,hotplug_size=2G \
    --numa guest_numa_id=0,cpus=[0,1],memory_zones=zone0 \
    --numa guest_numa_id=1,cpus=[2,3],memory_zones=zone1 \
    --cpus boot=4 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

echo "Memory configuration examples completed!"

# Cleanup
rm -f $API_SOCKET /tmp/mem-backing-file /tmp/zone0-backing