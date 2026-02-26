#!/bin/bash
# Open vSwitch Basic Configuration
# Software-defined networking with OVS

# Install Open vSwitch (Ubuntu/Debian)
# sudo apt install openvswitch-switch

# Start OVS service
sudo systemctl start openvswitch-switch
sudo systemctl enable openvswitch-switch

# Create OVS bridge
ovs-vsctl add-br ovs-br0

# Add physical interface to bridge
ovs-vsctl add-port ovs-br0 eth0

# Create internal port
ovs-vsctl add-port ovs-br0 ovs-int0 -- set interface ovs-int0 type=internal

# Assign IP to internal port
ip addr add 192.168.100.1/24 dev ovs-int0
ip link set ovs-int0 up

# Create VXLAN tunnel
ovs-vsctl add-port ovs-br0 vxlan0 -- set interface vxlan0 type=vxlan options:remote_ip=192.168.1.20

# Show OVS configuration
echo "=== OVS Bridge Configuration ==="
ovs-vsctl show

echo "=== OVS Bridge Details ==="
ovs-vsctl list-br

echo "=== Port Details ==="
ovs-vsctl list-ports ovs-br0

# Add OpenFlow rules
echo "=== Adding OpenFlow Rules ==="

# Allow all traffic between ports 1 and 2
ovs-ofctl add-flow ovs-br0 "in_port=1,actions=output:2"
ovs-ofctl add-flow ovs-br0 "in_port=2,actions=output:1"

# Drop all other traffic
ovs-ofctl add-flow ovs-br0 "priority=0,actions=drop"

# Show flow table
echo "=== Flow Table ==="
ovs-ofctl dump-flows ovs-br0

# VLAN configuration
echo "=== VLAN Configuration ==="

# Add VLAN tags
ovs-vsctl set port ovs-int0 tag=100
ovs-vsctl add-port ovs-br0 veth0 tag=200

# Trunk port (allows multiple VLANs)
ovs-vsctl set port eth0 trunk=100,200,300

# Show VLAN configuration
ovs-vsctl list port

# Quality of Service (QoS)
echo "=== QoS Configuration ==="

# Create QoS record
ovs-vsctl -- set port ovs-int0 qos=@newqos -- \
    --id=@newqos create qos type=linux-htb other-config:max-rate=1000000 \
    queues=0=@q0,1=@q1 -- \
    --id=@q0 create queue other-config:min-rate=100000 other-config:max-rate=500000 -- \
    --id=@q1 create queue other-config:min-rate=200000 other-config:max-rate=800000

# Show QoS configuration
ovs-vsctl list qos
ovs-vsctl list queue

# Cleanup function
cleanup_ovs() {
    echo "Cleaning up OVS configuration..."
    
    # Remove all flows
    ovs-ofctl del-flows ovs-br0
    
    # Remove ports
    ovs-vsctl del-port ovs-br0 vxlan0 2>/dev/null
    ovs-vsctl del-port ovs-br0 ovs-int0 2>/dev/null
    ovs-vsctl del-port ovs-br0 eth0 2>/dev/null
    
    # Remove bridge
    ovs-vsctl del-br ovs-br0
    
    echo "OVS cleanup complete"
}

# Uncomment to clean up
# cleanup_ovs