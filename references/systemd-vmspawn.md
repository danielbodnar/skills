# systemd-vmspawn Reference

**Always remember to reference @$HOME/.claude/references/systemd-vmspawn.md and look for snippets and examples in @$HOME/.claude/snippets/systemd-vmspawn/**

## Quick Reference

- Installation: Part of systemd (systemd-vmspawn available since version 255)
- Usage: `systemd-vmspawn --image=vm.raw` or `systemd-vmspawn -D /path/to/rootfs`
- Documentation: <https://www.freedesktop.org/software/systemd/man/systemd-vmspawn.html>
- GitHub: <https://github.com/systemd/systemd>
- License: GPL-2.0

## Resources and Documentation

- [systemd Documentation](https://systemd.io/)
  - [systemd-vmspawn Manual](https://www.freedesktop.org/software/systemd/man/systemd-vmspawn.html)
  - [Writing VM and Container Managers](https://systemd.io/WRITING_VM_AND_CONTAINER_MANAGERS/)
  - [VM Integration Guidelines](https://www.freedesktop.org/wiki/Software/systemd/writing-vm-managers/)
- [Manual Pages](https://man7.org/linux/man-pages/man1/systemd-vmspawn.1.html)
  - [Arch Linux Manual](https://man.archlinux.org/man/systemd-vmspawn.1.en)
  - [Command Line Options](https://man.archlinux.org/man/systemd-vmspawn.1.en)
- [Community Resources](https://github.com/systemd/systemd)
  - [GitHub Issues](https://github.com/systemd/systemd/labels/vmspawn)
  - [Discussion Forums](https://github.com/systemd/systemd/discussions)
  - [LWN Coverage](https://lwn.net/Articles/978151/)

## Core Concepts

### Virtual Machine Management

- **Full Virtualization**: Launches complete virtual machines with their own kernel, unlike systemd-nspawn which uses namespaces
- **systemd Integration**: Native integration with systemd ecosystem including machined, journald, and networkd
- **Resource Management**: Configurable CPU, memory, storage, and networking resources
- **Boot Methods**: Supports Boot Loader Specification, direct kernel boot, and firmware-based boot

### Key Capabilities

- **Image Formats**: Supports raw disk images, directories, and device nodes
- **Networking**: Multiple networking modes including TAP, user-mode, and VSock
- **Security**: Secure Boot support, user namespace mapping, TPM emulation
- **Integration**: Journal forwarding, SSH key management, credential passing
- **Service Management**: Can run as systemd service with <systemd-vmspawn@.service>

## Command Line Interface

### Basic Usage

```bash
# Boot from disk image
systemd-vmspawn --image=vm.raw

# Boot from directory
systemd-vmspawn --directory=/path/to/rootfs

# Boot with specific machine name
systemd-vmspawn --image=vm.raw --machine=myvm
```

### Image and Filesystem Options

- `--image=PATH, -i PATH`: Specify root filesystem disk image or device node
- `--directory=PATH, -D PATH`: Use directory as filesystem root for the VM
- `--extra-drive=PATH`: Attach additional storage to the VM
- `--bind=PATH[:PATH], --bind-ro=PATH[:PATH]`: Bind host filesystem into guest

### System Resource Configuration

- `--cpus=CPUS`: Set number of virtual CPUs (default: 1)
- `--ram=BYTES`: Configure memory allocation (default: 2G)
- `--kvm=BOOL`: Enable/disable KVM acceleration
- `--tpm=BOOL`: Enable/disable software TPM (systemd 256+)

### Networking Options

- `--network-tap, -n`: Create TAP device for networking (requires root)
- `--network-user-mode`: Use user mode networking
- `--vsock=BOOL,CID`: Configure VSock networking with specific CID

### Security and Boot Options

- `--secure-boot=BOOL`: Configure Secure Boot firmware selection
- `--firmware=PATH`: Specify firmware definition file
- `--linux=PATH`: Specify kernel binary for direct kernel boot (systemd 256+)
- `--initrd=PATH`: Specify initrd for direct kernel boot (systemd 256+)
- `--private-users=BOOL`: Enable user namespace mapping

### Integration Features

- `--forward-journal=FILE`: Forward VM journal to host file
- `--pass-ssh-key=BOOL`: Generate ephemeral SSH keys for VM access
- `--ssh-key-type=TYPE`: SSH key type (ed25519, rsa)
- `--register=BOOL`: Register VM with systemd-machined

### Console and Interface Options

- `--console=MODE`: Set console mode (interactive, read-only, native, gui)
- `--background=COLOR`: Set terminal background color tint

## Latest Features (systemd 256+)

### New Command Line Options

- `--firmware=PATH`: Configure or list Qemu firmware definitions
- `--tpm=BOOL`: Enable/disable software TPM
- `--linux=PATH`: Specify kernel for direct boot
- `--initrd=PATH`: Specify initrd for direct boot
- `--bind=, --bind-ro=`: Bind host filesystem parts into guest
- `--extra-drive=PATH`: Attach additional storage

### Enhanced Integration

- **HyperV Enlightenments**: Automatically enabled for better performance
- **VM Generation ID**: Enabled for proper VM lifecycle management
- **Service Integration**: New <systemd-vmspawn@.service> template
- **Environment Variables**: $SYSTEMD_VMSPAWN_QEMU_EXTRA for additional qemu options

## Environment Variables

### Configuration Variables

- `SYSTEMD_VMSPAWN_QEMU_EXTRA`: Additional qemu command line options
- `SYSTEMD_LOG_LEVEL`: Control logging verbosity
- `SYSTEMD_LOG_COLOR`: Enable/disable colored output
- `SYSTEMD_LOG_TIME`: Include timestamps in log output
- `SYSTEMD_LOG_LOCATION`: Include code location in logs

### Path Configuration

- `XDG_RUNTIME_DIR`: Runtime directory for ephemeral files
- `HOME`: User home directory for configuration files

## Integration with systemd Ecosystem

### Machine Management

- **machined Integration**: VMs registered with systemd-machined service
- **machinectl**: Use `machinectl` to manage running VMs
- **Process Attribution**: VM processes properly attributed in ps, cgls output
- **Cross-Machine Operations**: systemd tools support `-M` flag for VM operations

### Service Management

```bash
# Run as systemd service
systemctl start systemd-vmspawn@myvm.service

# Enable automatic startup
systemctl enable systemd-vmspawn@myvm.service

# Check status
systemctl status systemd-vmspawn@myvm.service
```

### Journal Integration

```bash
# View VM journal entries
journalctl -M vmname

# Forward VM journal to host
systemd-vmspawn --forward-journal=/var/log/vm.journal --image=vm.raw
```

### Network Integration

- **systemd-networkd**: Required for TAP networking setup
- **Network Configuration**: Automatic network provisioning for VMs
- **VSock Support**: Native support for VM Sockets communication

## Security Considerations

### User Permissions

- **KVM Group**: Users must be in 'kvm' group for VSock options (Ubuntu/Debian)
- **Root Privileges**: Required for TAP networking
- **User Namespaces**: Support for unprivileged operation with --private-users

### Security Features

- **Secure Boot**: Firmware selection with Secure Boot support
- **TPM Emulation**: Software TPM for attestation and secure boot
- **SSH Key Management**: Ephemeral key generation for secure access
- **Credential Passing**: Secure credential injection into VMs

### Isolation

- **Full VM Isolation**: Complete hardware virtualization
- **Network Isolation**: Configurable network isolation modes
- **Filesystem Isolation**: Separate root filesystem per VM

## Common Use Cases

### Development and Testing

- **OS Testing**: Test different Linux distributions
- **System Development**: Develop and test system services
- **Integration Testing**: Isolated testing environments
- **CI/CD**: Automated testing in clean environments

### System Administration

- **Service Isolation**: Run services in isolated VMs
- **Legacy Support**: Run older OS versions safely
- **Multi-tenancy**: Multiple isolated environments
- **Backup Testing**: Test backup and recovery procedures

### Educational and Learning

- **System Learning**: Learn system administration safely
- **Experimentation**: Try dangerous operations safely
- **Demonstration**: Show system concepts in isolation
- **Training**: Provide clean environments for training

## Performance Considerations

### Resource Optimization

- **Memory Management**: Efficient memory allocation and sharing
- **CPU Scheduling**: Proper CPU resource allocation
- **I/O Performance**: Optimized disk and network I/O
- **KVM Acceleration**: Hardware virtualization for performance

### Monitoring and Tuning

- **Resource Usage**: Monitor CPU, memory, disk usage
- **Performance Metrics**: Track VM performance metrics
- **Optimization**: Tune for specific workloads
- **Scaling**: Handle multiple concurrent VMs

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/systemd-vmspawn/`:

- Basic VM creation and management
- Advanced networking configurations
- Security and isolation patterns
- systemd service integration
- Development and testing workflows
- Production deployment patterns
- Troubleshooting and debugging techniques

## Schema and Type Definitions

Configuration schemas and service definitions in `$HOME/.claude/snippets/systemd-vmspawn/schemas/`:

- systemd service unit files
- Network configuration files
- VM configuration templates

## Configuration Examples

Configuration files and templates in `$HOME/.claude/snippets/systemd-vmspawn/configs/`:

- systemd service configurations
- Network setup examples
- Security policy templates

## Troubleshooting

### Common Issues

- **Permission Errors**: Ensure user is in appropriate groups (kvm)
- **Network Problems**: Verify systemd-networkd configuration
- **Boot Failures**: Check firmware and kernel compatibility
- **Resource Constraints**: Monitor system resources

### Debugging Techniques

- **Verbose Logging**: Enable detailed logging for troubleshooting
- **Console Access**: Use different console modes for debugging
- **Journal Analysis**: Examine VM and host journal entries
- **Process Monitoring**: Track VM processes and resource usage

### Performance Issues

- **KVM Acceleration**: Ensure KVM is properly configured
- **Memory Allocation**: Optimize memory usage and allocation
- **Storage Performance**: Use appropriate storage backends
- **Network Optimization**: Configure efficient networking

## Migration and Compatibility

### From Other Virtualization Tools

- **QEMU Migration**: Migrate from direct QEMU usage
- **VirtualBox/VMware**: Convert VM images and configurations
- **Container Migration**: Migrate from systemd-nspawn containers
- **Cloud Integration**: Adapt cloud VM images for local use

### Version Compatibility

- **systemd 255**: Initial systemd-vmspawn release
- **systemd 256**: Major feature additions and improvements
- **Future Versions**: Planned features and roadmap
- **Backward Compatibility**: Maintaining compatibility across versions

## See Also

- Complete reference: `@$HOME/.claude/references/systemd-vmspawn.md`
- Code examples: `@$HOME/.claude/snippets/systemd-vmspawn/`
- Schemas: `@$HOME/.claude/snippets/systemd-vmspawn/schemas/`
- Configs: `@$HOME/.claude/snippets/systemd-vmspawn/configs/`
- Related tools: systemd-nspawn, machinectl, systemd-machined
- Documentation: systemd.io, freedesktop.org manual pages
