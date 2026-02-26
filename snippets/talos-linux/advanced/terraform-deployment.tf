# Talos Linux Terraform Deployment Example

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    talos = {
      source  = "siderolabs/talos"
      version = "~> 0.5.0"
    }
  }
}

variable "cluster_name" {
  description = "Name of the Talos cluster"
  type        = string
  default     = "talos-cluster"
}

variable "control_plane_count" {
  description = "Number of control plane nodes"
  type        = number
  default     = 3
}

variable "worker_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "availability_zones" {
  description = "AWS availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# Data sources
data "aws_ami" "talos" {
  most_recent = true
  owners      = ["540036508848"] # Sidero Labs
  filter {
    name   = "name"
    values = ["talos-v1.6.0-*"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
resource "aws_vpc" "talos" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.cluster_name}-vpc"
  }
}

resource "aws_internet_gateway" "talos" {
  vpc_id = aws_vpc.talos.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

resource "aws_subnet" "talos" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.talos.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.cluster_name}-subnet-${count.index + 1}"
  }
}

resource "aws_route_table" "talos" {
  vpc_id = aws_vpc.talos.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.talos.id
  }

  tags = {
    Name = "${var.cluster_name}-rt"
  }
}

resource "aws_route_table_association" "talos" {
  count          = length(aws_subnet.talos)
  subnet_id      = aws_subnet.talos[count.index].id
  route_table_id = aws_route_table.talos.id
}

# Security Groups
resource "aws_security_group" "talos_control_plane" {
  name_prefix = "${var.cluster_name}-cp-"
  vpc_id      = aws_vpc.talos.id

  # Talos API
  ingress {
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # etcd
  ingress {
    from_port = 2379
    to_port   = 2380
    protocol  = "tcp"
    self      = true
  }

  # Kubelet
  ingress {
    from_port = 10250
    to_port   = 10250
    protocol  = "tcp"
    self      = true
  }

  # Node Port Services
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All internal traffic
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-cp-sg"
  }
}

resource "aws_security_group" "talos_worker" {
  name_prefix = "${var.cluster_name}-worker-"
  vpc_id      = aws_vpc.talos.id

  # Talos API
  ingress {
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Kubelet
  ingress {
    from_port = 10250
    to_port   = 10250
    protocol  = "tcp"
    self      = true
  }

  # Node Port Services
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All internal traffic
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-worker-sg"
  }
}

# Load Balancer for Control Plane
resource "aws_lb" "talos_control_plane" {
  name               = "${var.cluster_name}-cp-lb"
  internal           = false
  load_balancer_type = "network"
  subnets            = aws_subnet.talos[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.cluster_name}-cp-lb"
  }
}

resource "aws_lb_target_group" "talos_control_plane" {
  name     = "${var.cluster_name}-cp-tg"
  port     = 6443
  protocol = "TCP"
  vpc_id   = aws_vpc.talos.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = ""
    path                = ""
    port                = "traffic-port"
    protocol            = "TCP"
    timeout             = 10
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.cluster_name}-cp-tg"
  }
}

resource "aws_lb_listener" "talos_control_plane" {
  load_balancer_arn = aws_lb.talos_control_plane.arn
  port              = "6443"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.talos_control_plane.arn
  }
}

# Talos Configuration
resource "talos_machine_secrets" "this" {}

data "talos_machine_configuration" "control_plane" {
  cluster_name     = var.cluster_name
  cluster_endpoint = "https://${aws_lb.talos_control_plane.dns_name}:6443"
  machine_type     = "controlplane"
  machine_secrets  = talos_machine_secrets.this.machine_secrets
}

data "talos_machine_configuration" "worker" {
  cluster_name     = var.cluster_name
  cluster_endpoint = "https://${aws_lb.talos_control_plane.dns_name}:6443"
  machine_type     = "worker"
  machine_secrets  = talos_machine_secrets.this.machine_secrets
}

data "talos_client_configuration" "this" {
  cluster_name         = var.cluster_name
  client_configuration = talos_machine_secrets.this.client_configuration
  endpoints            = aws_instance.talos_control_plane[*].public_ip
}

# Control Plane Instances
resource "aws_instance" "talos_control_plane" {
  count                  = var.control_plane_count
  ami                    = data.aws_ami.talos.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.talos.key_name
  vpc_security_group_ids = [aws_security_group.talos_control_plane.id]
  subnet_id              = aws_subnet.talos[count.index % length(aws_subnet.talos)].id

  user_data = base64encode(data.talos_machine_configuration.control_plane.machine_configuration)

  tags = {
    Name = "${var.cluster_name}-cp-${count.index + 1}"
    Type = "control-plane"
  }
}

# Worker Instances
resource "aws_instance" "talos_worker" {
  count                  = var.worker_count
  ami                    = data.aws_ami.talos.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.talos.key_name
  vpc_security_group_ids = [aws_security_group.talos_worker.id]
  subnet_id              = aws_subnet.talos[count.index % length(aws_subnet.talos)].id

  user_data = base64encode(data.talos_machine_configuration.worker.machine_configuration)

  tags = {
    Name = "${var.cluster_name}-worker-${count.index + 1}"
    Type = "worker"
  }
}

# Attach Control Plane instances to Load Balancer
resource "aws_lb_target_group_attachment" "talos_control_plane" {
  count            = var.control_plane_count
  target_group_arn = aws_lb_target_group.talos_control_plane.arn
  target_id        = aws_instance.talos_control_plane[count.index].id
  port             = 6443
}

# SSH Key Pair (for debugging if needed)
resource "aws_key_pair" "talos" {
  key_name   = "${var.cluster_name}-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

# Bootstrap the cluster
resource "talos_machine_bootstrap" "this" {
  depends_on = [
    aws_instance.talos_control_plane,
    aws_lb_target_group_attachment.talos_control_plane,
  ]

  client_configuration = talos_machine_secrets.this.client_configuration
  endpoint             = aws_instance.talos_control_plane[0].public_ip
  node                 = aws_instance.talos_control_plane[0].public_ip
}

# Retrieve kubeconfig
data "talos_cluster_kubeconfig" "this" {
  depends_on = [talos_machine_bootstrap.this]

  client_configuration = talos_machine_secrets.this.client_configuration
  endpoint             = aws_instance.talos_control_plane[0].public_ip
  node                 = aws_instance.talos_control_plane[0].public_ip
}

# Outputs
output "talosconfig" {
  value     = data.talos_client_configuration.this.talos_config
  sensitive = true
}

output "kubeconfig" {
  value     = data.talos_cluster_kubeconfig.this.kubeconfig_raw
  sensitive = true
}

output "control_plane_ips" {
  value = aws_instance.talos_control_plane[*].public_ip
}

output "worker_ips" {
  value = aws_instance.talos_worker[*].public_ip
}

output "load_balancer_dns" {
  value = aws_lb.talos_control_plane.dns_name
}

output "cluster_endpoint" {
  value = "https://${aws_lb.talos_control_plane.dns_name}:6443"
}

# Save configurations to files
resource "local_file" "talosconfig" {
  content  = data.talos_client_configuration.this.talos_config
  filename = "${path.module}/talosconfig"
}

resource "local_file" "kubeconfig" {
  content  = data.talos_cluster_kubeconfig.this.kubeconfig_raw
  filename = "${path.module}/kubeconfig"
}