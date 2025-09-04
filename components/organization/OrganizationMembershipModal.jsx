import { useState } from 'react'
import { 
  X, 
  UserPlus, 
  Mail, 
  Crown, 
  User, 
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react'
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext'

/**
 * Modal for managing organization memberships - invites, role changes, etc.
 */
export const OrganizationMembershipModal = ({ 
  organization, 
  isOpen, 
  onClose, 
  onMembershipChange,
  mode = 'invite' // 'invite' | 'manage'
}) => {
  const { user, isOrgAdmin } = useUnifiedAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    emailAddress: '',
    role: 'member',
    message: ''
  })

  const roles = [
    { 
      id: 'admin', 
      name: 'Admin', 
      description: 'Full access to manage organization and members',
      icon: Crown,
      color: 'purple'
    },
    { 
      id: 'member', 
      name: 'Member', 
      description: 'Can create and manage their own projects',
      icon: User,
      color: 'blue'
    },
    { 
      id: 'guest', 
      name: 'Guest', 
      description: 'Limited access to view shared projects',
      icon: Eye,
      color: 'gray'
    }
  ]

  const handleInviteMember = async () => {
    if (!inviteForm.emailAddress.trim()) {
      setError('Email address is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteForm.emailAddress)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/organizations/${organization.id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailAddress: inviteForm.emailAddress.trim().toLowerCase(),
          role: inviteForm.role,
          message: inviteForm.message.trim(),
          redirectUrl: `${window.location.origin}/org/${organization.slug || organization.id}`
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Invitation sent to ${inviteForm.emailAddress}`)
        setInviteForm({
          emailAddress: '',
          role: 'member',
          message: ''
        })
        onMembershipChange?.()
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch (err) {
      console.error('Invitation error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear errors when user starts typing
    if (error) setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Invite Team Member
              </h3>
              <p className="text-sm text-gray-600">
                Add someone to {organization.name}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={inviteForm.emailAddress}
                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="colleague@company.com"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Role *
            </label>
            <div className="space-y-2">
              {roles.map((role) => {
                const Icon = role.icon
                return (
                  <label
                    key={role.id}
                    className={`
                      flex items-start p-3 border rounded-lg cursor-pointer transition-colors
                      ${inviteForm.role === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={inviteForm.role === role.id}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 w-full">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${role.color === 'purple' ? 'bg-purple-100' :
                          role.color === 'blue' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }
                      `}>
                        <Icon className={`
                          w-4 h-4
                          ${role.color === 'purple' ? 'text-purple-600' :
                            role.color === 'blue' ? 'text-blue-600' :
                            'text-gray-600'
                          }
                        `} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {role.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={inviteForm.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Add a personal message to your invitation..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInviteMember}
            disabled={isLoading || !inviteForm.emailAddress.trim() || success}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : success ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {success ? 'Sent!' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Component for managing existing memberships
 */
export const OrganizationMembershipList = ({ 
  organization, 
  memberships = [], 
  currentUserId,
  onMembershipUpdate 
}) => {
  const [isUpdating, setIsUpdating] = useState(null)
  
  const handleRoleChange = async (membershipId, newRole) => {
    setIsUpdating(membershipId)
    
    try {
      const response = await fetch(
        `/api/organizations/${organization.id}/memberships/${membershipId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        }
      )
      
      if (response.ok) {
        onMembershipUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update membership:', error)
    } finally {
      setIsUpdating(null)
    }
  }
  
  const handleRemoveMember = async (membershipId) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }
    
    setIsUpdating(membershipId)
    
    try {
      const response = await fetch(
        `/api/organizations/${organization.id}/memberships/${membershipId}`,
        { method: 'DELETE' }
      )
      
      if (response.ok) {
        onMembershipUpdate?.()
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-3">
      {memberships.map((membership) => (
        <div 
          key={membership.id} 
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {membership.user.imageUrl ? (
                <img 
                  src={membership.user.imageUrl} 
                  alt={membership.user.firstName || membership.user.emailAddress}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {(membership.user.firstName?.[0] || membership.user.emailAddress[0]).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {membership.user.firstName && membership.user.lastName 
                  ? `${membership.user.firstName} ${membership.user.lastName}`
                  : membership.user.emailAddress
                }
                {membership.user.id === currentUserId && (
                  <span className="text-sm text-gray-500 ml-2">(You)</span>
                )}
              </div>
              <div className="text-sm text-gray-600">{membership.user.emailAddress}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={membership.role}
              onChange={(e) => handleRoleChange(membership.id, e.target.value)}
              disabled={isUpdating === membership.id || membership.user.id === currentUserId}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
            
            {membership.user.id !== currentUserId && (
              <button
                onClick={() => handleRemoveMember(membership.id)}
                disabled={isUpdating === membership.id}
                className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}