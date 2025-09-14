/**
 * Comprehensive AI Integrations Test Suite
 * ProcessAudit AI - Claude + OpenAI Integration Testing
 *
 * Coverage Areas:
 * - Claude API integration and responses
 * - OpenAI API integration and fallback logic
 * - Cost tracking and optimization
 * - Error handling and retry mechanisms
 * - Rate limiting and throttling
 * - Response validation and sanitization
 * - Multi-model routing logic
 * - Streaming response handling
 * - Context window optimization
 * - Token usage tracking
 */

import { jest } from '@jest/globals';
import fetch from 'node-fetch';

// Mock environment variables
process.env.CLAUDE_API_KEY = 'sk-ant-test-key';
process.env.OPENAI_API_KEY = 'sk-test-openai-key';
process.env.NODE_ENV = 'test';

// Mock fetch for API calls
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock utilities
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../../utils/logger', () => ({
  logger: mockLogger
}));

// Mock cost tracking
const mockCostTracker = {
  trackTokenUsage: jest.fn(),
  getCost: jest.fn(),
  getUsageStats: jest.fn()
};

jest.mock('../../../utils/costTracker', () => mockCostTracker);

describe('Comprehensive AI Integrations Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Reset cost tracker mocks
    mockCostTracker.trackTokenUsage.mockReset();
    mockCostTracker.getCost.mockReturnValue(0.05);
    mockCostTracker.getUsageStats.mockReturnValue({
      totalTokens: 1000,
      totalCost: 0.05,
      requestCount: 1
    });
  });

  describe('Claude API Integration', () => {
    const mockClaudeResponse = {
      id: 'msg_test123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'This is a test response from Claude'
        }
      ],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 15,
        output_tokens: 8
      }
    };

    test('should successfully call Claude API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClaudeResponse,
        headers: new Map([
          ['content-type', 'application/json'],
          ['x-ratelimit-remaining', '100']
        ])
      } as any);

      const { analyzeProcessWithClaude } = await import('../../../workers/src/ai/claude');

      const result = await analyzeProcessWithClaude({
        processDescription: 'Test process description',
        fileContent: 'Test file content',
        organizationId: 'org_test123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01'
          }),
          body: expect.stringContaining('Test process description')
        })
      );

      expect(result).toEqual(expect.objectContaining({
        response: 'This is a test response from Claude',
        model: 'claude-3-sonnet-20240229',
        usage: {
          input_tokens: 15,
          output_tokens: 8
        }
      }));

      expect(mockCostTracker.trackTokenUsage).toHaveBeenCalledWith({
        provider: 'claude',
        model: 'claude-3-sonnet-20240229',
        inputTokens: 15,
        outputTokens: 8,
        organizationId: 'org_test123'
      });
    });

    test('should handle Claude API errors gracefully', async () => {
      const claudeError = {
        type: 'error',
        error: {
          type: 'rate_limit_error',
          message: 'Rate limit exceeded'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => claudeError,
        headers: new Map([
          ['retry-after', '60']
        ])
      } as any);

      const { analyzeProcessWithClaude } = await import('../../../workers/src/ai/claude');

      await expect(analyzeProcessWithClaude({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123'
      })).rejects.toThrow('Rate limit exceeded');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Claude API error',
        expect.objectContaining({
          status: 429,
          error: claudeError,
          retryAfter: 60
        })
      );
    });

    test('should respect context window limits for Claude', async () => {
      const longContent = 'x'.repeat(200000); // Very long content

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClaudeResponse
      } as any);

      const { analyzeProcessWithClaude } = await import('../../../workers/src/ai/claude');

      const result = await analyzeProcessWithClaude({
        processDescription: 'Test process',
        fileContent: longContent,
        organizationId: 'org_test123'
      });

      // Should truncate content to fit context window
      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      const messageContent = body.messages[0].content;

      expect(messageContent.length).toBeLessThan(longContent.length);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Content truncated due to context window limits',
        expect.any(Object)
      );
    });

    test('should handle streaming responses from Claude', async () => {
      const streamChunks = [
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n\n',
        'data: {"type":"message_stop"}\n\n'
      ];

      const mockStream = {
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(streamChunks[0]) })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(streamChunks[1]) })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(streamChunks[2]) })
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValueOnce(mockStream as any);

      const { analyzeProcessWithClaudeStreaming } = await import('../../../workers/src/ai/claude');

      const chunks = [];
      const onChunk = (chunk) => chunks.push(chunk);

      await analyzeProcessWithClaudeStreaming({
        processDescription: 'Test streaming',
        fileContent: 'Test content',
        organizationId: 'org_test123',
        onChunk
      });

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe('Hello');
      expect(chunks[1]).toBe(' world');
    });
  });

  describe('OpenAI API Integration', () => {
    const mockOpenAIResponse = {
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: 1699123456,
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a test response from OpenAI'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 10,
        total_tokens: 30
      }
    };

    test('should successfully call OpenAI API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOpenAIResponse
      } as any);

      const { analyzeProcessWithOpenAI } = await import('../../../workers/src/ai/openai');

      const result = await analyzeProcessWithOpenAI({
        processDescription: 'Test process description',
        fileContent: 'Test file content',
        organizationId: 'org_test123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-test-openai-key'
          })
        })
      );

      expect(result.response).toBe('This is a test response from OpenAI');
      expect(mockCostTracker.trackTokenUsage).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 20,
        outputTokens: 10,
        organizationId: 'org_test123'
      });
    });

    test('should handle OpenAI rate limits with exponential backoff', async () => {
      // First call fails with rate limit
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error'
          }
        })
      } as any);

      // Second call succeeds after retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOpenAIResponse
      } as any);

      const { analyzeProcessWithOpenAI } = await import('../../../workers/src/ai/openai');

      const result = await analyzeProcessWithOpenAI({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123'
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.response).toBe('This is a test response from OpenAI');
    });

    test('should validate OpenAI response format', async () => {
      const invalidResponse = {
        id: 'test',
        choices: [] // Empty choices array
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidResponse
      } as any);

      const { analyzeProcessWithOpenAI } = await import('../../../workers/src/ai/openai');

      await expect(analyzeProcessWithOpenAI({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123'
      })).rejects.toThrow('Invalid response format from OpenAI');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid OpenAI response format',
        expect.any(Object)
      );
    });
  });

  describe('Multi-Model Routing Logic', () => {
    test('should route to Claude for complex analysis tasks', async () => {
      const { determineOptimalModel } = await import('../../../workers/src/ai/model-router');

      const result = determineOptimalModel({
        taskType: 'process_analysis',
        contentLength: 5000,
        organizationPlan: 'premium',
        previousModelPerformance: {
          claude: { successRate: 0.95, avgResponseTime: 2000 },
          openai: { successRate: 0.88, avgResponseTime: 1500 }
        }
      });

      expect(result.selectedModel).toBe('claude');
      expect(result.reasoning).toContain('Higher success rate for complex analysis');
    });

    test('should route to OpenAI for cost-sensitive tasks', async () => {
      const { determineOptimalModel } = await import('../../../workers/src/ai/model-router');

      const result = determineOptimalModel({
        taskType: 'simple_generation',
        contentLength: 1000,
        organizationPlan: 'free',
        costBudget: 0.10,
        previousModelPerformance: {
          claude: { cost: 0.15 },
          openai: { cost: 0.08 }
        }
      });

      expect(result.selectedModel).toBe('openai');
      expect(result.reasoning).toContain('Cost optimization for free plan');
    });

    test('should implement fallback logic when primary model fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service unavailable' }})
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockOpenAIResponse
        } as any);

      const { analyzeProcessWithFallback } = await import('../../../workers/src/ai/model-router');

      const result = await analyzeProcessWithFallback({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123',
        primaryModel: 'claude',
        fallbackModel: 'openai'
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.model).toBe('openai');
      expect(result.usedFallback).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Primary model failed, using fallback',
        expect.any(Object)
      );
    });
  });

  describe('Cost Tracking and Optimization', () => {
    test('should accurately track token usage and costs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClaudeResponse
      } as any);

      const { analyzeProcessWithClaude } = await import('../../../workers/src/ai/claude');

      await analyzeProcessWithClaude({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123'
      });

      expect(mockCostTracker.trackTokenUsage).toHaveBeenCalledWith({
        provider: 'claude',
        model: 'claude-3-sonnet-20240229',
        inputTokens: 15,
        outputTokens: 8,
        organizationId: 'org_test123'
      });
    });

    test('should implement cost-based model selection', async () => {
      const { selectModelForBudget } = await import('../../../workers/src/ai/cost-optimizer');

      const result = selectModelForBudget({
        budget: 0.05,
        taskType: 'analysis',
        estimatedTokens: 1000,
        modelPricing: {
          'claude-3-sonnet': { input: 0.003, output: 0.015 },
          'gpt-4': { input: 0.01, output: 0.03 },
          'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
        }
      });

      expect(result.selectedModel).toBe('gpt-3.5-turbo');
      expect(result.estimatedCost).toBeLessThanOrEqual(0.05);
    });

    test('should warn when approaching cost limits', async () => {
      mockCostTracker.getUsageStats.mockReturnValue({
        totalCost: 0.45,
        dailyLimit: 0.50,
        organizationId: 'org_test123'
      });

      const { checkCostLimits } = await import('../../../workers/src/ai/cost-optimizer');

      const result = await checkCostLimits('org_test123');

      expect(result.nearLimit).toBe(true);
      expect(result.recommendation).toContain('switch to lower-cost model');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Organization approaching cost limit',
        expect.any(Object)
      );
    });
  });

  describe('Context Window Optimization', () => {
    test('should optimize content for different model context windows', async () => {
      const largeContent = 'word '.repeat(50000); // ~200k tokens

      const { optimizeForContextWindow } = await import('../../../workers/src/ai/context-optimizer');

      const claudeOptimized = optimizeForContextWindow(largeContent, 'claude-3-sonnet');
      const gptOptimized = optimizeForContextWindow(largeContent, 'gpt-4');

      expect(claudeOptimized.length).toBeLessThan(largeContent.length);
      expect(gptOptimized.length).toBeLessThan(largeContent.length);
      expect(claudeOptimized.length).toBeGreaterThan(gptOptimized.length); // Claude has larger context
    });

    test('should preserve important content during truncation', async () => {
      const content = `
        IMPORTANT: This is critical information.

        ${Array(10000).fill('filler content ').join('')}

        CONCLUSION: This summary is essential.
      `;

      const { optimizeForContextWindow } = await import('../../../workers/src/ai/context-optimizer');

      const optimized = optimizeForContextWindow(content, 'gpt-4');

      expect(optimized).toContain('IMPORTANT: This is critical information');
      expect(optimized).toContain('CONCLUSION: This summary is essential');
      expect(optimized.length).toBeLessThan(content.length);
    });
  });

  describe('Response Validation and Sanitization', () => {
    test('should validate and sanitize AI responses', async () => {
      const unsafeResponse = {
        ...mockClaudeResponse,
        content: [
          {
            type: 'text',
            text: 'Here is some analysis with <script>alert("xss")</script> potentially harmful content.'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => unsafeResponse
      } as any);

      const { analyzeProcessWithClaude } = await import('../../../workers/src/ai/claude');

      const result = await analyzeProcessWithClaude({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123'
      });

      // Should sanitize the response
      expect(result.response).not.toContain('<script>');
      expect(result.response).toContain('potentially harmful content');
    });

    test('should detect and handle inappropriate content', async () => {
      const inappropriateResponse = {
        ...mockClaudeResponse,
        content: [
          {
            type: 'text',
            text: 'This response contains inappropriate content that violates policies.'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => inappropriateResponse
      } as any);

      const { validateResponse } = await import('../../../workers/src/ai/response-validator');

      const validation = validateResponse(inappropriateResponse.content[0].text);

      expect(validation.isAppropriate).toBe(false);
      expect(validation.issues).toContain('policy_violation');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'AI response flagged for inappropriate content',
        expect.any(Object)
      );
    });

    test('should validate response completeness', async () => {
      const incompleteResponse = {
        ...mockClaudeResponse,
        content: [
          {
            type: 'text',
            text: 'This analysis is incomplete...' // Ends abruptly
          }
        ],
        stop_reason: 'max_tokens'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => incompleteResponse
      } as any);

      const { validateResponseCompleteness } = await import('../../../workers/src/ai/response-validator');

      const validation = validateResponseCompleteness(incompleteResponse);

      expect(validation.isComplete).toBe(false);
      expect(validation.reason).toBe('max_tokens');
      expect(validation.recommendation).toContain('retry with shorter input');
    });
  });

  describe('Performance Monitoring and Analytics', () => {
    test('should track response times and success rates', async () => {
      const startTime = Date.now();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return mockClaudeResponse;
        }
      } as any);

      const { analyzeProcessWithClaude } = await import('../../../workers/src/ai/claude');

      await analyzeProcessWithClaude({
        processDescription: 'Test process',
        fileContent: 'Test content',
        organizationId: 'org_test123'
      });

      const endTime = Date.now();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'AI request completed',
        expect.objectContaining({
          provider: 'claude',
          responseTime: expect.any(Number),
          success: true,
          organizationId: 'org_test123'
        })
      );
    });

    test('should collect model performance metrics', async () => {
      const { collectPerformanceMetrics } = await import('../../../workers/src/ai/analytics');

      const metrics = collectPerformanceMetrics({
        provider: 'claude',
        model: 'claude-3-sonnet',
        responseTime: 1500,
        inputTokens: 100,
        outputTokens: 50,
        success: true,
        organizationId: 'org_test123'
      });

      expect(metrics).toMatchObject({
        timestamp: expect.any(Date),
        provider: 'claude',
        model: 'claude-3-sonnet',
        responseTime: 1500,
        tokensPerSecond: expect.any(Number),
        success: true,
        costEfficiency: expect.any(Number)
      });
    });
  });

  describe('Error Recovery and Circuit Breaker', () => {
    test('should implement circuit breaker for repeated failures', async () => {
      // Simulate multiple failures
      mockFetch.mockRejectedValue(new Error('API Error')).mockRejectedValue(new Error('API Error')).mockRejectedValue(new Error('API Error'));

      const { CircuitBreaker } = await import('../../../workers/src/ai/circuit-breaker');
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        timeout: 60000
      });

      await expect(breaker.execute(async () => {
        throw new Error('API Error');
      })).rejects.toThrow('API Error');

      await expect(breaker.execute(async () => {
        throw new Error('API Error');
      })).rejects.toThrow('API Error');

      await expect(breaker.execute(async () => {
        throw new Error('API Error');
      })).rejects.toThrow('API Error');

      // Fourth call should be rejected due to circuit breaker
      await expect(breaker.execute(async () => {
        return 'success';
      })).rejects.toThrow('Circuit breaker is OPEN');

      expect(breaker.state).toBe('OPEN');
    });

    test('should recover from circuit breaker after timeout', async () => {
      const { CircuitBreaker } = await import('../../../workers/src/ai/circuit-breaker');
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        timeout: 100 // Short timeout for testing
      });

      // Trigger circuit breaker
      await expect(breaker.execute(() => Promise.reject(new Error('Fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('Fail')))).rejects.toThrow();

      expect(breaker.state).toBe('OPEN');

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow one test request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClaudeResponse
      } as any);

      const result = await breaker.execute(() => Promise.resolve('success'));

      expect(result).toBe('success');
      expect(breaker.state).toBe('CLOSED');
    });
  });
});