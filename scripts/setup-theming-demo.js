#!/usr/bin/env node

/**
 * Setup script for ProcessAudit AI Dynamic Theming Demo
 * Creates sample organizations with different themes for testing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample theme configurations for different organizations
const sampleThemes = {
  'tech-startup': {
    name: 'TechFlow Inc',
    description: 'A modern tech startup with sleek branding',
    branding: {
      primaryColor: '#6366f1', // Indigo
      secondaryColor: '#8b5cf6', // Purple
      logoUrl: 'https://via.placeholder.com/200x60/6366f1/ffffff?text=TechFlow',
      faviconUrl: 'https://via.placeholder.com/32x32/6366f1/ffffff?text=T',
      customDomain: null
    }
  },
  'financial-firm': {
    name: 'Precision Financial',
    description: 'Conservative financial services company',
    branding: {
      primaryColor: '#1f2937', // Dark gray
      secondaryColor: '#059669', // Green
      logoUrl: 'https://via.placeholder.com/200x60/1f2937/ffffff?text=Precision',
      faviconUrl: 'https://via.placeholder.com/32x32/1f2937/ffffff?text=P',
      customDomain: null
    }
  },
  'healthcare-org': {
    name: 'MediCare Solutions',
    description: 'Healthcare organization with caring branding',
    branding: {
      primaryColor: '#0ea5e9', // Sky blue
      secondaryColor: '#10b981', // Emerald
      logoUrl: 'https://via.placeholder.com/200x60/0ea5e9/ffffff?text=MediCare',
      faviconUrl: 'https://via.placeholder.com/32x32/0ea5e9/ffffff?text=M',
      customDomain: null
    }
  },
  'creative-agency': {
    name: 'Creative Spark',
    description: 'Bold creative agency with vibrant colors',
    branding: {
      primaryColor: '#f59e0b', // Amber
      secondaryColor: '#ec4899', // Pink
      logoUrl: 'https://via.placeholder.com/200x60/f59e0b/ffffff?text=CreativeSpark',
      faviconUrl: 'https://via.placeholder.com/32x32/f59e0b/ffffff?text=C',
      customDomain: null
    }
  },
  'enterprise-corp': {
    name: 'Enterprise Corp',
    description: 'Large enterprise with professional styling',
    branding: {
      primaryColor: '#374151', // Gray
      secondaryColor: '#3b82f6', // Blue
      logoUrl: 'https://via.placeholder.com/200x60/374151/ffffff?text=Enterprise',
      faviconUrl: 'https://via.placeholder.com/32x32/374151/ffffff?text=E',
      customDomain: null
    }
  }
}

async function createSampleOrganizations() {
  console.log('🎨 Setting up ProcessAudit AI theming demo...\n')
  
  try {
    for (const [slug, config] of Object.entries(sampleThemes)) {
      console.log(`📝 Creating organization: ${config.name}`)
      
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .upsert({
          clerk_org_id: `demo_${slug}`,
          slug: slug,
          name: config.name,
          description: config.description,
          branding: config.branding,
          plan: 'professional',
          settings: {
            features: {
              enableAutomations: true,
              enableReporting: true,
              enableIntegrations: true,
              enableAnalytics: true
            },
            security: {
              requireTwoFactor: false,
              allowGuestAccess: false
            },
            notifications: {
              emailNotifications: true
            }
          }
        }, {
          onConflict: 'clerk_org_id'
        })
        .select()
        .single()

      if (orgError) {
        console.error(`❌ Error creating ${config.name}:`, orgError.message)
        continue
      }

      console.log(`   ✅ Organization created with ID: ${org.id}`)
      console.log(`   🎨 Theme colors: ${config.branding.primaryColor}, ${config.branding.secondaryColor}`)
      console.log(`   🖼️  Logo: ${config.branding.logoUrl ? 'Custom' : 'Default'}`)
      console.log('')
    }

    console.log('🎉 Demo setup complete!\n')
    console.log('📋 Test organizations created:')
    Object.entries(sampleThemes).forEach(([slug, config]) => {
      console.log(`   • ${config.name} (/${slug})`)
    })
    
    console.log('\n🚀 Usage instructions:')
    console.log('   1. Start your development server: npm run dev')
    console.log('   2. Navigate to different organization contexts:')
    Object.keys(sampleThemes).forEach(slug => {
      console.log(`      - http://localhost:3000/org/${slug}`)
    })
    console.log('   3. Sign in as an admin to access theme customization')
    console.log('   4. Use the floating settings button to customize themes')
    
    console.log('\n💡 Features to test:')
    console.log('   • Color customization with live preview')
    console.log('   • Font family selection (Google Fonts + system fonts)')
    console.log('   • Logo and favicon uploads')
    console.log('   • Theme export/import functionality')
    console.log('   • Preview mode with apply/cancel options')
    console.log('   • Automatic theme switching between organizations')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

async function cleanupDemoData() {
  console.log('🧹 Cleaning up demo data...\n')
  
  try {
    // Delete demo organizations
    const { error } = await supabase
      .from('organizations')
      .delete()
      .like('clerk_org_id', 'demo_%')

    if (error) {
      console.error('❌ Error cleaning up:', error.message)
      return
    }

    console.log('✅ Demo data cleaned up successfully')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  }
}

// Command line interface
const command = process.argv[2]

switch (command) {
  case 'setup':
    createSampleOrganizations()
    break
    
  case 'cleanup':
    cleanupDemoData()
    break
    
  case 'reset':
    (async () => {
      await cleanupDemoData()
      console.log('⏳ Waiting 2 seconds...\n')
      await new Promise(resolve => setTimeout(resolve, 2000))
      await createSampleOrganizations()
    })()
    break
    
  default:
    console.log('🎨 ProcessAudit AI Theming Demo Setup\n')
    console.log('Usage:')
    console.log('  node scripts/setup-theming-demo.js setup   - Create sample organizations')
    console.log('  node scripts/setup-theming-demo.js cleanup - Remove demo data')
    console.log('  node scripts/setup-theming-demo.js reset   - Cleanup and recreate\n')
    console.log('Requirements:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL environment variable')
    console.log('  - SUPABASE_SERVICE_KEY environment variable')
    console.log('  - Organizations table with branding column')
    break
}