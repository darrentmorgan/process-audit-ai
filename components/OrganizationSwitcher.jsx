import { useState } from 'react'
import React from 'react'
import { OrganizationSwitcher as ClerkOrganizationSwitcher } from '@clerk/nextjs'
import { Building2, Plus, ChevronDown, Crown, User, Eye } from 'lucide-react'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'
import OrganizationManager from './organization/OrganizationManager'

const OrganizationSwitcher = ({ 
  className = '', 
  showCreateOption = true, 
  hidePersonalAccount = false,
  onOrganizationChange 
}) => {
  const { 
    authSystem, 
    isConfigured, 
    organization, 
    availableOrganizations,
    switchOrganization,
    orgContext,
    isOrgAdmin
  } = useUnifiedAuth()
  
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  
  // Only show if Clerk authentication is enabled and configured
  if (authSystem !== 'clerk' || !isConfigured) {
    return null
  }

  const handleOrganizationSwitch = async (org) => {
    try {
      await switchOrganization(org.id)
      onOrganizationChange?.(org)
      setShowDropdown(false)
    } catch (error) {
      console.error('Failed to switch organization:', error)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown
      case 'member': return User  
      case 'guest': return Eye
      default: return User
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-purple-600'
      case 'member': return 'text-blue-600'
      case 'guest': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Custom organization switcher */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
        >
          <Building2 className="w-4 h-4" />
          <span className="max-w-32 truncate">
            {organization?.name || 'Personal Account'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown content */}
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-20">
              {/* Current organization */}
              {organization && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{organization.name}</div>
                        <div className="flex items-center text-xs text-gray-600">
                          {React.createElement(getRoleIcon(isOrgAdmin ? 'admin' : 'member'), {
                            className: `w-3 h-3 mr-1 ${getRoleColor(isOrgAdmin ? 'admin' : 'member')}`
                          })}
                          {isOrgAdmin ? 'Admin' : 'Member'}
                        </div>
                      </div>
                    </div>
                    
                    {isOrgAdmin && (
                      <button
                        onClick={() => {
                          setShowManageModal(true)
                          setShowDropdown(false)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Organization list */}
              <div className="py-2">
                <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Switch Organization
                </div>
                
                {/* Personal account option */}
                {!hidePersonalAccount && (
                  <button
                    onClick={() => handleOrganizationSwitch({ id: null })}
                    className={`
                      flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors
                      ${!organization ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
                    `}
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Personal Account</span>
                    {!organization && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>
                    )}
                  </button>
                )}

                {/* Available organizations */}
                {availableOrganizations.map((org) => {
                  const RoleIcon = getRoleIcon(org.role)
                  const isActive = organization?.id === org.id
                  
                  return (
                    <button
                      key={org.id}
                      onClick={() => handleOrganizationSwitch(org)}
                      className={`
                        flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors
                        ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
                      `}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        {org.imageUrl ? (
                          <img 
                            src={org.imageUrl} 
                            alt={org.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="truncate">{org.name}</div>
                        <div className="flex items-center text-xs text-gray-600">
                          <RoleIcon className={`w-3 h-3 mr-1 ${getRoleColor(org.role)}`} />
                          {org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Create organization option */}
              {showCreateOption && (
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(true)
                      setShowDropdown(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Create Organization</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Organization context indicator */}
        {organization && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <OrganizationManager
          mode="create"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOrganizationUpdate={(org) => {
            // Switch to newly created organization
            handleOrganizationSwitch(org)
            onOrganizationChange?.(org)
          }}
        />
      )}

      {/* Manage Organization Modal */}
      {showManageModal && organization && (
        <OrganizationManager
          organization={organization}
          mode="manage"
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          onOrganizationUpdate={(org) => {
            onOrganizationChange?.(org)
          }}
        />
      )}
    </>
  )
}

// Simplified organization info display
export const OrganizationInfo = ({ className = '' }) => {
  const { authSystem, organization, isOrgAdmin } = useUnifiedAuth()
  
  if (authSystem !== 'clerk' || !organization) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      <Building2 className="w-4 h-4" />
      <span>{organization.name}</span>
      {isOrgAdmin && (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          Admin
        </span>
      )}
    </div>
  )
}

// Create organization button
export const CreateOrganizationButton = ({ className = '' }) => {
  const { authSystem, isConfigured } = useUnifiedAuth()
  
  if (authSystem !== 'clerk' || !isConfigured) {
    return null
  }

  return (
    <button
      onClick={() => {
        // This will be handled by Clerk's navigation system
        window.location.href = '/create-organization'
      }}
      className={`
        flex items-center space-x-2 px-4 py-2 
        bg-blue-600 text-white rounded-lg 
        hover:bg-blue-700 transition-colors
        text-sm font-medium ${className}
      `}
    >
      <Plus className="w-4 h-4" />
      <span>Create Organization</span>
    </button>
  )
}

export default OrganizationSwitcher