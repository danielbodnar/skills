#!/bin/bash
# k8s-node-setup.sh - Configure Arch Linux for Kubernetes deployment

set -euo pipefail

# Configuration
CONTAINER_RUNTIME="${CONTAINER_RUNTIME:-containerd}"
CNI_PLUGIN="${CNI_PLUGIN:-calico}"
K8S_VERSION="${K8S_VERSION:-latest}"
NODE_TYPE="${NODE_TYPE:-worker}"  # master or worker
CLUSTER_NAME="${CLUSTER_NAME:-kubernetes}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
    
    # Check for sudo access
    if ! sudo -n true 2>/dev/null; then
        warn "This script requires sudo access"
    fi
    
    # Check architecture
    if [[ $(uname -m) != "x86_64" ]]; then
        warn "This script is designed for x86_64 architecture"
    fi
    
    log "Prerequisites check completed"
}

# Install required packages
install_packages() {
    log "Installing Kubernetes packages..."
    
    # Update package database
    sudo pacman -Syu --noconfirm
    
    # Install container runtime packages
    case "$CONTAINER_RUNTIME" in
        containerd)
            sudo pacman -S --needed --noconfirm containerd runc
            ;;
        docker)
            sudo pacman -S --needed --noconfirm docker docker-compose
            ;;
        crio)
            warn "CRI-O not available in official repos, using containerd instead"
            sudo pacman -S --needed --noconfirm containerd runc
            CONTAINER_RUNTIME="containerd"
            ;;
    esac
    
    # Install Kubernetes tools
    sudo pacman -S --needed --noconfirm \
        kubectl \
        kubelet \
        kubeadm \
        cni-plugins \
        conntrack-tools \
        socat \
        iptables \
        ipset \
        ebtables \
        ethtool \
        util-linux \
        iproute2
    
    # Install additional tools
    sudo pacman -S --needed --noconfirm \
        curl \
        wget \
        git \
        htop \
        vim \
        bash-completion
    
    log "Package installation completed"
}

# Configure system settings
configure_system() {
    log "Configuring system for Kubernetes..."
    
    # Disable swap
    sudo swapoff -a
    sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
    
    # Load required kernel modules
    sudo tee /etc/modules-load.d/k8s.conf > /dev/null << 'EOF'
# Kubernetes required modules
overlay
br_netfilter
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack
EOF
    
    # Load modules immediately
    sudo modprobe overlay
    sudo modprobe br_netfilter
    sudo modprobe ip_vs
    sudo modprobe ip_vs_rr
    sudo modprobe ip_vs_wrr
    sudo modprobe ip_vs_sh
    sudo modprobe nf_conntrack
    
    # Configure sysctl settings
    sudo tee /etc/sysctl.d/k8s.conf > /dev/null << 'EOF'
# Kubernetes networking
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1

# Security settings
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0

# Memory and performance
vm.overcommit_memory = 1
kernel.panic = 10
kernel.panic_on_oops = 1
EOF
    
    # Apply sysctl settings
    sudo sysctl --system
    
    log "System configuration completed"
}

# Configure container runtime
configure_containerd() {
    log "Configuring containerd..."
    
    # Create containerd config directory
    sudo mkdir -p /etc/containerd
    
    # Generate default configuration
    sudo containerd config default | sudo tee /etc/containerd/config.toml > /dev/null
    
    # Configure systemd cgroup driver
    sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
    
    # Enable and start containerd
    sudo systemctl enable containerd
    sudo systemctl start containerd
    
    # Add user to containerd group if it exists
    if getent group containerd > /dev/null 2>&1; then
        sudo usermod -aG containerd $USER
    fi
    
    log "containerd configuration completed"
}

configure_docker() {
    log "Configuring Docker..."
    
    # Create docker daemon configuration
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF
    
    # Enable and start docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    log "Docker configuration completed"
}

# Configure kubelet
configure_kubelet() {
    log "Configuring kubelet..."
    
    # Create kubelet service drop-in directory
    sudo mkdir -p /etc/systemd/system/kubelet.service.d
    
    # Configure kubelet extra args
    sudo tee /etc/systemd/system/kubelet.service.d/10-kubeadm.conf > /dev/null << EOF
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
Environment="KUBELET_EXTRA_ARGS=--container-runtime-endpoint=unix:///var/run/containerd/containerd.sock --pod-infra-container-image=registry.k8s.io/pause:3.9"
ExecStart=
ExecStart=/usr/bin/kubelet \$KUBELET_KUBECONFIG_ARGS \$KUBELET_CONFIG_ARGS \$KUBELET_EXTRA_ARGS
EOF
    
    # Enable kubelet (don't start yet - will be started by kubeadm)
    sudo systemctl enable kubelet
    
    log "kubelet configuration completed"
}

# Configure CNI
setup_cni() {
    log "Setting up CNI configuration..."
    
    # Create CNI config directory
    sudo mkdir -p /etc/cni/net.d
    
    # Create basic CNI configuration (will be replaced by CNI plugin)
    case "$CNI_PLUGIN" in
        calico)
            log "CNI will be configured for Calico"
            ;;
        flannel)
            log "CNI will be configured for Flannel"
            ;;
        cilium)
            log "CNI will be configured for Cilium"
            ;;
        *)
            warn "Unknown CNI plugin: $CNI_PLUGIN"
            ;;
    esac
    
    log "CNI setup completed"
}

# Create cluster initialization script
create_cluster_init_script() {
    if [[ "$NODE_TYPE" == "master" ]]; then
        log "Creating cluster initialization script..."
        
        cat > ~/init-k8s-cluster.sh << 'EOF'
#!/bin/bash
# init-k8s-cluster.sh - Initialize Kubernetes cluster

set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-kubernetes}"
POD_SUBNET="${POD_SUBNET:-10.244.0.0/16}"
SERVICE_SUBNET="${SERVICE_SUBNET:-10.96.0.0/12}"
CNI_PLUGIN="${CNI_PLUGIN:-calico}"

log() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

# Initialize cluster
log "Initializing Kubernetes cluster..."
sudo kubeadm init \
    --cluster-name="$CLUSTER_NAME" \
    --pod-network-cidr="$POD_SUBNET" \
    --service-cidr="$SERVICE_SUBNET" \
    --apiserver-advertise-address="$(ip route get 8.8.8.8 | awk '{print $7; exit}')"

# Configure kubectl for current user
log "Configuring kubectl..."
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI plugin
case "$CNI_PLUGIN" in
    calico)
        log "Installing Calico CNI..."
        kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.0/manifests/tigera-operator.yaml
        kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.0/manifests/custom-resources.yaml
        ;;
    flannel)
        log "Installing Flannel CNI..."
        kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
        ;;
    cilium)
        log "Installing Cilium CNI..."
        kubectl apply -f https://raw.githubusercontent.com/cilium/cilium/1.14.5/install/kubernetes/quick-install.yaml
        ;;
esac

# Wait for nodes to be ready
log "Waiting for nodes to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Show cluster status
log "Cluster initialization completed!"
echo
kubectl get nodes -o wide
echo
kubectl get pods -A
echo
log "Join worker nodes using the command shown above"
EOF
        
        chmod +x ~/init-k8s-cluster.sh
        log "Cluster initialization script created: ~/init-k8s-cluster.sh"
    fi
}

# Create join script template
create_join_script_template() {
    if [[ "$NODE_TYPE" == "worker" ]]; then
        log "Creating join script template..."
        
        cat > ~/join-k8s-cluster.sh << 'EOF'
#!/bin/bash
# join-k8s-cluster.sh - Join worker node to Kubernetes cluster

set -euo pipefail

# Replace these values with actual values from master node
MASTER_IP="REPLACE_WITH_MASTER_IP"
TOKEN="REPLACE_WITH_TOKEN"
CA_CERT_HASH="REPLACE_WITH_CA_CERT_HASH"

# Join cluster
sudo kubeadm join $MASTER_IP:6443 \
    --token $TOKEN \
    --discovery-token-ca-cert-hash $CA_CERT_HASH

echo "Node joined successfully!"
echo "Check status on master with: kubectl get nodes"
EOF
        
        chmod +x ~/join-k8s-cluster.sh
        log "Join script template created: ~/join-k8s-cluster.sh"
        warn "Update the script with actual values from master node"
    fi
}

# Create management scripts
create_management_scripts() {
    log "Creating Kubernetes management scripts..."
    
    # Node management script
    cat > ~/k8s-node-manage.sh << 'EOF'
#!/bin/bash
# k8s-node-manage.sh - Kubernetes node management script

case "$1" in
    status)
        echo "=== Node Status ==="
        kubectl get nodes -o wide 2>/dev/null || echo "kubectl not configured"
        echo
        echo "=== Pod Status ==="
        kubectl get pods -A 2>/dev/null || echo "kubectl not configured"
        echo
        echo "=== System Services ==="
        systemctl status kubelet containerd
        ;;
    logs)
        echo "=== Kubelet Logs ==="
        journalctl -u kubelet --since "1 hour ago" --no-pager
        echo
        echo "=== Containerd Logs ==="
        journalctl -u containerd --since "1 hour ago" --no-pager
        ;;
    restart)
        echo "Restarting Kubernetes services..."
        sudo systemctl restart containerd
        sudo systemctl restart kubelet
        echo "Services restarted"
        ;;
    reset)
        echo "WARNING: This will reset the node and remove it from cluster"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo kubeadm reset --force
            sudo rm -rf /etc/kubernetes/
            sudo rm -rf ~/.kube/
            sudo iptables -F && sudo iptables -t nat -F && sudo iptables -t mangle -F && sudo iptables -X
            echo "Node reset completed"
        fi
        ;;
    troubleshoot)
        echo "=== Kubernetes Troubleshooting ==="
        echo "1. Check node status:"
        kubectl get nodes -o wide 2>/dev/null || echo "kubectl not available"
        echo
        echo "2. Check system pods:"
        kubectl get pods -n kube-system 2>/dev/null || echo "kubectl not available"
        echo
        echo "3. Check kubelet status:"
        systemctl status kubelet --no-pager
        echo
        echo "4. Check container runtime:"
        systemctl status containerd --no-pager
        echo
        echo "5. Check kernel modules:"
        lsmod | grep -E "(overlay|br_netfilter|ip_vs)"
        echo
        echo "6. Check sysctl settings:"
        sysctl net.bridge.bridge-nf-call-iptables net.ipv4.ip_forward
        ;;
    *)
        echo "Usage: $0 {status|logs|restart|reset|troubleshoot}"
        exit 1
        ;;
esac
EOF
    
    chmod +x ~/k8s-node-manage.sh
    
    # Create kubectl completion
    cat > ~/.bashrc.d/kubectl << 'EOF'
# Kubectl completion and aliases
source <(kubectl completion bash)
alias k=kubectl
complete -F __start_kubectl k

# Kubernetes aliases
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgn='kubectl get nodes'
alias kdp='kubectl describe pod'
alias kds='kubectl describe service'
alias kdn='kubectl describe node'
EOF
    
    log "Management scripts created"
}

# Create systemd service for automatic startup
create_startup_service() {
    log "Creating startup service..."
    
    sudo tee /etc/systemd/system/k8s-node-startup.service > /dev/null << 'EOF'
[Unit]
Description=Kubernetes Node Startup
After=network.target containerd.service
Requires=containerd.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/bash -c 'sleep 30 && systemctl is-active kubelet || systemctl start kubelet'
User=root

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl enable k8s-node-startup
    
    log "Startup service created and enabled"
}

# Display final instructions
show_final_instructions() {
    log "Kubernetes node setup completed!"
    echo
    echo "=== Summary ==="
    echo "Container Runtime: $CONTAINER_RUNTIME"
    echo "CNI Plugin: $CNI_PLUGIN"
    echo "Node Type: $NODE_TYPE"
    echo
    echo "=== Next Steps ==="
    
    if [[ "$NODE_TYPE" == "master" ]]; then
        echo "1. Reboot the system to ensure all changes take effect"
        echo "2. Run: ~/init-k8s-cluster.sh"
        echo "3. Save the join command for worker nodes"
        echo "4. Configure kubectl completion: source ~/.bashrc.d/kubectl"
    else
        echo "1. Reboot the system to ensure all changes take effect"
        echo "2. Get join command from master node"
        echo "3. Update ~/join-k8s-cluster.sh with actual values"
        echo "4. Run: ~/join-k8s-cluster.sh"
    fi
    
    echo
    echo "=== Management ==="
    echo "Node management: ~/k8s-node-manage.sh {status|logs|restart|reset|troubleshoot}"
    echo
    echo "=== Important Notes ==="
    echo "- Swap has been disabled"
    echo "- Required kernel modules are loaded"
    echo "- Firewall rules may need adjustment for cluster communication"
    echo "- Default CNI will use pod subnet: 10.244.0.0/16"
    echo
    warn "Please reboot the system before initializing/joining cluster"
}

# Main execution
main() {
    log "Starting Kubernetes node setup on Arch Linux..."
    log "Configuration: $CONTAINER_RUNTIME runtime, $CNI_PLUGIN CNI, $NODE_TYPE node"
    echo
    
    check_prerequisites
    install_packages
    configure_system
    
    case "$CONTAINER_RUNTIME" in
        containerd)
            configure_containerd
            ;;
        docker)
            configure_docker
            ;;
    esac
    
    configure_kubelet
    setup_cni
    create_cluster_init_script
    create_join_script_template
    create_management_scripts
    create_startup_service
    
    show_final_instructions
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --runtime)
            CONTAINER_RUNTIME="$2"
            shift 2
            ;;
        --cni)
            CNI_PLUGIN="$2"
            shift 2
            ;;
        --type)
            NODE_TYPE="$2"
            shift 2
            ;;
        --cluster-name)
            CLUSTER_NAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Configure Arch Linux for Kubernetes deployment"
            echo
            echo "Options:"
            echo "  --runtime RUNTIME     Container runtime (containerd|docker) [default: containerd]"
            echo "  --cni CNI            CNI plugin (calico|flannel|cilium) [default: calico]"
            echo "  --type TYPE          Node type (master|worker) [default: worker]"
            echo "  --cluster-name NAME  Cluster name [default: kubernetes]"
            echo "  --help               Show this help"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate arguments
case "$CONTAINER_RUNTIME" in
    containerd|docker) ;;
    *) error "Invalid container runtime: $CONTAINER_RUNTIME" ;;
esac

case "$CNI_PLUGIN" in
    calico|flannel|cilium) ;;
    *) error "Invalid CNI plugin: $CNI_PLUGIN" ;;
esac

case "$NODE_TYPE" in
    master|worker) ;;
    *) error "Invalid node type: $NODE_TYPE" ;;
esac

# Run main function
main "$@"