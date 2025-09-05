import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuth, useOrganization } from '@clerk/nextjs'
import { OrganizationSwitcher, CreateOrganization } from '@clerk/nextjs'
import { Building2, Users, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react'
import Logo from '../components/Logo'

export default function OrganizationRequired() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const { organization } = useOrganization()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { orgSlug } = router.query

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(router.asPath))
    }
  }, [isLoaded, userId, router])

  // Redirect if user now has the required organization
  useEffect(() => {
    if (organization && orgSlug) {
      // Check if current organization matches the required one
      if (organization.slug === orgSlug) {
        // Redirect back to where they came from
        const returnTo = router.query.returnTo || `/org/${orgSlug}`
        router.push(returnTo)
      }
    }
  }, [organization, orgSlug, router])

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-lg text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl border border-white border-opacity-30 max-w-lg w-full p-8">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Logo className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-800">ProcessAudit AI</h1>
          </div>
          
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Organization Access Required
          </h2>
          
          <p className="text-gray-600 leading-relaxed">
            {orgSlug 
              ? `You need to be a member of the "${orgSlug}" organization to access this page.`
              : 'Select an organization or create a new one to continue using ProcessAudit AI.'
            }
          </p>
        </div>

        {orgSlug ? (
          // Specific organization required
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-800">Access Restricted</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    This content is only available to members of the <strong>{orgSlug}</strong> organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Contact your organization administrator to get invited, or switch to a different organization:
              </p>
              
              <OrganizationSwitcher 
                appearance={{
                  elements: {
                    organizationSwitcherTrigger: 'w-full justify-center',
                  }
                }}
                afterSelectOrganizationUrl={`/org/${orgSlug}`}
              />

              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          // General organization selection
          <div className="space-y-6">
            <div className="text-center">
              <OrganizationSwitcher 
                appearance={{
                  elements: {
                    organizationSwitcherTrigger: 'w-full justify-center mb-4',
                  }
                }}
                afterSelectOrganizationUrl="/dashboard"
              />
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Create New Organization
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <div className="space-y-4">
                  <CreateOrganization 
                    afterCreateOrganizationUrl="/dashboard"
                    appearance={{
                      elements: {
                        card: 'shadow-none border-0',
                        headerTitle: 'text-lg font-semibold',
                      }
                    }}
                  />
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}