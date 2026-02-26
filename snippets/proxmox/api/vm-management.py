# Proxmox VE VM Management via API

from proxmoxer import ProxmoxAPI
import time
import json

class ProxmoxVMManager:
    """Comprehensive VM management using Proxmox API"""
    
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
    
    def list_vms(self, node=None):
        """List all VMs or VMs on specific node"""
        if node:
            return self.proxmox.nodes(node).qemu.get()
        else:
            # Get all VMs across cluster
            resources = self.proxmox.cluster.resources.get(type='vm')
            return [r for r in resources if r['type'] == 'qemu']
    
    def get_vm_config(self, node, vmid):
        """Get VM configuration"""
        return self.proxmox.nodes(node).qemu(vmid).config.get()
    
    def get_vm_status(self, node, vmid):
        """Get VM status"""
        return self.proxmox.nodes(node).qemu(vmid).status.current.get()
    
    def create_vm(self, node, vmid, config):
        """Create new VM"""
        return self.proxmox.nodes(node).qemu.create(**config, vmid=vmid)
    
    def clone_vm(self, node, vmid, newid, **options):
        """Clone VM"""
        clone_params = {'newid': newid, **options}
        return self.proxmox.nodes(node).qemu(vmid).clone.post(**clone_params)
    
    def start_vm(self, node, vmid):
        """Start VM"""
        return self.proxmox.nodes(node).qemu(vmid).status.start.post()
    
    def stop_vm(self, node, vmid, force=False):
        """Stop VM (graceful shutdown or force)"""
        if force:
            return self.proxmox.nodes(node).qemu(vmid).status.stop.post()
        else:
            return self.proxmox.nodes(node).qemu(vmid).status.shutdown.post()
    
    def reset_vm(self, node, vmid):
        """Reset VM"""
        return self.proxmox.nodes(node).qemu(vmid).status.reset.post()
    
    def suspend_vm(self, node, vmid):
        """Suspend VM"""
        return self.proxmox.nodes(node).qemu(vmid).status.suspend.post()
    
    def resume_vm(self, node, vmid):
        """Resume VM"""
        return self.proxmox.nodes(node).qemu(vmid).status.resume.post()
    
    def delete_vm(self, node, vmid, purge=True):
        """Delete VM"""
        return self.proxmox.nodes(node).qemu(vmid).delete(purge=1 if purge else 0)
    
    def update_vm_config(self, node, vmid, **config):
        """Update VM configuration"""
        return self.proxmox.nodes(node).qemu(vmid).config.put(**config)
    
    def migrate_vm(self, node, vmid, target_node, **options):
        """Migrate VM to another node"""
        migration_params = {'target': target_node, **options}
        return self.proxmox.nodes(node).qemu(vmid).migrate.post(**migration_params)
    
    def create_snapshot(self, node, vmid, snapname, description=""):
        """Create VM snapshot"""
        return self.proxmox.nodes(node).qemu(vmid).snapshot.post(
            snapname=snapname, description=description
        )
    
    def rollback_snapshot(self, node, vmid, snapname):
        """Rollback to snapshot"""
        return self.proxmox.nodes(node).qemu(vmid).snapshot(snapname).rollback.post()
    
    def delete_snapshot(self, node, vmid, snapname):
        """Delete snapshot"""
        return self.proxmox.nodes(node).qemu(vmid).snapshot(snapname).delete()
    
    def list_snapshots(self, node, vmid):
        """List VM snapshots"""
        return self.proxmox.nodes(node).qemu(vmid).snapshot.get()
    
    def create_template(self, node, vmid):
        """Convert VM to template"""
        return self.proxmox.nodes(node).qemu(vmid).template.post()
    
    def get_vm_vnc_info(self, node, vmid):
        """Get VNC connection info"""
        return self.proxmox.nodes(node).qemu(vmid).vncproxy.post()
    
    def get_vm_spice_info(self, node, vmid):
        """Get SPICE connection info"""
        return self.proxmox.nodes(node).qemu(vmid).spiceproxy.post()
    
    def send_key_sequence(self, node, vmid, key):
        """Send key sequence to VM"""
        return self.proxmox.nodes(node).qemu(vmid).sendkey.put(key=key)
    
    def wait_for_task(self, node, upid, timeout=300):
        """Wait for task completion"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            task_status = self.proxmox.nodes(node).tasks(upid).status.get()
            if task_status['status'] == 'stopped':
                if task_status.get('exitstatus') == 'OK':
                    return True
                else:
                    raise Exception(f"Task failed: {task_status}")
            time.sleep(2)
        raise TimeoutError(f"Task timeout after {timeout} seconds")

# Example usage and utility functions

def create_vm_from_template(vm_manager, node, template_vmid, new_vmid, vm_name, target_storage="local"):
    """Create VM from template with common settings"""
    
    # Clone template
    print(f"Cloning template {template_vmid} to create VM {new_vmid}...")
    clone_task = vm_manager.clone_vm(
        node=node,
        vmid=template_vmid,
        newid=new_vmid,
        name=vm_name,
        target=target_storage,
        full=1  # Full clone
    )
    
    # Wait for clone completion
    vm_manager.wait_for_task(node, clone_task)
    
    # Update VM configuration
    vm_manager.update_vm_config(
        node=node,
        vmid=new_vmid,
        memory=2048,
        cores=2,
        tags="production;webserver"
    )
    
    print(f"VM {new_vmid} created successfully")
    return new_vmid

def bulk_vm_operation(vm_manager, operation, vm_list, **kwargs):
    """Perform bulk operations on multiple VMs"""
    results = {}
    
    for node, vmid in vm_list:
        try:
            if operation == 'start':
                result = vm_manager.start_vm(node, vmid)
            elif operation == 'stop':
                result = vm_manager.stop_vm(node, vmid, force=kwargs.get('force', False))
            elif operation == 'snapshot':
                result = vm_manager.create_snapshot(
                    node, vmid, 
                    kwargs.get('snapname', f'bulk-{int(time.time())}'),
                    kwargs.get('description', 'Bulk snapshot')
                )
            results[f"{node}:{vmid}"] = result
            print(f"✓ {operation} completed for VM {vmid} on {node}")
        except Exception as e:
            results[f"{node}:{vmid}"] = f"Error: {e}"
            print(f"✗ {operation} failed for VM {vmid} on {node}: {e}")
    
    return results

def vm_health_check(vm_manager, node, vmid):
    """Comprehensive VM health check"""
    try:
        status = vm_manager.get_vm_status(node, vmid)
        config = vm_manager.get_vm_config(node, vmid)
        
        health_report = {
            'vmid': vmid,
            'name': config.get('name', 'Unknown'),
            'status': status['status'],
            'uptime': status.get('uptime', 0),
            'cpu_usage': status.get('cpu', 0),
            'memory_usage': status.get('mem', 0),
            'memory_total': status.get('maxmem', 0),
            'disk_usage': status.get('disk', 0),
            'disk_total': status.get('maxdisk', 0),
            'ha_enabled': config.get('ha', 0),
            'autostart': config.get('onboot', 0)
        }
        
        # Calculate percentages
        if health_report['memory_total'] > 0:
            health_report['memory_percent'] = (health_report['memory_usage'] / health_report['memory_total']) * 100
        
        if health_report['disk_total'] > 0:
            health_report['disk_percent'] = (health_report['disk_usage'] / health_report['disk_total']) * 100
        
        return health_report
    
    except Exception as e:
        return {'error': str(e), 'vmid': vmid}

# Advanced VM management examples

def setup_vm_from_iso(vm_manager, node, vmid, vm_name, iso_path, storage="local"):
    """Create and configure VM from ISO"""
    
    vm_config = {
        'name': vm_name,
        'memory': 2048,
        'cores': 2,
        'sockets': 1,
        'numa': 0,
        'scsihw': 'virtio-scsi-pci',
        'bootdisk': 'scsi0',
        'scsi0': f'{storage}:32',  # 32GB disk
        'ide2': f'{iso_path},media=cdrom',
        'net0': 'virtio,bridge=vmbr0,firewall=1',
        'ostype': 'l26',  # Linux 2.6+
        'boot': 'order=ide2;scsi0',
        'agent': 1,  # Enable QEMU guest agent
        'onboot': 1   # Start on boot
    }
    
    print(f"Creating VM {vmid} from ISO...")
    vm_manager.create_vm(node, vmid, vm_config)
    print(f"VM {vmid} created successfully")
    
    return vmid

# Main execution example
if __name__ == "__main__":
    # Initialize VM manager
    vm_manager = ProxmoxVMManager(
        host='proxmox.example.com',
        user='admin@pam',
        token_name='automation',
        token_value='your-token-here'
    )
    
    # List all VMs
    vms = vm_manager.list_vms()
    print(f"Found {len(vms)} VMs in cluster")
    
    # Health check for running VMs
    running_vms = [vm for vm in vms if vm.get('status') == 'running']
    for vm in running_vms:
        health = vm_health_check(vm_manager, vm['node'], vm['vmid'])
        print(f"VM {vm['vmid']}: {health}")