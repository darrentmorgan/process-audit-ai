import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const getOrganizationFromSubdomain = (hostname: string | null): string | null => {
  if (!hostname) return null;

  // Local development - no subdomain routing
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return null;
  }
  
  // Handle Vercel preview deployments and custom domains
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  
  const subdomain = parts[0];
  
  // Enhanced subdomain mapping for professional deployment
  const subdomainOrgMap: Record<string, string> = {
    'hospodojo': 'hospo-dojo',
    'hospo-dojo': 'hospo-dojo',
    // Future professional client demos:
    // 'manufacturing': 'manufacturing-corp',
    // 'healthcare': 'healthcare-solutions',
    // 'retail': 'retail-optimization'
  };
  
  return subdomainOrgMap[subdomain] || null;
}

const getOrganizationFromHeaders = (request: NextRequest): string | null => {
  // Check for Vercel header set in vercel.json
  const orgHeader = request.headers.get('X-Organization-Context');
  if (orgHeader) return orgHeader;
  
  return null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  // Try multiple detection methods for robust organization context
  let organization = getOrganizationFromSubdomain(hostname) || getOrganizationFromHeaders(request);

  if (organization) {
    // Set organization context for server-side rendering
    const response = NextResponse.next();
    
    // Set cookies for client-side organization detection
    response.cookies.set('organization', organization, { 
      path: '/', 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false // Allow client-side access
    });

    // Set theme context for client-side rendering
    response.cookies.set('theme', organization, {
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false // Allow client-side access
    });

    // Add custom header for debugging and server-side components
    response.headers.set('X-Current-Organization', organization);
    
    return response;
  }

  // Default routing behavior - clear organization cookies if no match
  const response = NextResponse.next();
  response.cookies.delete('organization');
  response.cookies.delete('theme');
  
  return response;
}

export const config = {
  // Ensure middleware runs on all routes for subdomain detection
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)'
  ]
};