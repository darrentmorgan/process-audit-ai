/**
 * Mock SOP Data Fixtures for Automated Testing
 * 
 * Realistic business process data for testing save report functionality
 * and complete workflow automation
 */

export const MOCK_SOP_CUSTOMER_SUPPORT = {
  processDescription: `Customer Support Ticket Management Process

Our customer support team handles incoming inquiries through multiple channels including email, live chat, phone calls, and web portal submissions. The process involves:

1. Initial ticket intake and logging
2. Priority assessment and categorization  
3. Assignment to appropriate support tier
4. Investigation and resolution
5. Customer follow-up and satisfaction tracking

Current challenges include:
- Manual ticket routing causing delays
- Inconsistent response times across priorities
- Lack of standardized response templates
- No automated escalation procedures
- Limited visibility into team performance metrics

The team handles approximately 150-200 tickets daily with 8 support agents across 3 tiers (L1, L2, L3 support).`,

  expectedAnalysis: {
    sopAssessment: {
      overallScore: 65,
      completenessScore: 60,
      clarityScore: 70,
      efficiencyScore: 55,
      complianceReadiness: "Good"
    },
    automationOpportunities: [
      {
        stepDescription: "Manual ticket routing",
        automationSolution: "AI-powered ticket classification and routing",
        priority: 90,
        annualSavings: "$25,000",
        timeSavings: "10 minutes per ticket"
      },
      {
        stepDescription: "Response template generation", 
        automationSolution: "Automated response templates with dynamic content",
        priority: 85,
        annualSavings: "$18,000",
        timeSavings: "5 minutes per response"
      }
    ]
  },

  questionAnswers: {
    "1": "150-200 tickets daily, 8 support agents across 3 tiers",
    "2": ["GDPR", "ISO 27001", "Internal policies"],
    "3": "Automated ticket routing and classification",
    "4": "Zendesk for ticketing, Slack for communication, Salesforce for CRM, custom reporting dashboard",
    "5": "P1: 15min response, P2: 2hrs response, P3: 8hrs response, 95% resolution within SLA",
    "6": ["Dedicated IT team", "Budget for new tools/systems", "Training resources"]
  },

  expectedTitle: "Customer Support Optimization - ProcessAudit AI"
};

export const MOCK_SOP_INVOICE_PROCESSING = {
  processDescription: `Invoice Processing Workflow for Accounts Payable

Complete invoice lifecycle management from vendor invoice receipt through payment processing:

1. Invoice Receipt and Digital Capture
   - Email-based invoice collection
   - Physical document scanning
   - Portal submissions from vendors

2. Data Extraction and Validation
   - Manual data entry from invoices
   - Purchase order matching
   - Approval routing based on amount thresholds

3. Approval Workflow Management
   - Multi-level approval chain
   - Exception handling for discrepancies
   - Vendor communication for clarifications

4. Payment Processing and Record Keeping
   - Payment authorization and execution
   - Vendor notification and confirmation
   - Financial record updating

Current pain points:
- 90% manual data entry leading to errors
- Average 5-day approval cycle
- No automated PO matching
- Limited visibility into approval bottlenecks
- Manual vendor communication

Processing volume: 300-400 invoices monthly, 3 AP specialists, 5 approval managers.`,

  expectedAnalysis: {
    sopAssessment: {
      overallScore: 55,
      completenessScore: 65,
      clarityScore: 60,
      efficiencyScore: 45,
      complianceReadiness: "Fair"
    },
    automationOpportunities: [
      {
        stepDescription: "Invoice data extraction",
        automationSolution: "OCR and AI-powered invoice processing",
        priority: 95,
        annualSavings: "$45,000",
        timeSavings: "20 minutes per invoice"
      },
      {
        stepDescription: "Purchase order matching",
        automationSolution: "Automated 3-way matching system",
        priority: 88,
        annualSavings: "$28,000", 
        timeSavings: "15 minutes per invoice"
      },
      {
        stepDescription: "Approval routing",
        automationSolution: "Rules-based approval workflow automation",
        priority: 82,
        annualSavings: "$22,000",
        timeSavings: "30 minutes per approval cycle"
      }
    ]
  },

  questionAnswers: {
    "1": "300-400 invoices monthly, 3 AP specialists, 5 approval managers", 
    "2": ["SOX compliance", "Internal control policies"],
    "3": "Automated data entry and validation",
    "4": "ERP system, email, Excel spreadsheets, DocuSign for approvals",
    "5": "Reduce processing time from 5 days to 2 days, 99% accuracy, 100% SOX compliance",
    "6": ["Budget limitations", "Integration capabilities with existing systems"]
  },

  expectedTitle: "Invoice Processing Automation Analysis"
};

export const MOCK_SOP_SIMPLE = {
  processDescription: "Daily team standup meeting process including agenda preparation, meeting execution, and action item tracking.",
  
  questionAnswers: {
    "1": "Daily process, 8 team members",
    "2": ["Internal policies only"],
    "3": "Faster process execution", 
    "4": "Slack, Jira, meeting room booking system",
    "5": "30-minute meeting duration, 100% attendance, all action items tracked",
    "6": ["Time constraints"]
  },

  expectedTitle: "Daily Standup Process Optimization"
};

/**
 * Test user data for authentication testing
 */
export const MOCK_TEST_USER = {
  id: 'user_test123mockuser456',
  firstName: 'Test',
  lastName: 'User', 
  emailAddresses: [
    { emailAddress: 'test.user@processaudit.ai' }
  ]
};

/**
 * Expected report structure after saving
 */
export const EXPECTED_REPORT_STRUCTURE = {
  id: 'string',
  user_id: 'string', 
  title: 'string',
  process_description: 'string',
  answers: 'object',
  report_data: 'object',
  created_at: 'string',
  updated_at: 'string'
};

/**
 * Mock automation opportunities for testing
 */
export const MOCK_AUTOMATION_OPPORTUNITIES = [
  {
    stepDescription: "Manual data entry",
    automationSolution: "Automated form processing", 
    priority: 90,
    annualSavings: "$15,000",
    timeSavings: "2 hours per day",
    tools: ["Zapier", "Microsoft Power Automate"],
    implementationSteps: [
      "Set up form automation",
      "Configure data validation",
      "Test automation workflow"
    ]
  },
  {
    stepDescription: "Email notifications",
    automationSolution: "Triggered email automation",
    priority: 75, 
    annualSavings: "$8,000",
    timeSavings: "1 hour per day",
    tools: ["Email automation platform", "CRM integration"],
    implementationSteps: [
      "Create email templates", 
      "Set up trigger conditions",
      "Configure recipient rules"
    ]
  }
];

export default {
  MOCK_SOP_CUSTOMER_SUPPORT,
  MOCK_SOP_INVOICE_PROCESSING,
  MOCK_SOP_SIMPLE,
  MOCK_TEST_USER,
  EXPECTED_REPORT_STRUCTURE,
  MOCK_AUTOMATION_OPPORTUNITIES
};