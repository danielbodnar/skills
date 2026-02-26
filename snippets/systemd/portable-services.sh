#!/bin/bash
# systemd Portable Services Management Examples
# Comprehensive guide for creating and managing portable services

set -euo pipefail

# Portable service configuration
SERVICE_NAME="webapp"
SERVICE_VERSION="1.0"
IMAGE_NAME="${SERVICE_NAME}_${SERVICE_VERSION}"
IMAGE_DIR="/var/lib/portables"
IMAGE_PATH="${IMAGE_DIR}/${IMAGE_NAME}.raw"
IMAGE_SIZE="1G"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create portable service image structure
create_portable_service_structure() {
    log "Creating portable service structure for: ${SERVICE_NAME}"
    
    local work_dir="/tmp/portable-${SERVICE_NAME}"
    
    # Clean up any existing work directory
    sudo rm -rf "${work_dir}"
    mkdir -p "${work_dir}"
    
    # Create basic directory structure
    mkdir -p "${work_dir}"/{usr/bin,usr/lib/systemd/system,etc,var/lib/${SERVICE_NAME}}
    
    # Create os-release file (required for portable services)
    cat << EOF > "${work_dir}/etc/os-release"
NAME="${SERVICE_NAME}"
VERSION="${SERVICE_VERSION}"
ID=${SERVICE_NAME}
VERSION_ID=${SERVICE_VERSION}
PRETTY_NAME="${SERVICE_NAME} ${SERVICE_VERSION}"
ANSI_COLOR="0;34"
HOME_URL="https://example.com/${SERVICE_NAME}"
SUPPORT_URL="https://example.com/${SERVICE_NAME}/support"
BUG_REPORT_URL="https://example.com/${SERVICE_NAME}/bugs"
PORTABLE_PREFIXES="/usr/bin /usr/lib/systemd/system /etc /var/lib/${SERVICE_NAME}"
EOF

    log "Portable service structure created in: ${work_dir}"
    echo "${work_dir}"
}

# Create a simple web application service
create_webapp_service() {
    log "Creating web application portable service"
    
    local work_dir=$(create_portable_service_structure)
    
    # Create simple web server script
    cat << 'EOF' > "${work_dir}/usr/bin/webapp"
#!/bin/bash
# Simple web server for demonstration
PORT=${PORT:-8080}
WEBROOT=${WEBROOT:-/var/lib/webapp/www}

mkdir -p "$WEBROOT"

# Create simple index.html if it doesn't exist
if [[ ! -f "$WEBROOT/index.html" ]]; then
    cat << HTML > "$WEBROOT/index.html"
<!DOCTYPE html>
<html>
<head>
    <title>Portable Service Demo</title>
</head>
<body>
    <h1>Hello from Portable Service!</h1>
    <p>This is a demonstration of systemd portable services.</p>
    <p>Service: webapp</p>
    <p>Version: 1.0</p>
    <p>Started at: $(date)</p>
</body>
</html>
HTML
fi

# Simple HTTP server using netcat
echo "Starting web server on port $PORT"
while true; do
    response="HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n$(cat $WEBROOT/index.html)"
    echo -e "$response" | nc -l -p "$PORT" -q 1
done
EOF

    chmod +x "${work_dir}/usr/bin/webapp"
    
    # Create systemd service unit
    cat << EOF > "${work_dir}/usr/lib/systemd/system/webapp.service"
[Unit]
Description=Web Application Portable Service
Documentation=https://example.com/webapp
After=network.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/bin/webapp
Restart=always
RestartSec=5
User=webapp
Group=webapp
Environment=PORT=8080
Environment=WEBROOT=/var/lib/webapp/www
WorkingDirectory=/var/lib/webapp

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/webapp
PrivateDevices=yes
ProtectControlGroups=yes
ProtectKernelModules=yes
ProtectKernelTunables=yes
RestrictAddressFamilies=AF_INET AF_INET6
RestrictRealtime=yes
SystemCallArchitectures=native

[Install]
WantedBy=multi-user.target
EOF

    # Create configuration file
    cat << EOF > "${work_dir}/etc/webapp.conf"
# Web Application Configuration
PORT=8080
WEBROOT=/var/lib/webapp/www
MAX_CONNECTIONS=100
TIMEOUT=30
EOF

    # Create user creation script (to be run on attach)
    cat << 'EOF' > "${work_dir}/usr/bin/webapp-setup"
#!/bin/bash
# Setup script for webapp service
if ! id webapp >/dev/null 2>&1; then
    useradd -r -s /bin/false -d /var/lib/webapp webapp
fi
mkdir -p /var/lib/webapp/www
chown -R webapp:webapp /var/lib/webapp
EOF

    chmod +x "${work_dir}/usr/bin/webapp-setup"
    
    log "Web application service created"
    echo "${work_dir}"
}

# Create database service
create_database_service() {
    log "Creating database portable service"
    
    local work_dir=$(create_portable_service_structure)
    
    # Update service name for database
    sed -i "s/${SERVICE_NAME}/database/g" "${work_dir}/etc/os-release"
    
    # Create database script (using SQLite for simplicity)
    cat << 'EOF' > "${work_dir}/usr/bin/database"
#!/bin/bash
# Simple database service using SQLite
DB_PATH=${DB_PATH:-/var/lib/database/app.db}
SOCKET_PATH=${SOCKET_PATH:-/var/lib/database/database.sock}

mkdir -p "$(dirname "$DB_PATH")"
mkdir -p "$(dirname "$SOCKET_PATH")"

# Initialize database if it doesn't exist
if [[ ! -f "$DB_PATH" ]]; then
    sqlite3 "$DB_PATH" << SQL
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email) VALUES 
    ('admin', 'admin@example.com'),
    ('user1', 'user1@example.com'),
    ('user2', 'user2@example.com');
SQL
fi

echo "Database service starting..."
echo "Database: $DB_PATH"
echo "Socket: $SOCKET_PATH"

# Simple socket server for database queries
while true; do
    if [[ -S "$SOCKET_PATH" ]]; then
        rm "$SOCKET_PATH"
    fi
    
    # Listen on socket for queries
    nc -U -l "$SOCKET_PATH" | while IFS= read -r query; do
        echo "Executing query: $query"
        sqlite3 "$DB_PATH" "$query" 2>/dev/null || echo "Error executing query"
    done
    
    sleep 1
done
EOF

    chmod +x "${work_dir}/usr/bin/database"
    
    # Create systemd service unit for database
    cat << EOF > "${work_dir}/usr/lib/systemd/system/database.service"
[Unit]
Description=Database Portable Service
Documentation=https://example.com/database
After=local-fs.target
Wants=local-fs.target

[Service]
Type=simple
ExecStart=/usr/bin/database
Restart=always
RestartSec=10
User=database
Group=database
Environment=DB_PATH=/var/lib/database/app.db
Environment=SOCKET_PATH=/var/lib/database/database.sock
WorkingDirectory=/var/lib/database

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/database
PrivateDevices=yes
ProtectControlGroups=yes
ProtectKernelModules=yes
ProtectKernelTunables=yes
RestrictAddressFamilies=AF_UNIX
RestrictRealtime=yes
SystemCallArchitectures=native
MemoryMax=512M

[Install]
WantedBy=multi-user.target
EOF

    # Create database setup script
    cat << 'EOF' > "${work_dir}/usr/bin/database-setup"
#!/bin/bash
# Setup script for database service
if ! id database >/dev/null 2>&1; then
    useradd -r -s /bin/false -d /var/lib/database database
fi
mkdir -p /var/lib/database
chown -R database:database /var/lib/database
EOF

    chmod +x "${work_dir}/usr/bin/database-setup"
    
    log "Database service created"
    echo "${work_dir}"
}

# Package portable service into image
package_portable_service() {
    local work_dir="$1"
    local image_name="$2"
    
    log "Packaging portable service into image: ${image_name}"
    
    sudo mkdir -p "${IMAGE_DIR}"
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    # Create disk image
    sudo dd if=/dev/zero of="${image_path}" bs=1M count=1024 status=progress
    
    # Create filesystem
    sudo mkfs.ext4 "${image_path}"
    
    # Mount and copy files
    local mount_point="/tmp/mount-${image_name}"
    sudo mkdir -p "${mount_point}"
    sudo mount "${image_path}" "${mount_point}"
    
    # Copy service files
    sudo cp -r "${work_dir}"/* "${mount_point}/"
    
    # Unmount
    sudo umount "${mount_point}"
    sudo rmdir "${mount_point}"
    
    # Clean up work directory
    rm -rf "${work_dir}"
    
    log "Portable service packaged: ${image_path}"
}

# Create portable service from directory
create_portable_from_directory() {
    local source_dir="$1"
    local service_name="$2"
    
    log "Creating portable service from directory: ${source_dir}"
    
    local image_path="${IMAGE_DIR}/${service_name}.raw"
    sudo mkdir -p "${IMAGE_DIR}"
    
    # Calculate directory size and add overhead
    local dir_size=$(du -sb "${source_dir}" | cut -f1)
    local image_size=$(( (dir_size / 1024 / 1024 + 100) * 2 )) # Double size with 100MB overhead
    
    # Create disk image
    sudo dd if=/dev/zero of="${image_path}" bs=1M count="${image_size}" status=progress
    
    # Create filesystem
    sudo mkfs.ext4 "${image_path}"
    
    # Mount and copy files
    local mount_point="/tmp/mount-${service_name}"
    sudo mkdir -p "${mount_point}"
    sudo mount "${image_path}" "${mount_point}"
    
    # Copy all files
    sudo cp -r "${source_dir}"/* "${mount_point}/"
    
    # Ensure proper permissions
    sudo chmod +x "${mount_point}"/usr/bin/*
    
    # Unmount
    sudo umount "${mount_point}"
    sudo rmdir "${mount_point}"
    
    log "Portable service created: ${image_path}"
}

# Portable service management operations
attach_portable_service() {
    local image_name="$1"
    local profile="${2:-default}"
    
    log "Attaching portable service: ${image_name} with profile: ${profile}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    if [[ ! -f "${image_path}" ]]; then
        error "Image not found: ${image_path}"
        return 1
    fi
    
    # Attach the service
    sudo portablectl attach "${image_path}" --profile="${profile}"
    
    log "Portable service attached successfully"
}

attach_and_enable_service() {
    local image_name="$1"
    local profile="${2:-default}"
    
    log "Attaching and enabling portable service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    # Attach and enable immediately
    sudo portablectl attach --enable --now "${image_path}" --profile="${profile}"
    
    log "Portable service attached, enabled, and started"
}

detach_portable_service() {
    local image_name="$1"
    
    log "Detaching portable service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    # Stop services first
    sudo portablectl detach "${image_path}"
    
    log "Portable service detached"
}

# List and inspect portable services
list_portable_services() {
    log "Listing attached portable services"
    
    sudo portablectl list
}

inspect_portable_service() {
    local image_name="$1"
    
    log "Inspecting portable service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    if [[ ! -f "${image_path}" ]]; then
        error "Image not found: ${image_path}"
        return 1
    fi
    
    # Inspect the service
    sudo portablectl inspect "${image_path}"
}

# Security profiles for portable services
create_custom_security_profile() {
    local profile_name="$1"
    
    log "Creating custom security profile: ${profile_name}"
    
    sudo mkdir -p "/etc/systemd/portable/profile/${profile_name}"
    
    # Create custom profile configuration
    cat << EOF | sudo tee "/etc/systemd/portable/profile/${profile_name}/service.conf" > /dev/null
[Service]
# Custom security profile: ${profile_name}

# Enhanced security restrictions
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=yes
ProtectControlGroups=yes
ProtectKernelModules=yes
ProtectKernelTunables=yes
ProtectKernelLogs=yes
ProtectClock=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
RemoveIPC=yes
LockPersonality=yes
MemoryDenyWriteExecute=yes
SystemCallArchitectures=native

# Resource limits
MemoryMax=1G
CPUQuota=50%
TasksMax=512
IOReadBandwidthMax=/dev/sda 10M
IOWriteBandwidthMax=/dev/sda 5M

# Capability restrictions
CapabilityBoundingSet=
AmbientCapabilities=

# File system restrictions
ReadWritePaths=/var/lib/${profile_name}
ReadOnlyPaths=/usr /etc
InaccessiblePaths=/home /root /boot /sys/firmware
EOF

    log "Custom security profile created: ${profile_name}"
}

apply_security_profile() {
    local image_name="$1"
    local profile_name="$2"
    
    log "Applying security profile '${profile_name}' to service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    # Detach if already attached
    sudo portablectl detach "${image_path}" 2>/dev/null || true
    
    # Attach with custom profile
    sudo portablectl attach "${image_path}" --profile="${profile_name}"
    
    log "Security profile applied successfully"
}

# Extension and overlay support
create_service_extension() {
    local base_service="$1"
    local extension_name="$2"
    
    log "Creating extension for service: ${base_service}"
    
    local ext_dir="/tmp/extension-${extension_name}"
    mkdir -p "${ext_dir}"/{usr/bin,usr/lib/systemd/system,etc}
    
    # Create extension os-release
    cat << EOF > "${ext_dir}/etc/extension-release.${extension_name}"
ID=${extension_name}
VERSION_ID=1.0
EXTENSION_RELOAD_MANAGER=1
EOF

    # Create extension configuration
    cat << EOF > "${ext_dir}/etc/${base_service}-extension.conf"
# Extension configuration for ${base_service}
EXTENSION_NAME=${extension_name}
EXTENSION_VERSION=1.0
EXTENSION_FEATURES=logging,monitoring,metrics
EOF

    # Create extension script
    cat << EOF > "${ext_dir}/usr/bin/${base_service}-extension"
#!/bin/bash
# Extension script for ${base_service}
echo "Extension ${extension_name} loaded for ${base_service}"
# Add extension functionality here
EOF

    chmod +x "${ext_dir}/usr/bin/${base_service}-extension"
    
    # Package extension
    create_portable_from_directory "${ext_dir}" "${base_service}-${extension_name}"
    
    # Clean up
    rm -rf "${ext_dir}"
    
    log "Extension created: ${base_service}-${extension_name}"
}

attach_with_extensions() {
    local base_image="$1"
    shift
    local extensions=("$@")
    
    log "Attaching service with extensions: ${base_image}"
    
    local base_path="${IMAGE_DIR}/${base_image}.raw"
    local extension_paths=()
    
    for ext in "${extensions[@]}"; do
        extension_paths+=("${IMAGE_DIR}/${ext}.raw")
    done
    
    # Attach base service with extensions
    sudo portablectl attach "${base_path}" "${extension_paths[@]}"
    
    log "Service attached with extensions"
}

# Service health monitoring
monitor_portable_service() {
    local service_name="$1"
    
    log "Monitoring portable service: ${service_name}"
    
    # Check service status
    echo "=== Service Status ==="
    sudo systemctl status "${service_name}.service" --no-pager
    
    # Show service logs
    echo "=== Service Logs ==="
    sudo journalctl -u "${service_name}.service" --no-pager -n 20
    
    # Show resource usage
    echo "=== Resource Usage ==="
    sudo systemctl show "${service_name}.service" \
        --property=MemoryCurrent,CPUUsageNSec,TasksCurrent
    
    # Check if service is portable
    echo "=== Portable Service Information ==="
    sudo portablectl is-attached "${service_name}" && echo "Service is attached as portable" || echo "Service is not a portable service"
}

# Service backup and versioning
backup_portable_service() {
    local image_name="$1"
    
    log "Backing up portable service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    local backup_dir="/var/backups/portable-services"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    sudo mkdir -p "${backup_dir}"
    
    # Copy image with timestamp
    sudo cp "${image_path}" "${backup_dir}/${image_name}_${timestamp}.raw"
    
    # Create metadata
    cat << EOF | sudo tee "${backup_dir}/${image_name}_${timestamp}.metadata" > /dev/null
Service: ${image_name}
Backup Date: $(date)
Image Size: $(ls -lh "${image_path}" | awk '{print $5}')
Backup File: ${image_name}_${timestamp}.raw
EOF

    log "Backup created: ${backup_dir}/${image_name}_${timestamp}.raw"
}

version_portable_service() {
    local image_name="$1"
    local version_tag="$2"
    
    log "Creating version: ${version_tag} for service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    local versioned_path="${IMAGE_DIR}/${image_name}_${version_tag}.raw"
    
    # Copy image with version tag
    sudo cp "${image_path}" "${versioned_path}"
    
    log "Version created: ${image_name}_${version_tag}.raw"
}

# Testing and validation
test_portable_service() {
    local image_name="$1"
    
    log "Testing portable service: ${image_name}"
    
    local image_path="${IMAGE_DIR}/${image_name}.raw"
    
    # Validate image structure
    echo "=== Validating Image Structure ==="
    sudo portablectl inspect "${image_path}"
    
    # Test attach/detach cycle
    echo "=== Testing Attach/Detach ==="
    if sudo portablectl attach "${image_path}" --profile=trusted; then
        log "Attach successful"
        
        # Check if services are available
        local services=$(sudo portablectl list --format=table | grep "${image_name}" | awk '{print $1}')
        for service in $services; do
            echo "Testing service: $service"
            sudo systemctl start "$service" || warn "Failed to start $service"
            sleep 2
            sudo systemctl status "$service" --no-pager || warn "Service $service not running properly"
            sudo systemctl stop "$service" || warn "Failed to stop $service"
        done
        
        # Detach
        sudo portablectl detach "${image_path}"
        log "Detach successful"
    else
        error "Failed to attach service"
        return 1
    fi
    
    log "Service test completed"
}

# Usage examples and help
show_usage() {
    cat << EOF
systemd Portable Services Management Examples

Usage: $0 [COMMAND] [OPTIONS]

Service Creation:
    create-webapp       Create web application portable service
    create-database     Create database portable service
    create-from-dir DIR NAME    Create service from directory
    package DIR NAME    Package directory into portable service

Service Management:
    attach NAME [PROFILE]       Attach portable service
    attach-enable NAME [PROFILE] Attach, enable, and start service
    detach NAME                 Detach portable service
    list                        List attached services
    inspect NAME                Inspect service image

Security and Profiles:
    create-profile NAME         Create custom security profile
    apply-profile NAME PROFILE  Apply security profile to service
    
Extensions:
    create-extension BASE EXT   Create extension for base service
    attach-with-ext BASE EXT... Attach service with extensions

Monitoring and Maintenance:
    monitor NAME                Monitor service status and logs
    test NAME                   Test service attach/detach cycle
    backup NAME                 Backup service image
    version NAME TAG            Create versioned copy

Examples:
    # Create and deploy web application
    $0 create-webapp
    $0 attach-enable webapp_1.0

    # Create custom security profile
    $0 create-profile restricted
    $0 apply-profile webapp_1.0 restricted

    # Test service functionality
    $0 test webapp_1.0

    # Monitor running service
    $0 monitor webapp

    # Create and attach extension
    $0 create-extension webapp monitoring
    $0 attach-with-ext webapp_1.0 webapp-monitoring_1.0

Environment Variables:
    SERVICE_NAME        Service name (default: webapp)
    SERVICE_VERSION     Service version (default: 1.0)
    IMAGE_DIR           Image directory (default: /var/lib/portables)
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        "create-webapp")
            local work_dir=$(create_webapp_service)
            package_portable_service "${work_dir}" "${IMAGE_NAME}"
            ;;
        "create-database")
            SERVICE_NAME="database"
            IMAGE_NAME="${SERVICE_NAME}_${SERVICE_VERSION}"
            local work_dir=$(create_database_service)
            package_portable_service "${work_dir}" "${IMAGE_NAME}"
            ;;
        "create-from-dir")
            create_portable_from_directory "$2" "$3"
            ;;
        "package")
            package_portable_service "$2" "$3"
            ;;
        "attach")
            attach_portable_service "$2" "${3:-default}"
            ;;
        "attach-enable")
            attach_and_enable_service "$2" "${3:-default}"
            ;;
        "detach")
            detach_portable_service "$2"
            ;;
        "list")
            list_portable_services
            ;;
        "inspect")
            inspect_portable_service "$2"
            ;;
        "create-profile")
            create_custom_security_profile "$2"
            ;;
        "apply-profile")
            apply_security_profile "$2" "$3"
            ;;
        "create-extension")
            create_service_extension "$2" "$3"
            ;;
        "attach-with-ext")
            local base="$2"
            shift 2
            attach_with_extensions "${base}" "$@"
            ;;
        "monitor")
            monitor_portable_service "$2"
            ;;
        "test")
            test_portable_service "$2"
            ;;
        "backup")
            backup_portable_service "$2"
            ;;
        "version")
            version_portable_service "$2" "$3"
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi