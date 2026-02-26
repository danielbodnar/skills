#!/bin/bash
# Talos Cluster Management Script

set -euo pipefail

# Configuration
TALOSCONFIG="${TALOSCONFIG:-./talosconfig}"
export TALOSCONFIG

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check cluster health
check_health() {
    log_info "Checking cluster health..."
    
    if talosctl health --server=false; then
        log_success "Cluster is healthy"
    else
        log_error "Cluster health check failed"
        return 1
    fi
    
    echo ""
    log_info "Cluster members:"
    talosctl get members
    
    echo ""
    log_info "Kubernetes nodes:"
    kubectl get nodes -o wide
}

# Show cluster information
show_info() {
    log_info "Cluster configuration:"
    talosctl config info
    
    echo ""
    log_info "Cluster endpoints:"
    talosctl config endpoints
    
    echo ""
    log_info "Current context:"
    kubectl config current-context
    
    echo ""
    log_info "Cluster version:"
    talosctl version --short
    kubectl version --short
}

# Manage services
manage_services() {
    local action="${1:-status}"
    local service="${2:-}"
    
    if [[ -n "$service" ]]; then
        log_info "Service ${action}: ${service}"
        talosctl service "$service" "$action"
    else
        log_info "All services status:"
        talosctl service
    fi
}

# View logs
view_logs() {
    local service="${1:-}"
    local follow="${2:-false}"
    
    if [[ -n "$service" ]]; then
        if [[ "$follow" == "true" ]]; then
            log_info "Following logs for service: ${service}"
            talosctl logs -f "$service"
        else
            log_info "Logs for service: ${service}"
            talosctl logs "$service"
        fi
    else
        log_info "Available services for logging:"
        talosctl service | grep -E "RUNNING|HEALTHY"
    fi
}

# Monitor resources
monitor_resources() {
    log_info "System resource usage:"
    
    echo ""
    echo "Memory usage:"
    talosctl memory
    
    echo ""
    echo "Disk usage:"
    talosctl usage
    
    echo ""
    echo "Running processes (top 10):"
    talosctl processes | head -10
    
    echo ""
    echo "Container statistics:"
    talosctl stats
}

# Backup etcd
backup_etcd() {
    local backup_file="${1:-etcd-backup-$(date +%Y%m%d-%H%M%S).tar.gz}"
    
    log_info "Creating etcd backup: ${backup_file}"
    
    # Get etcd snapshot
    talosctl etcd snapshot "${backup_file}"
    
    if [[ -f "$backup_file" ]]; then
        log_success "Backup created: ${backup_file}"
        ls -lh "$backup_file"
    else
        log_error "Backup failed"
        return 1
    fi
}

# Upgrade cluster
upgrade_cluster() {
    local talos_version="${1:-}"
    local k8s_version="${2:-}"
    
    if [[ -n "$talos_version" ]]; then
        log_info "Upgrading Talos to version: ${talos_version}"
        log_warning "This will upgrade nodes one by one. Continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            talosctl upgrade --image "ghcr.io/siderolabs/installer:${talos_version}" --preserve
            log_success "Talos upgrade initiated"
        else
            log_info "Talos upgrade cancelled"
        fi
    fi
    
    if [[ -n "$k8s_version" ]]; then
        log_info "Upgrading Kubernetes to version: ${k8s_version}"
        log_warning "This will upgrade the control plane. Continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            talosctl upgrade-k8s --to "$k8s_version"
            log_success "Kubernetes upgrade initiated"
        else
            log_info "Kubernetes upgrade cancelled"
        fi
    fi
}

# Reset node
reset_node() {
    local node_ip="${1:-}"
    local graceful="${2:-true}"
    
    if [[ -z "$node_ip" ]]; then
        log_error "Node IP required"
        return 1
    fi
    
    log_warning "This will reset node ${node_ip}. All data will be lost!"
    log_warning "Continue? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if [[ "$graceful" == "true" ]]; then
            log_info "Performing graceful reset..."
            talosctl reset --nodes "$node_ip" --graceful
        else
            log_info "Performing force reset..."
            talosctl reset --nodes "$node_ip" --graceful=false
        fi
        log_success "Node reset initiated"
    else
        log_info "Reset cancelled"
    fi
}

# Main function
main() {
    local command="${1:-help}"
    
    case "$command" in
        "health"|"h")
            check_health
            ;;
        "info"|"i")
            show_info
            ;;
        "service"|"svc")
            manage_services "${2:-status}" "${3:-}"
            ;;
        "logs"|"l")
            view_logs "${2:-}" "${3:-false}"
            ;;
        "monitor"|"m")
            monitor_resources
            ;;
        "backup"|"b")
            backup_etcd "${2:-}"
            ;;
        "upgrade"|"u")
            upgrade_cluster "${2:-}" "${3:-}"
            ;;
        "reset"|"r")
            reset_node "${2:-}" "${3:-true}"
            ;;
        "dashboard"|"d")
            log_info "Opening Talos dashboard..."
            talosctl dashboard
            ;;
        "help"|*)
            echo "Talos Cluster Management Script"
            echo ""
            echo "Usage: $0 <command> [arguments]"
            echo ""
            echo "Commands:"
            echo "  health, h                    - Check cluster health"
            echo "  info, i                      - Show cluster information"
            echo "  service, svc [action] [name] - Manage services"
            echo "  logs, l [service] [follow]   - View service logs"
            echo "  monitor, m                   - Monitor system resources"
            echo "  backup, b [filename]         - Backup etcd"
            echo "  upgrade, u [talos] [k8s]     - Upgrade cluster"
            echo "  reset, r <node-ip> [graceful] - Reset node"
            echo "  dashboard, d                 - Open dashboard"
            echo "  help                         - Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 health"
            echo "  $0 service restart kubelet"
            echo "  $0 logs kubelet true"
            echo "  $0 backup"
            echo "  $0 upgrade v1.6.0 v1.29.0"
            echo "  $0 reset 192.168.1.100"
            ;;
    esac
}

# Check if talosctl is available
if ! command -v talosctl &> /dev/null; then
    log_error "talosctl not found. Please install it first."
    exit 1
fi

# Check if talosconfig exists
if [[ ! -f "$TALOSCONFIG" ]]; then
    log_error "Talos config not found: $TALOSCONFIG"
    exit 1
fi

# Run main function
main "$@"