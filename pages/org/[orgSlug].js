import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Head from 'next/head'

// Mock organization data for demonstration
const DEMO_ORGANIZATIONS = {
  'acme-corp': {
    id: 'org-acme-001',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    plan: 'enterprise',
    branding: {
      primaryColor: '#ff6b35',
      secondaryColor: '#004e89',
      logoUrl: null,
      customDomain: 'acme-corp.processaudit.ai'
    },
    description: 'Enterprise automation solutions for manufacturing'
  },
  'startup-inc': {
    id: 'org-startup-001', 
    name: 'Startup Inc',
    slug: 'startup-inc',
    plan: 'professional',
    branding: {
      primaryColor: '#6c5ce7',
      secondaryColor: '#a29bfe',
      logoUrl: null,
      customDomain: null
    },
    description: 'Professional services automation'
  },
  'small-biz': {
    id: 'org-small-001',
    name: 'Small Business Co',
    slug: 'small-biz', 
    plan: 'free',
    branding: {
      primaryColor: '#00b894',
      secondaryColor: '#00cec9',
      logoUrl: null,
      customDomain: null
    },
    description: 'Simple automation for small teams'
  }
}

export default function OrganizationPage() {
  const router = useRouter()
  const { orgSlug } = router.query
  const { theme, updateTheme } = useTheme()
  const { organization, isOrgContextLoaded } = useUnifiedAuth()
  
  const [currentOrg, setCurrentOrg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load organization data (mock for demo)
  useEffect(() => {
    if (orgSlug && typeof orgSlug === 'string') {
      const demoOrg = DEMO_ORGANIZATIONS[orgSlug]
      if (demoOrg) {
        setCurrentOrg(demoOrg)
        
        // Apply organization theming
        if (demoOrg.branding) {
          const orgTheme = {
            colors: {
              primary: demoOrg.branding.primaryColor,
              secondary: demoOrg.branding.secondaryColor
            }
          }
          
          // Apply CSS variables immediately for demo
          const root = document.documentElement
          root.style.setProperty('--color-primary', demoOrg.branding.primaryColor)
          root.style.setProperty('--color-secondary', demoOrg.branding.secondaryColor)
        }
      }
      setIsLoading(false)
    }
  }, [orgSlug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Organization Not Found</h1>
          <p className="text-gray-600 mb-8">The organization "{orgSlug}" could not be found.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'professional': return 'bg-blue-100 text-blue-800'
      case 'free': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{currentOrg.name} - ProcessAudit AI</title>
        <meta name="description" content={currentOrg.description} />
      </Head>

      {/* Organization Header */}
      <div 
        className="bg-gradient-to-r from-primary to-secondary text-white py-16"
        style={{
          background: `linear-gradient(135deg, ${currentOrg.branding.primaryColor}, ${currentOrg.branding.secondaryColor})`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(currentOrg.plan)}`}>
                {currentOrg.plan.charAt(0).toUpperCase() + currentOrg.plan.slice(1)} Plan
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-4">{currentOrg.name}</h1>
            <p className="text-xl opacity-90 mb-8">{currentOrg.description}</p>
            <div className="text-sm opacity-75">
              Organization ID: {currentOrg.id} • Slug: /{currentOrg.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Features Demo */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Organization Info Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">🎯 Multi-Tenant Features Active</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Organization Details</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {currentOrg.name}</div>
                  <div><strong>Slug:</strong> {currentOrg.slug}</div>
                  <div><strong>Plan:</strong> {currentOrg.plan}</div>
                  <div><strong>Organization ID:</strong> {currentOrg.id}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Custom Branding</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <strong>Primary Color:</strong> 
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentOrg.branding.primaryColor }}
                    ></div>
                    <code>{currentOrg.branding.primaryColor}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Secondary Color:</strong>
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentOrg.branding.secondaryColor }}
                    ></div>
                    <code>{currentOrg.branding.secondaryColor}</code>
                  </div>
                  <div><strong>Custom Domain:</strong> {currentOrg.branding.customDomain || 'Not configured'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ProcessAudit AI Features */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your ProcessAudit AI Dashboard</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold mb-2">Process Analysis</h3>
                <p className="text-sm text-gray-600">AI-powered analysis of your business processes</p>
                <button 
                  className="mt-4 px-4 py-2 rounded font-medium text-white"
                  style={{ backgroundColor: currentOrg.branding.primaryColor }}
                  onClick={() => router.push('/?access=granted')}
                >
                  Start Analysis
                </button>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="font-semibold mb-2">Automation Generator</h3>
                <p className="text-sm text-gray-600">Generate n8n workflows automatically</p>
                <button 
                  className="mt-4 px-4 py-2 rounded font-medium text-white"
                  style={{ backgroundColor: currentOrg.branding.secondaryColor }}
                  onClick={() => router.push('/?access=granted')}
                >
                  Generate Workflows
                </button>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-semibold mb-2">ROI Calculator</h3>
                <p className="text-sm text-gray-600">Calculate return on automation investments</p>
                <button 
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700"
                  onClick={() => router.push('/?access=granted')}
                >
                  Calculate ROI
                </button>
              </div>
            </div>
          </div>

          {/* Routing Demo */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 Multi-Tenant Routing Demo</h2>
            <p className="text-gray-600 mb-6">
              Try accessing different organizations to see the dynamic theming and routing in action:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(DEMO_ORGANIZATIONS).map(([slug, org]) => (
                <div key={slug} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: org.branding.primaryColor }}
                    ></div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getPlanBadgeColor(org.plan)}`}>
                      {org.plan}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{org.description}</div>
                  <button
                    onClick={() => router.push(`/org/${slug}`)}
                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                    style={{ 
                      backgroundColor: orgSlug === slug ? org.branding.primaryColor : undefined,
                      color: orgSlug === slug ? 'white' : undefined
                    }}
                  >
                    {orgSlug === slug ? 'Current' : 'Visit'} /org/{slug}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Other Routing Options:</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Path-based:</strong> /org/{orgSlug} (current)</div>
                <div><strong>Subdomain:</strong> {orgSlug}.localhost:3000 (requires DNS setup)</div>
                <div><strong>Custom Domain:</strong> {currentOrg.branding.customDomain || 'Not configured'}</div>
                <div><strong>Main App:</strong> <a href="/" className="text-blue-600 hover:underline">processaudit.ai</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}