import { describe, it, expect } from 'vitest'

// Minimal orchestrator plan schema checks (mirrors workers/src/schemas.js fast checks)
function fastValidatePlan(plan) {
  const errors = []
  if (!plan || typeof plan !== 'object') errors.push('plan not an object')
  if (!plan.workflowName) errors.push('workflowName missing')
  if (!Array.isArray(plan.triggers) || plan.triggers.length === 0) errors.push('triggers missing')
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) errors.push('steps missing')
  return { valid: errors.length === 0, errors }
}

// Scaffolded SOP-derived input for orchestration
const SAMPLE_PROCESS = {
  title: 'Appeals Process for Suspended Listings',
  description: 'Handle Airbnb suspension appeals with standardized templates and tracking.',
  samplePayloads: {
    email: {
      subject: 'Suspension Notice: Listing 12345',
      body: 'Your listing has been suspended due to cleanliness complaints...',
      inbox: 'support@company.com'
    }
  },
  constraints: {
    slaHours: 24,
    rateLimits: { email: 'safe', http: 'safe' }
  }
}

// Example of what we expect the orchestrator to produce at minimum
const EXAMPLE_PLAN = {
  workflowName: 'Appeals Automation',
  description: 'Log suspension notice, collect docs, prepare response, notify',
  triggers: [
    { type: 'webhook', configuration: { path: 'appeals/ingest' } }
  ],
  steps: [
    { id: 'collect', name: 'Collect Docs', type: 'http', configuration: { endpoint: 'https://api.example.com/docs' } },
    { id: 'prepare', name: 'Prepare Email', type: 'transform', configuration: { template: 'Template-CLN-001' } },
    { id: 'send', name: 'Send Email', type: 'email', configuration: { to: '{{manager}}' } }
  ],
  connections: [
    { from: 'collect', to: 'prepare' },
    { from: 'prepare', to: 'send' }
  ],
  errorHandling: { strategy: 'retry-backoff', notifications: ['slack'] }
}

describe('Orchestration plan fast validation', () => {
  it('accepts a minimally valid plan', () => {
    const res = fastValidatePlan(EXAMPLE_PLAN)
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)
  })

  it('flags missing fields', () => {
    const bad = { workflowName: 'X', triggers: [], steps: [] }
    const res = fastValidatePlan(bad)
    expect(res.valid).toBe(false)
    expect(res.errors).toContain('triggers missing')
    expect(res.errors).toContain('steps missing')
  })
})

// Future: integrate against worker /submit and /validate endpoints using Miniflare if desired.
