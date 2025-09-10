// Jest setup file for ProcessAudit AI
// This file runs before each test file

import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    store: {},
    getItem: function(key) {
      return this.store[key] || null
    },
    setItem: function(key, value) {
      this.store[key] = String(value)
    },
    removeItem: function(key) {
      delete this.store[key]
    },
    clear: function() {
      this.store = {}
    },
  },
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: {
    store: {},
    getItem: function(key) {
      return this.store[key] || null
    },
    setItem: function(key, value) {
      this.store[key] = String(value)
    },
    removeItem: function(key) {
      delete this.store[key]
    },
    clear: function() {
      this.store = {}
    },
  },
})

// Mock URL constructor
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

// Mock File and FileList for file upload testing
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0)
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
  }
}

global.FileList = class MockFileList extends Array {
  item(index) {
    return this[index] || null
  }
}

// Mock crypto for generating random IDs in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  },
})

// Mock fetch if not already mocked
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
      text: () => Promise.resolve(''),
    })
  )
}

// Mock @react-pdf/renderer for testing
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }) => children,
  Page: ({ children }) => children,
  View: ({ children }) => children,
  Text: ({ children }) => children,
  Image: () => 'Image',
  StyleSheet: {
    create: (styles) => styles
  },
  Font: {
    register: jest.fn()
  },
  renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-data'))
}))

// Mock PDFKit for testing
jest.mock('pdfkit', () => {
  const EventEmitter = require('events')
  
  class MockPDFDocument extends EventEmitter {
    constructor() {
      super()
      this.x = 0
      this.y = 0
    }
    
    fontSize(size) { return this }
    text(text, x, y) { return this }
    end() { 
      setTimeout(() => this.emit('end'), 10)
      return this 
    }
  }
  
  return MockPDFDocument
})

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

console.error = (...args) => {
  // Suppress specific known warnings/errors
  const message = args[0]
  if (
    typeof message === 'string' && 
    (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: An invalid form control') ||
      message.includes('Not implemented: HTMLCanvasElement.prototype.getContext')
    )
  ) {
    return
  }
  originalError.call(console, ...args)
}

console.warn = (...args) => {
  const message = args[0]
  if (
    typeof message === 'string' && 
    (
      message.includes('componentWillReceiveProps has been renamed') ||
      message.includes('componentWillUpdate has been renamed')
    )
  ) {
    return
  }
  originalWarn.call(console, ...args)
}

// Extend expect with custom matchers for organization testing
expect.extend({
  toBeValidOrganizationSlug(received) {
    const pass = /^[a-z0-9-_]+$/.test(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid organization slug`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid organization slug (lowercase letters, numbers, hyphens, underscores only)`,
        pass: false,
      }
    }
  },
  
  toBeValidEmail(received) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email address`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid email address`,
        pass: false,
      }
    }
  },
  
  toHaveOrganizationRole(received, expectedRole) {
    const validRoles = ['admin', 'member', 'guest']
    if (!validRoles.includes(expectedRole)) {
      throw new Error(`Invalid role: ${expectedRole}. Must be one of: ${validRoles.join(', ')}`)
    }
    
    const pass = received && received.role === expectedRole
    if (pass) {
      return {
        message: () => `expected membership not to have role ${expectedRole}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected membership to have role ${expectedRole}, but got ${received?.role}`,
        pass: false,
      }
    }
  },
})

// Global test helpers
global.testHelpers = {
  // Create mock organization
  createMockOrganization: (overrides = {}) => ({
    id: 'org_test123',
    slug: 'test-org',
    name: 'Test Organization',
    description: 'A test organization',
    imageUrl: '',
    publicMetadata: {
      description: 'A test organization',
      website: 'https://test.com',
      industry: 'technology',
    },
    privateMetadata: {
      plan: 'free',
      features: {
        enableAutomations: true,
        enableReporting: true,
        enableIntegrations: false,
        enableAnalytics: false,
        maxProjects: 5,
        maxMembers: 5,
      },
      security: {
        requireTwoFactor: false,
        allowGuestAccess: true,
        sessionTimeout: 24,
      },
      notifications: {
        emailNotifications: true,
      },
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    membersCount: 1,
    maxMembers: 5,
    ...overrides,
  }),
  
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'user_test123',
    firstName: 'John',
    lastName: 'Doe',
    emailAddresses: [{ emailAddress: 'john@test.com' }],
    imageUrl: '',
    ...overrides,
  }),
  
  // Create mock membership
  createMockMembership: (overrides = {}) => ({
    id: 'membership_test123',
    organization: global.testHelpers.createMockOrganization(),
    user: global.testHelpers.createMockUser(),
    role: 'member',
    permissions: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }),
  
  // Wait for async operations
  waitFor: (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const check = () => {
        try {
          const result = callback()
          if (result) {
            resolve(result)
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for condition'))
          } else {
            setTimeout(check, 10)
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error)
          } else {
            setTimeout(check, 10)
          }
        }
      }
      check()
    })
  },
}

// Setup error boundaries for testing
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('The above error occurred in the <') &&
      args[0].includes('Consider adding an error boundary')
    ) {
      return
    }
    originalConsoleError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})