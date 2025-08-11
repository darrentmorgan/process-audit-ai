import { describe, it, expect } from 'vitest'
import { validateN8nWorkflow } from '../src/generators/n8n.js'

function wf(nodes, connections) {
  return { name: 'Policy', nodes, connections, active: false, settings: {}, versionId: '1' }
}

describe('HTTP and Email policy checks', () => {
  it('flags http node without retry policy', () => {
    const http = { id: 'node-http', name: 'HTTP - Request', type: 'n8n-nodes-base.httpRequest', typeVersion: 1, position: [300,300], parameters: { url: '{{API_URL}}', method: 'POST', options: { retryOnFail: false } } }
    const next = { id: 'node-next', name: 'Next', type: 'n8n-nodes-base.set', typeVersion: 1, position: [500,300], parameters: {} }
    const res = validateN8nWorkflow(wf([http, next], { 'HTTP - Request': { main: [[{ node: 'Next', type: 'main', index: 0 }]] } }))
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/retry policy/i)
  })

  it('flags email node missing required fields', () => {
    const email = { id: 'node-email', name: 'Email - Send', type: 'n8n-nodes-base.emailSend', typeVersion: 1, position: [300,300], parameters: { to: '{{to}}' } }
    const res = validateN8nWorkflow(wf([email], {}))
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/missing required fields/i)
  })
})
