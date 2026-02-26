#!/bin/bash

# Pod Management

# Create a pod
podman pod create --name web-pod -p 8080:80

# Create pod with shared volumes
podman pod create --name app-pod \
  --share net,ipc,uts \
  -v shared-data:/data

# Add containers to pod
podman run -d --pod web-pod --name frontend nginx:alpine
podman run -d --pod web-pod --name backend node:alpine

# List pods
podman pod ls

# Inspect pod
podman pod inspect web-pod

# Pod operations
podman pod start web-pod
podman pod stop web-pod
podman pod restart web-pod
podman pod pause web-pod
podman pod unpause web-pod

# Pod statistics
podman pod stats web-pod

# List containers in pod
podman pod ps web-pod

# Remove pod (stops and removes all containers)
podman pod rm web-pod

# Force remove running pod
podman pod rm -f web-pod

# Prune stopped pods
podman pod prune

# Clone a pod
podman pod clone --name web-pod-clone web-pod