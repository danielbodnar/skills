---
name: linux-networking
description: Diagnose and configure Linux networking including interfaces, routing, DNS, and firewall rules
---

# Linux Networking

Skill for diagnosing and configuring Linux networking. Covers interface management, routing, DNS resolution, firewall rules with nftables, socket inspection, and common troubleshooting workflows.

## Interface Management

### Viewing Interfaces

```bash
# Show all interfaces with addresses
ip -c addr show

# Show brief summary of interfaces
ip -br link show

# Show a specific interface
ip addr show dev <interface>

# Show interface statistics (errors, drops, etc.)
ip -s link show dev <interface>

# Show interface hardware details
ip -d link show dev <interface>

# Show only interfaces that are UP
ip link show up

# Show interface MTU
ip link show dev <interface> | grep mtu
```

### Configuring Interfaces

```bash
# Bring an interface up
ip link set dev <interface> up

# Bring an interface down
ip link set dev <interface> down

# Add an IP address to an interface
ip addr add 192.168.1.10/24 dev <interface>

# Remove an IP address from an interface
ip addr del 192.168.1.10/24 dev <interface>

# Set the MTU
ip link set dev <interface> mtu 9000

# Add a VLAN interface
ip link add link <parent> name <parent>.100 type vlan id 100
ip addr add 10.0.100.1/24 dev <parent>.100
ip link set dev <parent>.100 up
```

### Bridge Interfaces

```bash
# Create a bridge
ip link add name br0 type bridge

# Add an interface to the bridge
ip link set dev <interface> master br0

# Show bridge members
bridge link show

# Show bridge forwarding database
bridge fdb show dev br0

# Remove an interface from a bridge
ip link set dev <interface> nomaster
```

## Routing

### Viewing Routes

```bash
# Show the main routing table
ip route show

# Show all routing tables
ip route show table all

# Show the route for a specific destination
ip route get 8.8.8.8

# Show the route with source address selection
ip route get 10.0.0.1 from 192.168.1.10

# Show routing table with protocol information
ip -d route show

# Show routing policy rules
ip rule show

# Show neighbor (ARP) table
ip neigh show

# Show only reachable neighbors
ip neigh show nud reachable
```

### Managing Routes

```bash
# Add a static route
ip route add 10.10.0.0/16 via 192.168.1.1 dev <interface>

# Add a default gateway
ip route add default via 192.168.1.1

# Delete a route
ip route del 10.10.0.0/16

# Replace a route (add or update)
ip route replace 10.10.0.0/16 via 192.168.1.2 dev <interface>

# Add a route with a specific metric
ip route add 10.10.0.0/16 via 192.168.1.1 metric 100

# Add a blackhole route (drop traffic)
ip route add blackhole 10.99.0.0/16

# Flush the routing cache
ip route flush cache
```

### Policy Routing

```bash
# Add a routing policy rule
ip rule add from 10.0.1.0/24 table 100

# Add routes to a custom table
ip route add default via 10.0.1.1 table 100
ip route add 10.0.1.0/24 dev eth1 table 100

# Mark-based routing
ip rule add fwmark 0x1 table 200
```

## Socket Inspection

### Using `ss` (Socket Statistics)

```bash
# Show all listening TCP sockets with process info
ss -tlnp

# Show all established TCP connections
ss -tnp

# Show all listening and established TCP sockets
ss -tanp

# Show UDP sockets
ss -ulnp

# Show UNIX domain sockets
ss -xlnp

# Show socket memory usage
ss -tm

# Filter by destination port
ss -tn dport = :443

# Filter by source port
ss -tn sport = :8080

# Filter by state
ss state established

# Filter by address
ss dst 10.0.0.0/8

# Show socket timer information
ss -to

# Show summary statistics
ss -s

# Show connections to a specific remote host
ss -tnp dst <ip>
```

## DNS Troubleshooting

### Resolution Testing

```bash
# Basic DNS lookup
dig <domain>

# Query a specific DNS server
dig @8.8.8.8 <domain>

# Short answer only
dig +short <domain>

# Trace the full resolution path
dig +trace <domain>

# Query specific record types
dig <domain> A
dig <domain> AAAA
dig <domain> MX
dig <domain> TXT
dig <domain> NS
dig <domain> SOA
dig <domain> CNAME

# Reverse DNS lookup
dig -x <ip-address>

# Check DNSSEC validation
dig +dnssec <domain>

# Test TCP DNS (when UDP fails)
dig +tcp <domain>
```

### systemd-resolved

```bash
# Show current DNS configuration
resolvectl status

# Show DNS statistics
resolvectl statistics

# Flush the DNS cache
resolvectl flush-caches

# Query a domain through systemd-resolved
resolvectl query <domain>

# Show the contents of the DNS cache
resolvectl show-cache

# Check which DNS server is used for a domain
resolvectl query --type=A <domain>
```

### Configuration Files

```bash
# systemd-resolved configuration
/etc/systemd/resolved.conf

# Static DNS configuration (bypasses resolved)
/etc/resolv.conf

# Host file (local overrides)
/etc/hosts

# NSSwitch configuration (name resolution order)
/etc/nsswitch.conf
```

### Common DNS Issues

- **Slow resolution**: Check if the configured DNS server is reachable and responsive. Try `dig @<dns-server> <domain>` with timing.
- **NXDOMAIN**: Domain does not exist. Verify spelling, check if the domain has expired.
- **SERVFAIL**: DNS server failure. Try a different upstream DNS. Check DNSSEC validation issues.
- **Timeout**: DNS server unreachable. Check network connectivity, firewall rules blocking UDP/TCP port 53.
- **Split DNS**: Use `resolvectl domain <interface> <domain>` to configure per-interface DNS domains.

## Firewall (nftables)

nftables is the modern Linux packet classification framework, replacing iptables.

### Viewing Rules

```bash
# List all rules in all tables
nft list ruleset

# List rules in a specific table
nft list table inet filter

# List a specific chain
nft list chain inet filter input

# Show rules with handles (needed for deletion)
nft -a list ruleset

# Show counter values
nft list ruleset
```

### Basic Table and Chain Setup

```bash
# Create a table
nft add table inet filter

# Create an input chain with default drop policy
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }

# Create a forward chain
nft add chain inet filter forward { type filter hook forward priority 0 \; policy drop \; }

# Create an output chain (usually accept)
nft add chain inet filter output { type filter hook output priority 0 \; policy accept \; }
```

### Common Rules

```bash
# Allow established and related connections
nft add rule inet filter input ct state established,related accept

# Allow loopback
nft add rule inet filter input iif lo accept

# Allow SSH
nft add rule inet filter input tcp dport 22 accept

# Allow HTTP and HTTPS
nft add rule inet filter input tcp dport { 80, 443 } accept

# Allow ICMP (ping)
nft add rule inet filter input icmp type echo-request accept
nft add rule inet filter input icmpv6 type echo-request accept

# Allow from a specific subnet
nft add rule inet filter input ip saddr 10.0.0.0/8 accept

# Rate limit SSH connections
nft add rule inet filter input tcp dport 22 ct state new limit rate 3/minute accept

# Log and drop everything else
nft add rule inet filter input log prefix "nft-drop: " drop

# Delete a rule by handle
nft delete rule inet filter input handle <handle-number>
```

### NAT Rules

```bash
# Create a NAT table
nft add table ip nat

# Masquerade (source NAT for outgoing traffic)
nft add chain ip nat postrouting { type nat hook postrouting priority 100 \; }
nft add rule ip nat postrouting oif <wan-interface> masquerade

# Port forwarding (destination NAT)
nft add chain ip nat prerouting { type nat hook prerouting priority -100 \; }
nft add rule ip nat prerouting iif <wan-interface> tcp dport 8080 dnat to 192.168.1.10:80
```

### Saving and Restoring

```bash
# Save current ruleset to a file
nft list ruleset > /etc/nftables.conf

# Load rules from a file
nft -f /etc/nftables.conf

# Flush all rules
nft flush ruleset

# Enable nftables service to load rules at boot
systemctl enable nftables.service
```

## Connectivity Testing

### Basic Tests

```bash
# Ping a host
ping -c 4 <host>

# Ping with specific interface
ping -I <interface> <host>

# Traceroute
traceroute <host>

# Traceroute using TCP (when ICMP is blocked)
traceroute -T -p 443 <host>

# MTR (combines ping and traceroute)
mtr -n --report <host>

# Test TCP connectivity to a specific port
nc -zv <host> <port>

# Fetch HTTP headers
curl -I https://<host>

# Full HTTP request with timing
curl -o /dev/null -s -w "dns: %{time_namelookup}s\nconnect: %{time_connect}s\nttfb: %{time_starttransfer}s\ntotal: %{time_total}s\n" https://<host>
```

### Packet Capture

```bash
# Capture packets on an interface
tcpdump -i <interface> -n

# Capture with verbose output and don't resolve names
tcpdump -i <interface> -nn -v

# Capture only TCP traffic on port 80
tcpdump -i <interface> -n tcp port 80

# Capture traffic to/from a specific host
tcpdump -i <interface> -n host <ip>

# Capture and write to a file for Wireshark analysis
tcpdump -i <interface> -w /tmp/capture.pcap -c 1000

# Capture DNS queries
tcpdump -i <interface> -n port 53

# Capture with packet contents (hex + ASCII)
tcpdump -i <interface> -n -X port 443
```

## WireGuard VPN

```bash
# Show WireGuard interface status
wg show

# Show WireGuard interface with detailed info
wg show <interface>

# Show endpoints and latest handshake times
wg show <interface> endpoints
wg show <interface> latest-handshakes

# Show transfer statistics
wg show <interface> transfer

# Generate a private key
wg genkey

# Derive a public key from a private key
echo "<private-key>" | wg pubkey

# Generate a preshared key
wg genpsk

# Bring up a WireGuard interface from config
wg-quick up <interface>

# Bring down a WireGuard interface
wg-quick down <interface>
```

### WireGuard Configuration

```ini
# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <private-key>
Address = 10.200.0.1/24
ListenPort = 51820
PostUp = nft add rule inet filter input udp dport 51820 accept
PostDown = nft delete rule inet filter input udp dport 51820 accept

[Peer]
PublicKey = <peer-public-key>
PresharedKey = <optional-psk>
AllowedIPs = 10.200.0.2/32
PersistentKeepalive = 25
```

## Troubleshooting Workflows

### No Network Connectivity

1. Check interface is UP: `ip link show`
2. Check IP address assigned: `ip addr show`
3. Check default route exists: `ip route show`
4. Ping the gateway: `ping -c 2 <gateway>`
5. Ping an external IP: `ping -c 2 8.8.8.8`
6. Test DNS resolution: `dig google.com`
7. Check firewall rules: `nft list ruleset`

### Slow Network Performance

1. Check interface errors/drops: `ip -s link show dev <interface>`
2. Check MTU along path: `ping -M do -s 1472 <host>`
3. Test bandwidth: `iperf3 -c <host>`
4. Check for packet loss: `mtr --report <host>`
5. Check TCP connection state: `ss -ti dst <host>`
6. Check for DNS latency: `dig <domain> | grep "Query time"`
7. Check system network buffers: `sysctl net.core.rmem_max net.core.wmem_max`

### Port Not Reachable

1. Verify service is listening: `ss -tlnp | grep <port>`
2. Check from localhost: `curl -v http://127.0.0.1:<port>`
3. Check firewall rules: `nft list ruleset | grep <port>`
4. Check if port is in use by another process: `ss -tlnp sport = :<port>`
5. Check SELinux: `sestatus` and `semanage port -l | grep <port>`
6. Test from remote: `nc -zv <host> <port>`

### DNS Resolution Failure

1. Check /etc/resolv.conf: `cat /etc/resolv.conf`
2. Check systemd-resolved status: `resolvectl status`
3. Test specific DNS server: `dig @8.8.8.8 <domain>`
4. Check DNS port connectivity: `nc -zuv <dns-server> 53`
5. Flush DNS cache: `resolvectl flush-caches`
6. Check /etc/nsswitch.conf for resolution order
7. Check /etc/hosts for overrides

## Network Namespaces

```bash
# List network namespaces
ip netns list

# Execute a command in a namespace
ip netns exec <namespace> ip addr show

# Create a namespace
ip netns add <namespace>

# Move an interface into a namespace
ip link set dev <interface> netns <namespace>

# Connect namespaces with a veth pair
ip link add veth0 type veth peer name veth1
ip link set veth1 netns <namespace>
```

## Performance Tuning

```bash
# Show current TCP buffer sizes
sysctl net.ipv4.tcp_rmem
sysctl net.ipv4.tcp_wmem

# Show network interface ring buffer sizes
ethtool -g <interface>

# Show offload features
ethtool -k <interface>

# Enable TCP BBR congestion control
sysctl -w net.core.default_qdisc=fq
sysctl -w net.ipv4.tcp_congestion_control=bbr

# Check current congestion control algorithm
sysctl net.ipv4.tcp_congestion_control

# Show interface queue length
ip link show dev <interface> | grep qlen

# Enable jumbo frames (MTU 9000)
ip link set dev <interface> mtu 9000
```
