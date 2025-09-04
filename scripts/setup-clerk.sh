#!/bin/bash

# Clerk Organizations Setup Script
# Sets up Clerk authentication for ProcessAudit AI

set -e

echo "🏢 ProcessAudit AI - Clerk Organizations Setup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_step "Creating .env.local from template..."
    cp .env.example .env.local
    print_success ".env.local created"
else
    print_warning ".env.local already exists - will update existing file"
fi

echo ""
print_step "Clerk Configuration Setup"
echo ""

# Check if user wants to enable Clerk now or later
echo "Do you want to enable Clerk authentication now? (y/n)"
echo "Choose 'n' to set up credentials but keep using Supabase auth for now"
read -r enable_clerk

if [[ $enable_clerk =~ ^[Yy]$ ]]; then
    use_clerk="true"
    print_step "Clerk will be enabled after setup"
else
    use_clerk="false"
    print_step "Clerk credentials will be configured but authentication will remain with Supabase"
fi

echo ""

# Get Clerk credentials
print_step "Enter your Clerk credentials (from Clerk Dashboard > API Keys)"
echo ""

# Publishable Key
echo "Clerk Publishable Key (pk_test_... or pk_live_...):"
read -r clerk_publishable_key

if [[ ! $clerk_publishable_key =~ ^pk_(test|live)_ ]]; then
    print_error "Invalid publishable key format. Should start with pk_test_ or pk_live_"
    exit 1
fi

# Secret Key  
echo ""
echo "Clerk Secret Key (sk_test_... or sk_live_...):"
read -r -s clerk_secret_key  # -s for hidden input

if [[ ! $clerk_secret_key =~ ^sk_(test|live)_ ]]; then
    print_error "Invalid secret key format. Should start with sk_test_ or sk_live_"
    exit 1
fi

echo ""

# Update .env.local
print_step "Updating .env.local with Clerk configuration..."

# Create temporary file for updated .env
temp_file=$(mktemp)

# Read existing .env.local and update/add Clerk variables
while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
        NEXT_PUBLIC_USE_CLERK_AUTH=*)
            echo "NEXT_PUBLIC_USE_CLERK_AUTH=$use_clerk" >> "$temp_file"
            ;;
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=*)
            echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$clerk_publishable_key" >> "$temp_file"
            ;;
        CLERK_SECRET_KEY=*)
            echo "CLERK_SECRET_KEY=$clerk_secret_key" >> "$temp_file"
            ;;
        *)
            echo "$line" >> "$temp_file"
            ;;
    esac
done < .env.local

# Check if we need to add missing variables
if ! grep -q "NEXT_PUBLIC_USE_CLERK_AUTH=" .env.local; then
    echo "" >> "$temp_file"
    echo "# Clerk Organizations Configuration (added by setup script)" >> "$temp_file"
    echo "NEXT_PUBLIC_USE_CLERK_AUTH=$use_clerk" >> "$temp_file"
fi

if ! grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" .env.local; then
    echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$clerk_publishable_key" >> "$temp_file"
fi

if ! grep -q "CLERK_SECRET_KEY=" .env.local; then
    echo "CLERK_SECRET_KEY=$clerk_secret_key" >> "$temp_file"
fi

# Replace original file
mv "$temp_file" .env.local
print_success "Environment configuration updated"

echo ""
print_step "Verifying setup..."

# Check if dependencies are installed
if [ -d "node_modules/@clerk/nextjs" ]; then
    print_success "Clerk packages are installed"
else
    print_warning "Clerk packages not found - installing..."
    npm install @clerk/nextjs @clerk/themes
    print_success "Clerk packages installed"
fi

echo ""
print_success "Clerk setup completed!"
echo ""

# Next steps
print_step "Next Steps:"
echo ""
echo "1. 📋 Configure your Clerk Dashboard:"
echo "   - Go to https://dashboard.clerk.com"
echo "   - Navigate to your application"
echo "   - Enable Organizations in User & Authentication > Organizations"
echo "   - Add your domains (http://localhost:3000 for development)"
echo ""

echo "2. 🧪 Test the setup:"
echo "   npm run dev"
echo ""

if [ "$use_clerk" = "true" ]; then
    echo "3. ✅ Clerk authentication is ENABLED"
    echo "   - You'll see Clerk auth components"
    echo "   - Organization features will be available"
    echo "   - Create an account to test organizations"
else
    echo "3. 🔄 Clerk authentication is CONFIGURED but DISABLED"
    echo "   - Currently using existing Supabase authentication"
    echo "   - To switch to Clerk: Set NEXT_PUBLIC_USE_CLERK_AUTH=true in .env.local"
    echo "   - This allows you to test Clerk without breaking existing auth"
fi

echo ""
echo "4. 📖 Read the setup guide:"
echo "   docs/CLERK_SETUP.md"
echo ""

print_warning "Remember: Keep your secret key secure and never commit it to version control!"
print_success "Setup complete! Happy coding! 🚀"