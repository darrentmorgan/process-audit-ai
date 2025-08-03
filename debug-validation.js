// Debug validation issues
const { validateRequestBody, sanitizeInput } = require('./utils/validation');

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

  console.log('🧪 Testing NEW analyze-process validation logic...');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    // Simulate the new validation logic
    const { processDescription, fileContent, answers } = testPayload;
    
    // Validate required fields
    if (!answers || typeof answers !== 'object') {
      throw new Error('Answers object is required');
    }

    if (!processDescription && !fileContent) {
      throw new Error('Process description or file content is required');
    }

    if (Object.keys(answers).length === 0) {
      throw new Error('Answers are required');
    }
    
    // Sanitize text inputs if they exist
    const sanitizedDescription = processDescription ? sanitizeInput.processDescription(processDescription) : '';
    const sanitizedFileContent = fileContent ? sanitizeInput.text(fileContent) : '';
    
    console.log('✅ NEW validation passed!');
    console.log('Sanitized description length:', sanitizedDescription.length);
    console.log('Answers keys:', Object.keys(answers));
    console.log('Answers preserved:', JSON.stringify(answers, null, 2));
  } catch (error) {
    console.error('❌ NEW validation failed:', error.message);
  }
}

function testSanitization() {
  console.log('\n🧹 Testing sanitization...');
  
  const testInputs = [
    'Normal text',
    '<script>alert("xss")</script>Normal text',
    'Text with "quotes" and special chars!',
    '',
    null,
    undefined
  ];
  
  testInputs.forEach(input => {
    try {
      const result = sanitizeInput.text(input);
      console.log(`Input: "${input}" => Output: "${result}"`);
    } catch (error) {
      console.log(`Input: "${input}" => Error: ${error.message}`);
    }
  });
}

// Run tests
testAnalyzeProcessPayload();
testSanitization();