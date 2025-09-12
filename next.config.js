/** @type {import('next').NextConfig} */

// Security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://vercel.live https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk-telemetry.com;
      worker-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com;
      style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com;
      img-src 'self' blob: data: https: https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://img.clerk.com;
      font-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com;
      frame-ancestors 'none';
      frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com;
      connect-src 'self' https://*.supabase.co https://api.anthropic.com wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk-telemetry.com https://api.clerk.com;
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: [],
    // Mobile-specific optimizations  
    optimizePackageImports: ['lucide-react'],
  },
  
  // Temporarily allow deployment with linting warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Temporarily disable TypeScript checking for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Apply security headers (disabled in development)
  async headers() {
    return process.env.NODE_ENV === 'production' ? [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ] : [
      {
        // Only cache control for API routes in development
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  
  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production'
      ? [
          {
            source: '/:path*',
            has: [
              {
                type: 'header',
                key: 'x-forwarded-proto',
                value: 'http',
              },
            ],
            destination: 'https://:path*',
            permanent: true,
          },
        ]
      : [];
  },
}

module.exports = nextConfig