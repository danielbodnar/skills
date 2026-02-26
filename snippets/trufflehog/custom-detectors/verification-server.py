#!/usr/bin/env python3
"""
TruffleHog Custom Verification Server
A comprehensive Python-based verification server for custom TruffleHog detectors
"""

import json
import logging
import hashlib
import hmac
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import threading
import signal
import sys
from typing import Dict, Any, Optional, List
import requests
from datetime import datetime, timedelta

# Configuration
CONFIG = {
    'port': 8000,
    'host': '0.0.0.0',
    'auth_header': 'super secret authorization header',
    'rate_limit': 100,  # requests per minute
    'cache_ttl': 300,   # cache TTL in seconds
    'log_level': 'INFO'
}

# Set up logging
logging.basicConfig(
    level=getattr(logging, CONFIG['log_level']),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('trufflehog-verifier')

class RateLimiter:
    """Simple rate limiter implementation"""
    
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}
        self.lock = threading.Lock()
    
    def is_allowed(self, client_ip: str) -> bool:
        """Check if request is allowed based on rate limits"""
        now = time.time()
        
        with self.lock:
            # Clean old requests
            self.requests = {
                ip: times for ip, times in self.requests.items()
                if any(t > now - self.window_seconds for t in times)
            }
            
            # Check current client
            client_requests = self.requests.get(client_ip, [])
            client_requests = [t for t in client_requests if t > now - self.window_seconds]
            
            if len(client_requests) >= self.max_requests:
                return False
            
            # Add current request
            client_requests.append(now)
            self.requests[client_ip] = client_requests
            return True

class TokenValidator:
    """Token validation with caching and various validation methods"""
    
    def __init__(self):
        self.cache = {}
        self.lock = threading.Lock()
    
    def _cache_key(self, token: str) -> str:
        """Generate cache key for token"""
        return hashlib.md5(token.encode()).hexdigest()
    
    def _is_cached(self, token: str) -> Optional[bool]:
        """Check if token validation result is cached"""
        cache_key = self._cache_key(token)
        with self.lock:
            if cache_key in self.cache:
                result, timestamp = self.cache[cache_key]
                if time.time() - timestamp < CONFIG['cache_ttl']:
                    return result
                else:
                    del self.cache[cache_key]
        return None
    
    def _cache_result(self, token: str, result: bool):
        """Cache validation result"""
        cache_key = self._cache_key(token)
        with self.lock:
            self.cache[cache_key] = (result, time.time())
    
    def validate_api_key(self, token: str, detector_name: str) -> bool:
        """Validate API key token"""
        # Check cache first
        cached_result = self._is_cached(token)
        if cached_result is not None:
            logger.info(f"Cache hit for {detector_name} token validation")
            return cached_result
        
        # Validation logic based on detector type
        if detector_name == "MyAPIKeyDetector":
            result = self._validate_my_api_key(token)
        elif detector_name == "GitHubTokenDetector":
            result = self._validate_github_token(token)
        elif detector_name == "SlackTokenDetector":
            result = self._validate_slack_token(token)
        elif detector_name == "AWSDetector":
            result = self._validate_aws_credentials(token)
        else:
            # Generic validation
            result = self._validate_generic_token(token)
        
        # Cache result
        self._cache_result(token, result)
        return result
    
    def _validate_my_api_key(self, token: str) -> bool:
        """Validate custom API key format"""
        # Example validation logic
        if not token.startswith('myapi_'):
            return False
        
        # Check length and format
        if len(token) != 38:  # myapi_ + 32 chars
            return False
        
        # Additional validation logic here
        # For example, check against a database or make API call
        return self._mock_api_validation(token)
    
    def _validate_github_token(self, token: str) -> bool:
        """Validate GitHub token by making API call"""
        try:
            headers = {
                'Authorization': f'token {token}',
                'User-Agent': 'TruffleHog-Custom-Verifier'
            }
            response = requests.get(
                'https://api.github.com/user', 
                headers=headers, 
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"GitHub token validation error: {e}")
            return False
    
    def _validate_slack_token(self, token: str) -> bool:
        """Validate Slack token"""
        try:
            headers = {'Authorization': f'Bearer {token}'}
            data = {'token': token}
            response = requests.post(
                'https://slack.com/api/auth.test',
                headers=headers,
                data=data,
                timeout=10
            )
            result = response.json()
            return result.get('ok', False)
        except Exception as e:
            logger.error(f"Slack token validation error: {e}")
            return False
    
    def _validate_aws_credentials(self, token: str) -> bool:
        """Validate AWS credentials"""
        # This would require AWS SDK and proper implementation
        # For now, return mock validation
        logger.info("AWS credential validation requested")
        return self._mock_api_validation(token)
    
    def _validate_generic_token(self, token: str) -> bool:
        """Generic token validation"""
        # Basic validation rules
        if len(token) < 16:
            return False
        
        # Check for test/demo tokens
        test_patterns = ['test', 'demo', 'example', 'placeholder', 'fake']
        token_lower = token.lower()
        if any(pattern in token_lower for pattern in test_patterns):
            return False
        
        # Mock validation for demonstration
        return self._mock_api_validation(token)
    
    def _mock_api_validation(self, token: str) -> bool:
        """Mock API validation for demonstration"""
        # Simulate API call delay
        time.sleep(0.1)
        
        # Simple hash-based validation for demo
        token_hash = hashlib.md5(token.encode()).hexdigest()
        # Return True if hash starts with even number (50% chance)
        return int(token_hash[0], 16) % 2 == 0

class TruffleHogVerifier(BaseHTTPRequestHandler):
    """Main HTTP request handler for TruffleHog verification"""
    
    def __init__(self, *args, rate_limiter=None, validator=None, **kwargs):
        self.rate_limiter = rate_limiter
        self.validator = validator
        super().__init__(*args, **kwargs)
    
    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.info(f"{self.client_address[0]} - {format % args}")
    
    def do_GET(self):
        """Handle GET requests (health check)"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'version': '1.0.0'
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/metrics':
            self._handle_metrics()
        else:
            self.send_response(405)  # Method Not Allowed
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error = {'error': 'Only POST requests are supported for verification'}
            self.wfile.write(json.dumps(error).encode())
    
    def do_POST(self):
        """Handle POST requests for token verification"""
        client_ip = self.client_address[0]
        
        # Rate limiting
        if not self.rate_limiter.is_allowed(client_ip):
            logger.warning(f"Rate limit exceeded for {client_ip}")
            self.send_response(429)  # Too Many Requests
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error = {'error': 'Rate limit exceeded'}
            self.wfile.write(json.dumps(error).encode())
            return
        
        try:
            # Verify authorization header
            auth_header = self.headers.get('Authorization')
            if auth_header != CONFIG['auth_header']:
                logger.warning(f"Unauthorized request from {client_ip}")
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error = {'error': 'Unauthorized'}
                self.wfile.write(json.dumps(error).encode())
                return
            
            # Read and parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error = {'error': 'Empty request body'}
                self.wfile.write(json.dumps(error).encode())
                return
            
            body = self.rfile.read(content_length)
            request_data = json.loads(body.decode())
            
            logger.info(f"Verification request from {client_ip}: {list(request_data.keys())}")
            
            # Process each detector in the request
            verification_results = {}
            
            for detector_name, detector_data in request_data.items():
                if isinstance(detector_data, dict) and 'token' in detector_data:
                    token = detector_data['token']
                    is_valid = self.validator.validate_api_key(token, detector_name)
                    verification_results[detector_name] = {
                        'valid': is_valid,
                        'timestamp': datetime.utcnow().isoformat()
                    }
                    
                    logger.info(f"Token validation for {detector_name}: {'VALID' if is_valid else 'INVALID'}")
            
            # Determine overall response
            if any(result['valid'] for result in verification_results.values()):
                # At least one token is valid - return 200 (valid)
                self.send_response(200)
            else:
                # All tokens are invalid - return 403 (forbidden)
                self.send_response(403)
            
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'results': verification_results,
                'processed_at': datetime.utcnow().isoformat()
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request from {client_ip}: {e}")
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error = {'error': 'Invalid JSON format'}
            self.wfile.write(json.dumps(error).encode())
            
        except Exception as e:
            logger.error(f"Verification error from {client_ip}: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error = {'error': 'Internal server error'}
            self.wfile.write(json.dumps(error).encode())
    
    def _handle_metrics(self):
        """Handle metrics endpoint"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Simple metrics
        metrics = {
            'cache_size': len(self.validator.cache),
            'rate_limiter_clients': len(self.rate_limiter.requests),
            'timestamp': datetime.utcnow().isoformat()
        }
        self.wfile.write(json.dumps(metrics, indent=2).encode())

def create_handler_class(rate_limiter, validator):
    """Factory function to create handler class with dependencies"""
    def handler(*args, **kwargs):
        return TruffleHogVerifier(*args, rate_limiter=rate_limiter, validator=validator, **kwargs)
    return handler

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)

def main():
    """Main server function"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Initialize components
    rate_limiter = RateLimiter(CONFIG['rate_limit'])
    validator = TokenValidator()
    
    # Create handler class
    handler_class = create_handler_class(rate_limiter, validator)
    
    # Start server
    server_address = (CONFIG['host'], CONFIG['port'])
    httpd = HTTPServer(server_address, handler_class)
    
    logger.info(f"TruffleHog Verification Server starting on {CONFIG['host']}:{CONFIG['port']}")
    logger.info("Endpoints:")
    logger.info("  POST /          - Token verification")
    logger.info("  GET  /health    - Health check")
    logger.info("  GET  /metrics   - Server metrics")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        httpd.server_close()
        logger.info("Server shutdown complete")

if __name__ == '__main__':
    main()