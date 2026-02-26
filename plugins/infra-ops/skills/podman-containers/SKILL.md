---
name: podman-containers
description: Manage and troubleshoot Podman containers, pods, and images for rootless container operations
---

# Podman Containers

Skill for managing and troubleshooting Podman containers, pods, and images in rootless mode. Covers day-to-day container operations, debugging failed containers, managing pod lifecycles, and working with container images and registries.

## Core Concepts

Podman is a daemonless, rootless container engine compatible with OCI containers. Unlike Docker, Podman runs containers as the invoking user without requiring a privileged daemon process. Pods are a first-class concept, grouping containers that share network and IPC namespaces.

## Container Lifecycle

### Listing and Inspecting

```bash
# List running containers
podman ps

# List all containers including stopped
podman ps -a

# Show container resource usage
podman stats --no-stream

# Inspect container details (config, state, networking)
podman inspect <container>

# View container logs (follow mode)
podman logs -f <container>

# View last 100 lines of logs with timestamps
podman logs --tail 100 --timestamps <container>
```

### Running Containers

```bash
# Run a container in detached mode with name
podman run -d --name <name> <image>

# Run with port mapping, volume mount, and environment variable
podman run -d \
  --name <name> \
  -p 8080:80 \
  -v /host/path:/container/path:Z \
  -e MY_VAR=value \
  <image>

# Run with resource limits
podman run -d \
  --name <name> \
  --memory 512m \
  --cpus 1.5 \
  <image>

# Run with automatic restart policy
podman run -d --restart=on-failure:3 --name <name> <image>
```

### Stopping and Removing

```bash
# Stop a running container (SIGTERM, then SIGKILL after timeout)
podman stop <container>

# Stop with custom timeout (seconds)
podman stop -t 30 <container>

# Remove a stopped container
podman rm <container>

# Force remove a running container
podman rm -f <container>

# Remove all stopped containers
podman container prune
```

### Exec and Attach

```bash
# Execute a command inside a running container
podman exec -it <container> /bin/sh

# Execute as a specific user
podman exec -u root <container> whoami

# Attach to a running container's stdio
podman attach <container>
```

## Pod Management

Pods group containers sharing the same network namespace, similar to Kubernetes pods.

```bash
# Create a pod with port mappings (ports go on the pod, not individual containers)
podman pod create --name <pod-name> -p 8080:80 -p 3306:3306

# Run a container inside a pod
podman run -d --pod <pod-name> --name <container-name> <image>

# List pods
podman pod ls

# Inspect a pod
podman pod inspect <pod-name>

# Stop all containers in a pod
podman pod stop <pod-name>

# Remove a pod and all its containers
podman pod rm -f <pod-name>

# Restart a pod
podman pod restart <pod-name>
```

## Image Management

```bash
# Pull an image from a registry
podman pull <registry>/<image>:<tag>

# List local images
podman images

# Remove an image
podman rmi <image>

# Remove dangling images
podman image prune

# Remove all unused images
podman image prune -a

# Build an image from a Containerfile
podman build -t <name>:<tag> .

# Tag an image
podman tag <image> <registry>/<name>:<tag>

# Push to a registry
podman push <registry>/<name>:<tag>

# Show image layer history
podman history <image>

# Show disk usage for images, containers, volumes
podman system df
```

## Rootless Configuration

Podman runs rootless by default. Key configuration points:

```bash
# Check subuid/subgid mappings for the current user
cat /etc/subuid
cat /etc/subgid

# Verify rootless runtime info
podman info --format '{{.Host.Security.Rootless}}'

# Storage configuration lives at
# ~/.config/containers/storage.conf

# Registries configuration
# ~/.config/containers/registries.conf

# Default container settings
# ~/.config/containers/containers.conf
```

### Common Rootless Issues

- **Port < 1024**: Rootless containers cannot bind to privileged ports by default. Use `sysctl net.ipv4.ip_unprivileged_port_start=80` or map to a higher port.
- **Volume permissions**: Use the `:Z` suffix for SELinux relabeling on bind mounts.
- **Filesystem overlays**: Ensure `fuse-overlayfs` is installed for rootless overlay storage.
- **cgroup v2**: Required for rootless resource limits. Check with `stat -fc %T /sys/fs/cgroup` (should return `cgroup2fs`).

## Networking

```bash
# List networks
podman network ls

# Create a custom network
podman network create <network-name>

# Inspect a network
podman network inspect <network-name>

# Connect a running container to a network
podman network connect <network-name> <container>

# Disconnect a container from a network
podman network disconnect <network-name> <container>

# Remove a network
podman network rm <network-name>
```

## Volumes

```bash
# Create a named volume
podman volume create <volume-name>

# List volumes
podman volume ls

# Inspect a volume
podman volume inspect <volume-name>

# Remove unused volumes
podman volume prune

# Remove a specific volume
podman volume rm <volume-name>
```

## Troubleshooting

### Container Fails to Start

```bash
# Check container logs for error messages
podman logs <container>

# Inspect the container's last exit code and error
podman inspect <container> --format '{{.State.ExitCode}} {{.State.Error}}'

# Check events for the container
podman events --filter container=<container> --since 1h

# Run the container interactively to debug
podman run -it --entrypoint /bin/sh <image>
```

### Resource Issues

```bash
# Check container resource usage
podman stats --no-stream

# Check container resource limits
podman inspect <container> --format '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}'

# Check host resource availability
podman system info
```

### Networking Issues

```bash
# Test connectivity from inside a container
podman exec <container> curl -v http://localhost:80

# Check container IP address
podman inspect <container> --format '{{.NetworkSettings.IPAddress}}'

# Check port mappings
podman port <container>

# Verify DNS resolution inside container
podman exec <container> nslookup <hostname>
```

### Cleanup and Recovery

```bash
# Full system cleanup (containers, images, volumes, networks)
podman system prune -a --volumes

# Reset podman storage completely (destructive)
podman system reset

# Check and repair storage
podman system check
```

## Systemd Integration

Generate and manage systemd unit files for Podman containers:

```bash
# Generate a systemd unit file for an existing container
podman generate systemd --new --name <container> --files

# Generate for a pod
podman generate systemd --new --name <pod-name> --files

# Install as a user service
mkdir -p ~/.config/systemd/user/
cp container-<name>.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now container-<name>.service

# Check service status
systemctl --user status container-<name>.service
```

## Quadlet (Podman 4.4+)

Quadlet provides a declarative way to define containers as systemd units:

```ini
# ~/.config/containers/systemd/myapp.container
[Container]
Image=docker.io/library/nginx:latest
PublishPort=8080:80
Volume=/data:/usr/share/nginx/html:Z
Environment=TZ=America/Chicago

[Service]
Restart=on-failure
TimeoutStartSec=30

[Install]
WantedBy=default.target
```

```bash
# Reload and start quadlet-defined containers
systemctl --user daemon-reload
systemctl --user start myapp.service
```

## Compose Compatibility

Podman supports docker-compose files via `podman compose` or `podman-compose`:

```bash
# Start services defined in compose file
podman compose up -d

# Stop services
podman compose down

# View logs
podman compose logs -f

# Rebuild and restart
podman compose up -d --build
```
