# Proxmox VE API Authentication Examples

from proxmoxer import ProxmoxAPI
import requests
import json

# 1. Basic Authentication with Username/Password
def connect_with_password():
    """Connect to Proxmox using username and password"""
    proxmox = ProxmoxAPI(
        host='proxmox.example.com',
        user='admin@pam',
        password='your_password',
        verify_ssl=False,
        timeout=30
    )
    return proxmox

# 2. API Token Authentication
def connect_with_token():
    """Connect to Proxmox using API token"""
    proxmox = ProxmoxAPI(
        host='proxmox.example.com',
        user='admin@pam',
        token_name='mytoken',
        token_value='12345678-1234-1234-1234-1234567890ab',
        verify_ssl=False
    )
    return proxmox

# 3. Raw REST API with Ticket Authentication
def get_auth_ticket():
    """Get authentication ticket for raw API calls"""
    auth_data = {
        'username': 'admin@pam',
        'password': 'your_password'
    }
    
    response = requests.post(
        'https://proxmox.example.com:8006/api2/json/access/ticket',
        data=auth_data,
        verify=False
    )
    
    auth_info = response.json()['data']
    return {
        'ticket': auth_info['ticket'],
        'csrf_token': auth_info['CSRFPreventionToken']
    }

# 4. Raw API Call with Authentication
def make_authenticated_request(method, endpoint, data=None):
    """Make authenticated API request"""
    auth = get_auth_ticket()
    
    headers = {
        'Cookie': f'PVEAuthCookie={auth["ticket"]}',
        'CSRFPreventionToken': auth['csrf_token']
    }
    
    url = f'https://proxmox.example.com:8006/api2/json{endpoint}'
    
    if method.upper() == 'GET':
        response = requests.get(url, headers=headers, verify=False)
    elif method.upper() == 'POST':
        response = requests.post(url, headers=headers, data=data, verify=False)
    elif method.upper() == 'PUT':
        response = requests.put(url, headers=headers, data=data, verify=False)
    elif method.upper() == 'DELETE':
        response = requests.delete(url, headers=headers, verify=False)
    
    return response.json()

# 5. TypeScript/JavaScript API Token Example
typescript_example = """
import proxmoxApi from "proxmox-api";

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function connectToProxmox() {
    // Using API token
    const proxmox = proxmoxApi({
        host: 'proxmox.example.com',
        tokenID: 'admin@pam!mytoken',
        tokenSecret: '12345678-1234-1234-1234-1234567890ab'
    });
    
    // Using username/password
    const proxmoxPwd = proxmoxApi({
        host: 'proxmox.example.com',
        username: 'admin@pam',
        password: 'your_password'
    });
    
    return { proxmox, proxmoxPwd };
}
"""

# 6. Session Management
class ProxmoxSession:
    """Proxmox session wrapper with automatic reconnection"""
    
    def __init__(self, host, user, password=None, token_name=None, token_value=None):
        self.host = host
        self.user = user
        self.password = password
        self.token_name = token_name
        self.token_value = token_value
        self.proxmox = None
        self.connect()
    
    def connect(self):
        """Establish connection to Proxmox"""
        try:
            if self.token_name and self.token_value:
                self.proxmox = ProxmoxAPI(
                    self.host,
                    user=self.user,
                    token_name=self.token_name,
                    token_value=self.token_value,
                    verify_ssl=False
                )
            else:
                self.proxmox = ProxmoxAPI(
                    self.host,
                    user=self.user,
                    password=self.password,
                    verify_ssl=False
                )
            
            # Test connection
            self.proxmox.version.get()
            print(f"Connected to Proxmox at {self.host}")
            
        except Exception as e:
            print(f"Connection failed: {e}")
            raise
    
    def reconnect(self):
        """Reconnect if session expires"""
        print("Reconnecting to Proxmox...")
        self.connect()

# Usage examples
if __name__ == "__main__":
    # Test connection
    try:
        proxmox = connect_with_token()
        version = proxmox.version.get()
        print(f"Proxmox version: {version}")
        
        # List nodes
        nodes = proxmox.nodes.get()
        for node in nodes:
            print(f"Node: {node['node']} - Status: {node['status']}")
            
    except Exception as e:
        print(f"Error: {e}")