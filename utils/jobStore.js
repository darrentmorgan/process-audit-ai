// UUID generation utility for job creation
const { v4: uuidv4 } = require('uuid');

// Generate UUID for job creation
function generateJobId() {
  return uuidv4();
}

module.exports = {
  generateJobId
};