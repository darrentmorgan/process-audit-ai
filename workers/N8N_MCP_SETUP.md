# n8n MCP Server Integration Setup Guide

## Overview

This document explains how to set up the n8n MCP (Model Context Protocol) server integration with your Cloudflare Workers application for enhanced workflow automation.

## What's New

### 🚀 Enhanced Capabilities

- **Intelligent Node Discovery**: Search 532 available n8n nodes by functionality
- **AI-Enhanced Workflows**: Leverage 267 AI-capable nodes for advanced automation
- **Pre-validated Configurations**: Get pre-configured node settings with validation
- **Smart Workflow Building**: Build complex workflows with conditional branching and error handling
- **Real-time Validation**: Validate nodes and workflows before deployment
- **Diff-based Updates**: Efficiently update workflows using diff operations (80-90% token savings)

### 🔧 Technical Architecture

The integration uses a hybrid approach:
1. **Primary**: n8n MCP server for intelligent workflow generation
2. **Fallback**: Legacy workflow generation for reliability
3. **Validation**: Comprehensive validation at multiple stages

## Setup Instructions

### 1. Environment Variables

Add these secrets to your Cloudflare Worker:

```bash
# Required for MCP server authentication
wrangler secret put N8N_MCP_AUTH_TOKEN

# Optional: Override default server URL
wrangler secret put N8N_MCP_SERVER_URL
```

**Default server URL**: `https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app`

### 2. Test the Connection

Once you have the auth token configured, test the connection:

```bash
curl https://your-worker-domain.workers.dev/test-mcp
```

Expected response with auth token:
```json
{
  "serverUrl": "https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app",
  "hasAuthToken": true,
  "timestamp": "2025-08-10T01:13:29.183Z",
  "connectionStatus": "success",
  "sessionId": "session-12345"
}
```

### 3. Verify Workflow Generation

The MCP integration is automatically used when:
- Auth token is configured
- Workflow has >2 steps/triggers OR contains AI-related keywords
- MCP server is accessible

Check the workflow metadata to see if MCP was used:
```json
{
  "meta": {
    "mcpEnhanced": true,
    "generationMethod": "mcp-intelligent",
    "validation": { "valid": true },
    "capabilities": {
      "hasAINodes": true,
      "nodeCount": 5,
      "validatedNodes": 5
    }
  }
}
```

## MCP Server Features

### Core Tools Available

#### Node Discovery
- `search_nodes(functionality)` - Find nodes by capability
- `get_node_essentials(node_type)` - Get optimized node info (10-20 properties vs 200+)
- `get_node_for_task(task)` - Pre-configured settings for specific tasks
- `list_ai_tools()` - Discover 267 AI-capable nodes

#### Validation & Quality
- `validate_node_operation(node_type, parameters)` - Validate before deployment
- `validate_workflow(workflow)` - Complete workflow validation

#### Workflow Management
- `n8n_create_workflow(workflow)` - Deploy new workflows
- `n8n_update_partial_workflow(workflow_id, diff)` - Efficient updates
- `n8n_trigger_webhook_workflow(webhook_url, data)` - Execute workflows

### Performance Benefits

- **12ms average response time** from optimized SQLite database
- **99% property coverage** across 532 nodes
- **90% documentation coverage** with examples
- **Token optimization** through essentials-only responses and diff operations

## Code Implementation

### Basic Usage

```javascript
import { N8nMCPClient } from './mcp/n8n-client.js';

const mcpClient = new N8nMCPClient(env);
await mcpClient.connect();

// Search for email-related nodes
const emailNodes = await mcpClient.searchNodes("email processing");

// Get optimized node configuration
const nodeConfig = await mcpClient.getNodeEssentials("n8n-nodes-base.emailSend");

// Build intelligent workflow
const workflow = await mcpClient.buildIntelligentWorkflow({
  name: "Customer Support Automation",
  functionality: "Process and categorize customer emails",
  tasks: ["email processing", "sentiment analysis", "auto-response"],
  useAI: true
});

await mcpClient.disconnect();
```

### Integration with Existing System

The MCP integration is seamlessly integrated with the existing workflow generation:

```javascript
// This automatically uses MCP when available, falls back to legacy otherwise
const workflow = await generateN8nWorkflowHybrid(env, orchestrationPlan, job);
```

## Error Handling & Reliability

### Graceful Degradation
- MCP connection failures automatically fall back to legacy generation
- Partial MCP failures use available data with legacy completion
- All workflows validate through both MCP and legacy validation systems

### Monitoring & Debugging
- Connection status available at `/test-mcp` endpoint
- Detailed logging for MCP operations
- Workflow metadata indicates generation method used

### Common Issues

1. **No Auth Token**: Set `N8N_MCP_AUTH_TOKEN` secret
2. **Connection Timeout**: Check network connectivity and server status
3. **Validation Failures**: Review workflow structure and node configurations
4. **Session Expiry**: Client automatically handles reconnection

## Advanced Configuration

### Custom Server URL

For enterprise deployments, override the server URL:

```bash
wrangler secret put N8N_MCP_SERVER_URL "https://your-n8n-mcp-server.com"
```

### Workflow Generation Strategy

The system automatically determines when to use MCP based on:
- Complexity (>2 steps/triggers)
- AI requirements (keywords like 'analyze', 'classify', 'ai')
- Node types requiring advanced configuration

Override this behavior by modifying `shouldAttemptMCP()` in `n8n-mcp.js`.

## Benefits Summary

✅ **532 n8n nodes** with comprehensive coverage  
✅ **267 AI-capable nodes** for advanced automation  
✅ **Pre-validated configurations** prevent deployment errors  
✅ **Intelligent workflow assembly** with proper connections  
✅ **80-90% token savings** through optimized operations  
✅ **12ms average response time** for fast generation  
✅ **Graceful fallback** ensures 100% reliability  

## Next Steps

1. Configure the auth token
2. Test the connection
3. Generate a few workflows to see the quality improvement
4. Monitor the metadata to track MCP usage
5. Explore advanced features like AI node integration

For questions or issues, check the console logs which provide detailed information about MCP operations and any fallback scenarios.