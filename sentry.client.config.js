import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Enhanced performance tracking
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Context and user tracking
  beforeSend(event, hint) {
    // Filter out known issues in development
    if (process.env.NODE_ENV === 'development') {
      // Filter out hydration warnings and other dev-only issues
      if (event.message?.includes('Text content did not match') ||
          event.message?.includes('Warning:')) {
        return null;
      }
    }

    // Add custom context for ProcessAudit AI
    if (event.contexts) {
      event.contexts.processaudit = {
        component: 'frontend',
        platform: 'vercel',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.4.0'
      };
    }

    return event;
  },

  // Integration configuration
  integrations: [
    Sentry.feedbackIntegration({
      colorScheme: "system",
      isNameRequired: true,
      isEmailRequired: false,
    }),
  ],

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Privacy settings
  sendDefaultPii: false,

  // Custom tags for better filtering
  initialScope: {
    tags: {
      component: "frontend",
      platform: "nextjs"
    }
  }
});