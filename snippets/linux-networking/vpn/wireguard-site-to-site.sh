#!/bin/bash
# WireGuard Site-to-Site VPN Configuration
# Connects two different networks

# Site A Configuration (192.168.1.0/24)
setup_site_a() {
    echo "Setting up Site A..."
    
    # Create WireGuard interface
    ip link add dev wg-site-a type wireguard
    ip address add dev wg-site-a 10.10.0.1/30
    
    # Configure WireGuard (replace keys with actual values)
    wg set wg-site-a listen-port 51820 private-key /etc/wireguard/site-a-private.key
    wg set wg-site-a peer <SITE_B_PUBLIC_KEY> \
        allowed-ips 10.10.0.2/32,192.168.2.0/24 \
        endpoint <SITE_B_PUBLIC_IP>:51820 \
        persistent-keepalive 25
    
    # Bring interface up
    ip link set up dev wg-site-a
    
    # Add routes for remote network
    ip route add 192.168.2.0/24 via 10.10.0.2 dev wg-site-a
    
    # Enable IP forwarding
    echo 1 > /proc/sys/net/ipv4/ip_forward
    
    # Configure iptables for forwarding
    iptables -A FORWARD -i wg-site-a -j ACCEPT
    iptables -A FORWARD -o wg-site-a -j ACCEPT
}

# Site B Configuration (192.168.2.0/24)
setup_site_b() {
    echo "Setting up Site B..."
    
    # Create WireGuard interface
    ip link add dev wg-site-b type wireguard
    ip address add dev wg-site-b 10.10.0.2/30
    
    # Configure WireGuard (replace keys with actual values)
    wg set wg-site-b listen-port 51820 private-key /etc/wireguard/site-b-private.key
    wg set wg-site-b peer <SITE_A_PUBLIC_KEY> \
        allowed-ips 10.10.0.1/32,192.168.1.0/24 \
        endpoint <SITE_A_PUBLIC_IP>:51820 \
        persistent-keepalive 25
    
    # Bring interface up
    ip link set up dev wg-site-b
    
    # Add routes for remote network
    ip route add 192.168.1.0/24 via 10.10.0.1 dev wg-site-b
    
    # Enable IP forwarding
    echo 1 > /proc/sys/net/ipv4/ip_forward
    
    # Configure iptables for forwarding
    iptables -A FORWARD -i wg-site-b -j ACCEPT
    iptables -A FORWARD -o wg-site-b -j ACCEPT
}

# Generate keys for both sites
generate_keys() {
    mkdir -p /etc/wireguard
    
    # Site A keys
    wg genkey | tee /etc/wireguard/site-a-private.key | wg pubkey > /etc/wireguard/site-a-public.key
    
    # Site B keys
    wg genkey | tee /etc/wireguard/site-b-private.key | wg pubkey > /etc/wireguard/site-b-public.key
    
    chmod 600 /etc/wireguard/*-private.key
    chmod 644 /etc/wireguard/*-public.key
    
    echo "Generated keys:"
    echo "Site A Public Key: $(cat /etc/wireguard/site-a-public.key)"
    echo "Site B Public Key: $(cat /etc/wireguard/site-b-public.key)"
}

# Run based on argument
case "$1" in
    "site-a")
        setup_site_a
        ;;
    "site-b")
        setup_site_b
        ;;
    "keys")
        generate_keys
        ;;
    *)
        echo "Usage: $0 {site-a|site-b|keys}"
        echo "  site-a: Configure as Site A"
        echo "  site-b: Configure as Site B"
        echo "  keys: Generate keys for both sites"
        ;;
esac