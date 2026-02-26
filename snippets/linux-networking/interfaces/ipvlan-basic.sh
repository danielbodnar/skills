#!/bin/bash
# IPVLAN Basic Configuration
# Creates IPVLAN interfaces sharing the same MAC address

PARENT_IFACE=${1:-eth0}

# Create IPVLAN interfaces in L2 mode
ip link add ipvlan0 link $PARENT_IFACE type ipvlan mode l2
ip link add ipvlan1 link $PARENT_IFACE type ipvlan mode l2

# Assign IP addresses
ip addr add 192.168.1.110/24 dev ipvlan0
ip addr add 192.168.1.111/24 dev ipvlan1

# Bring interfaces up
ip link set ipvlan0 up
ip link set ipvlan1 up

# Create IPVLAN interface in L3 mode
ip link add ipvlan-l3 link $PARENT_IFACE type ipvlan mode l3
ip addr add 10.0.0.1/24 dev ipvlan-l3
ip link set ipvlan-l3 up

# Show interface details
echo "IPVLAN L2 interfaces:"
ip link show ipvlan0
ip link show ipvlan1

echo "IPVLAN L3 interface:"
ip link show ipvlan-l3

# Show MAC addresses (should be the same as parent)
echo "MAC addresses:"
ip link show $PARENT_IFACE | grep "link/ether"
ip link show ipvlan0 | grep "link/ether"
ip link show ipvlan1 | grep "link/ether"

# Clean up (optional)
# ip link del ipvlan0
# ip link del ipvlan1
# ip link del ipvlan-l3