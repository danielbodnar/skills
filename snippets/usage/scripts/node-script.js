#!/usr/bin/env -S usage node

//USAGE name "API Client"
//USAGE bin "api-client"
//USAGE about "Simple API client with authentication"
//USAGE version "1.0.0"
//USAGE author "Daniel Bodnar"

//USAGE flag "-v --verbose" help="Enable verbose output" count=true
//USAGE flag "--dry-run" help="Show what would be done without executing"
//USAGE flag "--json" help="Output response as JSON"
//USAGE flag "--pretty" help="Pretty print JSON output"

//USAGE flag "--base-url <url>" help="Base URL for API" env="API_BASE_URL" default="https://api.example.com"
//USAGE flag "--token <token>" help="Authentication token" env="API_TOKEN"
//USAGE flag "--timeout <ms>" help="Request timeout in milliseconds" default="5000"

//USAGE arg "<method>" help="HTTP method (GET, POST, PUT, DELETE)"
//USAGE arg "<endpoint>" help="API endpoint path"
//USAGE arg "[data]" help="Request body data (JSON string or @filename)"

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration from environment variables
const config = {
    verbose: parseInt(process.env.usage_verbose || '0'),
    dryRun: process.env.usage_dry_run === 'true',
    json: process.env.usage_json === 'true',
    pretty: process.env.usage_pretty === 'true',
    baseUrl: process.env.usage_base_url,
    token: process.env.usage_token,
    timeout: parseInt(process.env.usage_timeout || '5000'),
    method: process.env.usage_method?.toUpperCase(),
    endpoint: process.env.usage_endpoint,
    data: process.env.usage_data
};

// Logging utility
function log(level, message) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    if (levels[level] <= config.verbose) {
        const prefix = level.toUpperCase();
        const output = level === 'error' ? console.error : console.log;
        output(`[${prefix}] ${message}`);
    }
}

// Parse request data
function parseRequestData(data) {
    if (!data) return null;
    
    // Check if data is a file reference
    if (data.startsWith('@')) {
        const filename = data.slice(1);
        log('debug', `Reading data from file: ${filename}`);
        
        try {
            const content = fs.readFileSync(filename, 'utf8');
            return content;
        } catch (error) {
            log('error', `Failed to read file: ${filename}`);
            process.exit(1);
        }
    }
    
    // Return data as-is
    return data;
}

// Make HTTP request
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const protocol = options.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers,
                    body: body
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(config.timeout, () => {
            req.destroy();
            reject(new Error(`Request timeout after ${config.timeout}ms`));
        });
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

// Format output
function formatOutput(response) {
    if (config.json) {
        const output = {
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            headers: response.headers,
            body: response.body
        };
        
        // Try to parse response body as JSON
        try {
            output.body = JSON.parse(response.body);
        } catch (error) {
            // Keep as string if not valid JSON
        }
        
        return JSON.stringify(output, null, config.pretty ? 2 : 0);
    } else {
        let output = `HTTP ${response.statusCode} ${response.statusMessage}\n\n`;
        
        // Add headers if verbose
        if (config.verbose >= 1) {
            output += 'Headers:\n';
            Object.entries(response.headers).forEach(([key, value]) => {
                output += `  ${key}: ${value}\n`;
            });
            output += '\n';
        }
        
        // Add body
        output += 'Body:\n';
        
        // Try to pretty print JSON
        if (config.pretty) {
            try {
                const parsed = JSON.parse(response.body);
                output += JSON.stringify(parsed, null, 2);
            } catch (error) {
                output += response.body;
            }
        } else {
            output += response.body;
        }
        
        return output;
    }
}

// Main function
async function main() {
    log('info', 'Starting API client');
    log('debug', `Method: ${config.method}`);
    log('debug', `Endpoint: ${config.endpoint}`);
    log('debug', `Base URL: ${config.baseUrl}`);
    
    // Validate required arguments
    if (!config.method) {
        log('error', 'HTTP method is required');
        process.exit(1);
    }
    
    if (!config.endpoint) {
        log('error', 'API endpoint is required');
        process.exit(1);
    }
    
    if (!config.baseUrl) {
        log('error', 'Base URL is required (use --base-url or API_BASE_URL)');
        process.exit(1);
    }
    
    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(config.method)) {
        log('error', `Invalid HTTP method: ${config.method}`);
        log('error', `Valid methods: ${validMethods.join(', ')}`);
        process.exit(1);
    }
    
    // Parse request data
    const requestData = parseRequestData(config.data);
    if (requestData) {
        log('debug', `Request data: ${requestData.substring(0, 100)}${requestData.length > 100 ? '...' : ''}`);
    }
    
    // Build full URL
    const fullUrl = new URL(config.endpoint, config.baseUrl);
    log('debug', `Full URL: ${fullUrl.toString()}`);
    
    // Build request options
    const options = {
        hostname: fullUrl.hostname,
        port: fullUrl.port,
        path: fullUrl.pathname + fullUrl.search,
        method: config.method,
        protocol: fullUrl.protocol,
        headers: {
            'User-Agent': 'API-Client/1.0.0',
            'Accept': 'application/json'
        }
    };
    
    // Add authentication header
    if (config.token) {
        options.headers['Authorization'] = `Bearer ${config.token}`;
        log('debug', 'Added authentication header');
    }
    
    // Add content type for POST/PUT requests
    if (requestData && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(requestData);
    }
    
    if (config.dryRun) {
        log('info', 'Dry run mode - showing what would be sent:');
        console.log('Request Options:', JSON.stringify(options, null, 2));
        if (requestData) {
            console.log('Request Data:', requestData);
        }
        return;
    }
    
    try {
        log('info', 'Making HTTP request...');
        const response = await makeRequest(options, requestData);
        log('info', `Response received: ${response.statusCode} ${response.statusMessage}`);
        
        const output = formatOutput(response);
        console.log(output);
        
        // Exit with error code for HTTP errors
        if (response.statusCode >= 400) {
            process.exit(1);
        }
        
    } catch (error) {
        log('error', `Request failed: ${error.message}`);
        process.exit(1);
    }
}

// Run main function
main().catch((error) => {
    log('error', `Unexpected error: ${error.message}`);
    process.exit(1);
});