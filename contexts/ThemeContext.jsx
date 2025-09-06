import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUnifiedAuth } from './UnifiedAuthContext'
import { supabase } from '../lib/supabase'
import { DEFAULT_THEME } from '../types/branding' // Move the default theme to the new branding types
import { 
  BrandColors, 
  BrandAssets, 
  OrganizationBranding, 
  ThemeContextType 
} from '../types/branding'

const ThemeContext = createContext({})

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

  // Validation for branding
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
    if (theme.assets?.logo?.light && !isValidUrl(theme.assets.logo.light)) {
      errors.push('Invalid light logo URL')
    }
    
    if (theme.assets?.logo?.dark && !isValidUrl(theme.assets.logo.dark)) {
      errors.push('Invalid dark logo URL')
    }
    
    if (theme.assets?.favicon && !isValidUrl(theme.assets.favicon)) {
      errors.push('Invalid favicon URL')
    }
    
    return errors
  }

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
        // Validate the theme
        const validationErrors = validateTheme(data.branding)
        if (validationErrors.length > 0) {
          console.warn('Theme validation warnings:', validationErrors)
        }
        
        // Merge with default theme to ensure all properties exist
        const mergedTheme = deepMerge(DEFAULT_THEME, data.branding)
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
      root.style.setProperty('--font-family', theme.typography.fontFamily)
      root.style.setProperty('--font-heading', theme.typography.headingFont || theme.typography.fontFamily)
      root.style.setProperty('--base-font-size', `${theme.typography.baseFontSize}px`)
      root.style.setProperty('--line-height', theme.typography.lineHeight.toString())
    }
    
    // Apply custom CSS if provided
    if (theme.customCSS) {
      const customStyleElement = document.getElementById('custom-theme-styles') || document.createElement('style')
      customStyleElement.id = 'custom-theme-styles'
      customStyleElement.textContent = theme.customCSS
      document.head.appendChild(customStyleElement)
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
    if (activeTheme.assets?.favicon) {
      updateFavicon(activeTheme.assets.favicon)
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

      const { error } = await supabase
        .from('organizations')
        .update({ 
          branding: themeUpdates,
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