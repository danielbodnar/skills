#!/bin/bash
# pxe-setup.sh - Setup PXE boot environment for Arch Linux deployment

set -euo pipefail

# Configuration
TFTP_ROOT="/srv/tftp"
HTTP_ROOT="/srv/http"
ARCH_MIRROR="http://mirror.rackspace.com/archlinux"
INTERFACE="eth0"

setup_directories() {
    echo "Creating directory structure..."
    sudo mkdir -p "$TFTP_ROOT"/{arch,pxelinux.cfg}
    sudo mkdir -p "$HTTP_ROOT"/arch
    sudo chmod 755 "$TFTP_ROOT" "$HTTP_ROOT"
}

install_pxe_components() {
    echo "Installing PXE boot components..."
    
    # Install required packages
    sudo pacman -S --needed --noconfirm \
        dnsmasq \
        syslinux \
        darkhttpd \
        wget
    
    # Copy PXE boot files
    sudo cp /usr/lib/syslinux/bios/{pxelinux.0,ldlinux.c32,libcom32.c32,libutil.c32,menu.c32} "$TFTP_ROOT/"
}

download_arch_images() {
    echo "Downloading Arch Linux boot images..."
    
    # Get latest ISO info
    LATEST_ISO=$(curl -s "$ARCH_MIRROR/iso/latest/" | grep -o 'archlinux-[0-9]\{4\}\.[0-9]\{2\}\.[0-9]\{2\}-x86_64.iso' | head -1)
    ISO_DATE=$(echo "$LATEST_ISO" | grep -o '[0-9]\{4\}\.[0-9]\{2\}\.[0-9]\{2\}')
    
    # Download and extract netboot files
    cd /tmp
    wget "$ARCH_MIRROR/iso/latest/arch/boot/x86_64/vmlinuz-linux" -O vmlinuz-arch
    wget "$ARCH_MIRROR/iso/latest/arch/boot/x86_64/initramfs-linux.img" -O initramfs-arch.img
    
    # Copy to TFTP directory
    sudo cp vmlinuz-arch "$TFTP_ROOT/arch/"
    sudo cp initramfs-arch.img "$TFTP_ROOT/arch/"
    
    # Download full ISO for HTTP serving
    wget "$ARCH_MIRROR/iso/latest/$LATEST_ISO" -O "$LATEST_ISO"
    sudo mv "$LATEST_ISO" "$HTTP_ROOT/arch/"
    
    echo "Downloaded Arch Linux $ISO_DATE"
}

configure_pxelinux() {
    echo "Configuring PXE boot menu..."
    
    # Create PXE boot configuration
    sudo tee "$TFTP_ROOT/pxelinux.cfg/default" > /dev/null << 'EOF'
DEFAULT menu.c32
PROMPT 0
TIMEOUT 30
MENU TITLE Arch Linux PXE Boot

LABEL arch_install
    MENU LABEL Arch Linux Install (Network)
    KERNEL arch/vmlinuz-arch
    APPEND initrd=arch/initramfs-arch.img ip=dhcp archiso_http_srv=http://192.168.1.100:8080/arch/

LABEL arch_install_ssh
    MENU LABEL Arch Linux Install with SSH
    KERNEL arch/vmlinuz-arch
    APPEND initrd=arch/initramfs-arch.img ip=dhcp archiso_http_srv=http://192.168.1.100:8080/arch/ sshd=1

LABEL local_boot
    MENU LABEL Boot from local disk
    LOCALBOOT 0

LABEL reboot
    MENU LABEL Reboot
    COM32 reboot.c32

LABEL poweroff
    MENU LABEL Power Off
    COM32 poweroff.c32
EOF
}

configure_dnsmasq() {
    echo "Configuring DNSMASQ for DHCP/TFTP..."
    
    # Backup existing config
    sudo cp /etc/dnsmasq.conf /etc/dnsmasq.conf.backup 2>/dev/null || true
    
    # Create DNSMASQ configuration
    sudo tee /etc/dnsmasq.conf > /dev/null << EOF
# Interface to listen on
interface=$INTERFACE

# DHCP range
dhcp-range=192.168.1.100,192.168.1.200,255.255.255.0,12h

# DHCP options
dhcp-option=3,192.168.1.1      # Gateway
dhcp-option=6,8.8.8.8,8.8.4.4  # DNS servers

# PXE boot configuration
dhcp-boot=pxelinux.0

# Enable TFTP server
enable-tftp
tftp-root=$TFTP_ROOT

# Log DHCP requests
log-dhcp

# Don't read /etc/hosts
no-hosts

# Don't read /etc/resolv.conf
no-resolv

# Set DNS servers
server=8.8.8.8
server=8.8.4.4

# Cache size
cache-size=1000
EOF
}

create_http_service() {
    echo "Creating HTTP service for ISO serving..."
    
    # Create systemd service for HTTP server
    sudo tee /etc/systemd/system/pxe-http.service > /dev/null << EOF
[Unit]
Description=PXE HTTP Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/darkhttpd $HTTP_ROOT --port 8080 --addr 192.168.1.100
Restart=always
User=nobody
Group=nobody

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
}

create_management_script() {
    echo "Creating PXE management script..."
    
    sudo tee /usr/local/bin/pxe-manage > /dev/null << 'EOF'
#!/bin/bash
# pxe-manage - Manage PXE boot environment

case "$1" in
    start)
        echo "Starting PXE services..."
        systemctl start dnsmasq pxe-http
        systemctl enable dnsmasq pxe-http
        echo "PXE services started"
        ;;
    stop)
        echo "Stopping PXE services..."
        systemctl stop dnsmasq pxe-http
        echo "PXE services stopped"
        ;;
    restart)
        echo "Restarting PXE services..."
        systemctl restart dnsmasq pxe-http
        echo "PXE services restarted"
        ;;
    status)
        echo "PXE service status:"
        systemctl status dnsmasq pxe-http
        ;;
    update)
        echo "Updating Arch Linux images..."
        cd /tmp
        ARCH_MIRROR="http://mirror.rackspace.com/archlinux"
        wget "$ARCH_MIRROR/iso/latest/arch/boot/x86_64/vmlinuz-linux" -O vmlinuz-arch
        wget "$ARCH_MIRROR/iso/latest/arch/boot/x86_64/initramfs-linux.img" -O initramfs-arch.img
        cp vmlinuz-arch /srv/tftp/arch/
        cp initramfs-arch.img /srv/tftp/arch/
        echo "Arch Linux images updated"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|update}"
        exit 1
        ;;
esac
EOF
    
    sudo chmod +x /usr/local/bin/pxe-manage
}

# Main execution
main() {
    echo "Setting up Arch Linux PXE boot environment..."
    
    setup_directories
    install_pxe_components
    download_arch_images
    configure_pxelinux
    configure_dnsmasq
    create_http_service
    create_management_script
    
    echo
    echo "PXE setup complete!"
    echo
    echo "To start PXE services: pxe-manage start"
    echo "To update images: pxe-manage update"
    echo
    echo "Configure your network:"
    echo "1. Set server IP to 192.168.1.100"
    echo "2. Ensure firewall allows DHCP (67/udp), TFTP (69/udp), HTTP (8080/tcp)"
    echo "3. Disable other DHCP servers on the network"
    echo
    echo "Client boot order: Network -> Local disk"
}

# Check if running as root for some operations
if [[ $EUID -ne 0 ]] && [[ -z ${SUDO_COMMAND:-} ]]; then
    echo "This script requires sudo privileges for some operations."
    echo "Run with: sudo $0"
    exit 1
fi

main "$@"