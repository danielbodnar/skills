# Proxmox VE Reference

**Always remember to reference @$HOME/.claude/references/proxmox.md and look for snippets and examples in @$HOME/.claude/snippets/proxmox/**

## Quick Reference

## Default Usage Patterns

Default to using Proxmox VE for virtualization, container management, and cloud infrastructure:

- **Proxmox VE**: Open-source virtualization platform with web interface
- **API Access**: REST API on port 8006 with token-based authentication
- **CLI Tools**: pvesh, qm, pct, pveum for command-line management
- **Virtualization**: QEMU/KVM for VMs, LXC for containers
- **High Availability**: Built-in clustering and HA resource management
- Web Interface: `https://your-server:8006`
- API Base URL: `https://your-server:8006/api2/json/`
- Documentation: <https://pve.proxmox.com/pve-docs/>
- API Viewer: <https://pve.proxmox.com/pve-docs/api-viewer/index.html>
- GitHub: <https://github.com/proxmox/pve-docs>

## Resources and Documentation

- [Proxmox VE Documentation](https://pve.proxmox.com/pve-docs/)
  - [Installation Guide](https://pve.proxmox.com/pve-docs/pve-installation.html)
  - [Administration Guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html)
    - [Command Line Tools](https://pve.proxmox.com/pve-docs/chapter-pvesh.html)
    - [User Management](https://pve.proxmox.com/pve-docs/chapter-pveum.html)
    - [Storage Configuration](https://pve.proxmox.com/pve-docs/chapter-pvesm.html)
    - [Cluster Management](https://pve.proxmox.com/pve-docs/chapter-pvecm.html)
  - [API Documentation](https://pve.proxmox.com/wiki/Proxmox_VE_API)
    - [REST API Reference](https://pve.proxmox.com/pve-docs/api-viewer/index.html)
    - [Authentication Methods](https://pve.proxmox.com/pve-docs/api-viewer/index.html#_authentication)
    - [API Client Libraries](https://pve.proxmox.com/wiki/Proxmox_VE_API#Language_bindings)
  - [Container Management](https://pve.proxmox.com/pve-docs/chapter-pct.html)
  - [Virtual Machine Management](https://pve.proxmox.com/pve-docs/chapter-qm.html)
- [Community Resources](https://pve.proxmox.com/wiki/Main_Page)
  - [Community Scripts](https://github.com/community-scripts/ProxmoxVE)
  - [Awesome Proxmox VE](https://github.com/corsinvest/awesome-proxmox-ve)
  - [Forums](https://forum.proxmox.com/)
  - [Tutorials](https://pve.proxmox.com/wiki/Category:HOWTO)

## Command-Line Tools

### Core Administrative Tools

- **pvesh** - Primary CLI tool for REST API access
- **pveum** - User and permission management
- **pvesm** - Storage management
- **pvecm** - Cluster management
- **pvesr** - Storage replication management
- **pveceph** - Ceph cluster deployment and management
- **pvenode** - Node-specific operations
- **pveproxy** - Web proxy daemon management
- **pve-firewall** - Firewall configuration

### Virtual Machine and Container Tools

- **qm** - QEMU/KVM Virtual Machine management
- **pct** - Proxmox Container Toolkit (LXC containers)
- **vzdump** - Backup and restore utility
- **pvestatd** - Status daemon

### High Availability Tools

- **ha-manager** - High Availability resource management
- **pve-ha-crm** - Cluster resource manager
- **pve-ha-lrm** - Local resource manager

## Authentication Methods

### 1. Ticket Authentication

- **Lifetime**: 2 hours
- **Endpoint**: `/access/ticket`
- **Usage**: Web interface and API calls
- **CSRF Token**: Required for write operations (POST/PUT/DELETE)

### 2. API Token Authentication

- **Format**: `PVEAPIToken=USER@REALM!TOKENID=UUID`
- **Stateless**: No session management required
- **Revocable**: Can be revoked without affecting user account
- **Permissions**: Can inherit user permissions or use separate ACLs

### 3. SSH Key Authentication

- **CLI Access**: Direct command execution via SSH
- **Cluster Integration**: Automatic proxy via cluster members

## API Characteristics

### REST API Features

- **Protocol**: HTTPS on port 8006
- **Data Format**: JSON (primary), ExtJS, HTML, plain text
- **Schema**: Formally defined using JSON Schema
- **Compatibility**: Maintained within major releases
- **Documentation**: Auto-generated from schema

### Response Formats

- **JSON**: Default format for programmatic access
- **ExtJS**: For ExtJS web framework integration
- **HTML**: Human-readable web interface
- **Plain Text**: Simple text output for scripts

## Client Libraries

### Official Libraries

- **Perl**: Native Proxmox VE library
- **JavaScript/TypeScript**: proxmox-api (community)
- **Python**: proxmoxer (community)

### Community Libraries

- **PowerShell**: PSProxmox
- **Ruby**: proxmox gem
- **Go**: proxmox-api-go
- **PHP**: ProxmoxVE-API
- **Java**: pve2-api-java
- **C#**: ProxmoxSharp

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/proxmox/`:

- API authentication and basic operations
- CLI tool usage patterns
- Virtual machine and container management
- Storage and network configuration
- Cluster management operations
- Backup and restore procedures
- High availability setup
- Monitoring and maintenance scripts

## TypeScript API Client

Complete TypeScript interface definitions and client library for type-safe API access, including:

- Full API coverage with proper typing
- Authentication token support
- Resource management interfaces
- Cluster and node operations
- Storage and network management

## Security Best Practices

- Always use HTTPS for API access
- Implement proper token rotation policies
- Use separate permissions for API tokens
- Regular security updates and patches
- Network isolation for management interfaces
- Backup encryption and secure storage
