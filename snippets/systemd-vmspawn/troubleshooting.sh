#!/bin/bash
# systemd-vmspawn Troubleshooting Guide and Scripts

echo "=== systemd-vmspawn Troubleshooting Guide ==="

# Comprehensive system check
echo "=== System Requirements Check ==="
cat > /tmp/vmspawn-system-check.sh << 'EOF'
#!/bin/bash
# systemd-vmspawn System Requirements Check

echo "=== systemd-vmspawn System Check ==="

# Check systemd version
echo "1. systemd version:"
SYSTEMD_VERSION=$(systemctl --version | head -1 | awk '{print $2}')
echo "Current version: $SYSTEMD_VERSION"

if [ "$SYSTEMD_VERSION" -ge 255 ]; then
    echo "✓ systemd-vmspawn supported (requires 255+)"
else
    echo "✗ systemd-vmspawn not supported (requires 255+)"
    echo "  Current version: $SYSTEMD_VERSION"
    exit 1
fi

# Check if systemd-vmspawn binary exists
echo "2. systemd-vmspawn binary:"
if command -v systemd-vmspawn >/dev/null; then
    echo "✓ systemd-vmspawn binary found: $(which systemd-vmspawn)"
else
    echo "✗ systemd-vmspawn binary not found"
    echo "  Install systemd version 255+ or newer"
fi

# Check KVM support
echo "3. KVM support:"
if [ -e /dev/kvm ]; then
    if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then
        echo "✓ KVM device accessible"
    else
        echo "⚠ KVM device exists but not accessible"
        echo "  Add user to kvm group: sudo usermod -a -G kvm $USER"
        echo "  Current permissions: $(ls -la /dev/kvm)"
    fi
else
    echo "✗ KVM device not found"
    echo "  Enable virtualization in BIOS/UEFI"
    echo "  Load KVM modules: sudo modprobe kvm kvm_intel  # or kvm_amd"
fi

# Check virtualization support
echo "4. CPU virtualization support:"
if grep -q vmx /proc/cpuinfo; then
    echo "✓ Intel VT-x supported"
elif grep -q svm /proc/cpuinfo; then
    echo "✓ AMD-V supported"
else
    echo "✗ No virtualization support detected"
    echo "  Enable virtualization in BIOS/UEFI"
fi

# Check user groups
echo "5. User group membership:"
USER_GROUPS=$(groups)
echo "Current groups: $USER_GROUPS"

if echo "$USER_GROUPS" | grep -q kvm; then
    echo "✓ User in kvm group"
else
    echo "⚠ User not in kvm group (required for VSock)"
    echo "  Add with: sudo usermod -a -G kvm $USER"
    echo "  Then log out and back in"
fi

# Check systemd-networkd
echo "6. systemd-networkd status:"
if systemctl is-active --quiet systemd-networkd; then
    echo "✓ systemd-networkd is active"
else
    echo "⚠ systemd-networkd not active (required for TAP networking)"
    echo "  Enable with: sudo systemctl enable --now systemd-networkd"
fi

# Check VSock support
echo "7. VSock support:"
if lsmod | grep -q vsock; then
    echo "✓ VSock modules loaded"
    lsmod | grep vsock
else
    echo "⚠ VSock modules not loaded"
    echo "  Load with: sudo modprobe vsock"
fi

# Check available memory
echo "8. System memory:"
TOTAL_MEM=$(free -m | awk '/^Mem:/ {print $2}')
echo "Total memory: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 4096 ]; then
    echo "⚠ Low memory for VMs (< 4GB)"
    echo "  Consider reducing VM memory allocation"
else
    echo "✓ Sufficient memory for VMs"
fi

# Check disk space
echo "9. Disk space in /var/lib/machines:"
if [ -d /var/lib/machines ]; then
    AVAILABLE_SPACE=$(df -h /var/lib/machines | awk 'NR==2 {print $4}')
    echo "Available space: $AVAILABLE_SPACE"
else
    echo "⚠ /var/lib/machines directory not found"
    echo "  Create with: sudo mkdir -p /var/lib/machines"
fi

# Check QEMU installation
echo "10. QEMU installation:"
if command -v qemu-system-x86_64 >/dev/null; then
    echo "✓ QEMU found: $(which qemu-system-x86_64)"
    qemu-system-x86_64 --version | head -1
else
    echo "✗ QEMU not found"
    echo "  Install with package manager (qemu-system-x86)"
fi

echo "=== System check completed ==="
EOF

chmod +x /tmp/vmspawn-system-check.sh

# Common error diagnosis
echo "=== Common Error Diagnosis ==="
cat > /tmp/vmspawn-diagnose-errors.sh << 'EOF'
#!/bin/bash
# systemd-vmspawn Error Diagnosis Script

ERROR_TYPE="${1:-all}"

diagnose_permission_errors() {
    echo "=== Permission Error Diagnosis ==="

    echo "1. KVM permissions:"
    ls -la /dev/kvm
    echo "User groups: $(groups)"

    echo "2. Machine directory permissions:"
    ls -la /var/lib/machines/ 2>/dev/null || echo "/var/lib/machines not found"

    echo "3. Runtime directory permissions:"
    ls -la /run/user/$UID/systemd/ 2>/dev/null || echo "Runtime directory not accessible"

    echo "Solutions:"
    echo "- Add user to kvm group: sudo usermod -a -G kvm \$(whoami)"
    echo "- Create machine directory: sudo mkdir -p /var/lib/machines"
    echo "- Check SELinux/AppArmor policies if enabled"
}

diagnose_network_errors() {
    echo "=== Network Error Diagnosis ==="

    echo "1. systemd-networkd status:"
    systemctl status systemd-networkd --no-pager

    echo "2. TAP interface support:"
    if command -v ip >/dev/null; then
        ip tuntap show | grep vmspawn || echo "No vmspawn TAP interfaces found"
    fi

    echo "3. VSock support:"
    if [ -e /dev/vsock ]; then
        echo "✓ VSock device exists"
        ls -la /dev/vsock
    else
        echo "✗ VSock device not found"
    fi

    echo "4. Network modules:"
    lsmod | grep -E "(tun|tap|vsock|kvm)" || echo "Required network modules not loaded"

    echo "Solutions:"
    echo "- Enable systemd-networkd: sudo systemctl enable --now systemd-networkd"
    echo "- Load VSock modules: sudo modprobe vsock"
    echo "- For TAP networking, run as root or configure proper permissions"
}

diagnose_boot_errors() {
    echo "=== Boot Error Diagnosis ==="

    echo "1. Available firmware:"
    if [ -d /usr/share/qemu/firmware ]; then
        ls -la /usr/share/qemu/firmware/
    else
        echo "QEMU firmware directory not found"
    fi

    echo "2. UEFI/BIOS support:"
    if [ -f /usr/share/ovmf/OVMF.fd ]; then
        echo "✓ OVMF firmware found"
    else
        echo "⚠ OVMF firmware not found (install ovmf package)"
    fi

    echo "3. Secure Boot support:"
    systemd-vmspawn --firmware=list 2>/dev/null | grep -i secure || echo "No Secure Boot firmware listed"

    echo "Solutions:"
    echo "- Install OVMF firmware: sudo apt install ovmf (or equivalent)"
    echo "- Try different firmware: systemd-vmspawn --firmware=list"
    echo "- Disable Secure Boot: --secure-boot=no"
}

diagnose_resource_errors() {
    echo "=== Resource Error Diagnosis ==="

    echo "1. Memory usage:"
    free -h

    echo "2. Running VMs:"
    machinectl list 2>/dev/null | grep vmspawn || echo "No VMs currently running"

    echo "3. Disk space:"
    df -h /var/lib/machines 2>/dev/null || echo "Cannot check /var/lib/machines"

    echo "4. CPU load:"
    uptime

    echo "Solutions:"
    echo "- Reduce VM memory allocation: --ram=1G"
    echo "- Reduce CPU allocation: --cpus=1"
    echo "- Clean up old VM images in /var/lib/machines"
    echo "- Stop unused VMs: machinectl terminate <vm-name>"
}

diagnose_service_errors() {
    echo "=== Service Error Diagnosis ==="

    echo "1. systemd-vmspawn service status:"
    systemctl status systemd-vmspawn@*.service --no-pager 2>/dev/null || echo "No vmspawn services found"

    echo "2. machined service status:"
    systemctl status systemd-machined --no-pager

    echo "3. Recent systemd-vmspawn logs:"
    journalctl -u systemd-vmspawn@* --since="1 hour ago" --no-pager | tail -20

    echo "Solutions:"
    echo "- Check service configuration files in /etc/systemd/system/"
    echo "- Reload systemd: sudo systemctl daemon-reload"
    echo "- Check logs: journalctl -u systemd-vmspawn@<name>.service"
}

# Run diagnosis based on type
case "$ERROR_TYPE" in
    permission|perms)
        diagnose_permission_errors
        ;;
    network|net)
        diagnose_network_errors
        ;;
    boot)
        diagnose_boot_errors
        ;;
    resource|resources)
        diagnose_resource_errors
        ;;
    service|services)
        diagnose_service_errors
        ;;
    all|*)
        diagnose_permission_errors
        echo
        diagnose_network_errors
        echo
        diagnose_boot_errors
        echo
        diagnose_resource_errors
        echo
        diagnose_service_errors
        ;;
esac

echo "=== Error diagnosis completed ==="
EOF

chmod +x /tmp/vmspawn-diagnose-errors.sh

# VM debug and inspection tools
echo "=== VM Debug Tools ==="
cat > /tmp/vmspawn-debug-tools.sh << 'EOF'
#!/bin/bash
# systemd-vmspawn Debug and Inspection Tools

VM_NAME="$1"
ACTION="${2:-info}"

if [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <vm-name> [action]"
    echo "Actions: info, logs, process, network, files, console"
    exit 1
fi

debug_vm_info() {
    echo "=== VM Information: $VM_NAME ==="

    # Check if VM is registered
    if machinectl show "$VM_NAME" >/dev/null 2>&1; then
        echo "VM Status:"
        machinectl show "$VM_NAME"
        echo

        echo "VM Properties:"
        machinectl show "$VM_NAME" | grep -E "(State|Service|Leader|RootDirectory|IPAddress)"
        echo
    else
        echo "VM $VM_NAME is not registered with machined"
        return 1
    fi

    # Get VM process information
    VM_PID=$(machinectl show "$VM_NAME" | grep Leader | cut -d= -f2)
    if [ -n "$VM_PID" ]; then
        echo "VM Process Tree:"
        pstree -p "$VM_PID" 2>/dev/null || ps --forest -p "$VM_PID"
        echo

        echo "VM Resource Usage:"
        ps -p "$VM_PID" -o pid,ppid,pcpu,pmem,vsz,rss,cmd
        echo
    fi
}

debug_vm_logs() {
    echo "=== VM Logs: $VM_NAME ==="

    # systemd-vmspawn service logs
    echo "systemd-vmspawn service logs:"
    journalctl -u "systemd-vmspawn@${VM_NAME}.service" --no-pager | tail -50
    echo

    # VM-specific logs via machined
    echo "VM system logs:"
    journalctl -M "$VM_NAME" --no-pager --since="1 hour ago" | tail -30 2>/dev/null || echo "Cannot access VM logs"
    echo

    # Check for forwarded journal
    JOURNAL_FILE="/var/log/${VM_NAME}.journal"
    if [ -f "$JOURNAL_FILE" ]; then
        echo "Forwarded journal entries:"
        journalctl --file="$JOURNAL_FILE" --no-pager | tail -20
    fi
}

debug_vm_process() {
    echo "=== VM Process Information: $VM_NAME ==="

    # Find VM processes
    VM_PROCESSES=$(pgrep -f "systemd-vmspawn.*$VM_NAME")
    if [ -n "$VM_PROCESSES" ]; then
        echo "VM processes:"
        for pid in $VM_PROCESSES; do
            echo "PID $pid:"
            ps -p "$pid" -o pid,ppid,pcpu,pmem,cmd

            # Process details
            if [ -d "/proc/$pid" ]; then
                echo "  Command line: $(cat /proc/$pid/cmdline | tr '\0' ' ')"
                echo "  Working directory: $(readlink /proc/$pid/cwd 2>/dev/null || echo 'N/A')"
                echo "  Memory usage: $(cat /proc/$pid/status | grep -E 'VmSize|VmRSS')"
                echo
            fi
        done
    else
        echo "No VM processes found for $VM_NAME"
    fi

    # Check QEMU processes
    QEMU_PROCESSES=$(pgrep -f "qemu.*$VM_NAME")
    if [ -n "$QEMU_PROCESSES" ]; then
        echo "QEMU processes:"
        ps aux | grep -E "qemu.*$VM_NAME" | grep -v grep
    fi
}

debug_vm_network() {
    echo "=== VM Network Information: $VM_NAME ==="

    # VM network interfaces
    echo "Network interfaces related to VM:"
    ip link show | grep -A 2 -B 2 "$VM_NAME" || echo "No dedicated network interfaces found"
    echo

    # VSock information
    echo "VSock information:"
    if machinectl show "$VM_NAME" | grep -q VSockCID; then
        VSOCK_CID=$(machinectl show "$VM_NAME" | grep VSockCID | cut -d= -f2)
        echo "VM VSock CID: $VSOCK_CID"

        # Check VSock connections
        ss -ax | grep "$VSOCK_CID" || echo "No VSock connections found"
    else
        echo "No VSock configured for this VM"
    fi
    echo

    # Network namespaces
    echo "Network namespace information:"
    if command -v ip >/dev/null; then
        ip netns list | grep "$VM_NAME" || echo "No dedicated network namespace found"
    fi
}

debug_vm_files() {
    echo "=== VM File Information: $VM_NAME ==="

    # VM image/directory
    if machinectl show "$VM_NAME" | grep -q RootDirectory; then
        ROOT_DIR=$(machinectl show "$VM_NAME" | grep RootDirectory | cut -d= -f2)
        echo "VM root directory: $ROOT_DIR"
        if [ -d "$ROOT_DIR" ]; then
            echo "Root directory contents:"
            ls -la "$ROOT_DIR" | head -10
        fi
        echo
    fi

    # SSH keys
    SSH_KEY_DIR="/run/user/$UID/systemd/vmspawn"
    echo "SSH keys for VM:"
    ls -la "$SSH_KEY_DIR"/machine-*-"$VM_NAME"-* 2>/dev/null || echo "No SSH keys found"
    echo

    # Configuration files
    echo "Configuration files:"
    CONF_FILE="/etc/systemd/vmspawn/${VM_NAME}.conf"
    if [ -f "$CONF_FILE" ]; then
        echo "VM configuration found: $CONF_FILE"
        cat "$CONF_FILE"
    else
        echo "No VM configuration file found"
    fi
    echo

    SERVICE_FILE="/etc/systemd/system/systemd-vmspawn@${VM_NAME}.service"
    if [ -f "$SERVICE_FILE" ]; then
        echo "Service file found: $SERVICE_FILE"
        cat "$SERVICE_FILE"
    else
        echo "No custom service file found"
    fi
}

debug_vm_console() {
    echo "=== VM Console Access: $VM_NAME ==="

    echo "Available console access methods:"

    # SSH access
    SSH_KEY="/run/user/$UID/systemd/vmspawn/machine-*-${VM_NAME}-ed25519"
    if ls $SSH_KEY 2>/dev/null; then
        echo "1. SSH access available:"
        if machinectl show "$VM_NAME" | grep -q VSockCID; then
            VSOCK_CID=$(machinectl show "$VM_NAME" | grep VSockCID | cut -d= -f2)
            echo "   ssh root@vsock/$VSOCK_CID -i $SSH_KEY"
        fi
    else
        echo "1. SSH access not configured"
    fi
    echo

    # machinectl shell access
    echo "2. machinectl shell access:"
    echo "   machinectl shell $VM_NAME"
    echo

    # Console attachment
    echo "3. Direct console (if supported):"
    echo "   machinectl login $VM_NAME"
    echo

    # Check if VM is responsive
    echo "Testing VM responsiveness:"
    if timeout 5 machinectl show "$VM_NAME" >/dev/null 2>&1; then
        echo "✓ VM responds to machined queries"
    else
        echo "✗ VM does not respond to machined queries"
    fi
}

# Execute requested action
case "$ACTION" in
    info)
        debug_vm_info
        ;;
    logs)
        debug_vm_logs
        ;;
    process|proc)
        debug_vm_process
        ;;
    network|net)
        debug_vm_network
        ;;
    files)
        debug_vm_files
        ;;
    console)
        debug_vm_console
        ;;
    all)
        debug_vm_info
        echo
        debug_vm_logs
        echo
        debug_vm_process
        echo
        debug_vm_network
        echo
        debug_vm_files
        ;;
    *)
        echo "Unknown action: $ACTION"
        echo "Available actions: info, logs, process, network, files, console, all"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/vmspawn-debug-tools.sh

# Performance troubleshooting
echo "=== Performance Troubleshooting ==="
cat > /tmp/vmspawn-performance-debug.sh << 'EOF'
#!/bin/bash
# systemd-vmspawn Performance Debugging

VM_NAME="$1"

if [ -z "$VM_NAME" ]; then
    echo "Usage: $0 <vm-name>"
    exit 1
fi

echo "=== Performance Debug for VM: $VM_NAME ==="

# CPU performance
echo "1. CPU Performance:"
if machinectl show "$VM_NAME" >/dev/null 2>&1; then
    VM_PID=$(machinectl show "$VM_NAME" | grep Leader | cut -d= -f2)
    if [ -n "$VM_PID" ]; then
        echo "VM CPU usage:"
        ps -p "$VM_PID" -o pid,pcpu,time,cmd

        # Check if KVM is being used
        if grep -q kvm /proc/"$VM_PID"/cmdline 2>/dev/null; then
            echo "✓ KVM acceleration enabled"
        else
            echo "⚠ KVM acceleration may not be enabled"
        fi
    fi
else
    echo "VM not found or not running"
    exit 1
fi
echo

# Memory performance
echo "2. Memory Performance:"
if [ -n "$VM_PID" ]; then
    echo "VM memory usage:"
    ps -p "$VM_PID" -o pid,pmem,vsz,rss,cmd

    # Check memory details from /proc
    if [ -f "/proc/$VM_PID/status" ]; then
        echo "Detailed memory usage:"
        grep -E "VmSize|VmRSS|VmHWM|VmData|VmStk" /proc/"$VM_PID"/status
    fi
fi
echo

# I/O performance
echo "3. I/O Performance:"
if command -v iostat >/dev/null; then
    echo "System I/O statistics (5 second sample):"
    iostat -x 1 5 | tail -20
else
    echo "iostat not available (install sysstat package)"
fi
echo

# Network performance
echo "4. Network Performance:"
echo "Network interface statistics:"
if ip link show | grep -q "$VM_NAME"; then
    # VM has dedicated interface
    ip -s link show | grep -A 4 "$VM_NAME"
else
    # Check general network stats
    echo "General network statistics:"
    cat /proc/net/dev | grep -E "(Inter|face|eth|enp|wlp)" | head -5
fi
echo

# System load impact
echo "5. System Load Impact:"
echo "Current system load:"
uptime
echo

echo "System memory usage:"
free -h
echo

echo "Top processes by CPU:"
ps aux --sort=-pcpu | head -10
echo

echo "Top processes by memory:"
ps aux --sort=-pmem | head -10
echo

# Performance recommendations
echo "6. Performance Recommendations:"

# Check CPU allocation
VM_CPUS=$(machinectl show "$VM_NAME" | grep CPUs | cut -d= -f2)
SYSTEM_CPUS=$(nproc)
if [ -n "$VM_CPUS" ] && [ "$VM_CPUS" -gt $((SYSTEM_CPUS / 2)) ]; then
    echo "⚠ VM allocated more than half of system CPUs ($VM_CPUS of $SYSTEM_CPUS)"
    echo "  Consider reducing VM CPUs for better host performance"
fi

# Check memory allocation
VM_MEM=$(machinectl show "$VM_NAME" | grep Memory | cut -d= -f2)
SYSTEM_MEM=$(free -m | awk '/^Mem:/ {print $2}')
if [ -n "$VM_MEM" ] && [ "$VM_MEM" -gt $((SYSTEM_MEM * 1024 * 1024 / 2)) ]; then
    echo "⚠ VM allocated significant system memory"
    echo "  Monitor host memory usage and consider reducing VM memory"
fi

# Check KVM usage
if ! grep -q kvm /proc/"$VM_PID"/cmdline 2>/dev/null; then
    echo "⚠ KVM acceleration may not be enabled"
    echo "  Ensure KVM is available and user is in kvm group"
fi

# Check storage type
if machinectl show "$VM_NAME" | grep -q Image; then
    VM_IMAGE=$(machinectl show "$VM_NAME" | grep RootDirectory | cut -d= -f2)
    if echo "$VM_IMAGE" | grep -q "\.raw$"; then
        echo "ℹ Using raw disk image (good performance)"
    elif echo "$VM_IMAGE" | grep -q "\.qcow2$"; then
        echo "ℹ Using qcow2 disk image (consider raw for better performance)"
    fi
fi

echo "=== Performance debug completed ==="
EOF

chmod +x /tmp/vmspawn-performance-debug.sh

echo "Troubleshooting scripts completed!"
echo "Available troubleshooting tools in /tmp/:"
echo "- vmspawn-system-check.sh - System requirements check"
echo "- vmspawn-diagnose-errors.sh [error-type] - Error diagnosis"
echo "- vmspawn-debug-tools.sh <vm-name> [action] - VM debugging"
echo "- vmspawn-performance-debug.sh <vm-name> - Performance analysis"