import { useState } from 'react'
import { SignIn, SignUp, UserButton } from '@clerk/nextjs'
import { X } from 'lucide-react'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'

const ClerkAuthModal = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const [mode, setMode] = useState(defaultMode) // 'signin' or 'signup'
  const { authSystem, isConfigured } = useUnifiedAuth()
  
  // Only render if Clerk authentication is enabled
  if (authSystem !== 'clerk' || !isConfigured) {
    return null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center p-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600">
            {mode === 'signin' 
              ? 'Sign in to save and manage your process audits' 
              : 'Join ProcessAudit AI to save your reports and track progress'
            }
          </p>
        </div>

        {/* Auth Component */}
        <div className="px-6 pb-6">
          {mode === 'signin' ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 bg-transparent',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'w-full mb-3',
                  formButtonPrimary: 'w-full bg-blue-600 hover:bg-blue-700',
                  formFieldInput: 'w-full',
                  footerAction: 'hidden', // Hide default footer to use custom one
                },
              }}
              redirectUrl="/dashboard"
              afterSignInUrl="/dashboard"
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 bg-transparent',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'w-full mb-3',
                  formButtonPrimary: 'w-full bg-blue-600 hover:bg-blue-700',
                  formFieldInput: 'w-full',
                  footerAction: 'hidden', // Hide default footer to use custom one
                },
              }}
              redirectUrl="/onboarding"
              afterSignUpUrl="/onboarding"
            />
          )}
        </div>

        {/* Mode Switching */}
        <div className="px-6 pb-6 text-center text-sm border-t border-gray-200 pt-6">
          {mode === 'signin' ? (
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
              <p className="text-gray-500 text-sm">
                Or{' '}
                <button
                  onClick={() => {
                    onClose()
                    window.location.href = '/?access=granted'
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  try demo mode
                </button>
                {' '}without signing up
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// User menu component for Clerk
export const ClerkUserMenu = ({ className = '' }) => {
  const { authSystem, isConfigured, isSignedIn } = useUnifiedAuth()
  
  if (authSystem !== 'clerk' || !isConfigured || !isSignedIn) {
    return null
  }

  return (
    <div className={className}>
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: 'w-8 h-8',
            userButtonPopoverCard: 'border border-gray-200 shadow-lg',
          },
        }}
        showName={false}
        afterSignOutUrl="/"
      />
    </div>
  )
}

export default ClerkAuthModal