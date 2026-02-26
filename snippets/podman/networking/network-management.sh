#!/bin/bash

# Network Management

# List networks
podman network ls

# Create custom network
podman network create mynetwork

# Create network with custom subnet
podman network create --subnet=192.168.100.0/24 \
  --gateway=192.168.100.1 \
  --ip-range=192.168.100.128/25 \
  custom-net

# Create network with custom driver
podman network create --driver bridge \
  --opt com.docker.network.bridge.name=mybr0 \
  mybrige

# Inspect network
podman network inspect mynetwork

# Connect container to network
podman network connect mynetwork container1

# Connect with static IP
podman network connect --ip 192.168.100.10 mynetwork container1

# Connect with alias
podman network connect --alias web1 --alias frontend mynetwork container1

# Disconnect container from network
podman network disconnect mynetwork container1

# Remove network
podman network rm mynetwork

# Prune unused networks
podman network prune

# Run container with custom network
podman run -d --name networked-app \
  --network mynetwork \
  --ip 192.168.100.20 \
  nginx:alpine