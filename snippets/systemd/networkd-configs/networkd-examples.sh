#!/bin/bash
# systemd-networkd Configuration Examples
# Comprehensive guide for network management with systemd-networkd

set -euo pipefail

# Network configuration paths
NETWORKD_CONFIG_DIR="/etc/systemd/network"
BACKUP_DIR="/var/backups/networkd-configs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup existing configuration
backup_existing_config() {
    log "Backing up existing networkd configuration"
    
    sudo mkdir -p "${BACKUP_DIR}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    if [[ -d "${NETWORKD_CONFIG_DIR}" ]]; then
        sudo cp -r "${NETWORKD_CONFIG_DIR}" "${BACKUP_DIR}/network_${timestamp}"
        log "Backup created: ${BACKUP_DIR}/network_${timestamp}"
    fi
}

# Basic DHCP configuration
create_dhcp_config() {
    local interface="$1"
    
    log "Creating DHCP configuration for interface: ${interface}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # Basic DHCP configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${interface}-dhcp.network" > /dev/null
[Match]
Name=${interface}

[Network]
DHCP=yes
IPForward=yes

[DHCPv4]
UseDNS=yes
UseRoutes=yes
UseMTU=yes
UseHostname=yes
UseNTP=yes

[DHCPv6]
UseDNS=yes
UseHostname=yes
UseNTP=yes
EOF

    log "DHCP configuration created for ${interface}"
}

# Static IP configuration
create_static_config() {
    local interface="$1"
    local address="$2"
    local gateway="$3"
    local dns="$4"
    
    log "Creating static IP configuration for interface: ${interface}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${interface}-static.network" > /dev/null
[Match]
Name=${interface}

[Network]
Address=${address}
Gateway=${gateway}
DNS=${dns}
IPForward=yes

[Link]
RequiredForOnline=yes
EOF

    log "Static IP configuration created for ${interface}"
}

# Bridge configuration
create_bridge_config() {
    local bridge_name="$1"
    local bridge_ip="$2"
    shift 2
    local interfaces=("$@")
    
    log "Creating bridge configuration: ${bridge_name}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # Bridge device configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${bridge_name}.netdev" > /dev/null
[NetDev]
Name=${bridge_name}
Kind=bridge

[Bridge]
STP=yes
DefaultPVID=1
VLANFiltering=yes
EOF

    # Bridge network configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/20-${bridge_name}.network" > /dev/null
[Match]
Name=${bridge_name}

[Network]
Address=${bridge_ip}
IPMasquerade=yes
IPForward=yes
DHCPServer=yes

[DHCPServer]
PoolOffset=100
PoolSize=100
DefaultLeaseTimeSec=3600
MaxLeaseTimeSec=7200
DNS=8.8.8.8,8.8.4.4
EOF

    # Configure member interfaces
    for interface in "${interfaces[@]}"; do
        cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/30-${interface}-bridge.network" > /dev/null
[Match]
Name=${interface}

[Network]
Bridge=${bridge_name}
ConfigureWithoutCarrier=yes

[Link]
RequiredForOnline=no
EOF
    done
    
    log "Bridge configuration created for ${bridge_name}"
}

# VLAN configuration
create_vlan_config() {
    local base_interface="$1"
    local vlan_id="$2"
    local vlan_ip="$3"
    
    log "Creating VLAN configuration: ${base_interface}.${vlan_id}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # VLAN device configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-vlan${vlan_id}.netdev" > /dev/null
[NetDev]
Name=${base_interface}.${vlan_id}
Kind=vlan

[VLAN]
Id=${vlan_id}
EOF

    # VLAN network configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/20-vlan${vlan_id}.network" > /dev/null
[Match]
Name=${base_interface}.${vlan_id}

[Network]
Address=${vlan_ip}
IPForward=yes

[Link]
RequiredForOnline=yes
EOF

    # Bind VLAN to base interface
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/30-${base_interface}-vlan.network" > /dev/null
[Match]
Name=${base_interface}

[Network]
VLAN=${base_interface}.${vlan_id}
LinkLocalAddressing=no
LLDP=yes
EmitLLDP=yes

[Link]
RequiredForOnline=carrier
EOF

    log "VLAN configuration created for ${base_interface}.${vlan_id}"
}

# Bonding configuration
create_bond_config() {
    local bond_name="$1"
    local bond_mode="$2"
    local bond_ip="$3"
    shift 3
    local interfaces=("$@")
    
    log "Creating bonding configuration: ${bond_name}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # Bond device configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${bond_name}.netdev" > /dev/null
[NetDev]
Name=${bond_name}
Kind=bond

[Bond]
Mode=${bond_mode}
MIIMonitorSec=100
UpDelaySec=200
DownDelaySec=200
EOF

    # Bond network configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/20-${bond_name}.network" > /dev/null
[Match]
Name=${bond_name}

[Network]
Address=${bond_ip}
IPForward=yes

[Link]
RequiredForOnline=yes
EOF

    # Configure slave interfaces
    for interface in "${interfaces[@]}"; do
        cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/30-${interface}-bond.network" > /dev/null
[Match]
Name=${interface}

[Network]
Bond=${bond_name}

[Link]
RequiredForOnline=no
EOF
    done
    
    log "Bonding configuration created for ${bond_name}"
}

# Tunnel configuration (VXLAN)
create_vxlan_config() {
    local vxlan_name="$1"
    local vni="$2"
    local local_ip="$3"
    local remote_ip="$4"
    local vxlan_ip="$5"
    
    log "Creating VXLAN configuration: ${vxlan_name}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # VXLAN device configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${vxlan_name}.netdev" > /dev/null
[NetDev]
Name=${vxlan_name}
Kind=vxlan

[VXLAN]
VNI=${vni}
Local=${local_ip}
Remote=${remote_ip}
DestinationPort=4789
EOF

    # VXLAN network configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/20-${vxlan_name}.network" > /dev/null
[Match]
Name=${vxlan_name}

[Network]
Address=${vxlan_ip}
IPForward=yes

[Link]
RequiredForOnline=yes
EOF

    log "VXLAN configuration created for ${vxlan_name}"
}

# Wireguard VPN configuration
create_wireguard_config() {
    local wg_interface="$1"
    local wg_ip="$2"
    local private_key="$3"
    local peer_public_key="$4"
    local peer_endpoint="$5"
    local allowed_ips="$6"
    
    log "Creating WireGuard configuration: ${wg_interface}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # WireGuard device configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${wg_interface}.netdev" > /dev/null
[NetDev]
Name=${wg_interface}
Kind=wireguard

[WireGuard]
PrivateKey=${private_key}
ListenPort=51820

[WireGuardPeer]
PublicKey=${peer_public_key}
Endpoint=${peer_endpoint}
AllowedIPs=${allowed_ips}
PersistentKeepalive=25
EOF

    # WireGuard network configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/20-${wg_interface}.network" > /dev/null
[Match]
Name=${wg_interface}

[Network]
Address=${wg_ip}
IPForward=yes

[Route]
Destination=${allowed_ips}
Scope=link

[Link]
RequiredForOnline=no
EOF

    log "WireGuard configuration created for ${wg_interface}"
}

# Container networking setup
create_container_network() {
    local container_bridge="$1"
    local container_network="$2"
    
    log "Creating container networking configuration"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # Container bridge device
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${container_bridge}.netdev" > /dev/null
[NetDev]
Name=${container_bridge}
Kind=bridge

[Bridge]
STP=no
DefaultPVID=none
VLANFiltering=no
EOF

    # Container bridge network
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/20-${container_bridge}.network" > /dev/null
[Match]
Name=${container_bridge}

[Network]
Address=${container_network}
IPMasquerade=yes
IPForward=yes
DHCPServer=yes

[DHCPServer]
PoolOffset=10
PoolSize=240
DefaultLeaseTimeSec=86400
MaxLeaseTimeSec=86400
DNS=1.1.1.1,8.8.8.8

[Link]
RequiredForOnline=no
EOF

    log "Container networking configured"
}

# WiFi configuration
create_wifi_config() {
    local wifi_interface="$1"
    local ssid="$2"
    local password="$3"
    
    log "Creating WiFi configuration for: ${wifi_interface}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    # WiFi network configuration
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/25-${wifi_interface}.network" > /dev/null
[Match]
Name=${wifi_interface}

[Network]
DHCP=yes
IPForward=no

[DHCPv4]
UseDNS=yes
UseRoutes=yes
UseHostname=yes

[Link]
RequiredForOnline=yes
EOF

    # Create wpa_supplicant configuration
    cat << EOF | sudo tee "/etc/wpa_supplicant/wpa_supplicant-${wifi_interface}.conf" > /dev/null
ctrl_interface=/run/wpa_supplicant
update_config=1

network={
    ssid="${ssid}"
    psk="${password}"
    key_mgmt=WPA-PSK
    proto=RSN
    pairwise=CCMP
    group=CCMP
}
EOF

    # Enable wpa_supplicant service
    sudo systemctl enable wpa_supplicant@"${wifi_interface}".service
    
    log "WiFi configuration created for ${wifi_interface}"
}

# IPv6 configuration
create_ipv6_config() {
    local interface="$1"
    local ipv6_address="$2"
    local ipv6_gateway="$3"
    
    log "Creating IPv6 configuration for: ${interface}"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/10-${interface}-ipv6.network" > /dev/null
[Match]
Name=${interface}

[Network]
Address=${ipv6_address}
Gateway=${ipv6_gateway}
DNS=2001:4860:4860::8888
DNS=2001:4860:4860::8844
IPv6AcceptRA=yes
IPv6DuplicateAddressDetection=1

[IPv6AcceptRA]
UseDNS=yes
UseRoutes=yes
UseHostname=yes

[Link]
RequiredForOnline=yes
EOF

    log "IPv6 configuration created for ${interface}"
}

# Network policy and routing
create_routing_policy() {
    local table_id="$1"
    local from_network="$2"
    local gateway="$3"
    
    log "Creating routing policy configuration"
    
    sudo mkdir -p "${NETWORKD_CONFIG_DIR}"
    
    cat << EOF | sudo tee "${NETWORKD_CONFIG_DIR}/99-routing-policy.network" > /dev/null
[Match]
Name=*

[RoutingPolicyRule]
From=${from_network}
Table=${table_id}

[Route]
Destination=0.0.0.0/0
Gateway=${gateway}
Table=${table_id}
EOF

    log "Routing policy configuration created"
}

# Network namespace configuration
create_netns_config() {
    local netns_name="$1"
    local veth_host="$2"
    local veth_ns="$3"
    local host_ip="$4"
    local ns_ip="$5"
    
    log "Creating network namespace configuration: ${netns_name}"
    
    # Create namespace setup script
    cat << EOF | sudo tee "/usr/local/bin/setup-${netns_name}-netns.sh" > /dev/null
#!/bin/bash
# Network namespace setup script

# Create namespace
ip netns add ${netns_name}

# Create veth pair
ip link add ${veth_host} type veth peer name ${veth_ns}

# Move one end to namespace
ip link set ${veth_ns} netns ${netns_name}

# Configure host side
ip addr add ${host_ip} dev ${veth_host}
ip link set ${veth_host} up

# Configure namespace side
ip netns exec ${netns_name} ip addr add ${ns_ip} dev ${veth_ns}
ip netns exec ${netns_name} ip link set ${veth_ns} up
ip netns exec ${netns_name} ip link set lo up

# Add default route in namespace
ip netns exec ${netns_name} ip route add default via ${host_ip%/*}

# Enable forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# Configure NAT
iptables -t nat -A POSTROUTING -s ${ns_ip%/*}/24 -o eth0 -j MASQUERADE
iptables -A FORWARD -i ${veth_host} -o eth0 -j ACCEPT
iptables -A FORWARD -i eth0 -o ${veth_host} -m state --state RELATED,ESTABLISHED -j ACCEPT
EOF

    sudo chmod +x "/usr/local/bin/setup-${netns_name}-netns.sh"
    
    # Create systemd service
    cat << EOF | sudo tee "/etc/systemd/system/${netns_name}-netns.service" > /dev/null
[Unit]
Description=Network Namespace ${netns_name}
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/setup-${netns_name}-netns.sh
RemainAfterExit=yes
ExecStop=/bin/bash -c 'ip netns delete ${netns_name} || true'

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    
    log "Network namespace configuration created for ${netns_name}"
}

# Network monitoring and debugging
setup_network_monitoring() {
    log "Setting up network monitoring tools"
    
    # Create network monitoring script
    cat << 'EOF' | sudo tee "/usr/local/bin/network-monitor.sh" > /dev/null
#!/bin/bash
# Network monitoring script

echo "=== Network Interface Status ==="
networkctl status

echo -e "\n=== Active Network Configurations ==="
networkctl list

echo -e "\n=== DHCP Leases ==="
networkctl lldp

echo -e "\n=== Routing Table ==="
ip route show

echo -e "\n=== Network Statistics ==="
ss -tuln

echo -e "\n=== systemd-networkd Status ==="
systemctl status systemd-networkd --no-pager

echo -e "\n=== Recent Network Logs ==="
journalctl -u systemd-networkd --no-pager -n 10
EOF

    sudo chmod +x "/usr/local/bin/network-monitor.sh"
    
    # Create monitoring service
    cat << EOF | sudo tee "/etc/systemd/system/network-monitor.service" > /dev/null
[Unit]
Description=Network Monitoring Service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/network-monitor.sh

[Install]
WantedBy=multi-user.target
EOF

    # Create timer for regular monitoring
    cat << EOF | sudo tee "/etc/systemd/system/network-monitor.timer" > /dev/null
[Unit]
Description=Run Network Monitor every 5 minutes
Requires=network-monitor.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

    sudo systemctl daemon-reload
    
    log "Network monitoring tools configured"
}

# Apply and manage configurations
apply_networkd_configs() {
    log "Applying networkd configurations"
    
    # Enable systemd-networkd
    sudo systemctl enable systemd-networkd
    
    # Reload configurations
    sudo systemctl daemon-reload
    
    # Restart networkd
    sudo systemctl restart systemd-networkd
    
    # Wait for network to be configured
    sleep 5
    
    # Check status
    sudo systemctl status systemd-networkd --no-pager
    
    log "networkd configurations applied"
}

test_network_config() {
    log "Testing network configuration"
    
    # Check networkd status
    echo "=== systemd-networkd Status ==="
    sudo systemctl status systemd-networkd --no-pager
    
    # Check interface status
    echo -e "\n=== Interface Status ==="
    networkctl status
    
    # Test connectivity
    echo -e "\n=== Connectivity Test ==="
    ping -c 3 8.8.8.8 || warn "External connectivity test failed"
    
    # Check DNS resolution
    echo -e "\n=== DNS Resolution Test ==="
    nslookup google.com || warn "DNS resolution test failed"
    
    log "Network configuration test completed"
}

# Troubleshooting tools
debug_network_issues() {
    log "Debugging network issues"
    
    # Check networkd logs
    echo "=== systemd-networkd Logs ==="
    sudo journalctl -u systemd-networkd --no-pager -n 50
    
    # Check configuration files
    echo -e "\n=== Configuration Files ==="
    find "${NETWORKD_CONFIG_DIR}" -name "*.network" -o -name "*.netdev" | sort
    
    # Validate configurations
    echo -e "\n=== Configuration Validation ==="
    for config in "${NETWORKD_CONFIG_DIR}"/*.network; do
        if [[ -f "$config" ]]; then
            echo "Checking: $(basename "$config")"
            sudo networkd-config-validator "$config" || warn "Issues found in $config"
        fi
    done
    
    # Check interface states
    echo -e "\n=== Interface States ==="
    networkctl list
    
    # Check routes
    echo -e "\n=== Routing Information ==="
    ip route show table all
    
    log "Network debugging completed"
}

# Configuration management
export_configs() {
    local export_dir="$1"
    
    log "Exporting network configurations to: ${export_dir}"
    
    mkdir -p "${export_dir}"
    
    # Copy configuration files
    sudo cp -r "${NETWORKD_CONFIG_DIR}"/* "${export_dir}/" 2>/dev/null || true
    
    # Export current network state
    networkctl status > "${export_dir}/network-status.txt"
    ip addr show > "${export_dir}/interfaces.txt"
    ip route show > "${export_dir}/routes.txt"
    
    log "Network configurations exported"
}

import_configs() {
    local import_dir="$1"
    
    log "Importing network configurations from: ${import_dir}"
    
    if [[ ! -d "${import_dir}" ]]; then
        error "Import directory not found: ${import_dir}"
        return 1
    fi
    
    # Backup current configs
    backup_existing_config
    
    # Import configurations
    sudo cp "${import_dir}"/*.network "${NETWORKD_CONFIG_DIR}/" 2>/dev/null || true
    sudo cp "${import_dir}"/*.netdev "${NETWORKD_CONFIG_DIR}/" 2>/dev/null || true
    
    # Apply new configurations
    apply_networkd_configs
    
    log "Network configurations imported and applied"
}

# Usage and help
show_usage() {
    cat << EOF
systemd-networkd Configuration Examples

Usage: $0 [COMMAND] [OPTIONS]

Basic Configuration:
    dhcp INTERFACE              Create DHCP configuration
    static INTERFACE IP GW DNS  Create static IP configuration
    ipv6 INTERFACE IP GW        Create IPv6 configuration
    wifi INTERFACE SSID PASS    Create WiFi configuration

Advanced Configuration:
    bridge NAME IP IFACE...     Create bridge with interfaces
    vlan BASE_IFACE ID IP       Create VLAN configuration
    bond NAME MODE IP IFACE...  Create bonding configuration
    vxlan NAME VNI LOCAL REMOTE IP  Create VXLAN tunnel
    wireguard NAME IP PRIV_KEY PUB_KEY ENDPOINT ALLOWED_IPS  Create WireGuard VPN

Specialized Setups:
    container-net BRIDGE NET   Create container networking
    netns NAME VETH_HOST VETH_NS HOST_IP NS_IP  Create network namespace
    routing-policy TABLE FROM GW  Create routing policy

Management:
    apply                      Apply networkd configurations
    test                       Test network configuration
    debug                      Debug network issues
    monitor                    Setup network monitoring
    backup                     Backup current configuration
    export DIR                 Export configurations
    import DIR                 Import configurations

Examples:
    # Basic DHCP setup
    $0 dhcp eth0

    # Static IP configuration
    $0 static eth0 192.168.1.100/24 192.168.1.1 8.8.8.8

    # Create bridge for containers
    $0 bridge br0 192.168.100.1/24 eth1 eth2

    # VLAN configuration
    $0 vlan eth0 100 192.168.100.1/24

    # Apply all configurations
    $0 apply

    # Test connectivity
    $0 test

    # Debug issues
    $0 debug

Configuration Files Location: ${NETWORKD_CONFIG_DIR}
Backup Location: ${BACKUP_DIR}
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        "dhcp")
            create_dhcp_config "$2"
            ;;
        "static")
            create_static_config "$2" "$3" "$4" "$5"
            ;;
        "ipv6")
            create_ipv6_config "$2" "$3" "$4"
            ;;
        "wifi")
            create_wifi_config "$2" "$3" "$4"
            ;;
        "bridge")
            local bridge_name="$2"
            local bridge_ip="$3"
            shift 3
            create_bridge_config "${bridge_name}" "${bridge_ip}" "$@"
            ;;
        "vlan")
            create_vlan_config "$2" "$3" "$4"
            ;;
        "bond")
            local bond_name="$2"
            local bond_mode="$3"
            local bond_ip="$4"
            shift 4
            create_bond_config "${bond_name}" "${bond_mode}" "${bond_ip}" "$@"
            ;;
        "vxlan")
            create_vxlan_config "$2" "$3" "$4" "$5" "$6"
            ;;
        "wireguard")
            create_wireguard_config "$2" "$3" "$4" "$5" "$6" "$7"
            ;;
        "container-net")
            create_container_network "$2" "$3"
            ;;
        "netns")
            create_netns_config "$2" "$3" "$4" "$5" "$6"
            ;;
        "routing-policy")
            create_routing_policy "$2" "$3" "$4"
            ;;
        "apply")
            apply_networkd_configs
            ;;
        "test")
            test_network_config
            ;;
        "debug")
            debug_network_issues
            ;;
        "monitor")
            setup_network_monitoring
            ;;
        "backup")
            backup_existing_config
            ;;
        "export")
            export_configs "$2"
            ;;
        "import")
            import_configs "$2"
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi