#!/bin/bash
# Talos Monitoring Dashboard Setup

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-monitoring}"
PROMETHEUS_VERSION="${PROMETHEUS_VERSION:-v2.45.0}"
GRAFANA_VERSION="${GRAFANA_VERSION:-10.0.0}"

echo "🔧 Setting up monitoring dashboard for Talos cluster"

# Create monitoring namespace
echo "📁 Creating monitoring namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Install Prometheus
echo "📊 Installing Prometheus..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:$PROMETHEUS_VERSION
        ports:
        - containerPort: 9090
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
          - '--storage.tsdb.retention.time=200h'
          - '--web.enable-lifecycle'
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-storage
          mountPath: /prometheus
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: $NAMESPACE
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: $NAMESPACE
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    rule_files:
      - "talos.rules.yml"

    scrape_configs:
      - job_name: 'talos-apid'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          insecure_skip_verify: true
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__address__]
            regex: '(.+):10250'
            target_label: __address__
            replacement: '\${1}:50000'
          - source_labels: [__meta_kubernetes_node_name]
            target_label: instance

      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)

      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: \$1:\$2
            target_label: __address__

  talos.rules.yml: |
    groups:
    - name: talos
      rules:
      - alert: TalosNodeDown
        expr: up{job="talos-apid"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Talos node {{ \$labels.instance }} is down"
          description: "Talos node {{ \$labels.instance }} has been down for more than 5 minutes."

      - alert: TalosHighMemoryUsage
        expr: (talos_node_memory_used_bytes / talos_node_memory_total_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ \$labels.instance }}"
          description: "Memory usage is above 90% on {{ \$labels.instance }}"

      - alert: TalosHighDiskUsage
        expr: (talos_node_disk_used_bytes / talos_node_disk_total_bytes) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage on {{ \$labels.instance }}"
          description: "Disk usage is above 85% on {{ \$labels.instance }}"
EOF

# Install Grafana
echo "📈 Installing Grafana..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:$GRAFANA_VERSION
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin"
        - name: GF_INSTALL_PLUGINS
          value: "grafana-piechart-panel"
        volumeMounts:
        - name: grafana-storage
          mountPath: /var/lib/grafana
        - name: grafana-config
          mountPath: /etc/grafana/provisioning
      volumes:
      - name: grafana-storage
        emptyDir: {}
      - name: grafana-config
        configMap:
          name: grafana-config
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: $NAMESPACE
spec:
  selector:
    app: grafana
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: $NAMESPACE
data:
  datasources.yml: |
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      access: proxy
      url: http://prometheus:9090
      isDefault: true

  dashboards.yml: |
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      updateIntervalSeconds: 10
      options:
        path: /var/lib/grafana/dashboards

  talos-dashboard.json: |
    {
      "dashboard": {
        "id": null,
        "title": "Talos Linux Dashboard",
        "tags": ["talos", "linux"],
        "style": "dark",
        "timezone": "browser",
        "panels": [
          {
            "id": 1,
            "title": "Node Status",
            "type": "stat",
            "targets": [
              {
                "expr": "up{job=\"talos-apid\"}",
                "refId": "A"
              }
            ],
            "fieldConfig": {
              "defaults": {
                "color": {
                  "mode": "thresholds"
                },
                "thresholds": {
                  "steps": [
                    {
                      "color": "red",
                      "value": 0
                    },
                    {
                      "color": "green",
                      "value": 1
                    }
                  ]
                }
              }
            },
            "gridPos": {
              "h": 8,
              "w": 6,
              "x": 0,
              "y": 0
            }
          },
          {
            "id": 2,
            "title": "Memory Usage",
            "type": "timeseries",
            "targets": [
              {
                "expr": "(talos_node_memory_used_bytes / talos_node_memory_total_bytes) * 100",
                "refId": "A"
              }
            ],
            "gridPos": {
              "h": 8,
              "w": 18,
              "x": 6,
              "y": 0
            }
          }
        ],
        "time": {
          "from": "now-1h",
          "to": "now"
        },
        "refresh": "5s"
      }
    }
EOF

# Create service accounts and RBAC
echo "🔐 Creating RBAC configuration..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: $NAMESPACE
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups:
  - extensions
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: $NAMESPACE
EOF

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n "$NAMESPACE"
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n "$NAMESPACE"

# Port forward setup script
cat > monitor-portforward.sh <<EOF
#!/bin/bash
echo "Starting port forwards for monitoring..."
echo "Prometheus will be available at http://localhost:9090"
echo "Grafana will be available at http://localhost:3000 (admin/admin)"
echo ""
echo "Press Ctrl+C to stop"

trap 'kill %1; kill %2' SIGINT

kubectl port-forward svc/prometheus 9090:9090 -n $NAMESPACE &
kubectl port-forward svc/grafana 3000:3000 -n $NAMESPACE &

wait
EOF

chmod +x monitor-portforward.sh

echo ""
echo "✅ Monitoring setup complete!"
echo ""
echo "To access the dashboards:"
echo "  1. Run: ./monitor-portforward.sh"
echo "  2. Open Prometheus: http://localhost:9090"
echo "  3. Open Grafana: http://localhost:3000 (admin/admin)"
echo ""
echo "Talos dashboard command:"
echo "  talosctl dashboard"
echo ""
echo "Useful monitoring commands:"
echo "  kubectl logs -f deployment/prometheus -n $NAMESPACE"
echo "  kubectl logs -f deployment/grafana -n $NAMESPACE"
echo "  kubectl get pods -n $NAMESPACE"