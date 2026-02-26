#!/bin/bash
# MACVLAN Basic Configuration
# Creates MACVLAN interfaces on physical interface

PARENT_IFACE=${1:-eth0}

# Create MACVLAN interfaces in bridge mode
ip link add macvlan0 link $PARENT_IFACE type macvlan mode bridge
ip link add macvlan1 link $PARENT_IFACE type macvlan mode bridge

# Assign IP addresses (adjust for your network)
ip addr add 192.168.1.100/24 dev macvlan0
ip addr add 192.168.1.101/24 dev macvlan1

# Bring interfaces up
ip link set macvlan0 up
ip link set macvlan1 up

# Add default routes if needed
# ip route add default via 192.168.1.1 dev macvlan0

# Show interface details
ip link show type macvlan
ip addr show macvlan0
ip addr show macvlan1

# Clean up (optional)
# ip link del macvlan0
# ip link del macvlan1