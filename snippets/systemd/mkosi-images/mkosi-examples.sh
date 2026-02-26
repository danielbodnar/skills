#!/bin/bash
# mkosi Image Building Examples
# Comprehensive guide for creating custom OS images with mkosi

set -euo pipefail

# Image configuration
IMAGE_NAME="custom-os"
OUTPUT_DIR="/var/lib/mkosi-images"
WORK_DIR="/tmp/mkosi-work"

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

# Setup mkosi working environment
setup_mkosi_environment() {
    log "Setting up mkosi working environment"
    
    # Create working directories
    sudo mkdir -p "${OUTPUT_DIR}"
    sudo mkdir -p "${WORK_DIR}"
    
    # Install mkosi if not present
    if ! command -v mkosi &> /dev/null; then
        log "Installing mkosi"
        # Install via package manager or pip
        if command -v dnf &> /dev/null; then
            sudo dnf install -y mkosi
        elif command -v apt &> /dev/null; then
            sudo apt update && sudo apt install -y mkosi
        elif command -v pacman &> /dev/null; then
            sudo pacman -S --noconfirm mkosi
        else
            # Install via pip as fallback
            pip3 install --user mkosi
        fi
    fi
    
    log "mkosi environment ready"
}

# Create basic Fedora image
create_fedora_image() {
    log "Creating basic Fedora image"
    
    local config_file="${WORK_DIR}/fedora-basic.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=fedora-basic
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=fedora-basic.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         dnf
         kernel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Password=root
Bootable=yes
BiosBootloader=grub
Autologin=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Fedora basic image created"
}

# Create Ubuntu development image
create_ubuntu_dev_image() {
    log "Creating Ubuntu development image"
    
    local config_file="${WORK_DIR}/ubuntu-dev.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=ubuntu-dev
ImageVersion=1.0

[Distribution]
Distribution=ubuntu
Release=jammy

[Output]
Format=raw_gpt
ImageName=ubuntu-dev.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         build-essential
         gcc
         g++
         make
         cmake
         nodejs
         npm
         python3
         python3-pip
         docker.io
         containerd
         linux-image-generic
         grub-efi-amd64
         grub-efi-amd64-signed
         shim-signed

[Config]
Password=developer
Bootable=yes
Autologin=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Ubuntu development image created"
}

# Create Arch Linux minimal image
create_arch_minimal_image() {
    log "Creating Arch Linux minimal image"
    
    local config_file="${WORK_DIR}/arch-minimal.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=arch-minimal
ImageVersion=1.0

[Distribution]
Distribution=arch

[Output]
Format=raw_gpt
ImageName=arch-minimal.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=base
         systemd
         vim
         openssh
         linux
         grub
         efibootmgr
         
[Config]
Password=root
Bootable=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Arch Linux minimal image created"
}

# Create specialized container host image
create_container_host_image() {
    log "Creating container host image"
    
    local config_file="${WORK_DIR}/container-host.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=container-host
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=container-host.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         podman
         buildah
         skopeo
         crun
         systemd-container
         dnsmasq
         iptables
         bridge-utils
         kernel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Password=containers
Bootable=yes
Autologin=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Container host image created"
}

# Create image with custom scripts
create_image_with_scripts() {
    log "Creating image with custom configuration scripts"
    
    local config_file="${WORK_DIR}/custom-scripts.conf"
    local scripts_dir="${WORK_DIR}/scripts"
    
    # Create scripts directory
    mkdir -p "${scripts_dir}"
    
    # Create custom setup script
    cat << 'EOF' > "${scripts_dir}/setup.sh"
#!/bin/bash
# Custom setup script for mkosi image

# Configure SSH
systemctl enable sshd
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Create custom user
useradd -m -G wheel,sudo customuser
echo "customuser:password" | chpasswd

# Install additional software
if command -v dnf >/dev/null; then
    dnf install -y htop tree wget
elif command -v apt >/dev/null; then
    apt update && apt install -y htop tree wget
fi

# Configure firewall
if command -v firewall-cmd >/dev/null; then
    systemctl enable firewalld
    firewall-cmd --permanent --add-service=ssh
elif command -v ufw >/dev/null; then
    ufw enable
    ufw allow ssh
fi

# Set timezone
timedatectl set-timezone UTC

echo "Custom setup completed"
EOF

    chmod +x "${scripts_dir}/setup.sh"
    
    # Create mkosi configuration
    cat << EOF > "${config_file}"
[Config]
ImageId=custom-scripts
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=custom-scripts.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         firewalld
         kernel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Password=root
Bootable=yes
PostInstallationScript=${scripts_dir}/setup.sh
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Custom scripts image created"
}

# Create multi-architecture image
create_multiarch_image() {
    log "Creating multi-architecture image"
    
    local config_file="${WORK_DIR}/multiarch.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=multiarch
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=multiarch.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         qemu-user-static
         podman
         kernel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Architecture=x86_64
Password=root
Bootable=yes
QemuHeadless=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Multi-architecture image created"
}

# Create rescue/debugging image
create_rescue_image() {
    log "Creating rescue/debugging image"
    
    local config_file="${WORK_DIR}/rescue.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=rescue
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=rescue.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         nano
         curl
         wget
         git
         sudo
         gdb
         strace
         ltrace
         tcpdump
         wireshark-cli
         nmap
         netcat
         socat
         lsof
         htop
         iotop
         sysstat
         perf
         valgrind
         gparted
         fdisk
         parted
         rsync
         dd
         testdisk
         photorec
         kernel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Password=rescue
Bootable=yes
Autologin=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Rescue/debugging image created"
}

# Create image with custom kernel
create_custom_kernel_image() {
    log "Creating image with custom kernel configuration"
    
    local config_file="${WORK_DIR}/custom-kernel.conf"
    local kernel_config="${WORK_DIR}/kernel.config"
    
    # Create custom kernel config (minimal example)
    cat << EOF > "${kernel_config}"
CONFIG_64BIT=y
CONFIG_X86_64=y
CONFIG_LOCALVERSION="-custom"
CONFIG_DEFAULT_HOSTNAME="custom-kernel"
CONFIG_SYSVIPC=y
CONFIG_POSIX_MQUEUE=y
CONFIG_AUDIT=y
CONFIG_NO_HZ=y
CONFIG_HIGH_RES_TIMERS=y
CONFIG_PREEMPT_VOLUNTARY=y
CONFIG_IKCONFIG=y
CONFIG_IKCONFIG_PROC=y
CONFIG_CGROUPS=y
CONFIG_BLK_DEV_INITRD=y
CONFIG_CC_OPTIMIZE_FOR_SIZE=y
CONFIG_EMBEDDED=y
EOF

    cat << EOF > "${config_file}"
[Config]
ImageId=custom-kernel
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=custom-kernel.raw
OutputDirectory=${OUTPUT_DIR}

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         curl
         git
         sudo
         kernel-devel
         gcc
         make
         elfutils-libelf-devel
         openssl-devel
         dracut
         grub2-efi-x64
         grub2-efi-x64-modules
         efibootmgr
         shim-x64

[Config]
Password=root
Bootable=yes
KernelCommandLine=quiet console=tty0 console=ttyS0,115200n8
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Custom kernel image created"
}

# Create image for embedded systems
create_embedded_image() {
    log "Creating embedded systems image"
    
    local config_file="${WORK_DIR}/embedded.conf"
    
    cat << EOF > "${config_file}"
[Config]
ImageId=embedded
ImageVersion=1.0

[Distribution]
Distribution=fedora
Release=39

[Output]
Format=raw_gpt
ImageName=embedded.raw
OutputDirectory=${OUTPUT_DIR}
Minimize=yes

[Packages]
Packages=systemd
         passwd
         openssh-server
         vim
         busybox
         dropbear
         kernel
         dracut
         grub2-efi-x64

[Config]
Password=embedded
Bootable=yes
Autologin=yes
WithNetwork=yes
EOF

    # Build the image
    sudo mkosi -f "${config_file}" build
    
    log "Embedded systems image created"
}

# Image testing and validation
test_image() {
    local image_name="$1"
    local image_path="${OUTPUT_DIR}/${image_name}.raw"
    
    log "Testing image: ${image_name}"
    
    if [[ ! -f "${image_path}" ]]; then
        error "Image not found: ${image_path}"
        return 1
    fi
    
    # Test with systemd-vmspawn
    log "Testing image with systemd-vmspawn"
    timeout 60 sudo systemd-vmspawn \
        --image="${image_path}" \
        --ram=1G \
        --cpus=2 \
        --firmware=uefi \
        --console=pty &
    
    local vmspawn_pid=$!
    sleep 30
    
    # Kill the test VM
    sudo kill "${vmspawn_pid}" 2>/dev/null || true
    
    # Validate image structure
    log "Validating image structure"
    sudo qemu-img info "${image_path}"
    
    # Check partitions
    log "Checking partition table"
    sudo fdisk -l "${image_path}"
    
    log "Image test completed"
}

# Image management operations
list_images() {
    log "Listing available images"
    
    if [[ -d "${OUTPUT_DIR}" ]]; then
        find "${OUTPUT_DIR}" -name "*.raw" -exec basename {} \; | sort
    else
        warn "Output directory not found: ${OUTPUT_DIR}"
    fi
}

inspect_image() {
    local image_name="$1"
    local image_path="${OUTPUT_DIR}/${image_name}"
    
    log "Inspecting image: ${image_name}"
    
    if [[ ! -f "${image_path}" ]]; then
        error "Image not found: ${image_path}"
        return 1
    fi
    
    # Image information
    echo "=== Image Information ==="
    sudo qemu-img info "${image_path}"
    
    # Partition information
    echo "=== Partition Information ==="
    sudo fdisk -l "${image_path}"
    
    # Mount and inspect filesystem
    echo "=== Filesystem Content ==="
    local mount_point="/tmp/inspect-${image_name}"
    sudo mkdir -p "${mount_point}"
    
    # Find the root partition (usually the largest one)
    local root_offset=$(sudo fdisk -l "${image_path}" | grep -E "${image_path}[0-9]+" | tail -1 | awk '{print $2}')
    local offset=$((root_offset * 512))
    
    if sudo mount -o loop,offset="${offset}" "${image_path}" "${mount_point}"; then
        echo "Root filesystem contents:"
        sudo ls -la "${mount_point}"
        
        if [[ -f "${mount_point}/etc/os-release" ]]; then
            echo "OS Release information:"
            sudo cat "${mount_point}/etc/os-release"
        fi
        
        sudo umount "${mount_point}"
    else
        warn "Could not mount root filesystem"
    fi
    
    sudo rmdir "${mount_point}"
}

convert_image_format() {
    local source_image="$1"
    local target_format="$2"
    local target_name="$3"
    
    log "Converting image: ${source_image} to ${target_format}"
    
    local source_path="${OUTPUT_DIR}/${source_image}"
    local target_path="${OUTPUT_DIR}/${target_name}.${target_format}"
    
    if [[ ! -f "${source_path}" ]]; then
        error "Source image not found: ${source_path}"
        return 1
    fi
    
    # Convert image format
    sudo qemu-img convert -f raw -O "${target_format}" "${source_path}" "${target_path}"
    
    log "Image converted: ${target_path}"
}

# Image deployment helpers
deploy_to_usb() {
    local image_name="$1"
    local device="$2"
    
    log "Deploying image to USB device: ${device}"
    
    local image_path="${OUTPUT_DIR}/${image_name}"
    
    if [[ ! -f "${image_path}" ]]; then
        error "Image not found: ${image_path}"
        return 1
    fi
    
    if [[ ! -b "${device}" ]]; then
        error "Device not found: ${device}"
        return 1
    fi
    
    # Unmount any mounted partitions
    sudo umount "${device}"* 2>/dev/null || true
    
    # Write image to device
    log "Writing image to device (this may take a while)..."
    sudo dd if="${image_path}" of="${device}" bs=4M status=progress oflag=sync
    
    # Sync
    sudo sync
    
    log "Image deployed to ${device}"
}

deploy_to_vm() {
    local image_name="$1"
    local vm_name="$2"
    
    log "Deploying image as VM: ${vm_name}"
    
    local image_path="${OUTPUT_DIR}/${image_name}"
    local vm_path="/var/lib/machines/${vm_name}.raw"
    
    if [[ ! -f "${image_path}" ]]; then
        error "Image not found: ${image_path}"
        return 1
    fi
    
    # Copy image to VM location
    sudo mkdir -p "/var/lib/machines"
    sudo cp "${image_path}" "${vm_path}"
    
    # Create systemd service for VM
    cat << EOF | sudo tee "/etc/systemd/system/vm-${vm_name}.service" > /dev/null
[Unit]
Description=Virtual Machine ${vm_name}
After=network.target

[Service]
Type=notify
ExecStart=/usr/lib/systemd/systemd-vmspawn \\
    --image=${vm_path} \\
    --ram=2G \\
    --cpus=2 \\
    --firmware=uefi
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    
    log "VM deployed: ${vm_name}"
    log "Start with: sudo systemctl start vm-${vm_name}.service"
}

# Cleanup operations
cleanup_build_artifacts() {
    log "Cleaning up build artifacts"
    
    # Remove work directory
    sudo rm -rf "${WORK_DIR}"
    
    # Clean package caches
    if command -v dnf &> /dev/null; then
        sudo dnf clean all
    elif command -v apt &> /dev/null; then
        sudo apt clean
    fi
    
    log "Build artifacts cleaned up"
}

# Usage and help
show_usage() {
    cat << EOF
mkosi Image Building Examples

Usage: $0 [COMMAND] [OPTIONS]

Image Creation:
    setup               Setup mkosi environment
    fedora-basic        Create basic Fedora image
    ubuntu-dev          Create Ubuntu development image
    arch-minimal        Create minimal Arch Linux image
    container-host      Create container host image
    custom-scripts      Create image with custom scripts
    multiarch           Create multi-architecture image
    rescue              Create rescue/debugging image
    custom-kernel       Create image with custom kernel
    embedded            Create embedded systems image

Image Management:
    list                List available images
    inspect NAME        Inspect image details
    test NAME           Test image functionality
    convert NAME FORMAT TARGET  Convert image format

Deployment:
    deploy-usb NAME DEVICE      Deploy image to USB device
    deploy-vm NAME VM_NAME      Deploy image as VM

Maintenance:
    cleanup             Clean up build artifacts

Examples:
    # Setup environment and create basic image
    $0 setup
    $0 fedora-basic

    # Create development environment
    $0 ubuntu-dev

    # Test the created image
    $0 test ubuntu-dev

    # Deploy to USB drive
    $0 deploy-usb fedora-basic.raw /dev/sdb

    # Convert to QCOW2 format
    $0 convert fedora-basic.raw qcow2 fedora-basic-qcow2

    # Deploy as VM
    $0 deploy-vm fedora-basic.raw my-fedora-vm

Environment Variables:
    IMAGE_NAME          Base image name (default: custom-os)
    OUTPUT_DIR          Output directory (default: /var/lib/mkosi-images)
    WORK_DIR            Working directory (default: /tmp/mkosi-work)
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        "setup")
            setup_mkosi_environment
            ;;
        "fedora-basic")
            create_fedora_image
            ;;
        "ubuntu-dev")
            create_ubuntu_dev_image
            ;;
        "arch-minimal")
            create_arch_minimal_image
            ;;
        "container-host")
            create_container_host_image
            ;;
        "custom-scripts")
            create_image_with_scripts
            ;;
        "multiarch")
            create_multiarch_image
            ;;
        "rescue")
            create_rescue_image
            ;;
        "custom-kernel")
            create_custom_kernel_image
            ;;
        "embedded")
            create_embedded_image
            ;;
        "list")
            list_images
            ;;
        "inspect")
            inspect_image "$2"
            ;;
        "test")
            test_image "$2"
            ;;
        "convert")
            convert_image_format "$2" "$3" "$4"
            ;;
        "deploy-usb")
            deploy_to_usb "$2" "$3"
            ;;
        "deploy-vm")
            deploy_to_vm "$2" "$3"
            ;;
        "cleanup")
            cleanup_build_artifacts
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