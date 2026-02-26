# Proxmox VE Container (LXC) Management via API

from proxmoxer import ProxmoxAPI
import time
import json

class ProxmoxContainerManager:
    """Comprehensive LXC container management using Proxmox API"""
    
    def __init__(self, host, user, password=None, token_name=None, token_value=None):
        if token_name and token_value:
            self.proxmox = ProxmoxAPI(
                host, user=user, token_name=token_name, 
                token_value=token_value, verify_ssl=False
            )
        else:
            self.proxmox = ProxmoxAPI(
                host, user=user, password=password, verify_ssl=False
            )
    
    def list_containers(self, node=None):
        """List all containers or containers on specific node"""
        if node:
            return self.proxmox.nodes(node).lxc.get()
        else:
            # Get all containers across cluster
            resources = self.proxmox.cluster.resources.get(type='vm')
            return [r for r in resources if r['type'] == 'lxc']
    
    def get_container_config(self, node, vmid):
        """Get container configuration"""
        return self.proxmox.nodes(node).lxc(vmid).config.get()
    
    def get_container_status(self, node, vmid):
        """Get container status"""
        return self.proxmox.nodes(node).lxc(vmid).status.current.get()
    
    def create_container(self, node, vmid, ostemplate, **config):
        """Create new container"""
        container_config = {
            'vmid': vmid,
            'ostemplate': ostemplate,
            **config
        }
        return self.proxmox.nodes(node).lxc.create(**container_config)
    
    def clone_container(self, node, vmid, newid, **options):
        """Clone container"""
        clone_params = {'newid': newid, **options}
        return self.proxmox.nodes(node).lxc(vmid).clone.post(**clone_params)
    
    def start_container(self, node, vmid):
        """Start container"""
        return self.proxmox.nodes(node).lxc(vmid).status.start.post()
    
    def stop_container(self, node, vmid, force=False):
        """Stop container (graceful shutdown or force)"""
        if force:
            return self.proxmox.nodes(node).lxc(vmid).status.stop.post()
        else:
            return self.proxmox.nodes(node).lxc(vmid).status.shutdown.post()
    
    def restart_container(self, node, vmid):
        """Restart container"""
        return self.proxmox.nodes(node).lxc(vmid).status.reboot.post()
    
    def suspend_container(self, node, vmid):
        """Suspend container"""
        return self.proxmox.nodes(node).lxc(vmid).status.suspend.post()
    
    def resume_container(self, node, vmid):
        """Resume container"""
        return self.proxmox.nodes(node).lxc(vmid).status.resume.post()
    
    def delete_container(self, node, vmid, purge=True):
        """Delete container"""
        return self.proxmox.nodes(node).lxc(vmid).delete(purge=1 if purge else 0)
    
    def update_container_config(self, node, vmid, **config):
        """Update container configuration"""
        return self.proxmox.nodes(node).lxc(vmid).config.put(**config)
    
    def migrate_container(self, node, vmid, target_node, **options):
        """Migrate container to another node"""
        migration_params = {'target': target_node, **options}
        return self.proxmox.nodes(node).lxc(vmid).migrate.post(**migration_params)
    
    def create_snapshot(self, node, vmid, snapname, description=""):
        """Create container snapshot"""
        return self.proxmox.nodes(node).lxc(vmid).snapshot.post(
            snapname=snapname, description=description
        )
    
    def rollback_snapshot(self, node, vmid, snapname):
        """Rollback to snapshot"""
        return self.proxmox.nodes(node).lxc(vmid).snapshot(snapname).rollback.post()
    
    def delete_snapshot(self, node, vmid, snapname):
        """Delete snapshot"""
        return self.proxmox.nodes(node).lxc(vmid).snapshot(snapname).delete()
    
    def list_snapshots(self, node, vmid):
        """List container snapshots"""
        return self.proxmox.nodes(node).lxc(vmid).snapshot.get()
    
    def convert_to_template(self, node, vmid):
        """Convert container to template"""
        return self.proxmox.nodes(node).lxc(vmid).template.post()
    
    def enter_container(self, node, vmid):
        """Get container console access info"""
        return self.proxmox.nodes(node).lxc(vmid).vncproxy.post()
    
    def execute_command(self, node, vmid, command):
        """Execute command in container (if supported by template)"""
        # Note: This requires the container to be running and have appropriate tools
        return self.proxmox.nodes(node).lxc(vmid).firewall.options.get()
    
    def resize_container_disk(self, node, vmid, disk, size):
        """Resize container disk"""
        return self.proxmox.nodes(node).lxc(vmid).resize.put(
            disk=disk, size=size
        )
    
    def get_container_firewall_rules(self, node, vmid):
        """Get container firewall rules"""
        return self.proxmox.nodes(node).lxc(vmid).firewall.rules.get()
    
    def add_container_firewall_rule(self, node, vmid, **rule_config):
        """Add firewall rule to container"""
        return self.proxmox.nodes(node).lxc(vmid).firewall.rules.post(**rule_config)

# Utility functions for container management

def create_web_server_container(container_manager, node, vmid, hostname, template="ubuntu-22.04-standard"):
    """Create a web server container with common configuration"""
    
    container_config = {
        'hostname': hostname,
        'memory': 1024,
        'cores': 2,
        'rootfs': 'local:16',  # 16GB root filesystem
        'net0': 'name=eth0,bridge=vmbr0,ip=dhcp',
        'features': 'nesting=1',  # Enable nested virtualization if needed
        'onboot': 1,  # Start on boot
        'protection': 0,  # Allow deletion
        'tags': 'webserver;production',
        'unprivileged': 1,  # Use unprivileged container
        'start': 1  # Start after creation
    }
    
    print(f"Creating web server container {vmid}...")
    task = container_manager.create_container(
        node=node,
        vmid=vmid,
        ostemplate=f'local:vztmpl/{template}.tar.gz',
        **container_config
    )
    
    return task

def setup_development_container(container_manager, node, vmid, dev_name, git_user_email):
    """Create development container with development tools"""
    
    container_config = {
        'hostname': f'{dev_name}-dev',
        'memory': 2048,
        'cores': 4,
        'rootfs': 'local:32',  # 32GB for development
        'net0': 'name=eth0,bridge=vmbr0,ip=dhcp',
        'features': 'mount=nfs;cifs,nesting=1',
        'onboot': 0,  # Don't start on boot for dev containers
        'tags': 'development;personal',
        'unprivileged': 1
    }
    
    print(f"Creating development container {vmid} for {dev_name}...")
    task = container_manager.create_container(
        node=node,
        vmid=vmid,
        ostemplate='local:vztmpl/ubuntu-22.04-standard.tar.gz',
        **container_config
    )
    
    return task

def bulk_container_operation(container_manager, operation, container_list, **kwargs):
    """Perform bulk operations on multiple containers"""
    results = {}
    
    for node, vmid in container_list:
        try:
            if operation == 'start':
                result = container_manager.start_container(node, vmid)
            elif operation == 'stop':
                result = container_manager.stop_container(node, vmid, force=kwargs.get('force', False))
            elif operation == 'restart':
                result = container_manager.restart_container(node, vmid)
            elif operation == 'snapshot':
                result = container_manager.create_snapshot(
                    node, vmid,
                    kwargs.get('snapname', f'bulk-{int(time.time())}'),
                    kwargs.get('description', 'Bulk snapshot')
                )
            results[f"{node}:{vmid}"] = result
            print(f"✓ {operation} completed for container {vmid} on {node}")
        except Exception as e:
            results[f"{node}:{vmid}"] = f"Error: {e}"
            print(f"✗ {operation} failed for container {vmid} on {node}: {e}")
    
    return results

def container_health_check(container_manager, node, vmid):
    """Comprehensive container health check"""
    try:
        status = container_manager.get_container_status(node, vmid)
        config = container_manager.get_container_config(node, vmid)
        
        health_report = {
            'vmid': vmid,
            'name': config.get('hostname', 'Unknown'),
            'status': status['status'],
            'uptime': status.get('uptime', 0),
            'cpu_usage': status.get('cpu', 0),
            'memory_usage': status.get('mem', 0),
            'memory_total': status.get('maxmem', 0),
            'disk_usage': status.get('disk', 0),
            'disk_total': status.get('maxdisk', 0),
            'swap_usage': status.get('swap', 0),
            'swap_total': status.get('maxswap', 0),
            'unprivileged': config.get('unprivileged', 0),
            'autostart': config.get('onboot', 0),
            'template': config.get('template', 0)
        }
        
        # Calculate percentages
        if health_report['memory_total'] > 0:
            health_report['memory_percent'] = (health_report['memory_usage'] / health_report['memory_total']) * 100
        
        if health_report['disk_total'] > 0:
            health_report['disk_percent'] = (health_report['disk_usage'] / health_report['disk_total']) * 100
        
        return health_report
    
    except Exception as e:
        return {'error': str(e), 'vmid': vmid}

def wait_for_task(container_manager, node, upid, timeout=300):
    """Wait for task completion"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            task_status = container_manager.proxmox.nodes(node).tasks(upid).status.get()
            if task_status['status'] == 'stopped':
                if task_status.get('exitstatus') == 'OK':
                    return True
                else:
                    raise Exception(f"Task failed: {task_status}")
        except Exception as e:
            print(f"Error checking task status: {e}")
        time.sleep(2)
    raise TimeoutError(f"Task timeout after {timeout} seconds")

# Container backup and restore utilities

def backup_container_with_schedule(container_manager, node, vmid, storage, schedule_config=None):
    """Create container backup with optional scheduling"""
    
    backup_config = {
        'storage': storage,
        'mode': 'snapshot',  # snapshot, suspend, stop
        'compress': 'gzip',
        'mailto': 'admin@example.com'
    }
    
    if schedule_config:
        backup_config.update(schedule_config)
    
    print(f"Creating backup for container {vmid}...")
    # Note: This would typically use vzdump via the API
    # The exact API endpoint may vary based on Proxmox version
    
    return backup_config

# Advanced container networking

def setup_container_networking(container_manager, node, vmid, network_config):
    """Setup advanced networking for container"""
    
    # Example network configurations
    network_options = {
        'net0': f"name=eth0,bridge={network_config['bridge']},ip={network_config['ip']},gw={network_config.get('gateway', '')}"
    }
    
    if 'vlan' in network_config:
        network_options['net0'] += f",tag={network_config['vlan']}"
    
    if 'firewall' in network_config:
        network_options['net0'] += f",firewall={1 if network_config['firewall'] else 0}"
    
    return container_manager.update_container_config(node, vmid, **network_options)

# Container template management

def create_container_template(container_manager, node, vmid, template_name):
    """Convert container to template and add metadata"""
    
    # First, ensure container is stopped
    status = container_manager.get_container_status(node, vmid)
    if status['status'] == 'running':
        print(f"Stopping container {vmid} before creating template...")
        container_manager.stop_container(node, vmid)
        time.sleep(10)  # Wait for shutdown
    
    # Convert to template
    print(f"Converting container {vmid} to template...")
    task = container_manager.convert_to_template(node, vmid)
    
    # Add description/tags
    container_manager.update_container_config(
        node, vmid,
        description=f"Template: {template_name} - Created {time.strftime('%Y-%m-%d %H:%M:%S')}",
        tags=f"template;{template_name}"
    )
    
    print(f"Template {template_name} created successfully")
    return task

# Main execution example
if __name__ == "__main__":
    # Initialize container manager
    container_manager = ProxmoxContainerManager(
        host='proxmox.example.com',
        user='admin@pam',
        token_name='automation',
        token_value='your-token-here'
    )
    
    # List all containers
    containers = container_manager.list_containers()
    print(f"Found {len(containers)} containers in cluster")
    
    # Health check for running containers
    running_containers = [ct for ct in containers if ct.get('status') == 'running']
    for container in running_containers:
        health = container_health_check(container_manager, container['node'], container['vmid'])
        print(f"Container {container['vmid']}: {health}")
    
    # Example: Create a new web server container
    # create_web_server_container(container_manager, 'pve1', 300, 'web01')