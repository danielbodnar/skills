#!/bin/bash
# ipxe-config.sh - iPXE configuration for Arch Linux deployment

create_ipxe_menu() {
    cat > arch-menu.ipxe << 'EOF'
#!ipxe

# Arch Linux iPXE Boot Menu
# Set console parameters
console --picture --left 100 --right 80

# Set variables
set base-url http://mirror.rackspace.com/archlinux/iso/latest/arch/boot
set server-ip 192.168.1.100
set http-port 8080

# Menu definition
:start
menu Arch Linux Network Installation
item --gap --             ------------------------- Main Options ---------------------------
item arch_install         Install Arch Linux (Standard)
item arch_install_ssh     Install Arch Linux with SSH enabled
item arch_install_serial  Install Arch Linux (Serial Console)
item arch_rescue          Arch Linux Rescue System
item --gap --             ------------------------- Advanced Options ----------------------
item arch_custom          Custom Installation (Manual)
item arch_automated       Automated Installation (Preseed)
item --gap --             ------------------------- System Options -----------------------
item local_boot           Boot from local disk
item memtest               Memory Test
item reboot                Reboot system
item poweroff              Power off system
choose --default arch_install --timeout 30000 target && goto ${target}

:arch_install
echo Starting Arch Linux installation...
kernel ${base-url}/x86_64/vmlinuz-linux
initrd ${base-url}/x86_64/initramfs-linux.img
imgargs vmlinuz-linux ip=dhcp archiso_http_srv=http://${server-ip}:${http-port}/arch/ archisobasedir=arch cow_spacesize=1G
boot || goto failed

:arch_install_ssh
echo Starting Arch Linux installation with SSH...
kernel ${base-url}/x86_64/vmlinuz-linux
initrd ${base-url}/x86_64/initramfs-linux.img
imgargs vmlinuz-linux ip=dhcp archiso_http_srv=http://${server-ip}:${http-port}/arch/ archisobasedir=arch cow_spacesize=1G sshd=1
boot || goto failed

:arch_install_serial
echo Starting Arch Linux installation (Serial Console)...
kernel ${base-url}/x86_64/vmlinuz-linux
initrd ${base-url}/x86_64/initramfs-linux.img
imgargs vmlinuz-linux ip=dhcp archiso_http_srv=http://${server-ip}:${http-port}/arch/ archisobasedir=arch console=tty0 console=ttyS0,115200n8
boot || goto failed

:arch_rescue
echo Starting Arch Linux rescue system...
kernel ${base-url}/x86_64/vmlinuz-linux
initrd ${base-url}/x86_64/initramfs-linux.img
imgargs vmlinuz-linux ip=dhcp archiso_http_srv=http://${server-ip}:${http-port}/arch/ archisobasedir=arch rescue
boot || goto failed

:arch_custom
echo Starting custom Arch Linux installation...
echo Available kernel parameters:
echo - ip=dhcp (enable DHCP)
echo - archiso_http_srv=URL (ISO HTTP server)
echo - cow_spacesize=SIZE (overlay filesystem size)
echo - script=URL (custom installation script)
echo
prompt Press any key to continue with manual configuration...
goto manual_config

:arch_automated
echo Starting automated Arch Linux installation...
kernel ${base-url}/x86_64/vmlinuz-linux
initrd ${base-url}/x86_64/initramfs-linux.img
imgargs vmlinuz-linux ip=dhcp archiso_http_srv=http://${server-ip}:${http-port}/arch/ archisobasedir=arch script=http://${server-ip}:${http-port}/scripts/auto-install.sh
boot || goto failed

:manual_config
echo Manual configuration mode
echo Enter kernel command line:
echo Example: ip=dhcp archiso_http_srv=http://192.168.1.100:8080/arch/
echo
prompt --key 0x02 --timeout 2000 Press Ctrl-B for iPXE command line... || goto start
shell

:local_boot
echo Booting from local disk...
sanboot --no-describe --drive 0x80 || goto failed

:memtest
echo Starting memory test...
kernel http://${server-ip}:${http-port}/tools/memtest86+.bin
boot || goto failed

:reboot
echo Rebooting system...
reboot

:poweroff
echo Powering off system...
poweroff

:failed
echo Boot failed, returning to menu...
prompt --key 0x02 --timeout 5000 Press Ctrl-B for iPXE command line, or any other key to return to menu... || goto start
shell
EOF

    echo "iPXE menu configuration created: arch-menu.ipxe"
}

create_ipxe_embedded() {
    cat > arch-embedded.ipxe << 'EOF'
#!ipxe

# Embedded iPXE script for Arch Linux
# This script is compiled into iPXE binary

echo Starting Arch Linux iPXE boot...

# Configure network
dhcp

# Set server details
set server-ip 192.168.1.100
set http-port 8080

# Try to chain to main menu
echo Attempting to load main boot menu...
chain http://${server-ip}:${http-port}/boot/arch-menu.ipxe || goto fallback

:fallback
echo Main menu failed, using embedded fallback...
set base-url http://mirror.rackspace.com/archlinux/iso/latest/arch/boot

echo Loading Arch Linux installation...
kernel ${base-url}/x86_64/vmlinuz-linux
initrd ${base-url}/x86_64/initramfs-linux.img
imgargs vmlinuz-linux ip=dhcp archiso_http_srv=http://${server-ip}:${http-port}/arch/ archisobasedir=arch
boot || shell
EOF

    echo "Embedded iPXE script created: arch-embedded.ipxe"
}

create_custom_installation_script() {
    mkdir -p scripts
    
    cat > scripts/auto-install.sh << 'EOF'
#!/bin/bash
# auto-install.sh - Automated Arch Linux installation script

set -euo pipefail

# Configuration
DISK="/dev/sda"
HOSTNAME="arch-appliance"
TIMEZONE="UTC"
LOCALE="en_US.UTF-8"
KEYMAP="us"

# Partition and format disk
partition_disk() {
    echo "Partitioning disk $DISK..."
    
    # Create partition table
    parted -s "$DISK" mklabel gpt
    parted -s "$DISK" mkpart ESP fat32 1MiB 513MiB
    parted -s "$DISK" set 1 esp on
    parted -s "$DISK" mkpart primary ext4 513MiB 100%
    
    # Format partitions
    mkfs.fat -F32 "${DISK}1"
    mkfs.ext4 "${DISK}2"
    
    # Mount filesystems
    mount "${DISK}2" /mnt
    mkdir -p /mnt/boot
    mount "${DISK}1" /mnt/boot
}

# Install base system
install_base() {
    echo "Installing base system..."
    
    # Update package databases
    pacman -Sy
    
    # Install base packages
    pacstrap /mnt base linux linux-firmware \
        base-devel vim openssh networkmanager \
        grub efibootmgr
    
    # Generate fstab
    genfstab -U /mnt >> /mnt/etc/fstab
}

# Configure system
configure_system() {
    echo "Configuring system..."
    
    arch-chroot /mnt /bin/bash << EOF
# Set timezone
ln -sf /usr/share/zoneinfo/$TIMEZONE /etc/localtime
hwclock --systohc

# Set locale
echo "$LOCALE UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=$LOCALE" > /etc/locale.conf

# Set keymap
echo "KEYMAP=$KEYMAP" > /etc/vconsole.conf

# Set hostname
echo "$HOSTNAME" > /etc/hostname
cat > /etc/hosts << HOSTS
127.0.0.1   localhost
::1         localhost
127.0.1.1   $HOSTNAME.localdomain $HOSTNAME
HOSTS

# Enable services
systemctl enable NetworkManager
systemctl enable sshd

# Install and configure GRUB
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg

# Set root password (change this!)
echo 'root:archlinux' | chpasswd

# Create user
useradd -m -G wheel admin
echo 'admin:admin' | chpasswd

# Configure sudo
echo '%wheel ALL=(ALL) ALL' >> /etc/sudoers
EOF
}

# Main installation
main() {
    echo "Starting automated Arch Linux installation..."
    
    # Wait for network
    sleep 10
    
    partition_disk
    install_base
    configure_system
    
    echo "Installation complete!"
    echo "Default credentials:"
    echo "  root:archlinux"
    echo "  admin:admin"
    echo
    echo "CHANGE DEFAULT PASSWORDS AFTER FIRST BOOT!"
    
    # Reboot
    umount -R /mnt
    reboot
}

# Execute if running directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
EOF

    chmod +x scripts/auto-install.sh
    echo "Auto-installation script created: scripts/auto-install.sh"
}

create_build_script() {
    cat > build-ipxe.sh << 'EOF'
#!/bin/bash
# build-ipxe.sh - Build custom iPXE with embedded script

set -euo pipefail

# Clone iPXE if not exists
if [[ ! -d "ipxe" ]]; then
    echo "Cloning iPXE repository..."
    git clone https://github.com/ipxe/ipxe.git
fi

cd ipxe/src

# Copy embedded script
cp ../../arch-embedded.ipxe ./embed.ipxe

# Build iPXE with embedded script
echo "Building iPXE with embedded Arch Linux script..."

# Build BIOS version
make bin/ipxe.pxe EMBED=embed.ipxe

# Build UEFI version
make bin-x86_64-efi/ipxe.efi EMBED=embed.ipxe

# Build USB image
make bin/ipxe.usb EMBED=embed.ipxe

# Build ISO image
make bin/ipxe.iso EMBED=embed.ipxe

echo "iPXE builds complete:"
echo "  BIOS PXE: bin/ipxe.pxe"
echo "  UEFI:     bin-x86_64-efi/ipxe.efi"
echo "  USB:      bin/ipxe.usb"
echo "  ISO:      bin/ipxe.iso"
EOF

    chmod +x build-ipxe.sh
    echo "iPXE build script created: build-ipxe.sh"
}

# Usage function
usage() {
    echo "Usage: $0 [OPTION]"
    echo "Create iPXE configuration files for Arch Linux deployment"
    echo
    echo "Options:"
    echo "  menu      Create iPXE menu configuration"
    echo "  embedded  Create embedded iPXE script"
    echo "  scripts   Create installation scripts"
    echo "  build     Create iPXE build script"
    echo "  all       Create all configurations"
    echo "  help      Show this help"
}

# Main execution
case "${1:-all}" in
    menu)
        create_ipxe_menu
        ;;
    embedded)
        create_ipxe_embedded
        ;;
    scripts)
        create_custom_installation_script
        ;;
    build)
        create_build_script
        ;;
    all)
        create_ipxe_menu
        create_ipxe_embedded
        create_custom_installation_script
        create_build_script
        echo
        echo "All iPXE configurations created successfully!"
        echo "Files created:"
        echo "  - arch-menu.ipxe (main boot menu)"
        echo "  - arch-embedded.ipxe (embedded script)"
        echo "  - scripts/auto-install.sh (automated installation)"
        echo "  - build-ipxe.sh (build custom iPXE)"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo "Unknown option: $1"
        usage
        exit 1
        ;;
esac