#!/bin/bash
# WireGuard Basic Configuration
# Simple point-to-point VPN setup

WG_INTERFACE=wg0
WG_PORT=51820
PRIVATE_KEY_FILE=/etc/wireguard/private.key
PUBLIC_KEY_FILE=/etc/wireguard/public.key

# Generate keys if they don't exist
if [ ! -f $PRIVATE_KEY_FILE ]; then
    mkdir -p /etc/wireguard
    wg genkey | tee $PRIVATE_KEY_FILE | wg pubkey > $PUBLIC_KEY_FILE
    chmod 600 $PRIVATE_KEY_FILE
    chmod 644 $PUBLIC_KEY_FILE
fi

# Create WireGuard interface
ip link add dev $WG_INTERFACE type wireguard

# Assign IP address
ip address add dev $WG_INTERFACE 10.0.0.1/24

# Configure WireGuard
wg set $WG_INTERFACE listen-port $WG_PORT private-key $PRIVATE_KEY_FILE

# Add peer (replace with actual peer public key and endpoint)
# wg set $WG_INTERFACE peer <PEER_PUBLIC_KEY> allowed-ips 10.0.0.2/32 endpoint <PEER_IP>:51820

# Bring interface up
ip link set up dev $WG_INTERFACE

# Show interface status
echo "WireGuard Interface Status:"
wg show $WG_INTERFACE
ip addr show $WG_INTERFACE

echo "Generated keys:"
echo "Private key file: $PRIVATE_KEY_FILE"
echo "Public key: $(cat $PUBLIC_KEY_FILE)"

# Clean up (optional)
# ip link del $WG_INTERFACE