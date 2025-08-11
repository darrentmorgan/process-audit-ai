import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { assembleWorkflow, blueprintWebhookTrigger, blueprintHttpRequest, blueprintEmailSend } from '../src/blueprints.js'

let worker

async function startWorker() {
  // Dynamically import wrangler to avoid CJS/ESM conflicts
  const { unstable_dev } = await import('wrangler')
  worker = await unstable_dev('src/index.js', {
    experimental: { disableExperimentalWarning: true },
    local: true,
    persist: false,
    ip: '127.0.0.1',
    port: 0 // random available port
  })
}

async function stopWorker() {
  if (worker) await worker.stop()
}

describe('Worker E2E', () => {
  beforeAll(async () => {
    await startWorker()
  }, 30_000)

  afterAll(async () => {
    await stopWorker()
  })

  it('returns healthy from /health', async () => {
    const res = await worker.fetch('/health')
    expect(res.ok).toBe(true)
    const body = await res.json()
    expect(body.status).toBe('healthy')
  })

  it('validates an assembled workflow via /validate', async () => {
    const trigger = blueprintWebhookTrigger({ path: 'appeals/ingest' })
    const http = blueprintHttpRequest({ url: '{{API_URL}}', method: 'POST', body: { id: '{{id}}' } })
    const email = blueprintEmailSend({ to: '{{managerEmail}}', subject: 'Appeal Submitted', text: 'We have submitted an appeal.' })

    const { workflow } = assembleWorkflow({
      name: 'Appeals Intake Notification',
      blocks: [trigger, http, email]
    })

    const res = await worker.fetch('/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow })
    })

    expect(res.ok).toBe(true)
    const result = await res.json()
    expect(result.valid, result.errors?.join(', ')).toBe(true)
  })
})
