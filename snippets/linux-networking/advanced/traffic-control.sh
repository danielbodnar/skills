#!/bin/bash
# Traffic Control (tc) Configuration
# QoS, traffic shaping, and bandwidth management

INTERFACE=${1:-eth0}
echo "Configuring traffic control on interface: $INTERFACE"

# Basic bandwidth limiting
setup_basic_shaping() {
    echo "=== Basic Traffic Shaping ==="
    
    # Add root qdisc (HTB - Hierarchical Token Bucket)
    tc qdisc add dev $INTERFACE root handle 1: htb default 30
    
    # Create main class (total bandwidth)
    tc class add dev $INTERFACE parent 1: classid 1:1 htb rate 100mbit
    
    # Create child classes
    tc class add dev $INTERFACE parent 1:1 classid 1:10 htb rate 50mbit ceil 80mbit
    tc class add dev $INTERFACE parent 1:1 classid 1:20 htb rate 30mbit ceil 60mbit
    tc class add dev $INTERFACE parent 1:1 classid 1:30 htb rate 20mbit ceil 40mbit
    
    # Add leaf qdiscs
    tc qdisc add dev $INTERFACE parent 1:10 handle 10: sfq perturb 10
    tc qdisc add dev $INTERFACE parent 1:20 handle 20: sfq perturb 10
    tc qdisc add dev $INTERFACE parent 1:30 handle 30: sfq perturb 10
    
    echo "Basic shaping configured"
}

# Advanced priority-based shaping
setup_priority_shaping() {
    echo "=== Priority-based Traffic Shaping ==="
    
    # Clear existing rules
    tc qdisc del dev $INTERFACE root 2>/dev/null
    
    # Root qdisc with HTB
    tc qdisc add dev $INTERFACE root handle 1: htb default 40
    
    # Root class
    tc class add dev $INTERFACE parent 1: classid 1:1 htb rate 100mbit
    
    # High priority (50% guaranteed, can use up to 90%)
    tc class add dev $INTERFACE parent 1:1 classid 1:10 htb rate 50mbit ceil 90mbit prio 1
    
    # Medium priority (30% guaranteed, can use up to 70%)
    tc class add dev $INTERFACE parent 1:1 classid 1:20 htb rate 30mbit ceil 70mbit prio 2
    
    # Low priority (15% guaranteed, can use up to 50%)
    tc class add dev $INTERFACE parent 1:1 classid 1:30 htb rate 15mbit ceil 50mbit prio 3
    
    # Default class (5% guaranteed, can use up to 30%)
    tc class add dev $INTERFACE parent 1:1 classid 1:40 htb rate 5mbit ceil 30mbit prio 4
    
    # Add SFQ to leaf classes for fairness
    tc qdisc add dev $INTERFACE parent 1:10 handle 10: sfq perturb 10
    tc qdisc add dev $INTERFACE parent 1:20 handle 20: sfq perturb 10
    tc qdisc add dev $INTERFACE parent 1:30 handle 30: sfq perturb 10
    tc qdisc add dev $INTERFACE parent 1:40 handle 40: sfq perturb 10
    
    echo "Priority shaping configured"
}

# Filter configuration
setup_filters() {
    echo "=== Setting up Traffic Filters ==="
    
    # SSH traffic - high priority
    tc filter add dev $INTERFACE parent 1: protocol ip prio 1 u32 \
        match ip dport 22 0xffff flowid 1:10
    
    # HTTP/HTTPS traffic - medium priority
    tc filter add dev $INTERFACE parent 1: protocol ip prio 2 u32 \
        match ip dport 80 0xffff flowid 1:20
    tc filter add dev $INTERFACE parent 1: protocol ip prio 2 u32 \
        match ip dport 443 0xffff flowid 1:20
    
    # FTP traffic - low priority
    tc filter add dev $INTERFACE parent 1: protocol ip prio 3 u32 \
        match ip dport 21 0xffff flowid 1:30
    
    # Mark-based classification
    tc filter add dev $INTERFACE parent 1: protocol ip prio 4 handle 1 fw flowid 1:10
    tc filter add dev $INTERFACE parent 1: protocol ip prio 4 handle 2 fw flowid 1:20
    tc filter add dev $INTERFACE parent 1: protocol ip prio 4 handle 3 fw flowid 1:30
    
    echo "Filters configured"
}

# Ingress traffic control
setup_ingress_control() {
    echo "=== Ingress Traffic Control ==="
    
    # Add ingress qdisc
    tc qdisc add dev $INTERFACE handle ffff: ingress
    
    # Rate limiting for incoming traffic
    tc filter add dev $INTERFACE parent ffff: protocol ip prio 1 u32 \
        match ip src 0.0.0.0/0 police rate 50mbit burst 10k drop flowid :1
    
    echo "Ingress control configured"
}

# IFB (Intermediate Functional Block) for ingress shaping
setup_ifb_shaping() {
    echo "=== IFB Ingress Shaping ==="
    
    # Load IFB module
    modprobe ifb numifbs=1
    
    # Bring up IFB interface
    ip link set dev ifb0 up
    
    # Redirect ingress traffic to IFB
    tc qdisc add dev $INTERFACE handle ffff: ingress
    tc filter add dev $INTERFACE parent ffff: protocol ip u32 \
        match u32 0 0 action mirred egress redirect dev ifb0
    
    # Shape traffic on IFB (same as egress shaping)
    tc qdisc add dev ifb0 root handle 1: htb default 30
    tc class add dev ifb0 parent 1: classid 1:1 htb rate 50mbit
    tc class add dev ifb0 parent 1:1 classid 1:10 htb rate 25mbit ceil 40mbit
    tc class add dev ifb0 parent 1:1 classid 1:20 htb rate 15mbit ceil 30mbit
    tc class add dev ifb0 parent 1:1 classid 1:30 htb rate 10mbit ceil 20mbit
    
    echo "IFB shaping configured"
}

# Netem (Network Emulation) for testing
setup_netem() {
    echo "=== Network Emulation (Testing) ==="
    
    # Add delay
    tc qdisc add dev $INTERFACE root netem delay 100ms
    
    # Add packet loss
    # tc qdisc change dev $INTERFACE root netem delay 100ms loss 1%
    
    # Add jitter
    # tc qdisc change dev $INTERFACE root netem delay 100ms 20ms
    
    # Add bandwidth limitation with delay
    # tc qdisc add dev $INTERFACE root handle 1: netem delay 100ms
    # tc qdisc add dev $INTERFACE parent 1:1 handle 10: tbf rate 1mbit buffer 1600 limit 3000
    
    echo "Network emulation configured"
}

# Show traffic control configuration
show_tc_config() {
    echo "=== Traffic Control Configuration ==="
    
    echo "Qdiscs:"
    tc qdisc show dev $INTERFACE
    
    echo -e "\nClasses:"
    tc class show dev $INTERFACE
    
    echo -e "\nFilters:"
    tc filter show dev $INTERFACE
    
    echo -e "\nStatistics:"
    tc -s class show dev $INTERFACE
}

# Clean up traffic control
cleanup_tc() {
    echo "Cleaning up traffic control configuration..."
    
    # Remove all qdiscs (this removes classes and filters too)
    tc qdisc del dev $INTERFACE root 2>/dev/null
    tc qdisc del dev $INTERFACE ingress 2>/dev/null
    
    # Clean up IFB if used
    tc qdisc del dev ifb0 root 2>/dev/null
    ip link set dev ifb0 down 2>/dev/null
    
    echo "Traffic control cleanup complete"
}

# Main script logic
case "$1" in
    "basic")
        setup_basic_shaping
        setup_filters
        ;;
    "priority")
        setup_priority_shaping
        setup_filters
        ;;
    "ingress")
        setup_ingress_control
        ;;
    "ifb")
        setup_ifb_shaping
        ;;
    "netem")
        setup_netem
        ;;
    "show")
        show_tc_config
        ;;
    "clean")
        cleanup_tc
        ;;
    *)
        echo "Usage: $0 [interface] {basic|priority|ingress|ifb|netem|show|clean}"
        echo "  basic    - Basic HTB traffic shaping"
        echo "  priority - Priority-based traffic shaping"
        echo "  ingress  - Ingress traffic control"
        echo "  ifb      - IFB-based ingress shaping"
        echo "  netem    - Network emulation for testing"
        echo "  show     - Show current configuration"
        echo "  clean    - Remove all traffic control rules"
        echo ""
        echo "Example: $0 eth0 priority"
        ;;
esac