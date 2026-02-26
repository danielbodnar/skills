# Talos Linux Code Examples and Snippets

This directory contains comprehensive examples and code snippets for working with Talos Linux, the secure, immutable, minimal Linux distribution designed specifically for Kubernetes.

## Directory Structure

### `/installation/`

- **`basic-setup.sh`** - Basic Talos installation and setup script
- **`docker-cluster.sh`** - Create local Docker-based Talos cluster

### `/configuration/`

- **`machine-config.yaml`** - Complete machine configuration example
- **`config-patches.yaml`** - Various configuration patches for different scenarios

### `/cluster/`

- **`bootstrap.sh`** - Production cluster bootstrap script
- **`management.sh`** - Comprehensive cluster management utilities

### `/monitoring/`

- **`dashboard-setup.sh`** - Setup monitoring with Prometheus and Grafana

### `/security/`

- **`rbac-policies.yaml`** - RBAC and security policy examples

### `/troubleshooting/`

- **`debug-tools.sh`** - Comprehensive debugging and troubleshooting tools

### `/advanced/`

- **`terraform-deployment.tf`** - Terraform deployment for AWS

### `/integrations/`

- **`cilium-deployment.yaml`** - Cilium CNI integration with Talos

## Quick Start

1. **Install talosctl:**

   ```bash
   brew install siderolabs/tap/talosctl
   ```

2. **Create local cluster:**

   ```bash
   chmod +x installation/docker-cluster.sh
   ./installation/docker-cluster.sh
   ```

3. **Manage cluster:**

   ```bash
   chmod +x cluster/management.sh
   ./cluster/management.sh health
   ```

## Common Workflows

### Development Environment

```bash
# Quick local cluster
talosctl cluster create

# Check status
talosctl health
talosctl dashboard
```

### Production Deployment

```bash
# Generate configuration
talosctl gen config production-cluster https://api.cluster.local:6443

# Apply patches
talosctl gen config production-cluster https://api.cluster.local:6443 \
  --config-patch @configuration/config-patches.yaml

# Bootstrap cluster
./cluster/bootstrap.sh
```

### Monitoring Setup

```bash
# Install monitoring stack
./monitoring/dashboard-setup.sh

# Access dashboards
./monitor-portforward.sh
```

### Troubleshooting

```bash
# Run debug collection
./troubleshooting/debug-tools.sh

# Check common issues
./troubleshooting/debug-tools.sh issues

# Generate support bundle
./troubleshooting/debug-tools.sh support
```

## Key Features Demonstrated

- **Immutable Infrastructure**: Configuration-driven OS management
- **API-Only Management**: No SSH access, all operations via gRPC API
- **Security**: mTLS, RBAC, minimal attack surface
- **Cloud Native**: Kubernetes-focused design
- **Multi-Platform**: Bare metal, cloud, virtualization support

## Integration Examples

- **CNI**: Cilium, Calico, Flannel
- **Monitoring**: Prometheus, Grafana
- **Infrastructure**: Terraform, Ansible
- **CI/CD**: GitOps integration
- **Storage**: CSI drivers
- **Networking**: Load balancers, ingress controllers

## Best Practices

1. **Configuration Management**: Use version control for machine configs
2. **Patch Management**: Apply patches systematically
3. **Security**: Enable RBAC and follow security guidelines
4. **Monitoring**: Implement comprehensive observability
5. **Backup**: Regular etcd backups and disaster recovery plans
6. **Updates**: Plan and test upgrades thoroughly

## Resources

- [Talos Documentation](https://www.talos.dev/docs/)
- [Complete Reference](../references/talos-linux.md)
- [CLAUDE.md Configuration](../../CLAUDE.md#talos-linux)

## Contributing

When adding new examples:

1. Follow the existing directory structure
2. Include comprehensive comments
3. Test all scripts before committing
4. Update this README with new examples
5. Follow security best practices

## Support

For issues and questions:

- [Talos GitHub Issues](https://github.com/siderolabs/talos/issues)
- [Talos Slack Community](https://slack.cncf.io/) - #talos channel
- [GitHub Discussions](https://github.com/siderolabs/talos/discussions)
