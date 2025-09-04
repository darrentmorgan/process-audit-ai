// Theme utility functions for ProcessAudit AI
// Provides helper functions for theme manipulation, CSS generation, and color operations

/**
 * Generate CSS custom properties from theme object
 */
export const generateCSSVariables = (theme) => {
  const cssVars = {}
  
  // Process colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        cssVars[`--color-${key}`] = value
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          cssVars[`--color-${key}-${subKey}`] = subValue
        })
      }
    })
  }
  
  // Process typography
  if (theme.typography) {
    if (theme.typography.fontFamily) {
      cssVars['--font-family'] = theme.typography.fontFamily
    }
    
    if (theme.typography.fontSize) {
      Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
        cssVars[`--font-size-${key}`] = value
      })
    }
    
    if (theme.typography.fontWeight) {
      Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
        cssVars[`--font-weight-${key}`] = value
      })
    }
  }
  
  // Process spacing
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      cssVars[`--spacing-${key}`] = value
    })
  }
  
  // Process border radius
  if (theme.borderRadius) {
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      cssVars[`--border-radius-${key}`] = value
    })
  }
  
  // Process shadows
  if (theme.shadows) {
    Object.entries(theme.shadows).forEach(([key, value]) => {
      cssVars[`--shadow-${key}`] = value
    })
  }
  
  return cssVars
}

/**
 * Apply CSS variables to document root
 */
export const applyCSSVariables = (variables) => {
  const root = document.documentElement
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })
}

/**
 * Remove CSS variables from document root
 */
export const removeCSSVariables = (variables) => {
  const root = document.documentElement
  
  Object.keys(variables).forEach((property) => {
    root.style.removeProperty(property)
  })
}

/**
 * Color manipulation utilities
 */

// Convert hex to RGB
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Convert RGB to hex
export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Lighten a color by percentage
export const lighten = (color, percentage) => {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  
  const factor = 1 + (percentage / 100)
  return rgbToHex(
    Math.min(255, Math.floor(rgb.r * factor)),
    Math.min(255, Math.floor(rgb.g * factor)),
    Math.min(255, Math.floor(rgb.b * factor))
  )
}

// Darken a color by percentage
export const darken = (color, percentage) => {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  
  const factor = 1 - (percentage / 100)
  return rgbToHex(
    Math.max(0, Math.floor(rgb.r * factor)),
    Math.max(0, Math.floor(rgb.g * factor)),
    Math.max(0, Math.floor(rgb.b * factor))
  )
}

// Get color contrast ratio
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (color) => {
    const rgb = hexToRgb(color)
    if (!rgb) return 0
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

// Check if color meets WCAG AA contrast requirements
export const meetsContrastRequirements = (backgroundColor, textColor, largeText = false) => {
  const ratio = getContrastRatio(backgroundColor, textColor)
  return largeText ? ratio >= 3 : ratio >= 4.5
}

// Generate accessible text color for background
export const getAccessibleTextColor = (backgroundColor) => {
  const whiteContrast = getContrastRatio(backgroundColor, '#ffffff')
  const blackContrast = getContrastRatio(backgroundColor, '#000000')
  
  return whiteContrast > blackContrast ? '#ffffff' : '#000000'
}

/**
 * Theme generation utilities
 */

// Generate color palette from primary color
export const generateColorPalette = (primaryColor) => {
  return {
    primary: primaryColor,
    primaryLight: lighten(primaryColor, 20),
    primaryDark: darken(primaryColor, 20),
    secondary: lighten(primaryColor, 40),
    accent: darken(primaryColor, 30)
  }
}

// Generate semantic colors based on theme
export const generateSemanticColors = (baseColors) => {
  return {
    success: '#10b981', // Green
    warning: '#f59e0b', // Yellow
    error: '#ef4444',   // Red
    info: baseColors.primary || '#3b82f6' // Blue
  }
}

/**
 * Theme validation utilities
 */

// Validate color format
export const isValidColor = (color) => {
  if (!color || typeof color !== 'string') return false
  
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
  
  // Check CSS named colors (basic list)
  const namedColors = [
    'white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'transparent', 'currentColor'
  ]
  
  return namedColors.includes(color.toLowerCase())
}

// Validate URL
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Validate font family
export const isValidFontFamily = (fontFamily) => {
  if (!fontFamily || typeof fontFamily !== 'string') return false
  
  // Basic validation - allow common font family formats
  return fontFamily.length > 0 && fontFamily.length <= 500
}

// Validate CSS unit
export const isValidCSSUnit = (value) => {
  if (!value || typeof value !== 'string') return false
  
  // Check common CSS units
  return /^(\d+\.?\d*)(px|em|rem|%|vh|vw|vmin|vmax)$/.test(value)
}

/**
 * Theme merging utilities
 */

// Deep merge two theme objects
export const deepMergeThemes = (target, source) => {
  const output = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMergeThemes(target[key] || {}, source[key])
    } else {
      output[key] = source[key]
    }
  }
  
  return output
}

// Extract theme differences
export const getThemeDifferences = (theme1, theme2) => {
  const differences = {}
  
  const compare = (obj1, obj2, path = '') => {
    for (const key in obj2) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
        compare(obj1[key] || {}, obj2[key], currentPath)
      } else if (obj1[key] !== obj2[key]) {
        differences[currentPath] = {
          from: obj1[key],
          to: obj2[key]
        }
      }
    }
  }
  
  compare(theme1, theme2)
  return differences
}

/**
 * CSS generation utilities
 */

// Generate Tailwind-compatible CSS classes
export const generateTailwindCSS = (theme) => {
  let css = ''
  
  // Generate color utilities
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        css += `.text-theme-${key} { color: var(--color-${key}); }\n`
        css += `.bg-theme-${key} { background-color: var(--color-${key}); }\n`
        css += `.border-theme-${key} { border-color: var(--color-${key}); }\n`
      }
    })
  }
  
  return css
}

// Generate component-specific CSS
export const generateComponentCSS = (theme, componentName) => {
  const css = []
  
  switch (componentName) {
    case 'button':
      css.push(`
        .btn-theme-primary {
          background-color: var(--color-primary);
          color: ${getAccessibleTextColor(theme.colors?.primary || '#000000')};
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md) var(--spacing-lg);
          font-weight: var(--font-weight-semibold);
        }
        
        .btn-theme-primary:hover {
          background-color: ${darken(theme.colors?.primary || '#000000', 10)};
        }
      `)
      break
      
    case 'card':
      css.push(`
        .card-theme {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-md);
          padding: var(--spacing-xl);
        }
      `)
      break
  }
  
  return css.join('\n')
}

/**
 * Asset management utilities
 */

// Preload theme assets
export const preloadThemeAssets = (theme) => {
  const promises = []
  
  if (theme.assets?.logoUrl) {
    promises.push(preloadImage(theme.assets.logoUrl))
  }
  
  if (theme.assets?.faviconUrl) {
    promises.push(preloadImage(theme.assets.faviconUrl))
  }
  
  return Promise.all(promises)
}

// Preload image helper
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = reject
    img.src = src
  })
}

/**
 * Performance utilities
 */

// Debounce theme updates
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Theme change animation helper
export const animateThemeChange = (duration = 300) => {
  const style = document.createElement('style')
  style.textContent = `
    *, *::before, *::after {
      transition: color ${duration}ms ease, 
                  background-color ${duration}ms ease, 
                  border-color ${duration}ms ease,
                  box-shadow ${duration}ms ease !important;
    }
  `
  
  document.head.appendChild(style)
  
  setTimeout(() => {
    document.head.removeChild(style)
  }, duration)
}

/**
 * Export/Import utilities
 */

// Export theme as CSS
export const exportThemeAsCSS = (theme) => {
  const variables = generateCSSVariables(theme)
  
  let css = ':root {\n'
  Object.entries(variables).forEach(([property, value]) => {
    css += `  ${property}: ${value};\n`
  })
  css += '}\n\n'
  
  // Add component styles
  css += generateTailwindCSS(theme)
  
  return css
}

// Export theme as JSON
export const exportThemeAsJSON = (theme) => {
  return JSON.stringify(theme, null, 2)
}

// Import and validate theme
export const importTheme = (themeData, format = 'json') => {
  if (format === 'json') {
    try {
      const theme = typeof themeData === 'string' ? JSON.parse(themeData) : themeData
      return { theme, errors: validateThemeStructure(theme) }
    } catch (error) {
      return { theme: null, errors: ['Invalid JSON format'] }
    }
  }
  
  return { theme: null, errors: ['Unsupported format'] }
}

// Validate theme structure
const validateThemeStructure = (theme) => {
  const errors = []
  
  if (!theme || typeof theme !== 'object') {
    errors.push('Theme must be an object')
    return errors
  }
  
  // Validate colors
  if (theme.colors) {
    if (typeof theme.colors !== 'object') {
      errors.push('Theme colors must be an object')
    } else {
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value === 'string' && !isValidColor(value)) {
          errors.push(`Invalid color value for ${key}: ${value}`)
        }
      })
    }
  }
  
  // Validate assets
  if (theme.assets) {
    if (theme.assets.logoUrl && !isValidUrl(theme.assets.logoUrl)) {
      errors.push('Invalid logo URL')
    }
    if (theme.assets.faviconUrl && !isValidUrl(theme.assets.faviconUrl)) {
      errors.push('Invalid favicon URL')
    }
  }
  
  // Validate typography
  if (theme.typography?.fontFamily && !isValidFontFamily(theme.typography.fontFamily)) {
    errors.push('Invalid font family')
  }
  
  return errors
}