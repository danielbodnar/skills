#!/bin/bash
# VXLAN Basic Configuration
# Creates VXLAN overlay network

# VXLAN configuration
VNI=100
LOCAL_IP=192.168.1.10
REMOTE_IP=192.168.1.20
VXLAN_IP=10.0.0.1/24

# Create VXLAN interface
ip link add vxlan0 type vxlan \
    id $VNI \
    local $LOCAL_IP \
    remote $REMOTE_IP \
    dev eth0 \
    dstport 4789

# Assign IP address to VXLAN interface
ip addr add $VXLAN_IP dev vxlan0

# Bring interface up
ip link set vxlan0 up

# Show VXLAN details
ip -d link show vxlan0

# Show forwarding database
bridge fdb show dev vxlan0

# Test with ping (requires remote VXLAN endpoint)
# ping 10.0.0.2

# Clean up (optional)
# ip link del vxlan0