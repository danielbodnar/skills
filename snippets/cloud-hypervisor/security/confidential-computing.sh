#!/bin/bash
# Cloud Hypervisor Confidential Computing Examples
# Supports Intel TDX, AMD SEV-SNP, and Intel SGX

# Intel TDX (Trust Domain Extensions) Examples
setup_tdx() {
    echo "Setting up Intel TDX environment..."
    
    # Build Cloud Hypervisor with TDX support
    echo "Building Cloud Hypervisor with TDX feature..."
    cargo build --features tdx --release
    
    # Verify TDX support in processor
    if ! grep -q tdx /proc/cpuinfo; then
        echo "Warning: TDX not detected in CPU features"
    fi
    
    # Check TDX module status
    if lsmod | grep -q tdx; then
        echo "TDX module loaded"
    else
        echo "Warning: TDX module not loaded"
    fi
}

# Launch TDX VM with TDVF firmware (release)
launch_tdx_vm_release() {
    local guest_image="${1:-/path/to/tdx-guest.img}"
    local firmware_path="${2:-/path/to/edk2/Build/IntelTdx/RELEASE_GCC5/FV/OVMF.fd}"
    
    echo "Launching TDX VM with TDVF firmware (release)..."
    
    ./cloud-hypervisor \
        --platform tdx=on \
        --firmware "$firmware_path" \
        --cpus boot=1 \
        --memory size=1G \
        --disk path="$guest_image" \
        --api-socket /tmp/tdx-vm.sock
}

# Launch TDX VM with TDVF firmware (debug)
launch_tdx_vm_debug() {
    local guest_image="${1:-/path/to/tdx-guest.img}"
    local firmware_path="${2:-/path/to/edk2/Build/IntelTdx/DEBUG_GCC5/FV/OVMF.fd}"
    
    echo "Launching TDX VM with TDVF firmware (debug)..."
    
    ./cloud-hypervisor \
        --platform tdx=on \
        --firmware "$firmware_path" \
        --cpus boot=1 \
        --memory size=1G \
        --disk path="$guest_image" \
        --serial file=/tmp/ch_serial \
        --console tty \
        --api-socket /tmp/tdx-vm-debug.sock
}

# Launch TDX VM with TD-Shim firmware (release)
launch_tdx_vm_td_shim_release() {
    local guest_image="${1:-/path/to/tdx-guest.img}"
    local kernel_path="${2:-/path/to/bzImage}"
    local td_shim_path="${3:-/path/to/td-shim/target/release/final.bin}"
    
    echo "Launching TDX VM with TD-Shim (release)..."
    
    ./cloud-hypervisor \
        --platform tdx=on \
        --firmware "$td_shim_path" \
        --kernel "$kernel_path" \
        --cmdline "root=/dev/vda3 console=hvc0 rw" \
        --cpus boot=1 \
        --memory size=1G \
        --disk path="$guest_image" \
        --api-socket /tmp/tdx-shim-vm.sock
}

# AMD SEV-SNP (Secure Encrypted Virtualization) Examples
setup_sev_snp() {
    echo "Setting up AMD SEV-SNP environment..."
    
    # Build Cloud Hypervisor with SEV-SNP support
    echo "Building Cloud Hypervisor with SEV-SNP feature..."
    cargo build --locked --all --all-targets --no-default-features --tests --examples --features sev_snp
    
    # Check SEV support
    if [ -f /sys/module/kvm_amd/parameters/sev ]; then
        sev_status=$(cat /sys/module/kvm_amd/parameters/sev)
        echo "SEV support: $sev_status"
    else
        echo "Warning: SEV status not available"
    fi
    
    # Check SEV-SNP support
    if [ -f /sys/module/kvm_amd/parameters/sev_snp ]; then
        snp_status=$(cat /sys/module/kvm_amd/parameters/sev_snp)
        echo "SEV-SNP support: $snp_status"
    else
        echo "Warning: SEV-SNP status not available"
    fi
}

# Launch SEV-SNP VM
launch_sev_snp_vm() {
    local guest_image="${1:-/path/to/ubuntu.img}"
    
    echo "Launching SEV-SNP VM..."
    
    ./cloud-hypervisor \
        --platform sev_snp=on \
        --cpus boot=1 \
        --memory size=1G \
        --disk path="$guest_image" \
        --api-socket /tmp/sev-snp-vm.sock
}

# Intel SGX (Software Guard Extensions) Examples
setup_sgx() {
    echo "Setting up Intel SGX environment..."
    
    # Check SGX support
    if grep -q sgx /proc/cpuinfo; then
        echo "SGX support detected in CPU"
    else
        echo "Warning: SGX not detected in CPU features"
    fi
    
    # Check SGX driver
    if [ -c /dev/sgx_enclave ]; then
        echo "SGX enclave device available"
    else
        echo "Warning: SGX enclave device not found"
    fi
    
    if [ -c /dev/sgx_provision ]; then
        echo "SGX provision device available"
    else
        echo "Warning: SGX provision device not found"
    fi
}

# Launch VM with SGX EPC sections
launch_sgx_vm() {
    local guest_image="${1:-/path/to/focal-server-cloudimg-amd64.raw}"
    local kernel_path="${2:-/path/to/vmlinux}"
    
    echo "Launching VM with Intel SGX EPC sections..."
    
    ./cloud-hypervisor \
        --cpus boot=1 \
        --memory size=1G \
        --disk path="$guest_image" \
        --kernel "$kernel_path" \
        --cmdline "console=ttyS0 console=hvc0 root=/dev/vda1 rw" \
        --sgx-epc id=epc0,size=64M,prefault=on id=epc1,size=32M,prefault=off \
        --api-socket /tmp/sgx-vm.sock
}

# Virtual IOMMU for device isolation
setup_viommu() {
    local guest_image="${1:-/path/to/focal-server-cloudimg-amd64.raw}"
    local kernel_path="${2:-/path/to/custom-vmlinux}"
    
    echo "Launching VM with Virtual IOMMU..."
    
    ./cloud-hypervisor \
        --cpus boot=1 \
        --memory size=512M \
        --disk path="$guest_image",iommu=on \
        --kernel "$kernel_path" \
        --cmdline "console=ttyS0 console=hvc0 root=/dev/vda1 rw" \
        --iommu \
        --api-socket /tmp/viommu-vm.sock
}

# Security monitoring and verification
verify_security_features() {
    echo "Verifying security features..."
    
    # Check available security features
    echo "=== CPU Security Features ==="
    grep -E "(sgx|tdx|sev|smep|smap)" /proc/cpuinfo | head -10
    
    # Check kernel security features
    echo -e "\n=== Kernel Security ==="
    if [ -f /proc/config.gz ]; then
        zcat /proc/config.gz | grep -E "(SECURITY|FORTIFY|KASLR|SMEP|SMAP)" | head -10
    fi
    
    # Check IOMMU status
    echo -e "\n=== IOMMU Status ==="
    dmesg | grep -i iommu | tail -5
    
    # Check virtualization extensions
    echo -e "\n=== Virtualization Extensions ==="
    if lscpu | grep -q "Virtualization"; then
        lscpu | grep "Virtualization"
    fi
    
    # Check secure boot status
    echo -e "\n=== Secure Boot Status ==="
    if [ -f /sys/firmware/efi/efivars/SecureBoot-* ]; then
        hexdump -C /sys/firmware/efi/efivars/SecureBoot-* | head -1
    fi
}

# Main function
main() {
    case "${1:-help}" in
        "setup-tdx")
            setup_tdx
            ;;
        "launch-tdx")
            launch_tdx_vm_release "$2"
            ;;
        "launch-tdx-debug")
            launch_tdx_vm_debug "$2"
            ;;
        "launch-tdx-shim")
            launch_tdx_vm_td_shim_release "$2" "$3" "$4"
            ;;
        "setup-sev")
            setup_sev_snp
            ;;
        "launch-sev")
            launch_sev_snp_vm "$2"
            ;;
        "setup-sgx")
            setup_sgx
            ;;
        "launch-sgx")
            launch_sgx_vm "$2" "$3"
            ;;
        "viommu")
            setup_viommu "$2" "$3"
            ;;
        "verify")
            verify_security_features
            ;;
        *)
            echo "Usage: $0 [command] [options]"
            echo "Commands:"
            echo "  setup-tdx              - Set up Intel TDX environment"
            echo "  launch-tdx [image]     - Launch TDX VM with TDVF (release)"
            echo "  launch-tdx-debug [img] - Launch TDX VM with TDVF (debug)"
            echo "  launch-tdx-shim [args] - Launch TDX VM with TD-Shim"
            echo "  setup-sev              - Set up AMD SEV-SNP environment"
            echo "  launch-sev [image]     - Launch SEV-SNP VM"
            echo "  setup-sgx              - Set up Intel SGX environment"
            echo "  launch-sgx [img] [krn] - Launch VM with SGX EPC sections"
            echo "  viommu [img] [kernel]  - Launch VM with Virtual IOMMU"
            echo "  verify                 - Verify security features"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi