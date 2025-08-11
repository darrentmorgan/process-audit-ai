import { describe, it, expect } from 'vitest'
import { assembleWorkflow, blueprintWebhookTrigger, blueprintEmailSend, blueprintHttpRequest, blueprintTransformSet } from '../src/blueprints.js'
import { validateN8nWorkflow } from '../src/generators/n8n.js'

describe('Blueprint assembler + workflow validator', () => {
  it('assembles webhook -> http -> set -> email and validates', () => {
    const trigger = blueprintWebhookTrigger({ path: 'appeals/ingest', method: 'POST' })
    const http = blueprintHttpRequest({ url: '{{API_URL}}', method: 'POST', body: { id: '{{id}}' } })
    const set = blueprintTransformSet({ pairs: [{ name: 'status', value: 'submitted' }] })
    const email = blueprintEmailSend({ to: '{{managerEmail}}', subject: 'Appeal Submitted', text: 'We have submitted an appeal.' })

    const { workflow, env } = assembleWorkflow({
      name: 'Appeals Intake Notification',
      blocks: [trigger, http, set, email]
    })

    const res = validateN8nWorkflow(workflow)
    expect(res.valid, res.errors?.join(', ')).toBe(true)
    // Env mapping should include placeholders we expect
    expect(Object.keys(env).length).toBeGreaterThanOrEqual(1)
  })
})
