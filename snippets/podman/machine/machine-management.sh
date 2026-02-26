#!/bin/bash

# Podman Machine Management (macOS/Windows)

# Initialize a new machine
podman machine init

# Initialize with custom settings
podman machine init --cpus 4 --memory 8192 --disk-size 100

# List machines
podman machine list

# Start machine
podman machine start

# Stop machine
podman machine stop

# SSH into machine
podman machine ssh

# Set machine to rootful mode
podman machine set --rootful

# Set machine to rootless mode  
podman machine set --rootful=false

# Inspect machine
podman machine inspect

# Remove machine
podman machine rm

# Create named machine
podman machine init mydevmachine --cpus 2 --memory 4096

# Start specific machine
podman machine start mydevmachine

# Set default machine
podman system connection default mydevmachine-root

# Machine with custom image
podman machine init --image-path /path/to/custom.qcow2 custommachine

# Reset machine
podman machine stop
podman machine rm
podman machine init