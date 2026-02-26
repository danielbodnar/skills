#!/bin/bash
# GRE Tunnel Configuration
# Creates Generic Routing Encapsulation tunnel

LOCAL_IP=192.168.1.10
REMOTE_IP=192.168.1.20
TUNNEL_IP=10.0.0.1/30
REMOTE_TUNNEL_IP=10.0.0.2

# Create GRE tunnel
ip tunnel add gre0 mode gre remote $REMOTE_IP local $LOCAL_IP

# Assign IP address to tunnel
ip addr add $TUNNEL_IP dev gre0

# Bring tunnel up
ip link set gre0 up

# Add route through tunnel
ip route add 10.1.0.0/24 via $REMOTE_TUNNEL_IP dev gre0

# Show tunnel details
ip tunnel show gre0
ip addr show gre0

# Test tunnel connectivity
ping -c 3 $REMOTE_TUNNEL_IP

# GRE with key (for security/identification)
ip tunnel add gre1 mode gre remote $REMOTE_IP local $LOCAL_IP key 1234
ip addr add 10.0.1.1/30 dev gre1
ip link set gre1 up

echo "GRE tunnels created:"
ip tunnel show

# Clean up (optional)
# ip tunnel del gre0
# ip tunnel del gre1