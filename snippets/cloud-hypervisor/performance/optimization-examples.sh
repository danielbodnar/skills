#!/bin/bash
# Performance Optimization Examples
# Various configurations for maximum performance

set -euo pipefail

BINARY="./cloud-hypervisor"
API_SOCKET="/tmp/ch-perf-demo.sock"

# Example 1: High-performance networking with vhost-user
echo "=== High-Performance Networking ==="
$BINARY \
    --cpus boot=4,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7]] \
    --memory size=4G,hugepages=on,hugepage_size=1G,shared=on \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --net mac=52:54:00:02:d9:01,vhost_user=true,socket=/tmp/vhost-user1,num_queues=4,vhost_mode=server \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 2: NUMA-optimized configuration
echo "=== NUMA Optimization ==="
$BINARY \
    --cpus boot=8 \
    --memory-zone size=4G,host_numa_node=0,id=mem0,hugepages=on \
    --memory-zone size=4G,host_numa_node=1,id=mem1,hugepages=on \
    --numa guest_numa_id=0,cpus=[0-3],memory_zones=mem0 \
    --numa guest_numa_id=1,cpus=[4-7],memory_zones=mem1 \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw,iommu=on \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 3: GPU passthrough with VFIO
echo "=== GPU Passthrough ==="
$BINARY \
    --cpus boot=4,affinity=[0@[0-3],1@[4-7],2@[8-11],3@[12-15]] \
    --memory size=8G,hugepages=on,shared=on \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --device path=/sys/bus/pci/devices/0000:01:00.0/,x_nv_gpudirect_clique=0 \
    --cmdline "console=hvc0 root=/dev/vda1 rw iommu=pt vfio-pci.ids=10de:1b06" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 4: SR-IOV network performance
echo "=== SR-IOV Network Performance ==="
$BINARY \
    --cpus boot=6,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7],4@[8,9],5@[10,11]] \
    --memory size=6G,hugepages=on,hugepage_size=1G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --device path=/sys/bus/pci/devices/0000:03:10.0/ \
    --cmdline "console=hvc0 root=/dev/vda1 rw intel_iommu=on" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 5: High-performance storage with vhost-user-blk
echo "=== High-Performance Storage ==="
$BINARY \
    --cpus boot=4,affinity=[0@[0-3],1@[4-7],2@[8-11],3@[12-15]] \
    --memory size=4G,hugepages=on,shared=on \
    --kernel ./vmlinux \
    --user-device socket=/tmp/spdk-vhost-blk0 \
    --cmdline "console=hvc0 root=/dev/vda rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 6: Memory prefaulting for predictable performance
echo "=== Memory Prefaulting ==="
$BINARY \
    --cpus boot=4 \
    --memory size=0 \
    --memory-zone id=mem0,size=4G,hugepages=on,prefault=on,hugepage_size=1G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 7: vDPA (virtio Data Path Acceleration)
echo "=== vDPA Performance ==="
$BINARY \
    --cpus boot=2 \
    --memory size=2G,hugepages=on \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --vdpa path=/dev/vhost-vdpa-0,num_queues=4 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 8: Multi-queue virtio optimization
echo "=== Multi-Queue Virtio ==="
$BINARY \
    --cpus boot=8,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7],4@[8,9],5@[10,11],6@[12,13],7@[14,15]] \
    --memory size=4G,hugepages=on \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw,num_queues=4 \
    --net tap=,mac=,ip=,mask=,num_queues=8 \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 9: Complete performance-optimized configuration
echo "=== Ultimate Performance Configuration ==="
$BINARY \
    --cpus boot=16,max=32,topology=2:4:2:1,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7],4@[8,9],5@[10,11],6@[12,13],7@[14,15],8@[16,17],9@[18,19],10@[20,21],11@[22,23],12@[24,25],13@[26,27],14@[28,29],15@[30,31]] \
    --memory size=0 \
    --memory-zone id=mem0,size=8G,host_numa_node=0,hugepages=on,hugepage_size=1G,prefault=on \
    --memory-zone id=mem1,size=8G,host_numa_node=1,hugepages=on,hugepage_size=1G,prefault=on \
    --numa guest_numa_id=0,cpus=[0-7],memory_zones=mem0 \
    --numa guest_numa_id=1,cpus=[8-15],memory_zones=mem1 \
    --kernel ./vmlinux \
    --disk path=nvme-ssd.raw,num_queues=8,iommu=on \
    --net vhost_user=true,socket=/tmp/dpdk-vhost0,num_queues=8,vhost_mode=server,mac=52:54:00:01:02:03 \
    --device path=/sys/bus/pci/devices/0000:01:00.0/ \
    --rng src=/dev/urandom \
    --cmdline "console=hvc0 root=/dev/vda1 rw iommu=pt intel_iommu=on isolcpus=1-15 nohz_full=1-15" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

echo "Performance optimization examples completed!"

# Performance monitoring commands
echo "=== Performance Monitoring Commands ==="
echo "# Monitor VM performance:"
echo "perf record -g ./cloud-hypervisor ..."
echo "perf report"
echo ""
echo "# Check CPU affinity:"
echo "taskset -p <PID>"
echo ""
echo "# Monitor memory usage:"
echo "numastat -p <PID>"
echo ""
echo "# Check NUMA topology:"
echo "lstopo"

# Cleanup
rm -f $API_SOCKET