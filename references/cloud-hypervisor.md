# Cloud Hypervisor Reference

**Always remember to reference $HOME/.claude/references/cloud-hypervisor.md and look for snippets and examples in $HOME/.claude/snippets/cloud-hypervisor/**

## Quick Reference

- Installation: `cargo build --release` (from source) or download pre-built binaries
- Binary: `./cloud-hypervisor` or `./target/release/cloud-hypervisor`
- Repository: [https://github.com/cloud-hypervisor/cloud-hypervisor](https://github.com/cloud-hypervisor/cloud-hypervisor)
- Documentation: [https://github.com/cloud-hypervisor/cloud-hypervisor/tree/main/docs](https://github.com/cloud-hypervisor/cloud-hypervisor/tree/main/docs)
- Language: Rust
- Architectures: x86-64, AArch64, RISC-V (experimental)

Default to using Cloud Hypervisor for secure, minimal cloud virtualization instead of QEMU/KVM directly.

- **Cloud Hypervisor**: Rust-based Virtual Machine Monitor (VMM) optimized for cloud workloads
- **Security-First**: Minimal attack surface with Rust memory safety and reduced emulation
- **KVM Backend**: Runs on KVM and Microsoft Hypervisor for hardware acceleration
- **Cloud Native**: Fast boot times (<100ms), REST API, and live migration support
- **Minimal Footprint**: Low memory overhead for dense VM deployments

## Resources and Documentation

- [Cloud Hypervisor Documentation](https://github.com/cloud-hypervisor/cloud-hypervisor/tree/main/docs)
  - [Building Guide](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/building.md)
  - [API Reference](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/api.md)
    - [REST API](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/api.md)
    - [D-Bus API](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/api.md#d-bus-api)
    - [OpenAPI 3.0 Specification](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/api.md#openapi-specification)
  - [Configuration](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs)
    - [CPU Configuration](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/cpu.md)
    - [Memory Configuration](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/memory.md)
    - [Networking](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/networking.md)
    - [Storage](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/storage.md)
  - [Advanced Features](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs)
    - [Device Hotplug](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/hotplug.md)
    - [Live Migration](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/live_migration.md)
    - [Snapshot/Restore](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/snapshot_restore.md)
    - [Intel TDX](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/intel_tdx.md)
    - [AMD SEV-SNP](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/amd_sev_snp.md)
    - [Intel SGX](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/intel_sgx.md)
    - [VFIO Device Passthrough](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/vfio.md)
  - [Performance](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs)
    - [Performance Metrics](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/performance_metrics.md)
    - [Profiling](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/profiling.md)
    - [Coverage](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/docs/coverage.md)
- [Cloud Hypervisor Website](https://www.cloudhypervisor.org)
- [Community Resources](https://github.com/cloud-hypervisor/community)
  - [Slack Community](https://cloud-hypervisor.slack.com)
  - [Mailing List](https://lists.cloudhypervisor.org)
  - [Contributing Guide](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/main/CONTRIBUTING.md)
  - [Security Policy](https://github.com/cloud-hypervisor/cloud-hypervisor/security/policy)

## Architecture Overview

- **Language**: Written in Rust for memory safety and performance
- **Hypervisor Support**: KVM (Linux), Microsoft Hypervisor (Windows Server 2019/Windows 10)
- **Guest OS Support**: 64-bit Linux, Windows 10/Windows Server 2019
- **Target Workloads**: Modern cloud workloads, containers, serverless

## Key Features

- **Security-First Design**: Rust language, minimal attack surface, Landlock sandboxing
- **Performance**: Low latency, minimal memory footprint, device offload with vhost-user
- **Hotplug Support**: CPU, memory, and device hotplug during runtime
- **Migration**: Live migration between hosts with minimal downtime
- **Confidential Computing**: Intel TDX, AMD SEV-SNP support
- **Hardware Acceleration**: Intel SGX, vDPA, SR-IOV, GPU passthrough

## Installation Methods

### Pre-built Binaries

- Download from [GitHub Releases](https://github.com/cloud-hypervisor/cloud-hypervisor/releases)
- Available for x86-64 and AArch64

### Package Managers

- Ubuntu/Debian: Available via distribution packages
- Fedora/RHEL: Available via distribution packages

### Building from Source

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install git build-essential m4 bison flex uuid-dev qemu-utils musl-tools

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone and build
git clone https://github.com/cloud-hypervisor/cloud-hypervisor.git
cd cloud-hypervisor
cargo build --release

# Set capabilities
sudo setcap cap_net_admin+ep ./target/release/cloud-hypervisor
```

## Installation

```bash
# Install from package repository
sudo apt update && sudo apt install cloud-hypervisor

# Build from source with Rust
git clone https://github.com/cloud-hypervisor/cloud-hypervisor.git
cd cloud-hypervisor
cargo build --release
sudo setcap cap_net_admin+ep ./target/release/cloud-hypervisor
```

## Core Configuration

**Basic VM Launch**

```bash
# Launch VM with direct kernel boot
cloud-hypervisor \
    --kernel /path/to/vmlinux \
    --cmdline "console=hvc0 root=/dev/vda1 rw" \
    --disk path=/path/to/disk.raw \
    --cpus boot=4 \
    --memory size=1024M \
    --net "tap=,mac=,ip=,mask=" \
    --api-socket=/tmp/ch-socket
```

**REST API Management**

```bash
# Start with API socket
cloud-hypervisor --api-socket /tmp/cloud-hypervisor.sock

# Create VM via API
curl --unix-socket /tmp/cloud-hypervisor.sock -i \
     -X PUT 'http://localhost/api/v1/vm.create' \
     -H 'Content-Type: application/json' \
     -d '{
         "cpus":{"boot_vcpus": 4, "max_vcpus": 4},
         "payload":{"kernel":"/path/to/vmlinux", "cmdline":"console=hvc0 root=/dev/vda1 rw"},
         "disks":[{"path":"/path/to/disk.raw"}],
         "memory":{"size": 1073741824},
         "net":[{"ip":"192.168.10.10", "mask":"255.255.255.0"}]
     }'

# Boot VM
curl --unix-socket /tmp/cloud-hypervisor.sock -i \
     -X PUT 'http://localhost/api/v1/vm.boot'
```

## CLI Interface

### Basic VM Configuration

```bash
./cloud-hypervisor \
    --kernel ./vmlinux \
    --disk path=ubuntu.raw \
    --cpus boot=4 \
    --memory size=1024M \
    --net "tap=,mac=,ip=,mask=" \
    --api-socket /tmp/cloud-hypervisor.sock
```

### Advanced Configuration

```bash
./cloud-hypervisor \
    --cpus boot=4,max=8,topology=2:2:1:1,affinity=[0@[0,1],1@[2,3]] \
    --memory size=2G,hotplug_size=4G,hugepages=on \
    --disk path=disk1.raw,iommu=on \
    --net mac=52:54:00:02:d9:01,vhost_user=true,socket=/tmp/vhost1 \
    --device path=/sys/bus/pci/devices/0000:01:00.0/ \
    --api-socket /tmp/ch.sock
```

## REST API Interface

### VM Creation

```bash
curl --unix-socket /tmp/cloud-hypervisor.sock -i \
     -X PUT 'http://localhost/api/v1/vm.create' \
     -H 'Content-Type: application/json' \
     -d '{
         "cpus": {"boot_vcpus": 4, "max_vcpus": 4},
         "payload": {"kernel": "/path/to/vmlinux", "cmdline": "console=hvc0 root=/dev/vda1 rw"},
         "disks": [{"path": "/path/to/disk.raw"}],
         "net": [{"ip": "192.168.10.10", "mask": "255.255.255.0"}]
     }'
```

### VM Control

```bash
# Boot VM
curl --unix-socket /tmp/cloud-hypervisor.sock -i -X PUT 'http://localhost/api/v1/vm.boot'

# Pause VM
curl --unix-socket /tmp/cloud-hypervisor.sock -i -X PUT 'http://localhost/api/v1/vm.pause'

# Resume VM
curl --unix-socket /tmp/cloud-hypervisor.sock -i -X PUT 'http://localhost/api/v1/vm.resume'

# Shutdown VM
curl --unix-socket /tmp/cloud-hypervisor.sock -i -X PUT 'http://localhost/api/v1/vm.shutdown'
```

## Advanced Features

**CPU and Memory Hotplug**

```bash
# Start with hotplug support
cloud-hypervisor \
    --cpus boot=4,max=8 \
    --memory size=1024M,hotplug_size=8192M \
    --api-socket=/tmp/ch-socket

# Add CPUs at runtime
ch-remote --api-socket=/tmp/ch-socket resize --cpus 8

# Add memory at runtime
ch-remote --api-socket=/tmp/ch-socket resize --memory 3G
```

**Live Migration**

```bash
# Source VM
cloud-hypervisor \
    --memory size=1G,shared=on \
    --api-socket=/tmp/api1

# Destination (empty VM)
cloud-hypervisor --api-socket=/tmp/api2

# Configure destination
ch-remote --api-socket=/tmp/api2 receive-migration unix:/tmp/sock

# Migrate from source
ch-remote --api-socket=/tmp/api1 send-migration unix:/tmp/sock
```

**Snapshot and Restore**

```bash
# Pause VM before snapshot
ch-remote --api-socket=/tmp/ch-socket pause

# Take snapshot
ch-remote --api-socket=/tmp/ch-socket snapshot file:///path/to/snapshot

# Restore from snapshot
cloud-hypervisor --api-socket /tmp/ch-socket
ch-remote --api-socket=/tmp/ch-socket restore source-url=file:///path/to/snapshot
```

## Security Features

**Intel TDX (Trusted Domain Extensions)**

```bash
# Build with TDX support
cargo build --features tdx

# Launch TDX VM
cloud-hypervisor \
    --platform tdx=on \
    --firmware /path/to/tdx-firmware.fd \
    --cpus boot=1 \
    --memory size=1G \
    --disk path=/path/to/tdx-guest.img
```

**AMD SEV-SNP (Secure Encrypted Virtualization)**

```bash
# Build with SEV-SNP support
cargo build --features sev_snp

# Launch SEV-SNP VM
cloud-hypervisor \
    --platform sev_snp=on \
    --cpus boot=1 \
    --memory size=1G \
    --disk path=/path/to/guest.img
```

**Virtual IOMMU**

```bash
# Enable IOMMU for device isolation
cloud-hypervisor \
    --disk path=/path/to/disk.raw,iommu=on \
    --net tap=,iommu=on \
    --iommu
```

## High-Performance Configurations

**vhost-user Networking**

```bash
# High-performance networking with DPDK
cloud-hypervisor \
    --memory size=1G,hugepages=on,shared=true \
    --net vhost_user=true,socket=/tmp/vhost-user1,num_queues=4
```

**virtio-fs Shared Filesystems**

```bash
# Shared filesystem between host and guest
virtiofsd --socket-path=/tmp/virtiofs.sock --shared-dir=/shared &

cloud-hypervisor \
    --memory size=1G,shared=on \
    --fs tag=myfs,socket=/tmp/virtiofs.sock,num_queues=1
```

**vDPA Device Passthrough**

```bash
# Hardware-accelerated networking via vDPA
cloud-hypervisor \
    --memory size=1G,hugepages=on \
    --vdpa path=/dev/vhost-vdpa-0,num_queues=1
```

## Integration Examples

**Container Runtime Integration**

```bash
# Use with Kata Containers
kata-runtime create --bundle /path/to/bundle container-id
```

**Kubernetes Integration**

```yaml
# Kata runtime class for Cloud Hypervisor
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: kata-clh
handler: kata-clh
```

**Terraform Deployment**

```hcl
# Cloud Hypervisor via libvirt provider
resource "libvirt_domain" "vm" {
  name   = "cloud-hypervisor-vm"
  memory = "1024"
  vcpu   = 2

  disk {
    volume_id = libvirt_volume.vm_disk.id
  }

  # Use Cloud Hypervisor as hypervisor
  hypervisor = "cloud-hypervisor"
}
```

## Remote Management

**ch-remote CLI Tool**

```bash
# VM lifecycle management
ch-remote --api-socket=/tmp/ch-socket info
ch-remote --api-socket=/tmp/ch-socket pause
ch-remote --api-socket=/tmp/ch-socket resume
ch-remote --api-socket=/tmp/ch-socket shutdown
ch-remote --api-socket=/tmp/ch-socket reboot

# Device hotplug
ch-remote --api-socket=/tmp/ch-socket add-disk path=/path/to/new-disk.raw
ch-remote --api-socket=/tmp/ch-socket add-net tap=
ch-remote --api-socket=/tmp/ch-socket remove-device id=disk1
```

**Monitoring and Debugging**

```bash
# Enable debug logging
cloud-hypervisor --log-file /tmp/ch.log -vvv

# Performance profiling
RUSTFLAGS='-C force-frame-pointers=y' cargo build --profile profiling
perf record -g ./target/profiling/cloud-hypervisor

# Heap profiling with dhat
cargo build --profile profiling --features "dhat-heap"
```

## Configuration Schemas

### VM Configuration Structure

```rust
struct VmConfig {
    cpus: CpusConfig,
    memory: MemoryConfig,
    payload: PayloadConfig,
    disks: Vec<DiskConfig>,
    net: Vec<NetConfig>,
    rng: RngConfig,
    balloon: Option<BalloonConfig>,
    fs: Vec<FsConfig>,
    pmem: Vec<PmemConfig>,
    serial: ConsoleConfig,
    console: ConsoleConfig,
    devices: Vec<DeviceConfig>,
    user_devices: Vec<UserDeviceConfig>,
    vdpa: Vec<VdpaConfig>,
    vsock: Option<VsockConfig>,
    platform: Option<PlatformConfig>,
}
```

### CPU Configuration

```rust
struct CpusConfig {
    boot_vcpus: u8,
    max_vcpus: u8,
    topology: Option<CpuTopology>,
    kvm_hyperv: bool,
    max_phys_bits: u8,
    affinity: Option<Vec<CpuAffinity>>,
    features: CpuFeatures,
}
```

### Memory Configuration

```rust
struct MemoryConfig {
    size: u64,
    mergeable: bool,
    hotplug_method: HotplugMethod,
    hotplug_size: Option<u64>,
    shared: bool,
    hugepages: bool,
    hugepage_size: Option<u64>,
    prefault: bool,
    zones: Option<Vec<MemoryZoneConfig>>,
}
```

## Performance and Security

### Performance Features

- **Minimal Emulation**: Reduces virtualization overhead
- **Device Offload**: vhost-user for high-performance networking and storage
- **Memory Optimization**: Hugepages, memory sharing, prefaulting
- **CPU Optimization**: CPU affinity, NUMA topology awareness

### Security Features

- **Rust Memory Safety**: Prevents buffer overflows and memory corruption
- **Landlock Sandboxing**: Restricts file system access
- **Minimal Attack Surface**: Reduced emulation code
- **Confidential Computing**: Intel TDX, AMD SEV-SNP support

## Advanced Use Cases

### Container Runtime Integration

- Kata Containers integration
- Firecracker migration path
- OCI runtime compatibility

### Cloud Infrastructure

- Kubernetes integration
- OpenStack Nova driver
- Cloud-init support

### Edge Computing

- Minimal resource requirements
- Fast boot times
- Efficient resource utilization

## Build and Development Tools

- **Cargo Commands**: Standard Rust build system
- **Development Scripts**: `./scripts/dev_cli.sh` for containerized builds
- **Testing**: Unit tests, integration tests, performance benchmarks
- **Linting**: Cargo clippy for code quality
- **Formatting**: Cargo fmt for consistent code style

## Monitoring and Observability

- **Performance Metrics**: Built-in metrics collection
- **Profiling**: perf integration, heap profiling with dhat
- **Logging**: Structured logging with configurable levels
- **Tracing**: Guest and host event tracing

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/cloud-hypervisor/`:

- Basic usage: `$HOME/.claude/snippets/cloud-hypervisor/basic/`
- API management: `$HOME/.claude/snippets/cloud-hypervisor/api/`
- Security features: `$HOME/.claude/snippets/cloud-hypervisor/security/`
- Performance tuning: `$HOME/.claude/snippets/cloud-hypervisor/performance/`
- Networking: `$HOME/.claude/snippets/cloud-hypervisor/networking/`
- Storage: `$HOME/.claude/snippets/cloud-hypervisor/storage/`
- Migration: `$HOME/.claude/snippets/cloud-hypervisor/migration/`
- Monitoring: `$HOME/.claude/snippets/cloud-hypervisor/monitoring/`
- Integration: `$HOME/.claude/snippets/cloud-hypervisor/integration/`

## See Also

- Complete reference: `$HOME/.claude/references/cloud-hypervisor.md`
- Code examples: `$HOME/.claude/snippets/cloud-hypervisor/`
- Basic usage: `$HOME/.claude/snippets/cloud-hypervisor/basic/`
- API management: `$HOME/.claude/snippets/cloud-hypervisor/api/`
- Security features: `$HOME/.claude/snippets/cloud-hypervisor/security/`
- Performance tuning: `$HOME/.claude/snippets/cloud-hypervisor/performance/`
- Networking: `$HOME/.claude/snippets/cloud-hypervisor/networking/`
- Storage: `$HOME/.claude/snippets/cloud-hypervisor/storage/`
- Migration: `$HOME/.claude/snippets/cloud-hypervisor/migration/`
- Monitoring: `$HOME/.claude/snippets/cloud-hypervisor/monitoring/`
- Integration: `$HOME/.claude/snippets/cloud-hypervisor/integration/`
