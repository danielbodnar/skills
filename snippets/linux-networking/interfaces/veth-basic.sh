#!/bin/bash
# VETH (Virtual Ethernet) Basic Configuration
# Creates a pair of virtual Ethernet interfaces

# Create VETH pair
ip link add veth0 type veth peer name veth1

# Assign IP addresses
ip addr add 192.168.100.1/24 dev veth0
ip addr add 192.168.100.2/24 dev veth1

# Bring interfaces up
ip link set veth0 up
ip link set veth1 up

# Test connectivity
ping -c 3 192.168.100.2

# Clean up (optional)
# ip link del veth0  # This automatically deletes veth1 as well