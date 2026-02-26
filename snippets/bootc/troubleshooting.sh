#!/bin/bash
# bootc Troubleshooting and Diagnostic Tools

echo "=== bootc Troubleshooting and Diagnostics ==="

# System diagnostics script
echo "=== System Diagnostics ==="
cat > /tmp/bootc-diagnostics.sh << 'EOF'
#!/bin/bash
# Comprehensive bootc system diagnostics

echo "=== bootc System Diagnostics ==="
echo "Generated: $(date)"
echo "Hostname: $(hostname)"
echo "Kernel: $(uname -r)"
echo

# Check if system is bootc-managed
echo "1. bootc System Check:"
if command -v bootc >/dev/null; then
    echo "✓ bootc command available"
    bootc --version 2>/dev/null || echo "bootc version not available"
    
    if bootc status >/dev/null 2>&1; then
        echo "✓ System is bootc-managed"
        echo "Current status:"
        bootc status | head -10
    else
        echo "✗ System may not be bootc-managed or has issues"
        echo "Error output:"
        bootc status 2>&1 | head -5
    fi
else
    echo "✗ bootc command not found"
    echo "This system may not be using bootc"
fi

echo

# Check ostree status
echo "2. ostree Status:"
if command -v ostree >/dev/null; then
    echo "✓ ostree available"
    echo "Deployments:"
    ostree admin status 2>/dev/null || echo "Error getting ostree status"
else
    echo "⚠ ostree not available"
fi

echo

# Check container runtime
echo "3. Container Runtime:"
if command -v podman >/dev/null; then
    echo "✓ Podman available"
    podman --version
    echo "System info:"
    podman system info --format="Store: {{.Store.GraphRoot}} ({{.Store.GraphDriverName}})"
    echo "Container images:"
    podman images --format="table {{.Repository}}:{{.Tag}} {{.Size}}" | head -10
else
    echo "✗ Podman not available"
fi

echo

# Check systemd services
echo "4. systemd Services:"
for service in bootc-fetch-apply-updates.service bootc-fetch-apply-updates.timer; do
    if systemctl list-unit-files | grep -q "$service"; then
        status=$(systemctl is-active "$service" 2>/dev/null)
        enabled=$(systemctl is-enabled "$service" 2>/dev/null)
        echo "$service: $status ($enabled)"
        
        if [ "$status" = "failed" ]; then
            echo "  Last failure:"
            journalctl -u "$service" --no-pager --lines=3 | tail -3
        fi
    else
        echo "$service: not found"
    fi
done

echo

# Check disk space
echo "5. Storage Status:"
echo "Disk usage:"
df -h / /boot /var 2>/dev/null | grep -v "^Filesystem"

if command -v podman >/dev/null; then
    echo "Container storage:"
    podman system df 2>/dev/null || echo "Cannot get container storage info"
fi

echo

# Check network connectivity
echo "6. Network Connectivity:"
registries=("quay.io" "registry.fedoraproject.org" "docker.io")
for registry in "${registries[@]}"; do
    if curl -s -I --connect-timeout 5 "https://$registry" >/dev/null 2>&1; then
        echo "✓ $registry: accessible"
    else
        echo "✗ $registry: not accessible"
    fi
done

echo

# Check recent logs
echo "7. Recent System Logs:"
echo "Last 10 bootc-related log entries:"
journalctl -t bootc-fetch-apply-updates --no-pager --since "24 hours ago" | tail -10 || \
    echo "No recent bootc logs found"

echo

# Check system resources
echo "8. System Resources:"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Load average: $(uptime | awk -F'load average:' '{print $2}' | sed 's/^[, ]*//')"
echo "Processes: $(ps aux | wc -l)"

echo

# Check boot status
echo "9. Boot Status:"
if [ -f /proc/cmdline ]; then
    echo "Kernel command line:"
    cat /proc/cmdline
fi

if command -v systemd-analyze >/dev/null; then
    echo "Boot time:"
    systemd-analyze time 2>/dev/null || echo "Boot time analysis not available"
fi

echo
echo "=== Diagnostics Complete ==="
EOF

chmod +x /tmp/bootc-diagnostics.sh
echo "Created comprehensive diagnostics script: /tmp/bootc-diagnostics.sh"

# Update troubleshooting
echo "=== Update Troubleshooting ==="
cat > /tmp/bootc-update-troubleshoot.sh << 'EOF'
#!/bin/bash
# bootc Update Troubleshooting

echo "=== bootc Update Troubleshooting ==="

check_update_status() {
    echo "1. Update Status Check:"
    
    echo "Current bootc status:"
    bootc status | head -15
    
    echo
    echo "Staged updates:"
    bootc status | grep -A 5 -B 5 "staged" || echo "No staged updates"
    
    echo
    echo "Update service status:"
    systemctl status bootc-fetch-apply-updates.service --no-pager --lines=5
    systemctl status bootc-fetch-apply-updates.timer --no-pager --lines=3
}

check_registry_issues() {
    echo "2. Registry Connectivity:"
    
    # Get current image reference
    local current_image
    current_image=$(bootc status --json 2>/dev/null | jq -r '.status.booted.image.imageReference // empty')
    
    if [ -n "$current_image" ]; then
        echo "Current image: $current_image"
        
        # Extract registry from image reference
        local registry
        registry=$(echo "$current_image" | cut -d'/' -f1)
        
        echo "Testing registry: $registry"
        if curl -s -I --connect-timeout 10 "https://$registry" >/dev/null; then
            echo "✓ Registry accessible"
            
            # Test image pull
            echo "Testing image pull..."
            if podman pull --quiet "$current_image" >/dev/null 2>&1; then
                echo "✓ Image pull successful"
            else
                echo "✗ Image pull failed"
                echo "Attempting manual pull:"
                podman pull "$current_image" 2>&1 | head -10
            fi
        else
            echo "✗ Registry not accessible"
        fi
    else
        echo "Cannot determine current image reference"
    fi
}

check_storage_issues() {
    echo "3. Storage Issues:"
    
    echo "Available disk space:"
    df -h / /boot /var | grep -v "^Filesystem"
    
    # Check for low disk space
    local root_usage
    root_usage=$(df / | awk 'NR==2 {print int($5)}')
    
    if [ "$root_usage" -gt 90 ]; then
        echo "⚠ WARNING: Root filesystem ${root_usage}% full"
        echo "This may prevent updates from being applied"
    fi
    
    echo
    echo "Container storage:"
    if command -v podman >/dev/null; then
        podman system df 2>/dev/null
        
        echo
        echo "Cleaning up container storage:"
        podman system prune -f 2>/dev/null && echo "✓ Container cleanup completed"
    fi
}

check_service_logs() {
    echo "4. Service Logs Analysis:"
    
    echo "Recent update service logs:"
    journalctl -u bootc-fetch-apply-updates.service --since "24 hours ago" --no-pager | tail -20
    
    echo
    echo "Error messages in logs:"
    journalctl -u bootc-fetch-apply-updates.service --since "7 days ago" --no-pager | \
        grep -i -E "error|fail|timeout|denied" | tail -10 || echo "No error messages found"
}

force_update_check() {
    echo "5. Force Update Check:"
    
    echo "Manually checking for updates..."
    if bootc upgrade --check; then
        echo "✓ Updates are available"
        
        echo "Would you like to apply updates now? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo "Applying updates..."
            bootc upgrade
            echo "Updates staged. Reboot to activate."
        fi
    else
        update_exit_code=$?
        echo "✗ Update check failed (exit code: $update_exit_code)"
        
        if [ $update_exit_code -eq 1 ]; then
            echo "This usually means no updates are available"
        else
            echo "This indicates an error occurred during update check"
        fi
    fi
}

reset_update_state() {
    echo "6. Reset Update State:"
    
    echo "WARNING: This will reset the update state"
    echo "Continue? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Stopping update services..."
        systemctl stop bootc-fetch-apply-updates.service 2>/dev/null || true
        systemctl stop bootc-fetch-apply-updates.timer 2>/dev/null || true
        
        echo "Cleaning container storage..."
        podman system prune -f 2>/dev/null || true
        
        echo "Restarting update services..."
        systemctl start bootc-fetch-apply-updates.timer 2>/dev/null || true
        
        echo "Update state reset completed"
    fi
}

case "${1:-all}" in
    status)
        check_update_status
        ;;
    registry)
        check_registry_issues
        ;;
    storage)
        check_storage_issues
        ;;
    logs)
        check_service_logs
        ;;
    force)
        force_update_check
        ;;
    reset)
        reset_update_state
        ;;
    all)
        check_update_status
        echo
        check_registry_issues
        echo
        check_storage_issues
        echo
        check_service_logs
        ;;
    *)
        echo "Usage: $0 {status|registry|storage|logs|force|reset|all}"
        echo "  status   - Check update status and deployments"
        echo "  registry - Test registry connectivity and image access"
        echo "  storage  - Check disk space and container storage"
        echo "  logs     - Analyze service logs for errors"
        echo "  force    - Force update check and optional application"
        echo "  reset    - Reset update state (stops/starts services)"
        echo "  all      - Run all checks except force and reset"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-update-troubleshoot.sh
echo "Created update troubleshooting script: /tmp/bootc-update-troubleshoot.sh"

# Boot troubleshooting
echo "=== Boot Troubleshooting ==="
cat > /tmp/bootc-boot-troubleshoot.sh << 'EOF'
#!/bin/bash
# bootc Boot Troubleshooting

echo "=== bootc Boot Troubleshooting ==="

check_boot_entries() {
    echo "1. Boot Entries:"
    
    if command -v bootctl >/dev/null; then
        echo "systemd-boot entries:"
        bootctl list 2>/dev/null || echo "Cannot list boot entries"
        
        echo
        echo "Boot loader status:"
        bootctl status 2>/dev/null || echo "Cannot get boot loader status"
    else
        echo "systemd-boot not available"
    fi
    
    echo
    echo "GRUB entries:"
    if [ -f /boot/grub2/grub.cfg ]; then
        echo "GRUB configuration found"
        grep -E "menuentry|linux" /boot/grub2/grub.cfg | head -10
    elif [ -f /boot/grub/grub.cfg ]; then
        echo "GRUB configuration found"
        grep -E "menuentry|linux" /boot/grub/grub.cfg | head -10
    else
        echo "GRUB configuration not found"
    fi
}

check_ostree_deployments() {
    echo "2. ostree Deployments:"
    
    if command -v ostree >/dev/null; then
        echo "Available deployments:"
        ostree admin status
        
        echo
        echo "Boot configuration:"
        ostree admin config-diff --print-current-dir 2>/dev/null || \
            echo "Cannot get config diff"
    else
        echo "ostree not available"
    fi
}

check_kernel_issues() {
    echo "3. Kernel Issues:"
    
    echo "Current kernel:"
    uname -a
    
    echo
    echo "Available kernels:"
    ls -la /boot/vmlinuz* 2>/dev/null || echo "No kernels found in /boot"
    
    echo
    echo "Kernel modules:"
    if [ -d "/lib/modules/$(uname -r)" ]; then
        echo "✓ Kernel modules available for current kernel"
        ls /lib/modules/$(uname -r)/ | head -5
    else
        echo "✗ Kernel modules missing for current kernel"
    fi
    
    echo
    echo "Recent kernel messages:"
    dmesg | tail -10
}

check_systemd_boot() {
    echo "4. systemd Boot Analysis:"
    
    echo "Boot time analysis:"
    systemd-analyze time 2>/dev/null || echo "Boot time analysis not available"
    
    echo
    echo "Critical chain:"
    systemd-analyze critical-chain 2>/dev/null | head -10 || \
        echo "Critical chain analysis not available"
    
    echo
    echo "Failed services:"
    systemctl --failed --no-legend || echo "No failed services"
    
    echo
    echo "Boot messages:"
    journalctl -b --no-pager | grep -i -E "error|fail|warn" | tail -10 || \
        echo "No error messages in boot log"
}

check_filesystem_issues() {
    echo "5. Filesystem Issues:"
    
    echo "Filesystem status:"
    df -h / /boot /var 2>/dev/null
    
    echo
    echo "Filesystem errors:"
    dmesg | grep -i -E "filesystem|ext4|xfs|error" | tail -5 || \
        echo "No filesystem errors in dmesg"
    
    echo
    echo "Mount status:"
    mount | grep -E "/ |/boot |/var " || echo "Cannot determine mount status"
    
    # Check for read-only filesystem
    if touch /tmp/bootc-write-test 2>/dev/null; then
        rm -f /tmp/bootc-write-test
        echo "✓ Root filesystem is writable"
    else
        echo "✗ Root filesystem may be read-only"
    fi
}

rollback_instructions() {
    echo "6. Rollback Instructions:"
    
    echo "Available deployments for rollback:"
    bootc status | grep -E "●|○" | head -5
    
    echo
    echo "To rollback to previous deployment:"
    echo "1. Run: bootc rollback"
    echo "2. Reboot the system"
    echo "3. Previous deployment will become active"
    
    echo
    echo "Emergency rollback from GRUB:"
    echo "1. At GRUB menu, select previous deployment"
    echo "2. Boot into previous system"
    echo "3. Run 'bootc rollback' to make it permanent"
}

rescue_mode_info() {
    echo "7. Rescue Mode Information:"
    
    echo "Entering rescue mode:"
    echo "1. Add 'systemd.unit=rescue.target' to kernel command line"
    echo "2. Or add 'single' or '1' to boot into single-user mode"
    echo "3. Use 'systemctl isolate multi-user.target' to return to normal"
    
    echo
    echo "Emergency shell:"
    echo "1. Add 'systemd.unit=emergency.target' to kernel command line"
    echo "2. This provides a minimal shell for system recovery"
    
    echo
    echo "Live image recovery:"
    echo "1. Boot from Fedora/RHEL live image"
    echo "2. Mount the bootc filesystem"
    echo "3. Use 'chroot' to access the installed system"
}

case "${1:-all}" in
    boot-entries)
        check_boot_entries
        ;;
    deployments)
        check_ostree_deployments
        ;;
    kernel)
        check_kernel_issues
        ;;
    systemd)
        check_systemd_boot
        ;;
    filesystem)
        check_filesystem_issues
        ;;
    rollback)
        rollback_instructions
        ;;
    rescue)
        rescue_mode_info
        ;;
    all)
        check_boot_entries
        echo
        check_ostree_deployments
        echo
        check_kernel_issues
        echo
        check_systemd_boot
        echo
        check_filesystem_issues
        ;;
    *)
        echo "Usage: $0 {boot-entries|deployments|kernel|systemd|filesystem|rollback|rescue|all}"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-boot-troubleshoot.sh
echo "Created boot troubleshooting script: /tmp/bootc-boot-troubleshoot.sh"

# Network troubleshooting
echo "=== Network Troubleshooting ==="
cat > /tmp/bootc-network-troubleshoot.sh << 'EOF'
#!/bin/bash
# bootc Network Troubleshooting

echo "=== bootc Network Troubleshooting ==="

check_basic_connectivity() {
    echo "1. Basic Network Connectivity:"
    
    echo "Network interfaces:"
    ip link show | grep -E "^[0-9]+:" | head -5
    
    echo
    echo "IP addresses:"
    ip addr show | grep -E "inet " | head -5
    
    echo
    echo "Default gateway:"
    ip route show default | head -3
    
    echo
    echo "DNS servers:"
    if [ -f /etc/resolv.conf ]; then
        grep nameserver /etc/resolv.conf | head -3
    else
        echo "No /etc/resolv.conf found"
    fi
    
    echo
    echo "Internet connectivity:"
    if ping -c 1 -W 5 8.8.8.8 >/dev/null 2>&1; then
        echo "✓ Internet connectivity (IPv4)"
    else
        echo "✗ No internet connectivity (IPv4)"
    fi
}

check_dns_resolution() {
    echo "2. DNS Resolution:"
    
    test_domains=("google.com" "quay.io" "registry.fedoraproject.org")
    
    for domain in "${test_domains[@]}"; do
        if nslookup "$domain" >/dev/null 2>&1; then
            echo "✓ $domain: resolved"
        else
            echo "✗ $domain: resolution failed"
        fi
    done
    
    echo
    echo "DNS configuration:"
    if command -v systemd-resolve >/dev/null; then
        systemd-resolved --status 2>/dev/null | head -10 || echo "systemd-resolved not available"
    fi
}

check_registry_connectivity() {
    echo "3. Container Registry Connectivity:"
    
    registries=("quay.io" "docker.io" "registry.fedoraproject.org" "ghcr.io")
    
    for registry in "${registries[@]}"; do
        echo "Testing $registry:"
        
        # Test HTTPS connectivity
        if curl -s -I --connect-timeout 10 "https://$registry" >/dev/null; then
            echo "  ✓ HTTPS connectivity"
        else
            echo "  ✗ HTTPS connectivity failed"
            continue
        fi
        
        # Test registry API
        if curl -s --connect-timeout 10 "https://$registry/v2/" | grep -q "401\|200" 2>/dev/null; then
            echo "  ✓ Registry API accessible"
        else
            echo "  ⚠ Registry API test inconclusive"
        fi
    done
}

check_proxy_settings() {
    echo "4. Proxy Settings:"
    
    proxy_vars=("http_proxy" "https_proxy" "HTTP_PROXY" "HTTPS_PROXY" "no_proxy" "NO_PROXY")
    
    echo "Environment proxy variables:"
    for var in "${proxy_vars[@]}"; do
        if [ -n "${!var}" ]; then
            echo "  $var=${!var}"
        fi
    done
    
    echo
    echo "System proxy configuration:"
    if [ -f /etc/environment ]; then
        grep -i proxy /etc/environment 2>/dev/null || echo "  No proxy in /etc/environment"
    fi
    
    echo
    echo "Container proxy configuration:"
    if [ -f /etc/containers/containers.conf ]; then
        grep -i proxy /etc/containers/containers.conf 2>/dev/null || \
            echo "  No proxy in containers.conf"
    fi
}

check_firewall_settings() {
    echo "5. Firewall Settings:"
    
    if command -v firewall-cmd >/dev/null; then
        echo "firewalld status:"
        firewall-cmd --state 2>/dev/null || echo "  firewalld not running"
        
        if firewall-cmd --state >/dev/null 2>&1; then
            echo "  Active zones:"
            firewall-cmd --get-active-zones 2>/dev/null | head -10
            
            echo "  Default zone:"
            firewall-cmd --get-default-zone 2>/dev/null
        fi
    else
        echo "firewalld not available"
    fi
    
    echo
    echo "iptables rules:"
    if command -v iptables >/dev/null; then
        rule_count=$(iptables -L | wc -l)
        echo "  iptables rules: $rule_count lines"
        
        if [ "$rule_count" -gt 20 ]; then
            echo "  Complex iptables configuration detected"
            iptables -L | grep -E "REJECT|DROP" | head -5
        fi
    else
        echo "  iptables not available"
    fi
}

check_selinux_network() {
    echo "6. SELinux Network Settings:"
    
    if command -v getenforce >/dev/null; then
        selinux_status=$(getenforce 2>/dev/null)
        echo "SELinux status: $selinux_status"
        
        if [ "$selinux_status" = "Enforcing" ]; then
            echo "SELinux network-related denials:"
            ausearch -m avc -ts recent 2>/dev/null | grep -i network | tail -3 || \
                echo "  No recent network-related SELinux denials"
        fi
    else
        echo "SELinux tools not available"
    fi
}

test_specific_connections() {
    echo "7. Specific Connection Tests:"
    
    # Test current bootc image registry
    current_image=$(bootc status --json 2>/dev/null | jq -r '.status.booted.image.imageReference // empty')
    
    if [ -n "$current_image" ]; then
        registry=$(echo "$current_image" | cut -d'/' -f1)
        echo "Testing connection to current image registry: $registry"
        
        # Test HTTPS
        if curl -s -I --connect-timeout 15 "https://$registry" >/dev/null; then
            echo "  ✓ HTTPS connection successful"
        else
            echo "  ✗ HTTPS connection failed"
        fi
        
        # Test image pull
        echo "Testing image pull (this may take time):"
        if timeout 60 podman pull --quiet "$current_image" >/dev/null 2>&1; then
            echo "  ✓ Image pull successful"
        else
            echo "  ✗ Image pull failed or timed out"
            echo "Manual test command: podman pull $current_image"
        fi
    else
        echo "Cannot determine current image registry"
    fi
}

network_recovery_suggestions() {
    echo "8. Network Recovery Suggestions:"
    
    echo "Common fixes:"
    echo "1. Restart network services:"
    echo "   systemctl restart NetworkManager"
    echo "   systemctl restart systemd-networkd"
    echo "   systemctl restart systemd-resolved"
    echo
    echo "2. Reset network configuration:"
    echo "   nmcli networking off && nmcli networking on"
    echo
    echo "3. Clear DNS cache:"
    echo "   systemctl flush-dns"
    echo "   resolvectl flush-caches"
    echo
    echo "4. Check proxy settings:"
    echo "   unset http_proxy https_proxy (temporarily)"
    echo
    echo "5. Disable firewall temporarily:"
    echo "   systemctl stop firewalld (for testing only)"
    echo
    echo "6. Test with different DNS:"
    echo "   echo 'nameserver 8.8.8.8' > /etc/resolv.conf (temporarily)"
}

case "${1:-all}" in
    connectivity)
        check_basic_connectivity
        ;;
    dns)
        check_dns_resolution
        ;;
    registry)
        check_registry_connectivity
        ;;
    proxy)
        check_proxy_settings
        ;;
    firewall)
        check_firewall_settings
        ;;
    selinux)
        check_selinux_network
        ;;
    test)
        test_specific_connections
        ;;
    recovery)
        network_recovery_suggestions
        ;;
    all)
        check_basic_connectivity
        echo
        check_dns_resolution
        echo
        check_registry_connectivity
        echo
        check_proxy_settings
        echo
        check_firewall_settings
        echo
        check_selinux_network
        echo
        test_specific_connections
        ;;
    *)
        echo "Usage: $0 {connectivity|dns|registry|proxy|firewall|selinux|test|recovery|all}"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-network-troubleshoot.sh
echo "Created network troubleshooting script: /tmp/bootc-network-troubleshoot.sh"

# Log analysis tools
echo "=== Log Analysis Tools ==="
cat > /tmp/bootc-log-analyzer.sh << 'EOF'
#!/bin/bash
# bootc Log Analysis Tool

echo "=== bootc Log Analysis ==="

analyze_bootc_logs() {
    echo "1. bootc Service Logs:"
    
    # Recent bootc logs
    echo "Recent bootc-fetch-apply-updates logs:"
    journalctl -u bootc-fetch-apply-updates.service --since "7 days ago" --no-pager | tail -20
    
    echo
    echo "Error patterns in bootc logs:"
    journalctl -u bootc-fetch-apply-updates.service --since "30 days ago" --no-pager | \
        grep -i -E "error|fail|timeout|denied|refused" | tail -10 || \
        echo "No error patterns found"
    
    echo
    echo "Update patterns:"
    journalctl -u bootc-fetch-apply-updates.service --since "30 days ago" --no-pager | \
        grep -i -E "update|upgrade|stage|apply" | tail -10 || \
        echo "No update patterns found"
}

analyze_boot_logs() {
    echo "2. Boot Log Analysis:"
    
    echo "Boot messages:"
    journalctl -b --no-pager | head -20
    
    echo
    echo "Boot errors and warnings:"
    journalctl -b --no-pager | grep -i -E "error|fail|warn" | head -15 || \
        echo "No boot errors or warnings"
    
    echo
    echo "Service startup issues:"
    journalctl -b --no-pager | grep -i -E "failed to start|timeout" | head -10 || \
        echo "No service startup issues"
}

analyze_container_logs() {
    echo "3. Container Runtime Logs:"
    
    if command -v podman >/dev/null; then
        echo "Podman service logs:"
        journalctl -u podman --since "24 hours ago" --no-pager | tail -15 || \
            echo "No podman service logs"
        
        echo
        echo "Container errors:"
        journalctl --since "24 hours ago" --no-pager | \
            grep -i -E "podman|container" | grep -i -E "error|fail" | tail -10 || \
            echo "No container errors found"
    else
        echo "Podman not available"
    fi
}

analyze_system_logs() {
    echo "4. System Log Analysis:"
    
    echo "System errors (last 24 hours):"
    journalctl --since "24 hours ago" --no-pager | \
        grep -i -E "error|fail|critical" | head -15 || \
        echo "No system errors found"
    
    echo
    echo "Kernel messages:"
    dmesg | tail -15
    
    echo
    echo "Authentication logs:"
    journalctl _SYSTEMD_UNIT=sshd.service --since "24 hours ago" --no-pager | tail -10 || \
        echo "No SSH authentication logs"
}

generate_log_report() {
    echo "5. Log Report Generation:"
    
    local report_file="/tmp/bootc-log-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "bootc Log Report"
        echo "Generated: $(date)"
        echo "Hostname: $(hostname)"
        echo "==============================="
        echo
        
        echo "bootc Status:"
        bootc status 2>&1
        echo
        
        echo "Recent bootc Logs:"
        journalctl -u bootc-fetch-apply-updates.service --since "7 days ago" --no-pager
        echo
        
        echo "Boot Logs:"
        journalctl -b --no-pager | head -50
        echo
        
        echo "System Errors:"
        journalctl --since "24 hours ago" --no-pager | grep -i -E "error|fail|critical"
        echo
        
        echo "Container Logs:"
        if command -v podman >/dev/null; then
            journalctl -u podman --since "24 hours ago" --no-pager
        fi
        
    } > "$report_file"
    
    echo "Log report generated: $report_file"
    echo "Report size: $(du -h "$report_file" | cut -f1)"
}

search_logs() {
    local search_term="$1"
    local days="${2:-7}"
    
    if [ -z "$search_term" ]; then
        echo "Usage: search_logs <search_term> [days_back]"
        return 1
    fi
    
    echo "Searching for '$search_term' in logs (last $days days):"
    
    # Search in bootc logs
    echo "bootc service logs:"
    journalctl -u bootc-fetch-apply-updates.service --since "${days} days ago" --no-pager | \
        grep -i "$search_term" | tail -10 || echo "  No matches in bootc logs"
    
    echo
    echo "System logs:"
    journalctl --since "${days} days ago" --no-pager | \
        grep -i "$search_term" | tail -15 || echo "  No matches in system logs"
    
    echo
    echo "Kernel logs:"
    dmesg | grep -i "$search_term" | tail -10 || echo "  No matches in kernel logs"
}

monitor_logs_realtime() {
    echo "6. Real-time Log Monitoring:"
    echo "Monitoring bootc and system logs (Ctrl+C to stop)..."
    
    # Follow multiple log sources
    journalctl -f \
        -u bootc-fetch-apply-updates.service \
        -u bootc-fetch-apply-updates.timer \
        --since now
}

case "${1:-all}" in
    bootc)
        analyze_bootc_logs
        ;;
    boot)
        analyze_boot_logs
        ;;
    container)
        analyze_container_logs
        ;;
    system)
        analyze_system_logs
        ;;
    report)
        generate_log_report
        ;;
    search)
        search_logs "$2" "$3"
        ;;
    monitor)
        monitor_logs_realtime
        ;;
    all)
        analyze_bootc_logs
        echo
        analyze_boot_logs
        echo
        analyze_container_logs
        echo
        analyze_system_logs
        ;;
    *)
        echo "Usage: $0 {bootc|boot|container|system|report|search <term> [days]|monitor|all}"
        echo "  bootc     - Analyze bootc service logs"
        echo "  boot      - Analyze boot logs"
        echo "  container - Analyze container runtime logs"
        echo "  system    - Analyze system logs"
        echo "  report    - Generate comprehensive log report"
        echo "  search    - Search for specific term in logs"
        echo "  monitor   - Monitor logs in real-time"
        echo "  all       - Run all analysis except report and monitor"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/bootc-log-analyzer.sh
echo "Created log analysis script: /tmp/bootc-log-analyzer.sh"

echo "Troubleshooting scripts completed!"
echo "All scripts created in /tmp/ - copy to appropriate locations"
echo "Main troubleshooting scripts:"
echo "  - bootc-diagnostics.sh: Comprehensive system diagnostics"
echo "  - bootc-update-troubleshoot.sh: Update-specific troubleshooting"
echo "  - bootc-boot-troubleshoot.sh: Boot and deployment issues"
echo "  - bootc-network-troubleshoot.sh: Network connectivity problems"
echo "  - bootc-log-analyzer.sh: Log analysis and monitoring"