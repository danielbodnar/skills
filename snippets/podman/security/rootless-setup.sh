#!/bin/bash

# Rootless Podman Setup and Configuration

# Add subordinate UIDs and GIDs for user
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER

# Verify subuid/subgid configuration
grep $USER /etc/subuid /etc/subgid

# Migrate existing containers after subuid changes
podman system migrate

# Enable unprivileged ping (optional)
echo 'net.ipv4.ping_group_range = 0 2000000' | sudo tee -a /etc/sysctl.d/podman.conf
sudo sysctl --system

# Configure slirp4netns for better networking
mkdir -p ~/.config/containers
cat > ~/.config/containers/containers.conf << EOF
[containers]
netns = "slirp4netns"

[engine]
cgroup_manager = "systemd"
events_logger = "journald"
EOF

# Set up rootless storage configuration
cat > ~/.config/containers/storage.conf << EOF
[storage]
driver = "overlay"
graphroot = "$HOME/.local/share/containers/storage"
runroot = "/run/user/$UID/containers"

[storage.options]
mount_program = "/usr/bin/fuse-overlayfs"
EOF

# Test rootless functionality
podman run --rm --name rootless-test \
  --user $(id -u):$(id -g) \
  --group-add keep-groups \
  alpine id

# Run with user namespace mapping
podman run --rm \
  --uidmap 0:1000:1 \
  --uidmap 1:100000:65536 \
  alpine id