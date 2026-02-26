// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { verifyJWT, isPublicRoute } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, locals, redirect } = context;
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
  ];
  
  // Check if current route is public
  if (isPublicRoute(url.pathname, publicRoutes)) {
    return next();
  }
  
  // Get authentication token from cookies or headers
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                context.cookies.get('auth-token')?.value;
  
  if (!token) {
    // Redirect to login for protected routes
    if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin')) {
      return redirect('/login');
    }
    
    // Return 401 for API routes
    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  try {
    // Verify JWT token
    const payload = await verifyJWT(token);
    
    // Add user info to locals for use in components and API routes
    locals.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    
    // Add helper functions to locals
    locals.isAuthenticated = true;
    locals.hasRole = (role: string) => payload.role === role || payload.role === 'admin';
    
  } catch (error) {
    console.error('JWT verification failed:', error);
    
    // Clear invalid token
    context.cookies.delete('auth-token', {
      path: '/',
    });
    
    // Redirect or return error based on route type
    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return redirect('/login');
  }
  
  // Continue to the next middleware or route handler
  return next();
});

// Additional middleware for role-based access control
export const adminMiddleware = defineMiddleware(async (context, next) => {
  const { locals, url, redirect } = context;
  
  // Check if user has admin role
  if (!locals.user || locals.user.role !== 'admin') {
    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return redirect('/unauthorized');
  }
  
  return next();
});

// Rate limiting middleware
export const rateLimitMiddleware = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  // Simple in-memory rate limiting (use Redis in production)
  const rateLimit = await checkRateLimit(clientIP, url.pathname);
  
  if (rateLimit.exceeded) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.retryAfter
      }),
      { 
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter.toString()
        }
      }
    );
  }
  
  return next();
});

// Security headers middleware
export const securityMiddleware = defineMiddleware(async (context, next) => {
  const response = await next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  
  return response;
});

// Helper functions (would typically be in separate files)
async function checkRateLimit(clientIP: string, path: string) {
  // Implementation would use Redis or similar in production
  // This is a simplified example
  const key = `rate_limit:${clientIP}:${path}`;
  const limit = 100; // requests per hour
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  // Mock implementation
  return {
    exceeded: false,
    retryAfter: 0
  };
}