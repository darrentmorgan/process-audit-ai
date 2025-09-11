# Clerk Dashboard Configuration for Vercel Deployment

## ⚡ Quick Fix for Loading Issue

The app is stuck loading because Clerk auth is disabled but the app depends on it. Here's the 5-minute fix:

## Step 1: Update Vercel Environment Variables

**Go to**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add these variables** (copy the values from your local `.env.local`):

```
NEXT_PUBLIC_USE_CLERK_AUTH=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[your pk_test_ key]
CLERK_SECRET_KEY=[your sk_test_ key] 
CLAUDE_API_KEY=[your Claude API key]
NEXT_PUBLIC_SUPABASE_URL=[your Supabase URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your Supabase anon key]
SUPABASE_SERVICE_KEY=[your Supabase service key]
NEXT_PUBLIC_APP_URL=https://process-audit-116js32e4-myeasysoftware.vercel.app
```

## Step 2: Update Clerk Dashboard

**Go to**: https://dashboard.clerk.com → Your Application

### 2.1 Add Vercel URLs to Allowed Origins
**Navigate to**: Settings → General → Allowed origins

**Add these URLs**:
- `https://process-audit-116js32e4-myeasysoftware.vercel.app`
- `https://process-audit-116js32e4-myeasysoftware.vercel.app/*`

### 2.2 Update Redirect URLs  
**Navigate to**: Settings → General → Redirect URLs

**Add these URLs**:
- `https://process-audit-116js32e4-myeasysoftware.vercel.app`
- `https://process-audit-116js32e4-myeasysoftware.vercel.app/dashboard`

## Step 3: Redeploy

After setting environment variables in Vercel:

```bash
vercel --prod
```

## Expected Result

After this configuration:

- **Main Demo**: `https://process-audit-116js32e4-myeasysoftware.vercel.app`
  - Standard ProcessAudit AI branding
  - Working authentication and demos

- **Hospo-Dojo Demo**: `https://process-audit-116js32e4-myeasysoftware.vercel.app?org=hospo-dojo&access=granted`
  - Official Hospo-Dojo branding with logos
  - Restaurant-specific AI analysis
  - Professional PDF generation

## Why This Fixes the Loading Issue

- ✅ **Auth context resolves properly** instead of hanging
- ✅ **Clerk development instance works** with Vercel URLs  
- ✅ **Demo access still works** via `?access=granted`
- ✅ **No architecture changes** required

The loading hang was caused by the auth system waiting for Clerk to initialize when it was disabled. Re-enabling it with proper URLs fixes the issue immediately.

## Verification

After deployment, you should see:
1. **No more loading screen hang**
2. **Proper landing page with branding**  
3. **Working demo functionality**
4. **Hospo-Dojo experience with correct logos/colors**