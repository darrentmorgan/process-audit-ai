import { describe, it, expect } from 'vitest'
import { validateN8nWorkflow } from '../src/generators/n8n.js'

function minimalWorkflow(nodes = [], connections = {}) {
  return {
    name: 'Test',
    nodes,
    connections,
    active: false,
    settings: {},
    versionId: '1'
  }
}

describe('Validator policy checks', () => {
  it('flags terminal HTTP nodes with no outgoing connections', () => {
    const httpNode = {
      id: 'node-http-1',
      name: 'HTTP - Request',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [300, 300],
      parameters: { url: '{{API_URL}}', method: 'POST' }
    }

    const wf = minimalWorkflow([httpNode], {})
    const res = validateN8nWorkflow(wf)
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/terminal/i)
  })
})
