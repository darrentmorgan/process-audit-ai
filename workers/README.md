# Process Audit AI - Cloudflare Workers

This directory contains the Cloudflare Workers backend for processing long-running automation generation tasks.

## Features

- Asynchronous job processing using Cloudflare Queues
- AI-powered n8n workflow generation
- Progress tracking and status updates
- Integration with Supabase for data persistence

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Edit `wrangler.toml` and add your API keys:
   ```toml
   [vars]
   SUPABASE_URL = "your_supabase_url"
   SUPABASE_SERVICE_KEY = "your_service_key"
   CLAUDE_API_KEY = "your_claude_api_key"
   ```

3. **Create the queue:**
   ```bash
   npx wrangler queues create automation-jobs
   ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

5. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /submit` - Submit a new automation job
- `GET /status/:jobId` - Get job status and progress

## Architecture

```
Frontend → API Routes → Cloudflare Queue → Worker → Supabase
             ↑                                ↓
        Status Polling ←──────────── Job Updates
```

## Job Processing Flow

1. Frontend submits job to Next.js API
2. API creates job record in Supabase
3. API sends job to Cloudflare Worker queue
4. Worker processes job asynchronously:
   - Creates orchestration plan using AI
   - Generates n8n workflow JSON
   - Saves automation to database
   - Updates job progress throughout
5. Frontend polls for status updates
6. User downloads completed workflow

## Development

To test locally:
1. Run the worker: `npm run dev`
2. The worker will be available at `http://localhost:8787`
3. Update your Next.js `.env.local` with: `CLOUDFLARE_WORKER_URL=http://localhost:8787`

## Production Deployment

1. Ensure all environment variables are set in `wrangler.toml`
2. Deploy: `npm run deploy`
3. Update your Next.js environment with the production Worker URL
4. The Worker URL will be: `https://process-audit-automation.<your-subdomain>.workers.dev`

## Monitoring

View logs in real-time:
```bash
npm run tail
```

## Notes

- Free tier includes 100,000 requests/day and 1M queue operations/month
- Workers have a 30-second CPU time limit per request
- Queue consumers can run up to 15 minutes for batch processing