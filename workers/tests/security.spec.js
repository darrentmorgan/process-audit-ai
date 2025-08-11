import { describe, it, expect } from 'vitest'
import { validateN8nWorkflow } from '../src/generators/n8n.js'

function wfWithParams(parameters) {
  return {
    name: 'Secrets Test',
    nodes: [
      {
        id: 'node-http-1',
        name: 'HTTP - Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [300, 300],
        parameters
      }
    ],
    connections: {},
    active: false,
    settings: {},
    versionId: '1'
  }
}

describe('Secret scanning', () => {
  it('flags obvious bearer tokens', () => {
    const wf = wfWithParams({ headerParametersJson: JSON.stringify({ Authorization: 'Bearer abcdefghijklmnopqrstuvwxyz012345' }) })
    const res = validateN8nWorkflow(wf)
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/secret/i)
  })

  it('accepts placeholders', () => {
    const wf = wfWithParams({ headerParametersJson: JSON.stringify({ Authorization: 'Bearer {{API_TOKEN}}' }) })
    // Needs an outgoing connection to satisfy terminal rule
    wf.connections = { 'HTTP - Request': { main: [[{ node: 'Next', type: 'main', index: 0 }]] } }
    wf.nodes.push({ id: 'node-next', name: 'Next', type: 'n8n-nodes-base.set', typeVersion: 1, position: [500, 300], parameters: {} })
    const res = validateN8nWorkflow(wf)
    expect(res.valid).toBe(true)
  })
})
