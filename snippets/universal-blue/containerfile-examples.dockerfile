# Universal Blue Containerfile Examples
# Collection of Containerfile configurations for different use cases

# Basic Custom Universal Blue Image
ARG BASE_IMAGE_NAME="${BASE_IMAGE_NAME:-silverblue}"
ARG IMAGE_FLAVOR="${IMAGE_FLAVOR:-main}"
ARG SOURCE_IMAGE="${SOURCE_IMAGE:-${BASE_IMAGE_NAME}-${IMAGE_FLAVOR}}"
ARG BASE_IMAGE="ghcr.io/ublue-os/${SOURCE_IMAGE}"
ARG FEDORA_MAJOR_VERSION="${FEDORA_MAJOR_VERSION:-40}"

FROM ${BASE_IMAGE}:${FEDORA_MAJOR_VERSION}

# Install essential development tools
RUN rpm-ostree install \
    code \
    git \
    nodejs \
    npm \
    python3-pip \
    golang \
    rust \
    cargo \
    distrobox \
    && ostree container commit

# Copy custom configuration files
COPY system_files/etc /etc/
COPY system_files/usr /usr/

# Run setup scripts
COPY scripts/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && \
    /tmp/setup.sh && \
    rm /tmp/setup.sh && \
    ostree container commit

# ---
# Gaming-Focused Containerfile
FROM ghcr.io/ublue-os/bazzite:40

# Add additional gaming repositories
RUN rpm-ostree install \
    --repo https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
    --repo https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm \
    steam \
    lutris \
    heroic-games-launcher \
    wine \
    winetricks \
    gamemode \
    mangohud \
    && ostree container commit

# Install gaming-specific configurations
COPY gaming_configs/etc/sysctl.d/99-gaming.conf /etc/sysctl.d/
COPY gaming_configs/etc/security/limits.d/99-gaming.conf /etc/security/limits.d/

# Set up gaming optimizations
RUN echo 'vm.max_map_count=2147483642' >> /etc/sysctl.d/99-gaming.conf && \
    echo '@games soft memlock unlimited' >> /etc/security/limits.d/99-gaming.conf && \
    echo '@games hard memlock unlimited' >> /etc/security/limits.d/99-gaming.conf && \
    ostree container commit

# ---
# Developer Workstation Containerfile
FROM ghcr.io/ublue-os/aurora:40

# Install additional development tools
RUN rpm-ostree install \
    docker \
    docker-compose \
    kubernetes \
    helm \
    terraform \
    ansible \
    vagrant \
    && ostree container commit

# Install development language support
RUN rpm-ostree install \
    java-17-openjdk-devel \
    maven \
    gradle \
    php \
    composer \
    ruby \
    rubygems \
    && ostree container commit

# Copy development environment configurations
COPY dev_configs/etc/profile.d/development.sh /etc/profile.d/
COPY dev_configs/etc/environment.d/99-development.conf /etc/environment.d/

# Set up development environment
RUN mkdir -p /opt/dev-tools && \
    curl -fsSL https://get.docker.com | sh && \
    ostree container commit

# ---
# Security-Hardened Containerfile
FROM ghcr.io/ublue-os/silverblue-main:40

# Install security tools
RUN rpm-ostree install \
    firejail \
    apparmor-utils \
    clamav \
    clamav-update \
    rkhunter \
    chkrootkit \
    aide \
    fail2ban \
    && ostree container commit

# Apply security configurations
COPY security_configs/etc/apparmor.d/ /etc/apparmor.d/
COPY security_configs/etc/sysctl.d/99-security.conf /etc/sysctl.d/
COPY security_configs/etc/modprobe.d/99-security.conf /etc/modprobe.d/

# Enable security services
RUN systemctl enable apparmor && \
    systemctl enable fail2ban && \
    systemctl enable clamav-freshclam && \
    ostree container commit

# Configure security hardening
RUN echo 'kernel.dmesg_restrict=1' >> /etc/sysctl.d/99-security.conf && \
    echo 'kernel.kptr_restrict=2' >> /etc/sysctl.d/99-security.conf && \
    echo 'net.ipv4.conf.all.send_redirects=0' >> /etc/sysctl.d/99-security.conf && \
    ostree container commit

# ---
# Multimedia Content Creation Containerfile
FROM ghcr.io/ublue-os/kinoite-main:40

# Add multimedia repositories
RUN rpm-ostree install \
    --repo https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
    --repo https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm \
    ffmpeg \
    obs-studio \
    blender \
    gimp \
    inkscape \
    audacity \
    kdenlive \
    && ostree container commit

# Install multimedia codecs and plugins
RUN rpm-ostree install \
    gstreamer1-plugins-ugly \
    gstreamer1-plugins-bad-free \
    gstreamer1-plugins-good \
    gstreamer1-vaapi \
    intel-media-driver \
    libva-intel-driver \
    && ostree container commit

# Configure multimedia optimizations
COPY multimedia_configs/etc/profile.d/multimedia.sh /etc/profile.d/
RUN echo 'export LIBVA_DRIVER_NAME=iHD' >> /etc/profile.d/multimedia.sh && \
    ostree container commit

# ---
# Minimal Server Containerfile
FROM ghcr.io/ublue-os/base:40

# Install minimal server packages
RUN rpm-ostree install \
    podman \
    buildah \
    skopeo \
    htop \
    tmux \
    vim \
    git \
    curl \
    wget \
    rsync \
    && ostree container commit

# Remove desktop components (if any)
RUN rpm-ostree override remove \
    firefox \
    gnome-tour \
    gnome-getting-started-docs \
    || true && \
    ostree container commit

# Configure server optimizations
COPY server_configs/etc/ssh/sshd_config.d/99-server.conf /etc/ssh/sshd_config.d/
COPY server_configs/etc/systemd/journald.conf.d/99-server.conf /etc/systemd/journald.conf.d/

# Enable server services
RUN systemctl enable sshd && \
    systemctl disable bluetooth && \
    systemctl disable NetworkManager-wifi && \
    ostree container commit

# ---
# Custom Kernel Containerfile
FROM ghcr.io/ublue-os/silverblue-main:40

# Add custom kernel repository
RUN rpm-ostree install \
    --repo https://copr.fedorainfracloud.org/coprs/dwalluck/kernel-fsync/repo/fedora-$(rpm -E %fedora)/dwalluck-kernel-fsync-fedora-$(rpm -E %fedora).repo \
    kernel-fsync \
    kernel-fsync-devel \
    && ostree container commit

# Configure custom kernel parameters
COPY kernel_configs/etc/dracut.conf.d/99-custom.conf /etc/dracut.conf.d/
COPY kernel_configs/etc/modprobe.d/99-custom.conf /etc/modprobe.d/

# Rebuild initramfs with custom configuration
RUN dracut --force --regenerate-all && \
    ostree container commit