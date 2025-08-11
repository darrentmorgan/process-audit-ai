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
   */
  async buildIntelligentPrompt(orchestrationPlan, businessContext = {}) {
    // Analyze the plan to find similar workflows and best practices
    const similarWorkflows = this.patternAnalyzer.findSimilarWorkflows(orchestrationPlan, 3);
    const bestPractices = this.patternAnalyzer.getApplicableBestPractices(orchestrationPlan, similarWorkflows);
    const risks = this.patternAnalyzer.identifyRisks(orchestrationPlan);
    const optimizations = this.patternAnalyzer.generateOptimizations(orchestrationPlan, similarWorkflows);
    const commonSequences = this.patternAnalyzer.extractCommonSequences();
    
    // Build the intelligent prompt
    const prompt = `# 🚀 Elite n8n Workflow Architect

You are an expert n8n workflow architect with access to a comprehensive knowledge base of successful, production-tested workflows. Generate a high-quality, production-ready workflow based on proven patterns.

## 📋 BUSINESS REQUIREMENTS
**Process**: ${orchestrationPlan.description}
**Workflow Type**: ${orchestrationPlan.workflowName || 'Custom Automation'}
**Expected Volume**: ${businessContext.expectedVolume || 'Standard'}
**Industry Context**: ${businessContext.industry || 'General'}

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
  "name": "Descriptive Workflow Name",
  "nodes": [
    // Array of properly configured nodes
  ],
  "connections": {
    // Proper node connections
  },
  "active": false,
  "settings": {},
  "versionId": "1"
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

3. **Authentication**:
   - Use environment variables: \`{{ $env.VARIABLE_NAME }}\`
   - Never hardcode credentials or API keys
   - Use OAuth2 for email services when possible

4. **Performance Optimization**:
   - Set appropriate timeouts for external calls
   - Use batch processing for large datasets
   - Implement caching for repeated operations

## 🎨 WORKFLOW GENERATION INSTRUCTIONS

Generate a complete, production-ready n8n workflow that:

1. **Follows Proven Patterns**: Implement the successful patterns from similar workflows
2. **Includes Comprehensive Error Handling**: Every external call must have retry logic and error branches
3. **Uses Secure Authentication**: All credentials via environment variables
4. **Optimizes for Performance**: Apply relevant optimizations from the suggestions above
5. **Implements Best Practices**: Incorporate all mandatory best practices listed above
6. **Avoids Known Risks**: Specifically prevent the risk patterns identified above

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
}

export default IntelligentPromptBuilder;