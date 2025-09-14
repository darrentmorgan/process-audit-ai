import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring for Edge Runtime
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Edge-specific configuration
  beforeSend(event, hint) {
    // Add custom context for Edge Runtime operations
    if (event.contexts) {
      event.contexts.processaudit = {
        component: 'edge',
        platform: 'vercel-edge',
        version: process.env.APP_VERSION || '1.4.0'
      };
    }

    // Filter sensitive data from edge functions
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-clerk-session-token'];
      }
    }

    return event;
  },

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Privacy settings
  sendDefaultPii: false,

  // Custom tags for edge operations
  initialScope: {
    tags: {
      component: "edge",
      platform: "vercel-edge"
    }
  }
});