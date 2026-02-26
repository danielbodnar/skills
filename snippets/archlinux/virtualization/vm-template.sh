#!/bin/bash
# vm-template.sh - Create Arch Linux VM templates for infrastructure deployment

set -euo pipefail

# Default configuration
DISK_SIZE="20G"
RAM_SIZE="2048"
CPU_CORES="2"
HOSTNAME="arch-vm"
ROOT_PASSWORD="archlinux"
USER_NAME="admin"
USER_PASSWORD="admin"
TIMEZONE="UTC"
LOCALE="en_US.UTF-8"
KEYMAP="us"

# Command line argument parsing
while [[ $# -gt 0 ]]; do
    case $1 in
        --disk-size)
            DISK_SIZE="$2"
            shift 2
            ;;
        --ram)
            RAM_SIZE="$2"
            shift 2
            ;;
        --cpu)
            CPU_CORES="$2"
            shift 2
            ;;
        --hostname)
            HOSTNAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS] TYPE"
            echo "Create Arch Linux VM templates"
            echo
            echo "Options:"
            echo "  --disk-size SIZE    Disk size (default: 20G)"
            echo "  --ram SIZE          RAM in MB (default: 2048)"
            echo "  --cpu CORES         CPU cores (default: 2)"
            echo "  --hostname NAME     Hostname (default: arch-vm)"
            echo
            echo "Types:"
            echo "  minimal             Minimal base system"
            echo "  network             Network appliance"
            echo "  kubernetes          Kubernetes node"
            echo "  development         Development environment"
            exit 0
            ;;
        *)
            VM_TYPE="$1"
            shift
            ;;
    esac
done

# Validate VM type
case "${VM_TYPE:-}" in
    minimal|network|kubernetes|development)
        ;;
    *)
        echo "Error: Please specify VM type (minimal|network|kubernetes|development)"
        exit 1
        ;;
esac

create_base_install_script() {
    cat > arch-install.sh << 'EOF'
#!/bin/bash
# Automated Arch Linux installation script

set -euo pipefail

# Configuration (will be replaced by template)
DISK_DEVICE="/dev/vda"
HOSTNAME="__HOSTNAME__"
ROOT_PASSWORD="__ROOT_PASSWORD__"
USER_NAME="__USER_NAME__"
USER_PASSWORD="__USER_PASSWORD__"
TIMEZONE="__TIMEZONE__"
LOCALE="__LOCALE__"
KEYMAP="__KEYMAP__"
VM_TYPE="__VM_TYPE__"

# Partition disk
partition_disk() {
    echo "Partitioning disk $DISK_DEVICE..."
    
    # Create GPT partition table
    parted -s "$DISK_DEVICE" mklabel gpt
    
    # Create EFI boot partition (512MB)
    parted -s "$DISK_DEVICE" mkpart ESP fat32 1MiB 513MiB
    parted -s "$DISK_DEVICE" set 1 esp on
    
    # Create root partition (remaining space)
    parted -s "$DISK_DEVICE" mkpart primary ext4 513MiB 100%
    
    # Format partitions
    mkfs.fat -F32 "${DISK_DEVICE}1"
    mkfs.ext4 "${DISK_DEVICE}2"
    
    # Mount filesystems
    mount "${DISK_DEVICE}2" /mnt
    mkdir -p /mnt/boot
    mount "${DISK_DEVICE}1" /mnt/boot
}

# Install base packages
install_base() {
    echo "Installing base system..."
    
    # Update pacman keyring
    pacman -Sy --noconfirm archlinux-keyring
    
    # Base packages for all VM types
    local base_packages=(
        base
        linux
        linux-firmware
        base-devel
        grub
        efibootmgr
        networkmanager
        openssh
        sudo
        vim
        git
        curl
        wget
        htop
        man-db
        bash-completion
    )
    
    # Add VM type specific packages
    case "$VM_TYPE" in
        network)
            base_packages+=(
                iptables ipset dnsmasq wireguard-tools
                tcpdump nmap mtr traceroute socat
                fail2ban bridge-utils
            )
            ;;
        kubernetes)
            base_packages+=(
                containerd runc kubectl kubelet kubeadm
                cni-plugins conntrack-tools ipset socat
            )
            ;;
        development)
            base_packages+=(
                docker podman git-lfs nodejs npm python
                python-pip ruby go rust gcc clang
                tmux screen zsh fish
            )
            ;;
    esac
    
    # Install packages
    pacstrap /mnt "${base_packages[@]}"
    
    # Generate fstab
    genfstab -U /mnt >> /mnt/etc/fstab
}

# Configure system
configure_system() {
    echo "Configuring system..."
    
    # Chroot configuration script
    arch-chroot /mnt /bin/bash << CHROOT_EOF
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

# Configure hosts file
cat > /etc/hosts << HOSTS_EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   $HOSTNAME.localdomain $HOSTNAME
HOSTS_EOF

# Enable essential services
systemctl enable NetworkManager
systemctl enable sshd

# Configure SSH
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Set root password
echo "root:$ROOT_PASSWORD" | chpasswd

# Create user account
useradd -m -G wheel "$USER_NAME"
echo "$USER_NAME:$USER_PASSWORD" | chpasswd

# Configure sudo
echo '%wheel ALL=(ALL) ALL' >> /etc/sudoers

# Install and configure GRUB
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg

# VM type specific configuration
case "$VM_TYPE" in
    network)
        # Enable IP forwarding
        echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
        echo 'net.ipv6.conf.all.forwarding=1' >> /etc/sysctl.conf
        
        # Create basic firewall script
        cat > /usr/local/bin/firewall.sh << 'FIREWALL_EOF'
#!/bin/bash
# Basic firewall configuration
iptables -F
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT
FIREWALL_EOF
        chmod +x /usr/local/bin/firewall.sh
        ;;
        
    kubernetes)
        # Configure kernel modules
        cat > /etc/modules-load.d/k8s.conf << 'K8S_MODULES_EOF'
overlay
br_netfilter
K8S_MODULES_EOF
        
        # Configure sysctl
        cat > /etc/sysctl.d/k8s.conf << 'K8S_SYSCTL_EOF'
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
K8S_SYSCTL_EOF
        
        # Disable swap
        swapoff -a
        
        # Enable containerd
        systemctl enable containerd
        systemctl enable kubelet
        ;;
        
    development)
        # Install AUR helper (yay)
        sudo -u "$USER_NAME" bash << 'YAY_EOF'
cd /tmp
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si --noconfirm
YAY_EOF
        
        # Enable docker
        systemctl enable docker
        usermod -aG docker "$USER_NAME"
        ;;
esac

CHROOT_EOF
}

# Create cloud-init configuration
create_cloud_init() {
    echo "Creating cloud-init configuration..."
    
    mkdir -p /mnt/etc/cloud/cloud.cfg.d
    
    cat > /mnt/etc/cloud/cloud.cfg.d/99-arch.cfg << 'CLOUD_INIT_EOF'
#cloud-config
users:
  - name: admin
    groups: wheel
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    shell: /bin/bash
    ssh_authorized_keys: []

ssh_pwauth: true
disable_root: false

package_update: true
package_upgrade: true

runcmd:
  - systemctl enable NetworkManager
  - systemctl start NetworkManager
  - systemctl enable sshd
  - systemctl start sshd
CLOUD_INIT_EOF
}

# Main installation function
main() {
    echo "Starting Arch Linux VM installation ($VM_TYPE type)..."
    echo "Configuration:"
    echo "  Hostname: $HOSTNAME"
    echo "  VM Type: $VM_TYPE"
    echo "  Disk: $DISK_DEVICE"
    echo
    
    # Wait for system to be ready
    sleep 5
    
    # Update system clock
    timedatectl set-ntp true
    
    # Partition and format disk
    partition_disk
    
    # Install base system
    install_base
    
    # Configure system
    configure_system
    
    # Create cloud-init config if requested
    if [[ "${ENABLE_CLOUD_INIT:-}" == "true" ]]; then
        create_cloud_init
    fi
    
    # Cleanup
    umount -R /mnt
    
    echo
    echo "Installation complete!"
    echo "Default credentials:"
    echo "  root: $ROOT_PASSWORD"
    echo "  $USER_NAME: $USER_PASSWORD"
    echo
    echo "CHANGE DEFAULT PASSWORDS AFTER FIRST BOOT!"
    
    # Reboot
    reboot
}

# Run installation
main "$@"
EOF

    # Replace template variables
    sed -i "s/__HOSTNAME__/$HOSTNAME/g" arch-install.sh
    sed -i "s/__ROOT_PASSWORD__/$ROOT_PASSWORD/g" arch-install.sh
    sed -i "s/__USER_NAME__/$USER_NAME/g" arch-install.sh
    sed -i "s/__USER_PASSWORD__/$USER_PASSWORD/g" arch-install.sh
    sed -i "s/__TIMEZONE__/$TIMEZONE/g" arch-install.sh
    sed -i "s/__LOCALE__/$LOCALE/g" arch-install.sh
    sed -i "s/__KEYMAP__/$KEYMAP/g" arch-install.sh
    sed -i "s/__VM_TYPE__/$VM_TYPE/g" arch-install.sh
    
    chmod +x arch-install.sh
}

create_qemu_script() {
    cat > run-vm.sh << EOF
#!/bin/bash
# QEMU VM runner script for Arch Linux $VM_TYPE

VM_NAME="arch-$VM_TYPE-vm"
DISK_IMAGE="\${VM_NAME}.qcow2"
ISO_PATH="/path/to/archlinux.iso"

# Create disk image if it doesn't exist
if [[ ! -f "\$DISK_IMAGE" ]]; then
    echo "Creating disk image..."
    qemu-img create -f qcow2 "\$DISK_IMAGE" $DISK_SIZE
fi

# Run VM
qemu-system-x86_64 \\
    -name "\$VM_NAME" \\
    -machine q35 \\
    -cpu host \\
    -enable-kvm \\
    -m $RAM_SIZE \\
    -smp $CPU_CORES \\
    -bios /usr/share/ovmf/OVMF.fd \\
    -drive file="\$DISK_IMAGE",format=qcow2,if=virtio \\
    -cdrom "\$ISO_PATH" \\
    -netdev user,id=net0,hostfwd=tcp::2222-:22 \\
    -device virtio-net-pci,netdev=net0 \\
    -boot order=cd \\
    -display gtk \\
    -usb \\
    -device usb-tablet
EOF
    
    chmod +x run-vm.sh
}

create_libvirt_xml() {
    cat > "arch-$VM_TYPE-vm.xml" << EOF
<domain type='kvm'>
  <name>arch-$VM_TYPE-vm</name>
  <uuid>$(uuidgen)</uuid>
  <memory unit='KiB'>$(($RAM_SIZE * 1024))</memory>
  <currentMemory unit='KiB'>$(($RAM_SIZE * 1024))</currentMemory>
  <vcpu placement='static'>$CPU_CORES</vcpu>
  <os>
    <type arch='x86_64' machine='pc-q35-6.2'>hvm</type>
    <loader readonly='yes' type='pflash'>/usr/share/ovmf/OVMF_CODE.fd</loader>
    <nvram>/var/lib/libvirt/qemu/nvram/arch-$VM_TYPE-vm_VARS.fd</nvram>
    <boot dev='cdrom'/>
    <boot dev='hd'/>
  </os>
  <features>
    <acpi/>
    <apic/>
    <vmport state='off'/>
  </features>
  <cpu mode='host-model' check='partial'/>
  <clock offset='utc'>
    <timer name='rtc' tickpolicy='catchup'/>
    <timer name='pit' tickpolicy='delay'/>
    <timer name='hpet' present='no'/>
  </clock>
  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>destroy</on_crash>
  <pm>
    <suspend-to-mem enabled='no'/>
    <suspend-to-disk enabled='no'/>
  </pm>
  <devices>
    <emulator>/usr/bin/qemu-system-x86_64</emulator>
    <disk type='file' device='disk'>
      <driver name='qemu' type='qcow2'/>
      <source file='/var/lib/libvirt/images/arch-$VM_TYPE-vm.qcow2'/>
      <target dev='vda' bus='virtio'/>
      <address type='pci' domain='0x0000' bus='0x04' slot='0x00' function='0x0'/>
    </disk>
    <disk type='file' device='cdrom'>
      <driver name='qemu' type='raw'/>
      <source file='/var/lib/libvirt/images/archlinux.iso'/>
      <target dev='sda' bus='sata'/>
      <readonly/>
      <address type='drive' controller='0' bus='0' target='0' unit='0'/>
    </disk>
    <controller type='usb' index='0' model='qemu-xhci' ports='15'>
      <address type='pci' domain='0x0000' bus='0x02' slot='0x00' function='0x0'/>
    </controller>
    <controller type='sata' index='0'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x1f' function='0x2'/>
    </controller>
    <controller type='pci' index='0' model='pcie-root'/>
    <controller type='pci' index='1' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='1' port='0x10'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x0' multifunction='on'/>
    </controller>
    <interface type='network'>
      <mac address='52:54:00:$(printf '%02x:%02x:%02x' $((RANDOM%256)) $((RANDOM%256)) $((RANDOM%256)))'/>
      <source network='default'/>
      <model type='virtio'/>
      <address type='pci' domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
    </interface>
    <serial type='pty'>
      <target type='isa-serial' port='0'>
        <model name='isa-serial'/>
      </target>
    </serial>
    <console type='pty'>
      <target type='serial' port='0'/>
    </console>
    <input type='tablet' bus='usb'>
      <address type='usb' bus='0' port='1'/>
    </input>
    <input type='mouse' bus='ps2'/>
    <input type='keyboard' bus='ps2'/>
    <graphics type='vnc' port='-1' autoport='yes' listen='127.0.0.1'>
      <listen type='address' address='127.0.0.1'/>
    </graphics>
    <sound model='ich9'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x1b' function='0x0'/>
    </sound>
    <video>
      <model type='virtio' heads='1' primary='yes'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x0'/>
    </video>
    <redirdev bus='usb' type='spicevmc'>
      <address type='usb' bus='0' port='2'/>
    </redirdev>
    <redirdev bus='usb' type='spicevmc'>
      <address type='usb' bus='0' port='3'/>
    </redirdev>
    <memballoon model='virtio'>
      <address type='pci' domain='0x0000' bus='0x05' slot='0x00' function='0x0'/>
    </memballoon>
    <rng model='virtio'>
      <backend model='random'>/dev/urandom</backend>
      <address type='pci' domain='0x0000' bus='0x06' slot='0x00' function='0x0'/>
    </rng>
  </devices>
</domain>
EOF
}

create_proxmox_script() {
    cat > create-proxmox-vm.sh << EOF
#!/bin/bash
# Create Proxmox VE VM for Arch Linux $VM_TYPE

VM_ID=\${1:-201}
NODE=\${2:-\$(hostname)}
STORAGE=\${3:-local-lvm}

echo "Creating Proxmox VM \$VM_ID on node \$NODE..."

# Create VM
qm create \$VM_ID \\
    --name "arch-$VM_TYPE-vm" \\
    --memory $RAM_SIZE \\
    --cores $CPU_CORES \\
    --net0 virtio,bridge=vmbr0 \\
    --bootdisk scsi0 \\
    --ostype l26 \\
    --agent enabled=1

# Add EFI disk
qm set \$VM_ID --efidisk0 \$STORAGE:1,format=qcow2

# Add hard disk
qm set \$VM_ID --scsi0 \$STORAGE:$DISK_SIZE,format=qcow2

# Add ISO
qm set \$VM_ID --ide2 local:iso/archlinux.iso,media=cdrom

# Set boot order
qm set \$VM_ID --boot order=ide2

echo "VM \$VM_ID created successfully"
echo "Start with: qm start \$VM_ID"
echo "Connect with: qm terminal \$VM_ID"
EOF
    
    chmod +x create-proxmox-vm.sh
}

create_readme() {
    cat > README-$VM_TYPE.md << EOF
# Arch Linux $VM_TYPE VM Template

This template creates an Arch Linux VM optimized for $VM_TYPE use cases.

## Configuration

- **Hostname**: $HOSTNAME
- **RAM**: ${RAM_SIZE}MB
- **CPU Cores**: $CPU_CORES
- **Disk Size**: $DISK_SIZE
- **VM Type**: $VM_TYPE

## Files Created

- \`arch-install.sh\` - Automated installation script
- \`run-vm.sh\` - QEMU runner script
- \`arch-$VM_TYPE-vm.xml\` - libvirt domain definition
- \`create-proxmox-vm.sh\` - Proxmox VM creation script

## Usage

### QEMU/KVM
1. Download Arch Linux ISO
2. Update ISO path in \`run-vm.sh\`
3. Run \`./run-vm.sh\`
4. Boot from CD and run installation script

### libvirt
1. Copy VM definition: \`virsh define arch-$VM_TYPE-vm.xml\`
2. Create disk image: \`qemu-img create -f qcow2 /var/lib/libvirt/images/arch-$VM_TYPE-vm.qcow2 $DISK_SIZE\`
3. Start VM: \`virsh start arch-$VM_TYPE-vm\`

### Proxmox VE
1. Upload Arch Linux ISO to Proxmox
2. Run \`./create-proxmox-vm.sh [VM_ID] [NODE] [STORAGE]\`
3. Start VM and run installation

## Post-Installation

Default credentials:
- **root**: $ROOT_PASSWORD
- **$USER_NAME**: $USER_PASSWORD

**IMPORTANT**: Change default passwords after first boot!

### Network Configuration
- NetworkManager is enabled by default
- SSH is enabled on port 22
- Firewall rules depend on VM type

### VM Type Specific Features

EOF

    case "$VM_TYPE" in
        minimal)
            cat >> README-$VM_TYPE.md << 'EOF'
**Minimal VM Features:**
- Base Arch Linux system
- SSH access
- Basic development tools
- NetworkManager for networking
EOF
            ;;
        network)
            cat >> README-$VM_TYPE.md << 'EOF'
**Network Appliance Features:**
- iptables/ipset for firewall
- dnsmasq for DHCP/DNS
- WireGuard VPN support
- Network monitoring tools
- IP forwarding enabled
- Basic firewall script: `/usr/local/bin/firewall.sh`
EOF
            ;;
        kubernetes)
            cat >> README-$VM_TYPE.md << 'EOF'
**Kubernetes Node Features:**
- containerd container runtime
- kubectl, kubelet, kubeadm
- CNI plugins
- Kernel modules for Kubernetes
- Swap disabled
- Optimized sysctls

**Post-installation steps:**
1. Start containerd: `systemctl start containerd`
2. Initialize cluster or join existing cluster
3. Configure CNI networking
EOF
            ;;
        development)
            cat >> README-$VM_TYPE.md << 'EOF'
**Development Environment Features:**
- Docker and Podman
- Multiple programming languages (Node.js, Python, Go, Rust)
- Git with LFS support
- AUR helper (yay) pre-installed
- Development tools and editors

**Included Languages:**
- Node.js with npm
- Python with pip
- Go
- Rust with Cargo
- Ruby
- C/C++ toolchain
EOF
            ;;
    esac
}

# Main execution
main() {
    echo "Creating Arch Linux $VM_TYPE VM template..."
    echo "Configuration: ${RAM_SIZE}MB RAM, ${CPU_CORES} CPU cores, ${DISK_SIZE} disk"
    echo
    
    create_base_install_script
    create_qemu_script
    create_libvirt_xml
    create_proxmox_script
    create_readme
    
    echo "VM template files created successfully!"
    echo
    echo "Files created:"
    echo "  - arch-install.sh (installation script)"
    echo "  - run-vm.sh (QEMU runner)"
    echo "  - arch-$VM_TYPE-vm.xml (libvirt definition)"
    echo "  - create-proxmox-vm.sh (Proxmox creation script)"
    echo "  - README-$VM_TYPE.md (documentation)"
    echo
    echo "See README-$VM_TYPE.md for usage instructions."
}

main