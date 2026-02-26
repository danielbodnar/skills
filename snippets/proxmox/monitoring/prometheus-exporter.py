#!/usr/bin/env python3
"""
Proxmox VE Prometheus Exporter
Collects metrics from Proxmox VE API and exposes them for Prometheus scraping
"""

import time
import json
import logging
import argparse
from concurrent.futures import ThreadPoolExecutor
from prometheus_client import start_http_server, Gauge, Counter, Info
from proxmoxer import ProxmoxAPI

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProxmoxExporter:
    """Proxmox VE metrics exporter for Prometheus"""
    
    def __init__(self, host, user, password=None, token_name=None, token_value=None, port=8000):
        self.host = host
        self.port = port
        
        # Connect to Proxmox
        try:
            if token_name and token_value:
                self.proxmox = ProxmoxAPI(
                    host, user=user, token_name=token_name, 
                    token_value=token_value, verify_ssl=False
                )
            else:
                self.proxmox = ProxmoxAPI(
                    host, user=user, password=password, verify_ssl=False
                )
            
            # Test connection
            self.proxmox.version.get()
            logger.info(f"Connected to Proxmox VE at {host}")
            
        except Exception as e:
            logger.error(f"Failed to connect to Proxmox: {e}")
            raise
        
        # Define Prometheus metrics
        self.setup_metrics()
    
    def setup_metrics(self):
        """Setup Prometheus metrics"""
        
        # Cluster metrics
        self.cluster_info = Info('proxmox_cluster_info', 'Cluster information')
        self.cluster_nodes_total = Gauge('proxmox_cluster_nodes_total', 'Total number of nodes in cluster')
        self.cluster_quorum = Gauge('proxmox_cluster_quorum', 'Cluster quorum status')
        
        # Node metrics
        self.node_info = Info('proxmox_node_info', 'Node information', ['node'])
        self.node_status = Gauge('proxmox_node_status', 'Node status (1=online, 0=offline)', ['node'])
        self.node_cpu_usage = Gauge('proxmox_node_cpu_usage_ratio', 'Node CPU usage ratio', ['node'])
        self.node_memory_usage = Gauge('proxmox_node_memory_usage_bytes', 'Node memory usage in bytes', ['node'])
        self.node_memory_total = Gauge('proxmox_node_memory_total_bytes', 'Node total memory in bytes', ['node'])
        self.node_disk_usage = Gauge('proxmox_node_disk_usage_bytes', 'Node disk usage in bytes', ['node'])
        self.node_disk_total = Gauge('proxmox_node_disk_total_bytes', 'Node total disk in bytes', ['node'])
        self.node_uptime = Gauge('proxmox_node_uptime_seconds', 'Node uptime in seconds', ['node'])
        
        # VM metrics
        self.vm_info = Info('proxmox_vm_info', 'VM information', ['node', 'vmid', 'name', 'type'])
        self.vm_status = Gauge('proxmox_vm_status', 'VM status (1=running, 0=stopped)', ['node', 'vmid', 'name', 'type'])
        self.vm_cpu_usage = Gauge('proxmox_vm_cpu_usage_ratio', 'VM CPU usage ratio', ['node', 'vmid', 'name', 'type'])
        self.vm_memory_usage = Gauge('proxmox_vm_memory_usage_bytes', 'VM memory usage in bytes', ['node', 'vmid', 'name', 'type'])
        self.vm_memory_total = Gauge('proxmox_vm_memory_total_bytes', 'VM total memory in bytes', ['node', 'vmid', 'name', 'type'])
        self.vm_disk_usage = Gauge('proxmox_vm_disk_usage_bytes', 'VM disk usage in bytes', ['node', 'vmid', 'name', 'type'])
        self.vm_disk_total = Gauge('proxmox_vm_disk_total_bytes', 'VM total disk in bytes', ['node', 'vmid', 'name', 'type'])
        self.vm_uptime = Gauge('proxmox_vm_uptime_seconds', 'VM uptime in seconds', ['node', 'vmid', 'name', 'type'])
        
        # Storage metrics
        self.storage_info = Info('proxmox_storage_info', 'Storage information', ['node', 'storage', 'type'])
        self.storage_status = Gauge('proxmox_storage_status', 'Storage status (1=available, 0=unavailable)', ['node', 'storage', 'type'])
        self.storage_usage = Gauge('proxmox_storage_usage_bytes', 'Storage usage in bytes', ['node', 'storage', 'type'])
        self.storage_total = Gauge('proxmox_storage_total_bytes', 'Storage total size in bytes', ['node', 'storage', 'type'])
        
        # Backup metrics
        self.backup_last_run = Gauge('proxmox_backup_last_run_timestamp', 'Last backup run timestamp', ['node', 'vmid', 'type'])
        self.backup_status = Gauge('proxmox_backup_status', 'Last backup status (1=success, 0=failed)', ['node', 'vmid', 'type'])
        
        # API metrics
        self.api_requests_total = Counter('proxmox_api_requests_total', 'Total API requests made')
        self.api_errors_total = Counter('proxmox_api_errors_total', 'Total API errors')
        self.collection_duration = Gauge('proxmox_collection_duration_seconds', 'Time spent collecting metrics')
    
    def collect_cluster_metrics(self):
        """Collect cluster-level metrics"""
        try:
            self.api_requests_total.inc()
            cluster_status = self.proxmox.cluster.status.get()
            
            # Find cluster info
            cluster_node = next((node for node in cluster_status if node.get('type') == 'cluster'), None)
            if cluster_node:
                self.cluster_info.info({
                    'name': cluster_node.get('name', 'unknown'),
                    'version': str(cluster_node.get('version', 'unknown')),
                    'nodes': str(cluster_node.get('nodes', 0)),
                    'quorate': str(cluster_node.get('quorate', False))
                })
                self.cluster_nodes_total.set(cluster_node.get('nodes', 0))
                self.cluster_quorum.set(1 if cluster_node.get('quorate') else 0)
            
            logger.debug("Collected cluster metrics")
            
        except Exception as e:
            self.api_errors_total.inc()
            logger.error(f"Error collecting cluster metrics: {e}")
    
    def collect_node_metrics(self):
        """Collect node metrics"""
        try:
            self.api_requests_total.inc()
            nodes = self.proxmox.nodes.get()
            
            for node in nodes:
                node_name = node['node']
                
                # Node info
                self.node_info.labels(node=node_name).info({
                    'status': node.get('status', 'unknown'),
                    'type': node.get('type', 'node'),
                    'level': node.get('level', ''),
                    'id': node.get('id', ''),
                    'local': str(node.get('local', False))
                })
                
                # Node status
                node_online = 1 if node.get('status') == 'online' else 0
                self.node_status.labels(node=node_name).set(node_online)
                
                if node_online:
                    try:
                        # Get detailed node status
                        self.api_requests_total.inc()
                        node_status = self.proxmox.nodes(node_name).status.get()
                        
                        # CPU usage
                        cpu_usage = node_status.get('cpu', 0)
                        self.node_cpu_usage.labels(node=node_name).set(cpu_usage)
                        
                        # Memory usage
                        memory_used = node_status.get('memory', {}).get('used', 0)
                        memory_total = node_status.get('memory', {}).get('total', 0)
                        self.node_memory_usage.labels(node=node_name).set(memory_used)
                        self.node_memory_total.labels(node=node_name).set(memory_total)
                        
                        # Disk usage
                        rootfs = node_status.get('rootfs', {})
                        disk_used = rootfs.get('used', 0)
                        disk_total = rootfs.get('total', 0)
                        self.node_disk_usage.labels(node=node_name).set(disk_used)
                        self.node_disk_total.labels(node=node_name).set(disk_total)
                        
                        # Uptime
                        uptime = node_status.get('uptime', 0)
                        self.node_uptime.labels(node=node_name).set(uptime)
                        
                    except Exception as e:
                        logger.warning(f"Error collecting detailed metrics for node {node_name}: {e}")
            
            logger.debug(f"Collected metrics for {len(nodes)} nodes")
            
        except Exception as e:
            self.api_errors_total.inc()
            logger.error(f"Error collecting node metrics: {e}")
    
    def collect_vm_metrics(self):
        """Collect VM and container metrics"""
        try:
            self.api_requests_total.inc()
            resources = self.proxmox.cluster.resources.get(type='vm')
            
            for resource in resources:
                node_name = resource.get('node', '')
                vmid = str(resource.get('vmid', ''))
                vm_name = resource.get('name', f'vm-{vmid}')
                vm_type = resource.get('type', 'unknown')
                
                # VM info
                self.vm_info.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).info({
                    'status': resource.get('status', 'unknown'),
                    'template': str(resource.get('template', 0)),
                    'pool': resource.get('pool', ''),
                    'tags': resource.get('tags', '')
                })
                
                # VM status
                vm_running = 1 if resource.get('status') == 'running' else 0
                self.vm_status.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(vm_running)
                
                # Resource usage
                cpu_usage = resource.get('cpu', 0)
                memory_usage = resource.get('mem', 0)
                memory_total = resource.get('maxmem', 0)
                disk_usage = resource.get('disk', 0)
                disk_total = resource.get('maxdisk', 0)
                uptime = resource.get('uptime', 0)
                
                self.vm_cpu_usage.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(cpu_usage)
                self.vm_memory_usage.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(memory_usage)
                self.vm_memory_total.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(memory_total)
                self.vm_disk_usage.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(disk_usage)
                self.vm_disk_total.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(disk_total)
                self.vm_uptime.labels(node=node_name, vmid=vmid, name=vm_name, type=vm_type).set(uptime)
            
            logger.debug(f"Collected metrics for {len(resources)} VMs/containers")
            
        except Exception as e:
            self.api_errors_total.inc()
            logger.error(f"Error collecting VM metrics: {e}")
    
    def collect_storage_metrics(self):
        """Collect storage metrics"""
        try:
            self.api_requests_total.inc()
            nodes = self.proxmox.nodes.get()
            
            for node in nodes:
                if node.get('status') != 'online':
                    continue
                    
                node_name = node['node']
                
                try:
                    self.api_requests_total.inc()
                    storages = self.proxmox.nodes(node_name).storage.get()
                    
                    for storage in storages:
                        storage_name = storage.get('storage', '')
                        storage_type = storage.get('type', 'unknown')
                        
                        # Storage info
                        self.storage_info.labels(node=node_name, storage=storage_name, type=storage_type).info({
                            'content': storage.get('content', ''),
                            'enabled': str(storage.get('enabled', 0)),
                            'shared': str(storage.get('shared', 0)),
                            'active': str(storage.get('active', 0))
                        })
                        
                        # Storage status
                        storage_active = 1 if storage.get('active') else 0
                        self.storage_status.labels(node=node_name, storage=storage_name, type=storage_type).set(storage_active)
                        
                        # Storage usage
                        used = storage.get('used', 0)
                        total = storage.get('total', 0)
                        self.storage_usage.labels(node=node_name, storage=storage_name, type=storage_type).set(used)
                        self.storage_total.labels(node=node_name, storage=storage_name, type=storage_type).set(total)
                
                except Exception as e:
                    logger.warning(f"Error collecting storage metrics for node {node_name}: {e}")
            
            logger.debug("Collected storage metrics")
            
        except Exception as e:
            self.api_errors_total.inc()
            logger.error(f"Error collecting storage metrics: {e}")
    
    def collect_metrics(self):
        """Collect all metrics"""
        start_time = time.time()
        
        try:
            # Use thread pool for parallel collection
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [
                    executor.submit(self.collect_cluster_metrics),
                    executor.submit(self.collect_node_metrics),
                    executor.submit(self.collect_vm_metrics),
                    executor.submit(self.collect_storage_metrics)
                ]
                
                # Wait for all to complete
                for future in futures:
                    future.result()
            
            collection_time = time.time() - start_time
            self.collection_duration.set(collection_time)
            logger.info(f"Metrics collection completed in {collection_time:.2f} seconds")
            
        except Exception as e:
            logger.error(f"Error during metrics collection: {e}")
            self.api_errors_total.inc()
    
    def run(self, interval=30):
        """Run the exporter"""
        # Start Prometheus HTTP server
        start_http_server(self.port)
        logger.info(f"Proxmox exporter started on port {self.port}")
        
        while True:
            try:
                self.collect_metrics()
                time.sleep(interval)
            except KeyboardInterrupt:
                logger.info("Shutting down exporter")
                break
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                time.sleep(interval)

def main():
    parser = argparse.ArgumentParser(description='Proxmox VE Prometheus Exporter')
    parser.add_argument('--host', required=True, help='Proxmox VE host')
    parser.add_argument('--user', required=True, help='Proxmox VE user')
    parser.add_argument('--password', help='Proxmox VE password')
    parser.add_argument('--token-name', help='Proxmox VE API token name')
    parser.add_argument('--token-value', help='Proxmox VE API token value')
    parser.add_argument('--port', type=int, default=8000, help='Exporter port (default: 8000)')
    parser.add_argument('--interval', type=int, default=30, help='Collection interval in seconds (default: 30)')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if not args.password and not (args.token_name and args.token_value):
        parser.error("Either --password or both --token-name and --token-value must be provided")
    
    exporter = ProxmoxExporter(
        host=args.host,
        user=args.user,
        password=args.password,
        token_name=args.token_name,
        token_value=args.token_value,
        port=args.port
    )
    
    exporter.run(interval=args.interval)

if __name__ == '__main__':
    main()

# Example usage:
# python3 prometheus-exporter.py --host proxmox.example.com --user monitoring@pam --token-name monitoring --token-value your-token-here
# 
# Or with password:
# python3 prometheus-exporter.py --host proxmox.example.com --user admin@pam --password your-password
#
# Example Prometheus configuration:
# scrape_configs:
#   - job_name: 'proxmox'
#     static_configs:
#       - targets: ['localhost:8000']
#     scrape_interval: 30s
#     scrape_timeout: 10s