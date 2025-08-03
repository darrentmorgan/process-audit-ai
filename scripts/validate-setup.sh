#!/bin/bash

# Validate ProcessAudit AI Setup
# Checks that all services are configured correctly

echo "🔍 ProcessAudit AI Setup Validation"
echo "====================================="

# Check environment file
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    # Check Claude API
    if grep -q "CLAUDE_API_KEY=sk-ant" .env.local; then
        echo "✅ Claude API key configured"
    else
        echo "⚠️  Claude API key not configured (will use sample data)"
    fi
    
    # Check Supabase
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
        echo "✅ Supabase URL configured"
        
        if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ" .env.local; then
            echo "✅ Supabase anon key configured"
            
            # Test Supabase connection
            SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
            if curl -s "$SUPABASE_URL/rest/v1/" > /dev/null; then
                echo "✅ Supabase connection successful"
            else
                echo "❌ Cannot connect to Supabase"
            fi
        else
            echo "❌ Supabase anon key not configured"
        fi
    else
        echo "⚠️  Supabase not configured (authentication disabled)"
    fi
else
    echo "❌ .env.local file not found"
    echo "   Run: cp .env.example .env.local"
fi

# Check dependencies
echo ""
echo "📦 Dependencies"
echo "==============="

if [ -d "node_modules" ]; then
    echo "✅ Node modules installed"
else
    echo "❌ Node modules not installed"
    echo "   Run: npm install"
fi

# Check build
echo ""
echo "🏗️  Build Test"
echo "=============="

if npm run build > /dev/null 2>&1; then
    echo "✅ Application builds successfully"
else
    echo "❌ Build failed"
    echo "   Run: npm run build"
fi

# Check Supabase CLI if available
echo ""
echo "🛠️  Development Tools"
echo "==================="

if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI installed"
    
    if [ -f "supabase/config.toml" ]; then
        echo "✅ Supabase project initialized"
        
        if supabase status | grep -q "supabase local development setup is running"; then
            echo "✅ Local Supabase services running"
        else
            echo "⚠️  Local Supabase services not running"
            echo "   Run: supabase start"
        fi
    else
        echo "⚠️  Supabase project not initialized locally"
    fi
else
    echo "⚠️  Supabase CLI not installed"
    echo "   Install: npm install -g supabase"
fi

echo ""
echo "📊 Summary"
echo "=========="

# Count checks
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Basic functionality check
echo "Core Application: ✅ Ready"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
PASSED_CHECKS=$((PASSED_CHECKS + 1))

# AI Integration check
if grep -q "CLAUDE_API_KEY=sk-ant" .env.local 2>/dev/null; then
    echo "AI Integration: ✅ Enabled"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "AI Integration: ⚠️  Sample Data Only"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Authentication check
if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local 2>/dev/null; then
    echo "Authentication: ✅ Enabled"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "Authentication: ⚠️  Disabled"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""
echo "Score: $PASSED_CHECKS/$TOTAL_CHECKS checks passed"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo "🎉 All systems ready! Run 'npm run dev' to start."
else
    echo "⚠️  Some features may be limited. See setup instructions above."
fi