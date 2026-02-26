#!/bin/bash

# Podman First Steps - Basic Operations

# Pull an image
podman pull docker.io/library/alpine:latest

# List images
podman images

# Run a container (interactive)
podman run -it alpine /bin/sh

# Run a container (detached)
podman run -d --name webserver -p 8080:80 nginx:alpine

# List running containers
podman ps

# List all containers (including stopped)
podman ps -a

# Stop a container
podman stop webserver

# Start a stopped container
podman start webserver

# Remove a container
podman rm webserver

# Remove an image
podman rmi alpine:latest

# Create alias for Docker compatibility
alias docker=podman

# Check system info
podman info

# Check version
podman version