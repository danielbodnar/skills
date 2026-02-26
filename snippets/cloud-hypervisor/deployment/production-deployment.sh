#!/bin/bash
# Production Deployment Examples
# Enterprise-grade deployment configurations

set -euo pipefail

BINARY="/usr/bin/cloud-hypervisor"
BASE_DIR="/opt/cloud-hypervisor"
CONFIG_DIR="/etc/cloud-hypervisor"
LOG_DIR="/var/log/cloud-hypervisor"
PID_DIR="/var/run/cloud-hypervisor"

# Create directory structure
sudo mkdir -p "$CONFIG_DIR" "$LOG_DIR" "$PID_DIR"
sudo chown root:root "$CONFIG_DIR"
sudo chmod 755 "$CONFIG_DIR"

# Example 1: Systemd service configuration
echo "=== Systemd Service Configuration ==="

cat > /tmp/cloud-hypervisor@.service << 'EOF'
[Unit]
Description=Cloud Hypervisor VM %i
After=network.target
Wants=network.target

[Service]
Type=simple
User=cloud-hypervisor
Group=cloud-hypervisor
ExecStart=/usr/bin/cloud-hypervisor --config /etc/cloud-hypervisor/%i.json
ExecStop=/usr/bin/ch-remote --api-socket /var/run/cloud-hypervisor/%i.sock shutdown
PIDFile=/var/run/cloud-hypervisor/%i.pid
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30
Restart=on-failure
RestartSec=5
LimitNOFILE=65536
LimitMEMLOCK=infinity

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/cloud-hypervisor /var/run/cloud-hypervisor
RestrictNamespaces=true
RestrictRealtime=true
RestrictSUIDSGID=true
LockPersonality=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOF

echo "Created systemd service template: /tmp/cloud-hypervisor@.service"

# Example 2: Production VM configuration
echo "=== Production VM Configuration ==="

cat > /tmp/production-vm.json << 'EOF'
{
  "cpus": {
    "boot_vcpus": 8,
    "max_vcpus": 16,
    "topology": {
      "threads_per_core": 2,
      "cores_per_die": 2,
      "dies_per_package": 2,
      "packages": 1
    },
    "affinity": [
      {"vcpu": 0, "host_cpus": [0, 1]},
      {"vcpu": 1, "host_cpus": [2, 3]},
      {"vcpu": 2, "host_cpus": [4, 5]},
      {"vcpu": 3, "host_cpus": [6, 7]}
    ]
  },
  "memory": {
    "size": 8589934592,
    "hotplug_size": 17179869184,
    "hugepages": true,
    "hugepage_size": 1073741824,
    "shared": true,
    "mergeable": false
  },
  "payload": {
    "kernel": "/opt/kernels/vmlinux-production",
    "cmdline": "console=hvc0 root=/dev/vda1 rw quiet splash intel_iommu=on audit=1"
  },
  "disks": [
    {
      "path": "/var/lib/vms/production/system.qcow2",
      "readonly": false,
      "iommu": true,
      "num_queues": 4,
      "queue_size": 128,
      "id": "system"
    },
    {
      "path": "/var/lib/vms/production/data.qcow2",
      "readonly": false,
      "iommu": true,
      "num_queues": 8,
      "queue_size": 256,
      "id": "data"
    }
  ],
  "net": [
    {
      "tap": "prod-br0",
      "mac": "52:54:00:12:34:56",
      "ip": "10.0.1.100",
      "mask": "255.255.255.0",
      "num_queues": 8,
      "queue_size": 512,
      "iommu": true,
      "id": "primary"
    },
    {
      "vhost_user": true,
      "socket": "/var/run/openvswitch/vhost-user-prod",
      "mac": "52:54:00:12:34:57",
      "num_queues": 4,
      "vhost_mode": "Client",
      "id": "management"
    }
  ],
  "rng": {
    "src": "/dev/random"
  },
  "balloon": {
    "size": 1073741824,
    "deflate_on_oom": true,
    "free_page_reporting": true
  },
  "console": {
    "mode": "Pty",
    "iommu": false
  },
  "serial": {
    "mode": "File",
    "file": "/var/log/cloud-hypervisor/production-serial.log"
  },
  "api_socket": "/var/run/cloud-hypervisor/production.sock",
  "platform": {
    "num_pci_segments": 2,
    "iommu_segments": [0, 1],
    "serial_number": "CH-PROD-001",
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
  }
}
EOF

echo "Created production VM config: /tmp/production-vm.json"

# Example 3: High availability configuration
echo "=== High Availability Configuration ==="

cat > /tmp/ha-setup.sh << 'EOF'
#!/bin/bash
# High Availability Cloud Hypervisor Setup

set -euo pipefail

# HA configuration parameters
PRIMARY_HOST="node1.example.com"
SECONDARY_HOST="node2.example.com"
SHARED_STORAGE="/shared/vms"
MIGRATION_PORT="6000"

# Install keepalived for VIP management
sudo apt-get update
sudo apt-get install -y keepalived

# Configure keepalived for VIP failover
cat > /tmp/keepalived.conf << 'KEEPALIVED_EOF'
vrrp_script chk_ch {
    script "/usr/local/bin/check-cloud-hypervisor.sh"
    interval 2
    weight -2
    fall 3
    rise 2
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass changeme
    }
    virtual_ipaddress {
        10.0.1.10/24
    }
    track_script {
        chk_ch
    }
    notify_master "/usr/local/bin/ch-ha-master.sh"
    notify_backup "/usr/local/bin/ch-ha-backup.sh"
    notify_fault "/usr/local/bin/ch-ha-fault.sh"
}
KEEPALIVED_EOF

# Health check script
cat > /tmp/check-cloud-hypervisor.sh << 'HEALTH_EOF'
#!/bin/bash
# Check if Cloud Hypervisor is healthy
API_SOCKET="/var/run/cloud-hypervisor/production.sock"

if [ -S "$API_SOCKET" ]; then
    curl --unix-socket "$API_SOCKET" -s 'http://localhost/api/v1/vmm.ping' > /dev/null
    exit $?
else
    exit 1
fi
HEALTH_EOF

chmod +x /tmp/check-cloud-hypervisor.sh

# Master script
cat > /tmp/ch-ha-master.sh << 'MASTER_EOF'
#!/bin/bash
# Become HA master
logger "Cloud Hypervisor HA: Becoming master"
systemctl start cloud-hypervisor@production
MASTER_EOF

chmod +x /tmp/ch-ha-master.sh

# Backup script
cat > /tmp/ch-ha-backup.sh << 'BACKUP_EOF'
#!/bin/bash
# Become HA backup
logger "Cloud Hypervisor HA: Becoming backup"
systemctl stop cloud-hypervisor@production
BACKUP_EOF

chmod +x /tmp/ch-ha-backup.sh

echo "HA setup scripts created"
EOF

chmod +x /tmp/ha-setup.sh

# Example 4: Monitoring and alerting
echo "=== Monitoring Configuration ==="

cat > /tmp/monitoring-setup.sh << 'EOF'
#!/bin/bash
# Cloud Hypervisor monitoring setup

# Prometheus exporter for Cloud Hypervisor
cat > /tmp/ch-exporter.py << 'PYTHON_EOF'
#!/usr/bin/env python3
import json
import socket
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import requests_unixsocket

class CloudHypervisorCollector:
    def __init__(self, api_socket):
        self.api_socket = api_socket
        self.session = requests_unixsocket.Session()
    
    def collect_metrics(self):
        try:
            # Get VM info
            response = self.session.get(f'http+unix://{self.api_socket.replace("/", "%2F")}/api/v1/vm.info')
            vm_info = response.json()
            
            # Get VM counters
            response = self.session.get(f'http+unix://{self.api_socket.replace("/", "%2F")}/api/v1/vm.counters')
            counters = response.json()
            
            metrics = []
            
            # CPU metrics
            metrics.append(f'ch_vm_vcpus_total {vm_info["config"]["cpus"]["boot_vcpus"]}')
            metrics.append(f'ch_vm_vcpus_max {vm_info["config"]["cpus"]["max_vcpus"]}')
            
            # Memory metrics
            memory_size = vm_info["config"]["memory"]["size"]
            metrics.append(f'ch_vm_memory_total_bytes {memory_size}')
            
            # Disk I/O metrics
            if "block" in counters:
                for disk_id, disk_counters in counters["block"].items():
                    metrics.append(f'ch_vm_disk_read_bytes{{disk="{disk_id}"}} {disk_counters.get("read_bytes", 0)}')
                    metrics.append(f'ch_vm_disk_write_bytes{{disk="{disk_id}"}} {disk_counters.get("write_bytes", 0)}')
                    metrics.append(f'ch_vm_disk_read_ops{{disk="{disk_id}"}} {disk_counters.get("read_ops", 0)}')
                    metrics.append(f'ch_vm_disk_write_ops{{disk="{disk_id}"}} {disk_counters.get("write_ops", 0)}')
            
            # Network metrics
            if "net" in counters:
                for net_id, net_counters in counters["net"].items():
                    metrics.append(f'ch_vm_net_rx_bytes{{interface="{net_id}"}} {net_counters.get("rx_bytes", 0)}')
                    metrics.append(f'ch_vm_net_tx_bytes{{interface="{net_id}"}} {net_counters.get("tx_bytes", 0)}')
                    metrics.append(f'ch_vm_net_rx_packets{{interface="{net_id}"}} {net_counters.get("rx_packets", 0)}')
                    metrics.append(f'ch_vm_net_tx_packets{{interface="{net_id}"}} {net_counters.get("tx_packets", 0)}')
            
            return '\n'.join(metrics)
            
        except Exception as e:
            return f'# Error collecting metrics: {e}'

class MetricsHandler(BaseHTTPRequestHandler):
    def __init__(self, collector):
        self.collector = collector
        super().__init__()
    
    def do_GET(self):
        if self.path == '/metrics':
            metrics = self.collector.collect_metrics()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(metrics.encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    collector = CloudHypervisorCollector('/var/run/cloud-hypervisor/production.sock')
    
    def handler(*args):
        MetricsHandler(collector, *args)
    
    server = HTTPServer(('0.0.0.0', 9090), handler)
    server.serve_forever()
PYTHON_EOF

chmod +x /tmp/ch-exporter.py

# Alerting rules for Prometheus
cat > /tmp/ch-alerts.yml << 'YAML_EOF'
groups:
- name: cloud-hypervisor
  rules:
  - alert: CloudHypervisorDown
    expr: up{job="cloud-hypervisor"} == 0
    for: 30s
    labels:
      severity: critical
    annotations:
      summary: "Cloud Hypervisor instance is down"
      description: "Cloud Hypervisor {{ $labels.instance }} has been down for more than 30 seconds."
  
  - alert: CloudHypervisorHighCPU
    expr: rate(ch_vm_cpu_usage_seconds[5m]) > 0.8
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage in Cloud Hypervisor VM"
      description: "CPU usage is above 80% for {{ $labels.instance }}"
  
  - alert: CloudHypervisorHighMemory
    expr: ch_vm_memory_usage_bytes / ch_vm_memory_total_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage in Cloud Hypervisor VM"
      description: "Memory usage is above 90% for {{ $labels.instance }}"
YAML_EOF

echo "Monitoring setup created"
EOF

chmod +x /tmp/monitoring-setup.sh

# Example 5: Backup and disaster recovery
echo "=== Backup and Disaster Recovery ==="

cat > /tmp/backup-script.sh << 'EOF'
#!/bin/bash
# Cloud Hypervisor backup script

set -euo pipefail

VM_NAME="$1"
BACKUP_DIR="/backup/cloud-hypervisor"
API_SOCKET="/var/run/cloud-hypervisor/${VM_NAME}.sock"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$VM_NAME"

# Pause VM
echo "Pausing VM $VM_NAME..."
curl --unix-socket "$API_SOCKET" -X PUT 'http://localhost/api/v1/vm.pause'

# Create snapshot
echo "Creating snapshot..."
SNAPSHOT_CONFIG="{
    \"destination_url\": \"file://$BACKUP_DIR/$VM_NAME/snapshot_$DATE\"
}"

curl --unix-socket "$API_SOCKET" -X PUT \
     'http://localhost/api/v1/vm.snapshot' \
     -H 'Content-Type: application/json' \
     -d "$SNAPSHOT_CONFIG"

# Resume VM
echo "Resuming VM $VM_NAME..."
curl --unix-socket "$API_SOCKET" -X PUT 'http://localhost/api/v1/vm.resume'

# Compress backup
echo "Compressing backup..."
cd "$BACKUP_DIR/$VM_NAME"
tar -czf "snapshot_${DATE}.tar.gz" "snapshot_$DATE"
rm -rf "snapshot_$DATE"

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR/$VM_NAME" -name "snapshot_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$VM_NAME/snapshot_${DATE}.tar.gz"
EOF

chmod +x /tmp/backup-script.sh

# Example 6: Security hardening
echo "=== Security Hardening ==="

cat > /tmp/security-hardening.sh << 'EOF'
#!/bin/bash
# Security hardening for Cloud Hypervisor

set -euo pipefail

# Create dedicated user
sudo useradd -r -s /bin/false -d /var/lib/cloud-hypervisor cloud-hypervisor

# Set up directory permissions
sudo mkdir -p /var/lib/cloud-hypervisor
sudo chown cloud-hypervisor:cloud-hypervisor /var/lib/cloud-hypervisor
sudo chmod 750 /var/lib/cloud-hypervisor

# Configure AppArmor profile
cat > /tmp/cloud-hypervisor.apparmor << 'APPARMOR_EOF'
#include <tunables/global>

/usr/bin/cloud-hypervisor {
  #include <abstractions/base>
  
  capability sys_admin,
  capability net_admin,
  capability setgid,
  capability setuid,
  capability dac_override,
  
  /usr/bin/cloud-hypervisor mr,
  /dev/kvm rw,
  /dev/net/tun rw,
  /dev/urandom r,
  /dev/random r,
  /proc/sys/net/core/rmem_max r,
  /proc/sys/net/core/wmem_max r,
  /sys/devices/system/node/node*/hugepages/hugepages-*/nr_hugepages r,
  
  /var/lib/cloud-hypervisor/** rw,
  /var/run/cloud-hypervisor/** rw,
  /var/log/cloud-hypervisor/** rw,
  
  # VM disk images
  /var/lib/vms/** rw,
  
  # Network sockets
  /var/run/openvswitch/** rw,
  
  # Temporary files
  /tmp/** rw,
}
APPARMOR_EOF

sudo apparmor_parser -r /tmp/cloud-hypervisor.apparmor

# Configure SELinux policy (if using SELinux)
if command -v semanage &> /dev/null; then
    sudo semanage port -a -t virtd_port_t -p tcp 6000-6010
    sudo setsebool -P virt_use_rawip 1
    sudo setsebool -P virt_use_nfs 1
fi

echo "Security hardening applied"
EOF

chmod +x /tmp/security-hardening.sh

echo "Production deployment examples completed!"

# Summary
echo "=== Deployment Summary ==="
echo "Created files:"
echo "  - /tmp/cloud-hypervisor@.service (systemd service)"
echo "  - /tmp/production-vm.json (production config)"
echo "  - /tmp/ha-setup.sh (high availability)"
echo "  - /tmp/monitoring-setup.sh (monitoring)"
echo "  - /tmp/backup-script.sh (backup automation)"
echo "  - /tmp/security-hardening.sh (security)"

# Cleanup
rm -f $API_SOCKET