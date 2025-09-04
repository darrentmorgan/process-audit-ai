import { useTheme } from '../../contexts/ThemeContext'
import { forwardRef } from 'react'

/**
 * Higher-Order Component that provides theme-aware styling to components
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} themeConfig - Configuration for theme application
 * @returns {React.Component} - Theme-aware component
 */
const withTheme = (WrappedComponent, themeConfig = {}) => {
  const ThemedComponent = forwardRef((props, ref) => {
    const { theme, getThemeValue } = useTheme()
    
    // Default theme configuration
    const defaultConfig = {
      applyColors: true,
      applyFonts: true,
      applySpacing: false,
      customStyles: {}
    }
    
    const config = { ...defaultConfig, ...themeConfig }
    
    // Generate theme-aware styles
    const generateThemeStyles = () => {
      let styles = {}
      
      // Apply color theming
      if (config.applyColors) {
        styles.color = getThemeValue('colors.text.primary')
        styles.backgroundColor = getThemeValue('colors.background')
      }
      
      // Apply font theming
      if (config.applyFonts) {
        styles.fontFamily = getThemeValue('typography.fontFamily')
      }
      
      // Apply spacing theming
      if (config.applySpacing) {
        styles.padding = getThemeValue('spacing.md')
        styles.margin = getThemeValue('spacing.sm')
      }
      
      // Apply custom styles with theme value interpolation
      if (config.customStyles) {
        Object.entries(config.customStyles).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('theme:')) {
            const themeKey = value.replace('theme:', '')
            styles[key] = getThemeValue(themeKey)
          } else {
            styles[key] = value
          }
        })
      }
      
      return styles
    }
    
    // Generate theme-aware CSS classes
    const generateThemeClasses = () => {
      let classes = []
      
      if (config.applyColors) {
        classes.push('text-theme-text-primary', 'bg-theme-background')
      }
      
      if (config.themeClasses) {
        classes.push(...config.themeClasses)
      }
      
      return classes.join(' ')
    }
    
    const themeStyles = generateThemeStyles()
    const themeClasses = generateThemeClasses()
    
    // Merge theme styles with existing styles
    const mergedStyles = {
      ...themeStyles,
      ...props.style
    }
    
    // Merge theme classes with existing classes
    const mergedClasses = [themeClasses, props.className]
      .filter(Boolean)
      .join(' ')
    
    // Enhanced props with theme values
    const themeProps = {
      ...props,
      style: mergedStyles,
      className: mergedClasses,
      theme,
      themeValue: getThemeValue,
      ref
    }
    
    return <WrappedComponent {...themeProps} />
  })
  
  ThemedComponent.displayName = `withTheme(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return ThemedComponent
}

/**
 * Theme-aware button component factory
 */
export const createThemedButton = (variant = 'primary') => {
  const ThemedButton = ({ children, className = '', style = {}, ...props }) => {
    const { theme } = useTheme()
    
    const variantStyles = {
      primary: {
        backgroundColor: theme.colors?.primary || '#4299e1',
        color: 'white',
        border: 'none'
      },
      secondary: {
        backgroundColor: theme.colors?.secondary || '#38a169',
        color: 'white',
        border: 'none'
      },
      outline: {
        backgroundColor: 'transparent',
        color: theme.colors?.primary || '#4299e1',
        border: `1px solid ${theme.colors?.primary || '#4299e1'}`
      },
      ghost: {
        backgroundColor: 'transparent',
        color: theme.colors?.text?.primary || '#2d3748',
        border: 'none'
      }
    }
    
    const buttonStyles = {
      ...variantStyles[variant],
      fontFamily: theme.typography?.fontFamily,
      fontWeight: theme.typography?.fontWeight?.semibold || '600',
      padding: `${theme.spacing?.md || '1rem'} ${theme.spacing?.lg || '1.5rem'}`,
      borderRadius: theme.borderRadius?.lg || '0.75rem',
      transition: 'all 150ms ease',
      cursor: 'pointer',
      ...style
    }
    
    return (
      <button
        className={`inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 ${className}`}
        style={buttonStyles}
        {...props}
      >
        {children}
      </button>
    )
  }
  
  return ThemedButton
}

/**
 * Theme-aware card component factory
 */
export const createThemedCard = () => {
  const ThemedCard = ({ children, className = '', style = {}, hover = true, ...props }) => {
    const { theme } = useTheme()
    
    const cardStyles = {
      backgroundColor: theme.colors?.surface || '#f7fafc',
      border: `1px solid ${theme.colors?.border || '#e2e8f0'}`,
      borderRadius: theme.borderRadius?.xl || '1rem',
      boxShadow: theme.shadows?.lg || '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: theme.spacing?.xl || '2rem',
      color: theme.colors?.text?.primary || '#2d3748',
      transition: 'all 150ms ease',
      ...style
    }
    
    const hoverStyles = hover ? {
      ':hover': {
        boxShadow: theme.shadows?.xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transform: 'translateY(-1px)'
      }
    } : {}
    
    return (
      <div
        className={`${className}`}
        style={{ ...cardStyles, ...hoverStyles }}
        {...props}
      >
        {children}
      </div>
    )
  }
  
  return ThemedCard
}

/**
 * Theme-aware input component factory
 */
export const createThemedInput = (type = 'text') => {
  const ThemedInput = ({ className = '', style = {}, ...props }) => {
    const { theme } = useTheme()
    
    const inputStyles = {
      width: '100%',
      padding: theme.spacing?.md || '1rem',
      border: `1px solid ${theme.colors?.border || '#e2e8f0'}`,
      borderRadius: theme.borderRadius?.lg || '0.75rem',
      backgroundColor: theme.colors?.background || '#ffffff',
      color: theme.colors?.text?.primary || '#2d3748',
      fontFamily: theme.typography?.fontFamily,
      fontSize: theme.typography?.fontSize?.base || '1rem',
      transition: 'all 150ms ease',
      outline: 'none',
      ...style
    }
    
    const focusStyles = {
      borderColor: theme.colors?.primary || '#4299e1',
      boxShadow: `0 0 0 3px rgba(66, 153, 225, 0.1)`
    }
    
    return (
      <input
        type={type}
        className={`focus:border-theme-primary focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${className}`}
        style={inputStyles}
        {...props}
      />
    )
  }
  
  return ThemedInput
}

/**
 * Theme-aware text component factory
 */
export const createThemedText = (variant = 'body') => {
  const ThemedText = ({ children, className = '', style = {}, ...props }) => {
    const { theme } = useTheme()
    
    const variantStyles = {
      heading1: {
        fontSize: theme.typography?.fontSize?.['4xl'] || '2.25rem',
        fontWeight: theme.typography?.fontWeight?.bold || '700',
        color: theme.colors?.text?.primary || '#2d3748',
        lineHeight: '1.1'
      },
      heading2: {
        fontSize: theme.typography?.fontSize?.['3xl'] || '1.875rem',
        fontWeight: theme.typography?.fontWeight?.bold || '700',
        color: theme.colors?.text?.primary || '#2d3748',
        lineHeight: '1.2'
      },
      heading3: {
        fontSize: theme.typography?.fontSize?.['2xl'] || '1.5rem',
        fontWeight: theme.typography?.fontWeight?.semibold || '600',
        color: theme.colors?.text?.primary || '#2d3748',
        lineHeight: '1.3'
      },
      body: {
        fontSize: theme.typography?.fontSize?.base || '1rem',
        fontWeight: theme.typography?.fontWeight?.normal || '400',
        color: theme.colors?.text?.secondary || '#4a5568',
        lineHeight: '1.6'
      },
      caption: {
        fontSize: theme.typography?.fontSize?.sm || '0.875rem',
        fontWeight: theme.typography?.fontWeight?.normal || '400',
        color: theme.colors?.text?.muted || '#718096',
        lineHeight: '1.4'
      }
    }
    
    const textStyles = {
      ...variantStyles[variant],
      fontFamily: theme.typography?.fontFamily,
      ...style
    }
    
    const Component = variant.startsWith('heading') ? 
      variant.replace('heading', 'h') : 'p'
    
    return React.createElement(
      Component,
      {
        className,
        style: textStyles,
        ...props
      },
      children
    )
  }
  
  return ThemedText
}

/**
 * Theme-aware utility hooks
 */
export const useThemeStyles = () => {
  const { theme, getThemeValue } = useTheme()
  
  return {
    // Color utilities
    primaryColor: getThemeValue('colors.primary'),
    secondaryColor: getThemeValue('colors.secondary'),
    backgroundColor: getThemeValue('colors.background'),
    surfaceColor: getThemeValue('colors.surface'),
    textColor: getThemeValue('colors.text.primary'),
    mutedTextColor: getThemeValue('colors.text.muted'),
    borderColor: getThemeValue('colors.border'),
    
    // Typography utilities
    fontFamily: getThemeValue('typography.fontFamily'),
    fontSize: (size) => getThemeValue(`typography.fontSize.${size}`),
    fontWeight: (weight) => getThemeValue(`typography.fontWeight.${weight}`),
    
    // Spacing utilities
    spacing: (size) => getThemeValue(`spacing.${size}`),
    
    // Border radius utilities
    borderRadius: (size) => getThemeValue(`borderRadius.${size}`),
    
    // Shadow utilities
    shadow: (size) => getThemeValue(`shadows.${size}`),
    
    // Generate CSS custom property reference
    cssVar: (path) => `var(--${path.replace(/\./g, '-')})`,
    
    // Complete theme object
    theme
  }
}

export default withTheme