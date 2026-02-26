#!/bin/bash
# bootc Advanced Patterns and Use Cases

set -euo pipefail

echo "=== bootc Advanced Patterns and Use Cases ==="

# Blue/Green Deployment Pattern
echo "=== Blue/Green Deployment Pattern ==="

cat > /tmp/blue-green-deploy.sh << 'EOF'
#!/bin/bash
# Blue/Green deployment script for bootc systems

set -euo pipefail

BLUE_IMAGE="quay.io/myorg/myapp:blue"
GREEN_IMAGE="quay.io/myorg/myapp:green"
CURRENT_IMAGE=""

# Get current image
get_current_image() {
    CURRENT_IMAGE=$(bootc status --json | jq -r '.status.booted.image.imageReference')
    echo "Current image: $CURRENT_IMAGE"
}

# Deploy to blue environment
deploy_blue() {
    echo "Deploying to BLUE environment..."
    bootc switch --retain "$BLUE_IMAGE"
    echo "Blue deployment staged. Reboot to activate."
}

# Deploy to green environment
deploy_green() {
    echo "Deploying to GREEN environment..."
    bootc switch --retain "$GREEN_IMAGE"
    echo "Green deployment staged. Reboot to activate."
}

# Rollback to previous deployment
rollback() {
    echo "Rolling back to previous deployment..."
    bootc rollback
    echo "Rollback staged. Reboot to activate."
}

# Health check function
health_check() {
    local image="$1"
    echo "Performing health check for $image..."
    
    # Check if critical services are running
    if systemctl is-active --quiet nginx postgresql redis; then
        echo "✓ Core services are running"
    else
        echo "✗ Some core services are not running"
        return 1
    fi
    
    # Check application endpoint
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        echo "✓ Application health check passed"
    else
        echo "✗ Application health check failed"
        return 1
    fi
    
    return 0
}

# Main deployment logic
case "${1:-status}" in
    blue)
        deploy_blue
        ;;
    green)
        deploy_green
        ;;
    rollback)
        rollback
        ;;
    status)
        get_current_image
        ;;
    health)
        get_current_image
        health_check "$CURRENT_IMAGE"
        ;;
    *)
        echo "Usage: $0 {blue|green|rollback|status|health}"
        exit 1
        ;;
esac
EOF

chmod +x /tmp/blue-green-deploy.sh
echo "Created blue/green deployment script: /tmp/blue-green-deploy.sh"

# Logically Bound Images Pattern
echo "=== Logically Bound Images Pattern ==="

cat > /tmp/Containerfile.bound-images << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install Podman and systemd for container management
RUN dnf install -y podman systemd-container && dnf clean all

# Copy Podman Quadlet files for application containers
COPY app1.image /usr/share/containers/systemd/app1.image
COPY app1.container /usr/share/containers/systemd/app1.container
COPY app2.image /usr/share/containers/systemd/app2.image
COPY app2.container /usr/share/containers/systemd/app2.container

# Create symlinks to bind images to bootc
RUN ln -s /usr/share/containers/systemd/app1.image \
      /usr/lib/bootc/bound-images.d/app1.image && \
    ln -s /usr/share/containers/systemd/app1.container \
      /usr/lib/bootc/bound-images.d/app1.container && \
    ln -s /usr/share/containers/systemd/app2.image \
      /usr/lib/bootc/bound-images.d/app2.image && \
    ln -s /usr/share/containers/systemd/app2.container \
      /usr/lib/bootc/bound-images.d/app2.container

# Enable user services for containers
RUN systemctl --global enable app1.service app2.service

# Lint the container
RUN bootc container lint
EOF

# Create example Quadlet files
cat > /tmp/app1.image << 'EOF'
[Image]
Image=quay.io/myorg/webapp:latest
EOF

cat > /tmp/app1.container << 'EOF'
[Unit]
Description=Web Application Container
After=network-online.target
Wants=network-online.target

[Container]
Image=webapp.image
Network=host
Volume=/var/log/webapp:/var/log/webapp:Z

[Service]
Restart=always
TimeoutStartSec=300
TimeoutStopSec=30

[Install]
WantedBy=default.target
EOF

echo "Created logically bound images example files"

# Air-gapped Deployment Pattern
echo "=== Air-gapped Deployment Pattern ==="

cat > /tmp/airgap-export.sh << 'EOF'
#!/bin/bash
# Export bootc images for air-gapped deployment

set -euo pipefail

IMAGES=(
    "quay.io/myorg/myapp:v1.0"
    "quay.io/myorg/myapp:v1.1"
    "quay.io/myorg/database:v2.0"
)

EXPORT_DIR="/mnt/usb/bootc-images"

# Create export directory
mkdir -p "$EXPORT_DIR"

echo "Exporting bootc images for air-gapped deployment..."

for image in "${IMAGES[@]}"; do
    echo "Exporting $image..."
    
    # Create safe filename
    safe_name=$(echo "$image" | tr '/:' '__')
    
    # Export to OCI format
    skopeo copy "docker://$image" "oci:$EXPORT_DIR/$safe_name.oci"
    
    # Create metadata file
    cat > "$EXPORT_DIR/$safe_name.metadata" << EOL
image: $image
export_date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
exported_by: $(whoami)@$(hostname)
oci_path: $safe_name.oci
EOL
    
    echo "✓ Exported $image"
done

# Create import script
cat > "$EXPORT_DIR/import.sh" << 'EOL'
#!/bin/bash
# Import bootc images in air-gapped environment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Importing bootc images from air-gapped export..."

for metadata in "$SCRIPT_DIR"/*.metadata; do
    if [ -f "$metadata" ]; then
        # Extract image info
        image=$(grep "^image:" "$metadata" | cut -d' ' -f2-)
        oci_path=$(grep "^oci_path:" "$metadata" | cut -d' ' -f2-)
        
        echo "Importing $image..."
        
        # Import to local storage
        podman load -i "$SCRIPT_DIR/$oci_path"
        
        echo "✓ Imported $image"
    fi
done

echo "All images imported successfully!"
EOL

chmod +x "$EXPORT_DIR/import.sh"

echo "✓ Created air-gapped deployment package in $EXPORT_DIR"
echo "Transfer the entire directory to the air-gapped environment"
EOF

chmod +x /tmp/airgap-export.sh
echo "Created air-gapped export script: /tmp/airgap-export.sh"

# Immutable Configuration Pattern
echo "=== Immutable Configuration Pattern ==="

cat > /tmp/Containerfile.immutable-config << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install application packages
RUN dnf install -y nginx postgresql redis && dnf clean all

# Copy all configuration files in one layer
COPY config/nginx/ /etc/nginx/
COPY config/postgresql/ /var/lib/pgsql/
COPY config/redis/ /etc/redis/
COPY config/systemd/ /etc/systemd/system/
COPY config/scripts/ /usr/local/bin/

# Set up configuration in one RUN command
RUN chmod +x /usr/local/bin/*.sh && \
    # Create required directories
    mkdir -p /var/log/myapp /var/lib/myapp && \
    # Set permissions
    chown nginx:nginx /var/log/myapp && \
    chown postgres:postgres /var/lib/pgsql && \
    # Enable services
    systemctl enable nginx postgresql redis myapp && \
    # Apply configurations
    /usr/local/bin/setup-config.sh && \
    # Validate configuration
    nginx -t && \
    # Final lint check
    bootc container lint

# Application-specific configurations are immutable
# Runtime data goes to /var and /etc for site-specific overrides
EOF

# Create example configuration structure
mkdir -p /tmp/config-structure/{nginx,postgresql,redis,systemd,scripts}

cat > /tmp/config-structure/nginx/nginx.conf << 'EOF'
# Immutable nginx configuration
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Include site-specific configurations from /etc
    include /etc/nginx/conf.d/*.conf;
}
EOF

cat > /tmp/config-structure/scripts/setup-config.sh << 'EOF'
#!/bin/bash
# Configuration setup script

set -euo pipefail

# Initialize PostgreSQL data directory
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
    su - postgres -c "initdb -D /var/lib/pgsql/data"
fi

# Set up log rotation
cat > /etc/logrotate.d/myapp << 'EOL'
/var/log/myapp/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 nginx nginx
}
EOL

echo "Configuration setup completed"
EOF

chmod +x /tmp/config-structure/scripts/setup-config.sh
echo "Created immutable configuration example structure"

# Multi-Environment Deployment Pattern
echo "=== Multi-Environment Deployment Pattern ==="

cat > /tmp/Containerfile.multi-env << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Build argument for environment
ARG ENVIRONMENT=production
ARG CONFIG_VERSION=latest

# Install base packages
RUN dnf install -y nginx nodejs npm && dnf clean all

# Copy environment-specific configuration
COPY config/${ENVIRONMENT}/ /etc/myapp/
COPY config/common/ /etc/myapp/common/

# Install environment-specific packages
RUN if [ "$ENVIRONMENT" = "development" ]; then \
        dnf install -y vim git strace gdb && dnf clean all; \
    elif [ "$ENVIRONMENT" = "staging" ]; then \
        dnf install -y monitoring-tools && dnf clean all; \
    fi

# Configure based on environment
RUN /etc/myapp/setup-${ENVIRONMENT}.sh

# Label the image with environment info
LABEL environment="$ENVIRONMENT"
LABEL config.version="$CONFIG_VERSION"
LABEL build.date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

RUN bootc container lint
EOF

# Create environment-specific build script
cat > /tmp/build-multi-env.sh << 'EOF'
#!/bin/bash
# Build images for multiple environments

set -euo pipefail

ENVIRONMENTS=("development" "staging" "production")
BASE_TAG="quay.io/myorg/myapp"
VERSION="${1:-latest}"

for env in "${ENVIRONMENTS[@]}"; do
    echo "Building image for $env environment..."
    
    podman build \
        --build-arg ENVIRONMENT="$env" \
        --build-arg CONFIG_VERSION="$VERSION" \
        -f Containerfile.multi-env \
        -t "$BASE_TAG:$env-$VERSION" \
        -t "$BASE_TAG:$env-latest" \
        .
    
    echo "✓ Built $BASE_TAG:$env-$VERSION"
done

echo "All environment images built successfully!"
EOF

chmod +x /tmp/build-multi-env.sh
echo "Created multi-environment build script: /tmp/build-multi-env.sh"

# Monitoring and Observability Pattern
echo "=== Monitoring and Observability Pattern ==="

cat > /tmp/Containerfile.monitoring << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install monitoring and observability tools
RUN dnf install -y \
    prometheus-node-exporter \
    grafana-agent \
    rsyslog \
    logrotate \
    && dnf clean all

# Copy monitoring configurations
COPY monitoring/node-exporter.service /etc/systemd/system/
COPY monitoring/grafana-agent.yml /etc/grafana-agent/
COPY monitoring/rsyslog.conf /etc/rsyslog.d/
COPY monitoring/logrotate.conf /etc/logrotate.d/

# Create monitoring user
RUN useradd -r -s /bin/false monitoring

# Set up monitoring directories and permissions
RUN mkdir -p /var/log/monitoring /var/lib/monitoring && \
    chown monitoring:monitoring /var/log/monitoring /var/lib/monitoring

# Enable monitoring services
RUN systemctl enable \
    prometheus-node-exporter \
    grafana-agent \
    rsyslog

# Create health check endpoint
COPY monitoring/health-check.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/health-check.sh

RUN bootc container lint
EOF

cat > /tmp/health-check.sh << 'EOF'
#!/bin/bash
# System health check script

set -euo pipefail

# Check critical services
SERVICES=("nginx" "postgresql" "redis")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "✓ $service is running"
    else
        echo "✗ $service is not running"
        ALL_HEALTHY=false
    fi
done

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✓ Disk usage is acceptable ($DISK_USAGE%)"
else
    echo "✗ Disk usage is high ($DISK_USAGE%)"
    ALL_HEALTHY=false
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE < 90" | bc -l) )); then
    echo "✓ Memory usage is acceptable ($MEMORY_USAGE%)"
else
    echo "✗ Memory usage is high ($MEMORY_USAGE%)"
    ALL_HEALTHY=false
fi

if [ "$ALL_HEALTHY" = true ]; then
    echo "✓ All health checks passed"
    exit 0
else
    echo "✗ Some health checks failed"
    exit 1
fi
EOF

chmod +x /tmp/health-check.sh
echo "Created monitoring and health check examples"

# Security Hardening Pattern
echo "=== Security Hardening Pattern ==="

cat > /tmp/Containerfile.hardened << 'EOF'
FROM quay.io/fedora/fedora-bootc:40

# Install security tools
RUN dnf install -y \
    aide \
    fail2ban \
    firewalld \
    selinux-policy-targeted \
    && dnf clean all

# Remove unnecessary packages and services
RUN dnf remove -y \
    telnet \
    rsh \
    rlogin \
    && dnf clean all

# Copy security configurations
COPY security/aide.conf /etc/aide/
COPY security/fail2ban/ /etc/fail2ban/
COPY security/firewalld/ /etc/firewalld/
COPY security/selinux/ /etc/selinux/

# Harden SSH configuration
COPY security/sshd_config /etc/ssh/sshd_config

# Set up security users and groups
RUN useradd -r -s /bin/false security-monitor

# Configure file permissions and ownership
RUN chmod 600 /etc/ssh/sshd_config && \
    chown root:root /etc/ssh/sshd_config && \
    chmod 644 /etc/aide/aide.conf && \
    chown root:root /etc/aide/aide.conf

# Enable security services
RUN systemctl enable \
    aide \
    fail2ban \
    firewalld \
    auditd

# Initialize AIDE database
RUN aide --init && mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Set SELinux contexts
RUN restorecon -R /etc/ssh /etc/fail2ban /etc/firewalld

RUN bootc container lint
EOF

cat > /tmp/security-hardening.sh << 'EOF'
#!/bin/bash
# Security hardening script for bootc systems

set -euo pipefail

echo "Applying security hardening..."

# Configure firewall rules
firewall-cmd --permanent --set-default-zone=public
firewall-cmd --permanent --zone=public --add-service=ssh
firewall-cmd --permanent --zone=public --add-service=http
firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --reload

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Set up log monitoring
systemctl enable auditd
systemctl start auditd

# Run security scan
aide --check || echo "AIDE check completed with findings"

echo "Security hardening applied successfully"
EOF

chmod +x /tmp/security-hardening.sh
echo "Created security hardening examples"

# Testing and Validation Pattern
echo "=== Testing and Validation Pattern ==="

cat > /tmp/test-bootc-image.sh << 'EOF'
#!/bin/bash
# Comprehensive bootc image testing script

set -euo pipefail

IMAGE="$1"
TEST_RESULTS_DIR="/tmp/bootc-test-results"

if [ -z "$IMAGE" ]; then
    echo "Usage: $0 <image-reference>"
    exit 1
fi

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

echo "Testing bootc image: $IMAGE"

# Test 1: Basic container lint
echo "=== Test 1: Container Lint ==="
if podman run --rm "$IMAGE" bootc container lint; then
    echo "✓ Container lint passed" | tee "$TEST_RESULTS_DIR/lint.result"
else
    echo "✗ Container lint failed" | tee "$TEST_RESULTS_DIR/lint.result"
fi

# Test 2: Image structure validation
echo "=== Test 2: Image Structure ==="
podman inspect "$IMAGE" > "$TEST_RESULTS_DIR/image-inspect.json"

if jq -r '.[]' "$TEST_RESULTS_DIR/image-inspect.json" >/dev/null 2>&1; then
    echo "✓ Image structure is valid" | tee "$TEST_RESULTS_DIR/structure.result"
else
    echo "✗ Image structure is invalid" | tee "$TEST_RESULTS_DIR/structure.result"
fi

# Test 3: Service configuration check
echo "=== Test 3: Service Configuration ==="
if podman run --rm "$IMAGE" systemctl list-unit-files --state=enabled > "$TEST_RESULTS_DIR/enabled-services.txt"; then
    echo "✓ Service configuration accessible" | tee "$TEST_RESULTS_DIR/services.result"
    echo "Enabled services:" | tee -a "$TEST_RESULTS_DIR/services.result"
    cat "$TEST_RESULTS_DIR/enabled-services.txt" | tee -a "$TEST_RESULTS_DIR/services.result"
else
    echo "✗ Service configuration check failed" | tee "$TEST_RESULTS_DIR/services.result"
fi

# Test 4: Security scan
echo "=== Test 4: Security Scan ==="
if command -v grype >/dev/null 2>&1; then
    grype "$IMAGE" -o json > "$TEST_RESULTS_DIR/security-scan.json"
    VULNERABILITIES=$(jq '.matches | length' "$TEST_RESULTS_DIR/security-scan.json")
    echo "Found $VULNERABILITIES vulnerabilities" | tee "$TEST_RESULTS_DIR/security.result"
else
    echo "Security scanner not available, skipping" | tee "$TEST_RESULTS_DIR/security.result"
fi

# Test 5: Size and layer analysis
echo "=== Test 5: Size and Layer Analysis ==="
podman images "$IMAGE" --format "table {{.Repository}} {{.Tag}} {{.Size}}" > "$TEST_RESULTS_DIR/size.txt"
podman history "$IMAGE" > "$TEST_RESULTS_DIR/layers.txt"
echo "✓ Size and layer analysis completed" | tee "$TEST_RESULTS_DIR/size.result"

# Generate test report
echo "=== Test Report ==="
cat > "$TEST_RESULTS_DIR/report.md" << EOL
# bootc Image Test Report

**Image:** $IMAGE
**Test Date:** $(date)
**Test Host:** $(hostname)

## Test Results

$(for result in "$TEST_RESULTS_DIR"/*.result; do
    echo "- $(basename "$result" .result): $(cat "$result" | head -1)"
done)

## Detailed Results

See individual result files for detailed information:
$(ls -1 "$TEST_RESULTS_DIR"/*.result | sed 's/^/- /')

## Files Generated

$(ls -la "$TEST_RESULTS_DIR")
EOL

echo "Test report generated: $TEST_RESULTS_DIR/report.md"
echo "All test results available in: $TEST_RESULTS_DIR"
EOF

chmod +x /tmp/test-bootc-image.sh
echo "Created comprehensive image testing script: /tmp/test-bootc-image.sh"

echo "=== Advanced Patterns Summary ==="
echo "Files created:"
echo "- /tmp/blue-green-deploy.sh - Blue/green deployment automation"
echo "- /tmp/Containerfile.bound-images - Logically bound images example"
echo "- /tmp/airgap-export.sh - Air-gapped deployment preparation"
echo "- /tmp/Containerfile.immutable-config - Immutable configuration pattern"
echo "- /tmp/build-multi-env.sh - Multi-environment build automation"
echo "- /tmp/Containerfile.monitoring - Monitoring and observability setup"
echo "- /tmp/Containerfile.hardened - Security hardening pattern"
echo "- /tmp/test-bootc-image.sh - Comprehensive image testing"
echo
echo "Advanced patterns completed!"