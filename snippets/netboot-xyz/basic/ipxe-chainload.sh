#!/bin/bash
# Basic iPXE chainload to netboot.xyz

# DHCP-based chainload (most common)
echo "# DHCP-based chainload"
echo "dhcp"
echo "chain --autofree https://boot.netboot.xyz"
echo ""

# Static IP configuration chainload
echo "# Static IP configuration"
echo "set net0/ip 192.168.1.100"
echo "set net0/netmask 255.255.255.0"
echo "set net0/gateway 192.168.1.1"
echo "set dns 1.1.1.1"
echo "ifopen net0"
echo "chain --autofree https://boot.netboot.xyz"
echo ""

# HTTP fallback for systems without HTTPS support
echo "# HTTP fallback (if HTTPS not supported)"
echo "dhcp"
echo "chain --autofree http://boot.netboot.xyz"
echo ""

# Direct kernel chainload
echo "# Direct kernel chainload"
echo "chain --autofree http://boot.netboot.xyz/ipxe/netboot.xyz.lkrn"
echo ""

# EFI chainload
echo "# EFI chainload"
echo "chain --autofree http://boot.netboot.xyz/ipxe/netboot.xyz.efi"