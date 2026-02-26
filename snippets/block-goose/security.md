# Block Goose Security Best Practices

## API Key Management

### Environment Variables

```bash
# Secure API key storage
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="your-key"

# Disable keyring for local storage
export GOOSE_DISABLE_KEYRING=1
```

### Configuration Security

```yaml
# ~/.config/goose/config.yaml
# Never commit API keys to version control
providers:
  openai:
    api_key: "${OPENAI_API_KEY}"  # Use environment variables
    host: "https://api.openai.com/v1"
```

## Extension Security

### Allowlist Configuration

```yaml
# ~/.config/goose/allowlist.yaml
# Only allow trusted extensions
extensions:
  - id: github
    command: uvx mcp_github
  - id: postgres
    command: npx -y @modelcontextprotocol/server-postgres
```

### MCP Server Security

```python
# Secure MCP server implementation
from mcp.server.fastmcp import FastMCP
import os

mcp = FastMCP("Secure Extension")

@mcp.tool()
def secure_database_query(query: str) -> str:
    """Secure database query with input validation"""
    # Input validation
    if not query or len(query) > 1000:
        raise ValueError("Invalid query")
    
    # Sanitize input
    query = query.strip()
    
    # Use parameterized queries
    # Implementation with proper escaping
    
    return "Query results"
```

## Network Security

### Custom Endpoints

```bash
# Secure custom endpoint configuration
export OPENAI_HOST="https://your-secure-endpoint.internal"
export OPENAI_API_KEY="your-internal-api-key"

# Use HTTPS only
export OPENAI_HOST="https://api.openai.com/v1"  # Never HTTP
```

### Proxy Configuration

```bash
# Secure proxy setup
export HTTP_PROXY="http://proxy.internal:8080"
export HTTPS_PROXY="https://proxy.internal:8080"
export NO_PROXY="localhost,127.0.0.1,.internal"
```

## File System Security

### Permission Management

```yaml
# ~/.config/goose/config.yaml
settings:
  permissions:
    file_modification: true  # Control file access
    execution: false         # Restrict execution
    network: true           # Control network access
```

### Secure File Operations

```python
# Secure file handling in MCP servers
import os
import pathlib

@mcp.tool()
def read_secure_file(file_path: str) -> str:
    """Read file with security checks"""
    # Validate path
    path = pathlib.Path(file_path).resolve()
    
    # Check if path is within allowed directory
    allowed_dir = pathlib.Path("/allowed/directory").resolve()
    if not str(path).startswith(str(allowed_dir)):
        raise PermissionError("Access denied")
    
    # Check file existence and permissions
    if not path.exists() or not path.is_file():
        raise FileNotFoundError("File not found")
    
    # Read file securely
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()
```

## Secrets Management

### Keyring Security

```bash
# Secure keyring configuration
# Default: Uses system keyring
goose configure

# Disable keyring for local storage
export GOOSE_DISABLE_KEYRING=1
```

### Secret Storage Locations

```bash
# Secure storage locations
# macOS/Linux: ~/.config/goose/secrets.yaml
# Windows: %APPDATA%\Block\goose\config\secrets.yaml

# Ensure proper permissions
chmod 600 ~/.config/goose/secrets.yaml
```

## Runtime Security

### Container Security

```dockerfile
# Secure container setup
FROM python:3.11-slim

# Create non-root user
RUN useradd -m -u 1000 goose

# Set secure working directory
WORKDIR /app
RUN chown goose:goose /app

# Install as non-root
USER goose

# Install goose
RUN pip install --user goose-ai

# Run as non-root
CMD ["goose"]
```

### Process Isolation

```bash
# Run with limited privileges
sudo -u goose goose

# Use container runtime
podman run --rm -it --security-opt=no-new-privileges:true goose-ai
```

## Monitoring and Auditing

### Logging Security

```yaml
# ~/.config/goose/config.yaml
logging:
  level: INFO
  sensitive_data: false  # Never log sensitive data
  file: "/var/log/goose/goose.log"
  max_size: "10MB"
  max_files: 5
```

### Audit Configuration

```bash
# Enable audit logging
export GOOSE_AUDIT_LOG=1
export GOOSE_AUDIT_FILE="/var/log/goose/audit.log"

# Monitor file access
tail -f /var/log/goose/audit.log
```

## Network Security Headers

### Custom Headers

```bash
# Secure custom headers
export OPENAI_CUSTOM_HEADERS="X-API-Version=2023-10-01,X-Request-ID=unique-id"
```

### TLS Configuration

```python
# Secure TLS configuration in MCP servers
import ssl
import httpx

# Configure secure HTTP client
client = httpx.Client(
    verify=True,  # Verify SSL certificates
    timeout=30.0,
    limits=httpx.Limits(max_connections=10)
)
```

## Best Practices Summary

1. **Never commit API keys** - Use environment variables
2. **Use allowlists** - Restrict extension access
3. **Validate inputs** - Sanitize all user inputs
4. **Use HTTPS only** - Never use HTTP for API calls
5. **Limit permissions** - Use principle of least privilege
6. **Monitor access** - Enable audit logging
7. **Container security** - Run as non-root user
8. **Regular updates** - Keep Goose and extensions updated
9. **Secure storage** - Protect configuration files
10. **Network isolation** - Use secure network configurations
