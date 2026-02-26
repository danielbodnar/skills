#!/bin/bash
# VPN in Network Namespace
# Isolate VPN traffic in separate namespace

VPN_NS="vpn-ns"
VPN_INTERFACE="wg-vpn"
VPN_CONFIG="/etc/wireguard/vpn-ns.conf"

# Function to create VPN namespace
create_vpn_namespace() {
    echo "Creating VPN namespace..."
    
    # Create namespace
    ip netns add $VPN_NS
    
    # Bring up loopback in namespace
    ip netns exec $VPN_NS ip link set lo up
    
    echo "VPN namespace '$VPN_NS' created"
}

# Function to start WireGuard in namespace
start_wireguard_in_namespace() {
    echo "Starting WireGuard in namespace..."
    
    # Create WireGuard interface in namespace
    ip netns exec $VPN_NS ip link add dev $VPN_INTERFACE type wireguard
    
    # Move to namespace (if created in default namespace)
    # ip link set $VPN_INTERFACE netns $VPN_NS
    
    # Configure WireGuard from config file
    ip netns exec $VPN_NS wg-quick up $VPN_CONFIG
    
    echo "WireGuard started in namespace"
}

# Function to create VETH bridge to namespace
create_namespace_bridge() {
    local bridge_ip="192.168.100.1/24"
    local ns_ip="192.168.100.2/24"
    
    echo "Creating bridge to VPN namespace..."
    
    # Create VETH pair
    ip link add veth-vpn type veth peer name veth-vpn-ns
    
    # Move one end to namespace
    ip link set veth-vpn-ns netns $VPN_NS
    
    # Configure host side
    ip addr add $bridge_ip dev veth-vpn
    ip link set veth-vpn up
    
    # Configure namespace side
    ip netns exec $VPN_NS ip addr add $ns_ip dev veth-vpn-ns
    ip netns exec $VPN_NS ip link set veth-vpn-ns up
    
    # Add route to namespace via VPN
    ip netns exec $VPN_NS ip route add default via 192.168.100.1 dev veth-vpn-ns metric 100
    
    # Enable forwarding on host
    echo 1 > /proc/sys/net/ipv4/ip_forward
    
    # Configure NAT for namespace traffic
    iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -o $VPN_INTERFACE -j MASQUERADE
    iptables -A FORWARD -i veth-vpn -o $VPN_INTERFACE -j ACCEPT
    iptables -A FORWARD -i $VPN_INTERFACE -o veth-vpn -j ACCEPT
    
    echo "Bridge to VPN namespace created"
}

# Function to run application in VPN namespace
run_in_vpn_namespace() {
    local command="$@"
    
    echo "Running '$command' in VPN namespace..."
    ip netns exec $VPN_NS $command
}

# Function to check VPN namespace status
check_vpn_status() {
    echo "=== VPN Namespace Status ==="
    
    echo "Namespace exists:"
    ip netns list | grep -q $VPN_NS && echo "Yes" || echo "No"
    
    echo "Interfaces in namespace:"
    ip netns exec $VPN_NS ip link show 2>/dev/null || echo "Namespace not found"
    
    echo "IP addresses:"
    ip netns exec $VPN_NS ip addr show 2>/dev/null || echo "Namespace not found"
    
    echo "Routes:"
    ip netns exec $VPN_NS ip route show 2>/dev/null || echo "Namespace not found"
    
    echo "WireGuard status:"
    ip netns exec $VPN_NS wg show 2>/dev/null || echo "WireGuard not running"
    
    echo "DNS configuration:"
    ip netns exec $VPN_NS cat /etc/resolv.conf 2>/dev/null || echo "No DNS config"
}

# Function to test VPN connectivity
test_vpn_connectivity() {
    echo "Testing VPN connectivity..."
    
    echo "Test 1: Ping through VPN"
    ip netns exec $VPN_NS ping -c 3 8.8.8.8
    
    echo "Test 2: DNS resolution"
    ip netns exec $VPN_NS nslookup google.com
    
    echo "Test 3: HTTP request"
    ip netns exec $VPN_NS curl -s http://httpbin.org/ip
}

# Function to cleanup VPN namespace
cleanup_vpn_namespace() {
    echo "Cleaning up VPN namespace..."
    
    # Stop WireGuard
    ip netns exec $VPN_NS wg-quick down $VPN_CONFIG 2>/dev/null
    
    # Remove VETH interface
    ip link del veth-vpn 2>/dev/null
    
    # Remove iptables rules
    iptables -t nat -D POSTROUTING -s 192.168.100.0/24 -o $VPN_INTERFACE -j MASQUERADE 2>/dev/null
    iptables -D FORWARD -i veth-vpn -o $VPN_INTERFACE -j ACCEPT 2>/dev/null
    iptables -D FORWARD -i $VPN_INTERFACE -o veth-vpn -j ACCEPT 2>/dev/null
    
    # Delete namespace
    ip netns del $VPN_NS 2>/dev/null
    
    echo "VPN namespace cleaned up"
}

# Function to create sample WireGuard config
create_sample_config() {
    echo "Creating sample WireGuard config..."
    
    mkdir -p /etc/wireguard
    cat > $VPN_CONFIG << EOF
[Interface]
PrivateKey = <YOUR_PRIVATE_KEY>
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
AllowedIPs = 0.0.0.0/0
Endpoint = <SERVER_IP>:51820
PersistentKeepalive = 25
EOF
    
    echo "Sample config created at $VPN_CONFIG"
    echo "Please edit with your actual keys and server details"
}

# Main script logic
case "$1" in
    "create")
        create_vpn_namespace
        ;;
    "start")
        start_wireguard_in_namespace
        ;;
    "bridge")
        create_namespace_bridge
        ;;
    "run")
        shift
        run_in_vpn_namespace "$@"
        ;;
    "status")
        check_vpn_status
        ;;
    "test")
        test_vpn_connectivity
        ;;
    "cleanup")
        cleanup_vpn_namespace
        ;;
    "config")
        create_sample_config
        ;;
    "full-setup")
        create_vpn_namespace
        create_namespace_bridge
        echo "VPN namespace setup complete. Edit $VPN_CONFIG and run '$0 start'"
        ;;
    *)
        echo "Usage: $0 {create|start|bridge|run|status|test|cleanup|config|full-setup}"
        echo "  create      - Create VPN namespace"
        echo "  start       - Start WireGuard in namespace"
        echo "  bridge      - Create bridge to namespace"
        echo "  run <cmd>   - Run command in VPN namespace"
        echo "  status      - Show VPN namespace status"
        echo "  test        - Test VPN connectivity"
        echo "  cleanup     - Remove VPN namespace"
        echo "  config      - Create sample WireGuard config"
        echo "  full-setup  - Complete setup (create + bridge)"
        ;;
esac