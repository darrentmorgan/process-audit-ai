# Supabase CLI Setup Guide

This guide shows you how to use the Supabase CLI to quickly set up authentication for ProcessAudit AI.

## Prerequisites

You'll need:
- Node.js 16+ installed
- A Supabase account (free at [supabase.com](https://supabase.com))
- The Supabase CLI (we'll install this if needed)

## Quick Setup (Recommended)

The fastest way to get started:

```bash
# Run the automated setup script
npm run setup:quick
```

This will:
- Install Supabase CLI if needed
- Create a new project with defaults
- Set up the database schema
- Update your environment variables
- Link your local project

## Full Setup (More Control)

For more control over the setup process:

```bash
# Run the full setup script with prompts
npm run setup:supabase
```

This gives you options to:
- Choose your project name
- Select organization and region
- Set custom database password
- Enable local development services

## Manual CLI Setup

If you prefer to run commands manually:

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Create a New Project

```bash
supabase projects create "my-process-audit" --region us-east-1
```

### 4. Get Project Information

```bash
# List your projects
supabase projects list

# Get API keys (replace PROJECT_REF with your project ID)
supabase projects api-keys --project-ref YOUR_PROJECT_REF
```

### 5. Set Up Local Project

```bash
# Initialize local Supabase
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF
```

### 6. Apply Database Schema

```bash
# Copy schema to migrations
cp database/schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql

# Push to remote database
supabase db push
```

### 7. Update Environment Variables

Copy your project URL and anon key to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Validation

After setup, validate everything is working:

```bash
npm run validate
```

This checks:
- Environment variables are set
- Dependencies are installed
- Application builds successfully
- Supabase connection works

## Local Development

### Start Local Supabase Services

```bash
supabase start
```

This starts:
- **Studio**: http://localhost:54323 (database admin)
- **API**: http://localhost:54321 (local API endpoint)
- **DB**: postgresql://postgres:postgres@localhost:54322/postgres

### Useful Development Commands

```bash
# Check service status
supabase status

# View API logs
supabase logs api

# View database logs
supabase logs db

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

### Database Management

```bash
# Check for schema differences
supabase db diff

# Create a new migration
supabase migration new add_new_feature

# Apply migrations
supabase db push

# Pull remote schema changes
supabase db pull
```

## Deployment

### Environment Variables for Production

In your deployment platform (Vercel, Netlify, etc.), add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Update Auth Settings

In your Supabase dashboard:
1. Go to Authentication → Settings
2. Update **Site URL** to your production domain
3. Add your domain to **Redirect URLs**

## Troubleshooting

### Common Issues

**"Command not found: supabase"**
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

**"Authentication failed"**
```bash
supabase logout
supabase login
```

**"Project not found"**
```bash
# Check your projects
supabase projects list

# Unlink and relink
supabase unlink
supabase link --project-ref YOUR_PROJECT_REF
```

**"Database connection failed"**
```bash
# Check if local services are running
supabase status

# Restart services
supabase stop
supabase start
```

### Getting Help

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **CLI Reference**: https://supabase.com/docs/reference/cli
- **Discord Community**: https://discord.supabase.com

## Advanced Features

### Edge Functions

Deploy serverless functions:

```bash
# Create a function
supabase functions new my-function

# Deploy functions
supabase functions deploy

# View function logs
supabase functions logs my-function
```

### Database Webhooks

Set up webhooks for real-time notifications:

```bash
# Create webhook
supabase projects create-webhook --project-ref YOUR_PROJECT_REF \
  --url https://your-app.com/webhook \
  --events "INSERT,UPDATE,DELETE"
```

### Backups

```bash
# Create backup
supabase db dump --data-only > backup.sql

# Restore from backup
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

## Summary

The Supabase CLI makes it incredibly easy to:
- ✅ Create projects programmatically
- ✅ Manage database schemas with migrations
- ✅ Develop with local services
- ✅ Deploy to production seamlessly

Choose the setup method that works best for you:
- **Quick**: `npm run setup:quick` (fastest)
- **Guided**: `npm run setup:supabase` (more options)
- **Manual**: Follow the step-by-step commands above