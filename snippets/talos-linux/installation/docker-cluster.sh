#!/bin/bash
# Create local Talos cluster using Docker

set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-talos-docker}"
WORKERS="${WORKERS:-2}"
CONTROL_PLANES="${CONTROL_PLANES:-1}"

echo "Creating Talos Docker cluster: ${CLUSTER_NAME}"

# Create cluster
talosctl cluster create \
    --name "${CLUSTER_NAME}" \
    --workers "${WORKERS}" \
    --controlplanes "${CONTROL_PLANES}" \
    --provisioner docker \
    --cidr 172.20.0.0/24 \
    --wait-timeout 5m \
    --with-apply-config \
    --with-debug

# Show cluster info
echo ""
echo "🎉 Cluster created successfully!"
echo ""
echo "Cluster information:"
talosctl cluster show --name "${CLUSTER_NAME}"

echo ""
echo "Cluster health:"
talosctl health --server=false

echo ""
echo "Kubernetes nodes:"
kubectl get nodes -o wide

echo ""
echo "Useful commands:"
echo "  View dashboard: talosctl dashboard"
echo "  Check logs: talosctl logs"
echo "  Destroy cluster: talosctl cluster destroy --name ${CLUSTER_NAME}"