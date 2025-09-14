const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Specify the test environment
  testEnvironment: 'jest-environment-jsdom',

  // Transform ignore patterns - allow ES modules to be transformed
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@supabase|@clerk|lucide-react|@sparticuz/chromium|isows)/)',
  ],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Test suites configuration
  projects: [
    {
      displayName: 'General Tests',
      testMatch: ['<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'Comprehensive Auth Tests',
      testMatch: ['<rootDir>/__tests__/comprehensive/auth/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.comprehensive.js']
    },
    {
      displayName: 'Comprehensive AI Tests',
      testMatch: ['<rootDir>/__tests__/comprehensive/ai/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.comprehensive.js']
    },
    {
      displayName: 'Comprehensive Integration Tests',
      testMatch: ['<rootDir>/__tests__/comprehensive/integrations/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.comprehensive.js']
    },
    {
      displayName: 'Comprehensive Multi-Tenant Tests',
      testMatch: ['<rootDir>/__tests__/comprehensive/multitenant/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.comprehensive.js']
    },
    {
      displayName: 'Auth Unit Tests',
      testMatch: ['<rootDir>/__tests__/contexts/**/*.(js|jsx)', '<rootDir>/__tests__/types/**/*.(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'Auth Integration Tests',
      testMatch: ['<rootDir>/__tests__/auth/**/*.(js|jsx)', '<rootDir>/__tests__/components/**/*.(js|jsx)'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'Organization Tests',
      testMatch: ['<rootDir>/__tests__/organization/**/*.(js|jsx)'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'Multi-Tenant Integration',
      testMatch: ['<rootDir>/__tests__/multitenant/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Security Tests',
      testMatch: ['<rootDir>/__tests__/integration/security/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/__tests__/integration/performance/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'PDF Generation Tests',
      testMatch: ['<rootDir>/__tests__/services/pdf/**/*.(test|spec).(js|jsx|ts|tsx)', '<rootDir>/__tests__/services/sop/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Mobile Optimization Tests',
      testMatch: ['<rootDir>/__tests__/mobile/**/*.test.js'],
      testEnvironment: 'jsdom'
    }
  ],
  
  // Module name mapping for absolute imports and aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest'],
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'pages/api/**/*.{js,jsx}',
    'utils/**/*.{js,jsx}',
    'hooks/**/*.{js,jsx}',
    'middleware.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/jest.setup.js',
    // Temporarily exclude JSX components due to parser issues
    '!components/**/*.jsx',
    '!pages/**/*.jsx',
    '!contexts/**/*.jsx',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Specific thresholds for organization features
    'components/organization/**/*.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'pages/api/organizations/**/*.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Multi-tenant specific thresholds
    'pages/api/audit-reports/**/*.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'pages/api/automations/**/*.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'middleware.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Setup files
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Verbose output for debugging
  verbose: false,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/out/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Global test timeout
  testTimeout: 15000, // Increased for comprehensive tests
  
  // Reporters for test results
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)