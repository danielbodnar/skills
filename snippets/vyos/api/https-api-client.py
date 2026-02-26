#!/usr/bin/env python3
"""
VyOS HTTPS API Client
Provides programmatic access to VyOS configuration and operational commands
"""

import requests
import json
import sys
from typing import Dict, List, Optional, Any
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class VyOSAPI:
    def __init__(self, host: str, api_key: str, port: int = 443, verify_ssl: bool = False):
        """
        Initialize VyOS API client
        
        Args:
            host: VyOS router IP address or hostname
            api_key: API key for authentication
            port: HTTPS port (default: 443)
            verify_ssl: Verify SSL certificates (default: False)
        """
        self.base_url = f"https://{host}:{port}/api"
        self.api_key = api_key
        self.verify_ssl = verify_ssl
        self.session = requests.Session()
        
    def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make API request to VyOS"""
        url = f"{self.base_url}/{endpoint}"
        payload = {"key": self.api_key, **data}
        
        try:
            response = self.session.post(
                url, 
                data=payload, 
                verify=self.verify_ssl,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {e}")
    
    def configure(self, commands: List[str]) -> Dict[str, Any]:
        """
        Execute configuration commands
        
        Args:
            commands: List of VyOS configuration commands
            
        Returns:
            API response dictionary
        """
        data = {"op": "configure", "path": commands}
        return self._make_request("configure", data)
    
    def set_config(self, path: List[str], value: Optional[str] = None) -> Dict[str, Any]:
        """
        Set configuration value
        
        Args:
            path: Configuration path as list (e.g., ['interfaces', 'ethernet', 'eth0', 'address'])
            value: Configuration value (optional for some commands)
            
        Returns:
            API response dictionary
        """
        data = {"op": "set", "path": path}
        if value:
            data["value"] = value
        return self._make_request("configure", data)
    
    def delete_config(self, path: List[str]) -> Dict[str, Any]:
        """
        Delete configuration
        
        Args:
            path: Configuration path to delete
            
        Returns:
            API response dictionary
        """
        data = {"op": "delete", "path": path}
        return self._make_request("configure", data)
    
    def show_config(self, path: List[str] = None) -> Dict[str, Any]:
        """
        Show configuration
        
        Args:
            path: Configuration path to show (optional, shows all if None)
            
        Returns:
            API response dictionary
        """
        data = {"op": "showConfig"}
        if path:
            data["path"] = path
        return self._make_request("retrieve", data)
    
    def commit(self) -> Dict[str, Any]:
        """Commit configuration changes"""
        data = {"op": "commit"}
        return self._make_request("config-file", data)
    
    def save(self) -> Dict[str, Any]:
        """Save configuration"""
        data = {"op": "save"}
        return self._make_request("config-file", data)
    
    def show_operational(self, command: str) -> Dict[str, Any]:
        """
        Execute operational show command
        
        Args:
            command: Operational command (e.g., 'show interfaces')
            
        Returns:
            API response dictionary
        """
        data = {"op": "show", "path": command.split()}
        return self._make_request("retrieve", data)
    
    def reset_operational(self, command: str) -> Dict[str, Any]:
        """
        Execute operational reset command
        
        Args:
            command: Reset command (e.g., 'reset interfaces statistics')
            
        Returns:
            API response dictionary
        """
        data = {"op": "reset", "path": command.split()}
        return self._make_request("op-mode", data)
    
    def generate_operational(self, command: str) -> Dict[str, Any]:
        """
        Execute operational generate command
        
        Args:
            command: Generate command (e.g., 'generate ssh-keys')
            
        Returns:
            API response dictionary
        """
        data = {"op": "generate", "path": command.split()}
        return self._make_request("op-mode", data)

# Example usage and test functions
def configure_basic_router(api: VyOSAPI, hostname: str, lan_ip: str, wan_interface: str):
    """Configure basic router settings"""
    print(f"Configuring basic router settings for {hostname}")
    
    # Set hostname
    result = api.set_config(['system', 'host-name'], hostname)
    print(f"Set hostname: {result}")
    
    # Configure LAN interface
    result = api.set_config(['interfaces', 'ethernet', 'eth0', 'address'], lan_ip)
    print(f"Set LAN IP: {result}")
    
    # Configure WAN interface for DHCP
    result = api.set_config(['interfaces', 'ethernet', wan_interface, 'address'], 'dhcp')
    print(f"Set WAN DHCP: {result}")
    
    # Enable SSH
    result = api.set_config(['service', 'ssh', 'port'], '22')
    print(f"Enable SSH: {result}")
    
    # Configure NAT
    result = api.set_config(['nat', 'source', 'rule', '100', 'outbound-interface'], wan_interface)
    api.set_config(['nat', 'source', 'rule', '100', 'source', 'address'], '192.168.1.0/24')
    api.set_config(['nat', 'source', 'rule', '100', 'translation', 'address'], 'masquerade')
    print(f"Configure NAT: {result}")
    
    # Commit changes
    result = api.commit()
    print(f"Commit: {result}")
    
    # Save configuration
    result = api.save()
    print(f"Save: {result}")

def monitor_interfaces(api: VyOSAPI):
    """Monitor interface status and statistics"""
    print("Monitoring interface status...")
    
    # Show interface summary
    result = api.show_operational('show interfaces')
    print(f"Interface status: {json.dumps(result, indent=2)}")
    
    # Show interface statistics
    result = api.show_operational('show interfaces ethernet statistics')
    print(f"Interface statistics: {json.dumps(result, indent=2)}")

def configure_bgp_neighbor(api: VyOSAPI, local_as: str, neighbor_ip: str, neighbor_as: str):
    """Configure BGP neighbor"""
    print(f"Configuring BGP neighbor {neighbor_ip}")
    
    # Set BGP AS number
    api.set_config(['protocols', 'bgp', 'system-as'], local_as)
    
    # Configure BGP neighbor
    api.set_config(['protocols', 'bgp', 'neighbor', neighbor_ip, 'remote-as'], neighbor_as)
    api.set_config(['protocols', 'bgp', 'neighbor', neighbor_ip, 'description'], 'API configured neighbor')
    
    # Commit and save
    api.commit()
    api.save()
    print("BGP neighbor configured successfully")

def main():
    """Example usage of VyOS API client"""
    # Configuration
    VYOS_HOST = "192.168.1.1"
    API_KEY = "your-api-key-here"
    
    try:
        # Initialize API client
        api = VyOSAPI(VYOS_HOST, API_KEY)
        
        # Test connectivity
        result = api.show_config(['system', 'host-name'])
        print(f"Connection test: {result}")
        
        # Configure basic router (uncomment to run)
        # configure_basic_router(api, "vyos-api-router", "192.168.1.1/24", "eth1")
        
        # Monitor interfaces (uncomment to run)
        # monitor_interfaces(api)
        
        # Configure BGP (uncomment to run)
        # configure_bgp_neighbor(api, "65001", "10.0.0.2", "65002")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()