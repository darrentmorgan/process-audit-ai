import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUnifiedAuth } from './UnifiedAuthContext'
import { supabase } from '../lib/supabaseClient'

const ThemeContext = createContext({})

// Default theme configuration
const DEFAULT_THEME = {
  // Brand colors
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
  
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
  
  // Spacing and layout
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  // Border radius
  borderRadius: {
    sm: '0.125rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  
  // Brand assets
  assets: {
    logoUrl: null,
    faviconUrl: null,
    customDomain: null
  }
}

// Theme validation schema
const validateTheme = (theme) => {
  const errors = []
  
  // Validate colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string' && value && !isValidColor(value)) {
        errors.push(`Invalid color value for ${key}: ${value}`)
      }
    })
  }
  
  // Validate URLs
  if (theme.assets?.logoUrl && !isValidUrl(theme.assets.logoUrl)) {
    errors.push('Invalid logo URL')
  }
  
  if (theme.assets?.faviconUrl && !isValidUrl(theme.assets.faviconUrl)) {
    errors.push('Invalid favicon URL')
  }
  
  return errors
}

// Color validation helper
const isValidColor = (color) => {
  if (!color) return false
  
  // Check hex colors
  if (color.startsWith('#')) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }
  
  // Check rgb/rgba colors
  if (color.startsWith('rgb')) {
    return /^rgba?\((\d+,\s*\d+,\s*\d+)(,\s*(0(\.\d+)?|1))?\)$/.test(color)
  }
  
  // Check hsl/hsla colors
  if (color.startsWith('hsl')) {
    return /^hsla?\((\d+,\s*\d+%,\s*\d+%)(,\s*(0(\.\d+)?|1))?\)$/.test(color)
  }
  
  return false
}

// URL validation helper
const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Deep merge helper for theme objects
const deepMerge = (target, source) => {
  const output = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key])
    } else {
      output[key] = source[key]
    }
  }
  
  return output
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { organization, user, isOrgContextLoaded } = useUnifiedAuth()
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME)
  const [isThemeLoading, setIsThemeLoading] = useState(true)
  const [themeError, setThemeError] = useState(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewTheme, setPreviewTheme] = useState(null)

  // Load organization theme
  const loadOrganizationTheme = useCallback(async (orgId) => {
    if (!orgId) {
      setCurrentTheme(DEFAULT_THEME)
      setIsThemeLoading(false)
      return
    }

    try {
      setIsThemeLoading(true)
      setThemeError(null)

      const { data, error } = await supabase
        .from('organizations')
        .select('branding')
        .eq('id', orgId)
        .single()

      if (error) {
        console.error('Error loading organization theme:', error)
        setThemeError('Failed to load organization theme')
        setCurrentTheme(DEFAULT_THEME)
        return
      }

      if (data?.branding) {
        // Convert organization branding to theme format
        const organizationTheme = convertBrandingToTheme(data.branding)
        
        // Validate the theme
        const validationErrors = validateTheme(organizationTheme)
        if (validationErrors.length > 0) {
          console.warn('Theme validation warnings:', validationErrors)
        }
        
        // Merge with default theme to ensure all properties exist
        const mergedTheme = deepMerge(DEFAULT_THEME, organizationTheme)
        setCurrentTheme(mergedTheme)
      } else {
        setCurrentTheme(DEFAULT_THEME)
      }
    } catch (error) {
      console.error('Error loading organization theme:', error)
      setThemeError('Failed to load theme')
      setCurrentTheme(DEFAULT_THEME)
    } finally {
      setIsThemeLoading(false)
    }
  }, [])

  // Convert organization branding data to theme format
  const convertBrandingToTheme = (branding) => {
    const theme = {}
    
    if (branding.primaryColor) {
      theme.colors = {
        primary: branding.primaryColor
      }
    }
    
    if (branding.secondaryColor) {
      theme.colors = {
        ...theme.colors,
        secondary: branding.secondaryColor
      }
    }
    
    if (branding.logoUrl || branding.faviconUrl || branding.customDomain) {
      theme.assets = {
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        customDomain: branding.customDomain
      }
    }
    
    return theme
  }

  // Apply theme to CSS custom properties
  const applyCSSVariables = useCallback((theme) => {
    const root = document.documentElement
    
    // Apply color variables
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--color-${key}`, value)
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            root.style.setProperty(`--color-${key}-${subKey}`, subValue)
          })
        }
      })
    }
    
    // Apply typography variables
    if (theme.typography) {
      if (theme.typography.fontFamily) {
        root.style.setProperty('--font-family', theme.typography.fontFamily)
      }
      
      if (theme.typography.fontSize) {
        Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
          root.style.setProperty(`--font-size-${key}`, value)
        })
      }
      
      if (theme.typography.fontWeight) {
        Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
          root.style.setProperty(`--font-weight-${key}`, value)
        })
      }
    }
    
    // Apply spacing variables
    if (theme.spacing) {
      Object.entries(theme.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, value)
      })
    }
    
    // Apply border radius variables
    if (theme.borderRadius) {
      Object.entries(theme.borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--border-radius-${key}`, value)
      })
    }
    
    // Apply shadow variables
    if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--shadow-${key}`, value)
      })
    }
  }, [])

  // Handle favicon updates
  const updateFavicon = useCallback((faviconUrl) => {
    if (!faviconUrl) return
    
    // Remove existing favicons
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
    existingFavicons.forEach(favicon => favicon.remove())
    
    // Add new favicon
    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.href = faviconUrl
    favicon.type = 'image/x-icon'
    document.head.appendChild(favicon)
  }, [])

  // Load theme when organization changes
  useEffect(() => {
    if (isOrgContextLoaded) {
      loadOrganizationTheme(organization?.id)
    }
  }, [organization?.id, isOrgContextLoaded, loadOrganizationTheme])

  // Apply theme when it changes
  useEffect(() => {
    const activeTheme = isPreviewMode && previewTheme ? previewTheme : currentTheme
    applyCSSVariables(activeTheme)
    
    // Update favicon if provided
    if (activeTheme.assets?.faviconUrl) {
      updateFavicon(activeTheme.assets.faviconUrl)
    }
  }, [currentTheme, previewTheme, isPreviewMode, applyCSSVariables, updateFavicon])

  // Theme management functions
  const updateOrganizationTheme = async (themeUpdates) => {
    if (!organization?.id) {
      throw new Error('No organization context available')
    }

    try {
      // Validate theme updates
      const validationErrors = validateTheme(themeUpdates)
      if (validationErrors.length > 0) {
        throw new Error(`Theme validation failed: ${validationErrors.join(', ')}`)
      }

      // Convert theme format to branding format
      const brandingUpdate = convertThemeToBranding(themeUpdates)

      const { error } = await supabase
        .from('organizations')
        .update({ 
          branding: brandingUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)

      if (error) {
        throw new Error(`Failed to update theme: ${error.message}`)
      }

      // Reload the theme
      await loadOrganizationTheme(organization.id)
    } catch (error) {
      console.error('Error updating organization theme:', error)
      throw error
    }
  }

  // Convert theme format back to organization branding format
  const convertThemeToBranding = (theme) => {
    const branding = {}
    
    if (theme.colors?.primary) {
      branding.primaryColor = theme.colors.primary
    }
    
    if (theme.colors?.secondary) {
      branding.secondaryColor = theme.colors.secondary
    }
    
    if (theme.assets?.logoUrl) {
      branding.logoUrl = theme.assets.logoUrl
    }
    
    if (theme.assets?.faviconUrl) {
      branding.faviconUrl = theme.assets.faviconUrl
    }
    
    if (theme.assets?.customDomain) {
      branding.customDomain = theme.assets.customDomain
    }
    
    return branding
  }

  // Preview mode functions
  const startThemePreview = (theme) => {
    setPreviewTheme(deepMerge(currentTheme, theme))
    setIsPreviewMode(true)
  }

  const endThemePreview = () => {
    setIsPreviewMode(false)
    setPreviewTheme(null)
  }

  const applyPreviewTheme = async () => {
    if (previewTheme) {
      await updateOrganizationTheme(previewTheme)
      setIsPreviewMode(false)
      setPreviewTheme(null)
    }
  }

  // Theme utilities
  const getThemeValue = (path) => {
    const activeTheme = isPreviewMode && previewTheme ? previewTheme : currentTheme
    return path.split('.').reduce((obj, key) => obj?.[key], activeTheme)
  }

  const resetToDefaultTheme = async () => {
    await updateOrganizationTheme(DEFAULT_THEME)
  }

  const exportTheme = () => {
    const activeTheme = isPreviewMode && previewTheme ? previewTheme : currentTheme
    return JSON.stringify(activeTheme, null, 2)
  }

  const importTheme = async (themeJson) => {
    try {
      const importedTheme = JSON.parse(themeJson)
      const validationErrors = validateTheme(importedTheme)
      
      if (validationErrors.length > 0) {
        throw new Error(`Invalid theme: ${validationErrors.join(', ')}`)
      }
      
      await updateOrganizationTheme(importedTheme)
    } catch (error) {
      console.error('Error importing theme:', error)
      throw error
    }
  }

  const value = {
    // Theme state
    theme: isPreviewMode && previewTheme ? previewTheme : currentTheme,
    defaultTheme: DEFAULT_THEME,
    isLoading: isThemeLoading,
    error: themeError,
    
    // Preview mode
    isPreviewMode,
    previewTheme,
    
    // Theme management
    updateTheme: updateOrganizationTheme,
    reloadTheme: () => loadOrganizationTheme(organization?.id),
    resetTheme: resetToDefaultTheme,
    
    // Preview functions
    startPreview: startThemePreview,
    endPreview: endThemePreview,
    applyPreview: applyPreviewTheme,
    
    // Utilities
    getThemeValue,
    exportTheme,
    importTheme,
    validateTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export { DEFAULT_THEME }