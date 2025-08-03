// Comprehensive API endpoint testing
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testGenerateQuestions() {
  console.log('🔍 Testing /api/generate-questions...');
  
  const payload = {
    processDescription: 'Invoice processing workflow that involves manual data entry, approval steps, and report generation',
    fileContent: ''
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Generate questions SUCCESS');
      console.log(`   Status: ${response.status}`);
      console.log(`   Questions count: ${result.questions?.length || 0}`);
      console.log(`   First question: ${result.questions?.[0]?.question || 'N/A'}`);
      return result.questions;
    } else {
      console.log('❌ Generate questions FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Generate questions ERROR');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function testAnalyzeProcess(questions) {
  console.log('\n📊 Testing /api/analyze-process...');
  
  // Create sample answers based on questions or use defaults
  const sampleAnswers = {
    frequency: 'Daily',
    time_spent: '1-2 hours',
    people_involved: 3,
    current_tools: 'Excel, Email, Accounting software',
    pain_points: 'Manual data entry takes too long and is error-prone',
    manual_steps: 'Data entry, validation, approval routing',
    data_entry: 'Yes, frequently',
    approval_workflows: 'Yes, multiple approvals'
  };
  
  const payload = {
    processDescription: 'Invoice processing workflow that involves manual data entry, approval steps, and report generation',
    fileContent: '',
    answers: sampleAnswers
  };
  
  try {
    console.log('   Sending payload...');
    const response = await fetch(`${BASE_URL}/api/analyze-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Analyze process SUCCESS');
      console.log(`   Status: ${response.status}`);
      console.log(`   Report generated: ${!!result.report}`);
      console.log(`   Quick wins: ${result.report?.executiveSummary?.quickWins || 'N/A'}`);
      console.log(`   Time savings: ${result.report?.executiveSummary?.totalTimeSavings || 'N/A'}`);
      console.log(`   Opportunities count: ${result.report?.automationOpportunities?.length || 0}`);
      return result.report;
    } else {
      console.log('❌ Analyze process FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Analyze process ERROR');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function testFullWorkflow() {
  console.log('🚀 Starting full API workflow test...\n');
  
  // Test 1: Generate questions
  const questions = await testGenerateQuestions();
  
  // Test 2: Analyze process
  const report = await testAnalyzeProcess(questions);
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`   Generate Questions: ${questions ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Analyze Process: ${report ? '✅ PASS' : '❌ FAIL'}`);
  
  if (questions && report) {
    console.log('\n🎉 All tests PASSED! The API endpoints are working correctly.');
    return true;
  } else {
    console.log('\n💥 Some tests FAILED! Check the errors above.');
    return false;
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/`);
    if (response.ok) {
      console.log('✅ Server is running at http://localhost:3000\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Server not running at http://localhost:3000');
    console.log('   Please start the server with: npm run dev\n');
    return false;
  }
}

// Run tests
async function runTests() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  const success = await testFullWorkflow();
  process.exit(success ? 0 : 1);
}

runTests();