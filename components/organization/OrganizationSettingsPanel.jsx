import { useState, useEffect } from 'react'
import { 
  Settings,
  Palette,
  Shield,
  Bell,
  Globe,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'

/**
 * Comprehensive organization settings panel
 */
export const OrganizationSettingsPanel = ({ 
  organization, 
  userRole = 'member',
  onSettingsUpdate 
}) => {
  const [activeSection, setActiveSection] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    general: {
      name: '',
      description: '',
      website: '',
      industry: '',
    },
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#6b7280',
      logoUrl: '',
      faviconUrl: '',
      customDomain: '',
    },
    features: {
      enableAutomations: true,
      enableReporting: true,
      enableIntegrations: true,
      enableAnalytics: true,
      maxProjects: null,
      maxMembers: null,
    },
    security: {
      requireTwoFactor: false,
      allowGuestAccess: true,
      sessionTimeout: 24,
      ipWhitelist: [],
    },
    notifications: {
      emailNotifications: true,
      slackWebhook: '',
      webhookUrl: '',
    }
  })

  // Initialize settings from organization data
  useEffect(() => {
    if (organization) {
      setSettings(prev => ({
        ...prev,
        general: {
          name: organization.name || '',
          description: organization.description || '',
          website: organization.publicMetadata?.website || '',
          industry: organization.publicMetadata?.industry || '',
        },
        branding: {
          ...prev.branding,
          ...organization.privateMetadata?.branding,
        },
        features: {
          ...prev.features,
          ...organization.privateMetadata?.features,
        },
        security: {
          ...prev.security,
          ...organization.privateMetadata?.security,
        },
        notifications: {
          ...prev.notifications,
          ...organization.privateMetadata?.notifications,
        }
      }))
    }
  }, [organization])

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'features', label: 'Features', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: true },
  ]

  const visibleSections = sections.filter(section => 
    !section.adminOnly || userRole === 'admin'
  )

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
    if (error) setError(null)
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/organizations/${organization.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Settings saved successfully')
        setHasChanges(false)
        onSettingsUpdate?.(settings)
        
        // Clear success message after delay
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Settings save error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex">
      {/* Section Navigation */}
      <div className="w-56 border-r border-gray-200 p-4">
        <nav className="space-y-1">
          {visibleSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors
                  ${activeSection === section.id 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-3" />
                {section.label}
              </button>
            )
          })}
        </nav>

        {/* Save Button */}
        {hasChanges && userRole === 'admin' && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        {/* General Settings */}
        {activeSection === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.name}
                    onChange={(e) => handleSettingChange('general', 'name', e.target.value)}
                    disabled={userRole !== 'admin'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.general.description}
                    onChange={(e) => handleSettingChange('general', 'description', e.target.value)}
                    disabled={userRole !== 'admin'}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={settings.general.website}
                      onChange={(e) => handleSettingChange('general', 'website', e.target.value)}
                      disabled={userRole !== 'admin'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={settings.general.industry}
                      onChange={(e) => handleSettingChange('general', 'industry', e.target.value)}
                      disabled={userRole !== 'admin'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
              </div>
            </div>
          </div>
        )}

        {/* Branding Settings */}
        {activeSection === 'branding' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.branding.primaryColor}
                        onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                        disabled={userRole !== 'admin'}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={settings.branding.primaryColor}
                        onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                        disabled={userRole !== 'admin'}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.branding.secondaryColor}
                        onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
                        disabled={userRole !== 'admin'}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={settings.branding.secondaryColor}
                        onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
                        disabled={userRole !== 'admin'}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.branding.logoUrl}
                    onChange={(e) => handleSettingChange('branding', 'logoUrl', e.target.value)}
                    disabled={userRole !== 'admin'}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    value={settings.branding.customDomain}
                    onChange={(e) => handleSettingChange('branding', 'customDomain', e.target.value)}
                    disabled={userRole !== 'admin'}
                    placeholder="your-domain.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Connect a custom domain for branded access to your organization
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Settings */}
        {activeSection === 'features' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'enableAutomations', label: 'Process Automations', description: 'Allow members to create and manage process automations' },
                  { key: 'enableReporting', label: 'Advanced Reporting', description: 'Generate detailed process analysis reports' },
                  { key: 'enableIntegrations', label: 'Third-party Integrations', description: 'Connect with external tools and services' },
                  { key: 'enableAnalytics', label: 'Analytics Dashboard', description: 'Track organization-wide process metrics' },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">{feature.label}</div>
                      <div className="text-sm text-gray-600">{feature.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.features[feature.key]}
                        onChange={(e) => handleSettingChange('features', feature.key, e.target.checked)}
                        disabled={userRole !== 'admin'}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                    </label>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Projects (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.features.maxProjects || ''}
                      onChange={(e) => handleSettingChange('features', 'maxProjects', e.target.value ? parseInt(e.target.value) : null)}
                      disabled={userRole !== 'admin'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Members (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.features.maxMembers || ''}
                      onChange={(e) => handleSettingChange('features', 'maxMembers', e.target.value ? parseInt(e.target.value) : null)}
                      disabled={userRole !== 'admin'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeSection === 'security' && userRole === 'admin' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">Require Two-Factor Authentication</div>
                    <div className="text-sm text-gray-600">All members must enable 2FA to access the organization</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.requireTwoFactor}
                      onChange={(e) => handleSettingChange('security', 'requireTwoFactor', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">Allow Guest Access</div>
                    <div className="text-sm text-gray-600">External users can be invited as guests with limited permissions</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.allowGuestAccess}
                      onChange={(e) => handleSettingChange('security', 'allowGuestAccess', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeSection === 'notifications' && userRole === 'admin' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Send email notifications for important organization events</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slack Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settings.notifications.slackWebhook}
                    onChange={(e) => handleSettingChange('notifications', 'slackWebhook', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Send organization notifications to a Slack channel
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settings.notifications.webhookUrl}
                    onChange={(e) => handleSettingChange('notifications', 'webhookUrl', e.target.value)}
                    placeholder="https://your-api.com/webhooks/processaudit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Receive webhook notifications for organization events
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Read-only message for non-admin users */}
        {userRole !== 'admin' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-700">
                You have read-only access to organization settings. Contact an admin to make changes.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationSettingsPanel