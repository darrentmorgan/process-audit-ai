import { useState } from 'react'
import { useRouter } from 'next/router'
import { User, LogOut, Settings, Save, ChevronDown, Database, Building2, Users } from 'lucide-react'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'
import { ClerkUserMenu } from './ClerkAuthModal'
import OrganizationSwitcher from './OrganizationSwitcher'

const UserMenu = ({ onOpenAuth, onOpenSavedReports, onOpenCleanup }) => {
  const { 
    user, 
    signOut, 
    isConfigured, 
    authSystem,
    isSignedIn,
    organization,
    isOrgAdmin,
    orgContext,
    availableOrganizations
  } = useUnifiedAuth()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      setIsOpen(false)
      
      if (!result?.error) {
        await router.push('/')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // If Supabase is not configured, show a disabled state
  if (!isConfigured) {
    return (
      <div className="text-sm text-blue-200">
        <span className="opacity-75">Auth not configured</span>
      </div>
    )
  }

  // If using Clerk authentication, use Clerk components
  if (authSystem === 'clerk') {
    return (
      <div className="flex items-center space-x-3">
        {/* Organization Switcher (only show when signed in) */}
        {isSignedIn && <OrganizationSwitcher />}
        
        {/* User Menu or Auth Buttons */}
        {isSignedIn ? (
          <ClerkUserMenu />
        ) : (
          <>
            <button
              onClick={() => onOpenAuth('signin')}
              className="text-white hover:text-blue-100 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    )
  }
  
  // If user is not logged in, show auth buttons
  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onOpenAuth('signin')}
          className="text-white hover:text-blue-100 transition-colors font-medium"
        >
          Sign In
        </button>
        <button
          onClick={() => onOpenAuth('signup')}
          className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          Sign Up
        </button>
      </div>
    )
  }

  // User is logged in - show user menu
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors"
      >
        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <span className="font-medium">
          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
              
              {/* Organization context info */}
              {organization && (
                <div className="flex items-center mt-2 text-xs text-gray-600">
                  <Building2 className="w-3 h-3 mr-1" />
                  <span className="truncate">{organization.name}</span>
                  {isOrgAdmin && (
                    <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Admin
                    </span>
                  )}
                </div>
              )}
              
              {/* Organization context type indicator */}
              {orgContext && (
                <div className="mt-1 text-xs text-gray-500">
                  {orgContext.type === 'domain' && (
                    <span>📡 Domain: {orgContext.domain}</span>
                  )}
                  {orgContext.type === 'path' && (
                    <span>🔗 Path: /org/{orgContext.identifier}</span>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Open profile modal or navigate to profile page
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Profile Settings
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false)
                onOpenSavedReports && onOpenSavedReports()
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-3" />
              Saved Reports
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false)
                onOpenCleanup && onOpenCleanup()
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Database className="w-4 h-4 mr-3" />
              Database Cleanup
            </button>
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSignOut()
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserMenu