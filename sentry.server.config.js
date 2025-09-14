import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enhanced performance tracking for server operations
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Server-side specific configuration
  beforeSend(event, hint) {
    // Add custom context for ProcessAudit AI server operations
    if (event.contexts) {
      event.contexts.processaudit = {
        component: 'backend',
        platform: 'vercel',
        version: process.env.APP_VERSION || '1.4.0'
      };
    }

    // Filter sensitive data from API routes
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-clerk-session-token'];
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string
          .replace(/token=[^&]+/g, 'token=[REDACTED]')
          .replace(/key=[^&]+/g, 'key=[REDACTED]');
      }
    }

    return event;
  },

  // Server-specific integrations
  integrations: [
    // Add performance monitoring for database operations
    Sentry.prismaIntegration(),

    // Monitor external API calls
    Sentry.httpIntegration({
      tracing: {
        shouldCreateSpanForRequest: (request) => {
          // Monitor calls to AI providers and external services
          return request.includes('api.anthropic.com') ||
                 request.includes('api.openai.com') ||
                 request.includes('supabase.co');
        }
      }
    })
  ],

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Privacy settings - important for multi-tenant data
  sendDefaultPii: false,

  // Custom tags for server operations
  initialScope: {
    tags: {
      component: "backend",
      platform: "nextjs-api"
    }
  },

  // Enhanced error context
  beforeBreadcrumb(breadcrumb, hint) {
    // Add organization context to breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      // Extract organization context if available
      const orgId = hint?.request?.headers?.['x-organization-id'];
      if (orgId) {
        breadcrumb.data.organizationId = orgId;
      }
    }
    return breadcrumb;
  }
});