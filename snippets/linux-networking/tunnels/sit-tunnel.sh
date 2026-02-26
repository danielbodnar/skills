#!/bin/bash
# SIT (Simple Internet Transition) Tunnel Configuration
# IPv6-over-IPv4 tunnel

LOCAL_IPv4=192.168.1.10
REMOTE_IPv4=192.168.1.20
LOCAL_IPv6=2001:db8:1::1/64
REMOTE_IPv6=2001:db8:1::2

# Create SIT tunnel
ip tunnel add sit0 mode sit remote $REMOTE_IPv4 local $LOCAL_IPv4

# Assign IPv6 address
ip addr add $LOCAL_IPv6 dev sit0

# Bring tunnel up
ip link set sit0 up

# Add IPv6 route through tunnel
ip -6 route add 2001:db8:2::/64 via $REMOTE_IPv6 dev sit0

# Show tunnel details
echo "SIT Tunnel Details:"
ip tunnel show sit0
ip -6 addr show sit0

# Test IPv6 connectivity
ping6 -c 3 $REMOTE_IPv6

# SIT tunnel with any mode (allows multiple protocols)
ip tunnel add sit1 mode sit remote $REMOTE_IPv4 local $LOCAL_IPv4 mode any
ip addr add 2001:db8:3::1/64 dev sit1
ip link set sit1 up

echo "SIT tunnels:"
ip tunnel show | grep sit

# Clean up (optional)
# ip tunnel del sit0
# ip tunnel del sit1