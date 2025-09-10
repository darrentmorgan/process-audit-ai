# Hospo Dojo ProcessAudit AI White-Label Implementation

## Overview

Hospo Dojo is a custom white-label implementation of ProcessAudit AI tailored specifically for the hospitality industry. This implementation demonstrates our platform's flexibility in delivering industry-specific, branded experiences.

## Key Features

### Brand Design System
- **Color Palette**: Custom khaki green, black, and ivory color scheme
- **Typography**: 
  - Headlines: Gefika font (bold, uppercase)
  - Body: DM Sans with multi-language support
- **Accessibility**: WCAG AA/AAA compliant color contrasts

### Landing Page
- Industry-focused messaging for hospitality professionals
- Animated wave background with brand color gradients
- Responsive design with mobile-first approach
- Animated feature highlights

### Technical Implementation
- Next.js dynamic routing with brand subdomain support
- CSS-in-JS theming with custom design tokens
- Performance-optimized brand asset loading
- TypeScript type-safe brand configuration

## Integration Points

### Subdomain Configuration
- `hospo-dojo.processaudit.ai`
- Automatic brand context detection via middleware

### Theme Injection
- Dynamic CSS variable injection
- Fallback font and color systems
- Per-brand customization without code changes

## Performance Metrics

- Theme Loading: <200ms
- First Contentful Paint: <1.5s
- Accessibility Score: 95-100

## Future Roadmap
- Additional industry-specific workflow templates
- Mentorship network integration
- Enhanced hospitality process analysis tools

## Deployment

### Vercel Deployment
```bash
# Set brand-specific environment variables
vercel --env NEXT_PUBLIC_BRAND=hospo-dojo
```

### Cloudflare Workers Configuration
```bash
# Update worker routing
wrangler publish --env hospo-dojo
```

## Development

```bash
# Start development server with Hospo Dojo branding
npm run dev:brand hospo-dojo

# Run brand-specific tests
npm run test:brand hospo-dojo
```