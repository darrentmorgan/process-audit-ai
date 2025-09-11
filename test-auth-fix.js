#!/usr/bin/env node

/**
 * Test Authentication Fix
 * Validates that Clerk authentication and report saving works after database fix
 */

const { createClient } = require('@supabase/supabase-js');
const { clerkUserIdToUUID, getDBUserId, isUUID } = require('./utils/clerkUtils.js');

// Test configuration
const MOCK_CLERK_USER_ID = 'user_32G74SDMg15lICuFS01ctdTNgFj'; // Example Clerk ID
const TEST_REPORT_DATA = {
  title: 'Authentication Test Report',
  processDescription: 'Testing authentication fix',
  fileContent: null,
  answers: { test: true },
  report: { executiveSummary: 'Test passed' }
};

async function testAuthenticationFix() {
  console.log('🧪 Testing ProcessAudit AI Authentication Fix');
  console.log('===========================================');
  
  try {
    // 1. Test UUID conversion
    console.log('\n1️⃣ Testing UUID Conversion...');
    const convertedUUID = clerkUserIdToUUID(MOCK_CLERK_USER_ID);
    console.log(`   Clerk ID: ${MOCK_CLERK_USER_ID}`);
    console.log(`   Converted UUID: ${convertedUUID}`);
    console.log(`   Is valid UUID: ${isUUID(convertedUUID)}`);
    
    if (!isUUID(convertedUUID)) {
      throw new Error('UUID conversion failed');
    }
    console.log('   ✅ UUID conversion working correctly');
    
    // 2. Test getDBUserId function
    console.log('\n2️⃣ Testing getDBUserId Function...');
    const dbUserId = getDBUserId(MOCK_CLERK_USER_ID);
    console.log(`   DB User ID: ${dbUserId}`);
    console.log(`   Matches converted UUID: ${dbUserId === convertedUUID}`);
    
    if (dbUserId !== convertedUUID) {
      throw new Error('getDBUserId function not working correctly');
    }
    console.log('   ✅ getDBUserId function working correctly');
    
    // 3. Test Supabase configuration
    console.log('\n3️⃣ Testing Supabase Configuration...');
    
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl) {
      console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
      console.log('   📋 Manual fix required - see instructions below');
      return false;
    }
    
    console.log(`   Supabase URL: ${supabaseUrl}`);
    
    if (!supabaseServiceKey) {
      console.log('   ❌ SUPABASE_SERVICE_KEY not found in .env.local');
      console.log('   📋 Manual fix required - see instructions below');
      return false;
    }
    
    console.log(`   Service Key: ${supabaseServiceKey.substring(0, 10)}...`);
    
    // 4. Test database connection and structure
    console.log('\n4️⃣ Testing Database Connection...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test basic connectivity
    const { data: tables, error: tablesError } = await supabase
      .from('audit_reports')
      .select('id')
      .limit(1);
      
    if (tablesError) {
      console.log(`   ❌ Database connection error: ${tablesError.message}`);
      return false;
    }
    
    console.log('   ✅ Database connection successful');
    
    // 5. Test report insertion with converted UUID
    console.log('\n5️⃣ Testing Report Insertion...');
    
    const testData = {
      user_id: dbUserId,
      ...TEST_REPORT_DATA,
      created_at: new Date().toISOString()
    };
    
    console.log(`   Attempting to insert with user_id: ${testData.user_id}`);
    
    const { data: insertData, error: insertError } = await supabase
      .from('audit_reports')
      .insert([testData])
      .select();
      
    if (insertError) {
      console.log(`   ❌ Insert error: ${insertError.message}`);
      console.log(`   Error code: ${insertError.code}`);
      console.log(`   Error details: ${insertError.details}`);
      
      if (insertError.message.includes('invalid input syntax for type uuid')) {
        console.log('   🔧 This indicates the database fix has not been applied yet');
      }
      
      return false;
    }
    
    console.log('   ✅ Report insertion successful');
    console.log(`   Inserted report ID: ${insertData[0]?.id}`);
    
    // 6. Clean up test data
    if (insertData && insertData[0]) {
      await supabase
        .from('audit_reports')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   🧹 Test data cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

function printManualInstructions() {
  console.log('\n📋 MANUAL FIX INSTRUCTIONS');
  console.log('==========================');
  console.log('\n🔧 To apply the database fix manually:');
  console.log('\n1. Go to your Supabase dashboard: https://app.supabase.com');
  console.log('2. Navigate to your project: khodniyhethjyomscyjw');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy the contents of SUPABASE_MANUAL_FIX.sql');
  console.log('5. Paste into SQL Editor and run');
  console.log('\n🔑 If you have the service key:');
  console.log('1. Add SUPABASE_SERVICE_KEY to your .env.local file');
  console.log('2. Run: ./apply-supabase-fix.sh');
  console.log('\n📊 To get your service key:');
  console.log('1. Go to Project Settings > API');
  console.log('2. Copy the "service_role" key (NOT the anon key)');
  console.log('3. Add to .env.local: SUPABASE_SERVICE_KEY=your_service_key_here');
}

function printSuccessMessage() {
  console.log('\n🎉 SUCCESS! Authentication Fix is Working');
  console.log('=========================================');
  console.log('\n✅ All tests passed! Your ProcessAudit AI authentication should now work:');
  console.log('   - Clerk user IDs convert to valid UUIDs');
  console.log('   - Database accepts the converted UUIDs');
  console.log('   - Report saving should work without errors');
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start your development server: npm run dev');
  console.log('   2. Sign in with Clerk');
  console.log('   3. Complete a process audit');
  console.log('   4. Try saving the report');
  console.log('\n🔍 If you still see issues:');
  console.log('   - Check browser console for error messages');
  console.log('   - Look for any remaining UUID-related errors');
  console.log('   - Verify your Clerk configuration is correct');
}

// Run the test
async function main() {
  const success = await testAuthenticationFix();
  
  if (success) {
    printSuccessMessage();
  } else {
    printManualInstructions();
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAuthenticationFix };