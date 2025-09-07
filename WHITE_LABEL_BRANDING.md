# White Label Branding Implementation Guide

This document provides detailed instructions for implementing client-specific branding in ProcessAudit AI's multi-tenant system. Follow these steps to create fully branded white-label experiences for clients.

## Overview

ProcessAudit AI supports comprehensive white-label branding through:
- **Multi-tenant organization system** (Clerk Organizations)
- **Dynamic theming infrastructure** (`ThemeContext.jsx`)
- **Organization-specific routing** (domain/subdomain/path-based)
- **Database-driven branding storage** (`organizations.branding` JSONB column)
- **Asset management system** (logos, images, custom CSS)

## Prerequisites

Before implementing client branding, ensure:
- ✅ **Clerk Organizations enabled** and working
- ✅ **Supabase database** connected with organization schema
- ✅ **Theme system** functional (`ThemeContext.jsx`)
- ✅ **Development environment** running (`npm run dev`)

## Implementation Phases

### Phase 1: Client Organization Setup

#### 1.1 Create Client Organization
```bash
# Option A: Via Admin Interface (Recommended)
1. Navigate to ProcessAudit AI dashboard
2. Access Organization Switcher dropdown
3. Click "Create Organization"
4. Fill client organization details:
   - Name: "Client Company Name"
   - Slug: "client-slug" (URL-friendly)
   - Description: "Client description"
   - Industry: Select appropriate industry

# Option B: Via Clerk Dashboard (Alternative)
1. Access Clerk Dashboard (https://dashboard.clerk.com)
2. Navigate to Organizations
3. Create new organization with client details
```

#### 1.2 Collect Client Brand Assets
Gather the following from your client:

**Required Assets:**
- **Logo (SVG/PNG)**: Primary logo, preferably SVG for scalability
- **Colors**: Primary, secondary, accent colors (hex codes)
- **Typography**: Font preferences (Google Fonts or web-safe fonts)

**Optional Assets:**
- **Favicon**: 32x32 PNG or ICO format
- **Hero Background**: High-resolution banner image (1920x1080)
- **Custom CSS**: Any specific styling requirements

#### 1.3 Prepare Brand Package
Create a brand package following this structure:

```javascript
// Example client brand package
const clientBrandPackage = {
  // Organization details
  name: "Client Company Name",
  slug: "client-slug",
  
  // Color scheme
  colors: {
    primary: "#1e40af",        // Client primary color
    secondary: "#059669",      // Client secondary color  
    accent: "#dc2626",         // Client accent color
    background: "#ffffff",     // Background color
    text: {
      primary: "#1f2937",      // Main text color
      secondary: "#6b7280",    // Secondary text color
      accent: "#1e40af"        // Accent text color
    }
  },
  
  // Brand assets
  assets: {
    logo: {
      light: "/client-assets/client-slug/logo-light.svg",
      dark: "/client-assets/client-slug/logo-dark.svg"
    },
    favicon: "/client-assets/client-slug/favicon.ico",
    heroBackground: "/client-assets/client-slug/hero-bg.jpg"
  },
  
  // Typography
  typography: {
    fontFamily: "Client Font Family, system-ui, sans-serif",
    headingFont: "Client Heading Font, serif",
    baseFontSize: 16,
    lineHeight: 1.6
  },
  
  // Custom domain (optional)
  customDomain: "client-domain.com",
  
  // Custom CSS (optional)
  customCSS: `
    :root {
      --client-gradient: linear-gradient(135deg, #1e40af 0%, #059669 100%);
      --client-shadow: 0 4px 20px rgba(30, 64, 175, 0.2);
    }
  `
}
```

### Phase 2: Asset Upload and Storage

#### 2.1 Upload Client Assets
```bash
# Using the Asset Upload API
curl -X POST http://localhost:3000/api/clients/{clientId}/assets \
  -H "Content-Type: multipart/form-data" \
  -F "logo=@/path/to/client-logo.svg" \
  -F "favicon=@/path/to/client-favicon.ico" \
  -F "heroBackground=@/path/to/client-hero.jpg"
```

**Asset Requirements:**
- **Logo**: SVG preferred, PNG acceptable (max 2MB)
- **Favicon**: ICO or PNG, 32x32 pixels recommended
- **Hero Background**: JPG/PNG, 1920x1080 recommended (max 5MB)
- **File Naming**: Use client slug for organization

#### 2.2 Store Brand Configuration
```bash
# Using the Branding API
curl -X PUT http://localhost:3000/api/clients/{clientId}/branding \
  -H "Content-Type: application/json" \
  -d '{
    "branding": {
      "primaryColor": "#1e40af",
      "secondaryColor": "#059669", 
      "logoUrl": "/client-assets/client-slug/logo.svg",
      "faviconUrl": "/client-assets/client-slug/favicon.ico",
      "customDomain": "client-domain.com"
    }
  }'
```

### Phase 3: Domain Configuration

#### 3.1 Configure Client Access Routes

**Option A: Subdomain Access (Recommended for Demos)**
```bash
# Configure subdomain routing
# Client URL: client-slug.processaudit.ai

# Update DNS settings:
client-slug.processaudit.ai CNAME processaudit.ai
```

**Option B: Path-Based Access**
```bash
# Client URL: processaudit.ai/org/client-slug
# No additional configuration needed
# Uses existing path-based routing
```

**Option C: Custom Domain (Full White-Label)**
```bash
# Configure custom domain
# Client URL: client-domain.com

# DNS Configuration:
client-domain.com CNAME processaudit.ai
www.client-domain.com CNAME processaudit.ai

# SSL Certificate setup (automatic via Vercel/Cloudflare)
```

#### 3.2 Test Domain Resolution
```bash
# Test organization detection
curl http://localhost:3000/api/organizations/resolve?domain=client-slug.processaudit.ai

# Expected response:
{
  "success": true,
  "data": {
    "organizationId": "org_...",
    "slug": "client-slug",
    "branding": { ... },
    "routingType": "subdomain"
  }
}
```

### Phase 4: Theme Application

#### 4.1 Automatic Theme Loading
The system automatically applies client branding when:

1. **User visits client URL** (domain/subdomain/path)
2. **Organization context detected** via `getOrganizationContext()`
3. **Branding loaded** from database via `ThemeContext`
4. **CSS variables applied** to `document.documentElement`

#### 4.2 Manual Theme Testing
```javascript
// Test theme application programmatically
import { brandTestUtils } from '../__tests__/fixtures/brands'

// Apply client branding
const clientBranding = {
  colors: {
    primary: "#1e40af",
    secondary: "#059669",
    // ... rest of client colors
  }
}

brandTestUtils.applyTestBrand({ branding: clientBranding })
```

#### 4.3 Verify Theme Application
```bash
# Check CSS variables in browser console
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
// Should return client's primary color

# Check theme context
window.__NEXT_THEME_CONTEXT__ // Should show client branding data
```

## Client Demo Creation Workflow

### Step 1: Prepare Client Assets
1. **Collect client brand guidelines** and assets
2. **Optimize assets** for web use:
   - Logo: Convert to SVG, optimize file size
   - Colors: Convert to hex codes (#rrggbb format)
   - Fonts: Identify Google Fonts or web-safe alternatives
3. **Create brand package** following the template above

### Step 2: Configure Client Organization
1. **Create organization** via ProcessAudit AI interface
2. **Upload assets** via asset management API
3. **Configure branding** via branding API
4. **Set routing preference** (subdomain/path/custom domain)

### Step 3: Test Client Experience
1. **Access client URL** (chosen routing method)
2. **Verify landing page branding** (colors, logo, fonts)
3. **Test authentication flow** (Clerk pages should reflect theming)
4. **Navigate application** (dashboard should use client colors)
5. **Test responsive design** on mobile/tablet

### Step 4: Client Presentation
1. **Generate demo URL** for client access
2. **Prepare demo script** highlighting branded features
3. **Document customization options** available to client
4. **Provide analytics** and performance metrics

## Troubleshooting Common Issues

### Issue: Theme Not Loading
**Symptoms:** Default ProcessAudit AI colors showing instead of client colors

**Solutions:**
1. **Check organization context**: Verify `getOrganizationContext()` returns correct data
2. **Check database**: Ensure branding data exists in `organizations.branding` 
3. **Check CSS variables**: Inspect `document.documentElement.style`
4. **Clear cache**: Hard refresh browser (Cmd/Ctrl + Shift + R)

### Issue: Assets Not Loading
**Symptoms:** Client logo/images not displaying

**Solutions:**
1. **Check asset URLs**: Verify paths in `organizations.branding.logoUrl`
2. **Check file upload**: Ensure assets uploaded to Supabase Storage
3. **Check permissions**: Verify Supabase bucket permissions
4. **Check CORS**: Ensure proper CORS configuration for asset domains

### Issue: Domain Routing Not Working
**Symptoms:** Client domain not resolving to branded experience

**Solutions:**
1. **Check DNS configuration**: Verify CNAME records pointing to ProcessAudit AI
2. **Check middleware**: Ensure `getOrganizationContext()` detects domain
3. **Check SSL**: Verify SSL certificate provisioned for custom domain
4. **Check organization mapping**: Ensure domain → organization mapping exists

## Testing Client Implementations

### Automated Testing
```bash
# Run branding system tests
npm test __tests__/branding/

# Run client-specific tests  
npm test __tests__/clients/

# Run E2E branding tests
npx playwright test tests/e2e-client-branding.spec.js
```

### Manual Testing Checklist
- [ ] **Landing page** displays client colors and logo
- [ ] **Navigation** shows client branding
- [ ] **Authentication flow** reflects client theme
- [ ] **Dashboard** uses client color scheme
- [ ] **Forms and buttons** use client colors
- [ ] **Responsive design** works on all devices
- [ ] **Performance** meets <200ms theme loading requirement

## Advanced Configuration Options

### Custom CSS Integration
```css
/* Example client-specific CSS */
:root {
  --client-primary: #1e40af;
  --client-secondary: #059669;
  --client-gradient: linear-gradient(135deg, var(--client-primary), var(--client-secondary));
}

.client-hero {
  background: var(--client-gradient);
}

.client-button {
  background-color: var(--client-primary);
  border-radius: 8px;
}
```

### Multi-Language Support (Future Enhancement)
```javascript
// Client content localization structure
const clientContent = {
  en: {
    hero: {
      headline: "English headline",
      subheadline: "English description"
    }
  },
  es: {
    hero: {
      headline: "Título en español", 
      subheadline: "Descripción en español"
    }
  }
}
```

## Security Considerations

### Asset Validation
- **File type validation**: Only allow SVG, PNG, JPG, ICO
- **File size limits**: Logo (2MB), Hero images (5MB), Favicon (1MB)
- **Content scanning**: Validate uploaded files for malicious content
- **URL sanitization**: Prevent XSS via asset URLs

### Access Control
- **Organization isolation**: RLS policies ensure data separation
- **Admin-only branding**: Only organization admins can modify branding
- **API authentication**: All branding APIs require Clerk authentication
- **Input validation**: Comprehensive validation for all branding inputs

## Performance Optimization

### Theme Loading Performance
- **CSS variable caching**: Cache computed styles for faster application
- **Asset preloading**: Preload critical assets during routing
- **Middleware optimization**: Load branding data during middleware execution
- **CDN integration**: Use CDN for static brand assets

### Monitoring and Analytics
- **Theme loading times**: Monitor performance metrics per client
- **Error tracking**: Track branding-related errors and failures
- **Usage analytics**: Monitor client demo engagement and conversion

## Support and Maintenance

### Client Support Workflow
1. **Branding issues**: Use brand tester page to diagnose problems
2. **Asset updates**: Guide clients through asset upload process
3. **Domain configuration**: Assist with DNS and SSL setup
4. **Performance optimization**: Monitor and optimize client-specific performance

### Maintenance Tasks
- **Regular asset optimization**: Compress and optimize client assets
- **Performance monitoring**: Track theme loading performance
- **Security updates**: Keep asset validation and security measures current
- **Documentation updates**: Keep this guide current with system changes

---

## Quick Reference Commands

### Start Development Environment
```bash
npm run dev                    # Frontend (port 3000)
cd workers && npm run dev      # Workers (port 8787)
```

### Test Branding System
```bash
# Access brand tester
http://localhost:3000/dev/brand-tester

# Run branding tests
npm test __tests__/types/branding-types.test.ts

# Test API endpoints
curl http://localhost:3000/api/clients/{clientId}/branding
```

### Create Client Demo
```bash
# 1. Create organization (via UI or API)
# 2. Upload assets (via API or interface)
# 3. Configure branding (via API)
# 4. Test demo URL: client-slug.processaudit.ai
```

---

**For support or questions about white-label implementation, reference this document and the associated TypeScript types in `types/client-branding.ts`.**