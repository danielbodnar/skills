# minimal-base.dockerfile - Minimal Arch Linux base container for infrastructure

FROM archlinux:latest

# Metadata
LABEL maintainer="infrastructure@example.com"
LABEL description="Minimal Arch Linux base for infrastructure services"
LABEL version="1.0"

# Set non-interactive frontend
ENV DEBIAN_FRONTEND=noninteractive

# Update package database and install essential packages
RUN pacman -Syu --noconfirm && \
    pacman -S --needed --noconfirm \
        base-devel \
        git \
        curl \
        wget \
        openssh \
        sudo \
        vim \
        htop \
        tmux \
        bash-completion \
        man-db \
        less \
        which \
        procps-ng \
        util-linux \
        iputils \
        iproute2 && \
    pacman -Scc --noconfirm

# Create infrastructure user
RUN useradd -m -G wheel -s /bin/bash infra && \
    echo 'infra:infra' | chpasswd && \
    echo '%wheel ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Configure SSH
RUN ssh-keygen -A && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Set up locale
RUN echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen && \
    locale-gen && \
    echo 'LANG=en_US.UTF-8' > /etc/locale.conf

# Create common directories
RUN mkdir -p /opt/services /var/log/services /etc/services

# Set working directory
WORKDIR /opt/services

# Default user
USER infra

# Expose SSH port
EXPOSE 22

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep -f sshd || exit 1

# Default command
CMD ["/usr/bin/bash"]

# Build and usage instructions
# docker build -t arch-minimal -f minimal-base.dockerfile .
# docker run -it --name arch-base arch-minimal
# docker run -d -p 2222:22 --name arch-ssh arch-minimal /usr/sbin/sshd -D