# ProcessAudit AI - Dynamic Theming System

## Overview

The ProcessAudit AI theming system provides comprehensive white-label customization capabilities, allowing organizations to completely brand the application with their own colors, fonts, logos, and styling. The system is built on CSS custom properties and React contexts for real-time theme switching.

## Architecture

### Core Components

```
contexts/
├── ThemeContext.jsx          # Main theme provider and state management
└── UnifiedAuthContext.js     # Organization context integration

components/theme/
├── ThemeCustomizer.jsx       # Main theme editing interface
├── ThemePreview.jsx         # Live preview component
├── ThemeManager.jsx         # Floating theme manager UI
├── ColorPicker.jsx          # Color selection component
├── FontSelector.jsx         # Font family selection
├── AssetUploader.jsx        # Logo/favicon upload
└── withTheme.jsx           # HOC for theme-aware components

lib/
└── themeUtils.js           # Utility functions for theme manipulation

pages/api/organizations/
└── theme.js               # API endpoints for theme management

styles/
└── globals.css           # CSS custom properties and theme-aware classes
```

## Features

### 1. Dynamic Color Theming
- **Primary Colors**: Main brand colors with automatic hover states
- **Text Colors**: Hierarchical text colors (primary, secondary, muted)
- **Semantic Colors**: Success, warning, error states
- **Background Colors**: Surface, background, and border colors
- **Accessibility**: Automatic contrast checking and accessible text colors

### 2. Typography System
- **Font Selection**: Google Fonts, system fonts, and custom fonts
- **Font Loading**: Automatic Google Fonts loading and fallbacks
- **Typography Scale**: Consistent font sizes and weights
- **Live Preview**: Real-time typography preview with custom text

### 3. Brand Assets
- **Logo Management**: Upload and URL-based logo configuration
- **Favicon Support**: Custom favicons with format validation
- **Asset Validation**: File size, type, and dimension checking
- **Preview System**: Live asset preview with editing capabilities

### 4. Advanced Features
- **Preview Mode**: Non-destructive theme preview with apply/cancel
- **Import/Export**: JSON-based theme configuration export/import
- **Version Control**: Theme change history and rollback
- **Multi-Organization**: Automatic theme switching between organizations
- **Performance**: Efficient CSS variable injection and caching

## Usage

### Basic Theme Integration

```jsx
import { useTheme } from '../contexts/ThemeContext'

function MyComponent() {
  const { theme, getThemeValue } = useTheme()
  
  return (
    <div 
      style={{ 
        backgroundColor: getThemeValue('colors.surface'),
        color: getThemeValue('colors.text.primary'),
        fontFamily: getThemeValue('typography.fontFamily')
      }}
    >
      <h1 style={{ color: getThemeValue('colors.primary') }}>
        Welcome to {theme.organizationName}
      </h1>
    </div>
  )
}
```

### Using Theme-Aware CSS Classes

```jsx
function ThemedCard() {
  return (
    <div className="card bg-theme-surface text-theme-text-primary">
      <h2 className="text-theme-primary font-theme-semibold">Card Title</h2>
      <p className="text-theme-text-secondary">Card content with theme colors</p>
      <button className="btn-primary">Themed Button</button>
    </div>
  )
}
```

### Higher-Order Component Integration

```jsx
import withTheme from '../components/theme/withTheme'

const ThemedComponent = withTheme(MyComponent, {
  applyColors: true,
  applyFonts: true,
  customStyles: {
    borderColor: 'theme:colors.border',
    padding: 'theme:spacing.lg'
  }
})
```

### Programmatic Theme Updates

```jsx
import { useTheme } from '../contexts/ThemeContext'

function ThemeControls() {
  const { updateTheme, startPreview, applyPreview } = useTheme()
  
  const handleColorChange = async (color) => {
    // Preview the change
    startPreview({
      colors: { primary: color }
    })
    
    // Apply after user confirmation
    await applyPreview()
  }
  
  return (
    <div>
      <input 
        type="color" 
        onChange={(e) => handleColorChange(e.target.value)}
      />
    </div>
  )
}
```

## Theme Structure

### Complete Theme Object

```javascript
const theme = {
  colors: {
    primary: '#4299e1',
    secondary: '#38a169',
    accent: '#ed8936',
    background: '#ffffff',
    surface: '#f7fafc',
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
      muted: '#718096'
    },
    border: '#e2e8f0',
    success: '#38a169',
    warning: '#ed8936',
    error: '#e53e3e'
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '0.125rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  assets: {
    logoUrl: 'https://example.com/logo.svg',
    faviconUrl: 'https://example.com/favicon.ico',
    customDomain: 'app.company.com'
  }
}
```

## API Reference

### Theme Context Methods

```javascript
const {
  // Theme state
  theme,              // Current active theme
  defaultTheme,       // Default theme configuration
  isLoading,          // Loading state for theme operations
  error,              // Error state

  // Preview mode
  isPreviewMode,      // Whether preview mode is active
  previewTheme,       // Preview theme configuration

  // Theme management
  updateTheme,        // Update and save theme
  reloadTheme,        // Reload theme from database
  resetTheme,         // Reset to default theme

  // Preview functions
  startPreview,       // Start theme preview
  endPreview,         // Cancel theme preview
  applyPreview,       // Apply preview changes

  // Utilities
  getThemeValue,      // Get theme value by path
  exportTheme,        // Export theme as JSON
  importTheme,        // Import theme from JSON
  validateTheme       // Validate theme structure
} = useTheme()
```

### API Endpoints

#### GET `/api/organizations/theme?organizationId=<id>`
Retrieve organization theme configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "organizationId": "org_123",
    "organizationName": "Company Inc",
    "organizationSlug": "company-inc",
    "branding": {
      "primaryColor": "#4299e1",
      "secondaryColor": "#38a169",
      "logoUrl": "https://example.com/logo.svg",
      "faviconUrl": null,
      "customDomain": null
    },
    "hasCustomTheme": true
  }
}
```

#### PUT `/api/organizations/theme`
Update organization theme configuration.

**Request:**
```json
{
  "organizationId": "org_123",
  "branding": {
    "primaryColor": "#6366f1",
    "secondaryColor": "#8b5cf6"
  },
  "partial": true
}
```

#### POST `/api/organizations/theme`
Validate theme configuration without saving.

**Request:**
```json
{
  "branding": {
    "primaryColor": "#invalid-color"
  },
  "fullValidation": true
}
```

**Response:**
```json
{
  "success": true,
  "valid": false,
  "errors": ["primaryColor must be a valid color (hex, rgb, or hsl)"],
  "warnings": ["Consider setting a secondary color to complement your primary color"]
}
```

#### DELETE `/api/organizations/theme`
Reset organization theme to default.

## Development

### Setup and Testing

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Demo Data**
   ```bash
   node scripts/setup-theming-demo.js setup
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Demo Organizations**
   - TechFlow Inc: `http://localhost:3000/org/tech-startup`
   - Precision Financial: `http://localhost:3000/org/financial-firm`
   - MediCare Solutions: `http://localhost:3000/org/healthcare-org`
   - Creative Spark: `http://localhost:3000/org/creative-agency`
   - Enterprise Corp: `http://localhost:3000/org/enterprise-corp`

### Environment Variables

```env
# Required for theme functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional: Enable Clerk for organization management
NEXT_PUBLIC_USE_CLERK_AUTH=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
```

### Database Schema

The theming system requires the `organizations` table with a `branding` JSONB column:

```sql
-- Organizations table (partial)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  branding JSONB DEFAULT '{
    "primaryColor": null,
    "secondaryColor": null,
    "logoUrl": null,
    "faviconUrl": null,
    "customDomain": null
  }',
  -- other columns...
);
```

## Customization

### Adding New Theme Properties

1. **Update Default Theme** in `contexts/ThemeContext.jsx`
2. **Add CSS Custom Properties** in `styles/globals.css`
3. **Update Theme Utilities** in `lib/themeUtils.js`
4. **Add Tailwind Classes** in `tailwind.config.js`

### Creating Custom Theme Components

```jsx
import { useThemeStyles } from '../components/theme/withTheme'

function CustomThemedComponent() {
  const { primaryColor, fontFamily, spacing } = useThemeStyles()
  
  return (
    <div style={{
      backgroundColor: primaryColor,
      fontFamily,
      padding: spacing('lg')
    }}>
      Custom themed content
    </div>
  )
}
```

### Extending Color Palettes

```javascript
// Add to theme validation
const validateExtendedColors = (colors) => {
  const requiredColors = ['primary', 'secondary', 'tertiary']
  
  return requiredColors.every(color => 
    colors[color] && isValidColor(colors[color])
  )
}
```

## Performance Considerations

### CSS Custom Properties
- Properties are applied at the document root level
- Changes trigger smooth transitions across all components
- Minimal performance impact due to browser optimization

### Theme Caching
- Themes are cached in localStorage for faster loading
- Database queries are minimized through intelligent caching
- Asset preloading prevents flash of unstyled content

### Bundle Size
- Core theming system adds ~15KB to bundle
- Google Fonts are loaded dynamically as needed
- Tree shaking eliminates unused theme utilities

## Troubleshooting

### Common Issues

**Theme not applying**
- Check if ThemeProvider wraps your app
- Verify organization context is loaded
- Check browser console for CSS variable errors

**Colors not changing**
- Ensure you're using CSS custom properties or theme classes
- Check if styles are being overridden by specificity
- Verify theme data is valid in database

**Fonts not loading**
- Check network tab for Google Fonts requests
- Verify font family names are correct
- Ensure fallback fonts are specified

**Preview mode stuck**
- Clear localStorage: `localStorage.clear()`
- Check for JavaScript errors in console
- Refresh page to reset theme state

### Debug Mode

Enable debug information in development:

```javascript
// In your component
const { theme } = useTheme()
console.log('Current theme:', theme)
```

Or use the built-in debug panel (appears in development mode in bottom-left corner).

## Security

### Input Validation
- All color values are validated for XSS prevention
- URLs are validated and sanitized
- File uploads are restricted by type and size

### Access Control
- Theme modification requires organization admin role
- API endpoints verify organization membership
- Row-level security enforced in database

### Content Security Policy
Ensure your CSP allows:
```
font-src https://fonts.gstatic.com;
style-src https://fonts.googleapis.com;
```

## Browser Support

- **Modern Browsers**: Full support (Chrome 88+, Firefox 85+, Safari 14+)
- **CSS Custom Properties**: Required (98%+ browser support)
- **CSS Grid/Flexbox**: Used for layout components
- **Graceful Degradation**: Falls back to default theme if features unsupported

## Migration Guide

### From Static Themes

1. **Identify Hard-Coded Colors**
   ```bash
   # Find hard-coded hex colors
   grep -r "#[0-9a-f]{6}" components/
   ```

2. **Replace with CSS Variables**
   ```css
   /* Before */
   .button { background-color: #4299e1; }
   
   /* After */
   .button { background-color: var(--color-primary); }
   ```

3. **Update Component Props**
   ```jsx
   // Before
   <Button color="#4299e1" />
   
   // After  
   <Button className="bg-theme-primary" />
   ```

### Database Migration

If you have existing organizations:

```sql
-- Add branding column
ALTER TABLE organizations 
ADD COLUMN branding JSONB DEFAULT '{
  "primaryColor": null,
  "secondaryColor": null, 
  "logoUrl": null,
  "faviconUrl": null,
  "customDomain": null
}';

-- Migrate existing data if needed
UPDATE organizations 
SET branding = jsonb_build_object(
  'primaryColor', legacy_primary_color,
  'logoUrl', legacy_logo_url
)
WHERE legacy_primary_color IS NOT NULL;
```

---

This theming system provides a complete white-label solution for ProcessAudit AI, enabling organizations to create fully branded experiences while maintaining a consistent, accessible, and performant user interface.