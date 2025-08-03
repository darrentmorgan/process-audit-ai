// Logging utilities for ProcessAudit AI
// Provides consistent, colorful console logging throughout the application

export const logger = {
  // Step markers for major workflow stages
  step: (stepNumber, stepName, data = {}) => {
    console.log(`\n🎯 === STEP ${stepNumber}: ${stepName.toUpperCase()} ===`)
    if (Object.keys(data).length > 0) {
      console.log('📊 Step Data:', data)
    }
    console.log('⏰ Timestamp:', new Date().toISOString())
  },

  // AI operation markers
  ai: {
    start: (operation, input) => {
      console.log(`\n🤖 AI ${operation}: STARTING`)
      console.log('📝 Input:', input)
      console.log('⏱️ Start Time:', new Date().toISOString())
    },
    
    success: (operation, output) => {
      console.log(`✅ AI ${operation}: SUCCESS`)
      console.log('📤 Output:', output)
      console.log('⏱️ End Time:', new Date().toISOString())
    },
    
    error: (operation, error) => {
      console.log(`❌ AI ${operation}: ERROR`)
      console.error('🔥 Error Details:', error)
      console.log('⏱️ Error Time:', new Date().toISOString())
    }
  },

  // File operation markers
  file: {
    upload: (fileName, size, type) => {
      console.log(`\n📁 FILE UPLOAD: ${fileName}`)
      console.log('📊 File Info:', { size: `${(size / 1024).toFixed(2)}KB`, type })
    },
    
    processed: (fileName, contentLength) => {
      console.log(`✅ FILE PROCESSED: ${fileName}`)
      console.log('📄 Content Length:', contentLength, 'characters')
    }
  },

  // API request markers
  api: {
    request: (endpoint, method, data) => {
      console.log(`\n🌐 API REQUEST: ${method} ${endpoint}`)
      if (data && Object.keys(data).length > 0) {
        console.log('📦 Request Data:', data)
      }
    },
    
    response: (endpoint, status, data) => {
      console.log(`📥 API RESPONSE: ${endpoint} (${status})`)
      if (data) {
        console.log('📦 Response Data:', data)
      }
    }
  },

  // User action markers
  user: {
    action: (action, details = {}) => {
      console.log(`\n👤 USER ACTION: ${action}`)
      if (Object.keys(details).length > 0) {
        console.log('🔍 Details:', details)
      }
    }
  },

  // Performance markers
  performance: {
    start: (operation) => {
      console.time(`⏱️ ${operation}`)
      console.log(`🚀 PERFORMANCE: Starting ${operation}`)
    },
    
    end: (operation) => {
      console.timeEnd(`⏱️ ${operation}`)
      console.log(`🏁 PERFORMANCE: Completed ${operation}`)
    }
  },

  // Summary function for major milestones
  summary: (title, data) => {
    console.log(`\n📋 === ${title.toUpperCase()} SUMMARY ===`)
    Object.entries(data).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`)
    })
    console.log(`   Timestamp: ${new Date().toISOString()}`)
    console.log('=' .repeat(title.length + 20))
  }
}

export default logger