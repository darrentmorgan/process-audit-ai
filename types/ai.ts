/**
 * AI Model Types for ProcessAudit AI
 * 
 * Type definitions for GPT-5 and Claude API integration
 * Supporting both OpenAI and Anthropic models with intelligent routing
 */

export interface AIModelConfig {
  /** Model provider */
  provider: 'openai' | 'claude';
  /** Specific model name */
  model: string;
  /** Maximum output tokens */
  maxTokens: number;
  /** Sampling temperature (0-1) */
  temperature: number;
  /** API endpoint URL */
  apiUrl?: string;
  /** Additional model-specific parameters */
  parameters?: Record<string, unknown>;
}

export interface OpenAIModelConfig extends AIModelConfig {
  provider: 'openai';
  /** GPT-5 model identifier */
  model: 'gpt-5' | 'gpt-5-mini' | 'gpt-4' | 'gpt-4-mini';
  /** OpenAI-specific parameters */
  parameters?: {
    /** Response format for structured output */
    response_format?: { type: 'json_object' | 'text' };
    /** System message for context */
    system?: string;
    /** Tool/function calling parameters */
    tools?: Array<any>;
  };
}

export interface ClaudeModelConfig extends AIModelConfig {
  provider: 'claude';
  /** Claude model identifier */
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229';
  /** Claude-specific parameters */
  parameters?: {
    /** System prompt for context */
    system?: string;
    /** Tool use configuration */
    tools?: Array<any>;
  };
}

export interface AIModelRequest {
  /** The prompt/message to send */
  prompt: string;
  /** Model configuration */
  config: AIModelConfig;
  /** Request tier for model selection */
  tier?: 'orchestrator' | 'agent';
  /** Complexity level for model routing */
  complexity?: 'simple' | 'complex';
  /** Organization context for preferences */
  organizationContext?: OrganizationModelContext;
}

export interface OrganizationModelContext {
  /** Organization ID */
  organizationId?: string;
  /** Organization plan level */
  plan?: 'free' | 'pro' | 'enterprise';
  /** Custom model preferences */
  preferences?: {
    /** Preferred model provider */
    preferredProvider?: 'openai' | 'claude';
    /** Fallback provider */
    fallbackProvider?: 'openai' | 'claude';
    /** Custom token limits */
    maxTokens?: number;
    /** Custom temperature */
    temperature?: number;
  };
}

export interface AIModelResponse {
  /** Success status */
  success: boolean;
  /** Response content */
  content: string;
  /** Model used for the request */
  modelUsed: string;
  /** Provider used */
  provider: 'openai' | 'claude';
  /** Token usage information */
  usage?: {
    /** Input tokens consumed */
    inputTokens: number;
    /** Output tokens generated */
    outputTokens: number;
    /** Total tokens */
    totalTokens: number;
  };
  /** Response time in milliseconds */
  responseTime: number;
  /** Any errors encountered */
  error?: string;
  /** Error details for debugging */
  errorDetails?: unknown;
}

export interface ProcessAnalysisRequest {
  /** Process description from user */
  processDescription: string;
  /** Discovery question answers */
  answers?: Record<string, any>;
  /** File content if uploaded */
  fileContent?: string;
  /** Organization context for model routing */
  organizationContext?: OrganizationModelContext;
}

export interface ProcessAnalysisResponse {
  /** Executive summary of findings */
  executiveSummary: {
    totalTimeSavings: string;
    quickWins: number;
    strategicOpportunities: number;
    estimatedROI: string;
    implementationCost: string;
    paybackPeriod: string;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
  /** Automation opportunities identified */
  automationOpportunities: Array<{
    id: number;
    processStep: string;
    solution: string;
    timeSavings: string;
    frequency: string;
    annualSavings: string;
    effort: 'Low' | 'Medium' | 'High';
    implementationCost: string;
    tools: string[];
    priority: number;
    category: 'quick-win' | 'strategic' | 'transformational';
    technicalRequirements: string[];
    implementationSteps: string[];
    risks: string[];
    successMetrics: string[];
    roi: string;
    paybackPeriod: string;
  }>;
  /** Implementation roadmap */
  roadmap: Array<{
    phase: string;
    items: string[];
    estimatedEffort: string;
    estimatedSavings: string;
    keyMilestones: string[];
  }>;
  /** Implementation guidance */
  implementationGuidance: {
    gettingStarted: string[];
    successMetrics: string[];
    riskConsiderations: string[];
  };
}

export interface SOPAnalysisRequest {
  /** SOP content to analyze */
  sopContent: string;
  /** SOP structure analysis */
  sopStructure?: {
    isSOP: boolean;
    confidence: number;
  };
  /** Additional process context */
  processDescription?: string;
  /** Organization context */
  organizationContext?: OrganizationModelContext;
}

export interface SOPAnalysisResponse {
  /** SOP quality assessment */
  sopAssessment: {
    overallScore: number;
    completenessScore: number;
    clarityScore: number;
    efficiencyScore: number;
    complianceReadiness: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    keyStrengths: string[];
    criticalGaps: string[];
  };
  /** Areas for improvement */
  improvementAreas: Array<{
    category: 'Structure' | 'Clarity' | 'Efficiency' | 'Compliance';
    issue: string;
    impact: 'High' | 'Medium' | 'Low';
    recommendation: string;
    effort: 'Low' | 'Medium' | 'High';
  }>;
  /** Automation opportunities within SOP */
  automationOpportunities: Array<{
    stepDescription: string;
    automationSolution: string;
    feasibility: 'High' | 'Medium' | 'Low';
    timeSavings: string;
    frequency: string;
    annualSavings: string;
    tools: string[];
    implementationSteps: string[];
    priority: number;
  }>;
  /** SOP revision suggestions */
  revisedSOPSuggestions: {
    structuralImprovements: string[];
    processOptimizations: string[];
    clarificationNeeded: string[];
  };
}

export interface QuestionGenerationRequest {
  /** Process description to analyze */
  processDescription: string;
  /** File content if provided */
  fileContent?: string;
  /** Organization context */
  organizationContext?: OrganizationModelContext;
}

export interface QuestionGenerationResponse {
  /** Generated discovery questions */
  questions: Array<{
    id: string;
    question: string;
    type: 'select' | 'textarea' | 'text' | 'number' | 'multiple_choice' | 'single_choice';
    category: 'volume' | 'time' | 'systems' | 'pain_points' | 'business_rules' | 'data_flow';
    automationFocus: string;
    options?: string[];
    placeholder?: string;
    followUpTriggers?: Record<string, string>;
  }>;
}

export interface AIProviderCapabilities {
  /** Provider name */
  provider: 'openai' | 'claude';
  /** Available models */
  models: string[];
  /** Maximum context tokens */
  maxContextTokens: number;
  /** Maximum output tokens */
  maxOutputTokens: number;
  /** Supports function calling */
  supportsFunctionCalling: boolean;
  /** Supports JSON mode */
  supportsJSONMode: boolean;
  /** Rate limits */
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export type AIModelTier = 'orchestrator' | 'agent';
export type AIComplexity = 'simple' | 'complex';
export type AIProvider = 'openai' | 'claude';