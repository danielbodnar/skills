#!/bin/bash
# VyOS PXE Boot Configuration for netboot.xyz

# Configuration commands for VyOS
cat << 'EOF'
configure

# Enable dnsmasq for DHCP
set service dhcp-server use-dnsmasq enable

# Configure PXE boot options for different architectures
set service dns forwarding options "dhcp-match=set:bios,60,PXEClient:Arch:00000"
set service dns forwarding options "dhcp-boot=tag:bios,netboot.xyz.kpxe,,SERVERIP"

set service dns forwarding options "dhcp-match=set:efi32,60,PXEClient:Arch:00002"
set service dns forwarding options "dhcp-boot=tag:efi32,netboot.xyz.efi,,SERVERIP"

set service dns forwarding options "dhcp-match=set:efi32-1,60,PXEClient:Arch:00006"
set service dns forwarding options "dhcp-boot=tag:efi32-1,netboot.xyz.efi,,SERVERIP"

set service dns forwarding options "dhcp-match=set:efi64,60,PXEClient:Arch:00007"
set service dns forwarding options "dhcp-boot=tag:efi64,netboot.xyz.efi,,SERVERIP"

set service dns forwarding options "dhcp-match=set:efi64-1,60,PXEClient:Arch:00008"
set service dns forwarding options "dhcp-boot=tag:efi64-1,netboot.xyz.efi,,SERVERIP"

set service dns forwarding options "dhcp-match=set:efi64-2,60,PXEClient:Arch:00009"
set service dns forwarding options "dhcp-boot=tag:efi64-2,netboot.xyz.efi,,SERVERIP"

commit
save
EOF

# Instructions for manual setup
echo ""
echo "Manual setup steps:"
echo "1. Replace SERVERIP with your netboot.xyz server IP address"
echo "2. Run the above commands in VyOS configuration mode"
echo "3. Ensure TFTP server is accessible with netboot.xyz boot files"
echo "4. Download boot files to TFTP root:"
echo "   curl -o /tftproot/netboot.xyz.kpxe https://boot.netboot.xyz/ipxe/netboot.xyz.kpxe"
echo "   curl -o /tftproot/netboot.xyz.efi https://boot.netboot.xyz/ipxe/netboot.xyz.efi"