import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProcessAuditApp from '../components/ProcessAuditApp'
import LandingPage from '../components/LandingPage'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const [showApp, setShowApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user has access via URL parameter or is authenticated
    const hasAccess = router.query.access === 'granted' || user
    
    setShowApp(hasAccess)
    setIsLoading(false)
  }, [router.query.access, user])

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

  // Show the app if user has access
  if (showApp) {
    return <ProcessAuditApp isDemoMode={isDemoMode} />
  }

  // Show landing page by default
  return <LandingPage onSignUp={handleSignUp} />
}