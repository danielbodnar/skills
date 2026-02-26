#!/bin/bash
# MACVLAN Different Modes Demonstration

PARENT_IFACE=${1:-eth0}

echo "Creating MACVLAN interfaces in different modes..."

# Bridge mode - interfaces can communicate with each other
ip link add macvlan-bridge link $PARENT_IFACE type macvlan mode bridge
ip addr add 192.168.1.100/24 dev macvlan-bridge
ip link set macvlan-bridge up

# VEPA mode - Virtual Ethernet Port Aggregator
ip link add macvlan-vepa link $PARENT_IFACE type macvlan mode vepa
ip addr add 192.168.1.101/24 dev macvlan-vepa
ip link set macvlan-vepa up

# Private mode - no communication between interfaces
ip link add macvlan-private link $PARENT_IFACE type macvlan mode private
ip addr add 192.168.1.102/24 dev macvlan-private
ip link set macvlan-private up

# Passthru mode - single interface with parent MAC
ip link add macvlan-passthru link $PARENT_IFACE type macvlan mode passthru
ip addr add 192.168.1.103/24 dev macvlan-passthru
ip link set macvlan-passthru up

# Source mode - source-based filtering
ip link add macvlan-source link $PARENT_IFACE type macvlan mode source
ip link set macvlan-source type macvlan macaddr add 02:00:00:00:00:01
ip addr add 192.168.1.104/24 dev macvlan-source
ip link set macvlan-source up

echo "MACVLAN interfaces created:"
ip link show type macvlan

# Clean up function
cleanup() {
    ip link del macvlan-bridge 2>/dev/null
    ip link del macvlan-vepa 2>/dev/null
    ip link del macvlan-private 2>/dev/null
    ip link del macvlan-passthru 2>/dev/null
    ip link del macvlan-source 2>/dev/null
}

# Uncomment to clean up
# cleanup