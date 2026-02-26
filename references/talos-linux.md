# Talos Linux Reference

**Always remember to reference $HOME/.claude/references/talos-linux.md and look for snippets and examples in $HOME/.claude/snippets/talos-linux/**

## Quick Reference

- Installation: `brew install siderolabs/tap/talosctl`
- Generate config: `talosctl gen config my-cluster https://endpoint:6443`
- Documentation: <https://www.talos.dev/docs/>
- GitHub: <https://github.com/siderolabs/talos>
- Sidero Labs: <https://www.siderolabs.com/>

Default to using Talos Linux for immutable Kubernetes operating system deployments.

- **Talos Linux**: Secure, immutable, minimal Linux distribution designed specifically for Kubernetes
- **API-Driven**: All system management done exclusively via API (no SSH/console access)
- **Immutable Infrastructure**: Read-only root filesystem with atomic updates
- **Minimal Attack Surface**: Contains only essential binaries for running Kubernetes
- **Production Ready**: Used in large-scale Kubernetes deployments with hardened security

## Resources and Documentation

- [Talos Linux Documentation](https://www.talos.dev/docs/)
  - [Getting Started](https://www.talos.dev/docs/latest/introduction/getting-started/)
  - [Quick Start](https://www.talos.dev/docs/latest/introduction/quickstart/)
  - [Production Notes](https://www.talos.dev/docs/latest/introduction/prodnotes/)
  - [What's New](https://www.talos.dev/docs/latest/introduction/what-is-new/)
  - [System Requirements](https://www.talos.dev/docs/latest/introduction/system-requirements/)
- [Talos Guides](https://www.talos.dev/docs/latest/talos-guides/)
  - [Installation Guides](https://www.talos.dev/docs/latest/talos-guides/install/)
    - [Bare Metal Platforms](https://www.talos.dev/docs/latest/talos-guides/install/bare-metal-platforms/)
    - [Cloud Platforms](https://www.talos.dev/docs/latest/talos-guides/install/cloud-platforms/)
    - [Virtualized Platforms](https://www.talos.dev/docs/latest/talos-guides/install/virtualized-platforms/)
    - [Local Platforms](https://www.talos.dev/docs/latest/talos-guides/install/local-platforms/)
    - [Single Board Computers](https://www.talos.dev/docs/latest/talos-guides/install/single-board-computers/)
  - [Configuration](https://www.talos.dev/docs/latest/talos-guides/configuration/)
    - [System Configuration](https://www.talos.dev/docs/latest/talos-guides/configuration/system-configuration/)
    - [Network Configuration](https://www.talos.dev/docs/latest/talos-guides/configuration/network-configuration/)
    - [Storage Configuration](https://www.talos.dev/docs/latest/talos-guides/configuration/storage-configuration/)
    - [Logging](https://www.talos.dev/docs/latest/talos-guides/configuration/logging/)
    - [Disk Management](https://www.talos.dev/docs/latest/talos-guides/configuration/disk-management/)
  - [Network](https://www.talos.dev/docs/latest/talos-guides/network/)
    - [KubeSpan](https://www.talos.dev/docs/latest/talos-guides/network/kubespan/)
    - [Deploying Cilium](https://www.talos.dev/docs/latest/kubernetes-guides/network/deploying-cilium/)
  - [How To Guides](https://www.talos.dev/docs/latest/talos-guides/howto/)
    - [Certificate Management](https://www.talos.dev/docs/latest/talos-guides/howto/cert-management/)
    - [Backup and Restore](https://www.talos.dev/docs/latest/talos-guides/howto/backup-and-restore/)
- [Kubernetes Guides](https://www.talos.dev/docs/latest/kubernetes-guides/)
  - [Upgrading Kubernetes](https://www.talos.dev/docs/latest/kubernetes-guides/upgrading-kubernetes/)
  - [Configuration](https://www.talos.dev/docs/latest/kubernetes-guides/configuration/)
    - [Deploying Metrics Server](https://www.talos.dev/docs/latest/kubernetes-guides/configuration/deploy-metrics-server/)
    - [Pod Security Standards](https://www.talos.dev/docs/latest/kubernetes-guides/configuration/pod-security-standards/)
    - [Role-Based Access Control](https://www.talos.dev/docs/latest/kubernetes-guides/configuration/role-based-access-control/)
- [Reference Documentation](https://www.talos.dev/docs/latest/reference/)
  - [API](https://www.talos.dev/docs/latest/reference/api/)
  - [CLI](https://www.talos.dev/docs/latest/reference/cli/)
  - [Configuration](https://www.talos.dev/docs/latest/reference/configuration/)
    - [v1alpha1 Config](https://www.talos.dev/docs/latest/reference/configuration/v1alpha1/config/)
  - [Kernel Parameters](https://www.talos.dev/docs/latest/reference/kernel/)
- [Advanced Topics](https://www.talos.dev/docs/latest/advanced/)
  - [Air-gapped Environments](https://www.talos.dev/docs/latest/advanced/air-gapped/)
  - [Advanced Networking](https://www.talos.dev/docs/latest/advanced/advanced-networking/)
  - [Disk Encryption](https://www.talos.dev/docs/latest/advanced/disk-encryption/)
  - [Machine Configuration Apply](https://www.talos.dev/docs/latest/advanced/machine-configuration-apply/)
  - [Metal Network Configuration](https://www.talos.dev/docs/latest/advanced/metal-network-configuration/)
  - [Talos API Access from Kubernetes](https://www.talos.dev/docs/latest/advanced/talos-api-access-from-k8s/)
  - [Static Pods](https://www.talos.dev/docs/latest/advanced/static-pods/)
  - [Developing Talos](https://www.talos.dev/docs/latest/advanced/developing-talos/)
- [Learn More](https://www.talos.dev/docs/latest/learn-more/)
  - [Architecture](https://www.talos.dev/docs/latest/learn-more/architecture/)
  - [Controllers and Resources](https://www.talos.dev/docs/latest/learn-more/controllers-resources/)
  - [Philosophy](https://www.talos.dev/docs/latest/learn-more/philosophy/)
  - [Concepts](https://www.talos.dev/docs/latest/learn-more/concepts/)
- [Community Resources](https://github.com/siderolabs/talos)
  - [GitHub Discussions](https://github.com/siderolabs/talos/discussions)
  - [Slack Community](https://slack.cncf.io/) - #talos channel
  - [Community Calls](https://github.com/siderolabs/talos/discussions/categories/community-calls)

## Core Components and Architecture

### System Architecture

- **API-Only Management**: No SSH/shell access, all operations via gRPC API
- **Immutable OS**: Read-only root filesystem with atomic updates
- **Minimal Base**: Contains only essential binaries for Kubernetes
- **Secure by Design**: mTLS authentication, reduced attack surface
- **Multi-Platform**: Supports bare metal, cloud, virtualization, edge devices

### Key Services

- **apid**: Main API service for cluster management
- **trustd**: Certificate authority and PKI management
- **machined**: Machine/node lifecycle management
- **timed**: Time synchronization service
- **networkd**: Network configuration and management
- **udevd**: Device management service

## Key Features

**Security and Hardening**

- Mutual TLS (mTLS) authentication for all API access
- Built with Kernel Self Protection Project recommendations
- Applies CIS benchmark guidelines by default
- Reduced attack surface with minimal OS components
- No shell access or SSH - API-only management

**Immutable Infrastructure**

- Read-only root filesystem prevents configuration drift
- Atomic system updates with rollback capability
- Declarative configuration management
- Predictable system state across all nodes

## Installation and Setup

**Install talosctl CLI**

```bash
# macOS/Linux via Homebrew
brew install siderolabs/tap/talosctl

# Direct download
curl -Lo /usr/local/bin/talosctl https://github.com/siderolabs/talos/releases/latest/download/talosctl-$(uname -s | tr "[:upper:]" "[:lower:]")-amd64
chmod +x /usr/local/bin/talosctl
```

**Generate Cluster Configuration**

```bash
# Generate configuration files
talosctl gen config my-cluster https://192.168.1.100:6443

# Files created: controlplane.yaml, worker.yaml, talosconfig
```

**Quick Local Cluster**

```bash
# Create Docker-based cluster
talosctl cluster create

# View cluster status
talosctl cluster show
talosctl config info
```

## Installation Methods

### Local Development

```bash
# Docker-based cluster (quickest)
talosctl cluster create

# QEMU-based cluster  
talosctl cluster create --provisioner qemu

# VirtualBox
talosctl cluster create --provisioner virtualbox
```

### Cloud Platforms

- **AWS**: EC2 instances with Talos AMI
- **GCP**: Compute Engine with Talos images
- **Azure**: Virtual machines with Talos VHD
- **DigitalOcean**: Droplets with custom images
- **Vultr**: Instances with Talos ISO
- **Hetzner**: Cloud servers with Talos
- **Oracle Cloud**: Compute instances
- **Equinix Metal**: Bare metal servers
- **Akamai Linode**: Virtual machines

### Bare Metal Platforms

- **PXE Boot**: Network-based installation
- **ISO**: Bootable media installation
- **USB**: Bootable USB drives
- **Matchbox**: Automated bare metal provisioning
- **Digital Rebar**: Bare metal automation
- **Ironic**: OpenStack bare metal service

### Virtualization Platforms

- **VMware vSphere**: VM deployment
- **Proxmox VE**: Container and VM platform
- **Hyper-V**: Windows virtualization
- **KVM/QEMU**: Linux virtualization
- **Vagrant**: Development environments

### Single Board Computers

- **Raspberry Pi 4**: ARM64 support
- **Jetson Nano**: NVIDIA edge computing
- **Pine64**: ARM development boards
- **Rock Pi**: ARM single board computers

## Cluster Management

**Bootstrap and Configure**

```bash
# Configure talosctl
talosctl config endpoint 192.168.1.100
talosctl config node 192.168.1.100

# Bootstrap etcd cluster (run only once)
talosctl bootstrap

# Get kubeconfig
talosctl kubeconfig .
```

**Node Operations**

```bash
# Check cluster health
talosctl health
talosctl dashboard

# View cluster members
talosctl get members

# Service management
talosctl service
talosctl service kubelet status
```

**Configuration Management**

```bash
# Apply configuration changes
talosctl apply-config --file controlplane.yaml

# Edit resources directly
talosctl edit machineconfig

# Patch configuration
talosctl patch mc --mode=no-reboot -p '[{"op": "replace", "path": "/cluster/network/cni/name", "value": "cilium"}]'
```

## Configuration Management

### Machine Configuration Structure

```yaml
version: v1alpha1
machine:
  type: controlplane|worker|init
  token: <node-token>
  ca:
    crt: <base64-encoded-certificate>
    key: <base64-encoded-key>
  certSANs: []
  kubelet: {}
  network: {}
  disks: []
  install: {}
  files: []
  env: {}
  time: {}
  sysctls: {}
  features: {}

cluster:
  id: <cluster-id>
  secret: <cluster-secret>
  controlPlane:
    endpoint: https://cluster.local:6443
  clusterName: <cluster-name>
  network: {}
  token: <cluster-token>
  secretboxEncryptionSecret: <encryption-secret>
  ca:
    crt: <base64-encoded-certificate>
    key: <base64-encoded-key>
  aggregatorCA: {}
  serviceAccount: {}
  apiServer: {}
  controllerManager: {}
  proxy: {}
  scheduler: {}
  discovery: {}
  etcd: {}
  coreDNS: {}
  externalCloudProvider: {}
  adminKubeconfig: {}
  allowSchedulingOnControlPlanes: false
  inlineManifests: []
  extraManifests: []
```

### Configuration Patching

```bash
# JSON Patch format
talosctl patch mc -p '[
  {"op": "replace", "path": "/cluster/network/cni/name", "value": "cilium"},
  {"op": "add", "path": "/machine/kubelet/extraArgs", "value": {"max-pods": "500"}}
]'

# Strategic merge patch
talosctl patch mc --patch @patch.yaml

# Config patches during generation
talosctl gen config cluster-name https://endpoint:6443 \
  --config-patch @control-plane-patch.yaml \
  --config-patch-control-plane @cp-specific.yaml \
  --config-patch-worker @worker-specific.yaml
```

## Advanced Configuration

**Custom Installation**

```yaml
# talos-config.yaml
install:
  disk: /dev/sda
  image: ghcr.io/siderolabs/installer:latest
  bootloader: true
  wipe: false
  extraKernelArgs:
    - console=ttyS0
    - panic=10
```

**Extra Manifests**

```yaml
# Deploy additional resources during bootstrap
cluster:
  extraManifests:
    - https://raw.githubusercontent.com/kubernetes-sigs/metrics-server/v0.6.1/deploy/kubernetes/1.21+/metrics-server-deployment.yaml
  inlineManifests:
    - name: namespace-monitoring
      contents: |
        apiVersion: v1
        kind: Namespace
        metadata:
          name: monitoring
```

**CNI Configuration**

```yaml
# Custom CNI setup
cluster:
  network:
    cni:
      name: cilium
      urls:
        - https://docs.projectcalico.org/manifests/calico.yaml
```

## Monitoring and Troubleshooting

### talosctl Command Categories

- **Cluster Management**: bootstrap, health, dashboard, upgrade
- **Configuration**: apply-config, edit, patch, gen config
- **System Information**: get, list, logs, dmesg, version
- **Service Control**: service, restart, reboot, shutdown, reset
- **Debugging**: containers, processes, memory, disks, netstat
- **Security**: rotate-ca, inject serviceaccount
- **Development**: cluster create/destroy, support bundle

**System Information**

```bash
# View system resources
talosctl get nodes
talosctl get services
talosctl get pods -A

# Hardware information
talosctl disks
talosctl memory
talosctl processes
```

**Logs and Debugging**

```bash
# System logs
talosctl logs
talosctl dmesg

# Kubernetes container logs
talosctl logs -k kube-system/kube-apiserver
talosctl containers -k

# Network diagnostics
talosctl netstat
talosctl pcap
```

### Common Issues and Solutions

- **Bootstrap Failures**: etcd initialization problems
- **Network Connectivity**: CNI and networking issues
- **Certificate Problems**: PKI and mTLS issues
- **Resource Constraints**: Memory and disk space
- **Version Compatibility**: Kubernetes version mismatches

### Diagnostic Commands

```bash
# System health
talosctl health --server=false
talosctl health --control-plane-nodes 1.2.3.4,1.2.3.5 --worker-nodes 1.2.3.6,1.2.3.7

# Resource information
talosctl get members
talosctl get manifests
talosctl get services
talosctl get kubespanidentities

# Performance monitoring
talosctl dashboard
talosctl stats
talosctl memory
talosctl processes

# Log analysis
talosctl logs
talosctl dmesg
talosctl logs -k kube-system/kube-apiserver

# Network diagnostics
talosctl netstat
talosctl pcap --interface eth0
```

### Support Bundle Generation

```bash
# Collect comprehensive debug information
talosctl support
```

## Updates and Maintenance

**Upgrade Talos**

```bash
# Upgrade Talos OS
talosctl upgrade --image ghcr.io/siderolabs/installer:v1.6.0

# Upgrade Kubernetes
talosctl upgrade-k8s --to 1.29.0
```

**Reset and Recovery**

```bash
# Reset node (graceful)
talosctl reset --graceful

# Force reset with reboot
talosctl reset --reboot --graceful=false

# Rollback to previous version
talosctl rollback
```

## Security Features

### Authentication and Authorization

- **Mutual TLS**: All API communication encrypted and authenticated
- **Certificate Authority**: Built-in PKI management
- **RBAC**: Role-based access control for API operations
- **Service Accounts**: Kubernetes service account integration
- **Audit Logging**: Comprehensive audit trail

### Hardening Features

- **Immutable Root**: Read-only root filesystem
- **Minimal Attack Surface**: Only essential binaries included
- **Secure Boot**: UEFI Secure Boot support
- **TPM Integration**: Hardware security module support
- **Disk Encryption**: Full disk encryption capabilities
- **CIS Compliance**: Follows CIS Kubernetes benchmark

### Network Security

- **KubeSpan**: Encrypted mesh networking between nodes
- **Firewall Rules**: Built-in firewall configuration
- **Network Policies**: Kubernetes network policy enforcement
- **Pod Security Standards**: Built-in pod security controls

## Integration with Other Tools

### Kubernetes Ecosystem

- **CNI Plugins**: Calico, Cilium, Flannel support
- **Container Runtimes**: containerd built-in
- **Storage**: CSI driver support
- **Ingress**: NGINX, Traefik, Istio compatible
- **Monitoring**: Prometheus, Grafana integration
- **Logging**: Fluentd, Fluent Bit support

### Infrastructure Tools

- **Terraform**: Infrastructure as code provisioning
- **Ansible**: Configuration management automation
- **Sidero**: Bare metal cluster management
- **Cluster API**: Kubernetes-native cluster lifecycle
- **GitOps**: ArgoCD, Flux integration

### Cloud Native Tools

- **Helm**: Package management
- **Kustomize**: Configuration management
- **cert-manager**: Certificate automation
- **External Secrets**: Secret management
- **Velero**: Backup and restore

## Best Practices

### Production Deployment

- Use load balancers for control plane endpoints
- Implement proper backup and disaster recovery
- Monitor cluster health and resource usage
- Keep Talos and Kubernetes versions up to date
- Use configuration management for patches
- Implement proper RBAC and security policies

### Development Workflow

- Use local clusters for development and testing
- Version control machine configurations
- Test configuration changes in staging
- Automate cluster provisioning with Infrastructure as Code
- Implement CI/CD pipelines for cluster updates

### Security Recommendations

- Enable disk encryption for sensitive workloads
- Use external secret management systems
- Implement network segmentation and policies
- Regular security scanning and updates
- Audit access and configuration changes
- Use secure container registries

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/talos-linux/`:

- Installation: `$HOME/.claude/snippets/talos-linux/installation/`
- Configuration: `$HOME/.claude/snippets/talos-linux/configuration/`
- Cluster management: `$HOME/.claude/snippets/talos-linux/cluster/`
- Monitoring: `$HOME/.claude/snippets/talos-linux/monitoring/`
- Security: `$HOME/.claude/snippets/talos-linux/security/`
- Troubleshooting: `$HOME/.claude/snippets/talos-linux/troubleshooting/`

## See Also

- Complete reference: `$HOME/.claude/references/talos-linux.md`
- Code examples: `$HOME/.claude/snippets/talos-linux/`
- Installation: `$HOME/.claude/snippets/talos-linux/installation/`
- Configuration: `$HOME/.claude/snippets/talos-linux/configuration/`
- Cluster management: `$HOME/.claude/snippets/talos-linux/cluster/`
- Monitoring: `$HOME/.claude/snippets/talos-linux/monitoring/`
- Security: `$HOME/.claude/snippets/talos-linux/security/`
- Troubleshooting: `$HOME/.claude/snippets/talos-linux/troubleshooting/`
