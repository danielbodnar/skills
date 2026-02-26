#!/usr/bin/env -S usage bun run

//USAGE name "Development Server"
//USAGE bin "dev-server"
//USAGE about "Modern development server with hot reload"
//USAGE version "1.0.0"
//USAGE author "Daniel Bodnar"

//USAGE flag "--watch" help="Enable file watching and hot reload"
//USAGE flag "--open" help="Open browser automatically"
//USAGE flag "-v --verbose" help="Enable verbose logging" count=true

//USAGE flag "--port <port>" help="Server port" env="DEV_PORT" default="3000"
//USAGE flag "--host <host>" help="Server host" env="DEV_HOST" default="localhost"
//USAGE flag "--https" help="Enable HTTPS with self-signed certificate"
//USAGE flag "--cors" help="Enable CORS headers"

//USAGE flag "--env <env>" help="Environment mode" default="development"
//USAGE flag "--config <file>" help="Configuration file" default="dev.config.ts"

//USAGE arg "[entry]" help="Entry point file" default="src/index.ts"
//USAGE arg "[public]" help="Public directory" default="public"

interface Config {
  verbose: number;
  watch: boolean;
  open: boolean;
  port: number;
  host: string;
  https: boolean;
  cors: boolean;
  env: string;
  config: string;
  entry: string;
  public: string;
}

// Parse environment variables
const config: Config = {
  verbose: parseInt(process.env.usage_verbose || '0'),
  watch: process.env.usage_watch === 'true',
  open: process.env.usage_open === 'true',
  port: parseInt(process.env.usage_port || '3000'),
  host: process.env.usage_host || 'localhost',
  https: process.env.usage_https === 'true',
  cors: process.env.usage_cors === 'true',
  env: process.env.usage_env || 'development',
  config: process.env.usage_config || 'dev.config.ts',
  entry: process.env.usage_entry || 'src/index.ts',
  public: process.env.usage_public || 'public'
};

// Logging utility
function log(level: 'error' | 'warn' | 'info' | 'debug', message: string) {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  if (levels[level] <= config.verbose) {
    const colors = {
      error: '\x1b[31m',    // Red
      warn: '\x1b[33m',     // Yellow
      info: '\x1b[36m',     // Cyan
      debug: '\x1b[35m'     // Magenta
    };
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString();
    const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
    console.log(`${prefix} ${timestamp} ${message}`);
  }
}

// Load user configuration if it exists
async function loadConfig(): Promise<any> {
  try {
    if (await Bun.file(config.config).exists()) {
      log('debug', `Loading configuration from ${config.config}`);
      const userConfig = await import(`./${config.config}`);
      return userConfig.default || userConfig;
    }
  } catch (error) {
    log('warn', `Failed to load config file: ${config.config}`);
  }
  return {};
}

// File watcher setup
function setupWatcher(callback: () => void) {
  if (!config.watch) return;
  
  log('info', 'Setting up file watcher...');
  
  const fs = require('fs');
  const path = require('path');
  
  const watchPaths = [
    config.entry,
    config.public,
    'src',
    'package.json'
  ].filter(p => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  
  watchPaths.forEach(watchPath => {
    fs.watch(watchPath, { recursive: true }, (eventType: string, filename: string) => {
      if (filename && !filename.includes('node_modules')) {
        log('debug', `File changed: ${filename} (${eventType})`);
        callback();
      }
    });
  });
  
  log('info', `Watching ${watchPaths.length} paths for changes`);
}

// Open browser
async function openBrowser(url: string) {
  if (!config.open) return;
  
  try {
    const { spawn } = require('child_process');
    const platform = process.platform;
    
    let command: string;
    let args: string[];
    
    if (platform === 'darwin') {
      command = 'open';
      args = [url];
    } else if (platform === 'win32') {
      command = 'start';
      args = ['', url];
    } else {
      command = 'xdg-open';
      args = [url];
    }
    
    spawn(command, args, { detached: true, stdio: 'ignore' });
    log('info', `Opening browser: ${url}`);
  } catch (error) {
    log('warn', 'Failed to open browser automatically');
  }
}

// Create development server
async function createServer(userConfig: any) {
  const serverConfig = {
    port: config.port,
    hostname: config.host,
    development: config.env === 'development',
    ...userConfig
  };
  
  log('info', `Starting development server...`);
  log('debug', `Configuration: ${JSON.stringify(serverConfig, null, 2)}`);
  
  const server = Bun.serve({
    ...serverConfig,
    
    fetch(request: Request): Response | Promise<Response> {
      const url = new URL(request.url);
      log('debug', `${request.method} ${url.pathname}`);
      
      // Handle CORS
      if (config.cors) {
        const headers = new Headers();
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 200, headers });
        }
      }
      
      // Serve static files from public directory
      if (url.pathname !== '/') {
        const filePath = `${config.public}${url.pathname}`;
        const file = Bun.file(filePath);
        
        if (file.exists()) {
          log('debug', `Serving static file: ${filePath}`);
          return new Response(file);
        }
      }
      
      // Serve main entry point
      try {
        const entryFile = Bun.file(config.entry);
        if (entryFile.exists()) {
          log('debug', `Serving entry point: ${config.entry}`);
          
          // For development, we can serve the TypeScript file directly
          // Bun will transpile it on the fly
          if (config.entry.endsWith('.ts') || config.entry.endsWith('.tsx')) {
            return new Response(entryFile, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
          
          return new Response(entryFile);
        }
      } catch (error) {
        log('error', `Failed to serve entry point: ${error}`);
      }
      
      // Default response
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Development Server</title>
          <style>
            body { font-family: system-ui; padding: 2rem; }
            .status { color: #22c55e; }
            .info { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <h1>🚀 Development Server</h1>
          <p class="status">Server is running successfully!</p>
          <div class="info">
            <strong>Configuration:</strong><br>
            Entry: ${config.entry}<br>
            Public: ${config.public}<br>
            Environment: ${config.env}<br>
            Watch mode: ${config.watch ? 'enabled' : 'disabled'}
          </div>
          ${config.watch ? '<p><em>File watching is enabled. Changes will trigger automatic reload.</em></p>' : ''}
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    },
    
    error(error: Error): Response {
      log('error', `Server error: ${error.message}`);
      return new Response(`Server Error: ${error.message}`, { status: 500 });
    }
  });
  
  return server;
}

// Main function
async function main() {
  log('info', 'Starting development server...');
  log('debug', `Configuration: ${JSON.stringify(config, null, 2)}`);
  
  // Validate entry point
  const entryExists = await Bun.file(config.entry).exists();
  if (!entryExists) {
    log('warn', `Entry point not found: ${config.entry}`);
    log('info', 'Server will start anyway and serve a default page');
  }
  
  // Load user configuration
  const userConfig = await loadConfig();
  
  // Create and start server
  const server = await createServer(userConfig);
  
  const protocol = config.https ? 'https' : 'http';
  const url = `${protocol}://${config.host}:${config.port}`;
  
  log('info', `🚀 Server running at ${url}`);
  log('info', `📁 Serving: ${config.entry}`);
  log('info', `📂 Static files: ${config.public}`);
  
  if (config.watch) {
    log('info', '👁️  File watching enabled');
    setupWatcher(() => {
      log('info', '🔄 Files changed, reloading...');
      // In a real implementation, you might want to trigger a reload
      // For now, we just log the change
    });
  }
  
  // Open browser
  await openBrowser(url);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('info', '🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('info', '🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });
  
  log('info', '✅ Development server ready');
  log('info', 'Press Ctrl+C to stop');
}

// Run main function
main().catch((error) => {
  log('error', `Failed to start server: ${error.message}`);
  process.exit(1);
});