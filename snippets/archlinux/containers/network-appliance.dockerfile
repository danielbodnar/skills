# network-appliance.dockerfile - Arch Linux network appliance container

FROM archlinux:latest

# Metadata
LABEL maintainer="network-team@example.com"
LABEL description="Arch Linux network appliance with routing, firewall, and VPN capabilities"
LABEL version="1.0"

# Install network packages
RUN pacman -Syu --noconfirm && \
    pacman -S --needed --noconfirm \
        # Core networking
        iptables \
        ipset \
        iproute2 \
        bridge-utils \
        net-tools \
        # Services
        dnsmasq \
        openssh \
        wireguard-tools \
        strongswan \
        # Monitoring tools
        tcpdump \
        nmap \
        iperf3 \
        mtr \
        traceroute \
        netcat \
        socat \
        # System tools
        systemd \
        sudo \
        vim \
        htop \
        curl \
        wget \
        rsync \
        # Security
        fail2ban \
        # Utilities
        bash-completion \
        man-db && \
    pacman -Scc --noconfirm

# Create network service user
RUN useradd -r -s /bin/false -d /var/lib/network -m network && \
    useradd -m -G wheel -s /bin/bash netadmin && \
    echo 'netadmin:netadmin' | chpasswd && \
    echo '%wheel ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Configure dnsmasq
RUN mkdir -p /etc/dnsmasq.d /var/lib/dnsmasq && \
    chown network:network /var/lib/dnsmasq

COPY <<EOF /etc/dnsmasq.conf
# Basic DHCP/DNS configuration
interface=eth1
dhcp-range=192.168.100.10,192.168.100.100,255.255.255.0,12h
dhcp-option=3,192.168.100.1
dhcp-option=6,8.8.8.8,8.8.4.4

# DNS settings
no-resolv
server=8.8.8.8
server=8.8.4.4
cache-size=1000

# Logging
log-queries
log-dhcp

# Configuration directory
conf-dir=/etc/dnsmasq.d,.rpmnew,.rpmsave,.rpmorig
EOF

# Configure iptables firewall
COPY <<EOF /usr/local/bin/firewall.sh
#!/bin/bash
# Basic firewall configuration

# Flush existing rules
iptables -F
iptables -t nat -F
iptables -t mangle -F

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow DHCP
iptables -A INPUT -p udp --dport 67 -j ACCEPT

# Allow DNS
iptables -A INPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT -p tcp --dport 53 -j ACCEPT

# Allow ping
iptables -A INPUT -p icmp -j ACCEPT

# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# NAT for internal network
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT
iptables -A FORWARD -i eth0 -o eth1 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

echo "Firewall rules applied"
EOF

RUN chmod +x /usr/local/bin/firewall.sh

# Configure WireGuard
RUN mkdir -p /etc/wireguard && \
    chmod 700 /etc/wireguard

COPY <<EOF /etc/wireguard/wg0.conf.template
[Interface]
PrivateKey = PRIVATE_KEY_HERE
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client configuration template
# [Peer]
# PublicKey = CLIENT_PUBLIC_KEY
# AllowedIPs = 10.0.0.2/32
EOF

# Configure SSH
RUN ssh-keygen -A && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#Port 22/Port 22/' /etc/ssh/sshd_config

# Create systemd service for network appliance
COPY <<EOF /etc/systemd/system/network-appliance.service
[Unit]
Description=Network Appliance Service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/firewall.sh
RemainAfterExit=yes
User=root

[Install]
WantedBy=multi-user.target
EOF

# Create management script
COPY <<EOF /usr/local/bin/network-manage
#!/bin/bash
# network-manage - Network appliance management script

case "\$1" in
    start)
        echo "Starting network services..."
        systemctl start network-appliance
        systemctl start dnsmasq
        systemctl start sshd
        echo "Network appliance started"
        ;;
    stop)
        echo "Stopping network services..."
        systemctl stop dnsmasq
        systemctl stop network-appliance
        echo "Network appliance stopped"
        ;;
    restart)
        \$0 stop
        sleep 2
        \$0 start
        ;;
    status)
        echo "Network appliance status:"
        systemctl status network-appliance dnsmasq sshd
        ;;
    firewall)
        echo "Current firewall rules:"
        iptables -L -n -v
        ;;
    dhcp)
        echo "DHCP leases:"
        cat /var/lib/dnsmasq/dnsmasq.leases 2>/dev/null || echo "No leases file"
        ;;
    logs)
        echo "Recent logs:"
        journalctl -u dnsmasq -u network-appliance --since "1 hour ago"
        ;;
    wg-keygen)
        echo "Generating WireGuard keys..."
        wg genkey | tee /tmp/private.key | wg pubkey > /tmp/public.key
        echo "Private key: \$(cat /tmp/private.key)"
        echo "Public key: \$(cat /tmp/public.key)"
        rm /tmp/private.key /tmp/public.key
        ;;
    *)
        echo "Usage: \$0 {start|stop|restart|status|firewall|dhcp|logs|wg-keygen}"
        exit 1
        ;;
esac
EOF

RUN chmod +x /usr/local/bin/network-manage

# Enable services
RUN systemctl enable network-appliance dnsmasq sshd

# Create configuration directories
RUN mkdir -p /etc/network-appliance /var/log/network-appliance

# Set up monitoring
COPY <<EOF /usr/local/bin/network-monitor
#!/bin/bash
# Simple network monitoring script

echo "=== Network Appliance Status ==="
echo "Date: \$(date)"
echo

echo "=== Network Interfaces ==="
ip addr show

echo -e "\n=== Routing Table ==="
ip route show

echo -e "\n=== Active Connections ==="
ss -tuln

echo -e "\n=== DHCP Leases ==="
cat /var/lib/dnsmasq/dnsmasq.leases 2>/dev/null || echo "No leases"

echo -e "\n=== System Load ==="
uptime

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Disk Usage ==="
df -h
EOF

RUN chmod +x /usr/local/bin/network-monitor

# Expose common ports
EXPOSE 22 53/udp 53/tcp 67/udp 51820/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD systemctl is-active dnsmasq && systemctl is-active sshd || exit 1

# Default command
CMD ["/usr/local/bin/network-manage", "start", "&&", "/usr/sbin/init"]

# Build and usage instructions:
# docker build -t arch-network-appliance -f network-appliance.dockerfile .
# docker run -d --name router --cap-add=NET_ADMIN --net=host arch-network-appliance
# docker exec -it router network-manage status