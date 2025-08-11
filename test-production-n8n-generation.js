#!/usr/bin/env node

/**
 * Production n8n Workflow Generation Test
 * 
 * Tests the complete automation generation flow using production Cloudflare Workers.
 * This test bypasses the Next.js API layer and directly tests:
 * 1. Job creation in Supabase
 * 2. Worker submission and processing
 * 3. Status polling and completion
 * 4. Generated workflow validation
 * 
 * Uses real fixtures data similar to baseline/candidate examples.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  workerUrl: process.env.CLOUDFLARE_WORKER_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  pollInterval: 2000, // 2 seconds
  maxPollAttempts: 60 // 2 minutes max wait
};

// Test data based on fixtures - similar to appeal processing workflow
const TEST_DATA = {
  processData: {
    processDescription: "Insurance appeal processing workflow",
    businessContext: {
      industry: "Insurance",
      department: "Claims Processing", 
      volume: "100-500 appeals per month",
      complexity: "Medium - requires API calls and email notifications"
    }
  },
  automationOpportunities: [
    {
      stepDescription: "Receive appeal submission via webhook",
      automationSolution: "webhook_trigger",
      priority: "high",
      estimatedSavings: 2
    },
    {
      stepDescription: "Submit appeal to external processing API", 
      automationSolution: "api_integration",
      priority: "high",
      estimatedSavings: 5
    },
    {
      stepDescription: "Transform response data and send notification email",
      automationSolution: "email_automation", 
      priority: "medium",
      estimatedSavings: 3
    }
  ],
  automationType: "n8n"
};

class ProductionN8nTester {
  constructor() {
    this.supabase = null;
    this.results = {
      startTime: Date.now(),
      jobId: null,
      status: null,
      workflow: null,
      errors: []
    };
  }

  async initialize() {
    console.log('🚀 Starting Production n8n Generation Test');
    console.log('=' .repeat(60));
    
    // Validate configuration
    if (!CONFIG.workerUrl) {
      throw new Error('CLOUDFLARE_WORKER_URL environment variable is required');
    }
    
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
      throw new Error('Supabase configuration is required (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
    }
    
    if (CONFIG.supabaseKey === 'your_service_role_key_here') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Please set a valid service role key in .env.local');
    }
    
    // Initialize Supabase client
    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    
    console.log(`✅ Configuration validated`);
    console.log(`   Worker URL: ${CONFIG.workerUrl}`);
    console.log(`   Supabase URL: ${CONFIG.supabaseUrl}`);
  }

  async createJob() {
    console.log('\n📝 Creating job record in Supabase...');
    
    const jobId = uuidv4();
    const { data, error } = await this.supabase
      .from('automation_jobs')
      .insert({
        id: jobId,
        audit_report_id: null,
        user_id: null,
        automation_type: 'n8n',
        status: 'queued', 
        progress: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    this.results.jobId = jobId;
    console.log(`✅ Job created with ID: ${jobId}`);
    return data;
  }

  async submitToWorker(job) {
    console.log('\n🔄 Submitting job to Cloudflare Worker...');
    
    const response = await fetch(`${CONFIG.workerUrl}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: job.id,
        processData: TEST_DATA.processData,
        automationOpportunities: TEST_DATA.automationOpportunities,
        automationType: TEST_DATA.automationType
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker submission failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Job submitted to worker successfully`);
    console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    
    return result;
  }

  async pollForCompletion() {
    console.log('\n⏳ Polling for job completion...');
    
    let attempts = 0;
    
    while (attempts < CONFIG.maxPollAttempts) {
      attempts++;
      
      // Get job status from Supabase
      const { data: job, error } = await this.supabase
        .from('automation_jobs')
        .select('*')
        .eq('id', this.results.jobId)
        .single();

      if (error) {
        console.error(`   ❌ Error fetching job status: ${error.message}`);
        await this.sleep(CONFIG.pollInterval);
        continue;
      }

      const progress = job.progress || 0;
      const status = job.status;
      
      console.log(`   📊 Attempt ${attempts}/${CONFIG.maxPollAttempts}: Status=${status}, Progress=${progress}%`);
      
      if (status === 'completed') {
        console.log(`✅ Job completed successfully!`);
        
        // Get the generated automation
        const { data: automation } = await this.supabase
          .from('generated_automations')
          .select('*')
          .eq('job_id', this.results.jobId)
          .single();
        
        this.results.status = 'completed';
        this.results.workflow = automation;
        return automation;
      }
      
      if (status === 'failed') {
        const errorMsg = job.error_message || 'Unknown error';
        throw new Error(`Job failed: ${errorMsg}`);
      }
      
      await this.sleep(CONFIG.pollInterval);
    }
    
    throw new Error(`Job timed out after ${CONFIG.maxPollAttempts} attempts`);
  }

  async validateWorkflow(automation) {
    console.log('\n🔍 Validating generated workflow...');
    
    if (!automation || !automation.workflow_data) {
      throw new Error('No workflow data found in automation result');
    }
    
    const workflow = automation.workflow_data.workflow_json;
    
    if (!workflow) {
      throw new Error('No workflow_json found in automation data');
    }
    
    // Basic structure validation
    const requiredFields = ['name', 'nodes', 'connections'];
    for (const field of requiredFields) {
      if (!workflow[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Node validation
    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }
    
    // Check for expected node types based on test data
    const nodeTypes = workflow.nodes.map(node => node.type);
    const hasWebhook = nodeTypes.some(type => type.includes('webhook'));
    const hasHttp = nodeTypes.some(type => type.includes('httpRequest'));
    const hasEmail = nodeTypes.some(type => type.includes('emailSend'));
    
    console.log(`✅ Workflow validation passed:`);
    console.log(`   📦 Total nodes: ${workflow.nodes.length}`);
    console.log(`   🌐 Has webhook trigger: ${hasWebhook ? '✅' : '❌'}`);
    console.log(`   📡 Has HTTP request: ${hasHttp ? '✅' : '❌'}`);
    console.log(`   📧 Has email notification: ${hasEmail ? '✅' : '❌'}`);
    
    // Log workflow summary
    console.log('\n📋 Workflow Summary:');
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Nodes: ${workflow.nodes.map(n => n.name).join(' → ')}`);
    
    return {
      isValid: true,
      nodeCount: workflow.nodes.length,
      hasWebhook,
      hasHttp,
      hasEmail,
      workflow
    };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (this.results.jobId && this.supabase) {
      // Delete generated automation
      await this.supabase
        .from('generated_automations')
        .delete()
        .eq('job_id', this.results.jobId);
      
      // Delete job record
      await this.supabase
        .from('automation_jobs')
        .delete()
        .eq('id', this.results.jobId);
      
      console.log(`✅ Cleaned up job ${this.results.jobId}`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    const duration = Date.now() - this.results.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`🆔 Job ID: ${this.results.jobId}`);
    console.log(`📊 Final Status: ${this.results.status || 'unknown'}`);
    
    if (this.results.errors.length > 0) {
      console.log(`❌ Errors: ${this.results.errors.length}`);
      this.results.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    } else {
      console.log(`✅ No errors detected`);
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const job = await this.createJob();
      await this.submitToWorker(job);
      const automation = await this.pollForCompletion();
      await this.validateWorkflow(automation);
      
      this.results.status = 'success';
      
    } catch (error) {
      console.error(`\n❌ Test failed: ${error.message}`);
      this.results.errors.push(error.message);
      this.results.status = 'failed';
    } finally {
      this.printResults();
      await this.cleanup();
    }
    
    // Exit with proper code
    process.exit(this.results.errors.length > 0 ? 1 : 0);
  }
}

// Run the test
if (require.main === module) {
  const tester = new ProductionN8nTester();
  tester.run().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = ProductionN8nTester;