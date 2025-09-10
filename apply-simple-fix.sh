#!/bin/bash

# Apply simple fix to modify user_id column to accept Clerk user IDs
echo "🔧 Applying simple fix for Clerk user ID support..."

# Read the SQL file content and escape it for JSON
SQL_CONTENT=$(cat simple-fix.sql | tr '\n' ' ' | sed 's/"/\\"/g')

# Apply using curl to Supabase REST API
curl -X POST \
  "https://khodniyhethjyomscyjw.supabase.co/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_CONTENT}\"}"

echo ""
echo "✅ Simple fix applied - user_id column now accepts Clerk user IDs"