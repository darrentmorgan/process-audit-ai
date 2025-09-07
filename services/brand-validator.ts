import { 
  ClientBrandPackage, 
  BrandValidationResult,
  ClientBrandEditorConfig 
} from '../types/client-branding'

const COLOR_REGEX = /^#([0-9A-F]{3}){1,2}$/i
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/

export const validateColor = (color: string): boolean => {
  return COLOR_REGEX.test(color)
}

export const validateUrl = (url: string): boolean => {
  return URL_REGEX.test(url)
}

export const validateBrandConfiguration = (
  config: ClientBrandPackage, 
  editorConfig: ClientBrandEditorConfig
): BrandValidationResult => {
  const errors: BrandValidationResult['errors'] = []

  // Validate organization details
  if (!config.organization.id) {
    errors.push({
      field: 'organization',
      message: 'Organization ID is required'
    })
  }

  // Validate colors
  const { colors } = config
  const colorFields: (keyof typeof colors)[] = [
    'primaryColor', 
    'secondaryColor'
  ]

  colorFields.forEach(field => {
    const color = colors[field]
    if (!color || !validateColor(color)) {
      errors.push({
        field: `colors.${field}`,
        message: `Invalid ${field} color value`
      })
    }
  })

  // Validate assets (optional but must be valid if provided)
  const { assets } = config
  const assetFields: (keyof typeof assets)[] = [
    'logoUrl', 
    'faviconUrl', 
    'heroImageUrl'
  ]

  assetFields.forEach(field => {
    const url = assets[field]
    if (url && !validateUrl(url)) {
      errors.push({
        field: `assets.${field}`,
        message: `Invalid ${field} URL`
      })
    }
  })

  // Validate deployment configuration
  if (!config.deployment.primaryDomain) {
    errors.push({
      field: 'deployment.primaryDomain',
      message: 'Primary domain is required'
    })
  }

  // Validate branding level
  const validBrandingLevels = ['basic', 'full', 'white-label']
  if (!validBrandingLevels.includes(config.brandingLevel)) {
    errors.push({
      field: 'brandingLevel',
      message: 'Invalid branding level'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const sanitizeBrandConfiguration = (
  config: Partial<ClientBrandPackage>
): ClientBrandPackage => {
  // Implement sanitization logic similar to organization settings
  return {
    ...config,
    colors: {
      primaryColor: config.colors?.primaryColor || '#4299e1',
      secondaryColor: config.colors?.secondaryColor || '#38a169'
    },
    deployment: {
      routingType: config.deployment?.routingType || 'subdomain',
      primaryDomain: config.deployment?.primaryDomain || '',
      sslRequired: config.deployment?.sslRequired ?? true
    },
    brandingLevel: config.brandingLevel || 'basic',
    createdAt: config.createdAt || new Date(),
    updatedAt: new Date()
  } as ClientBrandPackage
}

// Expose validation configuration
export const CLIENT_BRAND_VALIDATION_CONFIG: ClientBrandEditorConfig = {
  allowedFileTypes: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
  maxLogoSize: 5 * 1024 * 1024, // 5MB
  colorValidation: {
    minContrast: 4.5,
    allowCustom: true
  }
}