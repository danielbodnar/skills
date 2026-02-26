#!/bin/bash

# Advanced Container Options

# Resource limits
podman run -d --name resource-limited \
  --memory=512m \
  --cpus=1.5 \
  --pids-limit=100 \
  nginx:alpine

# Environment variables
podman run -d --name env-demo \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --env-file .env \
  node:alpine

# Volume mounts
podman run -d --name volume-demo \
  -v /host/data:/container/data:Z \
  -v named-volume:/app/data \
  --tmpfs /tmp \
  alpine

# Network configuration
podman run -d --name network-demo \
  --network=host \
  -p 8080:80 \
  --expose 443 \
  nginx:alpine

# Security options
podman run -d --name secure-container \
  --user 1000:1000 \
  --read-only \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges \
  nginx:alpine

# Working directory and entrypoint
podman run -d --name custom-start \
  --workdir /app \
  --entrypoint=/custom-script.sh \
  myapp:latest

# Device access
podman run -d --name device-access \
  --device /dev/sda:/dev/sda:rwm \
  --privileged \
  system-tool:latest