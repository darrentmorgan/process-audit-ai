#!/bin/bash

# Apply database schema via Supabase REST API
echo "🗄️  Applying database schema via REST API..."

PROJECT_REF="khodniyhethjyomscyjw"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2RuaXloZXRoanlvbXNjeWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDA4MCwiZXhwIjoyMDY5NzY2MDgwfQ.58Llsii1gzL9mael0FIVavN90D_K0LNuI4p1v8lscQg"

# Read the schema file
SCHEMA_SQL=$(cat database/schema.sql)

# Apply schema via REST API
curl -X POST \
  "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$(echo "$SCHEMA_SQL" | sed 's/"/\\"/g' | tr '\n' ' ')\"}"

echo ""
echo "✅ Schema application completed!"
echo "🌐 Visit your dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"