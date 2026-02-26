# Bunny.net Terraform Infrastructure Configuration
# Complete infrastructure-as-code setup for Bunny.net services

terraform {
  required_providers {
    bunnynet = {
      source  = "bunny-net/bunnynet"
      version = "~> 0.8.0"
    }
  }
}

# Configure the Bunny.net Provider
provider "bunnynet" {
  api_key = var.bunny_api_key
}

# Variables
variable "bunny_api_key" {
  description = "Bunny.net API key"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "example.com"
}

variable "origin_url" {
  description = "Origin server URL"
  type        = string
  default     = "https://origin.example.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Storage Zone for static assets
resource "bunnynet_storage_zone" "main" {
  name   = "${var.environment}-static-assets"
  region = "DE" # Frankfurt
  
  tags = {
    Environment = var.environment
    Purpose     = "static-assets"
  }
}

# CDN Pull Zone connected to storage
resource "bunnynet_pullzone" "static_cdn" {
  name                    = "${var.environment}-static-cdn"
  origin_url              = "https://${bunnynet_storage_zone.main.name}.b-cdn.net"
  storage_zone_id         = bunnynet_storage_zone.main.id
  
  # Performance optimizations
  enable_smart_cache      = true
  enable_webp             = true
  enable_avif_or_auto     = true
  enable_query_string_ordering = true
  
  # Cache settings
  cache_control_max_age   = 86400   # 24 hours
  browser_cache_max_age   = 86400   # 24 hours
  
  # Security
  enable_logging          = true
  logging_ip_anonymization_enabled = true
  
  # Geo protection (optional)
  enable_geo_protection   = false
  # geo_blocked_countries   = ["CN", "RU"] # Block specific countries if needed
  
  tags = {
    Environment = var.environment
    Type        = "static-assets"
  }
}

# CDN Pull Zone for dynamic content
resource "bunnynet_pullzone" "dynamic_cdn" {
  name       = "${var.environment}-dynamic-cdn"
  origin_url = var.origin_url
  type       = 0 # Standard
  
  # Performance settings
  enable_smart_cache      = true
  enable_webp             = true
  enable_avif_or_auto     = true
  enable_query_string_ordering = true
  
  # Cache settings for dynamic content
  cache_control_max_age   = 3600    # 1 hour
  browser_cache_max_age   = 3600    # 1 hour
  
  # Security
  enable_logging          = true
  logging_ip_anonymization_enabled = true
  zone_security_enabled   = true
  zone_security_key       = var.security_key
  
  tags = {
    Environment = var.environment
    Type        = "dynamic-content"
  }
}

# Custom hostname for main domain
resource "bunnynet_hostname" "www" {
  pullzone_id = bunnynet_pullzone.dynamic_cdn.id
  hostname    = "www.${var.domain_name}"
  force_ssl   = true
}

# Custom hostname for static assets subdomain
resource "bunnynet_hostname" "static" {
  pullzone_id = bunnynet_pullzone.static_cdn.id
  hostname    = "static.${var.domain_name}"
  force_ssl   = true
}

# SSL Certificate for main domain
resource "bunnynet_hostname_certificate" "www_ssl" {
  hostname_id = bunnynet_hostname.www.id
  
  # Use free SSL certificate
  certificate_type = "free"
}

# SSL Certificate for static subdomain
resource "bunnynet_hostname_certificate" "static_ssl" {
  hostname_id = bunnynet_hostname.static.id
  
  # Use free SSL certificate
  certificate_type = "free"
}

# Video Library for streaming
resource "bunnynet_video_library" "main" {
  name                    = "${var.environment}-videos"
  enabled_resolutions     = "240p,360p,480p,720p,1080p"
  
  # Player settings
  allow_direct_play       = true
  enable_mp4_fallback     = true
  keep_original_files     = false
  
  # Watermark settings (optional)
  has_watermark          = false
  
  # Captions settings
  captions_font_size     = 20
  captions_font_color    = "#FFFFFF"
  captions_background    = "#000000"
  
  tags = {
    Environment = var.environment
    Purpose     = "video-streaming"
  }
}

# Edge Rules for static assets caching
resource "bunnynet_edge_rule" "static_cache" {
  pullzone_id = bunnynet_pullzone.static_cdn.id
  description = "Cache static assets for 1 year"
  enabled     = true
  
  action_type       = 2 # Set cache time
  action_parameter1 = "31536000" # 1 year in seconds
  
  trigger {
    type                   = 0 # URL pattern
    pattern_matches        = ["*.css", "*.js", "*.jpg", "*.png", "*.gif", "*.ico", "*.woff2", "*.svg"]
    pattern_matching_type  = 0 # Match any
  }
}

# Edge Rule for security headers
resource "bunnynet_edge_rule" "security_headers" {
  pullzone_id = bunnynet_pullzone.dynamic_cdn.id
  description = "Add security headers"
  enabled     = true
  
  action_type       = 4 # Add response header
  action_parameter1 = "X-Frame-Options"
  action_parameter2 = "DENY"
  
  trigger {
    type                   = 0 # URL pattern
    pattern_matches        = ["*"]
    pattern_matching_type  = 0 # Match any
  }
}

# Additional security headers
resource "bunnynet_edge_rule" "csp_header" {
  pullzone_id = bunnynet_pullzone.dynamic_cdn.id
  description = "Add Content Security Policy"
  enabled     = true
  
  action_type       = 4 # Add response header
  action_parameter1 = "Content-Security-Policy"
  action_parameter2 = "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.${var.domain_name}; style-src 'self' 'unsafe-inline' https://static.${var.domain_name};"
  
  trigger {
    type                   = 0 # URL pattern
    pattern_matches        = ["*"]
    pattern_matching_type  = 0 # Match any
  }
}

# DNS Zone (if using Bunny DNS)
resource "bunnynet_dns_zone" "main" {
  domain = var.domain_name
  
  tags = {
    Environment = var.environment
  }
}

# DNS Records
resource "bunnynet_dns_record" "www" {
  dns_zone_id = bunnynet_dns_zone.main.id
  name        = "www"
  type        = "CNAME"
  value       = "${bunnynet_pullzone.dynamic_cdn.name}.b-cdn.net"
  ttl         = 300
}

resource "bunnynet_dns_record" "static" {
  dns_zone_id = bunnynet_dns_zone.main.id
  name        = "static"
  type        = "CNAME"
  value       = "${bunnynet_pullzone.static_cdn.name}.b-cdn.net"
  ttl         = 300
}

resource "bunnynet_dns_record" "root" {
  dns_zone_id = bunnynet_dns_zone.main.id
  name        = "@"
  type        = "A"
  value       = "185.199.108.153" # GitHub Pages IP or your server IP
  ttl         = 300
}

# Additional variables for security
variable "security_key" {
  description = "Security key for zone protection"
  type        = string
  sensitive   = true
  default     = "change-this-secret-key"
}

# Outputs
output "static_cdn_url" {
  description = "Static CDN URL"
  value       = "https://static.${var.domain_name}"
}

output "dynamic_cdn_url" {
  description = "Dynamic CDN URL"
  value       = "https://www.${var.domain_name}"
}

output "storage_zone_name" {
  description = "Storage zone name"
  value       = bunnynet_storage_zone.main.name
  sensitive   = true
}

output "storage_zone_password" {
  description = "Storage zone password"
  value       = bunnynet_storage_zone.main.password
  sensitive   = true
}

output "video_library_id" {
  description = "Video library ID"
  value       = bunnynet_video_library.main.id
}

output "video_library_api_key" {
  description = "Video library API key"
  value       = bunnynet_video_library.main.api_key
  sensitive   = true
}

# Local values for computed data
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "bunny-cdn-infrastructure"
  }
}

# Data sources for existing resources (if needed)
data "bunnynet_pullzone" "existing" {
  count = var.import_existing_pullzone ? 1 : 0
  id    = var.existing_pullzone_id
}

variable "import_existing_pullzone" {
  description = "Whether to import existing pull zone"
  type        = bool
  default     = false
}

variable "existing_pullzone_id" {
  description = "Existing pull zone ID to import"
  type        = number
  default     = 0
}