#!/bin/bash

# Systemd Integration Examples

# Generate systemd unit files for container
podman generate systemd --new --name mycontainer > ~/.config/systemd/user/mycontainer.service

# Generate systemd unit files for pod
podman generate systemd --new --name mypod > ~/.config/systemd/user/pod-mypod.service

# Advanced systemd generation
podman generate systemd \
  --new \
  --files \
  --name myapp \
  --restart-policy=always \
  --start-timeout=30 \
  --stop-timeout=30

# Create systemd user directories
mkdir -p ~/.config/systemd/user
mkdir -p ~/.config/containers/systemd

# Reload systemd user daemon
systemctl --user daemon-reload

# Enable and start service
systemctl --user enable mycontainer.service
systemctl --user start mycontainer.service

# Check service status
systemctl --user status mycontainer.service

# View logs
journalctl --user -u mycontainer.service -f

# Enable lingering (start services at boot)
sudo loginctl enable-linger $USER

# Quadlet container file example
cat > ~/.config/containers/systemd/webapp.container << EOF
[Unit]
Description=Web Application
After=network-online.target
Wants=network-online.target

[Container]
Image=nginx:alpine
PublishPort=8080:80
Volume=webapp-data:/usr/share/nginx/html
Environment=ENV=production

[Service]
Restart=always
TimeoutStartSec=900

[Install]
WantedBy=default.target
EOF

# Systemd reload for Quadlet
systemctl --user daemon-reload