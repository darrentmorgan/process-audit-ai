import fs from 'fs';
const workflow = JSON.parse(fs.readFileSync('n8n-fixed-workflow.json', 'utf8'));

// Option 1: Sequential flow - each node passes data to the next
// Gmail -> Analyze -> Sheets -> Airtable -> AI -> Send

// Update the connections to create a sequential flow
workflow.connections = {
  "Gmail Trigger": {
    "main": [
      [
        {
          "node": "Analyze Email Content",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Analyze Email Content": {
    "main": [
      [
        {
          "node": "Log to Google Sheets",
          "type": "main", 
          "index": 0
        }
      ]
    ]
  },
  "Log to Google Sheets": {
    "main": [
      [
        {
          "node": "Store in Airtable",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Store in Airtable": {
    "main": [
      [
        {
          "node": "Generate Response",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Generate Response": {
    "main": [
      [
        {
          "node": "Send Response",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
};

fs.writeFileSync('n8n-sequential-workflow.json', JSON.stringify(workflow, null, 2));
console.log('Sequential workflow saved to n8n-sequential-workflow.json');

// Option 2: Keep parallel structure but add a merge node
const workflow2 = JSON.parse(fs.readFileSync('n8n-fixed-workflow.json', 'utf8'));

// Add a merge node to wait for all parallel branches
const mergeNode = {
  "id": "node-merge-wait-x9y8z7",
  "name": "Wait for All",
  "type": "n8n-nodes-base.merge",
  "typeVersion": 2,
  "position": [650, 300],
  "parameters": {
    "mode": "waitForAll",
    "options": {}
  }
};

workflow2.nodes.push(mergeNode);

// Update connections to use merge node
workflow2.connections = {
  "Gmail Trigger": {
    "main": [
      [
        {
          "node": "Analyze Email Content",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Analyze Email Content": {
    "main": [
      [
        {
          "node": "Log to Google Sheets",
          "type": "main",
          "index": 0
        },
        {
          "node": "Store in Airtable",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Log to Google Sheets": {
    "main": [
      [
        {
          "node": "Wait for All",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Store in Airtable": {
    "main": [
      [
        {
          "node": "Wait for All",
          "type": "main",
          "index": 1
        }
      ]
    ]
  },
  "Wait for All": {
    "main": [
      [
        {
          "node": "Generate Response",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Generate Response": {
    "main": [
      [
        {
          "node": "Send Response",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
};

fs.writeFileSync('n8n-parallel-workflow.json', JSON.stringify(workflow2, null, 2));
console.log('Parallel workflow with merge saved to n8n-parallel-workflow.json');
console.log('');
console.log('Two options created:');
console.log('1. n8n-sequential-workflow.json - Data flows through each node sequentially');
console.log('2. n8n-parallel-workflow.json - Sheets and Airtable run in parallel, then merge before AI response');