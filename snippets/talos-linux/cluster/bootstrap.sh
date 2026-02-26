#!/bin/bash
# Talos Cluster Bootstrap Script

set -euo pipefail

# Configuration
CLUSTER_NAME="${CLUSTER_NAME:-production-cluster}"
CLUSTER_ENDPOINT="${CLUSTER_ENDPOINT:-https://api.cluster.local:6443}"
CONTROL_PLANE_IPS="${CONTROL_PLANE_IPS:-192.168.1.100,192.168.1.101,192.168.1.102}"
WORKER_IPS="${WORKER_IPS:-192.168.1.110,192.168.1.111,192.168.1.112}"
TALOSCONFIG="${TALOSCONFIG:-./talosconfig}"

# Convert comma-separated IPs to arrays
IFS=',' read -ra CP_IPS <<< "${CONTROL_PLANE_IPS}"
IFS=',' read -ra WORKER_IPS_ARRAY <<< "${WORKER_IPS}"

echo "🚀 Bootstrapping Talos cluster: ${CLUSTER_NAME}"
echo "Control Plane nodes: ${CONTROL_PLANE_IPS}"
echo "Worker nodes: ${WORKER_IPS}"

# Generate configuration if not exists
if [[ ! -f "controlplane.yaml" ]] || [[ ! -f "worker.yaml" ]] || [[ ! -f "${TALOSCONFIG}" ]]; then
    echo "📝 Generating cluster configuration..."
    talosctl gen config "${CLUSTER_NAME}" "${CLUSTER_ENDPOINT}" \
        --output-dir . \
        --with-docs \
        --with-examples \
        --config-patch @control-plane.patch.yaml \
        --config-patch-control-plane @control-plane-extra.patch.yaml \
        --config-patch-worker @worker.patch.yaml
fi

# Set talosctl configuration
export TALOSCONFIG="${TALOSCONFIG}"
echo "📡 Configuring talosctl endpoints..."
talosctl config endpoint ${CP_IPS[@]}
talosctl config node ${CP_IPS[0]}

# Apply configuration to control plane nodes
echo "⚙️  Applying configuration to control plane nodes..."
for i in "${!CP_IPS[@]}"; do
    echo "Configuring control plane node ${i+1}: ${CP_IPS[i]}"
    if [[ $i -eq 0 ]]; then
        # First node gets init config
        talosctl apply-config --insecure --nodes "${CP_IPS[i]}" --file controlplane.yaml
    else
        # Other nodes get controlplane config
        talosctl apply-config --insecure --nodes "${CP_IPS[i]}" --file controlplane.yaml
    fi
done

# Apply configuration to worker nodes
if [[ ${#WORKER_IPS_ARRAY[@]} -gt 0 ]] && [[ "${WORKER_IPS_ARRAY[0]}" != "" ]]; then
    echo "⚙️  Applying configuration to worker nodes..."
    for i in "${!WORKER_IPS_ARRAY[@]}"; do
        echo "Configuring worker node ${i+1}: ${WORKER_IPS_ARRAY[i]}"
        talosctl apply-config --insecure --nodes "${WORKER_IPS_ARRAY[i]}" --file worker.yaml
    done
fi

# Wait for nodes to be ready
echo "⏳ Waiting for nodes to be ready..."
sleep 30

# Bootstrap etcd cluster (only run once!)
echo "🔧 Bootstrapping etcd cluster on first control plane node..."
talosctl bootstrap --nodes "${CP_IPS[0]}"

# Wait for cluster to be ready
echo "⏳ Waiting for cluster to be ready..."
timeout 300 bash -c '
    while ! talosctl health --server=false 2>/dev/null; do
        echo "Waiting for cluster health..."
        sleep 10
    done
'

# Get kubeconfig
echo "📋 Retrieving kubeconfig..."
talosctl kubeconfig . --force

# Verify cluster
echo "✅ Verifying cluster..."
kubectl get nodes -o wide
kubectl get pods -A

echo ""
echo "🎉 Cluster bootstrap complete!"
echo ""
echo "Cluster information:"
echo "  Name: ${CLUSTER_NAME}"
echo "  Endpoint: ${CLUSTER_ENDPOINT}"
echo "  Control Planes: ${CONTROL_PLANE_IPS}"
echo "  Workers: ${WORKER_IPS}"
echo ""
echo "Next steps:"
echo "  1. Install CNI: kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml"
echo "  2. Install ingress controller"
echo "  3. Configure monitoring and logging"
echo ""
echo "Useful commands:"
echo "  talosctl dashboard"
echo "  talosctl health"
echo "  talosctl get members"