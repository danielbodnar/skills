#!/bin/bash
# VETH with Network Namespaces
# Creates VETH pair connecting two network namespaces

# Create network namespaces
ip netns add ns1
ip netns add ns2

# Create VETH pair
ip link add veth0 type veth peer name veth1

# Move interfaces to namespaces
ip link set veth0 netns ns1
ip link set veth1 netns ns2

# Configure interfaces in namespaces
ip netns exec ns1 ip addr add 192.168.100.1/24 dev veth0
ip netns exec ns2 ip addr add 192.168.100.2/24 dev veth1

# Bring up interfaces
ip netns exec ns1 ip link set veth0 up
ip netns exec ns2 ip link set veth1 up

# Bring up loopback in namespaces
ip netns exec ns1 ip link set lo up
ip netns exec ns2 ip link set lo up

# Test connectivity
ip netns exec ns1 ping -c 3 192.168.100.2

# Clean up
# ip netns del ns1
# ip netns del ns2