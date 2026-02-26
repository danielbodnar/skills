// Bunny.net Edge Scripting Examples
// Deno-based edge scripts for request/response manipulation

// Basic edge script structure
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // Example: Simple routing based on path
  switch (url.pathname) {
    case '/api/health':
      return healthCheck();
    case '/api/geo':
      return geoLocation(request);
    case '/api/redirect':
      return handleRedirect(url);
    default:
      return fetch(request); // Pass through to origin
  }
}

// Health check endpoint
function healthCheck(): Response {
  return new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    edge: 'bunny.net',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

// Geo-location based content
function geoLocation(request: Request): Response {
  // Bunny.net provides geo headers
  const country = request.headers.get('CF-IPCountry') || 'Unknown';
  const city = request.headers.get('CF-IPCity') || 'Unknown';
  
  return new Response(JSON.stringify({
    country,
    city,
    message: `Hello from ${city}, ${country}!`,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

// Dynamic redirects
function handleRedirect(url: URL): Response {
  const destination = url.searchParams.get('to');
  
  if (!destination) {
    return new Response('Missing destination parameter', { status: 400 });
  }
  
  // Validate destination (basic security check)
  try {
    new URL(destination);
  } catch {
    return new Response('Invalid destination URL', { status: 400 });
  }
  
  return Response.redirect(destination, 302);
}

// Advanced: Request modification
addEventListener('fetch', (event) => {
  event.respondWith(modifyRequest(event.request));
});

async function modifyRequest(request: Request): Promise<Response> {
  // Clone request to modify headers
  const modifiedRequest = new Request(request, {
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'X-Edge-Script': 'bunny-net',
      'X-Request-ID': crypto.randomUUID(),
    },
  });
  
  // Fetch from origin with modified request
  const response = await fetch(modifiedRequest);
  
  // Modify response headers
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Served-By': 'bunny-edge',
      'X-Response-Time': Date.now().toString(),
    },
  });
  
  return modifiedResponse;
}

// Example: A/B Testing
addEventListener('fetch', (event) => {
  event.respondWith(abTest(event.request));
});

async function abTest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // Simple A/B test based on request hash
  const userId = request.headers.get('X-User-ID') || 'anonymous';
  const variant = hashString(userId) % 2 === 0 ? 'A' : 'B';
  
  // Modify request path based on variant
  if (url.pathname === '/landing') {
    url.pathname = `/landing-${variant}`;
  }
  
  const response = await fetch(new Request(url.toString(), request));
  
  // Add variant header for analytics
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-AB-Variant': variant,
    },
  });
  
  return modifiedResponse;
}

// Simple hash function for consistent A/B testing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Example: API Gateway functionality
addEventListener('fetch', (event) => {
  event.respondWith(apiGateway(event.request));
});

async function apiGateway(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // API rate limiting (simple in-memory example)
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (await isRateLimited(clientIP)) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain',
      },
    });
  }
  
  // Authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Forward to appropriate backend service
  const service = url.pathname.split('/')[2]; // /api/service/endpoint
  const backendUrl = getBackendUrl(service);
  
  if (!backendUrl) {
    return new Response('Service not found', { status: 404 });
  }
  
  // Proxy request to backend
  const backendRequest = new Request(
    url.toString().replace(url.origin, backendUrl),
    request
  );
  
  return fetch(backendRequest);
}

// Mock rate limiting (in production, use external storage)
const rateLimitStore = new Map<string, number[]>();

async function isRateLimited(clientIP: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  const requests = rateLimitStore.get(clientIP) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(clientIP, recentRequests);
  return false;
}

// Service discovery
function getBackendUrl(service: string): string | null {
  const services: Record<string, string> = {
    'users': 'https://users-api.example.com',
    'orders': 'https://orders-api.example.com',
    'payments': 'https://payments-api.example.com',
  };
  
  return services[service] || null;
}