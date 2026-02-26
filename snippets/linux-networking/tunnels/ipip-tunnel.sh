#!/bin/bash
# IPIP Tunnel Configuration
# Simple IP-over-IP tunnel

LOCAL_IP=192.168.1.10
REMOTE_IP=192.168.1.20
TUNNEL_IP=10.0.0.1/30

# Create IPIP tunnel
ip tunnel add ipip0 mode ipip remote $REMOTE_IP local $LOCAL_IP

# Assign IP address
ip addr add $TUNNEL_IP dev ipip0

# Bring tunnel up
ip link set ipip0 up

# Add route through tunnel
ip route add 10.2.0.0/24 via 10.0.0.2 dev ipip0

# Show tunnel details
echo "IPIP Tunnel Details:"
ip tunnel show ipip0
ip addr show ipip0

# Test connectivity
ping -c 3 10.0.0.2

# Clean up (optional)
# ip tunnel del ipip0