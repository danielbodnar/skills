#!/bin/bash
# Talos Linux Troubleshooting and Debug Tools

set -euo pipefail

# Configuration
TALOSCONFIG="${TALOSCONFIG:-./talosconfig}"
OUTPUT_DIR="${OUTPUT_DIR:-./debug-$(date +%Y%m%d-%H%M%S)}"
export TALOSCONFIG

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Create debug output directory
mkdir -p "$OUTPUT_DIR"

# Collect cluster information
collect_cluster_info() {
    log_info "Collecting cluster information..."
    
    {
        echo "=== Talos Configuration ==="
        talosctl config info
        echo ""
        
        echo "=== Cluster Health ==="
        talosctl health --server=false || true
        echo ""
        
        echo "=== Cluster Members ==="
        talosctl get members || true
        echo ""
        
        echo "=== Kubernetes Version ==="
        talosctl version --short || true
        kubectl version --short || true
        echo ""
        
        echo "=== Kubernetes Nodes ==="
        kubectl get nodes -o wide || true
        echo ""
        
        echo "=== Cluster Events ==="
        kubectl get events --all-namespaces --sort-by='.lastTimestamp' || true
        
    } > "$OUTPUT_DIR/cluster-info.txt"
    
    log_success "Cluster information saved to $OUTPUT_DIR/cluster-info.txt"
}

# Collect node diagnostics
collect_node_diagnostics() {
    log_info "Collecting node diagnostics..."
    
    # Get all node IPs
    local nodes
    nodes=$(talosctl get members -o json | jq -r '.spec.addresses[]' 2>/dev/null || echo "")
    
    if [[ -z "$nodes" ]]; then
        log_warning "No nodes found, trying to get from kubeconfig..."
        nodes=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "")
    fi
    
    for node in $nodes; do
        log_info "Collecting diagnostics for node: $node"
        
        {
            echo "=== Node: $node ==="
            echo ""
            
            echo "--- System Information ---"
            talosctl -n "$node" get systeminfo || true
            echo ""
            
            echo "--- Services Status ---"
            talosctl -n "$node" service || true
            echo ""
            
            echo "--- Memory Usage ---"
            talosctl -n "$node" memory || true
            echo ""
            
            echo "--- Disk Usage ---"
            talosctl -n "$node" usage || true
            echo ""
            
            echo "--- Network Interfaces ---"
            talosctl -n "$node" get links || true
            echo ""
            
            echo "--- Network Routes ---"
            talosctl -n "$node" get routes || true
            echo ""
            
            echo "--- Process List (top 20) ---"
            talosctl -n "$node" processes | head -20 || true
            echo ""
            
            echo "--- Container Statistics ---"
            talosctl -n "$node" stats || true
            echo ""
            
            echo "--- Kernel Messages (last 50) ---"
            talosctl -n "$node" dmesg | tail -50 || true
            echo ""
            
        } > "$OUTPUT_DIR/node-$node.txt"
    done
    
    log_success "Node diagnostics saved to $OUTPUT_DIR/node-*.txt"
}

# Collect service logs
collect_service_logs() {
    log_info "Collecting service logs..."
    
    local services=("kubelet" "containerd" "etcd" "kube-apiserver" "kube-controller-manager" "kube-scheduler")
    local nodes
    nodes=$(talosctl get members -o json | jq -r '.spec.addresses[]' 2>/dev/null || echo "")
    
    mkdir -p "$OUTPUT_DIR/logs"
    
    for node in $nodes; do
        for service in "${services[@]}"; do
            log_info "Collecting $service logs from $node..."
            
            talosctl -n "$node" logs "$service" > "$OUTPUT_DIR/logs/${node}-${service}.log" 2>/dev/null || {
                echo "Failed to collect $service logs from $node" > "$OUTPUT_DIR/logs/${node}-${service}.log"
            }
        done
    done
    
    log_success "Service logs saved to $OUTPUT_DIR/logs/"
}

# Collect Kubernetes diagnostics
collect_k8s_diagnostics() {
    log_info "Collecting Kubernetes diagnostics..."
    
    {
        echo "=== Kubernetes Cluster Info ==="
        kubectl cluster-info dump --output-directory="$OUTPUT_DIR/k8s-cluster-dump" || true
        echo ""
        
        echo "=== All Pods ==="
        kubectl get pods --all-namespaces -o wide || true
        echo ""
        
        echo "=== Failed/Pending Pods ==="
        kubectl get pods --all-namespaces --field-selector=status.phase!=Running,status.phase!=Succeeded || true
        echo ""
        
        echo "=== Resource Usage ==="
        kubectl top nodes || true
        kubectl top pods --all-namespaces || true
        echo ""
        
        echo "=== Storage Classes ==="
        kubectl get storageclass || true
        echo ""
        
        echo "=== Persistent Volumes ==="
        kubectl get pv || true
        echo ""
        
        echo "=== Network Policies ==="
        kubectl get networkpolicy --all-namespaces || true
        echo ""
        
        echo "=== Ingress Resources ==="
        kubectl get ingress --all-namespaces || true
        echo ""
        
    } > "$OUTPUT_DIR/kubernetes-info.txt"
    
    log_success "Kubernetes diagnostics saved to $OUTPUT_DIR/kubernetes-info.txt"
}

# Collect network diagnostics
collect_network_diagnostics() {
    log_info "Collecting network diagnostics..."
    
    local nodes
    nodes=$(talosctl get members -o json | jq -r '.spec.addresses[]' 2>/dev/null || echo "")
    
    mkdir -p "$OUTPUT_DIR/network"
    
    for node in $nodes; do
        log_info "Collecting network diagnostics from $node..."
        
        {
            echo "=== Network Configuration for $node ==="
            echo ""
            
            echo "--- Network Statistics ---"
            talosctl -n "$node" netstat || true
            echo ""
            
            echo "--- Network Links ---"
            talosctl -n "$node" get links || true
            echo ""
            
            echo "--- Network Addresses ---"
            talosctl -n "$node" get addresses || true
            echo ""
            
            echo "--- Network Routes ---"
            talosctl -n "$node" get routes || true
            echo ""
            
            echo "--- DNS Configuration ---"
            talosctl -n "$node" get resolvers || true
            echo ""
            
            echo "--- KubeSpan Configuration ---"
            talosctl -n "$node" get kubespanidentities || true
            echo ""
            
            echo "--- KubeSpan Peers ---"
            talosctl -n "$node" get kubespanpeerspecs || true
            echo ""
            
        } > "$OUTPUT_DIR/network/network-$node.txt"
    done
    
    log_success "Network diagnostics saved to $OUTPUT_DIR/network/"
}

# Generate support bundle
generate_support_bundle() {
    log_info "Generating Talos support bundle..."
    
    talosctl support --output "$OUTPUT_DIR/talos-support-bundle.zip" || {
        log_warning "Failed to generate support bundle"
    }
    
    if [[ -f "$OUTPUT_DIR/talos-support-bundle.zip" ]]; then
        log_success "Support bundle saved to $OUTPUT_DIR/talos-support-bundle.zip"
    fi
}

# Check common issues
check_common_issues() {
    log_info "Checking for common issues..."
    
    {
        echo "=== Common Issue Checks ==="
        echo ""
        
        echo "--- Checking etcd Health ---"
        if talosctl etcd members 2>/dev/null; then
            echo "✅ etcd is accessible"
        else
            echo "❌ etcd is not accessible"
        fi
        echo ""
        
        echo "--- Checking DNS Resolution ---"
        local test_node
        test_node=$(talosctl get members -o json | jq -r '.spec.addresses[0]' 2>/dev/null | head -1)
        if [[ -n "$test_node" ]]; then
            if talosctl -n "$test_node" read /etc/resolv.conf 2>/dev/null | grep -q nameserver; then
                echo "✅ DNS configuration found"
            else
                echo "❌ DNS configuration issues"
            fi
        fi
        echo ""
        
        echo "--- Checking Certificate Validity ---"
        if talosctl version --short 2>/dev/null | grep -q "Server:"; then
            echo "✅ Talos API certificates valid"
        else
            echo "❌ Talos API certificate issues"
        fi
        echo ""
        
        echo "--- Checking Kubernetes API ---"
        if kubectl cluster-info 2>/dev/null | grep -q "running"; then
            echo "✅ Kubernetes API is accessible"
        else
            echo "❌ Kubernetes API issues"
        fi
        echo ""
        
        echo "--- Checking Node Ready Status ---"
        local not_ready
        not_ready=$(kubectl get nodes --no-headers 2>/dev/null | grep -v " Ready " | wc -l)
        if [[ "$not_ready" -eq 0 ]]; then
            echo "✅ All nodes are Ready"
        else
            echo "❌ $not_ready nodes are not Ready"
        fi
        echo ""
        
        echo "--- Checking System Pods ---"
        local failing_pods
        failing_pods=$(kubectl get pods -n kube-system --no-headers 2>/dev/null | grep -v "Running\|Completed" | wc -l)
        if [[ "$failing_pods" -eq 0 ]]; then
            echo "✅ All system pods are running"
        else
            echo "❌ $failing_pods system pods are not running"
        fi
        echo ""
        
    } > "$OUTPUT_DIR/common-issues.txt"
    
    log_success "Common issue checks saved to $OUTPUT_DIR/common-issues.txt"
}

# Performance analysis
performance_analysis() {
    log_info "Running performance analysis..."
    
    local nodes
    nodes=$(talosctl get members -o json | jq -r '.spec.addresses[]' 2>/dev/null || echo "")
    
    {
        echo "=== Performance Analysis ==="
        echo ""
        
        for node in $nodes; do
            echo "--- Node: $node ---"
            echo ""
            
            echo "Memory Analysis:"
            talosctl -n "$node" memory | awk '/^Mem:/{print "Total: " $2 ", Used: " $3 " (" int($3/$2*100) "%), Free: " $4}' || true
            echo ""
            
            echo "CPU Load:"
            talosctl -n "$node" read /proc/loadavg || true
            echo ""
            
            echo "Top 5 CPU Consumers:"
            talosctl -n "$node" processes | head -6 | tail -5 || true
            echo ""
            
            echo "Disk I/O:"
            talosctl -n "$node" read /proc/diskstats | awk '{print $3, $4, $8}' | head -5 || true
            echo ""
            
        done
        
    } > "$OUTPUT_DIR/performance-analysis.txt"
    
    log_success "Performance analysis saved to $OUTPUT_DIR/performance-analysis.txt"
}

# Main function
main() {
    local command="${1:-all}"
    
    log_info "Starting Talos debug collection..."
    log_info "Output directory: $OUTPUT_DIR"
    
    case "$command" in
        "cluster"|"c")
            collect_cluster_info
            ;;
        "nodes"|"n")
            collect_node_diagnostics
            ;;
        "logs"|"l")
            collect_service_logs
            ;;
        "k8s"|"kubernetes")
            collect_k8s_diagnostics
            ;;
        "network"|"net")
            collect_network_diagnostics
            ;;
        "support"|"s")
            generate_support_bundle
            ;;
        "issues"|"i")
            check_common_issues
            ;;
        "performance"|"p")
            performance_analysis
            ;;
        "all"|*)
            collect_cluster_info
            collect_node_diagnostics
            collect_service_logs
            collect_k8s_diagnostics
            collect_network_diagnostics
            check_common_issues
            performance_analysis
            generate_support_bundle
            ;;
    esac
    
    log_success "Debug collection complete!"
    log_info "All files saved in: $OUTPUT_DIR"
    
    echo ""
    echo "📁 Generated files:"
    find "$OUTPUT_DIR" -type f -exec ls -lh {} \; | sort
    
    echo ""
    echo "💡 Next steps:"
    echo "  1. Review common-issues.txt for quick fixes"
    echo "  2. Check node-*.txt files for node-specific problems"
    echo "  3. Examine logs/ directory for service issues"
    echo "  4. Share talos-support-bundle.zip with support if needed"
}

# Check dependencies
check_dependencies() {
    local missing=()
    
    if ! command -v talosctl &> /dev/null; then
        missing+=("talosctl")
    fi
    
    if ! command -v kubectl &> /dev/null; then
        missing+=("kubectl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing[*]}"
        exit 1
    fi
    
    if [[ ! -f "$TALOSCONFIG" ]]; then
        log_error "Talos config not found: $TALOSCONFIG"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Talos Linux Debug Tools"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  cluster, c     - Collect cluster information"
    echo "  nodes, n       - Collect node diagnostics"
    echo "  logs, l        - Collect service logs"
    echo "  k8s            - Collect Kubernetes diagnostics"
    echo "  network, net   - Collect network diagnostics"
    echo "  support, s     - Generate support bundle"
    echo "  issues, i      - Check common issues"
    echo "  performance, p - Run performance analysis"
    echo "  all            - Run all collection tasks (default)"
    echo "  help           - Show this help"
    echo ""
    echo "Environment variables:"
    echo "  TALOSCONFIG    - Path to talosconfig file (default: ./talosconfig)"
    echo "  OUTPUT_DIR     - Output directory (default: ./debug-TIMESTAMP)"
}

# Handle help
if [[ "${1:-}" == "help" ]] || [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

# Check dependencies and run
check_dependencies
main "$@"