import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import LandingPage from '../../components/LandingPage'
import { allBrandPackages, brandKeys } from '../../__tests__/fixtures/brands'

/**
 * Brand Testing Page - Development Tool
 * Test different brand configurations and see live previews
 * Access: /dev/brand-tester?brand=tech-startup
 */
export default function BrandTester() {
  const router = useRouter()
  const { brand: brandQuery } = router.query
  
  const [selectedBrand, setSelectedBrand] = useState('tech-startup')
  const [isApplied, setIsApplied] = useState(false)
  
  // Update selected brand from query param
  useEffect(() => {
    if (brandQuery && brandKeys.includes(brandQuery)) {
      setSelectedBrand(brandQuery)
    }
  }, [brandQuery])
  
  // Apply brand CSS variables
  useEffect(() => {
    if (selectedBrand && allBrandPackages[selectedBrand]) {
      const { colors, customCSS } = allBrandPackages[selectedBrand].branding
      const root = document.documentElement
      
      // Apply color variables
      root.style.setProperty('--color-primary', colors.primary)
      root.style.setProperty('--color-secondary', colors.secondary)
      root.style.setProperty('--color-accent', colors.accent)
      root.style.setProperty('--color-background', colors.background)
      root.style.setProperty('--color-text-primary', colors.text.primary)
      root.style.setProperty('--color-text-secondary', colors.text.secondary)
      
      // Apply custom CSS if exists
      let styleElement = document.getElementById('brand-custom-css')
      if (styleElement) {
        styleElement.remove()
      }
      
      if (customCSS) {
        styleElement = document.createElement('style')
        styleElement.id = 'brand-custom-css'
        styleElement.textContent = customCSS
        document.head.appendChild(styleElement)
      }
      
      setIsApplied(true)
    }
  }, [selectedBrand])
  
  const handleBrandChange = (brandKey) => {
    setSelectedBrand(brandKey)
    router.push(`/dev/brand-tester?brand=${brandKey}`, undefined, { shallow: true })
  }
  
  const currentBrandPackage = allBrandPackages[selectedBrand]
  const currentBranding = currentBrandPackage?.branding
  const currentContent = currentBrandPackage?.content
  
  return (
    <>
      <Head>
        <title>Brand Tester - {currentBranding?.name || 'ProcessAudit AI'}</title>
        <meta name="description" content="Test different brand configurations" />
      </Head>
      
      {/* Brand Testing Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-bold text-gray-900">🎨 Brand Tester</h1>
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm font-medium"
              >
                {brandKeys.map(key => {
                  const brand = allBrandPackages[key]
                  return (
                    <option key={key} value={key}>
                      {brand.branding.name} ({brand.metadata.industry})
                    </option>
                  )
                })}
              </select>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: currentBranding?.colors.primary }}
                ></div>
                <span>{currentBranding?.colors.primary}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: currentBranding?.colors.secondary }}
                ></div>
                <span>{currentBranding?.colors.secondary}</span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs"
              >
                Back to App
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Brand Preview */}
      <div className="pt-16">
        {isApplied && currentContent ? (
          <div
            style={{
              '--color-primary': currentBranding.colors.primary,
              '--color-secondary': currentBranding.colors.secondary,
              '--color-accent': currentBranding.colors.accent,
            }}
          >
            {/* Custom branded landing page preview */}
            <div className="min-h-screen" style={{ 
              background: `linear-gradient(135deg, ${currentBranding.colors.primary}, ${currentBranding.colors.secondary})`,
              fontFamily: currentBranding.typography.fontFamily 
            }}>
              
              {/* Hero Section */}
              <div className="container mx-auto px-4 py-16">
                <div className="text-center text-white">
                  <h1 
                    className="text-5xl font-bold mb-4"
                    style={{ fontFamily: currentBranding.typography.headingFont }}
                  >
                    {currentContent.hero.headline}
                  </h1>
                  <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                    {currentContent.hero.subheadline}
                  </p>
                  <button 
                    className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: currentBranding.colors.accent,
                      color: 'white'
                    }}
                  >
                    {currentContent.hero.ctaText}
                  </button>
                </div>
              </div>
              
              {/* Features Preview */}
              <div className="bg-white py-16">
                <div className="container mx-auto px-4">
                  <h2 
                    className="text-3xl font-bold text-center mb-12"
                    style={{ 
                      color: currentBranding.colors.text.primary,
                      fontFamily: currentBranding.typography.headingFont 
                    }}
                  >
                    {currentContent.features?.title}
                  </h2>
                  <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {currentContent.features?.features.map((feature, index) => (
                      <div key={index} className="text-center p-6 rounded-lg border-2" style={{
                        borderColor: currentBranding.colors.primary + '20',
                        backgroundColor: currentBranding.colors.background
                      }}>
                        <div className="text-4xl mb-4">
                          {index === 0 ? '🤖' : index === 1 ? '⚡' : '📊'}
                        </div>
                        <h3 
                          className="text-xl font-semibold mb-2"
                          style={{ color: currentBranding.colors.text.primary }}
                        >
                          {feature.title}
                        </h3>
                        <p style={{ color: currentBranding.colors.text.secondary }}>
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Brand Info Panel */}
              <div className="bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Brand Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Industry:</strong> {currentBrandPackage.metadata.industry}
                      </div>
                      <div>
                        <strong>Target Market:</strong> {currentBrandPackage.metadata.targetMarket}
                      </div>
                      <div>
                        <strong>Custom Domain:</strong> {currentBranding.customDomain}
                      </div>
                      <div>
                        <strong>Font Family:</strong> {currentBranding.typography.fontFamily.split(',')[0]}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <strong>Brand Personality:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentBrandPackage.metadata.brandPersonality.map((trait, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-4">Loading brand preview...</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// This page is for development only
export async function getServerSideProps(context) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return {
      notFound: true
    }
  }
  
  return {
    props: {}
  }
}