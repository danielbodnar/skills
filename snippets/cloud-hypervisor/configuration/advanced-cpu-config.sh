#!/bin/bash
# Advanced CPU Configuration Examples
# Demonstrates CPU topology, affinity, and feature configuration

set -euo pipefail

BINARY="./cloud-hypervisor"
API_SOCKET="/tmp/ch-cpu-demo.sock"

# Example 1: Basic CPU configuration
echo "=== Basic CPU Configuration ==="
$BINARY \
    --cpus boot=4,max=8 \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 2: CPU Topology Configuration
echo "=== CPU Topology Configuration ==="
# 2 threads per core, 2 cores per die, 1 die per package, 2 packages
$BINARY \
    --cpus boot=8,max=16,topology=2:2:1:2 \
    --memory size=4G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 3: CPU Affinity Configuration
echo "=== CPU Affinity Configuration ==="
# Pin vCPU 0 to host CPUs 0,1 and vCPU 1 to host CPUs 2,3
$BINARY \
    --cpus boot=4,affinity=[0@[0,1],1@[2,3],2@[4,5],3@[6,7]] \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 4: Advanced features with KVM Hyper-V
echo "=== KVM Hyper-V Emulation ==="
$BINARY \
    --cpus boot=2,kvm_hyperv=on \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 5: AMX CPU Features (if supported)
echo "=== AMX CPU Features ==="
$BINARY \
    --cpus boot=4,features=amx \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 6: Maximum physical address bits
echo "=== Custom Physical Address Bits ==="
$BINARY \
    --cpus boot=2,max_phys_bits=48 \
    --memory size=2G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

# Example 7: Complex configuration combining all features
echo "=== Complete CPU Configuration ==="
$BINARY \
    --cpus boot=8,max=16,topology=2:2:2:1,kvm_hyperv=on,max_phys_bits=48,affinity=[0@[0-3],1@[4-7],2@[8-11],3@[12-15]],features=amx \
    --memory size=4G \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --api-socket $API_SOCKET &

CH_PID=$!
sleep 2
kill $CH_PID 2>/dev/null || true

echo "CPU configuration examples completed!"

# Cleanup
rm -f $API_SOCKET