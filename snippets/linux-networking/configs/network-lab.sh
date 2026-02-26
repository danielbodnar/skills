#!/bin/bash
# Complete Network Lab Setup
# Creates a complex network topology for testing

LAB_NAME="netlab"

# Function to create network lab
create_network_lab() {
    echo "Creating network lab: $LAB_NAME"
    
    # Create namespaces
    ip netns add ${LAB_NAME}-router
    ip netns add ${LAB_NAME}-client1
    ip netns add ${LAB_NAME}-client2
    ip netns add ${LAB_NAME}-server
    
    # Create bridges
    ip link add ${LAB_NAME}-br0 type bridge
    ip link add ${LAB_NAME}-br1 type bridge
    
    # Bring bridges up
    ip link set ${LAB_NAME}-br0 up
    ip link set ${LAB_NAME}-br1 up
    
    # Create VETH pairs for router connections
    ip link add veth-r-br0 type veth peer name veth-br0-r
    ip link add veth-r-br1 type veth peer name veth-br1-r
    
    # Create VETH pairs for clients
    ip link add veth-c1-br0 type veth peer name veth-br0-c1
    ip link add veth-c2-br0 type veth peer name veth-br0-c2
    ip link add veth-s-br1 type veth peer name veth-br1-s
    
    # Connect bridges
    ip link set veth-br0-r master ${LAB_NAME}-br0
    ip link set veth-br0-c1 master ${LAB_NAME}-br0
    ip link set veth-br0-c2 master ${LAB_NAME}-br0
    ip link set veth-br1-r master ${LAB_NAME}-br1
    ip link set veth-br1-s master ${LAB_NAME}-br1
    
    # Move interfaces to namespaces
    ip link set veth-r-br0 netns ${LAB_NAME}-router
    ip link set veth-r-br1 netns ${LAB_NAME}-router
    ip link set veth-c1-br0 netns ${LAB_NAME}-client1
    ip link set veth-c2-br0 netns ${LAB_NAME}-client2
    ip link set veth-s-br1 netns ${LAB_NAME}-server
    
    # Bring up bridge interfaces
    ip link set veth-br0-r up
    ip link set veth-br0-c1 up
    ip link set veth-br0-c2 up
    ip link set veth-br1-r up
    ip link set veth-br1-s up
    
    # Configure router namespace
    ip netns exec ${LAB_NAME}-router ip link set lo up
    ip netns exec ${LAB_NAME}-router ip addr add 192.168.1.1/24 dev veth-r-br0
    ip netns exec ${LAB_NAME}-router ip addr add 192.168.2.1/24 dev veth-r-br1
    ip netns exec ${LAB_NAME}-router ip link set veth-r-br0 up
    ip netns exec ${LAB_NAME}-router ip link set veth-r-br1 up
    ip netns exec ${LAB_NAME}-router sysctl -w net.ipv4.ip_forward=1
    
    # Configure client1 namespace
    ip netns exec ${LAB_NAME}-client1 ip link set lo up
    ip netns exec ${LAB_NAME}-client1 ip addr add 192.168.1.10/24 dev veth-c1-br0
    ip netns exec ${LAB_NAME}-client1 ip link set veth-c1-br0 up
    ip netns exec ${LAB_NAME}-client1 ip route add default via 192.168.1.1
    
    # Configure client2 namespace
    ip netns exec ${LAB_NAME}-client2 ip link set lo up
    ip netns exec ${LAB_NAME}-client2 ip addr add 192.168.1.11/24 dev veth-c2-br0
    ip netns exec ${LAB_NAME}-client2 ip link set veth-c2-br0 up
    ip netns exec ${LAB_NAME}-client2 ip route add default via 192.168.1.1
    
    # Configure server namespace
    ip netns exec ${LAB_NAME}-server ip link set lo up
    ip netns exec ${LAB_NAME}-server ip addr add 192.168.2.10/24 dev veth-s-br1
    ip netns exec ${LAB_NAME}-server ip link set veth-s-br1 up
    ip netns exec ${LAB_NAME}-server ip route add default via 192.168.2.1
    
    echo "Network lab created successfully"
}

# Function to add VLAN support
add_vlan_support() {
    echo "Adding VLAN support to lab..."
    
    # Create VLAN interfaces in router
    ip netns exec ${LAB_NAME}-router ip link add link veth-r-br0 name veth-r-br0.100 type vlan id 100
    ip netns exec ${LAB_NAME}-router ip link add link veth-r-br0 name veth-r-br0.200 type vlan id 200
    
    ip netns exec ${LAB_NAME}-router ip addr add 192.168.100.1/24 dev veth-r-br0.100
    ip netns exec ${LAB_NAME}-router ip addr add 192.168.200.1/24 dev veth-r-br0.200
    
    ip netns exec ${LAB_NAME}-router ip link set veth-r-br0.100 up
    ip netns exec ${LAB_NAME}-router ip link set veth-r-br0.200 up
    
    # Create VLAN interfaces in clients
    ip netns exec ${LAB_NAME}-client1 ip link add link veth-c1-br0 name veth-c1-br0.100 type vlan id 100
    ip netns exec ${LAB_NAME}-client1 ip addr add 192.168.100.10/24 dev veth-c1-br0.100
    ip netns exec ${LAB_NAME}-client1 ip link set veth-c1-br0.100 up
    
    ip netns exec ${LAB_NAME}-client2 ip link add link veth-c2-br0 name veth-c2-br0.200 type vlan id 200
    ip netns exec ${LAB_NAME}-client2 ip addr add 192.168.200.10/24 dev veth-c2-br0.200
    ip netns exec ${LAB_NAME}-client2 ip link set veth-c2-br0.200 up
    
    echo "VLAN support added"
}

# Function to add VPN tunnel
add_vpn_tunnel() {
    echo "Adding VPN tunnel between router and server..."
    
    # Create GRE tunnel
    ip netns exec ${LAB_NAME}-router ip tunnel add gre-server mode gre \
        remote 192.168.2.10 local 192.168.2.1
    ip netns exec ${LAB_NAME}-server ip tunnel add gre-router mode gre \
        remote 192.168.2.1 local 192.168.2.10
    
    # Configure tunnel IPs
    ip netns exec ${LAB_NAME}-router ip addr add 10.0.0.1/30 dev gre-server
    ip netns exec ${LAB_NAME}-server ip addr add 10.0.0.2/30 dev gre-router
    
    # Bring tunnels up
    ip netns exec ${LAB_NAME}-router ip link set gre-server up
    ip netns exec ${LAB_NAME}-server ip link set gre-router up
    
    # Add routes through tunnel
    ip netns exec ${LAB_NAME}-router ip route add 10.1.0.0/24 via 10.0.0.2 dev gre-server
    ip netns exec ${LAB_NAME}-server ip route add 192.168.1.0/24 via 10.0.0.1 dev gre-router
    
    echo "VPN tunnel added"
}

# Function to add VXLAN overlay
add_vxlan_overlay() {
    echo "Adding VXLAN overlay network..."
    
    # Create VXLAN interfaces
    ip netns exec ${LAB_NAME}-router ip link add vxlan100 type vxlan \
        id 100 local 192.168.2.1 group 239.1.1.1 dev veth-r-br1 dstport 4789
    ip netns exec ${LAB_NAME}-server ip link add vxlan100 type vxlan \
        id 100 local 192.168.2.10 group 239.1.1.1 dev veth-s-br1 dstport 4789
    
    # Create bridge for VXLAN
    ip netns exec ${LAB_NAME}-router ip link add vxlan-br type bridge
    ip netns exec ${LAB_NAME}-server ip link add vxlan-br type bridge
    
    # Add VXLAN to bridge
    ip netns exec ${LAB_NAME}-router ip link set vxlan100 master vxlan-br
    ip netns exec ${LAB_NAME}-server ip link set vxlan100 master vxlan-br
    
    # Bring interfaces up
    ip netns exec ${LAB_NAME}-router ip link set vxlan100 up
    ip netns exec ${LAB_NAME}-router ip link set vxlan-br up
    ip netns exec ${LAB_NAME}-server ip link set vxlan100 up
    ip netns exec ${LAB_NAME}-server ip link set vxlan-br up
    
    # Assign IPs to bridge
    ip netns exec ${LAB_NAME}-router ip addr add 10.100.0.1/24 dev vxlan-br
    ip netns exec ${LAB_NAME}-server ip addr add 10.100.0.10/24 dev vxlan-br
    
    echo "VXLAN overlay added"
}

# Function to test connectivity
test_lab_connectivity() {
    echo "Testing lab connectivity..."
    
    echo "=== Basic Connectivity ==="
    echo "Client1 -> Router:"
    ip netns exec ${LAB_NAME}-client1 ping -c 2 192.168.1.1
    
    echo "Client1 -> Server (via router):"
    ip netns exec ${LAB_NAME}-client1 ping -c 2 192.168.2.10
    
    echo "=== VLAN Connectivity (if configured) ==="
    echo "Client1 VLAN 100 -> Router VLAN 100:"
    ip netns exec ${LAB_NAME}-client1 ping -c 2 192.168.100.1 2>/dev/null || echo "VLAN not configured"
    
    echo "=== VPN Tunnel (if configured) ==="
    echo "Router -> Server via GRE:"
    ip netns exec ${LAB_NAME}-router ping -c 2 10.0.0.2 2>/dev/null || echo "GRE tunnel not configured"
    
    echo "=== VXLAN Overlay (if configured) ==="
    echo "Router -> Server via VXLAN:"
    ip netns exec ${LAB_NAME}-router ping -c 2 10.100.0.10 2>/dev/null || echo "VXLAN not configured"
}

# Function to show lab status
show_lab_status() {
    echo "=== Network Lab Status ==="
    
    echo "Namespaces:"
    ip netns list | grep ${LAB_NAME}
    
    echo -e "\nBridges:"
    ip link show type bridge | grep ${LAB_NAME}
    
    echo -e "\nRouter configuration:"
    ip netns exec ${LAB_NAME}-router ip addr show
    
    echo -e "\nClient1 configuration:"
    ip netns exec ${LAB_NAME}-client1 ip addr show
    
    echo -e "\nServer configuration:"
    ip netns exec ${LAB_NAME}-server ip addr show
}

# Function to cleanup lab
cleanup_lab() {
    echo "Cleaning up network lab..."
    
    # Remove namespaces (this also removes their interfaces)
    ip netns del ${LAB_NAME}-router 2>/dev/null
    ip netns del ${LAB_NAME}-client1 2>/dev/null
    ip netns del ${LAB_NAME}-client2 2>/dev/null
    ip netns del ${LAB_NAME}-server 2>/dev/null
    
    # Remove bridges
    ip link del ${LAB_NAME}-br0 2>/dev/null
    ip link del ${LAB_NAME}-br1 2>/dev/null
    
    echo "Network lab cleaned up"
}

# Main script logic
case "$1" in
    "create")
        create_network_lab
        ;;
    "vlan")
        add_vlan_support
        ;;
    "vpn")
        add_vpn_tunnel
        ;;
    "vxlan")
        add_vxlan_overlay
        ;;
    "test")
        test_lab_connectivity
        ;;
    "status")
        show_lab_status
        ;;
    "cleanup")
        cleanup_lab
        ;;
    "full")
        create_network_lab
        add_vlan_support
        add_vpn_tunnel
        add_vxlan_overlay
        echo "Full lab setup complete!"
        ;;
    *)
        echo "Usage: $0 {create|vlan|vpn|vxlan|test|status|cleanup|full}"
        echo "  create  - Create basic lab topology"
        echo "  vlan    - Add VLAN support"
        echo "  vpn     - Add GRE VPN tunnel"
        echo "  vxlan   - Add VXLAN overlay"
        echo "  test    - Test connectivity"
        echo "  status  - Show lab status"
        echo "  cleanup - Remove lab"
        echo "  full    - Create complete lab with all features"
        ;;
esac