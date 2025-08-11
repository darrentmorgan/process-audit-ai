import { describe, it, expect } from 'vitest'
import { validateN8nWorkflow } from '../src/generators/n8n.js'

function wf(nodes, connections) {
  return { name: 'Email Policy', nodes, connections, active: false, settings: {}, versionId: '1' }
}

describe('Email terminal policy', () => {
  it('flags terminal email nodes unless explicitly allowed', () => {
    const email = { id: 'node-email', name: 'Email - Send', type: 'n8n-nodes-base.emailSend', typeVersion: 1, position: [300,300], parameters: { to: '{{to}}', subject: 'x', text: 'y' } }
    const res = validateN8nWorkflow(wf([email], {}))
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/email node is terminal/i)
  })

  it('permits terminal email nodes when parameters.terminal=true', () => {
    const email = { id: 'node-email', name: 'Email - Send', type: 'n8n-nodes-base.emailSend', typeVersion: 1, position: [300,300], parameters: { to: '{{to}}', subject: 'x', text: 'y', terminal: true } }
    const res = validateN8nWorkflow(wf([email], {}))
    expect(res.valid).toBe(true)
  })
})
