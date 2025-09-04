// Environment setup for Jest tests
// This file runs before jest.setup.js

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing'
process.env.CLERK_SECRET_KEY = 'sk_test_mock_key_for_testing'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock Supabase environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key'
process.env.SUPABASE_SERVICE_KEY = 'mock_service_key'

// Mock AI API keys
process.env.CLAUDE_API_KEY = 'sk-ant-mock_key'
process.env.OPENAI_API_KEY = 'sk-mock_openai_key'

// Mock worker configuration
process.env.CLOUDFLARE_WORKER_URL = 'https://mock-worker.workers.dev'

// Mock MCP configuration
process.env.N8N_MCP_SERVER_URL = 'https://mock-mcp-server.railway.app'
process.env.N8N_MCP_AUTH_TOKEN = 'mock_mcp_token'