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
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Test suites configuration
  projects: [
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
      testEnvironment: 'node',
      timeout: 30000
    },
    {
      displayName: 'Security Tests',
      testMatch: ['<rootDir>/__tests__/integration/security/**/*.test.js'],
      testEnvironment: 'node',
      timeout: 20000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/__tests__/integration/performance/**/*.test.js'],
      testEnvironment: 'node',
      timeout: 60000
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
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}',
    'contexts/**/*.{js,jsx}',
    'utils/**/*.{js,jsx}',
    'hooks/**/*.{js,jsx}',
    'middleware.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/jest.setup.js',
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
  testTimeout: 10000,
  
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