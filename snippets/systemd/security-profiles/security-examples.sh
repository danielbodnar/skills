#!/bin/bash
# systemd Security Profiles and Hardening Examples
# Comprehensive guide for securing systemd services and containers

set -euo pipefail

# Security configuration paths
SECURITY_PROFILES_DIR="/etc/systemd/portable/profile"
SYSTEM_SERVICES_DIR="/etc/systemd/system"
USER_SERVICES_DIR="/etc/systemd/user"

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

# Create high-security portable service profile
create_high_security_profile() {
    local profile_name="high-security"
    
    log "Creating high-security portable service profile"
    
    sudo mkdir -p "${SECURITY_PROFILES_DIR}/${profile_name}"
    
    cat << EOF | sudo tee "${SECURITY_PROFILES_DIR}/${profile_name}/service.conf" > /dev/null
[Service]
# High Security Profile for Portable Services

# Process Security
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
PrivateNetwork=yes
PrivateUsers=yes
PrivateMounts=yes
ProtectSystem=strict
ProtectHome=yes
ProtectClock=yes
ProtectControlGroups=yes
ProtectHostname=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectProc=invisible
ProcSubset=pid

# Memory Security
MemoryDenyWriteExecute=yes
LockPersonality=yes
SystemCallArchitectures=native

# Capability Restrictions
CapabilityBoundingSet=
AmbientCapabilities=

# System Call Filtering
SystemCallFilter=@system-service
SystemCallFilter=~@clock
SystemCallFilter=~@cpu-emulation
SystemCallFilter=~@debug
SystemCallFilter=~@keyring
SystemCallFilter=~@module
SystemCallFilter=~@mount
SystemCallFilter=~@obsolete
SystemCallFilter=~@privileged
SystemCallFilter=~@raw-io
SystemCallFilter=~@reboot
SystemCallFilter=~@resources
SystemCallFilter=~@swap

# Network Security
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
IPAddressDeny=any
IPAddressAllow=localhost
IPAddressAllow=127.0.0.0/8
IPAddressAllow=::1/128

# Namespace Restrictions
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
RemoveIPC=yes

# Resource Limits
MemoryMax=512M
CPUQuota=50%
TasksMax=256
IOReadBandwidthMax=/dev/sda 10M
IOWriteBandwidthMax=/dev/sda 5M

# File System Security
ReadWritePaths=/var/lib/app
ReadOnlyPaths=/usr /etc
InaccessiblePaths=/home /root /boot /sys/firmware /proc/sys/kernel
TemporaryFileSystem=/var:rw:nodev,nosuid,noexec
TemporaryFileSystem=/tmp:rw:nodev,nosuid,noexec,size=100M

# Additional Security
UMask=0077
KeyringMode=private
NotifyAccess=none
EOF

    log "High-security profile created: ${profile_name}"
}

# Create web application security profile
create_webapp_security_profile() {
    local profile_name="webapp-secure"
    
    log "Creating web application security profile"
    
    sudo mkdir -p "${SECURITY_PROFILES_DIR}/${profile_name}"
    
    cat << EOF | sudo tee "${SECURITY_PROFILES_DIR}/${profile_name}/service.conf" > /dev/null
[Service]
# Web Application Security Profile

# Basic Security
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=yes
ProtectControlGroups=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes

# Memory Protection
MemoryDenyWriteExecute=no
LockPersonality=yes
SystemCallArchitectures=native

# Web App Capabilities
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=

# Network Access (Required for web apps)
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
IPAddressDeny=10.0.0.0/8
IPAddressDeny=172.16.0.0/12
IPAddressDeny=192.168.0.0/16
IPAddressAllow=any

# System Call Filtering for Web Apps
SystemCallFilter=@system-service
SystemCallFilter=@network-io
SystemCallFilter=@file-system
SystemCallFilter=~@privileged
SystemCallFilter=~@resources
SystemCallFilter=~@raw-io

# File System Access
ReadWritePaths=/var/lib/webapp
ReadWritePaths=/var/log/webapp
ReadOnlyPaths=/usr /etc
InaccessiblePaths=/home /root /boot
TemporaryFileSystem=/tmp:rw,nodev,nosuid,size=500M

# Resource Limits
MemoryMax=2G
CPUQuota=100%
TasksMax=1024

# Additional Security
UMask=0022
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
EOF

    log "Web application security profile created: ${profile_name}"
}

# Create database security profile
create_database_security_profile() {
    local profile_name="database-secure"
    
    log "Creating database security profile"
    
    sudo mkdir -p "${SECURITY_PROFILES_DIR}/${profile_name}"
    
    cat << EOF | sudo tee "${SECURITY_PROFILES_DIR}/${profile_name}/service.conf" > /dev/null
[Service]
# Database Security Profile

# Basic Security
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
PrivateNetwork=yes
ProtectSystem=strict
ProtectHome=yes
ProtectControlGroups=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectClock=yes

# Memory Protection
MemoryDenyWriteExecute=yes
LockPersonality=yes
SystemCallArchitectures=native

# Minimal Capabilities
CapabilityBoundingSet=
AmbientCapabilities=

# Network (Unix sockets only for local DB)
RestrictAddressFamilies=AF_UNIX

# System Call Filtering
SystemCallFilter=@system-service
SystemCallFilter=@file-system
SystemCallFilter=@io-event
SystemCallFilter=~@privileged
SystemCallFilter=~@network-io
SystemCallFilter=~@raw-io

# File System Access
ReadWritePaths=/var/lib/database
ReadWritePaths=/var/log/database
ReadOnlyPaths=/usr /etc
InaccessiblePaths=/home /root /boot /proc/sys
TemporaryFileSystem=/tmp:rw,nodev,nosuid,noexec,size=1G

# Resource Limits for Database
MemoryMax=4G
CPUQuota=200%
TasksMax=2048
IOReadBandwidthMax=/dev/sda 100M
IOWriteBandwidthMax=/dev/sda 50M

# Database-specific Security
UMask=0027
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
RemoveIPC=yes
EOF

    log "Database security profile created: ${profile_name}"
}

# Create development security profile
create_development_profile() {
    local profile_name="development"
    
    log "Creating development security profile"
    
    sudo mkdir -p "${SECURITY_PROFILES_DIR}/${profile_name}"
    
    cat << EOF | sudo tee "${SECURITY_PROFILES_DIR}/${profile_name}/service.conf" > /dev/null
[Service]
# Development Security Profile (Relaxed for development needs)

# Basic Security (minimal restrictions)
NoNewPrivileges=yes
PrivateTmp=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes

# Development Capabilities
CapabilityBoundingSet=CAP_NET_BIND_SERVICE CAP_SYS_PTRACE CAP_DAC_OVERRIDE
AmbientCapabilities=

# Network Access (Full access for development)
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX AF_NETLINK

# Relaxed System Call Filtering
SystemCallFilter=@system-service
SystemCallFilter=@network-io
SystemCallFilter=@file-system
SystemCallFilter=@process
SystemCallFilter=@basic-io

# File System Access (More permissive)
ReadWritePaths=/var/lib/dev
ReadWritePaths=/tmp
ReadWritePaths=/var/tmp
ReadOnlyPaths=/usr

# Generous Resource Limits
MemoryMax=8G
CPUQuota=400%
TasksMax=4096

# Development-friendly settings
UMask=0022
RestrictNamespaces=no
RestrictRealtime=no
EOF

    log "Development security profile created: ${profile_name}"
}

# Create systemd service security template
create_secure_service_template() {
    local service_name="$1"
    local service_user="$2"
    local working_dir="$3"
    local exec_start="$4"
    
    log "Creating secure service template: ${service_name}"
    
    cat << EOF | sudo tee "${SYSTEM_SERVICES_DIR}/${service_name}.service" > /dev/null
[Unit]
Description=Secure ${service_name} Service
Documentation=https://example.com/${service_name}
After=network.target
Wants=network.target

[Service]
Type=simple
User=${service_user}
Group=${service_user}
ExecStart=${exec_start}
WorkingDirectory=${working_dir}
Restart=always
RestartSec=10
StartLimitInterval=300
StartLimitBurst=5

# Basic Security
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=yes
ProtectControlGroups=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectClock=yes
ProtectProc=invisible
ProcSubset=pid

# Memory Security
MemoryDenyWriteExecute=yes
LockPersonality=yes
SystemCallArchitectures=native

# Capability Restrictions
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=

# Network Security
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

# System Call Filtering
SystemCallFilter=@system-service
SystemCallFilter=~@privileged
SystemCallFilter=~@resources
SystemCallFilter=~@raw-io

# File System Security
ReadWritePaths=${working_dir}
ReadWritePaths=/var/log/${service_name}
ReadOnlyPaths=/usr /etc
InaccessiblePaths=/home /root /boot

# Resource Limits
MemoryMax=1G
CPUQuota=100%
TasksMax=512

# Additional Security
UMask=0027
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
RemoveIPC=yes
KeyringMode=private

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${service_name}

[Install]
WantedBy=multi-user.target
EOF

    log "Secure service template created: ${service_name}.service"
}

# Create container security configuration
create_container_security_config() {
    local container_name="$1"
    
    log "Creating container security configuration: ${container_name}"
    
    # Create systemd override directory
    sudo mkdir -p "${SYSTEM_SERVICES_DIR}/systemd-nspawn@${container_name}.service.d"
    
    cat << EOF | sudo tee "${SYSTEM_SERVICES_DIR}/systemd-nspawn@${container_name}.service.d/security.conf" > /dev/null
[Service]
# Container Security Configuration

# Process Security
NoNewPrivileges=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=yes
ProtectControlGroups=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectClock=yes

# Memory Security
MemoryDenyWriteExecute=yes
LockPersonality=yes
SystemCallArchitectures=native

# Container-specific Capabilities
CapabilityBoundingSet=CAP_CHOWN CAP_DAC_OVERRIDE CAP_FOWNER CAP_FSETID CAP_KILL CAP_SETGID CAP_SETUID CAP_SETPCAP CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SYS_CHROOT CAP_AUDIT_WRITE CAP_SETFCAP

# Network Security
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX AF_NETLINK

# System Call Filtering for Containers
SystemCallFilter=@system-service
SystemCallFilter=@file-system
SystemCallFilter=@process
SystemCallFilter=@network-io
SystemCallFilter=~@clock
SystemCallFilter=~@cpu-emulation
SystemCallFilter=~@debug
SystemCallFilter=~@keyring
SystemCallFilter=~@module
SystemCallFilter=~@mount
SystemCallFilter=~@obsolete
SystemCallFilter=~@raw-io
SystemCallFilter=~@reboot
SystemCallFilter=~@swap

# Resource Limits
MemoryMax=4G
CPUQuota=200%
TasksMax=2048
IOReadBandwidthMax=/dev/sda 50M
IOWriteBandwidthMax=/dev/sda 25M

# Additional Security
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
RemoveIPC=yes
UMask=0022
EOF

    log "Container security configuration created for: ${container_name}"
}

# Create user service security template
create_user_service_security() {
    local service_name="$1"
    local exec_command="$2"
    
    log "Creating user service with security: ${service_name}"
    
    sudo mkdir -p "${USER_SERVICES_DIR}"
    
    cat << EOF | sudo tee "${USER_SERVICES_DIR}/${service_name}.service" > /dev/null
[Unit]
Description=User ${service_name} Service
After=graphical-session.target

[Service]
Type=simple
ExecStart=${exec_command}
Restart=always
RestartSec=5

# User Service Security
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=read-only
ProtectControlGroups=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes

# Memory Security
MemoryDenyWriteExecute=yes
LockPersonality=yes
SystemCallArchitectures=native

# User Service Capabilities (minimal)
CapabilityBoundingSet=
AmbientCapabilities=

# Network Restrictions
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

# System Call Filtering
SystemCallFilter=@system-service
SystemCallFilter=~@privileged
SystemCallFilter=~@resources

# Resource Limits
MemoryMax=512M
CPUQuota=50%
TasksMax=256

# File System Security
ReadWritePaths=%h/.local/share/${service_name}
ReadWritePaths=%h/.config/${service_name}
InaccessiblePaths=/root /boot /sys/firmware

# Additional Security
UMask=0077
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes

[Install]
WantedBy=default.target
EOF

    log "User service with security created: ${service_name}.service"
}

# Create SELinux policy for systemd services
create_selinux_policy() {
    local service_name="$1"
    
    log "Creating SELinux policy for service: ${service_name}"
    
    # Create SELinux policy template
    cat << EOF > "/tmp/${service_name}.te"
policy_module(${service_name}, 1.0)

# Define the domain for our service
type ${service_name}_t;
type ${service_name}_exec_t;
init_daemon_domain(${service_name}_t, ${service_name}_exec_t)

# Allow the service to read its configuration
type ${service_name}_conf_t;
files_config_file(${service_name}_conf_t)
allow ${service_name}_t ${service_name}_conf_t:file read_file_perms;

# Allow the service to write to its data directory
type ${service_name}_var_lib_t;
files_type(${service_name}_var_lib_t)
allow ${service_name}_t ${service_name}_var_lib_t:dir manage_dir_perms;
allow ${service_name}_t ${service_name}_var_lib_t:file manage_file_perms;

# Allow the service to write logs
type ${service_name}_var_log_t;
logging_log_file(${service_name}_var_log_t)
allow ${service_name}_t ${service_name}_var_log_t:file { create_file_perms append_file_perms };

# Network permissions (if needed)
allow ${service_name}_t self:tcp_socket { create_stream_socket_perms connected_stream_socket_perms };
allow ${service_name}_t self:udp_socket { create_socket_perms };
corenet_tcp_bind_generic_node(${service_name}_t)
corenet_tcp_bind_http_port(${service_name}_t)

# Basic system permissions
allow ${service_name}_t self:process { fork signal_perms };
allow ${service_name}_t self:fifo_file rw_fifo_file_perms;
files_read_etc_files(${service_name}_t)
libs_use_ld_so(${service_name}_t)
libs_use_shared_libs(${service_name}_t)
miscfiles_read_localization(${service_name}_t)
EOF

    # Compile and install SELinux policy
    if command -v checkmodule >/dev/null 2>&1; then
        sudo checkmodule -M -m -o "/tmp/${service_name}.mod" "/tmp/${service_name}.te"
        sudo semodule_package -o "/tmp/${service_name}.pp" -m "/tmp/${service_name}.mod"
        sudo semodule -i "/tmp/${service_name}.pp"
        
        # Clean up temporary files
        sudo rm -f "/tmp/${service_name}".{te,mod,pp}
        
        log "SELinux policy created and installed for: ${service_name}"
    else
        warn "SELinux tools not available, policy file created at: /tmp/${service_name}.te"
    fi
}

# Create AppArmor profile
create_apparmor_profile() {
    local service_name="$1"
    local binary_path="$2"
    
    log "Creating AppArmor profile for: ${service_name}"
    
    cat << EOF | sudo tee "/etc/apparmor.d/${service_name}" > /dev/null
#include <tunables/global>

${binary_path} {
  #include <abstractions/base>
  #include <abstractions/nameservice>
  #include <abstractions/ssl_certs>

  # Capabilities
  capability setuid,
  capability setgid,
  capability net_bind_service,

  # Network access
  network inet stream,
  network inet6 stream,
  network unix stream,

  # File system access
  ${binary_path} mr,
  /etc/${service_name}/** r,
  /var/lib/${service_name}/** rw,
  /var/log/${service_name}/** rw,
  /tmp/** rw,
  /proc/sys/kernel/random/uuid r,

  # System files (read-only)
  /etc/ld.so.cache r,
  /etc/passwd r,
  /etc/group r,
  /etc/nsswitch.conf r,
  /etc/hosts r,
  /etc/resolv.conf r,

  # Dynamic libraries
  /lib/x86_64-linux-gnu/** mr,
  /usr/lib/x86_64-linux-gnu/** mr,

  # Deny dangerous operations
  deny /boot/** rw,
  deny /sys/firmware/** rw,
  deny /proc/sys/kernel/** w,
  deny /dev/mem rw,
  deny /dev/kmem rw,

  # Process control
  signal peer=${service_name},
}
EOF

    # Load the profile if AppArmor is available
    if command -v apparmor_parser >/dev/null 2>&1; then
        sudo apparmor_parser -r "/etc/apparmor.d/${service_name}"
        log "AppArmor profile loaded for: ${service_name}"
    else
        warn "AppArmor not available, profile created at: /etc/apparmor.d/${service_name}"
    fi
}

# Security audit and validation
audit_service_security() {
    local service_name="$1"
    
    log "Auditing security configuration for: ${service_name}"
    
    local service_file="${SYSTEM_SERVICES_DIR}/${service_name}.service"
    
    if [[ ! -f "${service_file}" ]]; then
        error "Service file not found: ${service_file}"
        return 1
    fi
    
    echo "=== Security Analysis for ${service_name} ==="
    
    # Check for security-relevant settings
    echo "Security Settings:"
    grep -E "^(NoNewPrivileges|PrivateTmp|PrivateDevices|ProtectSystem|ProtectHome|MemoryDenyWriteExecute|LockPersonality|SystemCallArchitectures|CapabilityBoundingSet|RestrictAddressFamilies|SystemCallFilter|RestrictNamespaces|RestrictRealtime|RestrictSUIDSGID)" "${service_file}" || warn "Some security settings missing"
    
    # Check for resource limits
    echo -e "\nResource Limits:"
    grep -E "^(MemoryMax|CPUQuota|TasksMax|IOReadBandwidthMax|IOWriteBandwidthMax)" "${service_file}" || warn "Resource limits not set"
    
    # Check service status
    echo -e "\nService Status:"
    sudo systemctl is-active "${service_name}" 2>/dev/null || warn "Service not running"
    sudo systemctl is-enabled "${service_name}" 2>/dev/null || warn "Service not enabled"
    
    # Check for security violations in logs
    echo -e "\nRecent Security Events:"
    sudo journalctl -u "${service_name}" --since="1 hour ago" | grep -i "denied\|violation\|failed" | tail -5 || echo "No recent security events"
    
    log "Security audit completed for: ${service_name}"
}

# Security testing tools
test_security_configuration() {
    local service_name="$1"
    
    log "Testing security configuration for: ${service_name}"
    
    # Test systemd-analyze security
    if command -v systemd-analyze >/dev/null 2>&1; then
        echo "=== systemd-analyze Security Score ==="
        sudo systemd-analyze security "${service_name}.service" 2>/dev/null || warn "systemd-analyze security not available"
    fi
    
    # Test capability requirements
    echo -e "\n=== Testing Capability Requirements ==="
    sudo capsh --print | grep -E "Current|Bounding" || warn "Capability tools not available"
    
    # Test network restrictions
    echo -e "\n=== Testing Network Restrictions ==="
    if sudo systemctl is-active "${service_name}" >/dev/null 2>&1; then
        local pid=$(sudo systemctl show "${service_name}" --property=MainPID --value)
        if [[ -n "${pid}" && "${pid}" != "0" ]]; then
            echo "Network namespaces for PID ${pid}:"
            sudo ls -la "/proc/${pid}/ns/" | grep net || warn "Cannot check network namespaces"
        fi
    fi
    
    log "Security configuration test completed"
}

# Security policy management
apply_security_policies() {
    log "Applying systemd security policies"
    
    # Reload systemd configuration
    sudo systemctl daemon-reload
    
    # Apply SELinux policies if available
    if command -v semanage >/dev/null 2>&1; then
        log "Applying SELinux policies"
        sudo setsebool -P deny_execmem on
        sudo setsebool -P deny_ptrace on
    fi
    
    # Apply AppArmor policies if available
    if command -v aa-enforce >/dev/null 2>&1; then
        log "Enforcing AppArmor profiles"
        sudo aa-enforce /etc/apparmor.d/*
    fi
    
    # Apply kernel security settings
    log "Applying kernel security settings"
    cat << EOF | sudo tee /etc/sysctl.d/99-security.conf > /dev/null
# Kernel security settings
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 2
net.core.bpf_jit_harden = 2
kernel.unprivileged_bpf_disabled = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0
EOF

    sudo sysctl -p /etc/sysctl.d/99-security.conf
    
    log "Security policies applied successfully"
}

# Usage and help
show_usage() {
    cat << EOF
systemd Security Profiles and Hardening Examples

Usage: $0 [COMMAND] [OPTIONS]

Security Profile Creation:
    high-security              Create high-security portable service profile
    webapp-security            Create web application security profile
    database-security          Create database security profile
    development               Create development security profile (relaxed)

Service Security Templates:
    secure-service NAME USER DIR EXEC    Create secure service template
    container-security NAME              Create container security config
    user-service NAME EXEC               Create secure user service

Advanced Security:
    selinux-policy NAME                  Create SELinux policy for service
    apparmor-profile NAME BINARY         Create AppArmor profile for service

Security Testing and Auditing:
    audit SERVICE                        Audit service security configuration
    test SERVICE                         Test security configuration
    apply-policies                       Apply system-wide security policies

Examples:
    # Create security profiles
    $0 high-security
    $0 webapp-security

    # Create secure service
    $0 secure-service myapp myuser /opt/myapp /opt/myapp/bin/server

    # Create container security config
    $0 container-security mycontainer

    # Create SELinux policy
    $0 selinux-policy webapp

    # Audit service security
    $0 audit myservice.service

    # Test security configuration
    $0 test myservice

    # Apply security policies
    $0 apply-policies

Profile Locations:
    Portable Service Profiles: ${SECURITY_PROFILES_DIR}
    System Services: ${SYSTEM_SERVICES_DIR}
    User Services: ${USER_SERVICES_DIR}

Security Features:
    - Process isolation and sandboxing
    - Memory protection and capability restrictions
    - System call filtering and namespace restrictions
    - Resource limits and network security
    - File system access controls
    - SELinux and AppArmor integration
    - Security auditing and testing tools
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        "high-security")
            create_high_security_profile
            ;;
        "webapp-security")
            create_webapp_security_profile
            ;;
        "database-security")
            create_database_security_profile
            ;;
        "development")
            create_development_profile
            ;;
        "secure-service")
            create_secure_service_template "$2" "$3" "$4" "$5"
            ;;
        "container-security")
            create_container_security_config "$2"
            ;;
        "user-service")
            create_user_service_security "$2" "$3"
            ;;
        "selinux-policy")
            create_selinux_policy "$2"
            ;;
        "apparmor-profile")
            create_apparmor_profile "$2" "$3"
            ;;
        "audit")
            audit_service_security "$2"
            ;;
        "test")
            test_security_configuration "$2"
            ;;
        "apply-policies")
            apply_security_policies
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