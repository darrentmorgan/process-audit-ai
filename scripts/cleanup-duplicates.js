// Script to clean up duplicate reports from Supabase database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://khodniyhethjyomscyjw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role key for admin operations

// Use service role key if available, otherwise use anon key (limited permissions)
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2RuaXloZXRoanlvbXNjeWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTAwODAsImV4cCI6MjA2OTc2NjA4MH0.RF_NylRqCD1ex6UuuGEVZs0xsk7_U1F-OGMAY34qo5w'

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to create a hash of report content for comparison
function createContentHash(report) {
  const content = {
    process_description: report.process_description,
    file_content: report.file_content || '',
    answers: JSON.stringify(report.answers || {}),
    // Don't include report_data as it might have timestamps
  }
  return JSON.stringify(content)
}

// Helper function to check if two timestamps are within a few minutes of each other
function areTimestampsClose(timestamp1, timestamp2, minutesTolerance = 5) {
  const time1 = new Date(timestamp1).getTime()
  const time2 = new Date(timestamp2).getTime()
  const diffMinutes = Math.abs(time1 - time2) / (1000 * 60)
  return diffMinutes <= minutesTolerance
}

async function findDuplicateReports() {
  console.log('🔍 Scanning for duplicate reports...')
  
  try {
    const { data: allReports, error } = await supabase
      .from('audit_reports')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      throw error
    }
    
    console.log(`📊 Found ${allReports.length} total reports`)
    
    // Group reports by user and content similarity
    const duplicateGroups = []
    const processedReports = new Set()
    
    for (let i = 0; i < allReports.length; i++) {
      if (processedReports.has(allReports[i].id)) continue
      
      const currentReport = allReports[i]
      const currentHash = createContentHash(currentReport)
      const duplicates = [currentReport]
      
      // Find reports with similar content from the same user
      for (let j = i + 1; j < allReports.length; j++) {
        const compareReport = allReports[j]
        
        if (processedReports.has(compareReport.id)) continue
        if (compareReport.user_id !== currentReport.user_id) continue
        
        const compareHash = createContentHash(compareReport)
        
        // Check if content is identical or very similar
        const isContentSimilar = currentHash === compareHash
        const isTimestampClose = areTimestampsClose(
          currentReport.created_at, 
          compareReport.created_at, 
          30 // 30 minute tolerance
        )
        
        if (isContentSimilar && isTimestampClose) {
          duplicates.push(compareReport)
          processedReports.add(compareReport.id)
        }
      }
      
      if (duplicates.length > 1) {
        duplicateGroups.push(duplicates)
      }
      
      processedReports.add(currentReport.id)
    }
    
    return duplicateGroups
  } catch (error) {
    console.error('❌ Error finding duplicates:', error)
    return []
  }
}

async function cleanupDuplicates(dryRun = true) {
  console.log(`🧹 Starting duplicate cleanup ${dryRun ? '(DRY RUN)' : '(REAL DELETION)'}`)
  
  const duplicateGroups = await findDuplicateReports()
  
  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicates found!')
    return
  }
  
  console.log(`🔍 Found ${duplicateGroups.length} duplicate groups`)
  
  let totalReportsToDelete = 0
  const deletionPlan = []
  
  for (let groupIndex = 0; groupIndex < duplicateGroups.length; groupIndex++) {
    const group = duplicateGroups[groupIndex]
    
    // Sort by created_at to keep the most recent one
    group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    const keepReport = group[0] // Most recent
    const deleteReports = group.slice(1) // All others
    
    console.log(`\n📋 Group ${groupIndex + 1}:`)
    console.log(`   📄 Title: "${keepReport.title}"`)
    console.log(`   👤 User: ${keepReport.user_id}`)
    console.log(`   📅 Created: ${keepReport.created_at}`)
    console.log(`   ✅ KEEPING: ${keepReport.id} (most recent)`)
    
    deleteReports.forEach(report => {
      console.log(`   🗑️  DELETE: ${report.id} (${report.created_at})`)
      totalReportsToDelete++
    })
    
    deletionPlan.push({
      group: groupIndex + 1,
      keep: keepReport,
      delete: deleteReports
    })
  }
  
  console.log(`\n📊 SUMMARY:`)
  console.log(`   Total duplicate groups: ${duplicateGroups.length}`)
  console.log(`   Reports to keep: ${duplicateGroups.length}`)
  console.log(`   Reports to delete: ${totalReportsToDelete}`)
  
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no reports were deleted')
    console.log('💡 To actually delete duplicates, run: node scripts/cleanup-duplicates.js --delete')
    return deletionPlan
  }
  
  // Actually perform deletions
  console.log('\n🚨 Starting actual deletion...')
  
  let deletedCount = 0
  for (const plan of deletionPlan) {
    for (const reportToDelete of plan.delete) {
      try {
        const { error } = await supabase
          .from('audit_reports')
          .delete()
          .eq('id', reportToDelete.id)
        
        if (error) {
          console.error(`❌ Failed to delete ${reportToDelete.id}:`, error.message)
        } else {
          console.log(`✅ Deleted: ${reportToDelete.id}`)
          deletedCount++
        }
      } catch (error) {
        console.error(`❌ Error deleting ${reportToDelete.id}:`, error)
      }
    }
  }
  
  console.log(`\n🎉 Cleanup complete!`)
  console.log(`   Successfully deleted: ${deletedCount} reports`)
  console.log(`   Failed deletions: ${totalReportsToDelete - deletedCount}`)
  
  return deletionPlan
}

// Run the cleanup
async function main() {
  const args = process.argv.slice(2)
  const shouldDelete = args.includes('--delete')
  
  if (!shouldDelete) {
    console.log('🔍 Running in DRY RUN mode...')
    console.log('💡 Use --delete flag to actually remove duplicates')
  }
  
  await cleanupDuplicates(!shouldDelete)
}

// Export for use in other scripts
module.exports = {
  findDuplicateReports,
  cleanupDuplicates
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}