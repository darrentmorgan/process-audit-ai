#!/bin/bash

# Apply Clerk authentication database migration via Supabase REST API
echo "🔧 Applying Clerk authentication migration..."

PROJECT_REF="khodniyhethjyomscyjw"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2RuaXloZXRoanlvbXNjeWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDA4MCwiZXhwIjoyMDY5NzY2MDgwfQ.58Llsii1gzL9mael0FIVavN90D_K0LNuI4p1v8lscQg"

# Check if migration file exists
if [ ! -f "database/clerk-auth-migration.sql" ]; then
    echo "❌ Migration file not found: database/clerk-auth-migration.sql"
    exit 1
fi

# Read the migration file
MIGRATION_SQL=$(cat database/clerk-auth-migration.sql)

echo "📝 Migration file loaded, applying to Supabase..."

# Apply migration via REST API
RESPONSE=$(curl -s -X POST \
  "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$(echo "$MIGRATION_SQL" | sed 's/"/\\"/g' | tr '\n' ' ')\"}")

# Check for errors in response
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ Migration failed with error:"
    echo "$RESPONSE" | jq -r '.error // .message // .'
    exit 1
else
    echo "✅ Clerk authentication migration applied successfully!"
    echo ""
    echo "🔧 Changes made:"
    echo "  • Added clerk_user_id columns to audit_reports, profiles, organization_memberships"
    echo "  • Added indexes for performance optimization"
    echo "  • Created new helper functions for Clerk integration"
    echo "  • Updated RLS policies to support Clerk authentication"
    echo "  • Added service role policies for backend operations"
    echo ""
    echo "🌐 Visit your dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"
fi