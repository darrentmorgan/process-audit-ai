#!/bin/bash

# Apply Supabase Manual Fix Script
# ProcessAudit AI - Critical Database Authentication Fix

set -e

echo "🔧 ProcessAudit AI - Applying Supabase Authentication Fix"
echo "=================================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please ensure you have the Supabase configuration in .env.local"
    exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

# Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: Missing required Supabase environment variables"
    echo "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY"
    exit 1
fi

echo "📊 Supabase Project: $(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||g' | sed 's|\.supabase\.co||g')"
echo "🔑 Using Service Key: ${SUPABASE_SERVICE_KEY:0:10}..."

# Check if SQL file exists
if [ ! -f SUPABASE_MANUAL_FIX.sql ]; then
    echo "❌ Error: SUPABASE_MANUAL_FIX.sql file not found"
    exit 1
fi

echo ""
echo "📋 Fix Summary:"
echo "   - Remove foreign key constraints to non-existent auth.users"
echo "   - Update RLS policies for Clerk authentication" 
echo "   - Enable UUID insertion for converted Clerk user IDs"
echo "   - Maintain data integrity without breaking changes"
echo ""

# Prompt for confirmation
read -p "🤔 Do you want to apply this fix to your Supabase database? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Fix cancelled by user"
    exit 1
fi

echo ""
echo "🚀 Applying database fix..."

# Apply the SQL fix using psql if available, otherwise show manual instructions
if command -v psql &> /dev/null; then
    # Extract database info from Supabase URL
    DB_URL="postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||g' | sed 's|\.supabase\.co||g').supabase.co:5432/postgres"
    
    echo "📡 Connecting to Supabase database..."
    
    # Apply the fix
    if psql "$DB_URL" -f SUPABASE_MANUAL_FIX.sql; then
        echo ""
        echo "✅ Database fix applied successfully!"
        echo ""
        echo "🧪 Testing the fix..."
        
        # Test basic connectivity and table structure
        psql "$DB_URL" -c "SELECT COUNT(*) as profile_count FROM public.profiles;" -c "SELECT COUNT(*) as reports_count FROM public.audit_reports;" 2>/dev/null || echo "⚠️  Warning: Could not run test queries"
        
        echo ""
        echo "🎉 SUPABASE MANUAL FIX COMPLETED!"
        echo ""
        echo "📋 Next Steps:"
        echo "   1. Test report saving in your application"
        echo "   2. Verify authentication flows work properly"
        echo "   3. Check browser console for any remaining errors"
        echo "   4. Monitor application logs for issues"
        echo ""
        echo "🔍 To test the fix:"
        echo "   1. npm run dev"
        echo "   2. Sign in with Clerk"
        echo "   3. Complete a process audit"
        echo "   4. Try saving the report"
        echo ""
        
    else
        echo "❌ Error applying database fix"
        echo "Please check the error messages above and try manual application"
        exit 1
    fi
    
else
    echo "❌ psql not found. Please apply the fix manually:"
    echo ""
    echo "1. Go to your Supabase dashboard: https://app.supabase.com"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of SUPABASE_MANUAL_FIX.sql"
    echo "4. Run the SQL script"
    echo ""
    echo "Or install psql and run this script again:"
    echo "   brew install postgresql  # On macOS"
    echo "   sudo apt-get install postgresql-client  # On Ubuntu"
    exit 1
fi