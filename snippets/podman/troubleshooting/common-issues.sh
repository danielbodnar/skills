#!/bin/bash

# Common Troubleshooting Commands and Solutions

# Check Podman info and configuration
podman info
podman version

# System diagnosis
podman system df
podman system prune

# Check logs
journalctl --user -u podman.service -f

# Container logs
podman logs container_name
podman logs -f --since=1h container_name

# Debug networking issues
podman network ls
podman network inspect bridge

# Check resource usage
podman stats
podman top container_name

# Permission issues - check subuid/subgid
grep $USER /etc/subuid /etc/subgid

# Reset user namespace
podman system migrate

# Fix storage issues
podman system reset --force

# Registry connectivity test
podman search hello-world

# Test rootless functionality
podman run --rm alpine id

# Debug with verbose output
podman --log-level=debug run alpine echo test

# Check for conflicting processes
ps aux | grep -E "(docker|containerd|podman)"

# Systemd user session issues
loginctl show-user $USER
loginctl user-status $USER

# Fix XDG_RUNTIME_DIR issues
echo $XDG_RUNTIME_DIR
systemctl --user status

# Socket activation issues
systemctl --user status podman.socket
systemctl --user restart podman.socket

# Clean up everything
podman system prune -a -f
podman volume prune -f
podman network prune -f