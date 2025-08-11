var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .wrangler/tmp/bundle-kJXm6e/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-kJXm6e/checked-fetch.js"() {
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-kJXm6e/middleware-loader.entry.ts
var import_checked_fetch11 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-kJXm6e/middleware-insertion-facade.js
var import_checked_fetch9 = __toESM(require_checked_fetch());

// src/index.js
var import_checked_fetch6 = __toESM(require_checked_fetch());

// src/processor.js
var import_checked_fetch5 = __toESM(require_checked_fetch());

// src/generators/n8n.js
var import_checked_fetch3 = __toESM(require_checked_fetch());

// src/ai/claude.js
var import_checked_fetch2 = __toESM(require_checked_fetch());
async function callClaudeAPI(env, prompt, maxTokens = 4096) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
      // Lower temperature for more consistent JSON generation
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }
  const data = await response.json();
  const content = data.content[0].text;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    JSON.parse(content);
    return content;
  } catch (e) {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}") + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = content.substring(jsonStart, jsonEnd);
      JSON.parse(jsonStr);
      return jsonStr;
    }
    throw new Error("Failed to extract valid JSON from Claude response");
  }
}
__name(callClaudeAPI, "callClaudeAPI");

// src/generators/n8n.js
async function generateN8nWorkflow(env, orchestrationPlan, job) {
  const prompt = `
You are an n8n workflow expert. Convert the following orchestration plan into a valid n8n workflow JSON.

Orchestration Plan:
${JSON.stringify(orchestrationPlan, null, 2)}

Business Context:
${JSON.stringify(job.processData, null, 2)}

Generate a complete n8n workflow JSON that includes:
1. All necessary nodes with proper configuration
2. Connections between nodes
3. Error handling nodes where appropriate
4. Proper node positioning for visual clarity

Use these common n8n node types as appropriate:
- n8n-nodes-base.webhook (for webhook triggers)
- n8n-nodes-base.schedule (for scheduled triggers)
- n8n-nodes-base.httpRequest (for API calls)
- n8n-nodes-base.set (for data transformation)
- n8n-nodes-base.if (for conditional logic)
- n8n-nodes-base.emailSend (for notifications)
- n8n-nodes-base.postgres/mysql (for database operations)
- n8n-nodes-base.function (for custom JavaScript)
- n8n-nodes-base.merge (for combining data)
- n8n-nodes-base.splitInBatches (for batch processing)

Return a valid n8n workflow JSON with this structure:
{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": {},
      "id": "unique-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "unique-webhook-id" (if webhook)
    }
  ],
  "connections": {
    "Node Name": {
      "main": [
        [
          {
            "node": "Next Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {},
  "versionId": "1",
  "id": "${job.id}",
  "meta": {
    "instanceId": "process-audit-ai"
  },
  "tags": []
}

Important: Generate real, functional node configurations based on the process requirements.
`;
  const response = await callClaudeAPI(env, prompt, 8192);
  const workflow = JSON.parse(response);
  if (!workflow.name) {
    workflow.name = orchestrationPlan.workflowName || "Generated Automation Workflow";
  }
  if (!workflow.nodes || workflow.nodes.length === 0) {
    workflow.nodes = createBasicNodes(orchestrationPlan);
  }
  if (!workflow.connections) {
    workflow.connections = createNodeConnections(workflow.nodes);
  }
  workflow.meta = {
    ...workflow.meta,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    generatedBy: "ProcessAudit AI"
  };
  workflow.tags = ["automated", "process-audit-ai"];
  return workflow;
}
__name(generateN8nWorkflow, "generateN8nWorkflow");
function createBasicNodes(plan) {
  const nodes = [];
  let yPosition = 250;
  if (plan.triggers && plan.triggers.length > 0) {
    const trigger = plan.triggers[0];
    nodes.push({
      id: generateNodeId(),
      name: "Trigger",
      type: mapTriggerType(trigger.type),
      typeVersion: 1,
      position: [250, yPosition],
      parameters: trigger.configuration || {}
    });
    yPosition += 150;
  }
  if (plan.steps) {
    plan.steps.forEach((step, index) => {
      nodes.push({
        id: step.id || generateNodeId(),
        name: step.name || `Step ${index + 1}`,
        type: mapStepType(step.type),
        typeVersion: 1,
        position: [250, yPosition],
        parameters: step.configuration || {}
      });
      yPosition += 150;
    });
  }
  return nodes;
}
__name(createBasicNodes, "createBasicNodes");
function mapTriggerType(type) {
  const typeMap = {
    "webhook": "n8n-nodes-base.webhook",
    "schedule": "n8n-nodes-base.schedule",
    "email": "n8n-nodes-base.emailReadImap",
    "form": "n8n-nodes-base.formTrigger"
  };
  return typeMap[type] || "n8n-nodes-base.webhook";
}
__name(mapTriggerType, "mapTriggerType");
function mapStepType(type) {
  const typeMap = {
    "http": "n8n-nodes-base.httpRequest",
    "transform": "n8n-nodes-base.set",
    "condition": "n8n-nodes-base.if",
    "email": "n8n-nodes-base.emailSend",
    "database": "n8n-nodes-base.postgres",
    "function": "n8n-nodes-base.function",
    "merge": "n8n-nodes-base.merge",
    "split": "n8n-nodes-base.splitInBatches"
  };
  return typeMap[type] || "n8n-nodes-base.set";
}
__name(mapStepType, "mapStepType");
function createNodeConnections(nodes) {
  const connections = {};
  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];
    connections[currentNode.name] = {
      main: [[{
        node: nextNode.name,
        type: "main",
        index: 0
      }]]
    };
  }
  return connections;
}
__name(createNodeConnections, "createNodeConnections");
function generateNodeId() {
  return "node_" + Math.random().toString(36).substr(2, 9);
}
__name(generateNodeId, "generateNodeId");

// src/database.js
var import_checked_fetch4 = __toESM(require_checked_fetch());
async function updateJobProgress(env, jobId, progress, status, errorMessage = null) {
  const updateData = {
    progress,
    status,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}`,
    {
      method: "PATCH",
      headers: {
        "apikey": env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(updateData)
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to update job progress: ${response.statusText}`);
  }
  console.log(`Updated job ${jobId}: ${status} - ${progress}%`);
}
__name(updateJobProgress, "updateJobProgress");
async function saveAutomation(env, jobId, automation) {
  const automationData = {
    job_id: jobId,
    name: automation.name,
    description: automation.description,
    platform: automation.platform,
    workflow_json: automation.workflow_json,
    instructions: automation.instructions,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/generated_automations`,
    {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(automationData)
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to save automation: ${response.statusText}`);
  }
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}`,
    {
      method: "PATCH",
      headers: {
        "apikey": env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        workflow_data: automation.workflow_json,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })
    }
  );
  console.log(`Saved automation for job ${jobId}`);
}
__name(saveAutomation, "saveAutomation");

// src/processor.js
async function processAutomationJob(env, job) {
  try {
    await updateJobProgress(env, job.id, 10, "processing");
    console.log("Creating orchestration plan...");
    const orchestrationPlan = await createOrchestrationPlan(env, job);
    await updateJobProgress(env, job.id, 30, "processing");
    console.log("Generating n8n workflow...");
    const workflow = await generateN8nWorkflow(env, orchestrationPlan, job);
    await updateJobProgress(env, job.id, 70, "processing");
    console.log("Saving automation...");
    const automation = {
      name: workflow.name,
      description: workflow.description,
      platform: "n8n",
      workflow_json: workflow,
      instructions: generateInstructions(workflow)
    };
    await saveAutomation(env, job.id, automation);
    await updateJobProgress(env, job.id, 100, "completed");
    console.log(`Job ${job.id} completed successfully`);
    return automation;
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    await updateJobProgress(env, job.id, 0, "failed", error.message);
    throw error;
  }
}
__name(processAutomationJob, "processAutomationJob");
async function createOrchestrationPlan(env, job) {
  const prompt = `
You are an automation orchestration expert. Based on the following business process analysis, create a detailed automation plan that can be implemented in n8n.

Process Analysis:
${JSON.stringify(job.processData, null, 2)}

Automation Opportunities:
${JSON.stringify(job.automationOpportunities, null, 2)}

Create a structured plan with:
1. Workflow triggers (webhooks, schedules, etc.)
2. Data collection steps
3. Processing/transformation steps
4. Integration points with external systems
5. Error handling approach
6. Output/notification steps

Return a JSON object with this structure:
{
  "workflowName": "string",
  "description": "string",
  "triggers": [
    {
      "type": "webhook|schedule|email|form",
      "configuration": {}
    }
  ],
  "steps": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "description": "string",
      "inputs": [],
      "outputs": [],
      "configuration": {}
    }
  ],
  "connections": [
    {
      "from": "stepId",
      "to": "stepId"
    }
  ],
  "errorHandling": {
    "strategy": "string",
    "notifications": []
  }
}
`;
  const response = await callClaudeAPI(env, prompt);
  return JSON.parse(response);
}
__name(createOrchestrationPlan, "createOrchestrationPlan");
function generateInstructions(workflow) {
  const instructions = [];
  instructions.push("## How to Import This Workflow in n8n\n");
  instructions.push("1. Open your n8n instance");
  instructions.push('2. Click on "Workflows" in the left sidebar');
  instructions.push('3. Click the "Import" button');
  instructions.push('4. Select "From File" and upload the downloaded JSON file');
  instructions.push("5. Review and activate the workflow\n");
  instructions.push("## Configuration Required\n");
  instructions.push("After importing, you will need to:");
  if (workflow.nodes) {
    const uniqueTypes = [...new Set(workflow.nodes.map((n) => n.type))];
    uniqueTypes.forEach((type) => {
      if (type.includes("webhook")) {
        instructions.push("- Configure webhook URL and authentication");
      }
      if (type.includes("email")) {
        instructions.push("- Set up email credentials");
      }
      if (type.includes("database")) {
        instructions.push("- Configure database connection");
      }
      if (type.includes("api")) {
        instructions.push("- Add API keys and endpoints");
      }
    });
  }
  instructions.push("\n## Testing\n");
  instructions.push('1. Use the "Execute Workflow" button to test');
  instructions.push("2. Check the execution log for any errors");
  instructions.push("3. Adjust node settings as needed");
  return instructions.join("\n");
}
__name(generateInstructions, "generateInstructions");

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "healthy" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (url.pathname.startsWith("/status/")) {
      const jobId = url.pathname.split("/")[2];
      try {
        const status = await getJobStatus(env, jobId);
        return new Response(JSON.stringify(status), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (url.pathname === "/submit" && request.method === "POST") {
      try {
        const job = await request.json();
        await env.AUTOMATION_QUEUE.send(job);
        return new Response(JSON.stringify({
          jobId: job.id,
          status: "queued"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    return new Response("Not Found", { status: 404 });
  },
  // Queue consumer for processing automation jobs
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const job = message.body;
        console.log(`Processing job: ${job.id}`);
        await processAutomationJob(env, job);
        message.ack();
      } catch (error) {
        console.error(`Error processing job: ${error.message}`);
        message.retry();
      }
    }
  }
};
async function getJobStatus(env, jobId) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}`, {
    headers: {
      "apikey": env.SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch job status");
  }
  const jobs = await response.json();
  if (jobs.length === 0) {
    throw new Error("Job not found");
  }
  return jobs[0];
}
__name(getJobStatus, "getJobStatus");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch7 = __toESM(require_checked_fetch());
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch8 = __toESM(require_checked_fetch());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-kJXm6e/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch10 = __toESM(require_checked_fetch());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-kJXm6e/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
