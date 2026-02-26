# Podman Reference

**Always remember to reference @$HOME/.claude/references/podman.md and look for snippets and examples in @$HOME/.claude/snippets/podman/**

## Quick Reference

- Installation: See official docs - varies by OS
- CLI: Drop-in replacement for Docker
- Documentation: [podman.io](https://podman.io)
- GitHub: [containers/podman](https://github.com/containers/podman)
- Package: Available on all major Linux distributions

## Resources and Documentation

- [Podman Documentation](https://podman.io)
  - [Getting Started](https://podman.io/getting-started/)
  - [Commands Reference](https://docs.podman.io/en/latest/Commands.html)
    - [Container Management](https://docs.podman.io/en/latest/markdown/podman-container.1.html)
    - [Pod Management](https://docs.podman.io/en/latest/markdown/podman-pod.1.html)
    - [Image Management](https://docs.podman.io/en/latest/markdown/podman-image.1.html)
    - [Network Management](https://docs.podman.io/en/latest/markdown/podman-network.1.html)
    - [Volume Management](https://docs.podman.io/en/latest/markdown/podman-volume.1.html)
    - [Machine Management](https://docs.podman.io/en/latest/markdown/podman-machine.1.html)
    - [System Management](https://docs.podman.io/en/latest/markdown/podman-system.1.html)
  - [Configuration](https://docs.podman.io/en/latest/markdown/podman.1.html)
  - [Tutorials](https://docs.podman.io/en/latest/Tutorials.html)
    - [Rootless Tutorial](https://docs.podman.io/en/latest/markdown/podman-rootless.7.html)
    - [Basic Networking](https://docs.podman.io/en/latest/Tutorials.html#basic-networking)
    - [Socket Activation](https://docs.podman.io/en/latest/Tutorials.html#socket-activation)
  - [Migration Guides](https://docs.podman.io/en/latest/Tutorials.html#migration)
- [Community Resources](https://podman.io/community/)
  - [Blogs](https://podman.io/blogs/)
  - [Talks & Presentations](https://podman.io/talks/)
  - [Troubleshooting](https://docs.podman.io/en/latest/Troubleshooting.html)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/podman/`:

- Basic container operations
- Pod management
- Advanced networking configurations
- Rootless setup and security
- Systemd integration patterns
- CI/CD pipeline examples

## Default Usage Patterns

Default to using Podman instead of Docker for container management:

- Use `podman` instead of `docker` commands (they're largely compatible)
- No daemon required - more secure and lightweight
- Native pod support for multi-container applications
- Better rootless container support
- Built-in systemd integration

### Key Features

- **Daemonless**: No background service, more secure
- **Rootless**: Run containers without root privileges
- **Pods**: Native Kubernetes-style pod management
- **Docker Compatibility**: Drop-in replacement for Docker CLI
- **Systemd Integration**: Generate systemd units with `podman generate systemd`

## Core Features

- **Daemonless**: No persistent background service required
- **Rootless**: Run containers without root privileges
- **Pod Support**: Native Kubernetes-style pod management
- **Docker Compatibility**: Drop-in replacement for Docker CLI
- **Security**: Enhanced security with user namespaces
- **Systemd Integration**: Native systemd unit generation
- **Multi-platform**: Linux, macOS, Windows support

## Key Differences from Docker

- No daemon process required
- Better security with rootless operation
- Native pod support (multi-container groups)
- Enhanced systemd integration
- Direct Kubernetes YAML compatibility
- More granular user namespace control

## Security Features

- Rootless container execution
- User namespace isolation
- SELinux integration
- AppArmor support
- Seccomp filtering
- Capability dropping
- Read-only root filesystems

## Configuration Files

- **containers.conf**: Main configuration file
  - System: `/etc/containers/containers.conf`
  - User: `$HOME/.config/containers/containers.conf`
- **storage.conf**: Storage configuration
  - System: `/etc/containers/storage.conf`
  - User: `$HOME/.config/containers/storage.conf`
- **registries.conf**: Registry configuration
- **policy.json**: Image signature policy

## Environment Variables

- `CONTAINER_HOST`: Remote connection URL
- `CONTAINER_SSHKEY`: SSH key for remote connections
- `XDG_RUNTIME_DIR`: Runtime directory for rootless
- `XDG_CONFIG_HOME`: Configuration directory
- `PODMAN_USERNS`: Default user namespace mode
