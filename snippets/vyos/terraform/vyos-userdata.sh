#!/bin/bash
# VyOS User Data Script for AWS EC2 Instance
# This script configures the VyOS router during initial boot

# Variables from Terraform template
HOSTNAME="${hostname}"
PUBLIC_IP="${public_ip}"
PRIVATE_IP="${private_ip}"
ENVIRONMENT="${environment}"

# Wait for VyOS to be fully ready
sleep 30

# Function to execute VyOS configuration commands
vyos_config() {
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper begin
    
    # Basic system configuration
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system host-name "$HOSTNAME"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system domain-name "aws.internal"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system time-zone "UTC"
    
    # Configure interfaces
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set interfaces ethernet eth0 address "$PUBLIC_IP/24"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set interfaces ethernet eth0 description "Public Interface"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set interfaces ethernet eth1 address "$PRIVATE_IP/24"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set interfaces ethernet eth1 description "Private Interface"
    
    # Configure DNS
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system name-server "169.254.169.253"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system name-server "8.8.8.8"
    
    # Configure NTP
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system ntp server "169.254.169.123"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system ntp server "0.amazon.pool.ntp.org"
    
    # Configure SSH
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set service ssh port "22"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set service ssh disable-password-authentication
    
    # Configure basic firewall
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN default-action "drop"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 10 action "accept"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 10 state established "enable"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 10 state related "enable"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 20 action "accept"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 20 protocol "icmp"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 30 action "accept"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 30 destination port "22"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set firewall name OUTSIDE-IN rule 30 protocol "tcp"
    
    # Apply firewall to public interface
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set interfaces ethernet eth0 firewall in name "OUTSIDE-IN"
    
    # Configure NAT for private subnet
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set nat source rule 100 outbound-interface "eth0"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set nat source rule 100 source address "10.0.2.0/24"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set nat source rule 100 translation address "masquerade"
    
    # Configure static routes (AWS VPC default gateway)
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set protocols static route 0.0.0.0/0 next-hop "10.0.1.1"
    
    # Enable IP forwarding for routing
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system ip forwarding
    
    # Configure logging
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system syslog global facility all level "info"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system syslog host "127.0.0.1" facility all level "info"
    
    # Configure HTTPS API (if available)
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set service https listen-address "0.0.0.0"
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set service https port "443"
    
    # Commit and save configuration
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper commit
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper save
    sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end
}

# Execute configuration
vyos_config

# Log completion
echo "$(date): VyOS AWS configuration completed for $HOSTNAME" >> /var/log/vyos-userdata.log

# Optional: Install additional tools or configurations
# Add any custom post-configuration scripts here

# Signal completion
touch /tmp/vyos-userdata-complete