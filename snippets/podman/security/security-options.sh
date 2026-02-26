#!/bin/bash

# Security Configuration Examples

# Run with dropped capabilities
podman run --rm \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  --cap-add CHOWN \
  nginx:alpine

# SELinux security options
podman run --rm \
  --security-opt label=type:container_t \
  --security-opt label=level:s0:c100,c200 \
  alpine

# Disable SELinux labeling
podman run --rm \
  --security-opt label=disable \
  alpine

# AppArmor profile
podman run --rm \
  --security-opt apparmor=unconfined \
  alpine

# Custom AppArmor profile
podman run --rm \
  --security-opt apparmor=/path/to/profile \
  alpine

# Seccomp filtering
podman run --rm \
  --security-opt seccomp=unconfined \
  alpine

# Custom seccomp profile
podman run --rm \
  --security-opt seccomp=/path/to/seccomp.json \
  alpine

# No new privileges
podman run --rm \
  --security-opt no-new-privileges \
  alpine

# Mask sensitive paths
podman run --rm \
  --security-opt mask=/proc/acpi:/proc/scsi \
  alpine

# Unmask paths
podman run --rm \
  --security-opt unmask=/proc/acpi \
  alpine

# Read-only root filesystem
podman run --rm \
  --read-only \
  --tmpfs /tmp \
  alpine

# User namespace configuration
podman run --rm \
  --userns=keep-id \
  --user 1000:1000 \
  alpine id