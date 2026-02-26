/**
 * Actual Budget Server Configuration Examples
 * 
 * This file demonstrates server setup, configuration management,
 * and deployment patterns for Actual Budget.
 */

// Server configuration interface
export interface ActualServerConfig {
  port?: number | string;
  hostname?: string;
  https?: {
    key: string;
    cert: string;
    [key: string]: any; // Additional TLS options
  };
  serverFiles?: string;
  userFiles?: string;
  webRoot?: string;
  loginMethod?: 'password' | 'header' | 'openid';
  allowedLoginMethods?: Array<'password' | 'header' | 'openid'>;
  trustedProxies?: string[];
  uploadFileSizeLimitMB?: number;
  uploadSyncFileSizeLimitMB?: number;
  uploadSyncEncryptedFileSizeLimitMB?: number;
}

// Default server configuration
export const defaultConfig: ActualServerConfig = {
  port: 5006,
  hostname: '::',
  serverFiles: './server-files',
  userFiles: './user-files',
  loginMethod: 'password',
  allowedLoginMethods: ['password', 'header', 'openid'],
  trustedProxies: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7', '::1/128'],
  uploadFileSizeLimitMB: 20,
  uploadSyncFileSizeLimitMB: 20,
  uploadSyncEncryptedFileSizeLimitMB: 50
};

// Development configuration
export const developmentConfig: ActualServerConfig = {
  ...defaultConfig,
  port: 3001,
  hostname: 'localhost',
  serverFiles: './dev-server-files',
  userFiles: './dev-user-files'
};

// Production configuration with HTTPS
export const productionConfig: ActualServerConfig = {
  ...defaultConfig,
  port: 443,
  hostname: '::',
  https: {
    key: process.env.ACTUAL_HTTPS_KEY || '/etc/ssl/private/actual.key',
    cert: process.env.ACTUAL_HTTPS_CERT || '/etc/ssl/certs/actual.crt'
  },
  serverFiles: '/data/server-files',
  userFiles: '/data/user-files',
  trustedProxies: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']
};

// Docker configuration
export const dockerConfig: ActualServerConfig = {
  ...defaultConfig,
  port: process.env.ACTUAL_PORT || 5006,
  hostname: process.env.ACTUAL_HOSTNAME || '::',
  serverFiles: '/data/server-files',
  userFiles: '/data/user-files'
};

// Environment variable mapping
export const getConfigFromEnv = (): ActualServerConfig => {
  const config: ActualServerConfig = {
    port: process.env.ACTUAL_PORT || defaultConfig.port,
    hostname: process.env.ACTUAL_HOSTNAME || defaultConfig.hostname,
    serverFiles: process.env.ACTUAL_SERVER_FILES || process.env.ACTUAL_DATA_DIR || defaultConfig.serverFiles,
    userFiles: process.env.ACTUAL_USER_FILES || process.env.ACTUAL_DATA_DIR || defaultConfig.userFiles,
    webRoot: process.env.ACTUAL_WEB_ROOT,
    loginMethod: (process.env.ACTUAL_LOGIN_METHOD as any) || defaultConfig.loginMethod,
    uploadFileSizeLimitMB: parseInt(process.env.ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB || '20'),
    uploadSyncFileSizeLimitMB: parseInt(process.env.ACTUAL_UPLOAD_FILE_SYNC_SIZE_LIMIT_MB || '20'),
    uploadSyncEncryptedFileSizeLimitMB: parseInt(process.env.ACTUAL_UPLOAD_SYNC_ENCRYPTED_FILE_SYNC_SIZE_LIMIT_MB || '50')
  };

  // HTTPS configuration
  if (process.env.ACTUAL_HTTPS_KEY && process.env.ACTUAL_HTTPS_CERT) {
    config.https = {
      key: process.env.ACTUAL_HTTPS_KEY,
      cert: process.env.ACTUAL_HTTPS_CERT
    };
  }

  // Trusted proxies
  if (process.env.ACTUAL_TRUSTED_PROXIES) {
    config.trustedProxies = process.env.ACTUAL_TRUSTED_PROXIES.split(',').map(p => p.trim());
  }

  // Allowed login methods
  if (process.env.ACTUAL_ALLOWED_LOGIN_METHODS) {
    config.allowedLoginMethods = process.env.ACTUAL_ALLOWED_LOGIN_METHODS.split(',').map(m => m.trim()) as any;
  }

  return config;
};

// Generate config.json file
export const generateConfigFile = (config: ActualServerConfig, filePath = './config.json') => {
  const fs = require('fs');
  
  try {
    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync(filePath, configJson, 'utf8');
    console.log(`Configuration file generated: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Failed to generate config file:', error);
    return false;
  }
};

// Docker Compose configuration
export const dockerComposeConfig = {
  version: '3.8',
  services: {
    'actual-server': {
      image: 'actualbudget/actual-server:latest',
      restart: 'unless-stopped',
      ports: ['5006:5006'],
      volumes: ['actual-data:/data'],
      environment: {
        ACTUAL_PORT: '5006',
        ACTUAL_LOGIN_METHOD: 'password'
      }
    }
  },
  volumes: {
    'actual-data': {}
  }
};

// Docker Compose with reverse proxy (Traefik)
export const dockerComposeWithTraefik = {
  version: '3.8',
  services: {
    traefik: {
      image: 'traefik:latest',
      restart: 'unless-stopped',
      ports: ['80:80', '443:443'],
      volumes: [
        './traefik.yaml:/etc/traefik/traefik.yaml',
        './traefik/data:/data',
        '/var/run/docker.sock:/var/run/docker.sock'
      ]
    },
    'actual-server': {
      image: 'actualbudget/actual-server:latest',
      restart: 'unless-stopped',
      labels: [
        'traefik.enable=true',
        'traefik.http.routers.actual-server.rule=Host(`budget.example.org`)',
        'traefik.http.routers.actual-server.entrypoints=websecure',
        'traefik.http.services.actual-server.loadbalancer.server.port=5006'
      ],
      volumes: ['./actual-data:/data']
    }
  }
};

// Traefik configuration
export const traefikConfig = {
  entryPoints: {
    web: {
      address: ':80',
      http: {
        redirections: {
          entryPoint: {
            to: 'websecure',
            scheme: 'https',
            permanent: true
          }
        }
      }
    },
    websecure: {
      address: ':443',
      http: {
        tls: {
          certResolver: 'letsencrypt'
        }
      }
    }
  },
  providers: {
    docker: {}
  },
  certificatesResolvers: {
    letsencrypt: {
      acme: {
        email: 'you@example.com',
        storage: '/data/letsencrypt.json',
        httpChallenge: {
          entryPoint: 'web'
        }
      }
    }
  }
};

// NGINX reverse proxy configuration
export const nginxConfig = `
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name budget.example.com;

  # SSL Configuration
  ssl_certificate /etc/letsencrypt/live/budget.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/budget.example.com/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  # File upload size limit
  client_max_body_size 100M;

  # Proxy configuration
  location / {
    proxy_pass http://localhost:5006;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support (if needed)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

# HTTP redirect
server {
  listen 80;
  listen [::]:80;
  server_name budget.example.com;
  return 301 https://$server_name$request_uri;
}
`;

// Fly.io configuration (fly.toml)
export const flyConfig = `
app = "actual-budget"
primary_region = "sea"

[build]
  image = "actualbudget/actual-server:latest"

[env]
  ACTUAL_PORT = "5006"

[[mounts]]
  source = "actual_data"
  destination = "/data"

[[services]]
  protocol = "tcp"
  internal_port = 5006
  auto_stop_machines = true
  auto_start_machines = true

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "1s"
`;

// OpenID Connect configuration
export const openIdConfig: ActualServerConfig = {
  ...defaultConfig,
  loginMethod: 'openid',
  allowedLoginMethods: ['openid', 'password']
};

// Environment variables for OpenID
export const openIdEnvVars = {
  ACTUAL_OPENID_ISSUER: 'https://your-openid-provider.com',
  ACTUAL_OPENID_CLIENT_ID: 'your-client-id',
  ACTUAL_OPENID_CLIENT_SECRET: 'your-client-secret',
  ACTUAL_OPENID_SERVER_HOSTNAME: 'https://budget.example.com'
};

// Manual OpenID endpoints (for providers without discovery)
export const manualOpenIdEnvVars = {
  ACTUAL_OPENID_AUTHORIZATION_ENDPOINT: 'https://provider.com/oauth2/authorize',
  ACTUAL_OPENID_TOKEN_ENDPOINT: 'https://provider.com/oauth2/token',
  ACTUAL_OPENID_USERINFO_ENDPOINT: 'https://provider.com/oauth2/userinfo',
  ACTUAL_OPENID_CLIENT_ID: 'your-client-id',
  ACTUAL_OPENID_CLIENT_SECRET: 'your-client-secret',
  ACTUAL_OPENID_SERVER_HOSTNAME: 'https://budget.example.com'
};

// SSL certificate generation script
export const generateSSLCertificate = (domain: string, keyPath: string, certPath: string) => {
  return `#!/bin/bash
# Generate self-signed SSL certificate for Actual Budget

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
  -keyout "${keyPath}" \\
  -out "${certPath}" \\
  -subj "/C=US/ST=State/L=City/O=Organization/CN=${domain}"

echo "SSL certificate generated:"
echo "Key: ${keyPath}"
echo "Certificate: ${certPath}"

# Set appropriate permissions
chmod 600 "${keyPath}"
chmod 644 "${certPath}"

echo "Certificate generated successfully!"
`;
};

// Backup script for server data
export const backupScript = `#!/bin/bash
# Backup script for Actual Budget server data

BACKUP_DIR="/backups/actual-budget"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="actual-backup-$DATE.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \\
  --exclude="*.tmp" \\
  --exclude="*.log" \\
  ./server-files \\
  ./user-files

echo "Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "actual-backup-*.tar.gz" -type f -mtime +30 -delete

echo "Backup completed successfully!"
`;

// Health check script
export const healthCheckScript = `#!/bin/bash
# Health check script for Actual Budget server

SERVER_URL="http://localhost:5006"
TIMEOUT=10

# Check if server is responding
if curl -f -s --max-time $TIMEOUT "$SERVER_URL" > /dev/null; then
  echo "Server is healthy"
  exit 0
else
  echo "Server is not responding"
  exit 1
fi
`;

// Systemd service file
export const systemdService = `[Unit]
Description=Actual Budget Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=actual
Group=actual
WorkingDirectory=/opt/actual-budget
ExecStart=/usr/bin/actual-server --config /opt/actual-budget/config.json
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=ACTUAL_DATA_DIR=/opt/actual-budget/data

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/actual-budget

[Install]
WantedBy=multi-user.target
`;

// Complete deployment helper functions
export const deploymentHelpers = {
  // Generate all configuration files for a deployment
  generateDeploymentFiles: (config: ActualServerConfig, outputDir = './deployment') => {
    const fs = require('fs');
    const path = require('path');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate config.json
    generateConfigFile(config, path.join(outputDir, 'config.json'));

    // Generate docker-compose.yml
    const dockerComposeYaml = `version: '3.8'
services:
  actual-server:
    image: actualbudget/actual-server:latest
    restart: unless-stopped
    ports:
      - "${config.port}:5006"
    volumes:
      - actual-data:/data
      - ./config.json:/data/config.json
    environment:
      - ACTUAL_PORT=5006

volumes:
  actual-data:
`;
    fs.writeFileSync(path.join(outputDir, 'docker-compose.yml'), dockerComposeYaml);

    // Generate backup script
    fs.writeFileSync(path.join(outputDir, 'backup.sh'), backupScript);
    fs.chmodSync(path.join(outputDir, 'backup.sh'), '755');

    // Generate health check script
    fs.writeFileSync(path.join(outputDir, 'health-check.sh'), healthCheckScript);
    fs.chmodSync(path.join(outputDir, 'health-check.sh'), '755');

    console.log(`Deployment files generated in: ${outputDir}`);
  },

  // Validate configuration
  validateConfig: (config: ActualServerConfig): boolean => {
    const errors = [];

    if (!config.port) errors.push('Port is required');
    if (!config.hostname) errors.push('Hostname is required');
    if (config.https && (!config.https.key || !config.https.cert)) {
      errors.push('HTTPS configuration requires both key and cert paths');
    }

    if (errors.length > 0) {
      console.error('Configuration validation errors:');
      errors.forEach(error => console.error(`- ${error}`));
      return false;
    }

    console.log('Configuration is valid');
    return true;
  }
};