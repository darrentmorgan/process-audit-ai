#!/bin/bash

echo "🚀 Testing API endpoints with curl..."

echo ""
echo "🔍 Testing /api/generate-questions..."
QUESTIONS_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  http://localhost:3000/api/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "processDescription": "Invoice processing workflow that involves manual data entry, approval steps, and report generation",
    "fileContent": ""
  }')

QUESTIONS_STATUS="${QUESTIONS_RESPONSE: -3}"
QUESTIONS_BODY="${QUESTIONS_RESPONSE%???}"

if [ "$QUESTIONS_STATUS" = "200" ]; then
  echo "✅ Generate questions SUCCESS (Status: $QUESTIONS_STATUS)"
  echo "   Response length: ${#QUESTIONS_BODY} characters"
  echo "   Contains questions: $(echo "$QUESTIONS_BODY" | grep -o '"question"' | wc -l | tr -d ' ') questions found"
else
  echo "❌ Generate questions FAILED (Status: $QUESTIONS_STATUS)"
  echo "   Response: $QUESTIONS_BODY"
fi

echo ""
echo "📊 Testing /api/analyze-process..."
ANALYZE_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  http://localhost:3000/api/analyze-process \
  -H "Content-Type: application/json" \
  -d '{
    "processDescription": "Invoice processing workflow that involves manual data entry, approval steps, and report generation",
    "fileContent": "",
    "answers": {
      "frequency": "Daily",
      "time_spent": "1-2 hours",
      "people_involved": 3,
      "current_tools": "Excel, Email, Accounting software",
      "pain_points": "Manual data entry takes too long and is error-prone",
      "manual_steps": "Data entry, validation, approval routing",
      "data_entry": "Yes, frequently",
      "approval_workflows": "Yes, multiple approvals"
    }
  }')

ANALYZE_STATUS="${ANALYZE_RESPONSE: -3}"
ANALYZE_BODY="${ANALYZE_RESPONSE%???}"

if [ "$ANALYZE_STATUS" = "200" ]; then
  echo "✅ Analyze process SUCCESS (Status: $ANALYZE_STATUS)"
  echo "   Response length: ${#ANALYZE_BODY} characters"
  echo "   Contains report: $(echo "$ANALYZE_BODY" | grep -o '"report"' | wc -l | tr -d ' ') report found"
  echo "   Contains opportunities: $(echo "$ANALYZE_BODY" | grep -o '"automationOpportunities"' | wc -l | tr -d ' ') opportunities found"
else
  echo "❌ Analyze process FAILED (Status: $ANALYZE_STATUS)"
  echo "   Response: $ANALYZE_BODY"
fi

echo ""
echo "📋 Test Summary:"
if [ "$QUESTIONS_STATUS" = "200" ] && [ "$ANALYZE_STATUS" = "200" ]; then
  echo "🎉 All tests PASSED! The API endpoints are working correctly."
  exit 0
else
  echo "💥 Some tests FAILED!"
  echo "   Generate Questions: $([ "$QUESTIONS_STATUS" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
  echo "   Analyze Process: $([ "$ANALYZE_STATUS" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
  exit 1
fi