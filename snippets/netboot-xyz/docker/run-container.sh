#!/bin/bash
# Run netboot.xyz Docker container

# Pull latest image
docker pull ghcr.io/netbootxyz/netbootxyz

# Run container with all options
docker run -d \
  --name=netbootxyz \
  -e MENU_VERSION=2.0.84             # optional: specific version \
  -e NGINX_PORT=80                   # optional: nginx port \
  -e WEB_APP_PORT=3000               # optional: web interface port \
  -e TFTPD_OPTS='--tftp-single-port' # optional: TFTP configuration \
  -p 3000:3000                       # web configuration interface \
  -p 69:69/udp                       # TFTP port \
  -p 8080:80                         # nginx asset server \
  -v /local/path/to/config:/config   # configuration storage \
  -v /local/path/to/assets:/assets   # asset storage \
  --restart unless-stopped \
  ghcr.io/netbootxyz/netbootxyz

# Check container status
docker logs -f netbootxyz