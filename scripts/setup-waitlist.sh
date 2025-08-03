#!/bin/bash

echo "🚀 Setting up waitlist table for ProcessAudit AI..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Apply the waitlist schema
echo "📊 Creating waitlist table..."
supabase db reset --db-url "$DATABASE_URL" --file database/waitlist-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Waitlist table created successfully!"
    echo ""
    echo "🎯 Your landing page is ready with waitlist functionality:"
    echo "   • Landing page: http://localhost:3000"
    echo "   • Access app directly: http://localhost:3000?access=granted"
    echo "   • Access app with auth: Sign up/sign in normally"
    echo ""
    echo "📋 Waitlist features:"
    echo "   • Email collection and validation"
    echo "   • Duplicate prevention"
    echo "   • Supabase storage with RLS policies"
    echo ""
else
    echo "❌ Failed to create waitlist table"
    echo "💡 You can also manually run the SQL from database/waitlist-schema.sql"
    exit 1
fi