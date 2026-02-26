// Client Configuration Options
import { VoyageAIClient } from "voyageai";

// Basic configuration
export const basicClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Advanced configuration with timeout and retries
export const advancedClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 3
});

// Configuration for different environments
export const developmentClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY_DEV,
  timeout: 60000,
  maxRetries: 5
});

export const productionClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY_PROD,
  timeout: 20000,
  maxRetries: 2
});

// Configuration with custom base URL (for proxy/gateway)
export const proxyClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
  baseURL: "https://api-proxy.company.com/voyage",
  timeout: 45000
});

// Configuration factory
export function createVoyageClient(config: {
  environment: 'development' | 'staging' | 'production';
  timeout?: number;
  maxRetries?: number;
  baseURL?: string;
}) {
  const apiKeyMap = {
    development: process.env.VOYAGE_API_KEY_DEV,
    staging: process.env.VOYAGE_API_KEY_STAGING,
    production: process.env.VOYAGE_API_KEY_PROD
  };
  
  return new VoyageAIClient({
    apiKey: apiKeyMap[config.environment],
    timeout: config.timeout || 30000,
    maxRetries: config.maxRetries || 3,
    baseURL: config.baseURL
  });
}

// Environment-specific configurations
export const configs = {
  development: {
    timeout: 60000,
    maxRetries: 5,
    defaultModel: "voyage-3.5-lite"
  },
  production: {
    timeout: 20000,
    maxRetries: 2,
    defaultModel: "voyage-3.5"
  }
};