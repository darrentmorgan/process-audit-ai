/**
 * Jest Configuration for Monitoring Infrastructure Tests
 * ProcessAudit AI - Comprehensive Test Suite
 */

module.exports = {
  displayName: 'Monitoring Infrastructure Tests',

  // Test file patterns
  testMatch: [
    '**/__tests__/monitoring/**/*.test.js'
  ],

  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.monitoring.js'],

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1'
  },

  // Coverage configuration
  collectCoverageFrom: [
    'pages/api/health/**/*.js',
    'pages/api/monitoring/**/*.js',
    'utils/monitoring/**/*.js',
    'utils/logger.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!**/node_modules/**',
    '!**/.next/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 75,
      statements: 75
    },
    // Specific thresholds for critical files
    'pages/api/health/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    },
    'utils/monitoring/': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    }
  },

  // Coverage reporting
  coverageDirectory: 'coverage/monitoring',
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Test timeout for performance tests
  testTimeout: 30000, // 30 seconds for performance tests

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react'
      ],
      plugins: [
        '@babel/plugin-transform-runtime'
      ]
    }]
  },

  // Verbose output for debugging
  verbose: false,

  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',

  // Global setup for monitoring tests
  globalSetup: '<rootDir>/jest.global-setup.monitoring.js',
  globalTeardown: '<rootDir>/jest.global-teardown.monitoring.js',

  // Performance test specific configuration
  maxWorkers: process.env.CI ? 2 : '50%',

  // Error handling
  bail: process.env.CI ? 1 : 0,

  // Test execution order
  testSequencer: '<rootDir>/jest.test-sequencer.js'
};