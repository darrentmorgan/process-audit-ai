# n8n Agent Scope and Architecture

## Objective
Deliver high‑quality, production‑ready n8n workflows by combining a GPT‑5 "Orchestrator" with smaller GPT‑5 tool‑specialist agents, strict JSON schemas, curated blueprints, and a validator/auto‑repair loop.

## Supported Tool Scope (Phase 1)
- Email: Gmail/Outlook (emailSend/emailRead)
- Google Sheets: append/update
- Airtable: create/update/upsert
- Webhook: triggers with auth placeholders
- HTTP Request: REST integrations
- Core n8n nodes: IF, Merge, SplitInBatches, Function, Wait
- Optional: Slack notifications

## Generation Pipeline
1. Orchestrator (GPT‑5, large)
   - Input: process analysis, sample payloads, chosen tool scope
   - Output: JSON orchestration plan with triggers, steps, data flow, credentials, error paths, retries, backoff
2. Router
   - Partition plan by tool; prepare per‑tool prompts and payload examples
3. Tool Agents (GPT‑5 small)
   - Generate tool‑specific node blocks from blueprints and RAG snippets
   - JSON‑only output; low temperature; strict schema
4. Assembler
   - Stitch blocks; set webhook defaults; ensure connections and naming
5. Validator + Auto‑repair
   - JSON schema + semantic checks (required params, unique names, balanced connections, placeholders only)
   - One short repair pass using validator errors; reject if still failing

## JSON Schemas (high‑level)
- Orchestration plan: { workflowName, description, triggers[], steps[], connections[], errorHandling{} }
- n8n workflow: { name, nodes[], connections{}, active, settings, versionId, id, meta{}, tags[] }

## Blueprints & RAG Content
- Email send (template + attachments), email read (filters)
- Sheets append (range, values), update by key
- Airtable upsert (baseId, table, key, fields)
- HTTP Request (auth headers, pagination, idempotency keys)
- Webhook defaults (path, method, response, auth placeholder)
- Error handling branches: retry/backoff → notify → DLQ/escalation

## Guardrails (hard requirements)
- Only allowed node types from scope
- All external nodes have error branches with retry/backoff
- Secrets referenced via placeholders only (e.g., {{GMAIL_CREDENTIALS}})
- Webhooks include path/method/response; optional header auth placeholder
- Unique node names (verb-object), deterministic connections
- Env mapping section listing required variables

## Inputs Required (Preflight)
- Source systems and auth method
- Sample payloads (1–2 realistic examples)
- Peak/average volumes; rate limit hints
- SLA/latency constraints; error policies

## Evaluation & Testing
- Golden tasks per tool
- Snapshot tests on node types/params and connections
- Lint pass: no unknown node types, no plaintext secrets, all branches terminate or notify
- Optional dry‑run/lint simulation

## Model Routing & Cost
- Orchestrator: GPT‑5 large (best‑of‑2 optional)
- Tool Agents: GPT‑5 small
- Auto‑repair: GPT‑5 small
- Cache agent outputs by (tool, intent, params hash)

## Rollout Plan (Phase 1)
- Implement schemas and validator; add webhook defaults (done)
- Build blueprint library + RAG packs for Email, Sheets, Airtable, HTTP/Webhook
- Wire two‑pass prompts with strict JSON mode
- Ship end‑to‑end for 3 golden workflows; expand after green metrics

## Success Metrics
- >90% validator pass rate on first pass
- <10% manual edits needed for imports
- Time‑to‑first‑automation under 60s
- Error branch coverage 100% of external nodes
