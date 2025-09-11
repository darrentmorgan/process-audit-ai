#!/bin/bash

# ProcessAudit AI - Vercel Deployment Script
# Usage: ./scripts/deploy-vercel.sh

set -e

echo "🚀 ProcessAudit AI - Vercel Deployment"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Pre-deployment checks..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please copy .env.example to .env.local and configure your environment variables."
    exit 1
fi

# Check if essential environment variables are present
echo "🔍 Checking environment variables..."
if ! grep -q "CLAUDE_API_KEY" .env.local; then
    echo "❌ CLAUDE_API_KEY not found in .env.local"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local; then
    echo "❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in .env.local"
    exit 1
fi

echo "✅ Environment variables check passed"

# Build locally to check for errors
echo "🔨 Testing local build..."
npm run build

echo "✅ Local build successful"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📍 Your URLs:"
echo "   Main Platform: https://process-audit-ai.vercel.app"
echo "   Hospo-Dojo Demo: https://hospodojo.process-audit-ai.vercel.app"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Configure custom domain in Vercel dashboard if needed"
echo "   2. Update Clerk redirect URLs for production domains"
echo "   3. Test both main and subdomain experiences"
echo ""
echo "📊 Monitor deployment:"
echo "   vercel logs --follow"