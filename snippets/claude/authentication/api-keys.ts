// Claude Authentication Examples

// 1. Anthropic API Key (Recommended)
import { Anthropic } from '@anthropic-ai/sdk';

// Environment variable setup
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Recommended: use environment variable
});

// Direct API key (not recommended for production)
const anthropicDirect = new Anthropic({
  apiKey: 'sk-ant-api03-your-api-key-here'
});

// 2. Amazon Bedrock Configuration
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Set environment variable for Claude Code CLI
process.env.CLAUDE_CODE_USE_BEDROCK = '1';

const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

// 3. Google Vertex AI Configuration
process.env.CLAUDE_CODE_USE_VERTEX = '1';

// Vertex AI authentication via service account
const vertexAuth = {
  projectId: 'your-gcp-project-id',
  keyFilename: '/path/to/service-account-key.json',
  // Or use environment variable:
  // GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
};

// 4. Environment Configuration Helper
function configureAuthentication() {
  // Check for required environment variables
  const authMethods = [
    { name: 'Anthropic', env: 'ANTHROPIC_API_KEY' },
    { name: 'Bedrock', env: 'AWS_ACCESS_KEY_ID' },
    { name: 'Vertex', env: 'GOOGLE_APPLICATION_CREDENTIALS' }
  ];

  const availableAuth = authMethods.filter(method => 
    process.env[method.env]
  );

  if (availableAuth.length === 0) {
    throw new Error('No authentication method configured. Set one of: ANTHROPIC_API_KEY, AWS credentials, or GOOGLE_APPLICATION_CREDENTIALS');
  }

  console.log('Available authentication methods:', availableAuth.map(a => a.name));
  return availableAuth[0]; // Use first available
}

// 5. Secure API Key Management
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

function loadApiKeySecurely() {
  // Option 1: From environment variable (recommended)
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Option 2: From secure config file
  try {
    const configPath = join(homedir(), '.claude', 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    return config.apiKey;
  } catch (error) {
    console.warn('Could not read config file:', error.message);
  }

  // Option 3: From system keychain (macOS/Linux)
  try {
    const { execSync } = require('child_process');
    return execSync('security find-generic-password -s claude-api -w', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not read from keychain:', error.message);
  }

  throw new Error('No API key found. Set ANTHROPIC_API_KEY environment variable or configure secure storage.');
}

// 6. Rate Limiting and Cost Management
class AuthenticatedClient {
  private client: Anthropic;
  private requestCount = 0;
  private requestWindow = Date.now();
  private readonly maxRequestsPerMinute = 50; // Adjust based on your tier

  constructor() {
    this.client = new Anthropic({
      apiKey: loadApiKeySecurely(),
      defaultHeaders: {
        'anthropic-version': '2023-06-01',
      }
    });
  }

  async makeRequest(params: any) {
    // Simple rate limiting
    const now = Date.now();
    if (now - this.requestWindow > 60000) {
      this.requestCount = 0;
      this.requestWindow = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.requestWindow);
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestCount++;
    return this.client.messages.create(params);
  }
}

export {
  anthropic,
  anthropicDirect,
  bedrockClient,
  vertexAuth,
  configureAuthentication,
  loadApiKeySecurely,
  AuthenticatedClient
};