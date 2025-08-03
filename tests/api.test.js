// API endpoint tests to verify security updates don't break functionality
const { validateRequestBody, sanitizeInput } = require('../utils/validation');

describe('API Security Tests', () => {
  describe('Validation Utils', () => {
    test('should validate valid analyze-process request body', () => {
      const validBody = {
        processDescription: 'Test process description',
        fileContent: 'Some file content',
        answers: {
          frequency: 'Daily',
          time_spent: '1-2 hours',
          current_tools: 'Excel, Email'
        }
      };

      const schema = {
        processDescription: { type: 'string', maxLength: 10000 },
        fileContent: { type: 'string', maxLength: 50000 },
        answers: { type: 'object', required: true }
      };

      expect(() => validateRequestBody(validBody, schema)).not.toThrow();
    });

    test('should handle missing optional fields', () => {
      const bodyWithoutFileContent = {
        processDescription: 'Test process description',
        answers: {
          frequency: 'Daily'
        }
      };

      const schema = {
        processDescription: { type: 'string', maxLength: 10000 },
        fileContent: { type: 'string', maxLength: 50000 },
        answers: { type: 'object', required: true }
      };

      expect(() => validateRequestBody(bodyWithoutFileContent, schema)).not.toThrow();
    });

    test('should sanitize text input properly', () => {
      const maliciousInput = '<script>alert("xss")</script>Normal text';
      const sanitized = sanitizeInput.text(maliciousInput);
      expect(sanitized).toBe('Normal text');
      expect(sanitized).not.toContain('<script>');
    });

    test('should handle process description with reasonable content', () => {
      const processDesc = 'Our invoice processing involves:\n1. Receiving invoices via email\n2. Manual data entry\n3. Approval workflow';
      const sanitized = sanitizeInput.processDescription(processDesc);
      expect(sanitized).toBeTruthy();
      expect(sanitized.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiter', () => {
    test('should allow requests within limits', () => {
      // This would need actual rate limiter testing
      // For now, just verify the structure exists
      const { rateLimiters } = require('../utils/rateLimiter');
      expect(rateLimiters).toBeDefined();
      expect(rateLimiters.expensive).toBeDefined();
      expect(rateLimiters.api).toBeDefined();
    });
  });
});

// Manual test helper functions for debugging
function testAnalyzeProcessPayload() {
  const testPayload = {
    processDescription: 'Invoice processing workflow that involves manual data entry and approval steps',
    fileContent: '',
    answers: {
      frequency: 'Daily',
      time_spent: '1-2 hours',
      people_involved: 3,
      current_tools: 'Excel, Email, Accounting software',
      pain_points: 'Manual data entry takes too long and is error-prone',
      manual_steps: 'Data entry, validation, approval routing',
      data_entry: 'Yes, frequently',
      approval_workflows: 'Yes, multiple approvals'
    }
  };

  console.log('Test payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const schema = {
      processDescription: { type: 'string', maxLength: 10000 },
      fileContent: { type: 'string', maxLength: 50000 },
      answers: { type: 'object', required: true }
    };
    
    const result = validateRequestBody(testPayload, schema);
    console.log('Validation passed:', result);
  } catch (error) {
    console.error('Validation failed:', error.message);
  }
}

function testGenerateQuestionsPayload() {
  const testPayload = {
    processDescription: 'Invoice processing workflow',
    fileContent: ''
  };

  console.log('Generate questions payload:', JSON.stringify(testPayload, null, 2));
}

// Export test functions for manual debugging
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testAnalyzeProcessPayload,
    testGenerateQuestionsPayload
  };
}