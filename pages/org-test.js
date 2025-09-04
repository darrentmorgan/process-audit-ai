import { useState } from 'react'
import Head from 'next/head'
import { Building2, Users, Settings, Crown } from 'lucide-react'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'
import { OrganizationInfo, CreateOrganizationButton } from '../components/OrganizationSwitcher'
import UnifiedAuthModal from '../components/UnifiedAuthModal'

// Test page for Clerk Organizations features
export default function OrganizationTestPage() {
  const { 
    authSystem, 
    isSignedIn, 
    user, 
    organization, 
    isOrgAdmin, 
    orgMemberships,
    isConfigured 
  } = useUnifiedAuth()
  
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <>
      <Head>
        <title>Organization Test - ProcessAudit AI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏢 Clerk Organizations Test Page
            </h1>
            <p className="text-gray-600">
              Test page for debugging and demonstrating Clerk Organizations functionality
            </p>
          </div>

          {/* Authentication System Status */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              System Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Authentication System</h3>
                <p className="text-2xl font-bold mt-1" style={{ 
                  color: authSystem === 'clerk' ? '#10b981' : '#3b82f6' 
                }}>
                  {authSystem === 'clerk' ? 'Clerk' : 'Supabase'}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Configuration</h3>
                <p className={`text-2xl font-bold mt-1 ${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {isConfigured ? 'Configured' : 'Not Configured'}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Sign In Status</h3>
                <p className={`text-2xl font-bold mt-1 ${isSignedIn ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isSignedIn ? 'Signed In' : 'Not Signed In'}
                </p>
              </div>
            </div>
          </div>

          {/* Authentication Section */}
          {!isSignedIn && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sign In Required
              </h2>
              <p className="text-gray-600 mb-4">
                Sign in to test organization features.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In / Sign Up
              </button>
            </div>
          )}

          {/* User Information */}
          {isSignedIn && user && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Basic Info</h3>
                  <div className="mt-2 space-y-1">
                    {authSystem === 'clerk' ? (
                      <>
                        <p><strong>Name:</strong> {user.fullName || 'Not set'}</p>
                        <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                        <p><strong>ID:</strong> {user.id}</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Name:</strong> {user.user_metadata?.full_name || 'Not set'}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>ID:</strong> {user.id}</p>
                      </>
                    )}
                  </div>
                </div>

                {authSystem === 'clerk' && (
                  <div>
                    <h3 className="font-medium text-gray-900">Account Details</h3>
                    <div className="mt-2 space-y-1">
                      <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      <p><strong>Last Sign In:</strong> {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organization Section */}
          {authSystem === 'clerk' && isSignedIn && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Organization Features
              </h2>

              {/* Current Organization */}
              {organization ? (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                    Current Organization
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <OrganizationInfo />
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><strong>ID:</strong> {organization.id}</p>
                      <p><strong>Created:</strong> {new Date(organization.createdAt).toLocaleDateString()}</p>
                      <p><strong>Members:</strong> {organization.membersCount}</p>
                      <p><strong>Your Role:</strong> {isOrgAdmin ? 'Admin' : 'Member'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">No Organization</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't joined any organizations yet. Create one to get started with team features.
                  </p>
                  <CreateOrganizationButton />
                </div>
              )}

              {/* Organization Memberships */}
              {orgMemberships && orgMemberships.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">All Organizations</h3>
                  <div className="space-y-3">
                    {orgMemberships.map((membership) => (
                      <div key={membership.id} className="border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {membership.organization.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Role: {membership.role}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Joined: {new Date(membership.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Debug Information */}
          <div className="bg-gray-800 text-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🐛 Debug Information</h2>
            <pre className="text-xs overflow-auto bg-gray-900 p-4 rounded">
{JSON.stringify({
  authSystem,
  isConfigured,
  isSignedIn: !!isSignedIn,
  hasUser: !!user,
  userId: user?.id || null,
  organizationId: organization?.id || null,
  organizationName: organization?.name || null,
  isOrgAdmin,
  orgMembershipsCount: orgMemberships?.length || 0,
  environment: {
    useClerkAuth: process.env.NEXT_PUBLIC_USE_CLERK_AUTH,
    hasClerkKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  }
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <UnifiedAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="signin"
      />
    </>
  )
}