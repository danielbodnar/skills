// Claude Enterprise Configuration Examples

// 1. Amazon Bedrock Configuration
export const bedrockConfig = {
  // Environment setup
  environment: {
    CLAUDE_CODE_USE_BEDROCK: '1',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'your-access-key',
    AWS_SECRET_ACCESS_KEY: 'your-secret-key',
    AWS_SESSION_TOKEN: 'your-session-token' // For temporary credentials
  },

  // Bedrock client configuration
  clientConfig: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN
    },
    maxAttempts: 3,
    retryMode: 'adaptive'
  },

  // Model configuration
  modelConfig: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9
  }
};

// 2. Google Vertex AI Configuration
export const vertexConfig = {
  // Environment setup
  environment: {
    CLAUDE_CODE_USE_VERTEX: '1',
    GOOGLE_APPLICATION_CREDENTIALS: '/path/to/service-account-key.json',
    GOOGLE_CLOUD_PROJECT: 'your-project-id',
    GOOGLE_CLOUD_LOCATION: 'us-central1'
  },

  // Vertex AI client configuration
  clientConfig: {
    projectId: 'your-project-id',
    location: 'us-central1',
    keyFilename: '/path/to/service-account-key.json',
    // Or use ADC (Application Default Credentials)
    // Remove keyFilename to use ADC
  },

  // Model configuration
  modelConfig: {
    model: 'claude-3-sonnet@20240229',
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.1,
      topP: 0.9
    }
  }
};

// 3. Corporate Proxy Configuration
export const proxyConfig = {
  // HTTP/HTTPS proxy settings
  httpProxy: {
    host: 'proxy.company.com',
    port: 8080,
    auth: {
      username: 'your-username',
      password: 'your-password'
    },
    protocol: 'http'
  },

  // Environment variables
  environment: {
    HTTP_PROXY: 'http://username:password@proxy.company.com:8080',
    HTTPS_PROXY: 'https://username:password@proxy.company.com:8080',
    NO_PROXY: 'localhost,127.0.0.1,*.company.com'
  },

  // Custom agent configuration
  agentConfig: {
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 256,
    maxFreeSockets: 256,
    timeout: 60000,
    freeSocketTimeout: 30000
  }
};

// 4. DevContainer Configuration
export const devContainerConfig = {
  // .devcontainer/devcontainer.json
  devcontainerJson: {
    name: "Claude Code Development",
    image: "mcr.microsoft.com/devcontainers/typescript-node:18",
    features: {
      "ghcr.io/devcontainers/features/aws-cli:1": {},
      "ghcr.io/devcontainers/features/gcloud:1": {}
    },
    customizations: {
      vscode: {
        extensions: [
          "ms-vscode.vscode-typescript-next",
          "esbenp.prettier-vscode",
          "ms-vscode.vscode-json"
        ],
        settings: {
          "terminal.integrated.defaultProfile.linux": "bash"
        }
      }
    },
    postCreateCommand: "npm install -g @anthropic-ai/claude-code",
    remoteEnv: {
      ANTHROPIC_API_KEY: "${localEnv:ANTHROPIC_API_KEY}",
      CLAUDE_CODE_USE_BEDROCK: "${localEnv:CLAUDE_CODE_USE_BEDROCK}",
      AWS_ACCESS_KEY_ID: "${localEnv:AWS_ACCESS_KEY_ID}",
      AWS_SECRET_ACCESS_KEY: "${localEnv:AWS_SECRET_ACCESS_KEY}"
    },
    forwardPorts: [3000, 8080],
    portsAttributes: {
      "3000": {
        label: "Development Server",
        onAutoForward: "notify"
      }
    }
  },

  // Docker configuration
  dockerfile: `
FROM mcr.microsoft.com/devcontainers/typescript-node:18

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install additional tools
RUN apt-get update && apt-get install -y \\
    curl \\
    git \\
    vim \\
    && rm -rf /var/lib/apt/lists/*

# Configure Git (optional)
RUN git config --global user.name "Developer" \\
    && git config --global user.email "dev@company.com"

# Set working directory
WORKDIR /workspace

# Copy configuration files
COPY .claude/ /home/node/.claude/
RUN chown -R node:node /home/node/.claude

USER node
`
};

// 5. IAM and Security Configuration
export const iamConfig = {
  // AWS IAM policy for Bedrock access
  bedrockIamPolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ],
        Resource: [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-opus-20240229-v1:0",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel"
        ],
        Resource: "*"
      }
    ]
  },

  // Google Cloud IAM roles
  vertexIamRoles: [
    "roles/aiplatform.user",
    "roles/ml.developer",
    "roles/serviceusage.serviceUsageConsumer"
  ],

  // Service account configuration
  serviceAccount: {
    type: "service_account",
    project_id: "your-project-id",
    private_key_id: "key-id",
    private_key: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    client_email: "claude-service@your-project-id.iam.gserviceaccount.com",
    client_id: "client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/claude-service%40your-project-id.iam.gserviceaccount.com"
  }
};

// 6. Monitoring and Observability
export const monitoringConfig = {
  // OpenTelemetry configuration
  openTelemetry: {
    serviceName: 'claude-code-service',
    version: '1.0.0',
    environment: 'production',
    
    // OTLP exporter configuration
    otlpExporter: {
      url: 'https://api.honeycomb.io/v1/traces',
      headers: {
        'x-honeycomb-team': 'your-api-key'
      }
    },

    // Tracing configuration
    tracing: {
      instrumentations: [
        '@opentelemetry/instrumentation-http',
        '@opentelemetry/instrumentation-fs',
        '@opentelemetry/instrumentation-dns'
      ],
      samplingRate: 0.1 // Sample 10% of traces
    },

    // Metrics configuration
    metrics: {
      exportInterval: 30000, // 30 seconds
      customMetrics: [
        'claude_requests_total',
        'claude_request_duration',
        'claude_tokens_used',
        'claude_errors_total'
      ]
    }
  },

  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    outputs: [
      {
        type: 'console',
        colorize: false
      },
      {
        type: 'file',
        filename: '/var/log/claude-code.log',
        maxSize: '100MB',
        maxFiles: 5
      },
      {
        type: 'http',
        url: 'https://logs.company.com/api/logs',
        headers: {
          'authorization': 'Bearer your-token'
        }
      }
    ]
  }
};

// 7. Cost Management Configuration
export const costConfig = {
  // Budget alerts
  budgetAlerts: {
    monthly: {
      limit: 1000, // $1000 per month
      thresholds: [50, 75, 90], // Alert at 50%, 75%, 90%
      notifications: [
        'admin@company.com',
        'finance@company.com'
      ]
    },
    
    daily: {
      limit: 50, // $50 per day
      thresholds: [75, 90],
      notifications: ['dev-team@company.com']
    }
  },

  // Rate limiting
  rateLimiting: {
    requestsPerMinute: 100,
    tokensPerMinute: 50000,
    maxConcurrentRequests: 10,
    backoffStrategy: 'exponential'
  },

  // Cost optimization settings
  optimization: {
    modelSelection: {
      simple: 'claude-3-haiku-20240307',
      standard: 'claude-3-sonnet-20240229',
      complex: 'claude-3-opus-20240229'
    },
    
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: '100MB'
    },
    
    batching: {
      enabled: true,
      maxBatchSize: 10,
      batchTimeout: 5000 // 5 seconds
    }
  }
};

// 8. LLM Gateway Configuration
export const gatewayConfig = {
  // Gateway endpoint configuration
  endpoint: {
    url: 'https://gateway.company.com/llm',
    apiKey: 'your-gateway-api-key',
    timeout: 30000,
    retries: 3
  },

  // Request routing
  routing: {
    rules: [
      {
        condition: 'complexity < 0.3',
        target: 'claude-haiku'
      },
      {
        condition: 'complexity >= 0.3 && complexity < 0.7',
        target: 'claude-sonnet'
      },
      {
        condition: 'complexity >= 0.7',
        target: 'claude-opus'
      }
    ]
  },

  // Security settings
  security: {
    authentication: {
      type: 'bearer',
      token: 'your-bearer-token'
    },
    
    rateLimiting: {
      requestsPerSecond: 10,
      burstLimit: 50
    },
    
    contentFiltering: {
      enabled: true,
      policies: ['pii-detection', 'harmful-content']
    }
  }
};

// 9. Configuration Management Class
export class EnterpriseConfigManager {
  private config: any = {};

  constructor(environment: 'development' | 'staging' | 'production') {
    this.loadConfiguration(environment);
  }

  private loadConfiguration(environment: string) {
    // Load base configuration
    this.config = {
      environment,
      timestamp: new Date().toISOString()
    };

    // Load environment-specific settings
    switch (environment) {
      case 'development':
        this.config = { ...this.config, ...this.getDevelopmentConfig() };
        break;
      case 'staging':
        this.config = { ...this.config, ...this.getStagingConfig() };
        break;
      case 'production':
        this.config = { ...this.config, ...this.getProductionConfig() };
        break;
    }
  }

  private getDevelopmentConfig() {
    return {
      logging: { level: 'debug' },
      monitoring: { samplingRate: 1.0 },
      security: { strictMode: false }
    };
  }

  private getStagingConfig() {
    return {
      logging: { level: 'info' },
      monitoring: { samplingRate: 0.5 },
      security: { strictMode: true }
    };
  }

  private getProductionConfig() {
    return {
      logging: { level: 'warn' },
      monitoring: { samplingRate: 0.1 },
      security: { strictMode: true },
      costOptimization: { enabled: true }
    };
  }

  getConfiguration(): any {
    return this.config;
  }

  updateConfiguration(updates: any): void {
    this.config = { ...this.config, ...updates };
  }

  validateConfiguration(): boolean {
    // Implement configuration validation logic
    const required = ['environment', 'logging', 'monitoring'];
    return required.every(key => key in this.config);
  }
}

// 10. Deployment Scripts
export const deploymentScripts = {
  // Docker Compose for development
  dockerCompose: `
version: '3.8'
services:
  claude-code:
    build: .
    environment:
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
      - CLAUDE_CODE_USE_BEDROCK=\${CLAUDE_CODE_USE_BEDROCK}
      - AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
    volumes:
      - ./workspace:/workspace
      - ./config:/app/config
    ports:
      - "3000:3000"
    networks:
      - claude-network

  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - claude-network

networks:
  claude-network:
    driver: bridge
`,

  // Kubernetes deployment
  kubernetesDeployment: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-code-service
  labels:
    app: claude-code
spec:
  replicas: 3
  selector:
    matchLabels:
      app: claude-code
  template:
    metadata:
      labels:
        app: claude-code
    spec:
      containers:
      - name: claude-code
        image: your-registry/claude-code:latest
        ports:
        - containerPort: 3000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: claude-secrets
              key: api-key
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
`
};

export {
  bedrockConfig,
  vertexConfig,
  proxyConfig,
  devContainerConfig,
  iamConfig,
  monitoringConfig,
  costConfig,
  gatewayConfig,
  EnterpriseConfigManager,
  deploymentScripts
};