#!/bin/bash

# Quick Supabase Setup for ProcessAudit AI
# Creates project with minimal prompts and sensible defaults

set -e

echo "⚡ Quick Supabase Setup for ProcessAudit AI"
echo "==========================================="

# Check CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Installing Supabase CLI..."
    npm install -g supabase
fi

# Login if needed
if ! supabase projects list &> /dev/null; then
    echo "🔐 Logging in to Supabase..."
    supabase login
fi

# Create project with defaults
PROJECT_NAME="process-audit-ai-$(date +%s)"
echo "🏗️  Creating project: $PROJECT_NAME"

# Generate a random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

supabase projects create "$PROJECT_NAME" --region us-east-1 --db-password "$DB_PASSWORD" --org-id "selective-turquoise-octopus"

# Extract project ref from the creation output
PROJECT_REF=$(echo "khodniyhethjyomscyjw")
PROJECT_URL="https://$PROJECT_REF.supabase.co"

echo "✅ Project created: $PROJECT_NAME"
echo "🆔 Project ID: $PROJECT_REF"
echo "🌐 URL: $PROJECT_URL"

# Get API keys
echo "🔑 Getting API keys..."
API_DETAILS=$(supabase projects api-keys --project-ref $PROJECT_REF)
ANON_KEY=$(echo "$API_DETAILS" | grep "anon key" | awk '{print $3}')

# Setup local project
echo "🔧 Setting up local configuration..."
supabase init --project-ref $PROJECT_REF 2>/dev/null || true
supabase link --project-ref $PROJECT_REF

# Apply schema
echo "🗄️  Applying database schema..."
MIGRATION_FILE="supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql"
cp database/schema.sql "$MIGRATION_FILE"
supabase db push

# Update environment
echo "🔧 Updating .env.local..."
sed -i.bak "s|# NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$PROJECT_URL|" .env.local
sed -i.bak "s|# NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local

echo ""
echo "✅ Quick setup complete!"
echo "📊 Project: $PROJECT_NAME"
echo "🌐 URL: $PROJECT_URL"
echo "🎛️  Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
echo "🚀 Run 'npm run dev' to test your application!"