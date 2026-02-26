#!/bin/bash
# VyOS Command Scripting Examples
# Comprehensive script automation for VyOS configuration and monitoring

# Configuration variables
VYOS_HOST="${1:-192.168.1.1}"
SSH_USER="${2:-vyos}"
SSH_KEY="${3:-~/.ssh/id_rsa}"
LOG_FILE="/var/log/vyos-automation.log"

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# SSH execution function for VyOS commands
vyos_ssh_exec() {
    local command="$1"
    local host="${2:-$VYOS_HOST}"
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$host" "$command"
}

# VyOS configuration wrapper
vyos_configure() {
    local commands="$1"
    local host="${2:-$VYOS_HOST}"
    
    log_message "Executing configuration commands on $host"
    
    vyos_ssh_exec "
        source /opt/vyatta/etc/functions/script-template
        configure
        $commands
        commit
        save
        exit
    " "$host"
}

# VyOS operational command wrapper
vyos_operational() {
    local command="$1"
    local host="${2:-$VYOS_HOST}"
    
    vyos_ssh_exec "$command" "$host"
}

# System Information Functions
get_system_info() {
    local host="${1:-$VYOS_HOST}"
    
    log_message "Gathering system information from $host"
    
    echo "=== System Information for $host ==="
    vyos_operational "show version" "$host"
    echo
    vyos_operational "show system uptime" "$host"
    echo
    vyos_operational "show system cpu" "$host"
    echo
    vyos_operational "show system memory" "$host"
    echo
}

get_interface_status() {
    local host="${1:-$VYOS_HOST}"
    
    log_message "Checking interface status on $host"
    
    echo "=== Interface Status for $host ==="
    vyos_operational "show interfaces" "$host"
    echo
    vyos_operational "show interfaces ethernet detail" "$host"
    echo
}

get_routing_info() {
    local host="${1:-$VYOS_HOST}"
    
    log_message "Gathering routing information from $host"
    
    echo "=== Routing Information for $host ==="
    vyos_operational "show ip route" "$host"
    echo
    vyos_operational "show ipv6 route" "$host"
    echo
    
    # Check if BGP is configured
    if vyos_operational "show protocols bgp" "$host" | grep -q "BGP"; then
        echo "=== BGP Information ==="
        vyos_operational "show protocols bgp summary" "$host"
        echo
        vyos_operational "show protocols bgp neighbors" "$host"
        echo
    fi
    
    # Check if OSPF is configured
    if vyos_operational "show protocols ospf" "$host" | grep -q "OSPF"; then
        echo "=== OSPF Information ==="
        vyos_operational "show protocols ospf neighbor" "$host"
        echo
        vyos_operational "show protocols ospf database" "$host"
        echo
    fi
}

# Configuration Functions
configure_basic_system() {
    local hostname="$1"
    local domain="$2"
    local host="${3:-$VYOS_HOST}"
    
    log_message "Configuring basic system settings on $host"
    
    local config_commands="
        set system host-name '$hostname'
        set system domain-name '$domain'
        set system time-zone 'UTC'
        set system name-server '8.8.8.8'
        set system name-server '8.8.4.4'
        set system ntp server '0.pool.ntp.org'
        set system ntp server '1.pool.ntp.org'
    "
    
    vyos_configure "$config_commands" "$host"
    log_message "Basic system configuration completed on $host"
}

configure_interface() {
    local interface="$1"
    local ip_address="$2"
    local description="$3"
    local host="${4:-$VYOS_HOST}"
    
    log_message "Configuring interface $interface on $host"
    
    local config_commands="
        set interfaces ethernet $interface address '$ip_address'
        set interfaces ethernet $interface description '$description'
    "
    
    vyos_configure "$config_commands" "$host"
    log_message "Interface $interface configured on $host"
}

configure_dhcp_server() {
    local network_name="$1"
    local subnet="$2"
    local gateway="$3"
    local dns="$4"
    local range_start="$5"
    local range_stop="$6"
    local host="${7:-$VYOS_HOST}"
    
    log_message "Configuring DHCP server on $host"
    
    local config_commands="
        set service dhcp-server shared-network-name $network_name subnet $subnet default-router '$gateway'
        set service dhcp-server shared-network-name $network_name subnet $subnet dns-server '$dns'
        set service dhcp-server shared-network-name $network_name subnet $subnet range 0 start '$range_start'
        set service dhcp-server shared-network-name $network_name subnet $subnet range 0 stop '$range_stop'
        set service dhcp-server shared-network-name $network_name subnet $subnet lease '86400'
    "
    
    vyos_configure "$config_commands" "$host"
    log_message "DHCP server configured on $host"
}

configure_nat() {
    local rule_number="$1"
    local outbound_interface="$2"
    local source_network="$3"
    local host="${4:-$VYOS_HOST}"
    
    log_message "Configuring NAT rule $rule_number on $host"
    
    local config_commands="
        set nat source rule $rule_number outbound-interface '$outbound_interface'
        set nat source rule $rule_number source address '$source_network'
        set nat source rule $rule_number translation address 'masquerade'
    "
    
    vyos_configure "$config_commands" "$host"
    log_message "NAT rule $rule_number configured on $host"
}

configure_firewall() {
    local chain_name="$1"
    local host="${2:-$VYOS_HOST}"
    
    log_message "Configuring firewall chain $chain_name on $host"
    
    local config_commands="
        set firewall name $chain_name default-action 'drop'
        set firewall name $chain_name rule 10 action 'accept'
        set firewall name $chain_name rule 10 state established 'enable'
        set firewall name $chain_name rule 10 state related 'enable'
        set firewall name $chain_name rule 20 action 'accept'
        set firewall name $chain_name rule 20 protocol 'icmp'
        set firewall name $chain_name rule 30 action 'accept'
        set firewall name $chain_name rule 30 destination port '22'
        set firewall name $chain_name rule 30 protocol 'tcp'
        set firewall name $chain_name rule 30 source address '192.168.0.0/16'
    "
    
    vyos_configure "$config_commands" "$host"
    log_message "Firewall chain $chain_name configured on $host"
}

configure_bgp() {
    local local_as="$1"
    local router_id="$2"
    local neighbor_ip="$3"
    local neighbor_as="$4"
    local host="${5:-$VYOS_HOST}"
    
    log_message "Configuring BGP on $host"
    
    local config_commands="
        set protocols bgp system-as '$local_as'
        set protocols bgp router-id '$router_id'
        set protocols bgp parameters log-neighbor-changes
        set protocols bgp neighbor $neighbor_ip remote-as '$neighbor_as'
        set protocols bgp neighbor $neighbor_ip description 'Scripted BGP neighbor'
    "
    
    vyos_configure "$config_commands" "$host"
    log_message "BGP configured on $host"
}

# Monitoring Functions
monitor_interfaces() {
    local host="${1:-$VYOS_HOST}"
    local interval="${2:-30}"
    
    log_message "Starting interface monitoring on $host (interval: ${interval}s)"
    
    while true; do
        echo "=== Interface Statistics - $(date) ==="
        vyos_operational "show interfaces ethernet statistics" "$host"
        echo
        sleep "$interval"
    done
}

check_connectivity() {
    local targets=("8.8.8.8" "1.1.1.1" "google.com")
    local host="${1:-$VYOS_HOST}"
    
    log_message "Checking connectivity from $host"
    
    for target in "${targets[@]}"; do
        echo "Testing connectivity to $target:"
        vyos_operational "ping $target count 3" "$host"
        echo
    done
}

# Backup and Restore Functions
backup_config() {
    local backup_path="$1"
    local host="${2:-$VYOS_HOST}"
    
    log_message "Backing up configuration from $host"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_path}/vyos_config_${host}_${timestamp}.txt"
    
    vyos_operational "show configuration" "$host" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_message "Configuration backed up to $backup_file"
        echo "$backup_file"
    else
        log_message "Failed to backup configuration from $host"
        return 1
    fi
}

restore_config() {
    local config_file="$1"
    local host="${2:-$VYOS_HOST}"
    
    if [ ! -f "$config_file" ]; then
        log_message "Configuration file $config_file not found"
        return 1
    fi
    
    log_message "Restoring configuration to $host from $config_file"
    
    # This is a simplified restore - in practice, you'd need to parse and apply the config
    echo "Warning: Config restore requires manual implementation based on your needs"
    echo "Configuration file: $config_file"
}

# Health Check Functions
health_check() {
    local host="${1:-$VYOS_HOST}"
    
    log_message "Performing health check on $host"
    
    echo "=== VyOS Health Check for $host ==="
    echo "Timestamp: $(date)"
    echo
    
    # System uptime
    echo "System Uptime:"
    vyos_operational "show system uptime" "$host"
    echo
    
    # Memory usage
    echo "Memory Usage:"
    vyos_operational "show system memory" "$host" | grep -E "(Mem:|Swap:)"
    echo
    
    # CPU load
    echo "CPU Load:"
    vyos_operational "show system cpu" "$host" | head -5
    echo
    
    # Disk usage
    echo "Disk Usage:"
    vyos_operational "show system storage" "$host"
    echo
    
    # Interface status
    echo "Interface Status:"
    vyos_operational "show interfaces" "$host" | grep -E "(eth|wg|tun)"
    echo
    
    # Process count
    echo "Process Information:"
    vyos_operational "show system processes summary" "$host"
    echo
}

# Deployment Functions
deploy_basic_router() {
    local hostname="$1"
    local lan_interface="$2"
    local lan_ip="$3"
    local wan_interface="$4"
    local host="${5:-$VYOS_HOST}"
    
    log_message "Deploying basic router configuration on $host"
    
    # Basic system
    configure_basic_system "$hostname" "local.domain" "$host"
    
    # LAN interface
    configure_interface "$lan_interface" "$lan_ip" "LAN Interface" "$host"
    
    # WAN interface (DHCP)
    configure_interface "$wan_interface" "dhcp" "WAN Interface" "$host"
    
    # NAT
    configure_nat "100" "$wan_interface" "192.168.0.0/16" "$host"
    
    # Basic firewall
    configure_firewall "OUTSIDE-IN" "$host"
    
    # Apply firewall to WAN
    vyos_configure "set interfaces ethernet $wan_interface firewall in name 'OUTSIDE-IN'" "$host"
    
    # DHCP server (assuming /24 network)
    local network=$(echo "$lan_ip" | cut -d'/' -f1 | cut -d'.' -f1-3)
    local gateway="${network}.1"
    local dhcp_start="${network}.100"
    local dhcp_stop="${network}.200"
    local subnet="${network}.0/24"
    
    configure_dhcp_server "LAN" "$subnet" "$gateway" "$gateway" "$dhcp_start" "$dhcp_stop" "$host"
    
    log_message "Basic router deployment completed on $host"
}

# Main script execution
main() {
    case "${1:-help}" in
        "info")
            get_system_info "$2"
            ;;
        "interfaces")
            get_interface_status "$2"
            ;;
        "routing")
            get_routing_info "$2"
            ;;
        "health")
            health_check "$2"
            ;;
        "monitor")
            monitor_interfaces "$2" "$3"
            ;;
        "connectivity")
            check_connectivity "$2"
            ;;
        "backup")
            backup_config "$2" "$3"
            ;;
        "deploy")
            deploy_basic_router "$2" "$3" "$4" "$5" "$6"
            ;;
        "bgp")
            configure_bgp "$2" "$3" "$4" "$5" "$6"
            ;;
        "help"|*)
            echo "VyOS Command Scripting Tool"
            echo "Usage: $0 <command> [arguments]"
            echo
            echo "Commands:"
            echo "  info [host]                          - Get system information"
            echo "  interfaces [host]                    - Get interface status"
            echo "  routing [host]                       - Get routing information"
            echo "  health [host]                        - Perform health check"
            echo "  monitor [host] [interval]            - Monitor interfaces"
            echo "  connectivity [host]                  - Test connectivity"
            echo "  backup <path> [host]                 - Backup configuration"
            echo "  deploy <hostname> <lan_if> <lan_ip> <wan_if> [host] - Deploy basic router"
            echo "  bgp <local_as> <router_id> <neighbor_ip> <neighbor_as> [host] - Configure BGP"
            echo "  help                                 - Show this help"
            echo
            echo "Examples:"
            echo "  $0 info 192.168.1.1"
            echo "  $0 deploy vyos-router eth0 192.168.1.1/24 eth1"
            echo "  $0 bgp 65001 10.0.0.1 10.0.0.2 65002"
            echo "  $0 backup /tmp/backups 192.168.1.1"
            ;;
    esac
}

# Execute main function with all arguments
main "$@"