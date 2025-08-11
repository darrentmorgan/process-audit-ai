/**
 * Blueprint library for commonly used n8n node patterns.
 * These produce node blocks with sensible defaults and placeholders.
 *
 * Supported intents (phase 1):
 * - email.send
 * - sheets.append
 * - airtable.upsert
 * - http.request
 * - webhook.trigger
 * - transform.set
 */

/**
 * Return a shallow env mapping with placeholders required by a blueprint.
 */
function envMapping(pairs = []) {
  const mapping = {}
  for (const [key, desc] of pairs) mapping[key] = desc
  return mapping
}

export function blueprintEmailSend({ to = '{{recipient}}', subject = 'Subject', text = 'Body', credentialsRef = '{{GMAIL_CREDENTIALS}}', terminal = true } = {}) {
  const node = {
    id: `node-email-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Email - Send',
    type: 'n8n-nodes-base.emailSend',
    typeVersion: 1,
    position: [600, 300],
    parameters: {
      fromEmail: '{{from}}',
      to,
      subject,
      text,
      terminal,
      options: {
        senderName: '{{senderName}}'
      }
    },
    credentials: {
      smtp: {
        id: credentialsRef,
        name: 'SMTP'
      }
    }
  }
  return { nodes: [node], env: envMapping([
    ['GMAIL_CREDENTIALS', 'Reference to SMTP/Gmail credentials configured in n8n']
  ]) }
}

export function blueprintSheetsAppend({ spreadsheetId = '{{SHEETS_ID}}', range = 'A1', values = [['{{timestamp}}', '{{message}}']] } = {}) {
  const node = {
    id: `node-sheets-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Sheets - Append Row',
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 1,
    position: [800, 300],
    parameters: {
      operation: 'append',
      spreadsheetId,
      range,
      options: {
        valueInputMode: 'RAW'
      },
      columns: values
    }
  }
  return { nodes: [node], env: envMapping([
    ['SHEETS_ID', 'Google Sheets spreadsheet ID']
  ]) }
}

export function blueprintAirtableUpsert({ baseId = '{{AIRTABLE_BASE}}', table = '{{AIRTABLE_TABLE}}', key = 'id', record = { id: '{{id}}', value: '{{value}}' } } = {}) {
  const node = {
    id: `node-airtable-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Airtable - Upsert',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 1,
    position: [1000, 300],
    parameters: {
      operation: 'upsert',
      application: baseId,
      table,
      upsertKeys: [key],
      additionalFields: {},
      // Blueprint uses item JSON; real mapping will be done at assembly.
      // Here we include a representative structure.
      fields: record
    }
  }
  return { nodes: [node], env: envMapping([
    ['AIRTABLE_BASE', 'Airtable Base ID'],
    ['AIRTABLE_TABLE', 'Airtable Table Name']
  ]) }
}

export function blueprintHttpRequest({ url = '{{API_URL}}', method = 'POST', body = { message: '{{message}}' }, headers = { Authorization: 'Bearer {{API_TOKEN}}' } } = {}) {
  const node = {
    id: `node-http-${Math.random().toString(36).slice(2, 8)}`,
    name: 'HTTP - Request',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 1,
    position: [1200, 300],
    parameters: {
      url,
      method,
      sendBody: true,
      jsonParameters: true,
      options: {
        retryOnFail: true,
        maxRetries: 3,
        allowUnauthorizedCerts: false
      },
      headerParametersJson: JSON.stringify(headers),
      jsonBody: JSON.stringify(body)
    }
  }
  return { nodes: [node], env: envMapping([
    ['API_URL', 'Target API endpoint'],
    ['API_TOKEN', 'API token or secret']
  ]) }
}

export function blueprintWebhookTrigger({ path = 'process-audit/{{JOB_ID}}', method = 'POST', responseMode = 'onReceived' } = {}) {
  const node = {
    id: `node-webhook-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Webhook - Trigger',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    position: [250, 300],
    parameters: {
      path,
      httpMethod: method,
      responseMode,
      responseCode: 200,
      authentication: 'none'
    }
  }
  return { nodes: [node], env: envMapping([]) }
}

export function blueprintTransformSet({ pairs = [{ name: 'message', value: '{{message}}' }] } = {}) {
  const node = {
    id: `node-set-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Transform - Set',
    type: 'n8n-nodes-base.set',
    typeVersion: 1,
    position: [700, 300],
    parameters: {
      keepOnlySet: true,
      values: {
        string: pairs.map(p => ({ name: p.name, value: p.value }))
      }
    }
  }
  return { nodes: [node], env: envMapping([]) }
}

/**
 * Utility: connect sequentially a list of nodes by name.
 */
export function connectLinear(nodes) {
  const connections = {}
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i].name
    const to = nodes[i + 1].name
    connections[from] = { main: [[{ node: to, type: 'main', index: 0 }]] }
  }
  return connections
}

export function assembleWorkflow({ name = 'Blueprint Workflow', blocks = [] } = {}) {
  const nodes = blocks.flatMap(b => b.nodes)
  const env = Object.assign({}, ...blocks.map(b => b.env))
  const connections = connectLinear(nodes)
  return {
    workflow: {
      name,
      nodes,
      connections,
      active: false,
      settings: {},
      versionId: '1'
    },
    env
  }
}
