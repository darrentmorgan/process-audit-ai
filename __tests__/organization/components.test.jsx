/**
 * Tests for organization management components
 * ProcessAudit AI - Phase 2 Multi-Tenancy Implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock the authentication context
const mockUnifiedAuth = {
  user: {
    id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    emailAddresses: [{ emailAddress: 'john@example.com' }]
  },
  authSystem: 'clerk',
  isConfigured: true,
  isSignedIn: true,
  organization: {
    id: 'org1',
    slug: 'acme',
    name: 'Acme Corp',
    description: 'Test organization',
    publicMetadata: {},
    privateMetadata: { plan: 'professional' },
    membersCount: 5
  },
  isOrgAdmin: true,
  orgMemberships: [
    {
      id: 'membership1',
      organization: { id: 'org1', name: 'Acme Corp' },
      user: {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        imageUrl: null
      },
      role: 'admin'
    }
  ],
  availableOrganizations: [
    {
      id: 'org1',
      slug: 'acme',
      name: 'Acme Corp',
      role: 'admin'
    },
    {
      id: 'org2', 
      slug: 'techco',
      name: 'Tech Co',
      role: 'member'
    }
  ],
  switchOrganization: jest.fn(),
  orgContext: {
    type: 'domain',
    identifier: 'acme'
  }
}

jest.mock('../../../contexts/UnifiedAuthContext', () => ({
  useUnifiedAuth: () => mockUnifiedAuth
}))

// Mock fetch
global.fetch = jest.fn()

// Import components after mocking
import OrganizationManager from '../../../components/organization/OrganizationManager'
import { OrganizationMembershipModal } from '../../../components/organization/OrganizationMembershipModal'
import OrganizationSwitcher from '../../../components/OrganizationSwitcher'
import { OrganizationSettingsPanel } from '../../../components/organization/OrganizationSettingsPanel'

describe('OrganizationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  describe('Create Mode', () => {
    test('renders create organization form', () => {
      render(
        <OrganizationManager
          mode="create"
          isOpen={true}
          onClose={() => {}}
        />
      )

      expect(screen.getByText('Create Organization')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter organization name')).toBeInTheDocument()
      expect(screen.getByText('Create Organization')).toBeInTheDocument() // Button
    })

    test('validates required fields', async () => {
      const user = userEvent.setup()
      
      render(
        <OrganizationManager
          mode="create"
          isOpen={true}
          onClose={() => {}}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create organization/i })
      await user.click(submitButton)

      expect(screen.getByText('Organization name is required')).toBeInTheDocument()
    })

    test('creates organization successfully', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()
      const mockOnUpdate = jest.fn()
      
      fetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            id: 'new-org',
            name: 'New Organization',
            description: 'Test description'
          }
        })
      })

      render(
        <OrganizationManager
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onOrganizationUpdate={mockOnUpdate}
        />
      )

      // Fill form
      await user.type(
        screen.getByPlaceholderText('Enter organization name'),
        'New Organization'
      )
      await user.type(
        screen.getByPlaceholderText('Brief description of your organization'),
        'Test description'
      )

      // Submit
      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Organization',
            description: 'Test description',
            publicMetadata: {
              website: '',
              industry: ''
            }
          })
        })
      })

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          id: 'new-org',
          name: 'New Organization',
          description: 'Test description'
        })
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    test('handles creation errors', async () => {
      const user = userEvent.setup()
      
      fetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Organization name already exists'
        })
      })

      render(
        <OrganizationManager
          mode="create"
          isOpen={true}
          onClose={() => {}}
        />
      )

      await user.type(
        screen.getByPlaceholderText('Enter organization name'),
        'Existing Org'
      )
      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(screen.getByText('Organization name already exists')).toBeInTheDocument()
      })
    })
  })

  describe('Manage Mode', () => {
    test('renders organization details in view mode', () => {
      render(
        <OrganizationManager
          organization={mockUnifiedAuth.organization}
          mode="manage"
          isOpen={true}
          onClose={() => {}}
        />
      )

      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test organization')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    test('switches to edit mode when Edit button clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <OrganizationManager
          organization={mockUnifiedAuth.organization}
          mode="manage"
          isOpen={true}
          onClose={() => {}}
        />
      )

      await user.click(screen.getByText('Edit'))

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    test('navigates between tabs', async () => {
      const user = userEvent.setup()
      
      render(
        <OrganizationManager
          organization={mockUnifiedAuth.organization}
          mode="manage"
          isOpen={true}
          onClose={() => {}}
        />
      )

      // Click Members tab
      await user.click(screen.getByText('Members'))
      expect(screen.getByText('Organization Members')).toBeInTheDocument()
      expect(screen.getByText('Invite Member')).toBeInTheDocument()

      // Click Settings tab
      await user.click(screen.getByText('Settings'))
      expect(screen.getByText('General Settings')).toBeInTheDocument()
    })

    test('shows member list in Members tab', async () => {
      const user = userEvent.setup()
      
      render(
        <OrganizationManager
          organization={mockUnifiedAuth.organization}
          mode="manage"
          isOpen={true}
          onClose={() => {}}
        />
      )

      await user.click(screen.getByText('Members'))

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <OrganizationManager
          organization={mockUnifiedAuth.organization}
          mode="manage"
          isOpen={true}
          onClose={() => {}}
        />
      )

      // Tab through navigation items
      await user.tab()
      expect(screen.getByText('Overview')).toHaveFocus()

      await user.tab()
      expect(screen.getByText('Members')).toHaveFocus()

      await user.tab()
      expect(screen.getByText('Settings')).toHaveFocus()
    })

    test('provides proper ARIA labels', () => {
      render(
        <OrganizationManager
          mode="create"
          isOpen={true}
          onClose={() => {}}
        />
      )

      const nameInput = screen.getByLabelText(/organization name/i)
      expect(nameInput).toHaveAttribute('aria-required', 'true')
    })
  })
})

describe('OrganizationMembershipModal', () => {
  const mockOrganization = {
    id: 'org1',
    slug: 'acme',
    name: 'Acme Corp'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  test('renders invitation form', () => {
    render(
      <OrganizationMembershipModal
        organization={mockOrganization}
        isOpen={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Invite Team Member')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('colleague@company.com')).toBeInTheDocument()
    expect(screen.getByText('Send Invitation')).toBeInTheDocument()
  })

  test('validates email address format', async () => {
    const user = userEvent.setup()
    
    render(
      <OrganizationMembershipModal
        organization={mockOrganization}
        isOpen={true}
        onClose={() => {}}
      />
    )

    const emailInput = screen.getByPlaceholderText('colleague@company.com')
    const submitButton = screen.getByText('Send Invitation')

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
  })

  test('sends invitation successfully', async () => {
    const user = userEvent.setup()
    const mockOnClose = jest.fn()
    const mockOnMembershipChange = jest.fn()
    
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          id: 'inv1',
          emailAddress: 'john@example.com',
          role: 'member'
        }
      })
    })

    render(
      <OrganizationMembershipModal
        organization={mockOrganization}
        isOpen={true}
        onClose={mockOnClose}
        onMembershipChange={mockOnMembershipChange}
      />
    )

    // Fill form
    await user.type(
      screen.getByPlaceholderText('colleague@company.com'),
      'john@example.com'
    )
    
    // Select role
    await user.click(screen.getByLabelText(/member/i))
    
    // Add message
    await user.type(
      screen.getByPlaceholderText('Add a personal message to your invitation...'),
      'Welcome to the team!'
    )

    // Submit
    await user.click(screen.getByText('Send Invitation'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/organizations/org1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailAddress: 'john@example.com',
          role: 'member',
          message: 'Welcome to the team!',
          redirectUrl: 'http://localhost/org/acme'
        })
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Invitation sent to john@example.com')).toBeInTheDocument()
      expect(mockOnMembershipChange).toHaveBeenCalled()
    })
  })

  test('shows role descriptions', () => {
    render(
      <OrganizationMembershipModal
        organization={mockOrganization}
        isOpen={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Full access to manage organization and members')).toBeInTheDocument()
    expect(screen.getByText('Can create and manage their own projects')).toBeInTheDocument()
    expect(screen.getByText('Limited access to view shared projects')).toBeInTheDocument()
  })
})

describe('OrganizationSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders current organization', () => {
    render(<OrganizationSwitcher />)

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  test('shows organization dropdown when clicked', async () => {
    const user = userEvent.setup()
    
    render(<OrganizationSwitcher />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Switch Organization')).toBeInTheDocument()
    expect(screen.getByText('Personal Account')).toBeInTheDocument()
    expect(screen.getByText('Tech Co')).toBeInTheDocument()
    expect(screen.getByText('Create Organization')).toBeInTheDocument()
  })

  test('switches organization when item clicked', async () => {
    const user = userEvent.setup()
    const mockSwitchOrganization = jest.fn()
    
    // Override mock for this test
    mockUnifiedAuth.switchOrganization = mockSwitchOrganization
    
    render(<OrganizationSwitcher />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Tech Co'))

    expect(mockSwitchOrganization).toHaveBeenCalledWith('org2')
  })

  test('shows role indicators', async () => {
    const user = userEvent.setup()
    
    render(<OrganizationSwitcher />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  test('opens create organization modal', async () => {
    const user = userEvent.setup()
    
    render(<OrganizationSwitcher />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Create Organization'))

    expect(screen.getByText('Create Organization')).toBeInTheDocument()
  })

  test('hides personal account when hidePersonalAccount is true', async () => {
    const user = userEvent.setup()
    
    render(<OrganizationSwitcher hidePersonalAccount={true} />)

    await user.click(screen.getByRole('button'))

    expect(screen.queryByText('Personal Account')).not.toBeInTheDocument()
  })
})

describe('OrganizationSettingsPanel', () => {
  const mockOrganization = {
    id: 'org1',
    name: 'Acme Corp',
    description: 'Test organization',
    publicMetadata: {
      website: 'https://acme.com',
      industry: 'technology'
    },
    privateMetadata: {
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280'
      },
      features: {
        enableAutomations: true,
        enableReporting: true,
        maxProjects: 50
      },
      security: {
        requireTwoFactor: false,
        allowGuestAccess: true,
        sessionTimeout: 24
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  test('renders settings sections', () => {
    render(
      <OrganizationSettingsPanel
        organization={mockOrganization}
        userRole="admin"
      />
    )

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Branding')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  test('populates form with current settings', () => {
    render(
      <OrganizationSettingsPanel
        organization={mockOrganization}
        userRole="admin"
      />
    )

    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test organization')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://acme.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('technology')).toBeInTheDocument()
  })

  test('navigates between settings sections', async () => {
    const user = userEvent.setup()
    
    render(
      <OrganizationSettingsPanel
        organization={mockOrganization}
        userRole="admin"
      />
    )

    // Navigate to Branding section
    await user.click(screen.getByText('Branding'))
    expect(screen.getByText('Primary Color')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#3b82f6')).toBeInTheDocument()

    // Navigate to Features section
    await user.click(screen.getByText('Features'))
    expect(screen.getByText('Process Automations')).toBeInTheDocument()
    
    // Check feature toggles
    const automationToggle = screen.getByRole('checkbox', { name: /process automations/i })
    expect(automationToggle).toBeChecked()
  })

  test('saves settings successfully', async () => {
    const user = userEvent.setup()
    const mockOnSettingsUpdate = jest.fn()
    
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockOrganization
      })
    })

    render(
      <OrganizationSettingsPanel
        organization={mockOrganization}
        userRole="admin"
        onSettingsUpdate={mockOnSettingsUpdate}
      />
    )

    // Make a change
    const nameInput = screen.getByDisplayValue('Acme Corp')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Corp')

    // Save changes
    await user.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/organizations/org1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Updated Corp')
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully')).toBeInTheDocument()
      expect(mockOnSettingsUpdate).toHaveBeenCalled()
    })
  })

  test('shows read-only mode for non-admin users', () => {
    render(
      <OrganizationSettingsPanel
        organization={mockOrganization}
        userRole="member"
      />
    )

    expect(screen.getByText(/read-only access/i)).toBeInTheDocument()
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    
    // Fields should be disabled
    const nameInput = screen.getByDisplayValue('Acme Corp')
    expect(nameInput).toBeDisabled()
  })

  test('validates color inputs', async () => {
    const user = userEvent.setup()
    
    render(
      <OrganizationSettingsPanel
        organization={mockOrganization}
        userRole="admin"
      />
    )

    // Navigate to Branding
    await user.click(screen.getByText('Branding'))

    // Test color input
    const colorInput = screen.getByDisplayValue('#3b82f6')
    await user.clear(colorInput)
    await user.type(colorInput, '#ff0000')

    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument()
  })
})

describe('Integration Tests', () => {
  test('organization creation flow', async () => {
    const user = userEvent.setup()
    
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          id: 'new-org',
          name: 'New Org',
          slug: 'new-org'
        }
      })
    })

    render(<OrganizationSwitcher />)

    // Open switcher
    await user.click(screen.getByRole('button'))
    
    // Click create organization
    await user.click(screen.getByText('Create Organization'))
    
    // Fill and submit form
    await user.type(screen.getByPlaceholderText('Enter organization name'), 'New Org')
    await user.click(screen.getByRole('button', { name: /create organization/i }))

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/organizations', expect.objectContaining({
        method: 'POST'
      }))
    })
  })

  test('member invitation flow', async () => {
    const user = userEvent.setup()
    
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          emailAddress: 'new@example.com',
          role: 'member'
        }
      })
    })

    render(
      <OrganizationManager
        organization={mockUnifiedAuth.organization}
        mode="manage"
        isOpen={true}
        onClose={() => {}}
      />
    )

    // Navigate to Members tab
    await user.click(screen.getByText('Members'))
    
    // Click Invite Member
    await user.click(screen.getByText('Invite Member'))
    
    // Fill invitation form
    await user.type(screen.getByPlaceholderText('colleague@company.com'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /send invitation/i }))

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/organizations/org1/invitations',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})