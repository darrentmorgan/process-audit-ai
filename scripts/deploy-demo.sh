#!/bin/bash

# ProcessAudit AI - Simplified Demo Deployment to Vercel
# No custom domain required - uses *.vercel.app URLs

set -e

echo "🚀 ProcessAudit AI - Demo Deployment to Vercel"
echo "=============================================="
echo "🎯 Target: Professional demo without custom domain"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "📋 Pre-deployment checks..."

# Check if essential environment variables are present locally
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found."
    echo "💡 Copy .env.production.demo to .env.local and configure your API keys"
    exit 1
fi

echo "🔍 Checking essential environment variables..."
if ! grep -q "CLAUDE_API_KEY" .env.local; then
    echo "❌ CLAUDE_API_KEY not found in .env.local"
    echo "💡 This is required for AI analysis functionality"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    echo "💡 This is required for saving reports"
    exit 1
fi

echo "✅ Environment variables check passed"

# Build locally to check for errors
echo "🔨 Testing local build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Please fix errors before deployment."
    exit 1
fi

echo "✅ Local build successful"

# Set demo mode environment variables for Vercel
echo "⚙️  Configuring Vercel environment variables for demo mode..."

# Note: User will need to set these manually in Vercel dashboard
echo ""
echo "📝 MANUAL STEP: Add these environment variables in Vercel Dashboard:"
echo "   NEXT_PUBLIC_USE_CLERK_AUTH=false"
echo "   NEXT_PUBLIC_DEMO_MODE_ENABLED=true" 
echo "   CLAUDE_API_KEY=[your-claude-key]"
echo "   NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-key]"
echo "   SUPABASE_SERVICE_KEY=[your-service-key]"
echo ""

read -p "Have you set the environment variables in Vercel Dashboard? (y/n): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ Please configure environment variables in Vercel Dashboard first"
    echo "🔗 Visit: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Demo deployment complete!"
echo ""
echo "📍 Your Professional Demo URLs:"
echo "   🎯 Main Demo: https://process-audit-ai.vercel.app"
echo "   🥋 Hospo-Dojo: https://process-audit-ai.vercel.app?org=hospo-dojo&access=granted"
echo ""
echo "✨ Features Available:"
echo "   • Multi-tenant branding system"
echo "   • Professional Hospo-Dojo experience" 
echo "   • AI-powered process analysis"
echo "   • Professional PDF generation"
echo "   • No authentication barriers (demo mode)"
echo ""
echo "🔧 To upgrade later:"
echo "   • Purchase custom domain"
echo "   • Enable Clerk authentication"  
echo "   • Configure true subdomain routing"
echo ""
echo "📊 Monitor deployment: vercel logs [deployment-url]"