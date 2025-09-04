import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'
import AuthModal from './AuthModal'
import ClerkAuthModal from './ClerkAuthModal'

const UnifiedAuthModal = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { authSystem } = useUnifiedAuth()
  
  // Route to appropriate authentication modal based on the active system
  if (authSystem === 'clerk') {
    return (
      <ClerkAuthModal
        isOpen={isOpen}
        onClose={onClose}
        defaultMode={defaultMode}
      />
    )
  }
  
  // Default to Supabase authentication
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={onClose}
      defaultMode={defaultMode}
    />
  )
}

export default UnifiedAuthModal