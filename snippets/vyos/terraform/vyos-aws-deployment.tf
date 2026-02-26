# VyOS AWS Deployment with Terraform
# Deploy VyOS router in AWS with VPC, subnets, and security groups

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "availability_zone" {
  description = "AWS availability zone"
  type        = string
  default     = "us-east-1a"
}

variable "instance_type" {
  description = "EC2 instance type for VyOS"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "AWS key pair name"
  type        = string
}

variable "vyos_ami_id" {
  description = "VyOS AMI ID (check AWS Marketplace)"
  type        = string
  default     = "ami-0123456789abcdef0"  # Update with actual VyOS AMI
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH"
  type        = string
  default     = "0.0.0.0/0"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_ami" "vyos" {
  most_recent = true
  owners      = ["aws-marketplace"]
  
  filter {
    name   = "name"
    values = ["VyOS*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC
resource "aws_vpc" "vyos_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "vyos-vpc-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "vyos_igw" {
  vpc_id = aws_vpc.vyos_vpc.id
  
  tags = {
    Name        = "vyos-igw-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Public Subnet
resource "aws_subnet" "vyos_public_subnet" {
  vpc_id                  = aws_vpc.vyos_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "vyos-public-subnet-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Private Subnet
resource "aws_subnet" "vyos_private_subnet" {
  vpc_id            = aws_vpc.vyos_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = var.availability_zone
  
  tags = {
    Name        = "vyos-private-subnet-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Route Tables
resource "aws_route_table" "vyos_public_rt" {
  vpc_id = aws_vpc.vyos_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.vyos_igw.id
  }
  
  tags = {
    Name        = "vyos-public-rt-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

resource "aws_route_table" "vyos_private_rt" {
  vpc_id = aws_vpc.vyos_vpc.id
  
  route {
    cidr_block           = "0.0.0.0/0"
    network_interface_id = aws_network_interface.vyos_private_eni.id
  }
  
  tags = {
    Name        = "vyos-private-rt-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Route Table Associations
resource "aws_route_table_association" "vyos_public_rta" {
  subnet_id      = aws_subnet.vyos_public_subnet.id
  route_table_id = aws_route_table.vyos_public_rt.id
}

resource "aws_route_table_association" "vyos_private_rta" {
  subnet_id      = aws_subnet.vyos_private_subnet.id
  route_table_id = aws_route_table.vyos_private_rt.id
}

# Security Groups
resource "aws_security_group" "vyos_management_sg" {
  name_prefix = "vyos-management-${var.environment}-"
  vpc_id      = aws_vpc.vyos_vpc.id
  description = "Security group for VyOS management access"
  
  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access"
  }
  
  # HTTPS API access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "HTTPS API access"
  }
  
  # ICMP
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "ICMP within VPC"
  }
  
  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = {
    Name        = "vyos-management-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

resource "aws_security_group" "vyos_routing_sg" {
  name_prefix = "vyos-routing-${var.environment}-"
  vpc_id      = aws_vpc.vyos_vpc.id
  description = "Security group for VyOS routing functions"
  
  # Allow all traffic from private subnet
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.2.0/24"]
    description = "All traffic from private subnet"
  }
  
  # BGP
  ingress {
    from_port   = 179
    to_port     = 179
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "BGP"
  }
  
  # IPsec
  ingress {
    from_port   = 500
    to_port     = 500
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "IPsec IKE"
  }
  
  ingress {
    from_port   = 4500
    to_port     = 4500
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "IPsec NAT-T"
  }
  
  # ESP protocol
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "50"
    cidr_blocks = ["0.0.0.0/0"]
    description = "ESP"
  }
  
  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = {
    Name        = "vyos-routing-sg-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Network Interfaces
resource "aws_network_interface" "vyos_public_eni" {
  subnet_id         = aws_subnet.vyos_public_subnet.id
  private_ips       = ["10.0.1.10"]
  security_groups   = [aws_security_group.vyos_management_sg.id, aws_security_group.vyos_routing_sg.id]
  source_dest_check = false
  
  tags = {
    Name        = "vyos-public-eni-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

resource "aws_network_interface" "vyos_private_eni" {
  subnet_id         = aws_subnet.vyos_private_subnet.id
  private_ips       = ["10.0.2.10"]
  security_groups   = [aws_security_group.vyos_routing_sg.id]
  source_dest_check = false
  
  tags = {
    Name        = "vyos-private-eni-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Elastic IP
resource "aws_eip" "vyos_eip" {
  domain                    = "vpc"
  network_interface         = aws_network_interface.vyos_public_eni.id
  associate_with_private_ip = "10.0.1.10"
  depends_on                = [aws_internet_gateway.vyos_igw]
  
  tags = {
    Name        = "vyos-eip-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
  }
}

# User Data for VyOS initial configuration
locals {
  vyos_user_data = base64encode(templatefile("${path.module}/vyos-userdata.sh", {
    hostname     = "vyos-aws-${var.environment}"
    public_ip    = aws_network_interface.vyos_public_eni.private_ip
    private_ip   = aws_network_interface.vyos_private_eni.private_ip
    environment  = var.environment
  }))
}

# VyOS EC2 Instance
resource "aws_instance" "vyos_router" {
  ami           = data.aws_ami.vyos.id
  instance_type = var.instance_type
  key_name      = var.key_name
  user_data     = local.vyos_user_data
  
  network_interface {
    network_interface_id = aws_network_interface.vyos_public_eni.id
    device_index         = 0
  }
  
  network_interface {
    network_interface_id = aws_network_interface.vyos_private_eni.id
    device_index         = 1
  }
  
  tags = {
    Name        = "vyos-router-${var.environment}"
    Environment = var.environment
    Terraform   = "true"
    Role        = "router"
  }
  
  # Ensure instance is fully ready before considering complete
  provisioner "remote-exec" {
    inline = [
      "sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper begin",
      "sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system host-name vyos-aws-${var.environment}",
      "sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper commit",
      "sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper save",
      "sudo /opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end"
    ]
    
    connection {
      type        = "ssh"
      user        = "vyos"
      private_key = file("~/.ssh/${var.key_name}.pem")
      host        = aws_eip.vyos_eip.public_ip
    }
  }
}

# Outputs
output "vyos_public_ip" {
  description = "Public IP address of VyOS router"
  value       = aws_eip.vyos_eip.public_ip
}

output "vyos_private_ip_public" {
  description = "Private IP address of VyOS router (public subnet)"
  value       = aws_network_interface.vyos_public_eni.private_ip
}

output "vyos_private_ip_private" {
  description = "Private IP address of VyOS router (private subnet)"
  value       = aws_network_interface.vyos_private_eni.private_ip
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.vyos_vpc.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = aws_subnet.vyos_public_subnet.id
}

output "private_subnet_id" {
  description = "Private subnet ID"
  value       = aws_subnet.vyos_private_subnet.id
}

output "ssh_command" {
  description = "SSH command to connect to VyOS router"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem vyos@${aws_eip.vyos_eip.public_ip}"
}