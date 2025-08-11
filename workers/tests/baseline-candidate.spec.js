import { describe, it, expect } from 'vitest'
import { validateN8nWorkflow } from '../src/generators/n8n.js'
import fs from 'node:fs'

function load(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function score(workflow) {
  const res = validateN8nWorkflow(workflow)
  const errors = res.errors || []
  const nodes = workflow.nodes?.length || 0
  const hasWebhookDefaults = (workflow.nodes || []).some(n => (n.type||'').includes('webhook') && n.parameters?.path && n.parameters?.httpMethod && n.parameters?.responseMode)
  return {
    valid: res.valid,
    errorCount: errors.length,
    nodeCount: nodes,
    hasWebhookDefaults
  }
}

describe('Baseline vs Candidate scoring', () => {
  it('scores two workflows from fixtures', () => {
    // Place your artifacts under workers/fixtures/{baseline.json,candidate.json}
    const baseline = load(new URL('../fixtures/baseline.json', import.meta.url))
    const candidate = load(new URL('../fixtures/candidate.json', import.meta.url))

    const s1 = score(baseline)
    const s2 = score(candidate)

    // Expect candidate to be at least as good as baseline on validity and error count
    expect(s2.valid).toBe(true)
    if (s1.valid) expect(s2.errorCount).toBeLessThanOrEqual(s1.errorCount)

    // Prefer candidate with webhook defaults
    if (!s1.hasWebhookDefaults) expect(s2.hasWebhookDefaults).toBe(true)
  })
})
