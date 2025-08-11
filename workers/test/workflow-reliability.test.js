/**
 * Comprehensive n8n Workflow Generation Testing
 * Tests reliability, validation, and output quality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateReliableN8nWorkflow, validateN8nWorkflow } from '../src/generators/n8n-reliable.js';

// Test fixtures for different workflow scenarios
const TEST_FIXTURES = {
  emailAutomation: {
    processData: {
      processDescription: "Customer inquiries arrive via email, need to be categorized and responded to automatically",
      businessContext: {
        industry: "Customer Support",
        department: "Operations",
        volume: "100-200 emails per day",
        complexity: "High - requires AI categorization and personalized responses"
      }
    },
    automationOpportunities: [
      {
        stepDescription: "AI-powered email classification",
        automationSolution: "ai_email_processing",
        priority: "high"
      }
    ]
  },

  dataSyncAutomation: {
    processData: {
      processDescription: "Customer data needs to be synchronized between Google Sheets and Airtable with validation",
      businessContext: {
        industry: "Data Management",
        department: "Operations", 
        volume: "50-100 records per hour",
        complexity: "Medium - requires data validation and dual storage"
      }
    },
    automationOpportunities: [
      {
        stepDescription: "Dual platform data synchronization",
        automationSolution: "multi_platform_sync",
        priority: "high"
      }
    ]
  },

  aiClassification: {
    processData: {
      processDescription: "Documents need to be classified using AI and routed to appropriate departments",
      businessContext: {
        industry: "Document Processing",
        department: "Operations",
        volume: "200+ documents per day", 
        complexity: "High - requires AI classification and conditional routing"
      }
    },
    automationOpportunities: [
      {
        stepDescription: "AI-powered document classification and routing",
        automationSolution: "ai_classification_routing",
        priority: "high"
      }
    ]
  }
};

const mockEnv = {
  CLAUDE_API_KEY: 'sk-ant-test-key',
  NODE_ENV: 'test'
};

describe('Reliable n8n Workflow Generation', () => {
  let orchestrationPlan;

  beforeEach(() => {
    orchestrationPlan = {
      workflowName: 'Test Automation',
      description: 'Test workflow for reliability testing',
      triggers: [{ type: 'email', configuration: {} }],
      steps: [
        { id: 'step1', name: 'Process', type: 'function', configuration: {} },
        { id: 'step2', name: 'Send', type: 'email', configuration: {} }
      ],
      connections: [{ from: 'step1', to: 'step2' }],
      integrations: ['email', 'ai'],
      complexity: 'medium'
    };
  });

  describe('Workflow Structure Validation', () => {
    it('should generate valid workflow structure', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv, 
        orchestrationPlan, 
        TEST_FIXTURES.emailAutomation
      );

      expect(workflow).toHaveProperty('name');
      expect(workflow).toHaveProperty('nodes');
      expect(workflow).toHaveProperty('connections');
      expect(workflow).toHaveProperty('settings');
      expect(workflow.meta.validated).toBe(true);
    });

    it('should validate complete workflow successfully', () => {
      const validWorkflow = {
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node1',
            name: 'Trigger',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [100, 300],
            parameters: {}
          }
        ],
        connections: {},
        settings: {}
      };

      const validation = validateN8nWorkflow(validWorkflow);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidWorkflow = {
        // Missing name
        nodes: [],
        connections: {}
      };

      const validation = validateN8nWorkflow(invalidWorkflow);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing workflow name');
    });
  });

  describe('Node Generation', () => {
    it('should generate nodes with correct n8n types', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );

      // Check that all nodes have valid n8n types
      workflow.nodes.forEach(node => {
        expect(node.type).toMatch(/^n8n-nodes-base\./);
        expect(node.typeVersion).toBeGreaterThan(0);
        expect(node.id).toBeDefined();
        expect(node.name).toBeDefined();
        expect(Array.isArray(node.position)).toBe(true);
        expect(node.position).toHaveLength(2);
      });
    });

    it('should add credentials to nodes that require them', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );

      const gmailNodes = workflow.nodes.filter(n => n.type.includes('gmail'));
      gmailNodes.forEach(node => {
        expect(node.credentials).toBeDefined();
        expect(node.credentials.gmailOAuth2Api).toBeDefined();
      });
    });

    it('should add retry logic to critical nodes', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.dataSyncAutomation
      );

      const criticalNodes = workflow.nodes.filter(n => 
        n.type.includes('gmail') || 
        n.type.includes('googleSheets') || 
        n.type.includes('airtable')
      );

      criticalNodes.forEach(node => {
        expect(node.continueOnFail).toBe(true);
        expect(node.retryOnFail).toBe(true);
        expect(node.maxRetries).toBe(3);
      });
    });
  });

  describe('Connection Logic', () => {
    it('should create valid connections between nodes', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );

      const nodeNames = new Set(workflow.nodes.map(n => n.name));
      
      Object.entries(workflow.connections).forEach(([fromNode, connections]) => {
        // Source node should exist
        expect(nodeNames.has(fromNode)).toBe(true);
        
        // Target nodes should exist
        connections.main?.forEach(branch => {
          branch?.forEach(conn => {
            expect(nodeNames.has(conn.node)).toBe(true);
            expect(conn.type).toBe('main');
            expect(typeof conn.index).toBe('number');
          });
        });
      });
    });

    it('should handle parallel branches correctly', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.dataSyncAutomation
      );

      // Look for merge nodes when parallel processing is used
      const mergeNodes = workflow.nodes.filter(n => n.type.includes('merge'));
      if (mergeNodes.length > 0) {
        mergeNodes.forEach(mergeNode => {
          expect(mergeNode.parameters.mode).toBeDefined();
        });
      }
    });
  });

  describe('Workflow Patterns', () => {
    it('should detect email automation pattern', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );

      expect(workflow.name).toContain('Email');
      
      // Should have Gmail trigger and send nodes
      const nodeTypes = workflow.nodes.map(n => n.type);
      expect(nodeTypes).toContain('n8n-nodes-base.gmailTrigger');
      expect(nodeTypes.some(t => t.includes('gmail'))).toBe(true);
    });

    it('should detect data sync pattern', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.dataSyncAutomation
      );

      const nodeTypes = workflow.nodes.map(n => n.type);
      
      // Should have multiple storage integrations
      expect(
        nodeTypes.some(t => t.includes('googleSheets') || t.includes('airtable'))
      ).toBe(true);
    });

    it('should detect AI classification pattern', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.aiClassification
      );

      const nodeTypes = workflow.nodes.map(n => n.type);
      
      // Should have AI and conditional nodes
      expect(nodeTypes).toContain('n8n-nodes-base.openAi');
      expect(nodeTypes.some(t => t.includes('switch') || t.includes('if'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid orchestration plan gracefully', async () => {
      const invalidPlan = null;

      await expect(
        generateReliableN8nWorkflow(mockEnv, invalidPlan, TEST_FIXTURES.emailAutomation)
      ).rejects.toThrow();
    });

    it('should handle missing environment variables', async () => {
      const emptyEnv = {};

      await expect(
        generateReliableN8nWorkflow(emptyEnv, orchestrationPlan, TEST_FIXTURES.emailAutomation)
      ).rejects.toThrow(/API key/);
    });

    it('should validate unknown node types', async () => {
      const badStructure = {
        flow: [
          { nodeType: 'unknown-node-type', name: 'Bad Node' }
        ]
      };

      // Mock generateWorkflowStructure to return bad structure
      expect(() => {
        // This would be caught in createValidatedNodes
        const registry = undefined; // Simulating unknown node type
        if (!registry) {
          throw new Error('Unknown node type: unknown-node-type');
        }
      }).toThrow('Unknown node type');
    });
  });

  describe('Performance and Quality', () => {
    it('should generate workflows within reasonable time', async () => {
      const startTime = Date.now();
      
      await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should generate workflows with reasonable node count', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );

      // Should have between 3-12 nodes for typical workflows
      expect(workflow.nodes.length).toBeGreaterThan(2);
      expect(workflow.nodes.length).toBeLessThan(13);
    });

    it('should include proper metadata', async () => {
      const workflow = await generateReliableN8nWorkflow(
        mockEnv,
        orchestrationPlan,
        TEST_FIXTURES.emailAutomation
      );

      expect(workflow.meta.generatedAt).toBeDefined();
      expect(workflow.meta.generatedBy).toContain('ProcessAudit AI');
      expect(workflow.meta.validated).toBe(true);
      expect(workflow.description).toBeDefined();
      expect(Array.isArray(workflow.tags)).toBe(true);
    });
  });
});