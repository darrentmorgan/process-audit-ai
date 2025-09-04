# Clerk Organizations Setup Guide

This guide walks you through setting up Clerk Organizations for ProcessAudit AI's multi-tenant white-label deployments.

## Phase 1: Foundation Setup (Current Implementation)

### Prerequisites

1. **Existing ProcessAudit AI deployment** with Supabase authentication working
2. **Clerk account** - Sign up at [clerk.com](https://clerk.com)
3. **Node.js environment** with the project dependencies installed

### Step 1: Environment Configuration

1. Copy your `.env.example` to `.env.local` if you haven't already:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure the authentication system selector**:
   ```env
   # Set to 'true' to enable Clerk Organizations
   NEXT_PUBLIC_USE_CLERK_AUTH=false  # Keep as 'false' during setup
   ```

3. **Add your Clerk credentials** (obtain these from Clerk Dashboard):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
   CLERK_SECRET_KEY=sk_test_your_secret_key
   ```

### Step 2: Clerk Dashboard Configuration

1. **Create a new application** in Clerk Dashboard
2. **Enable Organizations feature**:
   - Go to "User & Authentication" → "Organizations"
   - Toggle "Enable Organizations" to ON
   - Set "Organization membership" to "Required" or "Optional" based on your needs
3. **Configure authentication methods**:
   - Email/Password (recommended for business users)
   - Social providers if desired (Google, Microsoft, etc.)
4. **Set up your domains**:
   - Add your development domain: `http://localhost:3000`
   - Add your production domain: `https://your-app.vercel.app`

### Step 3: Development Server Setup

1. **Install dependencies** (already done if following this guide):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test the dual authentication**:
   - With `NEXT_PUBLIC_USE_CLERK_AUTH=false`: Should see existing Supabase auth
   - With `NEXT_PUBLIC_USE_CLERK_AUTH=true`: Should see Clerk auth components

### Step 4: Verify Installation

1. **Check the authentication switch**:
   ```bash
   # Test Supabase auth (existing)
   NEXT_PUBLIC_USE_CLERK_AUTH=false npm run dev
   
   # Test Clerk auth (new)
   NEXT_PUBLIC_USE_CLERK_AUTH=true npm run dev
   ```

2. **Test organization features** (when Clerk is enabled):
   - Create a user account
   - Create an organization
   - Switch between organizations
   - Invite team members

## Architecture Overview

### Dual Authentication System

The implementation provides a **migration bridge** that allows you to:

- **Keep existing Supabase authentication** working during transition
- **Test Clerk Organizations** without breaking current functionality
- **Gradually migrate users** from Supabase to Clerk
- **Maintain database compatibility** during the transition

### Key Components

| Component | Purpose | Location |
|-----------|---------|-----------|
| `UnifiedAuthContext` | Manages both auth systems | `/contexts/UnifiedAuthContext.js` |
| `ClerkProviderWrapper` | Configures Clerk appearance | `/components/ClerkProviderWrapper.jsx` |
| `UnifiedAuthModal` | Routes to appropriate auth UI | `/components/UnifiedAuthModal.jsx` |
| `OrganizationSwitcher` | Organization management | `/components/OrganizationSwitcher.jsx` |
| `middleware.js` | Handles organization routing | `/middleware.js` |

### Feature Flags

The system uses environment variables for feature control:

```env
# Primary feature flag
NEXT_PUBLIC_USE_CLERK_AUTH=true|false

# Required Clerk configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Organization Routing Patterns

The implementation supports multiple organization identification methods:

### 1. Subdomain-based (Recommended for white-label)
```
https://acme-corp.your-app.com
https://contoso.your-app.com
```

### 2. Path-based
```
https://your-app.com/org/acme-corp
https://your-app.com/org/contoso
```

### 3. Custom domains (Future enhancement)
```
https://processes.acme-corp.com
https://audit.contoso.com
```

## Migration Strategy

### Phase 1: Foundation (Current)
- ✅ Dual authentication system
- ✅ Environment configuration
- ✅ Basic organization support
- ✅ Clerk components integration

### Phase 2: Organization Management (Next)
- Organization creation workflows
- Member invitation system
- Role-based permissions
- Custom branding per organization

### Phase 3: White-label Features (Future)
- Custom domain support
- Organization-specific themes
- Isolated data storage
- Custom email templates

### Phase 4: Migration Tools (Future)
- Supabase → Clerk user migration
- Data migration utilities
- Rollback procedures

## Troubleshooting

### Common Issues

1. **"Clerk is not configured" errors**:
   - Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
   - Check that `NEXT_PUBLIC_USE_CLERK_AUTH=true`
   - Restart your development server

2. **Organization switcher not appearing**:
   - Ensure user has created or joined an organization
   - Check Clerk Dashboard for organization settings
   - Verify organizations are enabled in Clerk

3. **Authentication loops**:
   - Check redirect URLs in Clerk Dashboard
   - Verify middleware configuration
   - Clear browser localStorage/cookies

### Development Commands

```bash
# Standard development
npm run dev

# Force Clerk authentication
NEXT_PUBLIC_USE_CLERK_AUTH=true npm run dev

# Force Supabase authentication (existing)
NEXT_PUBLIC_USE_CLERK_AUTH=false npm run dev

# Production build test
npm run build && npm start
```

## Production Deployment

### Vercel Deployment

1. **Configure environment variables** in Vercel dashboard:
   ```env
   NEXT_PUBLIC_USE_CLERK_AUTH=true
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

2. **Update Clerk Dashboard**:
   - Add production domain to allowed origins
   - Configure production redirect URLs
   - Set up webhook endpoints (if needed)

3. **Deploy**:
   ```bash
   git push origin main  # Triggers Vercel deployment
   ```

### Custom Domain Setup (Future)

For white-label deployments with custom domains:

1. Configure DNS CNAME records
2. Set up SSL certificates
3. Update Clerk allowed origins
4. Configure organization → domain mapping

## Security Considerations

- **API Keys**: Keep Clerk secret keys secure and never expose in frontend code
- **CORS**: Configure appropriate origins in Clerk Dashboard
- **Webhooks**: Verify webhook signatures for production
- **Organizations**: Implement proper role-based access controls

## Next Steps

After Phase 1 setup is complete:

1. **Test organization workflows** in development
2. **Plan Phase 2 implementation** (organization management)
3. **Design custom branding system** for white-label features
4. **Prepare migration plan** from Supabase to Clerk (if desired)

## Support Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Organizations Feature](https://clerk.com/docs/organizations/overview)
- [ProcessAudit AI GitHub Issues](https://github.com/your-repo/issues)