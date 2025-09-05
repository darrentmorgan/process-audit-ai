import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProcessAuditApp from '../components/ProcessAuditApp'
import LandingPage from '../components/LandingPage'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'

export default function Home() {
  const [showApp, setShowApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [verificationMessage, setVerificationMessage] = useState('')
  const { user, loading } = useUnifiedAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user has access via URL parameter or is authenticated
    const hasAccess = router.query.access === 'granted' || user
    
    // Handle email verification redirect
    if (router.query.verified === 'true') {
      console.log('Email verification successful')
      setVerificationMessage('Email verified successfully! You can now sign in.')
      
      // Clean up the URL parameter after a delay
      setTimeout(() => {
        setVerificationMessage('')
        router.replace(router.pathname, undefined, { shallow: true })
      }, 5000)
    }
    
    setShowApp(hasAccess)
    setIsLoading(loading)
  }, [router.query.access, router.query.verified, user, router, loading])

  // Check if user is in demo mode (has access but not authenticated)
  const isDemoMode = router.query.access === 'granted' && !user

  const handleSignUp = async (email) => {
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Successfully added to waitlist:', email)
        // Could add analytics tracking here
      } else if (data.alreadyExists) {
        console.log('Email already on waitlist:', email)
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Show verification message if present
  const VerificationBanner = () => {
    if (!verificationMessage) return null
    
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white text-center py-3 px-4">
        <div className="max-w-4xl mx-auto">
          {verificationMessage}
        </div>
      </div>
    )
  }

  // Show the app if user has access
  if (showApp) {
    return (
      <>
        <VerificationBanner />
        <ProcessAuditApp isDemoMode={isDemoMode} />
      </>
    )
  }

  // Show landing page by default
  return (
    <>
      <VerificationBanner />
      <LandingPage onSignUp={handleSignUp} />
    </>
  )
}