// Test rate limiter to ensure it doesn't break user flow
const { rateLimiters } = require('./utils/rateLimiter');

function mockRequest(ip = '127.0.0.1') {
  return {
    headers: { 'x-forwarded-for': ip },
    connection: { remoteAddress: ip }
  };
}

function mockResponse() {
  const headers = {};
  return {
    setHeader: (key, value) => { headers[key] = value; },
    status: (code) => ({
      json: (data) => ({ status: code, data, headers })
    }),
    headers
  };
}

async function testRateLimiter() {
  console.log('🚦 Testing rate limiter...');
  
  const req = mockRequest();
  const res = mockResponse();
  
  // Test expensive operations limit (should allow 20 requests per 5 minutes)
  console.log('\n📊 Testing expensive operations rate limit...');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const allowed = await rateLimiters.expensive(req, res);
      console.log(`Request ${i}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
      
      if (!allowed) {
        console.log('Headers:', res.headers);
        break;
      }
    } catch (error) {
      console.error(`Request ${i}: Error -`, error.message);
    }
  }
  
  // Test API operations limit (should allow 30 requests per minute)
  console.log('\n📊 Testing API operations rate limit...');
  
  const apiReq = mockRequest('192.168.1.1'); // Different IP
  const apiRes = mockResponse();
  
  for (let i = 1; i <= 5; i++) {
    try {
      const allowed = await rateLimiters.api(apiReq, apiRes);
      console.log(`API Request ${i}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
      
      if (!allowed) {
        console.log('Headers:', apiRes.headers);
        break;
      }
    } catch (error) {
      console.error(`API Request ${i}: Error -`, error.message);
    }
  }
  
  console.log('\n📋 Rate limiter configuration:');
  console.log('- Expensive operations: 20 requests per 5 minutes');
  console.log('- API operations: 30 requests per minute');
  console.log('- Read operations: 100 requests per minute');
  console.log('- Upload operations: 10 requests per 10 minutes');
}

testRateLimiter().catch(console.error);