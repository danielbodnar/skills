#!/bin/bash
# VyOS Docker Deployment Script
# Deploy VyOS in Docker containers with networking configuration

set -e

# Configuration variables
VYOS_IMAGE="vyos/vyos:1.4-rolling"
CONTAINER_NAME="vyos-router"
DOCKER_NETWORK="vyos-network"
IPv4_SUBNET="192.168.100.0/24"
IPv6_SUBNET="2001:db8:100::/64"
HOST_INTERFACE="eth0"

# Color output functions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if running as root or in docker group
    if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
        error "Please run as root or add user to docker group"
        exit 1
    fi
    
    info "Prerequisites check passed"
}

# Configure Docker daemon for IPv6
configure_docker_daemon() {
    info "Configuring Docker daemon for IPv6..."
    
    local daemon_config="/etc/docker/daemon.json"
    local temp_config="/tmp/daemon.json.tmp"
    
    # Create or update daemon.json
    if [ -f "$daemon_config" ]; then
        # Backup existing config
        cp "$daemon_config" "${daemon_config}.backup"
        info "Backed up existing daemon.json"
    fi
    
    # Create new daemon configuration
    cat > "$temp_config" << EOF
{
  "ipv6": true,
  "fixed-cidr-v6": "2001:db8::/64",
  "experimental": true,
  "ip6tables": true
}
EOF
    
    # Move to proper location
    sudo mv "$temp_config" "$daemon_config"
    
    info "Docker daemon configuration updated"
    warn "Docker daemon restart required for changes to take effect"
}

# Create Docker network
create_docker_network() {
    info "Creating Docker network: $DOCKER_NETWORK"
    
    # Remove existing network if it exists
    if docker network ls | grep -q "$DOCKER_NETWORK"; then
        warn "Network $DOCKER_NETWORK already exists, removing..."
        docker network rm "$DOCKER_NETWORK" || true
    fi
    
    # Create macvlan network for VyOS
    docker network create \
        --driver=macvlan \
        --subnet="$IPv4_SUBNET" \
        --subnet="$IPv6_SUBNET" \
        --ipv6 \
        -o parent="$HOST_INTERFACE" \
        "$DOCKER_NETWORK"
    
    info "Docker network created successfully"
}

# Pull VyOS Docker image
pull_vyos_image() {
    info "Pulling VyOS Docker image: $VYOS_IMAGE"
    
    # Try to pull the image
    if ! docker pull "$VYOS_IMAGE"; then
        warn "Failed to pull $VYOS_IMAGE, trying alternative..."
        VYOS_IMAGE="vyos/vyos:latest"
        docker pull "$VYOS_IMAGE"
    fi
    
    info "VyOS image ready: $VYOS_IMAGE"
}

# Create VyOS configuration directory
setup_vyos_config() {
    local config_dir="./vyos-config"
    
    info "Setting up VyOS configuration directory: $config_dir"
    
    mkdir -p "$config_dir"
    
    # Create initial configuration script
    cat > "$config_dir/boot.sh" << 'EOF'
#!/bin/bash
# VyOS initial configuration script

# Wait for system to be ready
sleep 10

# Source VyOS environment
source /opt/vyatta/etc/functions/script-template

# Enter configuration mode
configure

# Basic system configuration
set system host-name 'vyos-docker'
set system domain-name 'docker.local'

# Configure interfaces
set interfaces ethernet eth0 address '192.168.100.10/24'
set interfaces ethernet eth0 description 'Container Interface'

# Configure SSH
set service ssh port '22'

# Configure basic firewall
set firewall name DOCKER-IN default-action 'accept'
set firewall name DOCKER-IN rule 10 action 'accept'
set firewall name DOCKER-IN rule 10 state established 'enable'
set firewall name DOCKER-IN rule 10 state related 'enable'

# Commit and save
commit
save
exit

# Log completion
echo "$(date): VyOS Docker configuration completed" >> /var/log/vyos-docker.log
EOF
    
    chmod +x "$config_dir/boot.sh"
    
    info "VyOS configuration directory setup complete"
}

# Deploy VyOS container
deploy_vyos_container() {
    info "Deploying VyOS container: $CONTAINER_NAME"
    
    # Remove existing container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        warn "Container $CONTAINER_NAME already exists, removing..."
        docker stop "$CONTAINER_NAME" || true
        docker rm "$CONTAINER_NAME" || true
    fi
    
    # Run VyOS container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --privileged \
        --network "$DOCKER_NETWORK" \
        --ip "192.168.100.10" \
        --restart unless-stopped \
        -v /lib/modules:/lib/modules:ro \
        -v "$(pwd)/vyos-config:/config/scripts:ro" \
        -p 2222:22 \
        -p 8443:443 \
        "$VYOS_IMAGE" \
        /sbin/init
    
    info "VyOS container deployed successfully"
    
    # Wait for container to be ready
    info "Waiting for container to be ready..."
    sleep 15
    
    # Execute initial configuration
    info "Applying initial configuration..."
    docker exec "$CONTAINER_NAME" /config/scripts/boot.sh
    
    info "Initial configuration applied"
}

# Test VyOS deployment
test_deployment() {
    info "Testing VyOS deployment..."
    
    # Check container status
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        error "Container $CONTAINER_NAME is not running"
        return 1
    fi
    
    # Test SSH connectivity
    info "Testing SSH connectivity..."
    timeout 10 docker exec "$CONTAINER_NAME" vyos --version
    
    if [ $? -eq 0 ]; then
        info "VyOS is responding correctly"
    else
        warn "VyOS may not be fully ready yet"
    fi
    
    # Show container information
    echo
    info "Container Information:"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo
    info "Network Information:"
    docker exec "$CONTAINER_NAME" ip addr show eth0 2>/dev/null || true
    
    echo
    info "SSH Access:"
    echo "  ssh vyos@$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)"
    echo "  ssh -p 2222 vyos@localhost"
    
    echo
    info "Web Access (if HTTPS API enabled):"
    echo "  https://$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)"
    echo "  https://localhost:8443"
}

# Cleanup function
cleanup() {
    info "Cleaning up VyOS Docker deployment..."
    
    # Stop and remove container
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        info "Container $CONTAINER_NAME removed"
    fi
    
    # Remove network
    if docker network ls | grep -q "$DOCKER_NETWORK"; then
        docker network rm "$DOCKER_NETWORK"
        info "Network $DOCKER_NETWORK removed"
    fi
    
    # Remove configuration directory
    if [ -d "./vyos-config" ]; then
        rm -rf "./vyos-config"
        info "Configuration directory removed"
    fi
    
    info "Cleanup completed"
}

# Show logs
show_logs() {
    info "Showing VyOS container logs..."
    docker logs "$CONTAINER_NAME"
}

# Enter container shell
enter_shell() {
    info "Entering VyOS container shell..."
    docker exec -it "$CONTAINER_NAME" su - vyos
}

# Main execution
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            setup_vyos_config
            create_docker_network
            pull_vyos_image
            deploy_vyos_container
            test_deployment
            ;;
        "configure-daemon")
            configure_docker_daemon
            ;;
        "test")
            test_deployment
            ;;
        "logs")
            show_logs
            ;;
        "shell")
            enter_shell
            ;;
        "cleanup")
            cleanup
            ;;
        "restart")
            info "Restarting VyOS container..."
            docker restart "$CONTAINER_NAME"
            sleep 10
            test_deployment
            ;;
        "status")
            info "VyOS container status:"
            docker ps --filter "name=$CONTAINER_NAME"
            echo
            info "Container resource usage:"
            docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
            ;;
        "help"|*)
            echo "VyOS Docker Deployment Script"
            echo "Usage: $0 <command>"
            echo
            echo "Commands:"
            echo "  deploy           - Deploy VyOS container (default)"
            echo "  configure-daemon - Configure Docker daemon for IPv6"
            echo "  test             - Test VyOS deployment"
            echo "  logs             - Show container logs"
            echo "  shell            - Enter container shell"
            echo "  cleanup          - Remove container and network"
            echo "  restart          - Restart VyOS container"
            echo "  status           - Show container status"
            echo "  help             - Show this help"
            echo
            echo "Examples:"
            echo "  $0 deploy"
            echo "  $0 shell"
            echo "  $0 cleanup"
            ;;
    esac
}

# Execute main function
main "$@"