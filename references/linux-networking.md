# Linux Networking Reference

**Always remember to reference @$HOME/.claude/references/linux-networking.md and look for snippets and examples in @$HOME/.claude/snippets/linux-networking/**

## Quick Reference

- Primary tool: `ip` command for interface and routing management
- Network namespaces: `ip netns` for network isolation
- WireGuard: Modern VPN with kernel integration
- Open vSwitch: Software-defined networking
- FRRouting: Comprehensive routing protocol suite

## Default Usage Patterns

Default to using `ip` command for network interface and routing management instead of deprecated tools like `ifconfig` and `route`:

- Use `ip link` for interface management instead of `ifconfig`
- Use `ip addr` for address configuration instead of `ifconfig`
- Use `ip route` for routing instead of `route`
- Use `ip netns` for network namespace management
- Use `systemd-networkd` for persistent network configuration
- Use WireGuard for modern VPN instead of OpenVPN or IPsec when possible
- Use FRRouting for dynamic routing protocols

### Virtual Network Interfaces

- `ip link add veth0 type veth peer name veth1` for VETH pairs. Don't use legacy bridge-utils.
- `ip link add macvlan0 link eth0 type macvlan mode bridge` for MACVLAN interfaces
- `ip link add ipvlan0 link eth0 type ipvlan mode l2` for IPVLAN interfaces
- `ip link add vxlan0 type vxlan id 100 local <IP> remote <IP>` for VXLAN overlays
- `ip link add br0 type bridge` for bridge interfaces. Don't use `brctl`.
- `ip link add bond0 type bond mode 802.3ad` for bonding. Don't use `ifenslave`.

### Tunneling Protocols

- `ip tunnel add gre0 mode gre remote <IP> local <IP>` for GRE tunnels
- `ip tunnel add ipip0 mode ipip remote <IP> local <IP>` for IPIP tunnels
- `ip tunnel add sit0 mode sit remote <IP> local <IP>` for IPv6-over-IPv4 tunnels
- WireGuard for modern VPN tunneling with `wg` command
- Built-in VXLAN support for overlay networking

### Network Namespaces

- `ip netns add <name>` to create network namespaces
- `ip netns exec <name> <command>` to execute commands in namespace
- `ip link set <interface> netns <name>` to move interfaces to namespace
- Network isolation for containers, VPNs, and testing

## Resources and Documentation

- [Linux Kernel Networking Documentation](https://www.kernel.org/doc/html/latest/networking/)
  - [Network Device Drivers](https://www.kernel.org/doc/html/latest/networking/netdevices.html)
  - [Network Namespaces](https://www.kernel.org/doc/html/latest/networking/netns.html)
  - [Tunneling Protocols](https://www.kernel.org/doc/html/latest/networking/tunnels.html)
- [ip Command Manual](https://man7.org/linux/man-pages/man8/ip.8.html)
  - [ip-netns Manual](https://man7.org/linux/man-pages/man8/ip-netns.8.html)
  - [ip-link Manual](https://man7.org/linux/man-pages/man8/ip-link.8.html)
  - [ip-route Manual](https://man7.org/linux/man-pages/man8/ip-route.8.html)
- [Red Hat Virtual Networking Guide](https://developers.redhat.com/blog/2018/10/22/introduction-to-linux-interfaces-for-virtual-networking)
  - [Tunneling Interfaces](https://developers.redhat.com/blog/2019/05/17/an-introduction-to-linux-virtual-interfaces-tunnels)
- [WireGuard Documentation](https://www.wireguard.com/)
  - [ArchWiki WireGuard Guide](https://wiki.archlinux.org/title/WireGuard)
- [FRRouting Documentation](http://docs.frrouting.org/en/latest/)
  - [BGP Configuration](http://docs.frrouting.org/en/latest/bgp.html)
  - [OSPF Configuration](http://docs.frrouting.org/en/latest/ospf.html)
  - [EVPN Configuration](http://docs.frrouting.org/en/latest/evpn.html)
- [VyOS Documentation](https://docs.vyos.io/en/latest/)
  - [BGP Protocol](https://docs.vyos.io/en/latest/configuration/protocols/bgp.html)
  - [VXLAN Interfaces](https://docs.vyos.io/en/latest/configuration/interfaces/vxlan.html)
- [Open vSwitch Documentation](https://www.openvswitch.org/)
  - [Configuration Database](https://man7.org/linux/man-pages/man5/ovs-vswitchd.conf.db.5.html)
  - [ovs-vsctl Manual](https://man7.org/linux/man-pages/man8/ovs-vsctl.8.html)

## Network Interface Types

### Virtual Ethernet (VETH) Pairs

- Local Ethernet tunnel created in pairs
- Primary use: Communication between network namespaces
- Configuration: Always created as a pair with peer names
- Use cases: Container networking, namespace isolation

### MACVLAN Interfaces

- Multiple interfaces with different MAC addresses on single physical interface
- Modes: Private, VEPA, Bridge, Passthru, Source
- Bridge mode: Most common for container networking
- Use cases: Direct container-to-network communication, VM networking

### MACVTAP Interfaces

- MACVLAN with built-in TAP device functionality
- Direct access to virtual machine networking
- Combines MACVLAN and TAP device features
- Use cases: High-performance VM networking

### IPVLAN Interfaces

- Similar to MACVLAN but shares MAC address
- Modes: L2 (switch-like), L3 (router-like)
- Use cases: Networks with MAC address restrictions
- Better for environments limiting multiple MACs per port

### IPVTAP Interfaces

- IPVLAN with built-in TAP device functionality
- L2 and L3 mode support
- Use cases: VM networking with MAC address sharing

### VXLAN Interfaces

- Network virtualization technology for overlay networks
- 24-bit VNI (Virtual Network Identifier) space
- UDP encapsulation (default port 4789, Linux uses 8472)
- Use cases: Data center networking, cloud networking, multi-tenant environments

### Bridge Interfaces

- Software implementation of network switch
- Forwards packets between connected interfaces
- STP (Spanning Tree Protocol) support
- Use cases: VM/container communication, network aggregation

### Bonding Interfaces

- Link aggregation for multiple network interfaces
- Modes: round-robin, active-backup, XOR, broadcast, LACP, balance-tlb, balance-alb
- Provides: Increased bandwidth, redundancy
- Use cases: High availability, load balancing

### Team Interfaces

- Alternative to bonding with different implementation
- Features: LACP support, JSON-based configuration
- User-space teamd daemon
- Use cases: Modern replacement for bonding

### VCAN Interfaces

- Virtual Controller Area Network interfaces
- For CAN bus protocol simulation
- Use cases: Automotive networking, embedded systems testing

### VXCAN Interfaces

- Virtual CAN cross-connect interfaces
- Created in pairs like VETH
- Use cases: CAN protocol testing, namespace isolation

### IFB (Intermediate Functional Block)

- Traffic shaping and QoS enforcement
- Works with tc (traffic control)
- Use cases: Traffic shaping, bandwidth management

### MACsec Interfaces

- 802.1AE MAC-level encryption
- Point-to-point or point-to-multipoint encryption
- Use cases: LAN security, encrypted Ethernet

## Tunneling Protocols

### IPIP Tunnels

- Simple IP-over-IP encapsulation
- IPv4 unicast traffic only
- Lowest overhead tunneling method
- Use cases: Basic site-to-site connectivity

### SIT (Simple Internet Transition) Tunnels

- IPv6-over-IPv4 tunneling
- Modes: ipip, ip6ip, mplsip, any
- Use cases: IPv6 transition, isolated IPv6 networks

### GRE (Generic Routing Encapsulation)

- Multi-protocol encapsulation
- Supports multicast and IPv6
- Optional key and checksum
- Use cases: Multi-protocol tunneling, routing protocols over tunnels

### VXLAN (Virtual eXtensible LAN)

- Layer 2 over Layer 3 tunneling
- 16 million logical networks (24-bit VNI)
- Multicast or unicast underlay
- Use cases: Data center virtualization, overlay networks

### GENEVE (Generic Network Virtualization Encapsulation)

- Flexible header design
- Successor to VXLAN and NVGRE
- Extensible option headers
- Use cases: Next-generation overlay networking

### FOU (Foo-Over-UDP) Tunnels

- Generic UDP encapsulation
- Encapsulates various protocols in UDP
- Use cases: Firewall traversal, load balancing

### GUE (Generic UDP Encapsulation)

- Extension of FOU with additional header
- Protocol identification and flags
- Use cases: Advanced UDP encapsulation

## VPN Technologies

### WireGuard

- Modern, kernel-integrated VPN
- Public/private key cryptography
- UDP-based with NAT traversal
- Features: Simple configuration, high performance, formal verification
- Use cases: Site-to-site VPN, road warrior VPN, secure networking

### IPsec

- Standards-based VPN suite
- ESP (Encapsulating Security Payload) and AH (Authentication Header)
- IKE (Internet Key Exchange) for key management
- Use cases: Enterprise VPN, government networks

### L2TP (Layer 2 Tunneling Protocol)

- Often combined with IPsec for security
- Layer 2 tunneling over IP networks
- Use cases: Remote access VPN, PPP over IP

### L3VPN (Layer 3 VPN)

- MPLS-based VPN technology
- BGP/MPLS VPN implementation
- Use cases: Service provider networks, enterprise WAN

## Routing Protocols

### BGP (Border Gateway Protocol)

- Exterior gateway protocol for Internet routing
- Path vector protocol with policy support
- Features: Route filtering, communities, AS-path manipulation
- Use cases: Internet routing, multi-homed networks, data center interconnect

### OSPF (Open Shortest Path First)

- Link-state interior gateway protocol
- Hierarchical design with areas
- Features: Fast convergence, load balancing, authentication
- Use cases: Enterprise networks, data center routing

### VRRP (Virtual Router Redundancy Protocol)

- First-hop redundancy protocol
- Virtual IP and MAC addresses
- Master/backup election
- Use cases: Default gateway redundancy, high availability

### L2VPN/EVPN (Ethernet VPN)

- BGP-based Layer 2 VPN technology
- MAC learning over BGP
- Features: Multi-tenancy, mobility, redundancy
- Use cases: Data center interconnect, service provider L2 services

### IS-IS (Intermediate System to Intermediate System)

- Link-state routing protocol
- Originally for OSI, adapted for IP
- Use cases: Service provider networks, large enterprises

### RIP (Routing Information Protocol)

- Distance vector protocol
- Simple configuration, limited scalability
- Use cases: Small networks, legacy environments

## Network Namespaces

### Fundamentals

- Logical copy of network stack
- Separate routes, firewall rules, devices
- Process inheritance from parent
- Isolation and security

### Management Commands

- Create: `ip netns add NAME`
- List: `ip netns list`
- Execute: `ip netns exec NAMESPACE command`
- Delete: `ip netns del NAMESPACE`
- Monitor: `ip netns monitor`

### Configuration

- Storage: `/var/run/netns/NAME`
- Config files: `/etc/netns/NAME/`
- File descriptor persistence

### Use Cases

- Container networking
- VPN isolation
- Network testing
- Security segmentation
- Multi-tenant environments

## Advanced Networking

### Open vSwitch (OVS)

- Software-defined networking switch
- OpenFlow support
- Features: VXLAN tunneling, QoS, monitoring
- Use cases: Cloud networking, NFV, SDN

### SR-IOV (Single Root I/O Virtualization)

- Hardware-based network virtualization
- Direct hardware access for VMs
- Features: High performance, low latency
- Use cases: High-performance computing, NFV

### Traffic Control (tc)

- Quality of Service (QoS) framework
- Features: Traffic shaping, scheduling, filtering
- Queueing disciplines: HTB, CBQ, PRIO, SFQ
- Use cases: Bandwidth management, traffic prioritization

### Network Function Virtualization (NFV)

- Virtualized network services
- Components: VNF, NFVI, MANO
- Use cases: Virtual firewalls, load balancers, routers

### Software-Defined Networking (SDN)

- Centralized network control
- Separation of control and data planes
- Protocols: OpenFlow, NETCONF, OVSDB
- Use cases: Data center networking, campus networks

## Performance and Scaling

### Receive Side Scaling (RSS)

- Multi-queue packet distribution
- Hardware-based load balancing
- CPU affinity for network interrupts

### Receive Packet Steering (RPS)

- Software-based packet distribution
- Extends RSS to single-queue adapters
- CPU load balancing

### Receive Flow Steering (RFS)

- Application-aware packet steering
- Delivers packets to application CPU
- Improves cache locality

### XDP (eXpress Data Path)

- High-performance packet processing
- eBPF programs in kernel
- Use cases: DDoS mitigation, load balancing

### DPDK (Data Plane Development Kit)

- User-space packet processing
- Bypass kernel networking stack
- Use cases: High-frequency trading, NFV

## Security Features

### Network Namespaces Security

- Process isolation
- Privilege separation
- Container security

### MACsec (802.1AE)

- Ethernet-level encryption
- Point-to-point security
- Hardware acceleration support

### IPsec

- Network layer security
- Encryption and authentication
- Tunnel and transport modes

### Firewall Integration

- iptables/netfilter framework
- Connection tracking
- Network address translation

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/linux-networking/`:

- Basic interface configuration
- Advanced tunneling setups
- VPN configurations
- Routing protocol setup
- Network namespace examples
- Performance tuning
- Security configurations

## Schema and Type Definitions

Network configuration schemas in `$HOME/.claude/snippets/linux-networking/schemas/`

## Configuration Management

Configuration examples in `$HOME/.claude/snippets/linux-networking/configs/`
