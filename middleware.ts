import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const getOrganizationFromSubdomain = (hostname: string | null): string | null => {
  if (!hostname) return null;

  // Local development - no subdomain routing
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return null;
  }
  
  const parts = hostname.split('.');
  if (parts.length < 3) return null; // Not a subdomain
  
  const subdomain = parts[0];
  
  // Map subdomain to organization slug
  const subdomainOrgMap: Record<string, string> = {
    'hospo-dojo': 'hospo-dojo',
    // Future clients:
    // 'client2': 'client2-slug',
    // 'manufacturing-co': 'manufacturing-corp'
  };
  
  return subdomainOrgMap[subdomain] || null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const organization = getOrganizationFromSubdomain(hostname);

  if (organization) {
    // Set organization context for server-side rendering
    const response = NextResponse.next();
    response.cookies.set('organization', organization, { 
      path: '/', 
      sameSite: 'strict' 
    });

    // Optional: Set theme context for client-side rendering
    response.cookies.set('theme', organization, {
      path: '/',
      sameSite: 'strict'
    });

    return response;
  }

  // Default routing behavior
  return NextResponse.next();
}

export const config = {
  // Ensure middleware runs on all routes
  matcher: ['/']
};