# ProcessAudit AI - Vercel Deployment Guide

## Overview
Deploy ProcessAudit AI to Vercel with professional subdomain routing for client demos, specifically featuring the Hospo-Dojo branded experience.

## Professional URLs Structure
- **Main Platform**: `https://process-audit-ai.vercel.app`
- **Hospo-Dojo Demo**: `https://hospodojo.process-audit-ai.vercel.app`

## Prerequisites
- Vercel account with team/pro plan (for custom domains)
- GitHub repository connected
- Environment variables configured locally

## Step-by-Step Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

### 2. Link Project to Vercel
```bash
vercel --prod
# Follow prompts to create new project or link existing
```

### 3. Environment Variables Setup
Copy all variables from `.env.local` to Vercel dashboard or use CLI:

```bash
# Essential variables for production
vercel env add CLAUDE_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL  
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY

# Update app URL for production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-project.vercel.app
```

### 4. Configure Custom Domain & Subdomain

#### Option A: Using Vercel Domain
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `process-audit-ai.vercel.app`
3. Add subdomain: `hospodojo.process-audit-ai.vercel.app`

#### Option B: Using Custom Domain
1. Add your custom domain in Vercel dashboard
2. Configure DNS records:
   ```
   Type: A     Name: @              Value: 76.76.19.61
   Type: CNAME Name: hospodojo      Value: cname.vercel-dns.com
   Type: CNAME Name: www            Value: cname.vercel-dns.com
   ```

### 5. Update Clerk Configuration
1. Go to Clerk Dashboard → Your Application → Settings
2. Update **Allowed origins** to include:
   - `https://your-project.vercel.app`
   - `https://hospodojo.your-project.vercel.app`

3. Update **Allowed redirect URLs**:
   - `https://your-project.vercel.app`
   - `https://hospodojo.your-project.vercel.app`

### 6. Deploy to Production
```bash
vercel --prod
```

## Multi-Tenant Architecture

### Subdomain Detection
The middleware automatically detects subdomains and sets organization context:

```typescript
// hospodojo.your-domain.com → organization: 'hospo-dojo'
// your-domain.com → organization: null (standard experience)
```

### Organization Context Flow
1. **Middleware** detects subdomain → sets cookies
2. **Client Components** read cookies → apply branding
3. **Server Components** access cookies → serve branded content

### Adding New Client Subdomains
1. Update `middleware.ts`:
```typescript
const subdomainOrgMap: Record<string, string> = {
  'hospodojo': 'hospo-dojo',
  'newclient': 'new-client-org', // Add here
};
```

2. Update `vercel.json` if needed for specific routing rules

## API Route Configuration
Enhanced timeouts for AI processing:
- Standard APIs: 30 seconds
- SOP Analysis: 45 seconds  
- PDF Generation: 60 seconds

## Testing Deployment

### Local Testing
```bash
npm run build
npm run start
```

### Production Testing
1. **Main Experience**: Visit `https://your-project.vercel.app`
   - Should show standard ProcessAudit AI branding
   
2. **Hospo-Dojo Demo**: Visit `https://hospodojo.your-project.vercel.app`
   - Should show Hospo-Dojo logo and hospitality branding
   - Colors: Black (#1C1C1C), Ivory (#EAE8DD), Khaki Green (#42551C)

## Troubleshooting

### Common Issues

1. **Subdomain not working**
   - Check DNS propagation (can take 24-48 hours)
   - Verify domain configuration in Vercel dashboard
   - Check middleware matcher configuration

2. **Environment variables not loading**
   - Ensure variables are set in Vercel dashboard
   - Restart deployment after adding variables
   - Check variable names match exactly (case-sensitive)

3. **Authentication redirect errors**
   - Update Clerk allowed origins and redirect URLs
   - Verify NEXT_PUBLIC_APP_URL matches production domain

4. **API timeouts**
   - Check function timeout configurations in vercel.json
   - Monitor function logs in Vercel dashboard

### Debugging Tools
- Vercel function logs: `vercel logs --follow`
- Check headers: Browser dev tools → Network → Headers
- Organization detection: Check cookies in browser

## Security Considerations
- HTTPS enforced in production
- Secure cookies with `sameSite: 'strict'`
- CSP headers configured for AI APIs
- Environment variables secured in Vercel dashboard

## Performance Optimization
- Static assets cached at edge
- API routes optimized for AI processing
- Image optimization for logos and brand assets
- Minimized middleware execution scope

## Monitoring & Maintenance
- Monitor function execution times in Vercel dashboard
- Track API usage and success rates
- Regular security updates for dependencies
- Monitor subdomain routing performance

---

## Quick Deployment Commands
```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View function logs
vercel logs --follow

# Update environment variable
vercel env add VARIABLE_NAME production
```

## Support
For deployment issues, check:
1. Vercel function logs
2. Browser console for client-side errors
3. Network tab for API request failures
4. Middleware execution in server logs