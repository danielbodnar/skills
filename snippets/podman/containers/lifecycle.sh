#!/bin/bash

# Container Lifecycle Management

# Create a container without starting it
podman create --name myapp alpine sleep 3600

# Initialize a container (prepare for start)
podman init myapp

# Start the container
podman start myapp

# Execute commands in running container
podman exec -it myapp /bin/sh
podman exec myapp ps aux

# Pause/unpause container
podman pause myapp
podman unpause myapp

# Restart container
podman restart myapp

# Stop container (graceful)
podman stop myapp

# Kill container (forceful)
podman kill myapp

# Remove container
podman rm myapp

# Remove container and its volumes
podman rm -v myapp

# Prune stopped containers
podman container prune

# Clone a container
podman container clone --name myapp-clone myapp