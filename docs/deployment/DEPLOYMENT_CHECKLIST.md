# ProcessAudit AI - Deployment Checklist

## 🔧 Current Setup Status

### ✅ Completed:
- [x] Enhanced n8n workflow generation with intelligent prompt system
- [x] MCP client integration (with graceful fallback)
- [x] Worker-to-main app connectivity
- [x] UX improvements (immediate loading indicators)
- [x] Comprehensive workflow validation and auto-repair
- [x] **Authentication Migration**: Completed Clerk-only auth system with Organizations
- [x] **Multi-tenant Support**: Full organization isolation and white-label capabilities
- [x] **TypeScript Integration**: Complete auth type definitions and unified context

### 🚨 Required for Production:

## 1. Authentication Setup (CRITICAL)

### Clerk Authentication (Required)
ProcessAudit AI uses Clerk Organizations for all authentication.

**Get Clerk Keys:**
1. Visit https://clerk.com
2. Create account and new application
3. Enable Organizations in Clerk dashboard
4. Configure allowed redirect URLs
5. Copy publishable key and secret key

**Local Development:**
```bash
# Add to .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret
```

**Production Deployment:**
```bash
# Set in Vercel dashboard environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_secret
```

**Clerk Dashboard Configuration:**
- Set production domain in allowed origins
- Configure organization settings
- Set up webhook endpoints for user events
- Enable organization creation permissions

## 2. API Keys Configuration

### Claude API Key (Required)
The system uses Claude API for intelligent workflow generation.

**Get Claude API Key:**
1. Visit https://console.anthropic.com
2. Create account / sign in
3. Generate API key
4. Copy the key (starts with `sk-ant-`)

**Local Development:**
```bash
# Add to /Users/darrenmorgan/AI_Projects/process-audit-ai/.env.local
CLAUDE_API_KEY=sk-ant-your_key_here

# Add to /Users/darrenmorgan/AI_Projects/process-audit-ai/workers/.dev.vars  
CLAUDE_API_KEY=sk-ant-your_key_here
```

**Production Deployment:**
```bash
cd /Users/darrenmorgan/AI_Projects/process-audit-ai/workers

# Set production secrets
wrangler secret put CLAUDE_API_KEY
wrangler secret put N8N_MCP_AUTH_TOKEN  
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY

# Deploy to production
wrangler deploy
```

## 2. MCP Server Connection

### Current Status: ❌ Connection Failed
- Server URL: `https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app`
- Base endpoint returns 200 ✅
- `/session` endpoint returns 404 ❌
- Auth token configured ✅

### Possible Solutions:
1. **Verify MCP Server Endpoints**: Contact MCP server provider to confirm correct API endpoints
2. **Check Authentication**: Verify auth token is valid and properly formatted
3. **Update Client Code**: May need to adjust MCP client to match server's actual API
4. **Graceful Fallback**: ✅ System already falls back to intelligent prompts when MCP unavailable

## 3. Production Environment Variables

### Main App (.env.local → Production):
```bash
CLAUDE_API_KEY=sk-ant-your_key_here
CLOUDFLARE_WORKER_URL=https://your-worker-domain.your-subdomain.workers.dev
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### Cloudflare Worker (via wrangler secrets):
```bash
CLAUDE_API_KEY=sk-ant-your_key_here
N8N_MCP_AUTH_TOKEN=sprzkBcH0NKSI+kzhWDCOqCQMqqhefpSYlMa6ONpp8M
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=sk-proj-your_openai_key (for orchestrator)
```

## 4. Deployment Commands

### Deploy Cloudflare Worker:
```bash
cd workers/
wrangler deploy
```

### Deploy Main App (choose platform):

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
netlify deploy --prod
```

## 5. Testing Production Deployment

After deployment, test these endpoints:

### Worker Health Check:
```bash
curl https://your-worker-domain.your-subdomain.workers.dev/health
# Should return: {"status":"healthy"}
```

### MCP Connection Test:
```bash
curl https://your-worker-domain.your-subdomain.workers.dev/test-mcp
# Should show connection status and auth token presence
```

### End-to-End Workflow:
1. Visit production URL
2. Complete process audit workflow
3. Generate n8n automation
4. Verify download works
5. Check workflow quality (should use intelligent system)

## 6. Monitoring & Troubleshooting

### Key Metrics to Monitor:
- Worker queue processing time
- MCP connection success rate  
- Claude API response times
- Workflow generation success rate

### Common Issues:
1. **"No automation found" error**: Check worker connectivity and API keys
2. **MCP 404 errors**: Expected if server endpoints differ, system falls back gracefully
3. **Slow generation**: Check Claude API rate limits and worker performance
4. **Missing environment variables**: Verify all secrets are properly set

## 7. Success Criteria

✅ **System Working Properly When:**
- Workflow generation completes in <30 seconds
- Generated n8n workflows have proper node connections
- Loading indicators appear immediately (0% → 100%)
- Download produces valid JSON workflow files
- Intelligent system activates for email workflows
- Graceful fallback works when MCP unavailable

---

## Quick Setup Commands:

```bash
# 1. Set local Claude API key (replace with real key)
echo 'CLAUDE_API_KEY=sk-ant-your_key_here' >> .env.local
echo 'CLAUDE_API_KEY=sk-ant-your_key_here' >> workers/.dev.vars

# 2. Deploy to production
cd workers/
wrangler secret put CLAUDE_API_KEY  # Enter your Claude API key when prompted
wrangler deploy

# 3. Update main app production environment with worker URL
# Set CLOUDFLARE_WORKER_URL to your deployed worker URL
```

**Next Steps:** Get Claude API key and deploy with proper secrets configured.