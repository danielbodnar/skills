#!/bin/bash
# Basic Network Namespace Operations
# Comprehensive namespace management examples

# Function to create isolated namespace
create_isolated_namespace() {
    local ns_name=$1
    local ip_addr=$2
    
    echo "Creating isolated namespace: $ns_name"
    
    # Create namespace
    ip netns add $ns_name
    
    # Create VETH pair
    ip link add veth-${ns_name} type veth peer name veth-${ns_name}-peer
    
    # Move one end to namespace
    ip link set veth-${ns_name}-peer netns $ns_name
    
    # Configure host side
    ip addr add ${ip_addr%.*}.1/24 dev veth-${ns_name}
    ip link set veth-${ns_name} up
    
    # Configure namespace side
    ip netns exec $ns_name ip addr add $ip_addr/24 dev veth-${ns_name}-peer
    ip netns exec $ns_name ip link set veth-${ns_name}-peer up
    ip netns exec $ns_name ip link set lo up
    
    # Add default route in namespace
    ip netns exec $ns_name ip route add default via ${ip_addr%.*}.1
    
    echo "Namespace $ns_name created with IP $ip_addr"
}

# Function to test namespace connectivity
test_namespace() {
    local ns_name=$1
    local target_ip=$2
    
    echo "Testing connectivity from namespace $ns_name to $target_ip"
    ip netns exec $ns_name ping -c 3 $target_ip
}

# Function to run command in namespace
run_in_namespace() {
    local ns_name=$1
    shift
    local command="$@"
    
    echo "Running '$command' in namespace $ns_name"
    ip netns exec $ns_name $command
}

# Function to show namespace information
show_namespace_info() {
    local ns_name=$1
    
    echo "=== Namespace $ns_name Information ==="
    echo "Interfaces:"
    ip netns exec $ns_name ip link show
    echo
    echo "IP Addresses:"
    ip netns exec $ns_name ip addr show
    echo
    echo "Routes:"
    ip netns exec $ns_name ip route show
    echo
    echo "Processes:"
    ip netns pids $ns_name 2>/dev/null || echo "No processes found"
    echo
}

# Function to delete namespace
delete_namespace() {
    local ns_name=$1
    
    echo "Deleting namespace: $ns_name"
    
    # Remove VETH interface (this also removes the peer)
    ip link del veth-${ns_name} 2>/dev/null
    
    # Delete namespace
    ip netns del $ns_name
    
    echo "Namespace $ns_name deleted"
}

# Function to create connected namespaces
create_connected_namespaces() {
    echo "Creating two connected namespaces..."
    
    # Create namespaces
    ip netns add ns1
    ip netns add ns2
    
    # Create VETH pair connecting the namespaces
    ip link add veth1 type veth peer name veth2
    
    # Move interfaces to respective namespaces
    ip link set veth1 netns ns1
    ip link set veth2 netns ns2
    
    # Configure interfaces
    ip netns exec ns1 ip addr add 10.1.1.1/24 dev veth1
    ip netns exec ns1 ip link set veth1 up
    ip netns exec ns1 ip link set lo up
    
    ip netns exec ns2 ip addr add 10.1.1.2/24 dev veth2
    ip netns exec ns2 ip link set veth2 up
    ip netns exec ns2 ip link set lo up
    
    echo "Connected namespaces created:"
    echo "ns1: 10.1.1.1/24"
    echo "ns2: 10.1.1.2/24"
}

# Main script logic
case "$1" in
    "create")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 create <namespace_name> <ip_address>"
            echo "Example: $0 create test-ns 192.168.100.10"
            exit 1
        fi
        create_isolated_namespace $2 $3
        ;;
    "delete")
        if [ -z "$2" ]; then
            echo "Usage: $0 delete <namespace_name>"
            exit 1
        fi
        delete_namespace $2
        ;;
    "test")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 test <namespace_name> <target_ip>"
            exit 1
        fi
        test_namespace $2 $3
        ;;
    "show")
        if [ -z "$2" ]; then
            echo "Usage: $0 show <namespace_name>"
            exit 1
        fi
        show_namespace_info $2
        ;;
    "run")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 run <namespace_name> <command>"
            exit 1
        fi
        ns_name=$2
        shift 2
        run_in_namespace $ns_name "$@"
        ;;
    "connected")
        create_connected_namespaces
        ;;
    "list")
        echo "Available namespaces:"
        ip netns list
        ;;
    *)
        echo "Usage: $0 {create|delete|test|show|run|connected|list}"
        echo "  create <name> <ip>  - Create isolated namespace"
        echo "  delete <name>       - Delete namespace"
        echo "  test <name> <ip>    - Test connectivity"
        echo "  show <name>         - Show namespace info"
        echo "  run <name> <cmd>    - Run command in namespace"
        echo "  connected           - Create two connected namespaces"
        echo "  list                - List all namespaces"
        ;;
esac