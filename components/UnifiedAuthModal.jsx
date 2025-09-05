import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'
import ClerkAuthModal from './ClerkAuthModal'

const UnifiedAuthModal = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { authSystem } = useUnifiedAuth()
  
  // Use ClerkAuthModal (Clerk-only system now)
  return (
    <ClerkAuthModal
      isOpen={isOpen}
      onClose={onClose}
      defaultMode={defaultMode}
    />
  )
}

export default UnifiedAuthModal