#!/bin/bash
# VyOS HTTPS REST API Examples using curl
# Requires VyOS rolling release with HTTP API enabled

# Configuration
VYOS_HOST="192.168.1.1"
VYOS_PORT="443"
API_KEY="your-api-key-here"
BASE_URL="https://${VYOS_HOST}:${VYOS_PORT}/api"

# Function to make API calls
vyos_api_call() {
    local endpoint="$1"
    local operation="$2"
    local path="$3"
    local value="$4"
    
    local data="key=${API_KEY}&op=${operation}"
    
    if [ -n "$path" ]; then
        # Convert space-separated path to JSON array format
        local json_path=$(echo "$path" | jq -R 'split(" ")')
        data="${data}&path=${json_path}"
    fi
    
    if [ -n "$value" ]; then
        data="${data}&value=${value}"
    fi
    
    curl -k -X POST \
        "${BASE_URL}/${endpoint}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "$data" \
        2>/dev/null | jq .
}

# Test API connectivity
echo "=== Testing API Connectivity ==="
vyos_api_call "retrieve" "showConfig" "system host-name"

# Configuration Examples
echo -e "\n=== Setting Configuration ==="

# Set hostname
echo "Setting hostname..."
vyos_api_call "configure" "set" "system host-name" "vyos-api-router"

# Configure interface
echo "Configuring eth0 interface..."
vyos_api_call "configure" "set" "interfaces ethernet eth0 address" "192.168.1.1/24"
vyos_api_call "configure" "set" "interfaces ethernet eth0 description" "LAN Interface"

# Configure SSH service
echo "Configuring SSH service..."
vyos_api_call "configure" "set" "service ssh port" "22"

# Configure DNS servers
echo "Configuring DNS servers..."
vyos_api_call "configure" "set" "system name-server" "8.8.8.8"
vyos_api_call "configure" "set" "system name-server" "8.8.4.4"

# Configure DHCP server
echo "Configuring DHCP server..."
vyos_api_call "configure" "set" "service dhcp-server shared-network-name LAN subnet 192.168.1.0/24 default-router" "192.168.1.1"
vyos_api_call "configure" "set" "service dhcp-server shared-network-name LAN subnet 192.168.1.0/24 dns-server" "192.168.1.1"
vyos_api_call "configure" "set" "service dhcp-server shared-network-name LAN subnet 192.168.1.0/24 range 0 start" "192.168.1.100"
vyos_api_call "configure" "set" "service dhcp-server shared-network-name LAN subnet 192.168.1.0/24 range 0 stop" "192.168.1.200"

# Commit configuration
echo -e "\n=== Committing Configuration ==="
vyos_api_call "config-file" "commit"

# Save configuration
echo -e "\n=== Saving Configuration ==="
vyos_api_call "config-file" "save"

# Show configuration examples
echo -e "\n=== Showing Configuration ==="

# Show system configuration
echo "System configuration:"
vyos_api_call "retrieve" "showConfig" "system"

# Show interface configuration
echo "Interface configuration:"
vyos_api_call "retrieve" "showConfig" "interfaces"

# Show service configuration
echo "Service configuration:"
vyos_api_call "retrieve" "showConfig" "service"

# Operational commands
echo -e "\n=== Operational Commands ==="

# Show version
echo "System version:"
vyos_api_call "retrieve" "show" "version"

# Show interfaces
echo "Interface status:"
vyos_api_call "retrieve" "show" "interfaces"

# Show IP route
echo "Routing table:"
vyos_api_call "retrieve" "show" "ip route"

# Show system uptime
echo "System uptime:"
vyos_api_call "retrieve" "show" "system uptime"

# BGP Configuration Example
echo -e "\n=== BGP Configuration Example ==="

configure_bgp() {
    local local_as="$1"
    local neighbor_ip="$2"
    local neighbor_as="$3"
    
    echo "Configuring BGP AS ${local_as}..."
    vyos_api_call "configure" "set" "protocols bgp system-as" "$local_as"
    vyos_api_call "configure" "set" "protocols bgp router-id" "10.0.0.1"
    
    echo "Adding BGP neighbor ${neighbor_ip}..."
    vyos_api_call "configure" "set" "protocols bgp neighbor ${neighbor_ip} remote-as" "$neighbor_as"
    vyos_api_call "configure" "set" "protocols bgp neighbor ${neighbor_ip} description" "API configured neighbor"
    
    echo "Committing BGP configuration..."
    vyos_api_call "config-file" "commit"
    vyos_api_call "config-file" "save"
}

# Uncomment to configure BGP
# configure_bgp "65001" "10.0.0.2" "65002"

# Firewall Configuration Example
echo -e "\n=== Firewall Configuration Example ==="

configure_firewall() {
    echo "Configuring basic firewall rules..."
    
    # Create firewall ruleset
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN default-action" "drop"
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 10 action" "accept"
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 10 state established" "enable"
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 10 state related" "enable"
    
    # Allow SSH
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 20 action" "accept"
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 20 destination port" "22"
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 20 protocol" "tcp"
    
    # Allow ICMP
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 30 action" "accept"
    vyos_api_call "configure" "set" "firewall name OUTSIDE-IN rule 30 protocol" "icmp"
    
    # Apply to interface
    vyos_api_call "configure" "set" "interfaces ethernet eth1 firewall in name" "OUTSIDE-IN"
    
    echo "Committing firewall configuration..."
    vyos_api_call "config-file" "commit"
    vyos_api_call "config-file" "save"
}

# Uncomment to configure firewall
# configure_firewall

# VPN Configuration Example
echo -e "\n=== VPN Configuration Example ==="

configure_wireguard() {
    local interface="$1"
    local listen_port="$2"
    local server_ip="$3"
    
    echo "Configuring WireGuard interface ${interface}..."
    
    # Configure WireGuard interface
    vyos_api_call "configure" "set" "interfaces wireguard ${interface} address" "$server_ip"
    vyos_api_call "configure" "set" "interfaces wireguard ${interface} description" "WireGuard VPN Server"
    vyos_api_call "configure" "set" "interfaces wireguard ${interface} port" "$listen_port"
    
    echo "Committing WireGuard configuration..."
    vyos_api_call "config-file" "commit"
    vyos_api_call "config-file" "save"
    
    echo "WireGuard interface configured. Add peers and keys manually."
}

# Uncomment to configure WireGuard
# configure_wireguard "wg01" "51820" "10.0.0.1/24"

# Configuration deletion example
echo -e "\n=== Configuration Deletion Example ==="

delete_config_example() {
    echo "Deleting example configuration..."
    
    # Delete DHCP server configuration
    vyos_api_call "configure" "delete" "service dhcp-server"
    
    # Delete interface description
    vyos_api_call "configure" "delete" "interfaces ethernet eth0 description"
    
    echo "Committing deletions..."
    vyos_api_call "config-file" "commit"
    vyos_api_call "config-file" "save"
}

# Uncomment to test deletion
# delete_config_example

# Monitoring and status checks
echo -e "\n=== Monitoring Examples ==="

# System resource monitoring
echo "CPU and memory usage:"
vyos_api_call "retrieve" "show" "system cpu"
vyos_api_call "retrieve" "show" "system memory"

# Network monitoring
echo "Interface statistics:"
vyos_api_call "retrieve" "show" "interfaces ethernet statistics"

# Service status
echo "Service status:"
vyos_api_call "retrieve" "show" "system processes"

echo -e "\n=== API Examples Complete ==="
echo "Check the output above for API responses and any errors."
echo "Modify the configuration variables at the top of this script for your environment."