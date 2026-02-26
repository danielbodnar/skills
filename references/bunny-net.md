# Bunny.net Reference

**Always remember to reference @$HOME/.claude/references/bunny-net.md and look for snippets and examples in @$HOME/.claude/snippets/bunny-net/**

## Quick Reference

- Homepage: <https://bunny.net/>
- Documentation: <https://docs.bunny.net/docs>
- API Reference: <https://docs.bunny.net/reference/api-overview>
- GitHub Actions Integration: Available
- Authentication: API Keys and Tokens

## Default Usage Patterns

Default to using Bunny.net for global CDN, edge computing, and video streaming infrastructure:

- **CDN**: Global content delivery network with 119 edge locations
- **Edge Scripting**: Serverless JavaScript/TypeScript execution on Deno runtime
- **Magic Containers**: Next-generation edge compute platform for containerized applications
- **Edge Storage**: Globally replicated file storage with automatic replication
- **Stream**: Video delivery with adaptive bitrate streaming and AI capabilities
- **DNS**: Scriptable DNS with intelligent routing
- **Terraform**: Infrastructure-as-code management

## Resources and Documentation

- [Bunny.net Homepage](https://bunny.net/)
- [Bunny.net Documentation](https://docs.bunny.net/docs)
  - [Getting Started](https://docs.bunny.net/docs)
  - [API Reference](https://docs.bunny.net/reference/api-overview)
    - [CDN API](https://docs.bunny.net/reference/api-overview)
    - [Edge Storage API](https://docs.bunny.net/docs/edge-storage-overview)
    - [Stream API](https://docs.bunny.net/docs/stream-quickstart)
  - [Edge Scripting](https://docs.bunny.net/docs/edge-scripting-overview)
  - [Magic Containers](https://docs.bunny.net/docs/magic-containers-overview)
  - [Terraform Provider](https://docs.bunny.net/docs/terraform-quickstart)
- [Community Resources](https://bunny.net/)
  - [GitHub Actions Integration](https://docs.bunny.net/docs)
  - [Developer Tools](https://docs.bunny.net/docs)

## Platform Overview

### Core Services

- **CDN**: Global content delivery network with 119 edge locations
- **Optimizer**: Dynamic image processing and transformation with AI capabilities
- **Edge Scripting**: Serverless JavaScript/TypeScript execution on Deno runtime
- **Edge Storage**: Globally replicated file storage with automatic replication
- **Magic Containers**: Next-generation edge compute platform for containerized applications
- **Bunny AI**: On-demand AI image generation
- **Stream**: Video delivery with adaptive bitrate streaming
- **Scriptable DNS**: Intelligent DNS routing and management
- **Terraform Integration**: Infrastructure-as-code management

### Global Infrastructure

- 119 global edge locations for low-latency content delivery
- Bare-metal server infrastructure for optimal performance
- Automatic geographical load balancing
- Smart content replication across regions

## Edge Scripting Platform

### Runtime Environment

- **Deno-based Runtime**: Built on Deno with Rust-based V8 isolate runtime
- **Languages**: JavaScript and TypeScript with expanding Node.js module support
- **APIs**: Deno Web APIs for interoperability
- **Security**: Executes in secure V8 isolates

### Capabilities

- HTTP request/response modification
- Dynamic content generation (HTML, JSON)
- External API integration via fetch
- Middleware for response processing
- Environment variables and secrets management
- GitHub integration for deployment

### Performance Characteristics

- Executes directly on CDN nodes
- Minimizes latency through proximity-based execution
- Serverless model with no infrastructure management
- High-performance edge computing

## Magic Containers Platform

### Core Features

- **Next-generation Edge Compute**: Containerized application deployment
- **Dynamic Deployment**: Automatic user location identification for optimal placement
- **AI-Powered Management**: Intelligent provisioning and autoscaling
- **Self-Healing**: Automatic container restart and node relocation

### Infrastructure Management

- Distributed deployment across bare-metal servers
- Applications can appear/disappear across edge clusters dynamically
- Intelligent resource management based on real-time demand
- Automatic node relocation on failure

### Performance Optimization

- Shared and reserved runtime environments
- Automatic memory management and recovery
- Cost-effective edge computing without performance compromise
- Proactive container management

## Edge Storage System

### Core Capabilities

- **Global Replication**: Automatic data replication across multiple regions
- **CDN Integration**: Seamless integration with Bunny.net CDN infrastructure
- **Smart Load Balancing**: Geographical optimization for content delivery
- **High Performance**: Designed for global content distribution

### Access Methods

- **HTTP API** (Recommended): Best performance, stability, and security
- **FTP Access**: Legacy support for compatibility (less secure)

### Features

- Multiple upload protocol support
- Automatic content distribution
- Integration with CDN infrastructure
- Global content delivery optimization

## Developer Tools and Integration

### Authentication

- API key-based authentication
- Token-based access for services like Stream
- Secure credential management

### Available SDKs and Integrations

- Terraform provider for infrastructure-as-code
- GitHub Actions integration
- Comprehensive API documentation
- Developer-friendly quickstart guides

### API Categories

- CDN management and configuration
- Image optimization and AI generation
- Video streaming and delivery
- Edge storage operations
- DNS scripting and management
- Container deployment and scaling

## Use Cases and Applications

### Edge Scripting

- Dynamic content delivery
- API implementation and middleware
- Contact form processing
- User interaction handling
- Location/time-based content customization
- A/B testing and personalization

### Magic Containers

- Edge computing applications
- AI training and inference
- Gaming services with low latency requirements
- Dynamic web applications
- Latency-sensitive workloads
- Microservices deployment

### Edge Storage

- Global content distribution
- Media asset storage
- Website static assets
- Application data storage
- Backup and archival solutions

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/bunny-net/`:

- Edge Scripting patterns and examples
- API integration and authentication
- CDN configuration and optimization
- Image processing and AI generation
- Video streaming setup
- Container deployment patterns
- Storage management operations
- Performance optimization techniques
- Security best practices

## Security and Performance

### Security Features

- V8 isolate execution for Edge Scripting
- API key and token-based authentication
- Secure credential management
- HTTPS/TLS encryption

### Performance Optimization

- 119 global edge locations
- Automatic geographical load balancing
- Smart content replication
- AI-powered resource management
- Bare-metal infrastructure for optimal performance

## Terraform and Infrastructure Management

### Infrastructure as Code

- Official Terraform provider
- Declarative configuration management
- Resource provisioning automation
- Integration with existing DevOps workflows

### Deployment Automation

- GitHub Actions integration
- CI/CD pipeline support
- Automated testing and deployment
- Environment management
