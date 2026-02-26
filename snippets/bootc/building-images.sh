#!/bin/bash
# bootc Container Image Building Examples

echo "=== bootc Container Image Building Guide ==="

# Create basic Containerfile examples
echo "=== Basic Containerfile Examples ==="

# Simple bootc image with additional packages
cat > /tmp/Containerfile.basic << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install additional system packages
RUN dnf install -y \
    vim \
    git \
    htop \
    curl \
    wget \
    tmux \
    && dnf clean all

# Enable SSH for remote access
RUN systemctl enable sshd

# Create a system user
RUN useradd -m -G wheel admin

# Configure SSH key (replace with your public key)
RUN mkdir -p /home/admin/.ssh && \
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMJ..." > /home/admin/.ssh/authorized_keys && \
    chown -R admin:admin /home/admin/.ssh && \
    chmod 700 /home/admin/.ssh && \
    chmod 600 /home/admin/.ssh/authorized_keys

# Verify image integrity
RUN bootc container lint
EOF

echo "Created basic Containerfile: /tmp/Containerfile.basic"

# Web server bootc image
cat > /tmp/Containerfile.webserver << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install web server and dependencies
RUN dnf install -y \
    nginx \
    certbot \
    python3-certbot-nginx \
    && dnf clean all

# Configure nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Create web content directory
RUN mkdir -p /var/www/html
COPY index.html /var/www/html/

# Enable services
RUN systemctl enable nginx
RUN systemctl enable certbot-renew.timer

# Create nginx user and set permissions
RUN chown -R nginx:nginx /var/www/html

# Lint the container
RUN bootc container lint
EOF

echo "Created web server Containerfile: /tmp/Containerfile.webserver"

# Multi-stage build example
cat > /tmp/Containerfile.multistage << 'EOF'
# Build stage for custom application
FROM registry.fedoraproject.org/fedora:40 AS builder

# Install build dependencies
RUN dnf install -y \
    gcc \
    make \
    cmake \
    git \
    && dnf clean all

# Build custom application
WORKDIR /build
COPY src/ ./src/
RUN make -C src install DESTDIR=/install

# Runtime stage
FROM quay.io/fedora/fedora-bootc:40

# Copy built application from builder stage
COPY --from=builder /install /

# Install runtime dependencies only
RUN dnf install -y \
    libssl \
    libcurl \
    && dnf clean all

# Configure application service
COPY myapp.service /etc/systemd/system/
RUN systemctl enable myapp.service

# Lint the final image
RUN bootc container lint
EOF

echo "Created multi-stage Containerfile: /tmp/Containerfile.multistage"

# Development environment image
cat > /tmp/Containerfile.development << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install development tools
RUN dnf install -y \
    gcc \
    g++ \
    make \
    cmake \
    git \
    vim \
    emacs \
    python3 \
    python3-pip \
    nodejs \
    npm \
    golang \
    rustc \
    cargo \
    && dnf clean all

# Install development utilities
RUN dnf install -y \
    strace \
    gdb \
    valgrind \
    perf \
    htop \
    tree \
    jq \
    && dnf clean all

# Configure development environment
RUN useradd -m -G wheel developer
RUN echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set up development directories
RUN mkdir -p /workspace && chown developer:developer /workspace

# Install container development tools
RUN dnf install -y podman buildah skopeo && dnf clean all

# Enable helpful services
RUN systemctl enable sshd

RUN bootc container lint
EOF

echo "Created development Containerfile: /tmp/Containerfile.development"

# Building images with podman
echo "=== Building bootc Images ==="

# Build basic image
echo "Building basic bootc image:"
echo "podman build -f /tmp/Containerfile.basic -t mybuild:basic ."

# Build with specific context
echo "Building with context directory:"
echo "podman build -f Containerfile -t myorg/myimage:v1.0 /path/to/context"

# Build with build arguments
echo "Building with build arguments:"
cat > /tmp/Containerfile.args << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

ARG ENVIRONMENT=production
ARG VERSION=1.0

# Environment-specific packages
RUN if [ "$ENVIRONMENT" = "development" ]; then \
        dnf install -y vim git htop; \
    fi && dnf clean all

# Label the image
LABEL version="$VERSION"
LABEL environment="$ENVIRONMENT"

RUN bootc container lint
EOF

echo "Build with arguments:"
echo "podman build --build-arg ENVIRONMENT=development --build-arg VERSION=1.1 -f /tmp/Containerfile.args -t myimage:dev ."

# Testing and validation
echo "=== Testing and Validation ==="

# Test image lint
echo "Testing image with bootc lint:"
echo "podman run --rm myimage:latest bootc container lint"

# Test image structure
echo "Inspecting image structure:"
echo "podman inspect myimage:latest"

# Test running image in container
echo "Test run image in container:"
echo "podman run --rm -it myimage:latest /bin/bash"

# Image deployment preparation
echo "=== Image Deployment Preparation ==="

# Push to registry
echo "Pushing image to registry:"
echo "podman push myimage:latest quay.io/myorg/myimage:latest"

# Tag for different environments
echo "Tagging for environments:"
echo "podman tag myimage:latest quay.io/myorg/myimage:production"
echo "podman tag myimage:latest quay.io/myorg/myimage:staging"

# Advanced building techniques
echo "=== Advanced Building Techniques ==="

# Build with secrets
cat > /tmp/build-with-secrets.sh << 'EOF'
#!/bin/bash
# Build bootc image with secrets

# Create secret file
echo "secret-api-key-here" > /tmp/api-key

# Build with secret mount
podman build \
    --secret id=api-key,src=/tmp/api-key \
    -f Containerfile.secrets \
    -t myimage:with-secrets .

# Clean up secret
rm /tmp/api-key
EOF

chmod +x /tmp/build-with-secrets.sh
echo "Created secret build script: /tmp/build-with-secrets.sh"

# Build with custom base image selection
cat > /tmp/Containerfile.baseselection << 'EOF'
ARG BASE_IMAGE=quay.io/fedora/fedora-bootc:40
FROM ${BASE_IMAGE}

# Common configuration regardless of base
RUN dnf install -y curl wget && dnf clean all

# Base-specific configuration
RUN if grep -q "fedora" /etc/os-release; then \
        dnf install -y fedora-specific-package; \
    elif grep -q "rhel" /etc/os-release; then \
        dnf install -y rhel-specific-package; \
    fi && dnf clean all

RUN bootc container lint
EOF

echo "Build with custom base:"
echo "podman build --build-arg BASE_IMAGE=quay.io/centos-bootc/centos-bootc:stream9 -t myimage:centos ."

# Configuration management examples
echo "=== Configuration Management Examples ==="

# Containerfile with external configuration
cat > /tmp/Containerfile.config << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Copy base configuration
COPY etc/ /etc/
COPY usr/ /usr/

# Install configuration packages
RUN dnf install -y \
    $(cat /tmp/package-list.txt) \
    && dnf clean all

# Enable configured services
RUN systemctl enable $(cat /tmp/services-list.txt | tr '\n' ' ')

# Apply configuration scripts
RUN /usr/local/bin/apply-config.sh

RUN bootc container lint
EOF

# Create example configuration files
mkdir -p /tmp/config-example/{etc,usr/local/bin}

cat > /tmp/config-example/package-list.txt << 'EOF'
nginx
postgresql
redis
EOF

cat > /tmp/config-example/services-list.txt << 'EOF'
nginx.service
postgresql.service
redis.service
EOF

cat > /tmp/config-example/usr/local/bin/apply-config.sh << 'EOF'
#!/bin/bash
# Configuration application script

# Set up database
systemctl enable postgresql
su - postgres -c "initdb -D /var/lib/postgresql/data"

# Configure nginx
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Set file permissions
chown -R nginx:nginx /var/www
chmod -R 755 /var/www
EOF

chmod +x /tmp/config-example/usr/local/bin/apply-config.sh

echo "Created configuration example in /tmp/config-example/"

# Image optimization techniques
echo "=== Image Optimization Techniques ==="

# Optimized Containerfile with layer efficiency
cat > /tmp/Containerfile.optimized << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Combine RUN commands to reduce layers
RUN dnf install -y \
        # Base utilities
        vim git curl wget \
        # Development tools
        gcc make cmake \
        # Runtime libraries
        openssl-libs libcurl \
    # Clean up in same layer
    && dnf clean all \
    # Remove unnecessary files
    && rm -rf /var/cache/dnf \
    && rm -rf /tmp/*

# Copy and configure in efficient order
COPY config/services/ /etc/systemd/system/
COPY config/nginx/ /etc/nginx/
COPY config/scripts/ /usr/local/bin/

# Single RUN for all configuration
RUN chmod +x /usr/local/bin/*.sh \
    && systemctl enable nginx postgresql \
    && /usr/local/bin/setup.sh \
    && bootc container lint
EOF

echo "Created optimized Containerfile: /tmp/Containerfile.optimized"

# Containerfile best practices summary
cat > /tmp/containerfile-best-practices.md << 'EOF'
# bootc Containerfile Best Practices

## Layer Optimization
- Combine related RUN commands
- Clean package caches in same layer
- Order commands by change frequency

## Security
- Don't run as root when possible
- Use specific package versions
- Remove unnecessary packages and files
- Validate with bootc container lint

## Configuration
- Use COPY for configuration files
- Enable services with systemctl enable
- Avoid dynamic configuration in containers
- Use build arguments for variations

## Testing
- Always run bootc container lint
- Test in isolated environment
- Validate service functionality
- Check system integration
EOF

echo "Created best practices guide: /tmp/containerfile-best-practices.md"

# CI/CD pipeline example
cat > /tmp/bootc-ci-pipeline.yml << 'EOF'
# Example GitHub Actions workflow for bootc images
name: Build and Deploy bootc Image

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Podman
        run: |
          sudo apt-get update
          sudo apt-get install -y podman

      - name: Build bootc image
        run: |
          podman build -t myorg/myimage:${{ github.sha }} .

      - name: Test image
        run: |
          podman run --rm myorg/myimage:${{ github.sha }} bootc container lint

      - name: Login to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | \
            podman login -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin quay.io

      - name: Push image
        if: github.ref == 'refs/heads/main'
        run: |
          podman push myorg/myimage:${{ github.sha }}
          podman tag myorg/myimage:${{ github.sha }} myorg/myimage:latest
          podman push myorg/myimage:latest

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          # Trigger deployment pipeline
          curl -X POST ${{ secrets.DEPLOY_WEBHOOK_URL }} \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -d '{"image": "myorg/myimage:${{ github.sha }}", "environment": "staging"}'
EOF

echo "Created CI/CD pipeline example: /tmp/bootc-ci-pipeline.yml"

echo "Image building examples completed!"
echo "Files created in /tmp/ - copy to your project as needed"
echo "Build images with: podman build -f <Containerfile> -t <tag> ."