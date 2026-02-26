#!/bin/bash
# bootc System Management Examples

echo "=== bootc System Management ==="

# System monitoring and status
echo "=== System Monitoring and Status ==="

# Comprehensive system status check
cat > /tmp/bootc-system-status.sh << 'EOF'
#!/bin/bash
# Comprehensive bootc system status

echo "=== bootc System Status Report ==="
echo "Generated: $(date)"
echo "Hostname: $(hostname)"
echo

# Current deployment information
echo "Current Deployment:"
bootc status | head -20

echo
echo "All Deployments:"
bootc status

echo
echo "System Image Information:"
bootc status --json | jq -r '.status.booted.image // "No image information"' 2>/dev/null || \
    bootc status | grep -E "Image:|Digest:" || echo "Image info not available"

echo
echo "Container Runtime Status:"
podman system info --format="{{.Host.OCIRuntime.Name}} {{.Host.OCIRuntime.Version}}" 2>/dev/null || \
    echo "Podman not available"

echo
echo "Registry Connectivity:"
for registry in quay.io docker.io registry.fedoraproject.org; do
    if curl -s -I "https://$registry" >/dev/null 2>&1; then
        echo "✓ $registry: accessible"
    else
        echo "✗ $registry: not accessible"
    fi
done

echo
echo "System Resources:"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}' | sed 's/^[, ]*//')"

echo
echo "bootc Services:"
systemctl status bootc-fetch-apply-updates.service --no-pager --lines=3 2>/dev/null || \
    echo "bootc services not available"
systemctl status bootc-fetch-apply-updates.timer --no-pager --lines=3 2>/dev/null || true

echo
echo "Recent Updates:"
journalctl -u bootc-fetch-apply-updates --since "7 days ago" --no-pager | tail -10 || \
    echo "No recent update logs"

echo
echo "=== End Status Report ==="
EOF

chmod +x /tmp/bootc-system-status.sh
echo "Created comprehensive status script: /tmp/bootc-system-status.sh"

# Update management
echo "=== Update Management ==="

# Automated update management script
cat > /tmp/bootc-update-manager.sh << 'EOF'
#!/bin/bash
# bootc Update Management Script

LOGFILE="/var/log/bootc-updates.log"
NOTIFICATION_EMAIL=""  # Set email for notifications

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

check_updates() {
    log_message "Checking for updates..."
    
    if bootc upgrade --check; then
        log_message "Updates available"
        return 0
    else
        log_message "No updates available"
        return 1
    fi
}

apply_updates() {
    local auto_reboot=${1:-false}
    
    log_message "Applying updates..."
    
    # Create pre-update snapshot info
    bootc status > /tmp/pre-update-status.txt
    
    if bootc upgrade; then
        log_message "Updates downloaded and staged successfully"
        
        if [ "$auto_reboot" = "true" ]; then
            log_message "Auto-reboot enabled, rebooting system..."
            shutdown -r +1 "System rebooting for bootc updates"
        else
            log_message "Updates staged. Reboot required to activate."
            echo "Updates are staged. Run 'sudo reboot' to activate."
        fi
        
        return 0
    else
        log_message "ERROR: Update failed"
        return 1
    fi
}

rollback_system() {
    log_message "Performing system rollback..."
    
    if bootc rollback; then
        log_message "Rollback staged. Reboot required."
        echo "Rollback staged. System will reboot to previous deployment."
        return 0
    else
        log_message "ERROR: Rollback failed"
        return 1
    fi
}

send_notification() {
    local message="$1"
    
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "bootc Update: $(hostname)" "$NOTIFICATION_EMAIL"
    fi
    
    # System notification
    systemd-cat -t bootc-update-manager <<< "$message"
}

case "${1:-check}" in
    check)
        if check_updates; then
            send_notification "Updates available for $(hostname)"
        fi
        ;;
    apply)
        if check_updates; then
            apply_updates "${2:-false}"
        else
            echo "No updates available"
        fi
        ;;
    auto-apply)
        if check_updates; then
            apply_updates true
        fi
        ;;
    rollback)
        rollback_system
        ;;
    status)
        bootc status
        ;;
    *)
        echo "Usage: $0 {check|apply [auto-reboot]|auto-apply|rollback|status}"
        echo "  check      - Check for available updates"
        echo "  apply      - Apply updates (optional: auto-reboot)"
        echo "  auto-apply - Apply updates and auto-reboot"
        echo "  rollback   - Rollback to previous deployment"
        echo "  status     - Show system status"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-update-manager.sh
echo "Created update manager script: /tmp/bootc-update-manager.sh"

# Automated update scheduling
echo "=== Automated Update Scheduling ==="

# Create systemd service for automated updates
cat > /tmp/bootc-auto-update.service << 'EOF'
[Unit]
Description=bootc Automated Update Service
After=network-online.target
Wants=network-online.target
ConditionACPower=true

[Service]
Type=oneshot
ExecStart=/usr/local/bin/bootc-update-manager.sh check
ExecStartPost=/bin/bash -c 'if [ $EXIT_STATUS -eq 0 ]; then /usr/local/bin/bootc-update-manager.sh apply; fi'
StandardOutput=journal
StandardError=journal
User=root

# Security settings
NoNewPrivileges=false
PrivateTmp=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictRealtime=true

# Timeout settings
TimeoutStartSec=1800
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

echo "Created auto-update service: /tmp/bootc-auto-update.service"

# Create systemd timer for scheduled updates
cat > /tmp/bootc-auto-update.timer << 'EOF'
[Unit]
Description=bootc Automated Update Timer
Requires=bootc-auto-update.service

[Timer]
# Run daily at 2 AM
OnCalendar=daily
# Add randomization to prevent all systems updating simultaneously
RandomizedDelaySec=1800
# Ensure timer runs even if system was off
Persistent=true
# Only run on AC power
OnACPower=true

[Install]
WantedBy=timers.target
EOF

echo "Created auto-update timer: /tmp/bootc-auto-update.timer"

# Configuration management
echo "=== Configuration Management ==="

# System configuration backup and restore
cat > /tmp/bootc-config-manager.sh << 'EOF'
#!/bin/bash
# bootc Configuration Management

BACKUP_DIR="/var/lib/bootc-backups"
CONFIG_DIRS="/etc /var/lib /home"

create_backup() {
    local backup_name="${1:-$(date +%Y%m%d-%H%M%S)}"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    echo "Creating configuration backup: $backup_name"
    mkdir -p "$backup_path"
    
    for dir in $CONFIG_DIRS; do
        if [ -d "$dir" ]; then
            echo "Backing up $dir..."
            rsync -av --exclude='*.tmp' --exclude='*cache*' \
                "$dir/" "$backup_path/$(basename $dir)/"
        fi
    done
    
    # Create manifest
    cat > "$backup_path/manifest.txt" << MANIFESTEOF
Backup created: $(date)
Hostname: $(hostname)
bootc status: $(bootc status | head -5)
Kernel: $(uname -r)
Directories: $CONFIG_DIRS
MANIFESTEOF
    
    echo "Backup completed: $backup_path"
}

list_backups() {
    echo "Available backups:"
    ls -la "$BACKUP_DIR" 2>/dev/null || echo "No backups found"
}

restore_backup() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        echo "Backup not found: $backup_name"
        return 1
    fi
    
    echo "WARNING: This will overwrite current configuration!"
    echo "Press Ctrl+C to cancel, Enter to continue..."
    read
    
    for dir in $CONFIG_DIRS; do
        local backup_subdir="$backup_path/$(basename $dir)"
        if [ -d "$backup_subdir" ]; then
            echo "Restoring $dir..."
            rsync -av "$backup_subdir/" "$dir/"
        fi
    done
    
    echo "Restore completed. Reboot may be required."
}

compare_backups() {
    local backup1="$1"
    local backup2="$2"
    
    if [ ! -d "$BACKUP_DIR/$backup1" ] || [ ! -d "$BACKUP_DIR/$backup2" ]; then
        echo "One or both backups not found"
        return 1
    fi
    
    echo "Comparing backups: $backup1 vs $backup2"
    diff -r "$BACKUP_DIR/$backup1" "$BACKUP_DIR/$backup2" || echo "Backups are identical"
}

case "${1:-list}" in
    create)
        create_backup "$2"
        ;;
    list)
        list_backups
        ;;
    restore)
        restore_backup "$2"
        ;;
    compare)
        compare_backups "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {create [name]|list|restore <name>|compare <name1> <name2>}"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-config-manager.sh
echo "Created config manager script: /tmp/bootc-config-manager.sh"

# System health monitoring
echo "=== System Health Monitoring ==="

# Health monitoring script
cat > /tmp/bootc-health-monitor.sh << 'EOF'
#!/bin/bash
# bootc System Health Monitor

ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_MEMORY=90
ALERT_EMAIL=""

check_disk_usage() {
    local usage
    usage=$(df / | awk 'NR==2 {print int($5)}')
    
    if [ "$usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
        echo "ALERT: Disk usage at ${usage}%"
        return 1
    else
        echo "OK: Disk usage at ${usage}%"
        return 0
    fi
}

check_memory_usage() {
    local usage
    usage=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2 * 100}')
    
    if [ "$usage" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
        echo "ALERT: Memory usage at ${usage}%"
        return 1
    else
        echo "OK: Memory usage at ${usage}%"
        return 0
    fi
}

check_bootc_services() {
    local failed_services=()
    
    # Check bootc-related services
    for service in bootc-fetch-apply-updates.service bootc-fetch-apply-updates.timer; do
        if ! systemctl is-active --quiet "$service" 2>/dev/null; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        echo "ALERT: Failed services: ${failed_services[*]}"
        return 1
    else
        echo "OK: All bootc services running"
        return 0
    fi
}

check_container_storage() {
    if command -v podman >/dev/null; then
        local storage_info
        storage_info=$(podman system df 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "OK: Container storage accessible"
            echo "$storage_info" | head -5
            return 0
        else
            echo "ALERT: Container storage issues"
            return 1
        fi
    else
        echo "INFO: Podman not available"
        return 0
    fi
}

check_registry_connectivity() {
    local registries=("quay.io" "registry.fedoraproject.org")
    local failed_registries=()
    
    for registry in "${registries[@]}"; do
        if ! curl -s -I "https://$registry" >/dev/null 2>&1; then
            failed_registries+=("$registry")
        fi
    done
    
    if [ ${#failed_registries[@]} -gt 0 ]; then
        echo "ALERT: Registry connectivity issues: ${failed_registries[*]}"
        return 1
    else
        echo "OK: Registry connectivity"
        return 0
    fi
}

send_alert() {
    local message="$1"
    
    # Log to journal
    systemd-cat -t bootc-health-monitor <<< "$message"
    
    # Send email if configured
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "bootc Health Alert: $(hostname)" "$ALERT_EMAIL"
    fi
}

run_health_check() {
    local alerts=()
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "=== bootc Health Check - $timestamp ==="
    
    # Run all checks
    check_disk_usage || alerts+=("Disk usage high")
    check_memory_usage || alerts+=("Memory usage high")
    check_bootc_services || alerts+=("Service failures")
    check_container_storage || alerts+=("Container storage issues")
    check_registry_connectivity || alerts+=("Registry connectivity")
    
    # Report results
    if [ ${#alerts[@]} -gt 0 ]; then
        local alert_message="Health check failed: ${alerts[*]}"
        echo "OVERALL: ALERT - $alert_message"
        send_alert "$alert_message"
        return 1
    else
        echo "OVERALL: OK - All health checks passed"
        return 0
    fi
}

case "${1:-check}" in
    check)
        run_health_check
        ;;
    disk)
        check_disk_usage
        ;;
    memory)
        check_memory_usage
        ;;
    services)
        check_bootc_services
        ;;
    storage)
        check_container_storage
        ;;
    registry)
        check_registry_connectivity
        ;;
    *)
        echo "Usage: $0 {check|disk|memory|services|storage|registry}"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-health-monitor.sh
echo "Created health monitor script: /tmp/bootc-health-monitor.sh"

# Registry management
echo "=== Registry Management ==="

# Registry management script
cat > /tmp/bootc-registry-manager.sh << 'EOF'
#!/bin/bash
# bootc Registry Management

REGISTRY_CONFIG="/etc/containers/registries.conf"
AUTH_CONFIG="/etc/containers/auth.json"

list_registries() {
    echo "Configured registries:"
    if [ -f "$REGISTRY_CONFIG" ]; then
        grep -E "registry\s*=" "$REGISTRY_CONFIG" | sed 's/.*registry\s*=\s*//' | tr -d '"'
    else
        echo "No registry configuration found"
    fi
}

test_registry() {
    local registry="$1"
    
    if [ -z "$registry" ]; then
        echo "Usage: test_registry <registry>"
        return 1
    fi
    
    echo "Testing registry: $registry"
    
    # Test HTTPS connectivity
    if curl -s -I "https://$registry" >/dev/null; then
        echo "✓ HTTPS connectivity: OK"
    else
        echo "✗ HTTPS connectivity: Failed"
        return 1
    fi
    
    # Test container pull (if authenticated)
    if podman pull --quiet "$registry/hello-world:latest" >/dev/null 2>&1; then
        echo "✓ Container pull: OK"
        podman rmi "$registry/hello-world:latest" >/dev/null 2>&1
    else
        echo "⚠ Container pull: Failed or requires authentication"
    fi
}

login_registry() {
    local registry="$1"
    local username="$2"
    
    if [ -z "$registry" ] || [ -z "$username" ]; then
        echo "Usage: login_registry <registry> <username>"
        return 1
    fi
    
    echo "Logging into registry: $registry"
    podman login "$registry" -u "$username"
    
    # Test authentication
    if podman pull --quiet "$registry/hello-world:latest" >/dev/null 2>&1; then
        echo "✓ Authentication successful"
        podman rmi "$registry/hello-world:latest" >/dev/null 2>&1
    else
        echo "⚠ Authentication test inconclusive"
    fi
}

show_auth_status() {
    echo "Registry authentication status:"
    
    if [ -f "$AUTH_CONFIG" ]; then
        echo "Authenticated registries:"
        jq -r '.auths | keys[]' "$AUTH_CONFIG" 2>/dev/null || \
            echo "Unable to parse auth config"
    else
        echo "No authentication configuration found"
    fi
}

configure_insecure_registry() {
    local registry="$1"
    
    if [ -z "$registry" ]; then
        echo "Usage: configure_insecure_registry <registry>"
        return 1
    fi
    
    echo "Configuring insecure registry: $registry"
    echo "This will allow HTTP connections to $registry"
    
    # Backup existing config
    if [ -f "$REGISTRY_CONFIG" ]; then
        cp "$REGISTRY_CONFIG" "${REGISTRY_CONFIG}.backup"
    fi
    
    # Add insecure registry configuration
    cat >> "$REGISTRY_CONFIG" << REGEOF

[[registry]]
location = "$registry"
insecure = true
REGEOF

    echo "Configuration updated. Restart container services if needed."
}

case "${1:-list}" in
    list)
        list_registries
        ;;
    test)
        test_registry "$2"
        ;;
    login)
        login_registry "$2" "$3"
        ;;
    auth-status)
        show_auth_status
        ;;
    insecure)
        configure_insecure_registry "$2"
        ;;
    *)
        echo "Usage: $0 {list|test <registry>|login <registry> <username>|auth-status|insecure <registry>}"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-registry-manager.sh
echo "Created registry manager script: /tmp/bootc-registry-manager.sh"

echo "System management examples completed!"
echo "Scripts created in /tmp/ - copy to appropriate locations as needed"
echo "Recommended locations:"
echo "  /usr/local/bin/ - for system-wide scripts"
echo "  /etc/systemd/system/ - for systemd service files"