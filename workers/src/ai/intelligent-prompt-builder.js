/**
 * Intelligent Prompt Builder for n8n Workflow Generation
 * Uses pattern analysis and working examples to create context-rich prompts
 */

import WorkflowPatternAnalyzer from '../knowledge/pattern-analyzer.js';

export class IntelligentPromptBuilder {
  constructor() {
    this.patternAnalyzer = new WorkflowPatternAnalyzer();
  }

  /**
   * Build a comprehensive, context-aware prompt for n8n workflow generation
   * @param {Object} orchestrationPlan - The orchestration plan
   * @param {Object} businessContext - Business context
   * @param {Object} organizationContext - Organization context for customization
   */
  async buildIntelligentPrompt(orchestrationPlan, businessContext = {}, organizationContext = {}) {
    // Analyze the plan to find similar workflows and best practices
    const similarWorkflows = this.patternAnalyzer.findSimilarWorkflows(orchestrationPlan, 3);
    const bestPractices = this.patternAnalyzer.getApplicableBestPractices(orchestrationPlan, similarWorkflows);
    const risks = this.patternAnalyzer.identifyRisks(orchestrationPlan);
    const optimizations = this.patternAnalyzer.generateOptimizations(orchestrationPlan, similarWorkflows);
    const commonSequences = this.patternAnalyzer.extractCommonSequences();
    
    // Build the intelligent prompt with organization context
    const prompt = `# 🚀 Elite n8n Workflow Architect

You are an expert n8n workflow architect with access to a comprehensive knowledge base of successful, production-tested workflows. Generate a high-quality, production-ready workflow based on proven patterns.

## 📋 BUSINESS & ORGANIZATION REQUIREMENTS
**Process**: ${orchestrationPlan.description}
**Workflow Type**: ${orchestrationPlan.workflowName || 'Custom Automation'}
**Expected Volume**: ${businessContext.expectedVolume || 'Standard'}
**Industry Context**: ${businessContext.industry || 'General'}
**Organization**: ${organizationContext.organizationName || 'Personal Workspace'}
**Organization Plan**: ${organizationContext.organizationPlan || 'free'}
**Workspace Type**: ${organizationContext.workspaceType || 'personal'}

## 🎯 ORCHESTRATION PLAN
\`\`\`json
${JSON.stringify(orchestrationPlan, null, 2)}
\`\`\`

## 💡 PROVEN WORKING EXAMPLES
${this.buildWorkingExamplesSection(similarWorkflows)}

## ✅ MANDATORY BEST PRACTICES
${this.buildBestPracticesSection(bestPractices)}

## ⚠️ CRITICAL RISKS TO AVOID
${this.buildRisksSection(risks)}

## 🎯 OPTIMIZATION OPPORTUNITIES  
${this.buildOptimizationsSection(optimizations)}

## 📊 PROVEN NODE SEQUENCES
${this.buildCommonSequencesSection(commonSequences)}

## 🔧 TECHNICAL REQUIREMENTS

### Required n8n Workflow Structure:
\`\`\`json
{
  "name": "${this.generateWorkflowName(orchestrationPlan, organizationContext)}",
  "nodes": [
    // Array of properly configured nodes
  ],
  "connections": {
    // Proper node connections
  },
  "active": false,
  "settings": ${JSON.stringify(this.getOrganizationSettings(organizationContext))},
  "versionId": "1",
  "meta": {
    "organizationId": "${organizationContext.organizationId || null}",
    "workspaceType": "${organizationContext.workspaceType || 'personal'}",
    "generatedAt": "${new Date().toISOString()}"
  }
}
\`\`\`

### Node Configuration Standards:
1. **All nodes must have**:
   - Unique \`id\` (use format: \`node-{type}-{random6chars}\`)
   - Descriptive \`name\`
   - Correct \`type\` (n8n-nodes-base.*)
   - Proper \`position\` array [x, y]
   - Complete \`parameters\` object

2. **Error Handling Requirements**:
   - HTTP requests: Include \`retryOnFail: true\`, \`maxRetries: 3\`
   - Email operations: Include retry logic and fallback handling
   - Function nodes: Wrap logic in try/catch blocks

3. **Authentication (Organization-Aware)**:
   - Use environment variables: \`{{ $env.VARIABLE_NAME }}\`
   - Never hardcode credentials or API keys
   - Use OAuth2 for email services when possible
   ${this.getOrganizationAuthGuidelines(organizationContext)}

4. **Performance Optimization (Plan-Based)**:
   ${this.getPerformanceGuidelines(organizationContext)}

## 🎨 WORKFLOW GENERATION INSTRUCTIONS

Generate a complete, production-ready n8n workflow that:

1. **Follows Proven Patterns**: Implement the successful patterns from similar workflows
2. **Includes Comprehensive Error Handling**: Every external call must have retry logic and error branches
3. **Uses Secure Authentication**: All credentials via environment variables
4. **Optimizes for Performance**: Apply relevant optimizations from the suggestions above
5. **Implements Best Practices**: Incorporate all mandatory best practices listed above
6. **Avoids Known Risks**: Specifically prevent the risk patterns identified above

### Organization-Specific Implementation Guidelines:

${this.buildOrganizationImplementationGuidelines(orchestrationPlan, similarWorkflows, organizationContext)}

### Specific Implementation Guidelines:

${this.buildImplementationGuidelines(orchestrationPlan, similarWorkflows)}

## 🏆 SUCCESS CRITERIA

Your generated workflow will be considered successful if it:
- ✅ Executes without errors in production
- ✅ Includes proper error handling and recovery
- ✅ Uses secure authentication patterns
- ✅ Follows proven node sequences and patterns
- ✅ Avoids all identified risk patterns
- ✅ Implements relevant optimizations

## ⚠️ CRITICAL OUTPUT REQUIREMENTS

IMPORTANT: Your response must contain ONLY valid JSON. Do not include:
- Markdown formatting or code blocks (triple backticks with json or plain backticks)
- Explanatory text before or after the JSON
- Comments or annotations
- Any text outside the JSON structure

Return ONLY the complete n8n workflow JSON object that meets these requirements and incorporates the proven patterns from successful workflows.`;

    return prompt;
  }

  buildWorkingExamplesSection(similarWorkflows) {
    if (similarWorkflows.length === 0) {
      return "No directly similar workflows found. Using general best practices.";
    }

    return similarWorkflows.map((workflow, index) => `
### ${index + 1}. ${workflow.name}
**Similarity**: ${(workflow.similarity * 100).toFixed(1)}% | **Success Rate**: ${(workflow.successMetrics.successRate * 100).toFixed(1)}%
**Match Reason**: ${workflow.relevanceReason}

**Proven Pattern**:
\`\`\`
${workflow.workflow?.nodes ? workflow.workflow.nodes.map(n => n.name).join(' → ') : 'See implementation details'}
\`\`\`

**Key Success Factors**:
${this.extractSuccessFactors(workflow).map(factor => `- ${factor}`).join('\n')}

**Critical Implementation Details**:
\`\`\`json
${JSON.stringify(this.extractCriticalNodes(workflow), null, 2)}
\`\`\`
`).join('\n');
  }

  buildBestPracticesSection(bestPractices) {
    if (bestPractices.length === 0) {
      return "- Apply general n8n best practices for error handling and security";
    }

    return bestPractices.map(practice => `
**${practice.category}**: ${practice.practice}
- **Implementation**: ${practice.implementation}
- **Success Rate**: ${(practice.successRate * 100).toFixed(1)}%
- **Why**: ${practice.description}`).join('\n');
  }

  buildRisksSection(risks) {
    if (risks.length === 0) {
      return "No specific risks identified for this workflow type.";
    }

    return risks.map(risk => `
🚨 **${risk.risk}** (${risk.severity.toUpperCase()} RISK - ${(risk.failureRate * 100).toFixed(1)}% failure rate)
- **Issue**: ${risk.description}  
- **Prevention**: ${risk.prevention}`).join('\n');
  }

  buildOptimizationsSection(optimizations) {
    if (optimizations.length === 0) {
      return "No specific optimizations identified. Apply standard performance practices.";
    }

    return optimizations.map(opt => `
**${opt.type.toUpperCase()}**: ${opt.suggestion} (${opt.priority} priority)
- **How**: ${opt.implementation}
- **Expected Benefit**: ${opt.expectedImprovement}`).join('\n');
  }

  buildCommonSequencesSection(commonSequences) {
    if (commonSequences.length === 0) {
      return "No common sequences found. Create optimal flow based on requirements.";
    }

    return commonSequences.slice(0, 3).map((seq, index) => `
${index + 1}. **${seq.sequence.join(' → ')}**
   - Used in: ${seq.useCases.join(', ')}
   - Success Rate: ${(seq.avgSuccessRate * 100).toFixed(1)}%
   - Avg Execution: ${seq.avgExecutionTime.toFixed(1)}s`).join('\n');
  }

  buildImplementationGuidelines(orchestrationPlan, similarWorkflows) {
    const guidelines = [];
    
    // Add guidelines based on workflow type
    if (orchestrationPlan.description.toLowerCase().includes('email')) {
      guidelines.push(`
**Email Automation Guidelines**:
- Use IMAP trigger for incoming emails, webhook for external notifications
- Implement email content analysis with Function nodes for classification
- Always include auto-response acknowledgment emails
- Set proper email authentication (OAuth2 preferred)
- Add email delivery confirmation when possible`);
    }
    
    if (orchestrationPlan.steps?.some(s => s.type === 'http')) {
      guidelines.push(`
**HTTP Integration Guidelines**:
- Include comprehensive retry logic (3 attempts with exponential backoff)
- Set appropriate timeouts (30s for standard APIs, 120s for slow services)
- Use proper HTTP status code handling
- Implement request/response logging for debugging
- Add rate limiting awareness`);
    }
    
    if (orchestrationPlan.triggers?.some(t => t.type === 'webhook')) {
      guidelines.push(`
**Webhook Security Guidelines**:
- Always implement authentication (headerAuth or HMAC signatures)
- Validate incoming payload structure
- Set proper CORS headers for browser requests
- Log webhook calls for audit purposes
- Include request timeout handling`);
    }

    // Add guidelines from similar successful workflows
    similarWorkflows.forEach(workflow => {
      if (workflow.patterns) {
        guidelines.push(`
**From ${workflow.name} (${(workflow.successMetrics.successRate * 100).toFixed(1)}% success rate)**:
${Object.entries(workflow.patterns).map(([key, pattern]) => 
  `- **${key}**: ${typeof pattern === 'string' ? pattern : pattern.strategy || JSON.stringify(pattern)}`
).join('\n')}`);
      }
    });
    
    return guidelines.join('\n') || "Follow standard n8n development practices.";
  }

  extractSuccessFactors(workflow) {
    const factors = [];
    
    if (workflow.successMetrics.successRate > 0.95) {
      factors.push(`Exceptional reliability (${(workflow.successMetrics.successRate * 100).toFixed(1)}% success rate)`);
    }
    
    if (workflow.successMetrics.avgExecutionTime && parseFloat(workflow.successMetrics.avgExecutionTime) < 3) {
      factors.push(`Fast execution (${workflow.successMetrics.avgExecutionTime} average)`);
    }
    
    if (workflow.patterns?.errorHandling) {
      factors.push(`Robust error handling: ${workflow.patterns.errorHandling.strategy}`);
    }
    
    if (workflow.patterns?.authentication) {
      factors.push(`Secure authentication: ${workflow.patterns.authentication.strategy}`);
    }
    
    if (workflow.workflow?.nodes?.length) {
      factors.push(`Optimized node count: ${workflow.workflow.nodes.length} nodes`);
    }
    
    return factors.length > 0 ? factors : ['Well-structured workflow design'];
  }

  extractCriticalNodes(workflow) {
    if (!workflow.workflow?.nodes) return {};
    
    // Extract 2-3 most critical nodes for reference
    const criticalNodes = workflow.workflow.nodes
      .filter(node => node.purpose || node.code || Object.keys(node.config || {}).length > 2)
      .slice(0, 3)
      .reduce((acc, node) => {
        acc[node.name] = {
          type: node.type,
          purpose: node.purpose,
          config: node.config,
          ...(node.code && { sampleCode: node.code.substring(0, 200) + '...' })
        };
        return acc;
      }, {});
    
    return criticalNodes;
  }

  /**
   * Generate organization-appropriate workflow name
   */
  generateWorkflowName(orchestrationPlan, organizationContext) {
    const baseName = orchestrationPlan.workflowName || 'Custom Automation';
    const orgPrefix = organizationContext.organizationId ? 
      `[${organizationContext.organizationName || 'Org'}] ` : '';
    
    return `${orgPrefix}${baseName}`;
  }

  /**
   * Get organization-specific workflow settings
   */
  getOrganizationSettings(organizationContext) {
    const plan = organizationContext.organizationPlan || 'free';
    
    const settings = {
      timezone: 'UTC',
      saveDataErrorExecution: 'all',
      saveDataSuccessExecution: 'all'
    };

    // Plan-based settings
    switch (plan) {
      case 'enterprise':
        settings.executionTimeout = 7200; // 2 hours
        settings.maxExecutionTime = 7200;
        settings.saveExecutionProgress = true;
        break;
      case 'professional':
        settings.executionTimeout = 3600; // 1 hour
        settings.maxExecutionTime = 3600;
        settings.saveExecutionProgress = true;
        break;
      case 'starter':
        settings.executionTimeout = 1800; // 30 minutes
        settings.maxExecutionTime = 1800;
        break;
      default: // free
        settings.executionTimeout = 900; // 15 minutes
        settings.maxExecutionTime = 900;
        break;
    }

    return settings;
  }

  /**
   * Get organization-specific authentication guidelines
   */
  getOrganizationAuthGuidelines(organizationContext) {
    const plan = organizationContext.organizationPlan || 'free';
    const isOrg = organizationContext.organizationId;

    const guidelines = [];

    if (isOrg) {
      guidelines.push('- Use organization-specific credential prefixes: `{{ $env.ORG_' + (organizationContext.organizationId || 'ID').toUpperCase() + '_CREDENTIAL_NAME }}`');
    }

    switch (plan) {
      case 'enterprise':
        guidelines.push('- Enable audit logging for all credential usage');
        guidelines.push('- Implement credential rotation schedules');
        guidelines.push('- Use service accounts for production integrations');
        break;
      case 'professional':
        guidelines.push('- Enable audit logging for critical credential usage');
        guidelines.push('- Use dedicated API keys for production');
        break;
      case 'starter':
        guidelines.push('- Use basic authentication security measures');
        break;
      default:
        guidelines.push('- Follow basic security practices for credential management');
    }

    return guidelines.join('\n   ');
  }

  /**
   * Get plan-based performance guidelines
   */
  getPerformanceGuidelines(organizationContext) {
    const plan = organizationContext.organizationPlan || 'free';
    
    const baseGuidelines = [
      '- Set appropriate timeouts for external calls',
      '- Use batch processing for large datasets',
      '- Implement caching for repeated operations'
    ];

    const planGuidelines = {
      enterprise: [
        ...baseGuidelines,
        '- Enable high-performance execution modes',
        '- Use advanced caching strategies with Redis integration',
        '- Implement horizontal scaling patterns',
        '- Set aggressive retry policies (5+ attempts)',
        '- Use concurrent processing where possible'
      ],
      professional: [
        ...baseGuidelines,
        '- Enable performance monitoring',
        '- Use intermediate caching for complex workflows',
        '- Set moderate retry policies (3-5 attempts)',
        '- Optimize for mid-scale operations (100-1000 items)'
      ],
      starter: [
        ...baseGuidelines,
        '- Focus on reliability over speed',
        '- Set conservative retry policies (2-3 attempts)',
        '- Optimize for small-scale operations (10-100 items)'
      ],
      free: [
        '- Keep workflows simple to avoid timeouts',
        '- Minimize external API calls',
        '- Use basic error handling (1-2 retry attempts)',
        '- Optimize for small datasets (1-10 items)'
      ]
    };

    return (planGuidelines[plan] || planGuidelines.free)
      .map(guideline => `   ${guideline}`)
      .join('\n');
  }

  /**
   * Build organization-specific implementation guidelines
   */
  buildOrganizationImplementationGuidelines(orchestrationPlan, similarWorkflows, organizationContext) {
    const guidelines = [];
    const plan = organizationContext.organizationPlan || 'free';
    const isOrg = organizationContext.organizationId;

    // Organization-specific branding and naming
    if (isOrg) {
      guidelines.push(`
**Organization Workflow Guidelines for ${organizationContext.organizationName}**:
- Use consistent naming: Prefix nodes with organization identifier
- Include organization metadata in webhook URLs and identifiers  
- Set organization-specific error notification channels
- Apply organization branding to generated emails and notifications`);
    }

    // Plan-based complexity recommendations
    const complexityGuidelines = {
      enterprise: 'Implement comprehensive workflows with advanced logic, multiple integrations, and sophisticated error handling',
      professional: 'Build robust workflows with multiple steps, conditional logic, and proper error handling',
      starter: 'Create efficient workflows with essential steps and basic error handling',
      free: 'Keep workflows simple with minimal steps to avoid timeout and complexity limits'
    };

    guidelines.push(`
**${plan.toUpperCase()} Plan Optimization**:
- ${complexityGuidelines[plan]}
- Maximum recommended nodes: ${this.getMaxRecommendedNodes(plan)}
- Focus areas: ${this.getPlanFocusAreas(plan).join(', ')}`);

    // Volume-specific recommendations
    if (organizationContext.expectedVolume) {
      guidelines.push(`
**Volume Optimization for ${organizationContext.expectedVolume}**:
${this.getVolumeOptimizations(organizationContext.expectedVolume, plan)}`);
    }

    return guidelines.join('\n') || 'Apply standard implementation practices.';
  }

  /**
   * Get maximum recommended nodes based on plan
   */
  getMaxRecommendedNodes(plan) {
    const limits = {
      enterprise: '50+ nodes',
      professional: '25-30 nodes', 
      starter: '15-20 nodes',
      free: '5-10 nodes'
    };
    return limits[plan] || limits.free;
  }

  /**
   * Get plan-specific focus areas
   */
  getPlanFocusAreas(plan) {
    const areas = {
      enterprise: ['Security', 'Scalability', 'Monitoring', 'Compliance'],
      professional: ['Reliability', 'Performance', 'Integration'],
      starter: ['Efficiency', 'Essential Features', 'Stability'],
      free: ['Simplicity', 'Basic Functionality', 'Resource Conservation']
    };
    return areas[plan] || areas.free;
  }

  /**
   * Get volume-based optimizations
   */
  getVolumeOptimizations(volume, plan) {
    const optimizations = {
      'high': [
        '- Implement batching and queuing mechanisms',
        '- Use parallel processing where possible',
        '- Add comprehensive monitoring and alerting',
        '- Implement circuit breaker patterns for external services'
      ],
      'medium': [
        '- Use moderate batching (10-50 items per batch)',
        '- Implement basic monitoring',
        '- Add retry logic with exponential backoff'
      ],
      'low': [
        '- Process items individually for maximum reliability',
        '- Use simple retry mechanisms',
        '- Focus on error prevention over performance'
      ]
    };

    const volumeKey = volume.toLowerCase().includes('high') ? 'high' :
                     volume.toLowerCase().includes('medium') ? 'medium' : 'low';
    
    return (optimizations[volumeKey] || optimizations.low).join('\n');
  }
}

export default IntelligentPromptBuilder;