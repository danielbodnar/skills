#!/bin/bash
# systemd-vmspawn Basic Usage Examples

# Basic VM creation from disk image
echo "=== Basic VM from disk image ==="
systemd-vmspawn --image=vm.raw

# Basic VM from directory
echo "=== Basic VM from directory ==="
systemd-vmspawn --directory=/path/to/rootfs

# VM with custom machine name
echo "=== VM with custom name ==="
systemd-vmspawn --image=vm.raw --machine=development-vm

# VM with resource constraints
echo "=== VM with resource limits ==="
systemd-vmspawn \
    --image=vm.raw \
    --cpus=2 \
    --ram=4G \
    --machine=resource-limited-vm

# VM with KVM acceleration disabled
echo "=== VM without KVM ==="
systemd-vmspawn \
    --image=vm.raw \
    --kvm=no \
    --machine=no-kvm-vm

# Quick Arch Linux VM with mkosi
echo "=== Creating and running Arch Linux VM ==="
# First, create the image with mkosi
mkosi -d arch -p systemd -p linux --autologin -o arch-vm.raw -f build

# Then run it with systemd-vmspawn
systemd-vmspawn --image=arch-vm.raw --machine=arch-test

# VM with console in read-only mode
echo "=== VM with read-only console ==="
systemd-vmspawn \
    --image=vm.raw \
    --console=read-only \
    --machine=readonly-console

# VM with GUI console
echo "=== VM with GUI console ==="
systemd-vmspawn \
    --image=vm.raw \
    --console=gui \
    --machine=gui-vm

# VM with specific background color
echo "=== VM with custom terminal background ==="
systemd-vmspawn \
    --image=vm.raw \
    --background=blue \
    --machine=blue-terminal-vm

# Check available firmware
echo "=== List available firmware ==="
systemd-vmspawn --firmware=list

# VM with specific firmware
echo "=== VM with specific firmware ==="
systemd-vmspawn \
    --image=vm.raw \
    --firmware=/usr/share/qemu/firmware/50-edk2-i386-secure.json \
    --machine=custom-firmware-vm

# VM with Secure Boot enabled
echo "=== VM with Secure Boot ==="
systemd-vmspawn \
    --image=vm.raw \
    --secure-boot=yes \
    --machine=secure-boot-vm

# VM with direct kernel boot (systemd 256+)
echo "=== Direct kernel boot ==="
systemd-vmspawn \
    --directory=/path/to/rootfs \
    --linux=/boot/vmlinuz \
    --initrd=/boot/initramfs.img \
    --machine=direct-boot-vm

# VM with additional kernel parameters
echo "=== VM with kernel parameters ==="
systemd-vmspawn \
    --image=vm.raw \
    --linux=/boot/vmlinuz \
    --machine=kernel-params-vm \
    -- \
    console=ttyS0 systemd.unit=multi-user.target

# Simple container-to-VM migration example
echo "=== Container to VM migration concept ==="
# Export container rootfs
# podman export container_name > container.tar
# mkdir /tmp/vm-rootfs
# tar -C /tmp/vm-rootfs -xf container.tar
# systemd-vmspawn --directory=/tmp/vm-rootfs --machine=migrated-vm

echo "Basic usage examples completed!"
echo "Run with: bash /home/bodnar/.claude/snippets/systemd-vmspawn/basic-usage.sh"