#!/bin/bash
# bootc Basic Usage Examples

# System status and information
echo "=== System Status and Information ==="

# Check current system status and deployments
echo "Current system status:"
bootc status

# Show status in JSON format for parsing
echo "System status (JSON):"
bootc status --json

# Display booted deployment information
echo "Currently booted deployment:"
bootc status --booted

# Check system update availability
echo "=== Update Management ==="

# Check for available updates without applying
echo "Checking for updates:"
bootc upgrade --check

# Download and stage updates (no reboot)
echo "Staging updates:"
bootc upgrade

# Apply updates with automatic reboot
echo "Apply updates and reboot:"
bootc upgrade --apply

# Force update check and apply if available
echo "Force check and apply updates:"
bootc upgrade --apply --check

# Image switching examples
echo "=== Image Switching ==="

# Switch to a different container image
echo "Switch to Fedora 40:"
bootc switch quay.io/fedora/fedora-bootc:40

# Switch with automatic application (reboot)
echo "Switch and apply immediately:"
bootc switch --apply quay.io/fedora/fedora-bootc:41

# Switch using specific transport
echo "Switch using registry transport:"
bootc switch --transport registry myimage:latest

# System rollback and recovery
echo "=== Rollback and Recovery ==="

# Rollback to previous deployment
echo "Rollback to previous deployment:"
bootc rollback

# Note: After rollback, reboot is required
echo "Reboot to activate rollback:"
# systemctl reboot

# Container operations
echo "=== Container Operations ==="

# Lint current system for bootc compatibility
echo "Lint bootc container compatibility:"
bootc container lint

# Check container signatures and policies
echo "Upgrade with signature policy enforcement:"
bootc upgrade --enforce-container-sigpolicy

# Retain more previous deployments
echo "Upgrade while retaining previous deployments:"
bootc upgrade --retain

# Advanced status checking
echo "=== Advanced System Information ==="

# Check ostree status (underlying technology)
echo "OSTree deployment status:"
ostree admin status 2>/dev/null || echo "ostree command not available"

# Check systemd services related to bootc
echo "bootc-related systemd services:"
systemctl status bootc-fetch-apply-updates.service --no-pager || true
systemctl status bootc-fetch-apply-updates.timer --no-pager || true

# Container registry information
echo "Container registry login status:"
podman system info --format '{{.Registries}}' 2>/dev/null || echo "podman not available"

# System logs for bootc operations
echo "Recent bootc logs:"
journalctl -u bootc-fetch-apply-updates --since "24 hours ago" --no-pager | tail -10 || true

# Disk usage and storage information
echo "=== Storage Information ==="

# Check available disk space
echo "Disk usage:"
df -h / /boot /var 2>/dev/null || df -h /

# Check container storage usage
echo "Container storage usage:"
podman system df 2>/dev/null || echo "podman not available"

# Example automation scripts
echo "=== Automation Examples ==="

# Create update check script
cat > /tmp/bootc-update-check.sh << 'EOF'
#!/bin/bash
# Automated bootc update checker

# Check for updates
if bootc upgrade --check; then
    echo "Updates available"
    
    # Optional: Send notification
    echo "Updates available for $(hostname)" | \
        systemd-cat -t bootc-update-check
    
    # Optional: Auto-apply updates (uncomment if desired)
    # bootc upgrade --apply
else
    echo "No updates available"
fi
EOF

chmod +x /tmp/bootc-update-check.sh
echo "Created update check script: /tmp/bootc-update-check.sh"

# Create system info script
cat > /tmp/bootc-system-info.sh << 'EOF'
#!/bin/bash
# bootc System Information Script

echo "=== bootc System Information ==="
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo

echo "Current Deployment:"
bootc status | head -20

echo
echo "Available Deployments:"
bootc status | grep -E "(●|○)" || echo "No deployment information available"

echo
echo "Last Update Check:"
systemctl show bootc-fetch-apply-updates.timer --property=LastTriggerUSec

echo
echo "System Uptime:"
uptime

echo
echo "Disk Usage:"
df -h / | tail -1
EOF

chmod +x /tmp/bootc-system-info.sh
echo "Created system info script: /tmp/bootc-system-info.sh"

# Example systemd service for automated updates
cat > /tmp/bootc-auto-update.service << 'EOF'
[Unit]
Description=Automated bootc Updates
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/bootc upgrade --check
ExecStartPost=/bin/bash -c 'if [ $EXIT_STATUS -eq 0 ]; then /usr/bin/bootc upgrade --apply; fi'
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "Created systemd service template: /tmp/bootc-auto-update.service"
echo "Install with: sudo cp /tmp/bootc-auto-update.service /etc/systemd/system/"

# Example systemd timer for scheduled updates
cat > /tmp/bootc-auto-update.timer << 'EOF'
[Unit]
Description=Automated bootc Updates Timer
Requires=bootc-auto-update.service

[Timer]
# Run every day at 2 AM
OnCalendar=daily
RandomizedDelaySec=30min
Persistent=true

[Install]
WantedBy=timers.target
EOF

echo "Created systemd timer template: /tmp/bootc-auto-update.timer"
echo "Install with: sudo cp /tmp/bootc-auto-update.timer /etc/systemd/system/"

echo "Basic usage examples completed!"
echo "Run with: bash /home/bodnar/.claude/snippets/bootc/basic-usage.sh"