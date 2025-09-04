import { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  Settings, 
  Globe, 
  X, 
  Edit2, 
  Save, 
  AlertCircle,
  Loader2,
  Crown,
  UserPlus
} from 'lucide-react'
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext'
import { OrganizationMembershipModal } from './OrganizationMembershipModal'
import { OrganizationSettingsPanel } from './OrganizationSettingsPanel'

/**
 * Comprehensive organization management component
 * Handles organization creation, editing, member management, and settings
 */
const OrganizationManager = ({ 
  organization: initialOrganization, 
  isOpen, 
  onClose, 
  onOrganizationUpdate,
  mode = 'manage' // 'create' | 'manage' | 'view'
}) => {
  const { 
    user, 
    organization: currentOrg, 
    isOrgAdmin, 
    orgMemberships,
    authSystem 
  } = useUnifiedAuth()
  
  const [organization, setOrganization] = useState(initialOrganization || null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(mode === 'create')
  
  // Modal states
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  
  // Form state for organization details
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    publicMetadata: {}
  })

  // Initialize form data when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        website: organization.publicMetadata?.website || '',
        industry: organization.publicMetadata?.industry || '',
        publicMetadata: organization.publicMetadata || {}
      })
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        website: '',
        industry: '',
        publicMetadata: {}
      })
    }
  }, [organization, mode])

  // Use current organization if none provided
  useEffect(() => {
    if (!organization && currentOrg && mode !== 'create') {
      setOrganization(currentOrg)
    }
  }, [currentOrg, organization, mode])

  const handleSaveOrganization = async () => {
    if (!formData.name.trim()) {
      setError('Organization name is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const orgData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        publicMetadata: {
          ...formData.publicMetadata,
          website: formData.website.trim(),
          industry: formData.industry.trim()
        }
      }

      let result
      if (mode === 'create') {
        // Create new organization
        result = await createOrganization(orgData)
      } else {
        // Update existing organization
        result = await updateOrganization(organization.id, orgData)
      }

      if (result.success) {
        setOrganization(result.data)
        setIsEditing(false)
        onOrganizationUpdate?.(result.data)
        
        if (mode === 'create') {
          // Redirect to the new organization or close modal
          onClose()
        }
      } else {
        setError(result.error || 'Failed to save organization')
      }
    } catch (err) {
      console.error('Organization save error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const createOrganization = async (data) => {
    // This would integrate with Clerk or your organization API
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateOrganization = async (orgId, data) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'members', label: 'Members', icon: Users, adminOnly: false },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
    { id: 'domains', label: 'Domains', icon: Globe, adminOnly: true },
  ]

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isOrgAdmin)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {mode === 'create' ? 'Create Organization' : 
                   isEditing ? 'Edit Organization' : 
                   organization?.name || 'Organization'}
                </h2>
                <p className="text-sm text-gray-600">
                  {mode === 'create' ? 'Set up your new organization' :
                   `Manage ${organization?.name || 'your organization'} details and settings`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {mode !== 'create' && !isEditing && isOrgAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  Edit
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar Navigation (only show for existing organizations) */}
            {mode !== 'create' && (
              <div className="w-56 border-r border-gray-200 p-4">
                <nav className="space-y-1">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors
                          ${activeTab === tab.id 
                            ? 'bg-blue-50 text-blue-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {tab.label}
                        {tab.adminOnly && (
                          <Crown className="w-3 h-3 ml-auto text-yellow-500" />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Overview Tab / Create Form */}
              {(activeTab === 'overview' || mode === 'create') && (
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className={`
                          w-full px-3 py-2 border rounded-lg text-sm
                          ${!isEditing 
                            ? 'border-gray-200 bg-gray-50 text-gray-900' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          }
                        `}
                        placeholder="Enter organization name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className={`
                          w-full px-3 py-2 border rounded-lg text-sm
                          ${!isEditing 
                            ? 'border-gray-200 bg-gray-50 text-gray-900' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          }
                        `}
                        placeholder="Brief description of your organization"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          disabled={!isEditing}
                          className={`
                            w-full px-3 py-2 border rounded-lg text-sm
                            ${!isEditing 
                              ? 'border-gray-200 bg-gray-50 text-gray-900' 
                              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            }
                          `}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <select
                          value={formData.industry}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                          disabled={!isEditing}
                          className={`
                            w-full px-3 py-2 border rounded-lg text-sm
                            ${!isEditing 
                              ? 'border-gray-200 bg-gray-50 text-gray-900' 
                              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            }
                          `}
                        >
                          <option value="">Select industry</option>
                          <option value="technology">Technology</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="finance">Finance</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="retail">Retail</option>
                          <option value="consulting">Consulting</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Organization Stats (for existing orgs) */}
                    {organization && !isEditing && (
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-semibold text-gray-900">
                            {organization.membersCount || 0}
                          </div>
                          <div className="text-sm text-gray-600">Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-semibold text-gray-900">
                            {organization.plan || 'Free'}
                          </div>
                          <div className="text-sm text-gray-600">Plan</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-semibold text-gray-900">
                            {organization.createdAt ? new Date(organization.createdAt).getFullYear() : '2024'}
                          </div>
                          <div className="text-sm text-gray-600">Est.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Organization Members</h3>
                    {isOrgAdmin && (
                      <button
                        onClick={() => setShowMembershipModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Member
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {orgMemberships.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
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
                            </div>
                            <div className="text-sm text-gray-600">{membership.user.emailAddress}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${membership.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : membership.role === 'member'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                            }
                          `}>
                            {membership.role}
                            {membership.role === 'admin' && <Crown className="w-3 h-3 ml-1 inline" />}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && isOrgAdmin && (
                <OrganizationSettingsPanel 
                  organization={organization}
                  userRole={isOrgAdmin ? 'admin' : 'member'}
                  onSettingsUpdate={(settings) => {
                    // Handle settings update
                    console.log('Settings updated:', settings)
                  }}
                />
              )}

              {/* Domains Tab */}
              {activeTab === 'domains' && isOrgAdmin && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Custom Domains</h3>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      <Globe className="w-4 h-4 mr-2" />
                      Add Domain
                    </button>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Custom domains coming soon</p>
                    <p className="text-sm">Connect your own domain to create a branded experience</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setError(null)
                  // Reset form data
                  if (organization) {
                    setFormData({
                      name: organization.name || '',
                      description: organization.description || '',
                      website: organization.publicMetadata?.website || '',
                      industry: organization.publicMetadata?.industry || '',
                      publicMetadata: organization.publicMetadata || {}
                    })
                  }
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrganization}
                disabled={isLoading || !formData.name.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {mode === 'create' ? 'Create Organization' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Membership Modal */}
      {showMembershipModal && organization && (
        <OrganizationMembershipModal
          organization={organization}
          isOpen={showMembershipModal}
          onClose={() => setShowMembershipModal(false)}
          onMembershipChange={() => {
            // Refresh memberships
            console.log('Membership changed - refresh data')
          }}
        />
      )}
    </>
  )
}

export default OrganizationManager