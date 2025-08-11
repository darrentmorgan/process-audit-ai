import fs from 'fs';
const workflow = JSON.parse(fs.readFileSync('n8n-importable-workflow.json', 'utf8'));

// Fix Gmail trigger node to use proper gmailTrigger type
workflow.nodes[0] = {
  'id': 'node-trigger-email-a1b2c3',
  'name': 'Gmail Trigger', 
  'type': 'n8n-nodes-base.gmailTrigger',
  'typeVersion': 1,
  'position': [100, 300],
  'parameters': {
    'pollTimes': {
      'item': [
        { 'mode': 'everyMinute' }
      ]
    },
    'simple': true,
    'filters': {}
  },
  'credentials': {
    'gmailOAuth2Api': {
      'id': '1',
      'name': 'Gmail account'
    }
  }
};

// Fix Gmail send node
const sendNodeIndex = workflow.nodes.findIndex(n => n.name === 'Send Response');
if (sendNodeIndex >= 0) {
  workflow.nodes[sendNodeIndex] = {
    'id': 'node-email-send-q6r7s8',
    'name': 'Send Response',
    'type': 'n8n-nodes-base.gmail',
    'typeVersion': 2,
    'position': [900, 300],
    'parameters': {
      'operation': 'send',
      'resource': 'message',
      'to': '={{ $json.from }}',
      'subject': '={{ "Re: " + $json.subject }}',
      'message': '={{ $node["Generate Response"].json.response }}',
      'options': {
        'priority': '={{ $json.analysis.urgency === "high" ? "high" : "normal" }}'
      }
    },
    'credentials': {
      'gmailOAuth2Api': {
        'id': '1',
        'name': 'Gmail account'
      }
    },
    'continueOnFail': true,
    'retryOnFail': true,
    'maxRetries': 3
  };
}

// Add typeVersion to all nodes that don't have it
workflow.nodes.forEach(node => {
  if (!node.typeVersion) {
    node.typeVersion = 1;
  }
});

// Fix the OpenAI node parameters
const openaiNodeIndex = workflow.nodes.findIndex(n => n.name === 'Generate Response');
if (openaiNodeIndex >= 0) {
  workflow.nodes[openaiNodeIndex].parameters = {
    'model': 'gpt-4',
    'prompt': '={{ "Generate a professional and empathetic response to this customer email.\\n\\nCustomer Email: " + $json.body + "\\n\\nCategory: " + $json.analysis.category + "\\nUrgency: " + $json.analysis.urgency + "\\n\\nRequirements:\\n- Use their name if available\\n- Reference specific points from their email\\n- Keep tone professional but warm\\n- Include next steps or resolution timeline\\n- Sign off appropriately" }}',
    'temperature': 0.7,
    'maxTokens': 500
  };
}

fs.writeFileSync('n8n-fixed-workflow.json', JSON.stringify(workflow, null, 2));
console.log('Fixed workflow saved to n8n-fixed-workflow.json');
console.log('File size:', fs.statSync('n8n-fixed-workflow.json').size, 'bytes');