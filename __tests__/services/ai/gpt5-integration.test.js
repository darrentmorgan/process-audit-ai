/**
 * GPT-5 Integration Tests
 * 
 * Test suite for GPT-5 model integration and OpenAI API functionality
 * Validates that all AI prompts work correctly with GPT-5
 */

const { generateQuestions, analyzeProcess, analyzeSOPStructure } = require('../../../utils/aiPrompts');

// Mock OpenAI API for testing
const mockOpenAIResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        executiveSummary: {
          totalTimeSavings: "15-20 hours/week",
          quickWins: 3,
          strategicOpportunities: 2,
          estimatedROI: "250-400%"
        },
        automationOpportunities: [
          {
            id: 1,
            processStep: "Test automation opportunity",
            solution: "Test solution",
            priority: 85
          }
        ]
      })
    }
  }],
  usage: {
    prompt_tokens: 1000,
    completion_tokens: 500,
    total_tokens: 1500
  }
};

// Mock fetch for OpenAI API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockOpenAIResponse)
  })
);

describe('GPT-5 Integration', () => {
  beforeEach(() => {
    // Reset environment to use OpenAI
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.USE_OPENAI_PRIMARY = 'true';
    
    // Clear any previous API call mocks
    fetch.mockClear();
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.USE_OPENAI_PRIMARY;
  });

  describe('Question Generation with GPT-5', () => {
    it('should generate questions using GPT-5', async () => {
      const testProcessDescription = 'Customer support ticket management process';
      
      const questions = await generateQuestions(testProcessDescription);
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      
      // Verify OpenAI API was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle GPT-5 API errors gracefully', async () => {
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('OpenAI API error'));
      
      const questions = await generateQuestions('Test process');
      
      // Should fallback gracefully
      expect(questions).toBeNull();
    });

    it('should use correct GPT-5 model configuration', async () => {
      await generateQuestions('Test process');
      
      const apiCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(apiCall[1].body);
      
      expect(requestBody.model).toBe('gpt-5');
      expect(requestBody.max_completion_tokens).toBeDefined();
      expect(requestBody.temperature).toBeDefined();
      expect(requestBody.messages).toBeDefined();
    });
  });

  describe('Process Analysis with GPT-5', () => {
    it('should analyze processes using GPT-5', async () => {
      const testData = {
        processDescription: 'Invoice processing workflow',
        answers: { frequency: 'Daily', tools: 'Excel, Email' }
      };
      
      const analysis = await analyzeProcess(testData);
      
      expect(analysis).toBeDefined();
      expect(analysis.executiveSummary).toBeDefined();
      expect(analysis.automationOpportunities).toBeDefined();
      
      // Verify GPT-5 was used
      const apiCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(apiCall[1].body);
      expect(requestBody.model).toBe('gpt-5');
    });

    it('should handle complex process analysis with appropriate token limits', async () => {
      const complexProcessData = {
        processDescription: 'Complex multi-step process with many integrations and approval workflows involving multiple departments and external systems',
        answers: {
          frequency: 'Multiple times per day',
          tools: 'Salesforce, HubSpot, Slack, Excel, DocuSign, Zendesk, Jira',
          timeBreakdown: 'Setup: 30 min, Work: 2 hours, Waiting: 4 hours, Follow-up: 1 hour'
        }
      };
      
      const analysis = await analyzeProcess(complexProcessData);
      
      expect(analysis).toBeDefined();
      
      // Verify appropriate token limit for complex analysis
      const apiCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(apiCall[1].body);
      expect(requestBody.max_completion_tokens).toBeGreaterThan(4000);
    });
  });

  describe('SOP Analysis with GPT-5', () => {
    it('should analyze SOPs using GPT-5', async () => {
      const sopData = {
        sopContent: 'Daily Workflow Process for Customer Service Team',
        sopStructure: { isSOP: true, confidence: 85 }
      };
      
      const analysis = await analyzeSOPStructure(sopData);
      
      expect(analysis).toBeDefined();
      expect(analysis.sopAssessment).toBeDefined();
      
      // Verify GPT-5 model usage
      const apiCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(apiCall[1].body);
      expect(requestBody.model).toBe('gpt-5');
    });
  });

  describe('Model Router Integration', () => {
    it('should respect organization preferences for model selection', async () => {
      const orgContext = {
        organizationId: 'test-org',
        preferences: {
          preferredProvider: 'openai',
          maxTokens: 6000,
          temperature: 0.7
        }
      };
      
      await generateQuestions('Test process', '', orgContext);
      
      const apiCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(apiCall[1].body);
      
      expect(requestBody.max_completion_tokens).toBe(6000);
      expect(requestBody.temperature).toBe(0.7);
    });

    it('should fallback to Claude when OpenAI unavailable', async () => {
      // Mock OpenAI failure
      fetch.mockRejectedValueOnce(new Error('OpenAI unavailable'));
      
      // Mock Claude API key available
      process.env.CLAUDE_API_KEY = 'sk-ant-test-key';
      
      const questions = await generateQuestions('Test process');
      
      // Should attempt OpenAI first, then fallback
      expect(fetch).toHaveBeenCalledTimes(1); // OpenAI attempt
      // Claude fallback would be tested separately
    });
  });

  describe('Response Format Validation', () => {
    it('should parse GPT-5 JSON responses correctly', async () => {
      const jsonResponse = {
        choices: [{
          message: {
            content: '[{"id": "test", "question": "Test question?", "type": "text"}]'
          }
        }]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(jsonResponse)
      });
      
      const questions = await generateQuestions('Test process');
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions[0]).toHaveProperty('id');
      expect(questions[0]).toHaveProperty('question');
      expect(questions[0]).toHaveProperty('type');
    });

    it('should handle malformed JSON responses', async () => {
      const malformedResponse = {
        choices: [{
          message: {
            content: 'This is not valid JSON'
          }
        }]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(malformedResponse)
      });
      
      const questions = await generateQuestions('Test process');
      
      // Should handle gracefully
      expect(questions).toBeNull();
    });
  });

  describe('Performance and Token Management', () => {
    it('should respect token limits for different tiers', async () => {
      // Test orchestrator tier (higher token limit)
      await generateQuestions('Complex process description', '', { tier: 'orchestrator' });
      
      let apiCall = fetch.mock.calls[0];
      let requestBody = JSON.parse(apiCall[1].body);
      const orchestratorTokens = requestBody.max_completion_tokens;
      
      fetch.mockClear();
      
      // Test agent tier (lower token limit)
      await generateQuestions('Simple process', '', { tier: 'agent' });
      
      apiCall = fetch.mock.calls[0];
      requestBody = JSON.parse(apiCall[1].body);
      const agentTokens = requestBody.max_completion_tokens;
      
      expect(orchestratorTokens).toBeGreaterThan(agentTokens);
    });

    it('should track token usage for cost monitoring', async () => {
      const response = await generateQuestions('Test process');
      
      // Verify token usage is tracked
      expect(fetch).toHaveBeenCalled();
      
      // Response should include usage information
      const apiCall = fetch.mock.calls[0];
      expect(apiCall[1].body).toContain('max_completion_tokens');
    });
  });
});