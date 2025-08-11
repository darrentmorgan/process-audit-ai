// UUID generation utility for job creation
const { v4: uuidv4 } = require('uuid');

// In-memory store for temporary automation results
const automationStore = new Map();

// Generate UUID for job creation
function generateJobId() {
  return uuidv4();
}

// Store automation result temporarily
function storeAutomation(jobId, automationData) {
  automationStore.set(jobId, {
    ...automationData,
    timestamp: Date.now()
  });
  
  // Clean up old entries after 1 hour
  setTimeout(() => {
    automationStore.delete(jobId);
  }, 60 * 60 * 1000);
}

// Get automation from store
function getAutomation(jobId) {
  return automationStore.get(jobId) || null;
}

// Clear expired automations (run periodically)
function clearExpiredAutomations() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [jobId, data] of automationStore.entries()) {
    if (data.timestamp < oneHourAgo) {
      automationStore.delete(jobId);
    }
  }
}

// Clean up every 30 minutes
setInterval(clearExpiredAutomations, 30 * 60 * 1000);

module.exports = {
  generateJobId,
  storeAutomation,
  getAutomation,
  clearExpiredAutomations
};