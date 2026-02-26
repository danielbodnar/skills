#!/bin/bash
# Talos Linux Basic Installation and Setup

set -euo pipefail

# Variables
CLUSTER_NAME="${CLUSTER_NAME:-my-talos-cluster}"
CLUSTER_ENDPOINT="${CLUSTER_ENDPOINT:-https://192.168.1.100:6443}"
CONTROL_PLANE_IP="${CONTROL_PLANE_IP:-192.168.1.100}"

echo "Setting up Talos Linux cluster: ${CLUSTER_NAME}"

# 1. Install talosctl if not present
if ! command -v talosctl &> /dev/null; then
    echo "Installing talosctl..."
    if command -v brew &> /dev/null; then
        brew install siderolabs/tap/talosctl
    else
        # Direct download for Linux
        TALOS_VERSION=$(curl -s https://api.github.com/repos/siderolabs/talos/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
        curl -Lo /tmp/talosctl "https://github.com/siderolabs/talos/releases/latest/download/talosctl-$(uname -s | tr "[:upper:]" "[:lower:]")-amd64"
        sudo install /tmp/talosctl /usr/local/bin/
        rm /tmp/talosctl
    fi
fi

# 2. Generate cluster configuration
echo "Generating cluster configuration..."
talosctl gen config "${CLUSTER_NAME}" "${CLUSTER_ENDPOINT}"

# 3. Configure talosctl
echo "Configuring talosctl..."
export TALOSCONFIG="$(pwd)/talosconfig"
talosctl config endpoint "${CONTROL_PLANE_IP}"
talosctl config node "${CONTROL_PLANE_IP}"

echo "✅ Basic setup complete!"
echo "Next steps:"
echo "1. Apply configuration to nodes: talosctl apply-config --insecure --nodes <node-ip> --file controlplane.yaml"
echo "2. Bootstrap cluster: talosctl bootstrap"
echo "3. Get kubeconfig: talosctl kubeconfig ."
echo ""
echo "Files created:"
echo "- controlplane.yaml (control plane configuration)"
echo "- worker.yaml (worker node configuration)"  
echo "- talosconfig (talosctl client configuration)"