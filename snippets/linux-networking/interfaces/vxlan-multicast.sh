#!/bin/bash
# VXLAN with Multicast Configuration
# Uses multicast for VTEP discovery

# VXLAN configuration
VNI=200
LOCAL_IP=192.168.1.10
MCAST_GROUP=239.1.1.1
VXLAN_IP=10.0.1.1/24

# Create VXLAN interface with multicast
ip link add vxlan-mc type vxlan \
    id $VNI \
    local $LOCAL_IP \
    group $MCAST_GROUP \
    dev eth0 \
    dstport 4789 \
    learning

# Assign IP address
ip addr add $VXLAN_IP dev vxlan-mc

# Bring interface up
ip link set vxlan-mc up

# Show VXLAN details
echo "VXLAN Multicast Interface Details:"
ip -d link show vxlan-mc

# Show multicast group membership
echo "Multicast Groups:"
ip maddr show dev vxlan-mc

# Show forwarding database
echo "Forwarding Database:"
bridge fdb show dev vxlan-mc

# Clean up (optional)
# ip link del vxlan-mc