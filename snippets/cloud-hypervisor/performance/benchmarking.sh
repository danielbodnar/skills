#!/bin/bash
# Cloud Hypervisor Performance Benchmarking and Optimization

# Configuration
BINARY="./cloud-hypervisor"
RESULTS_DIR="/tmp/ch-benchmarks"
GUEST_IMAGE="/path/to/benchmark-guest.raw"
KERNEL_PATH="/path/to/vmlinux"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Boot time benchmarking
benchmark_boot_time() {
    local iterations="${1:-10}"
    local vm_config="${2:-basic}"
    
    echo "Benchmarking boot time (${iterations} iterations)..."
    
    local total_time=0
    local boot_times=()
    
    for i in $(seq 1 "$iterations"); do
        echo "Boot test $i/$iterations"
        
        # Start timing
        local start_time=$(date +%s.%N)
        
        # Launch VM based on configuration
        case "$vm_config" in
            "basic")
                $BINARY \
                    --cpus boot=1 \
                    --memory size=512M \
                    --kernel "$KERNEL_PATH" \
                    --cmdline "console=hvc0 root=/dev/vda1 rw init=/bin/true" \
                    --disk path="$GUEST_IMAGE" \
                    --api-socket "/tmp/bench-$i.sock" &
                ;;
            "optimized")
                $BINARY \
                    --cpus boot=1 \
                    --memory size=512M,hugepages=on,prefault=on \
                    --kernel "$KERNEL_PATH" \
                    --cmdline "console=hvc0 root=/dev/vda1 rw init=/bin/true" \
                    --disk path="$GUEST_IMAGE" \
                    --api-socket "/tmp/bench-$i.sock" &
                ;;
            "minimal")
                $BINARY \
                    --cpus boot=1 \
                    --memory size=256M \
                    --kernel "$KERNEL_PATH" \
                    --cmdline "console=hvc0 init=/bin/true" \
                    --api-socket "/tmp/bench-$i.sock" &
                ;;
        esac
        
        local vm_pid=$!
        
        # Wait for VM to be ready (check API socket)
        local timeout=30
        while [ $timeout -gt 0 ] && [ ! -S "/tmp/bench-$i.sock" ]; do
            sleep 0.1
            ((timeout--))
        done
        
        if [ -S "/tmp/bench-$i.sock" ]; then
            # VM is ready, measure boot time
            local end_time=$(date +%s.%N)
            local boot_time=$(echo "$end_time - $start_time" | bc -l)
            boot_times+=("$boot_time")
            total_time=$(echo "$total_time + $boot_time" | bc -l)
            
            echo "Boot $i: ${boot_time}s"
        else
            echo "Boot $i: TIMEOUT"
            boot_times+=("30.0")
        fi
        
        # Cleanup
        kill "$vm_pid" 2>/dev/null
        wait "$vm_pid" 2>/dev/null
        rm -f "/tmp/bench-$i.sock"
        
        sleep 1
    done
    
    # Calculate statistics
    local avg_time=$(echo "scale=3; $total_time / $iterations" | bc -l)
    local min_time=$(printf '%s\n' "${boot_times[@]}" | sort -n | head -1)
    local max_time=$(printf '%s\n' "${boot_times[@]}" | sort -n | tail -1)
    
    echo "Boot Time Results ($vm_config configuration):"
    echo "  Average: ${avg_time}s"
    echo "  Minimum: ${min_time}s"
    echo "  Maximum: ${max_time}s"
    echo "  Iterations: $iterations"
    
    # Save results
    cat > "$RESULTS_DIR/boot-time-$vm_config.txt" << EOF
Configuration: $vm_config
Iterations: $iterations
Average: ${avg_time}s
Minimum: ${min_time}s
Maximum: ${max_time}s
Raw times: ${boot_times[*]}
EOF
}

# Memory performance benchmarking
benchmark_memory() {
    local memory_sizes=("512M" "1G" "2G" "4G")
    local memory_configs=("basic" "hugepages" "prefault")
    
    echo "Benchmarking memory configurations..."
    
    for size in "${memory_sizes[@]}"; do
        for config in "${memory_configs[@]}"; do
            echo "Testing memory: $size with $config"
            
            local memory_opts=""
            case "$config" in
                "basic")
                    memory_opts="size=$size"
                    ;;
                "hugepages")
                    memory_opts="size=$size,hugepages=on"
                    ;;
                "prefault")
                    memory_opts="size=$size,prefault=on"
                    ;;
            esac
            
            # Launch VM and measure memory allocation time
            local start_time=$(date +%s.%N)
            
            $BINARY \
                --cpus boot=1 \
                --memory "$memory_opts" \
                --kernel "$KERNEL_PATH" \
                --cmdline "console=hvc0 root=/dev/vda1 rw" \
                --disk path="$GUEST_IMAGE" \
                --api-socket "/tmp/mem-bench.sock" &
            
            local vm_pid=$!
            
            # Wait for API socket
            local timeout=60
            while [ $timeout -gt 0 ] && [ ! -S "/tmp/mem-bench.sock" ]; do
                sleep 0.1
                ((timeout--))
            done
            
            local end_time=$(date +%s.%N)
            local alloc_time=$(echo "$end_time - $start_time" | bc -l)
            
            echo "  Memory allocation time: ${alloc_time}s"
            
            # Get memory usage statistics
            local memory_usage=$(ps -o pid,vsz,rss,pmem -p "$vm_pid" | tail -1)
            echo "  Memory usage: $memory_usage"
            
            # Cleanup
            kill "$vm_pid" 2>/dev/null
            wait "$vm_pid" 2>/dev/null
            rm -f "/tmp/mem-bench.sock"
            
            sleep 2
        done
    done
}

# CPU performance benchmarking
benchmark_cpu() {
    local cpu_configs=("1" "2" "4" "8")
    local topology_configs=("flat" "numa")
    
    echo "Benchmarking CPU configurations..."
    
    for cpus in "${cpu_configs[@]}"; do
        for topology in "${topology_configs[@]}"; do
            echo "Testing CPUs: $cpus with $topology topology"
            
            local cpu_opts=""
            case "$topology" in
                "flat")
                    cpu_opts="boot=$cpus,max=$cpus"
                    ;;
                "numa")
                    if [ "$cpus" -ge 4 ]; then
                        local cores_per_numa=$((cpus / 2))
                        cpu_opts="boot=$cpus,max=$cpus,topology=1:$cores_per_numa:1:2"
                    else
                        cpu_opts="boot=$cpus,max=$cpus"
                    fi
                    ;;
            esac
            
            # Launch VM and measure CPU initialization time
            local start_time=$(date +%s.%N)
            
            $BINARY \
                --cpus "$cpu_opts" \
                --memory size=1G \
                --kernel "$KERNEL_PATH" \
                --cmdline "console=hvc0 root=/dev/vda1 rw" \
                --disk path="$GUEST_IMAGE" \
                --api-socket "/tmp/cpu-bench.sock" &
            
            local vm_pid=$!
            
            # Wait for VM to be ready
            local timeout=30
            while [ $timeout -gt 0 ] && [ ! -S "/tmp/cpu-bench.sock" ]; do
                sleep 0.1
                ((timeout--))
            done
            
            local end_time=$(date +%s.%N)
            local init_time=$(echo "$end_time - $start_time" | bc -l)
            
            echo "  CPU initialization time: ${init_time}s"
            
            # Measure CPU usage
            local cpu_usage=$(top -b -n 1 -p "$vm_pid" | tail -1 | awk '{print $9}')
            echo "  Host CPU usage: ${cpu_usage}%"
            
            # Cleanup
            kill "$vm_pid" 2>/dev/null
            wait "$vm_pid" 2>/dev/null
            rm -f "/tmp/cpu-bench.sock"
            
            sleep 2
        done
    done
}

# I/O performance benchmarking
benchmark_io() {
    local disk_configs=("basic" "direct" "async")
    local queue_configs=("1" "2" "4" "8")
    
    echo "Benchmarking I/O configurations..."
    
    for disk_config in "${disk_configs[@]}"; do
        for queues in "${queue_configs[@]}"; do
            echo "Testing I/O: $disk_config with $queues queues"
            
            local disk_opts=""
            case "$disk_config" in
                "basic")
                    disk_opts="path=$GUEST_IMAGE,num_queues=$queues"
                    ;;
                "direct")
                    disk_opts="path=$GUEST_IMAGE,direct=true,num_queues=$queues"
                    ;;
                "async")
                    disk_opts="path=$GUEST_IMAGE,direct=true,num_queues=$queues,queue_size=256"
                    ;;
            esac
            
            # Create test disk for I/O benchmarking
            local test_disk="/tmp/io-test-$disk_config-$queues.raw"
            dd if=/dev/zero of="$test_disk" bs=1M count=1024 2>/dev/null
            
            # Launch VM
            $BINARY \
                --cpus boot=2 \
                --memory size=1G \
                --kernel "$KERNEL_PATH" \
                --cmdline "console=hvc0 root=/dev/vda1 rw" \
                --disk path="$GUEST_IMAGE" \
                --disk "$disk_opts" \
                --api-socket "/tmp/io-bench.sock" &
            
            local vm_pid=$!
            
            # Wait for VM
            sleep 5
            
            # Monitor I/O statistics
            local io_stats_before=$(cat /proc/diskstats | grep $(basename "$test_disk"))
            sleep 10
            local io_stats_after=$(cat /proc/diskstats | grep $(basename "$test_disk"))
            
            echo "  I/O stats collected for $disk_config/$queues"
            
            # Cleanup
            kill "$vm_pid" 2>/dev/null
            wait "$vm_pid" 2>/dev/null
            rm -f "/tmp/io-bench.sock" "$test_disk"
            
            sleep 2
        done
    done
}

# Network performance benchmarking
benchmark_network() {
    local net_configs=("tap" "vhost-user")
    local queue_configs=("1" "2" "4")
    
    echo "Benchmarking network configurations..."
    
    # Setup basic networking
    setup_tap_for_bench() {
        sudo ip tuntap add tap-bench mode tap
        sudo ip link set tap-bench up
        sudo ip addr add 192.168.200.1/24 dev tap-bench
    }
    
    setup_tap_for_bench
    
    for net_config in "${net_configs[@]}"; do
        for queues in "${queue_configs[@]}"; do
            echo "Testing network: $net_config with $queues queues"
            
            local net_opts=""
            case "$net_config" in
                "tap")
                    net_opts="tap=tap-bench,ip=192.168.200.10,mask=255.255.255.0,num_queues=$queues"
                    ;;
                "vhost-user")
                    # This would require a vhost-user backend
                    net_opts="vhost_user=true,socket=/tmp/vhost-bench,num_queues=$queues"
                    ;;
            esac
            
            # Launch VM
            $BINARY \
                --cpus boot=2 \
                --memory size=1G,hugepages=on,shared=true \
                --kernel "$KERNEL_PATH" \
                --cmdline "console=hvc0 root=/dev/vda1 rw" \
                --disk path="$GUEST_IMAGE" \
                --net "$net_opts" \
                --api-socket "/tmp/net-bench.sock" &
            
            local vm_pid=$!
            
            # Wait and collect network statistics
            sleep 5
            local net_stats=$(cat /proc/net/dev | grep tap-bench)
            echo "  Network stats: $net_stats"
            
            # Cleanup
            kill "$vm_pid" 2>/dev/null
            wait "$vm_pid" 2>/dev/null
            rm -f "/tmp/net-bench.sock"
            
            sleep 2
        done
    done
    
    # Cleanup networking
    sudo ip link delete tap-bench 2>/dev/null || true
}

# Hotplug performance benchmarking
benchmark_hotplug() {
    echo "Benchmarking hotplug performance..."
    
    # Start base VM
    $BINARY \
        --cpus boot=2,max=8 \
        --memory size=1G,hotplug_size=4G \
        --kernel "$KERNEL_PATH" \
        --cmdline "console=hvc0 root=/dev/vda1 rw" \
        --disk path="$GUEST_IMAGE" \
        --api-socket "/tmp/hotplug-bench.sock" &
    
    local vm_pid=$!
    
    # Wait for VM to be ready
    sleep 5
    
    # Benchmark CPU hotplug
    echo "  Testing CPU hotplug..."
    for cpus in 4 6 8; do
        local start_time=$(date +%s.%N)
        
        curl --unix-socket /tmp/hotplug-bench.sock -s \
             -X PUT 'http://localhost/api/v1/vm.resize' \
             -H 'Content-Type: application/json' \
             -d "{\"desired_vcpus\": $cpus}" > /dev/null
        
        local end_time=$(date +%s.%N)
        local hotplug_time=$(echo "$end_time - $start_time" | bc -l)
        
        echo "    CPU hotplug to $cpus: ${hotplug_time}s"
        sleep 2
    done
    
    # Benchmark memory hotplug
    echo "  Testing memory hotplug..."
    for memory in 2147483648 3221225472 4294967296; do
        local start_time=$(date +%s.%N)
        
        curl --unix-socket /tmp/hotplug-bench.sock -s \
             -X PUT 'http://localhost/api/v1/vm.resize' \
             -H 'Content-Type: application/json' \
             -d "{\"desired_ram\": $memory}" > /dev/null
        
        local end_time=$(date +%s.%N)
        local hotplug_time=$(echo "$end_time - $start_time" | bc -l)
        local memory_gb=$((memory / 1024 / 1024 / 1024))
        
        echo "    Memory hotplug to ${memory_gb}GB: ${hotplug_time}s"
        sleep 2
    done
    
    # Cleanup
    kill "$vm_pid" 2>/dev/null
    wait "$vm_pid" 2>/dev/null
    rm -f "/tmp/hotplug-bench.sock"
}

# Live migration performance
benchmark_migration() {
    echo "Benchmarking live migration performance..."
    
    # Start source VM
    $BINARY \
        --cpus boot=2 \
        --memory size=1G,shared=on \
        --kernel "$KERNEL_PATH" \
        --cmdline "console=hvc0 root=/dev/vda1 rw" \
        --disk path="$GUEST_IMAGE" \
        --api-socket "/tmp/migration-src.sock" &
    
    local src_pid=$!
    
    # Start destination VM
    $BINARY \
        --api-socket "/tmp/migration-dst.sock" &
    
    local dst_pid=$!
    
    # Wait for VMs to be ready
    sleep 5
    
    # Setup migration receiver
    curl --unix-socket /tmp/migration-dst.sock -s \
         -X PUT 'http://localhost/api/v1/vm.receive-migration' \
         -H 'Content-Type: application/json' \
         -d '{"receiver_url": "unix:/tmp/migration.sock"}' > /dev/null &
    
    sleep 2
    
    # Start migration
    local start_time=$(date +%s.%N)
    
    curl --unix-socket /tmp/migration-src.sock -s \
         -X PUT 'http://localhost/api/v1/vm.send-migration' \
         -H 'Content-Type: application/json' \
         -d '{"destination_url": "unix:/tmp/migration.sock"}' > /dev/null
    
    local end_time=$(date +%s.%N)
    local migration_time=$(echo "$end_time - $start_time" | bc -l)
    
    echo "  Migration time: ${migration_time}s"
    
    # Cleanup
    kill "$src_pid" "$dst_pid" 2>/dev/null
    wait "$src_pid" "$dst_pid" 2>/dev/null
    rm -f "/tmp/migration-src.sock" "/tmp/migration-dst.sock" "/tmp/migration.sock"
}

# Generate performance report
generate_report() {
    echo "Generating performance report..."
    
    local report_file="$RESULTS_DIR/performance-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
Cloud Hypervisor Performance Benchmark Report
Generated: $(date)
Host: $(uname -a)
CPU: $(lscpu | grep "Model name" | cut -d: -f2 | xargs)
Memory: $(free -h | grep Mem | awk '{print $2}')
Kernel: $(uname -r)

=== Boot Time Results ===
EOF
    
    # Append boot time results if available
    if [ -f "$RESULTS_DIR/boot-time-basic.txt" ]; then
        cat "$RESULTS_DIR/boot-time-basic.txt" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

=== System Information ===
Cloud Hypervisor Version: $($BINARY --version 2>/dev/null || echo "Unknown")
KVM Support: $([ -c /dev/kvm ] && echo "Available" || echo "Not available")
Hugepages: $(cat /proc/meminfo | grep HugePages_Total | awk '{print $2}')

=== Performance Summary ===
- Boot time benchmark completed
- Memory configuration tests completed  
- CPU configuration tests completed
- I/O performance tests completed
- Network performance tests completed
- Hotplug performance tests completed
- Migration performance tests completed

EOF
    
    echo "Report saved to: $report_file"
}

# Cleanup function
cleanup() {
    echo "Cleaning up benchmark environment..."
    
    # Kill any remaining VMs
    pkill -f cloud-hypervisor 2>/dev/null || true
    
    # Remove sockets
    rm -f /tmp/bench-*.sock /tmp/*-bench.sock /tmp/migration*.sock
    
    # Remove test files
    rm -f /tmp/io-test-*.raw
    
    # Remove TAP interfaces
    sudo ip link delete tap-bench 2>/dev/null || true
}

# Set cleanup trap
trap cleanup EXIT

# Main function
main() {
    echo "Cloud Hypervisor Performance Benchmarking Suite"
    echo "================================================"
    
    # Check dependencies
    if ! command -v bc &> /dev/null; then
        echo "Error: bc (calculator) is required but not installed"
        exit 1
    fi
    
    if [ ! -f "$BINARY" ]; then
        echo "Error: Cloud Hypervisor binary not found at $BINARY"
        exit 1
    fi
    
    case "${1:-all}" in
        "boot")
            benchmark_boot_time "${2:-5}" "${3:-basic}"
            ;;
        "memory")
            benchmark_memory
            ;;
        "cpu")
            benchmark_cpu
            ;;
        "io")
            benchmark_io
            ;;
        "network")
            benchmark_network
            ;;
        "hotplug")
            benchmark_hotplug
            ;;
        "migration")
            benchmark_migration
            ;;
        "report")
            generate_report
            ;;
        "all")
            echo "Running comprehensive benchmark suite..."
            benchmark_boot_time 5 basic
            benchmark_boot_time 5 optimized
            benchmark_memory
            benchmark_cpu
            benchmark_io
            benchmark_network
            benchmark_hotplug
            benchmark_migration
            generate_report
            ;;
        *)
            echo "Usage: $0 [command] [options]"
            echo "Commands:"
            echo "  boot [iterations] [config]  - Benchmark boot time"
            echo "  memory                      - Benchmark memory configurations"
            echo "  cpu                         - Benchmark CPU configurations"
            echo "  io                          - Benchmark I/O performance"
            echo "  network                     - Benchmark network performance"
            echo "  hotplug                     - Benchmark hotplug performance"
            echo "  migration                   - Benchmark live migration"
            echo "  report                      - Generate performance report"
            echo "  all                         - Run all benchmarks"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi