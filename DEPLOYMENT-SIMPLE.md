# ProcessAudit AI - Simple Vercel Deployment (No Custom Domain)

## Quick Deployment Guide

Deploy your ProcessAudit AI platform with Hospo-Dojo multi-tenant branding **without buying a custom domain**.

## Professional Demo URLs (No Domain Purchase Required)

- **Main Platform**: `https://process-audit-ai.vercel.app`  
- **Hospo-Dojo Demo**: `https://process-audit-ai.vercel.app?org=hospo-dojo&access=granted`

## Step-by-Step Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2. Quick Environment Setup

Copy your local environment file:
```bash
cp .env.local .env.production
```

### 3. Configure Vercel Environment Variables

**Go to Vercel Dashboard → Your Project → Settings → Environment Variables**

**Essential Variables (Copy from your .env.local):**
```
CLAUDE_API_KEY=your_claude_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

**Demo Mode Configuration:**
```
NEXT_PUBLIC_USE_CLERK_AUTH=false
NEXT_PUBLIC_DEMO_MODE_ENABLED=true
NEXT_PUBLIC_APP_URL=https://process-audit-ai.vercel.app
```

### 4. Deploy
```bash
# Use the automated script
./scripts/deploy-demo.sh

# Or deploy manually
vercel --prod
```

## Multi-Tenant Features Available

### ✅ What Works Without Custom Domain:
- **Query Parameter Routing**: `?org=hospo-dojo` triggers branding
- **Professional Branding**: Official Hospo-Dojo colors, logo, terminology
- **Industry-Specific AI**: Restaurant-focused analysis and recommendations  
- **Professional PDFs**: Branded document generation with stamps/logos
- **Demo Access**: `?access=granted` bypasses authentication

### ✅ Professional Experience:
- Complete Hospo-Dojo branded workflow
- Restaurant SOP generation with HACCP compliance
- Automation recommendations with ROI calculations
- Professional PDF downloads with correct branding

## Upgrading Later (Optional)

When ready for production users with authentication:

### Option A: Enable Clerk with Vercel URLs
1. Set `NEXT_PUBLIC_USE_CLERK_AUTH=true`
2. Add Vercel URLs to Clerk Dashboard allowed origins
3. Users can sign up and save their reports

### Option B: Purchase Custom Domain
1. Buy domain (e.g., `processaudit.com`)
2. Configure true subdomain routing (`hospodojo.processaudit.com`)
3. Enable full Clerk authentication system

## Testing Your Deployment

### 1. Main Experience Test:
Visit: `https://process-audit-ai.vercel.app`
- Should show standard ProcessAudit AI branding
- Blue gradient background, standard colors

### 2. Hospo-Dojo Experience Test:  
Visit: `https://process-audit-ai.vercel.app?org=hospo-dojo&access=granted`
- Should show Hospo-Dojo logo and martial arts branding
- Black-to-Khaki-Green gradient background
- "Prep For Success" tagline
- Restaurant-specific AI analysis

### 3. Complete Workflow Test:
1. Enter restaurant process description
2. Complete SOP discovery questions  
3. Review automation recommendations
4. Download branded PDF document

## Benefits of This Approach

### ✅ **Immediate Professional Demo:**
- No upfront costs or domain setup
- Professional-looking URLs
- Complete multi-tenant experience
- Ready for client presentations

### ✅ **Full Feature Set:**
- AI-powered process analysis
- Industry-specific recommendations
- Professional PDF generation
- Multi-tenant branding system

### ✅ **Upgrade Path Available:**
- Can add custom domain later
- Can enable authentication when needed
- Can expand to more client brands
- Maintains all existing functionality

---

## Quick Commands Summary

```bash
# Deploy immediately  
./scripts/deploy-demo.sh

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Update environment variables
# (Done via Vercel Dashboard GUI)
```

This approach gets your professional Hospo-Dojo demo live immediately without any domain purchase requirements!