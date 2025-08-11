/**
 * Lightweight JSON schema definitions for the orchestrator plan and n8n workflow.
 * These are intentionally simplified to keep validation fast in the Worker.
 */

export const ORCHESTRATION_PLAN_SCHEMA = {
  type: 'object',
  required: ['workflowName', 'description', 'triggers', 'steps'],
  properties: {
    workflowName: { type: 'string' },
    description: { type: 'string' },
    triggers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'configuration'],
        properties: {
          type: { type: 'string', enum: ['webhook', 'schedule', 'email', 'form'] },
          configuration: { type: 'object' }
        }
      },
      minItems: 1
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'type', 'configuration'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string' },
          inputs: { type: 'array' },
          outputs: { type: 'array' },
          configuration: { type: 'object' }
        }
      },
      minItems: 1
    },
    connections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: { type: 'string' },
          to: { type: 'string' }
        }
      }
    },
    errorHandling: {
      type: 'object',
      properties: {
        strategy: { type: 'string' },
        notifications: { type: 'array' }
      }
    }
  }
}

export const N8N_WORKFLOW_SCHEMA = {
  type: 'object',
  required: ['name', 'nodes', 'connections'],
  properties: {
    name: { type: 'string' },
    nodes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'type', 'position', 'typeVersion'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          typeVersion: { type: 'number' },
          position: { type: 'array' },
          parameters: { type: 'object' }
        }
      }
    },
    connections: { type: 'object' },
    active: { type: 'boolean' },
    settings: { type: 'object' },
    versionId: { type: 'string' },
    id: { type: 'string' },
    meta: { type: 'object' },
    tags: { type: 'array' }
  }
}
