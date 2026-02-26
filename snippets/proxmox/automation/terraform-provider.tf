# Proxmox Terraform Provider Configuration

# Configure the Proxmox Provider
terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.66.0"
    }
  }
  required_version = ">= 1.5"
}

# Provider configuration with API token
provider "proxmox" {
  endpoint = "https://proxmox.example.com:8006/"
  username = "terraform@pam"
  password = var.proxmox_password
  
  # Alternative: Use API token
  # api_token = "${var.proxmox_user}!${var.proxmox_token_id}=${var.proxmox_token_secret}"
  
  insecure = true  # Set to false for production with valid SSL
  
  ssh {
    agent    = true
    username = "root"
  }
}

# Variables
variable "proxmox_password" {
  description = "Proxmox user password"
  type        = string
  sensitive   = true
}

variable "vm_template_name" {
  description = "Name of the VM template to clone"
  type        = string
  default     = "ubuntu-22.04-template"
}

variable "target_node" {
  description = "Proxmox node to deploy resources on"
  type        = string
  default     = "pve1"
}

# Data sources
data "proxmox_virtual_environment_datastores" "available" {
  node_name = var.target_node
}

data "proxmox_virtual_environment_nodes" "cluster_nodes" {}

# Create VM from template
resource "proxmox_virtual_environment_vm" "web_server" {
  name      = "web-server-01"
  node_name = var.target_node
  vm_id     = 200
  tags      = ["terraform", "webserver", "production"]

  clone {
    vm_id = 100  # Template VM ID
    full  = true
  }

  cpu {
    cores = 2
    type  = "host"
  }

  memory {
    dedicated = 2048
  }

  network_device {
    bridge      = "vmbr0"
    mac_address = "BC:24:11:12:34:56"
    vlan_id     = 100
  }

  disk {
    datastore_id = "local"
    file_id      = "local:100/vm-100-disk-0.qcow2"
    interface    = "scsi0"
    size         = 32
  }

  boot_order = ["scsi0"]

  agent {
    enabled = true
    trim    = true
  }

  initialization {
    ip_config {
      ipv4 {
        address = "192.168.1.200/24"
        gateway = "192.168.1.1"
      }
    }

    user_account {
      username = "ubuntu"
      password = "changeme123"
      keys = [
        file("~/.ssh/id_rsa.pub")
      ]
    }

    user_data_file_id = proxmox_virtual_environment_file.cloud_config.id
  }

  lifecycle {
    ignore_changes = [initialization]
  }
}

# Upload cloud-init configuration
resource "proxmox_virtual_environment_file" "cloud_config" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = var.target_node

  source_raw {
    data = templatefile("${path.module}/cloud-init.yml", {
      hostname = "web-server-01"
      domain   = "example.com"
    })
    file_name = "web-server-01-cloud-init.yml"
  }
}

# Create LXC container
resource "proxmox_virtual_environment_container" "database" {
  node_name = var.target_node
  vm_id     = 300
  tags      = ["terraform", "database", "production"]

  initialization {
    hostname = "db-server-01"

    ip_config {
      ipv4 {
        address = "192.168.1.201/24"
        gateway = "192.168.1.1"
      }
    }

    user_account {
      password = "changeme123"
      keys = [
        file("~/.ssh/id_rsa.pub")
      ]
    }
  }

  network_interface {
    name   = "eth0"
    bridge = "vmbr0"
  }

  operating_system {
    template_file_id = "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.gz"
    type             = "ubuntu"
  }

  cpu {
    cores = 2
  }

  memory {
    dedicated = 1024
    swap      = 512
  }

  disk {
    datastore_id = "local"
    size         = 16
  }

  features {
    nesting = true
  }

  startup {
    order      = 1
    up_delay   = 30
    down_delay = 60
  }
}

# Create storage
resource "proxmox_virtual_environment_datastores" "nfs_storage" {
  node_name = var.target_node

  nfs {
    id          = "nfs-backup"
    server      = "192.168.1.10"
    export      = "/mnt/backup"
    content     = ["backup", "iso", "vztmpl"]
    max_backups = 3
  }
}

# High Availability group
resource "proxmox_virtual_environment_hagroup" "production" {
  group_id = "production"
  comment  = "Production HA group"
  
  nodes = {
    "pve1" = {
      priority = 1
    }
    "pve2" = {
      priority = 2
    }
  }

  no_failback = false
  restricted  = false
}

# HA resource for VM
resource "proxmox_virtual_environment_haresource" "web_server_ha" {
  resource_id = "vm:${proxmox_virtual_environment_vm.web_server.vm_id}"
  group_id    = proxmox_virtual_environment_hagroup.production.group_id
  comment     = "Web server HA resource"
  
  enabled      = true
  max_relocate = 1
  max_restart  = 2
  state        = "started"
  
  depends_on = [
    proxmox_virtual_environment_vm.web_server,
    proxmox_virtual_environment_hagroup.production
  ]
}

# User and permissions
resource "proxmox_virtual_environment_user" "monitoring_user" {
  user_id   = "monitoring@pam"
  comment   = "Monitoring system user"
  email     = "monitoring@example.com"
  enabled   = true
  expiration_date = "2024-12-31T23:59:59Z"
  first_name      = "Monitoring"
  last_name       = "System"
}

resource "proxmox_virtual_environment_user_token" "monitoring_token" {
  comment               = "Monitoring API token"
  expiration_date      = "2024-12-31T23:59:59Z"
  privileges_separation = true
  token_name           = "monitoring"
  user_id              = proxmox_virtual_environment_user.monitoring_user.user_id
}

resource "proxmox_virtual_environment_role" "monitoring_role" {
  role_id = "MonitoringRole"
  
  privileges = [
    "VM.Audit",
    "Sys.Audit",
    "Datastore.Audit",
    "Node.Audit"
  ]
}

resource "proxmox_virtual_environment_acl" "monitoring_acl" {
  path      = "/"
  role_id   = proxmox_virtual_environment_role.monitoring_role.role_id
  user_id   = proxmox_virtual_environment_user.monitoring_user.user_id
  propagate = true
}

# Firewall configuration
resource "proxmox_virtual_environment_cluster_firewall" "cluster_firewall" {
  enabled = true
  
  ebtables = true
  input_policy = "DROP"
  output_policy = "ACCEPT"
  
  log_ratelimit {
    enabled = true
    burst   = 5
    rate    = "1/second"
  }
}

resource "proxmox_virtual_environment_firewall_rules" "cluster_rules" {
  node_name = var.target_node
  
  rule {
    type    = "in"
    action  = "ACCEPT"
    comment = "Allow SSH"
    dest    = ""
    dport   = "22"
    enable  = true
    iface   = ""
    log     = "info"
    pos     = 1
    proto   = "tcp"
    source  = "10.0.0.0/8"
    sport   = ""
  }

  rule {
    type    = "in"
    action  = "ACCEPT" 
    comment = "Allow Proxmox Web Interface"
    dest    = ""
    dport   = "8006"
    enable  = true
    iface   = ""
    log     = "info"
    pos     = 2
    proto   = "tcp"
    source  = "10.0.0.0/8"
    sport   = ""
  }
}

# Backup job
resource "proxmox_virtual_environment_backup_job" "daily_backup" {
  comment = "Daily backup of production VMs"
  
  node_name   = var.target_node
  schedule    = "02:00"
  storage_id  = "nfs-backup"
  
  selection {
    vm_id = proxmox_virtual_environment_vm.web_server.vm_id
  }
  
  selection {
    vm_id = proxmox_virtual_environment_container.database.vm_id
  }
  
  retention {
    keep_daily   = 7
    keep_weekly  = 4
    keep_monthly = 3
    keep_yearly  = 1
  }
  
  compression_type = "gzip"
  mode            = "snapshot"
  protected       = false
  
  notification {
    mode     = "auto"
    target   = "mail-to-admin"
  }
}

# Outputs
output "web_server_ip" {
  description = "IP address of the web server"
  value       = proxmox_virtual_environment_vm.web_server.initialization[0].ip_config[0].ipv4[0].address
}

output "database_ip" {
  description = "IP address of the database server"
  value       = proxmox_virtual_environment_container.database.initialization[0].ip_config[0].ipv4[0].address
}

output "monitoring_token" {
  description = "Monitoring API token"
  value       = proxmox_virtual_environment_user_token.monitoring_token.value
  sensitive   = true
}

output "cluster_nodes" {
  description = "Available cluster nodes"
  value       = data.proxmox_virtual_environment_nodes.cluster_nodes.names
}

# Example terraform.tfvars file:
# proxmox_password = "your-secure-password"
# vm_template_name = "ubuntu-22.04-template"
# target_node = "pve1"