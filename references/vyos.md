# VyOS Reference

**Always remember to reference @$HOME/.claude/references/vyos.md and look for snippets and examples in @$HOME/.claude/snippets/vyos/**

## Quick Reference

## Default Usage Patterns

Default to using VyOS for network routing, VPN, and network automation infrastructure:

- **VyOS**: Open-source network operating system based on Debian
- **CLI Configuration**: Hierarchical configuration with operational and configuration modes  
- **Network Automation**: Cloud-init, Ansible, and HTTPS API support
- **High Availability**: VRRP and configuration sync capabilities
- **Build System**: Docker-based build process for custom images
- Installation: Download ISO from <https://vyos.io/get> or build custom image
- CLI: `vyos` user, operational and configuration modes
- Documentation: <https://docs.vyos.io/en/latest/>
- GitHub: <https://github.com/vyos/vyos-build>
- Container Images: <https://hub.docker.com/u/vyos>

## Resources and Documentation

- [VyOS Documentation](https://docs.vyos.io/en/latest/)
  - [Installation Guide](https://docs.vyos.io/en/latest/installation/index.html)
  - [Quick Start Guide](https://docs.vyos.io/en/latest/quick-start.html)
  - [Configuration Guide](https://docs.vyos.io/en/latest/configuration/index.html)
    - [CLI Basics](https://docs.vyos.io/en/latest/cli.html)
    - [System Configuration](https://docs.vyos.io/en/latest/configuration/system/index.html)
    - [Interface Configuration](https://docs.vyos.io/en/latest/configuration/interfaces/index.html)
    - [Protocols](https://docs.vyos.io/en/latest/configuration/protocols/index.html)
  - [Configuration Examples](https://docs.vyos.io/en/latest/configexamples/index.html)
    - [Site-to-Site VPN](https://docs.vyos.io/en/latest/configexamples/site-2-site-vpn.html)
    - [L3VPN EVPN](https://docs.vyos.io/en/latest/configexamples/autotest/L3VPN_EVPN/L3VPN_EVPN.html)
    - [High Availability](https://docs.vyos.io/en/latest/configexamples/ha.html)
  - [Automation Guide](https://docs.vyos.io/en/latest/automation/index.html)
    - [Cloud-Init](https://docs.vyos.io/en/latest/automation/cloud-init.html)
    - [Ansible](https://docs.vyos.io/en/latest/automation/ansible.html)
    - [HTTPS API](https://docs.vyos.io/en/latest/automation/https-api.html)

- [Build Documentation](https://docs.vyos.io/en/latest/contributing/build-vyos.html)
  - [Docker Build Process](https://docs.vyos.io/en/latest/contributing/build-vyos.html#docker)
  - [Package Development](https://docs.vyos.io/en/latest/contributing/development.html)
  - [Testing](https://docs.vyos.io/en/latest/contributing/testing.html)

- [Community Resources](https://vyos.io/support)
  - [Forum](https://forum.vyos.io/)
  - [Slack Channel](https://vyos.slack.com/)
  - [Bug Reports](https://vyos.dev/)
  - [Phabricator](https://vyos.dev/)

## CLI Structure and Modes

### Operational Mode

- Default mode after login
- Commands for monitoring and troubleshooting
- No configuration changes allowed

### Configuration Mode

- Enter with `configure` command
- Hierarchical configuration structure
- Changes staged until `commit`

### Key CLI Commands

- `configure` - Enter configuration mode
- `commit` - Apply configuration changes
- `save` - Save configuration to startup config
- `show` - Display configuration or operational data
- `set` - Add/modify configuration
- `delete` - Remove configuration
- `edit` - Navigate to configuration node
- `exit` - Leave current mode/level

## Configuration Structure

- **container** - Container management
- **firewall** - Firewall rules and policies
- **high-availability** - VRRP and clustering
- **interfaces** - Network interface configuration
- **load-balancing** - Traffic distribution
- **nat** - Network Address Translation
- **policy** - Routing policies and access lists
- **pki** - Public Key Infrastructure
- **protocols** - Routing protocols (BGP, OSPF, etc.)
- **service** - System services (DHCP, DNS, etc.)
- **system** - System-wide settings
- **traffic-policy** - QoS and traffic shaping
- **vpn** - VPN configuration
- **vrf** - Virtual Routing and Forwarding

## Build Process

### Docker Build Environment

```bash
# Clone repository
git clone -b current --single-branch https://github.com/vyos/vyos-build

# Run build container
docker run --rm -it --privileged -v $(pwd):/vyos vyos/vyos-build:current bash

# Build ISO
sudo make clean
sudo ./build-vyos-image --architecture amd64 --build-by "user@example.com" generic
```

### Native Build Requirements

- Debian Bookworm (12)
- Build dependencies: python3-debian, python3-jinja2, squashfs-tools
- Git for source management
- Sufficient disk space (10GB+)

## Network Automation Patterns

### Cloud-Init Configuration

```yaml
#cloud-config
vyos_config_commands:
  - set system host-name 'vyos-router'
  - set interfaces ethernet eth0 address '192.168.1.1/24'
  - set service ssh port '22'
```

### Ansible Integration

- Uses `vyos.vyos` collection
- Supports declarative configuration
- Network module compatibility

### HTTPS API

- RESTful configuration interface
- JSON-based configuration
- Authentication via API keys

## API and Automation

### HTTPS API

- RESTful configuration interface (rolling release)
- JSON-based configuration operations
- API key authentication
- Operational command execution

### Terraform Integration

- Infrastructure as Code deployment
- Multi-cloud support (AWS, Azure, vSphere)
- VM provisioning and configuration
- Network infrastructure automation

### Ansible Automation

- `vyos.vyos` collection for network automation
- Declarative configuration management
- Inventory-based deployments
- Multi-router orchestration

### Command Scripting

- SSH-based automation scripts
- Bulk configuration operations
- Health monitoring and checks
- Backup and restore automation

## Virtualization Support

### Docker Deployment

- Container-based VyOS instances
- IPv6-enabled Docker networks
- Macvlan networking support
- Privileged container requirements

### Libvirt/KVM

- Virtual machine deployment
- Cloud-init configuration
- Console and VNC access
- VM lifecycle management

### Proxmox VE

- qcow2 and ISO installation methods
- VM templates and cloning
- Cloud-init integration
- Backup and monitoring

## Configuration Blueprints

### Advanced Networking

- **L3VPN EVPN**: VXLAN overlay with BGP EVPN
- **Site-to-Site VPN**: Azure integration with BGP
- **BGP Unnumbered**: IPv6 link-local addressing
- **OSPF ECMP**: Equal-cost multi-path routing
- **Segment Routing**: IS-IS with segment routing

### Security Configurations

- **Zone-based Firewall**: Multi-zone security policies
- **VPN Solutions**: WireGuard, OpenVPN, IPsec
- **NAT Policies**: Source/destination NAT rules
- **Access Control**: User authentication and authorization

### High Availability

- **VRRP Clustering**: Active/passive router pairs
- **Configuration Sync**: Automated config replication
- **Load Balancing**: WAN link aggregation
- **Health Monitoring**: Service availability checks

### Cloud Integration

- **AWS Deployment**: VPC routing and security groups
- **Azure Connectivity**: ExpressRoute and VPN Gateway
- **Multi-cloud Routing**: Cross-cloud connectivity
- **Automation Templates**: Infrastructure as Code

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/vyos/`:

- **basic/**: Initial router setup and configuration
- **routing/**: BGP, OSPF, and static routing
- **vpn/**: VPN technologies and configurations
- **security/**: Firewall and access control
- **automation/**: Cloud-init and scripting
- **monitoring/**: SNMP and logging setup
- **ha/**: High availability configurations
- **cloud/**: Cloud-specific deployments
- **api/**: HTTPS API client examples
- **terraform/**: Infrastructure as Code templates
- **ansible-advanced/**: Comprehensive playbooks
- **scripting/**: Command automation scripts
- **virtualization/**: VM deployment guides
- **blueprints/**: Advanced configuration examples

## Schema and API References

API documentation and configuration schemas:

- `$HOME/.claude/snippets/vyos/api/`: REST API examples
- Configuration validation patterns
- Automation script templates
- Integration examples
