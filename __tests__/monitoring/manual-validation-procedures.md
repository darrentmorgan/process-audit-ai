# Manual Validation Procedures
**ProcessAudit AI - Monitoring Infrastructure Testing**

This document provides step-by-step manual validation procedures for monitoring infrastructure components that require human verification or cannot be fully automated.

## Table of Contents
1. [PagerDuty Integration Manual Tests](#pagerduty-integration-manual-tests)
2. [Slack Integration Manual Tests](#slack-integration-manual-tests)
3. [Multi-Tenant Security Manual Validation](#multi-tenant-security-manual-validation)
4. [Performance Testing Manual Procedures](#performance-testing-manual-procedures)
5. [Dashboard and Monitoring UI Tests](#dashboard-and-monitoring-ui-tests)
6. [Incident Response Workflow Tests](#incident-response-workflow-tests)

---

## PagerDuty Integration Manual Tests

### Test PD-001: Alert Creation and Escalation
**Objective**: Verify PagerDuty receives alerts and escalates properly

**Prerequisites**:
- Valid PagerDuty service key configured
- On-call schedule active
- Test user with PagerDuty access

**Steps**:
1. **Trigger Test Alert**:
   ```bash
   curl -X POST http://localhost:3000/api/monitoring/test/pagerduty-alert \
     -H "Content-Type: application/json" \
     -d '{
       "severity": "critical",
       "service": "processaudit-test",
       "summary": "Manual Test Alert - PD-001"
     }'
   ```

2. **Verify Alert Creation**:
   - [ ] Check PagerDuty web console for new incident
   - [ ] Verify incident contains correct details:
     - Service: processaudit-test
     - Severity: High
     - Description includes summary
   - [ ] Note incident ID: `________________`

3. **Test Escalation**:
   - [ ] Wait 15 minutes without acknowledging
   - [ ] Verify escalation to next level occurred
   - [ ] Check escalation notifications were sent

4. **Test Acknowledgment**:
   - [ ] Acknowledge incident in PagerDuty
   - [ ] Verify status changes to "Acknowledged"
   - [ ] Confirm escalation stops

5. **Test Resolution**:
   - [ ] Resolve incident in PagerDuty
   - [ ] Verify status changes to "Resolved"
   - [ ] Check resolution notification sent

**Expected Results**:
- [ ] Alert appears in PagerDuty within 2 minutes
- [ ] Escalation occurs after configured timeout
- [ ] Acknowledgment stops escalation
- [ ] Resolution completes workflow

**Validation Checklist**:
- [ ] Incident created successfully: ✓ / ✗
- [ ] Escalation policy followed: ✓ / ✗
- [ ] Acknowledgment worked: ✓ / ✗
- [ ] Resolution worked: ✓ / ✗

---

### Test PD-002: Security Alert Immediate Escalation
**Objective**: Verify security alerts bypass normal escalation delays

**Steps**:
1. **Trigger Security Alert**:
   ```bash
   curl -X POST http://localhost:3000/api/monitoring/alerts/security \
     -H "Content-Type: application/json" \
     -d '{
       "alert_type": "security_breach",
       "severity": "critical",
       "details": "Manual security test - PD-002"
     }'
   ```

2. **Verify Immediate Escalation**:
   - [ ] Check PagerDuty for incident creation
   - [ ] Verify escalation policy: "Security Immediate"
   - [ ] Confirm no initial delay before first notification
   - [ ] Validate priority set to "High"

**Expected Results**:
- [ ] Security incidents escalate immediately
- [ ] Use dedicated security escalation policy
- [ ] High priority assignment

---

## Slack Integration Manual Tests

### Test SL-001: Critical Alert Formatting
**Objective**: Verify critical alerts display properly in Slack

**Steps**:
1. **Trigger Critical Alert**:
   ```bash
   curl -X POST http://localhost:3000/api/monitoring/test/slack-critical \
     -H "Content-Type: application/json" \
     -d '{
       "alert": "ProcessAuditSystemDown",
       "severity": "critical",
       "description": "Manual test alert SL-001"
     }'
   ```

2. **Verify Slack Message**:
   - [ ] Check #alerts-critical channel
   - [ ] Verify message formatting:
     - [ ] Red color bar (danger)
     - [ ] 🚨 Critical alert icon
     - [ ] Bold title with alert name
     - [ ] Service and component fields
     - [ ] Action buttons present
   - [ ] Screenshot attached: ✓ / ✗

3. **Test Interactive Elements**:
   - [ ] Click "View Runbook" button
   - [ ] Verify correct URL opens
   - [ ] Test "Acknowledge" button (if present)

**Manual Validation**:
- [ ] Message is visually prominent
- [ ] All required information visible
- [ ] Action buttons functional
- [ ] Follows brand guidelines

---

### Test SL-002: Multi-Channel Routing
**Objective**: Verify alerts route to correct Slack channels

**Test Matrix**:
| Alert Type | Expected Channel | Color | Icon |
|------------|------------------|-------|------|
| Critical System | #alerts-critical | Red | 🚨 |
| Warning Performance | #alerts-warnings | Orange | ⚠️ |
| Business Metrics | #business-metrics | Green | 📊 |
| Security Incident | #security-incidents | Red | 🔒 |

**Steps**:
1. **For each alert type, send test alert**:
   ```bash
   curl -X POST http://localhost:3000/api/monitoring/test/slack-routing \
     -H "Content-Type: application/json" \
     -d '{
       "alert_type": "ALERT_TYPE",
       "severity": "SEVERITY",
       "component": "COMPONENT"
     }'
   ```

2. **Verify Channel Routing**:
   - [ ] Critical → #alerts-critical
   - [ ] Warning → #alerts-warnings
   - [ ] Business → #business-metrics
   - [ ] Security → #security-incidents

3. **Validate Formatting**:
   - [ ] Correct colors used
   - [ ] Appropriate icons displayed
   - [ ] Channel-specific templates applied

---

## Multi-Tenant Security Manual Validation

### Test MT-001: Organization Data Isolation
**Objective**: Verify monitoring data is isolated between organizations

**Prerequisites**:
- Test accounts for 3 different organizations:
  - Free Plan: `org_free_test`
  - Professional: `org_pro_test`
  - Enterprise: `org_ent_test`

**Steps**:
1. **Setup Test Data**:
   ```bash
   # Create test metrics for each org
   curl -X POST http://localhost:3000/api/monitoring/test/seed-data \
     -H "Authorization: Bearer SERVICE_TOKEN" \
     -d '{
       "organizations": [
         "org_free_test",
         "org_pro_test",
         "org_ent_test"
       ]
     }'
   ```

2. **Test Cross-Org Access Prevention**:
   - [ ] Login as Free org user
   - [ ] Attempt to access Pro org metrics:
     ```
     GET /api/monitoring/metrics/org_pro_test
     ```
   - [ ] Verify 403 Forbidden response
   - [ ] Check audit log for access attempt

3. **Repeat for Each Organization Pair**:
   - [ ] Free → Professional: Blocked ✓ / ✗
   - [ ] Free → Enterprise: Blocked ✓ / ✗
   - [ ] Professional → Enterprise: Blocked ✓ / ✗
   - [ ] Professional → Free: Blocked ✓ / ✗

4. **Verify Audit Logging**:
   - [ ] Check `/api/admin/audit-logs`
   - [ ] Confirm cross-org access attempts logged
   - [ ] Verify user, timestamp, and details recorded

---

### Test MT-002: Plan-Based Feature Restrictions
**Objective**: Verify monitoring features respect plan limitations

**Test Matrix**:
| Feature | Free | Professional | Enterprise |
|---------|------|--------------|------------|
| Basic Monitoring | ✓ | ✓ | ✓ |
| Custom Dashboards | ✗ | ✓ | ✓ |
| Advanced Analytics | ✗ | ✗ | ✓ |
| SLA Monitoring | ✗ | ✗ | ✓ |
| Custom Alert Rules (>5) | ✗ | ✓ | ✓ |
| API Integrations | ✗ | ✓ | ✓ |
| Historical Data (>30d) | ✗ | ✓ | ✓ |

**Steps**:
1. **For each plan level, test feature access**:
   - [ ] Login with plan-specific user
   - [ ] Attempt to access each feature
   - [ ] Verify expected Allow/Block behavior

2. **Test Quota Enforcement**:
   - [ ] Free plan: Try to create 6th alert rule
   - [ ] Verify rejection with upgrade prompt
   - [ ] Professional: Verify higher limits work

3. **Validate Upgrade Prompts**:
   - [ ] Blocked features show upgrade CTA
   - [ ] Correct target plan recommended
   - [ ] Upgrade URL functional

---

## Performance Testing Manual Procedures

### Test PF-001: Load Testing Scenario
**Objective**: Validate system performance under realistic load

**Tools Required**:
- Apache Bench (ab) or Artillery.js
- System monitoring dashboard
- Performance baseline metrics

**Steps**:
1. **Establish Baseline**:
   ```bash
   # Measure normal response time
   curl -w "@curl-format.txt" http://localhost:3000/api/health
   ```
   - Baseline response time: ______ ms
   - Memory usage: ______ MB
   - CPU usage: ______ %

2. **Execute Load Test**:
   ```bash
   # 100 concurrent users, 1000 requests
   ab -n 1000 -c 100 http://localhost:3000/api/health
   ```

3. **Monitor During Test**:
   - [ ] Watch response time metrics
   - [ ] Monitor memory usage
   - [ ] Check error rate
   - [ ] Observe CPU utilization

4. **Analyze Results**:
   - Requests per second: ______
   - Average response time: ______ ms
   - P95 response time: ______ ms
   - P99 response time: ______ ms
   - Error rate: ______ %

5. **Validation Criteria**:
   - [ ] P95 < 2 seconds: ✓ / ✗
   - [ ] P99 < 5 seconds: ✓ / ✗
   - [ ] Error rate < 1%: ✓ / ✗
   - [ ] Memory increase < 20%: ✓ / ✗

---

### Test PF-002: Recovery After Load Spike
**Objective**: Verify system recovers properly after high load

**Steps**:
1. **Generate Load Spike**:
   ```bash
   # Sudden spike: 200 concurrent for 30 seconds
   timeout 30s ab -n 10000 -c 200 http://localhost:3000/api/monitoring/metrics
   ```

2. **Wait for Recovery**:
   - [ ] Wait 2 minutes
   - [ ] Monitor metrics return to baseline

3. **Test Normal Operation**:
   ```bash
   # Normal load after spike
   ab -n 100 -c 10 http://localhost:3000/api/health
   ```

4. **Validate Recovery**:
   - [ ] Response times return to baseline: ✓ / ✗
   - [ ] Memory usage stabilizes: ✓ / ✗
   - [ ] No hanging processes: ✓ / ✗
   - [ ] Error rate back to normal: ✓ / ✗

---

## Dashboard and Monitoring UI Tests

### Test UI-001: Monitoring Dashboard Functionality
**Objective**: Verify monitoring dashboard displays correctly

**Prerequisites**:
- Browser access to monitoring dashboard
- Test user with dashboard permissions

**Steps**:
1. **Navigate to Dashboard**:
   - [ ] Visit `/dashboard/monitoring`
   - [ ] Verify dashboard loads within 3 seconds
   - [ ] Check no console errors

2. **Validate Metrics Display**:
   - [ ] System health status visible
   - [ ] Response time graphs populated
   - [ ] Error rate metrics shown
   - [ ] Uptime percentage displayed

3. **Test Interactivity**:
   - [ ] Time range selector works
   - [ ] Metrics can be filtered
   - [ ] Drill-down functionality works
   - [ ] Refresh updates data

4. **Mobile Responsiveness**:
   - [ ] Test on mobile device (or dev tools)
   - [ ] Verify layout adapts properly
   - [ ] Touch interactions work
   - [ ] Performance acceptable

**Screenshots Required**:
- [ ] Desktop dashboard view
- [ ] Mobile dashboard view
- [ ] Individual metric drill-down

---

### Test UI-002: Alert Management Interface
**Objective**: Verify alert management UI functions properly

**Steps**:
1. **Access Alert Management**:
   - [ ] Navigate to `/dashboard/alerts`
   - [ ] Verify alert list loads
   - [ ] Check filters and search work

2. **Test Alert Actions**:
   - [ ] Acknowledge test alert
   - [ ] Resolve test alert
   - [ ] Create new alert rule
   - [ ] Edit existing rule
   - [ ] Delete test rule

3. **Validate Alert History**:
   - [ ] View alert timeline
   - [ ] Check alert details
   - [ ] Verify status transitions
   - [ ] Test export functionality

---

## Incident Response Workflow Tests

### Test IR-001: End-to-End Incident Response
**Objective**: Validate complete incident response workflow

**Scenario**: Critical API failure simulation

**Steps**:
1. **Incident Creation**:
   ```bash
   # Simulate API failure
   curl -X POST http://localhost:3000/api/monitoring/test/simulate-outage \
     -d '{"component": "api", "severity": "critical"}'
   ```

2. **Verify Alert Distribution**:
   - [ ] PagerDuty incident created: Time ______
   - [ ] Slack alert sent: Time ______
   - [ ] Status page updated: Time ______
   - [ ] Email notifications sent: Time ______

3. **Response Actions**:
   - [ ] On-call engineer paged: Time ______
   - [ ] Incident acknowledged: Time ______
   - [ ] War room established: Time ______
   - [ ] Communication sent: Time ______

4. **Resolution**:
   - [ ] Issue identified: Time ______
   - [ ] Fix deployed: Time ______
   - [ ] Services restored: Time ______
   - [ ] Incident closed: Time ______

5. **Post-Incident**:
   - [ ] Status page updated with resolution
   - [ ] Post-mortem scheduled
   - [ ] Metrics reviewed

**Timing Validation**:
- [ ] Alert to acknowledgment < 5 minutes: ✓ / ✗
- [ ] Total resolution time < 30 minutes: ✓ / ✗
- [ ] All channels notified < 2 minutes: ✓ / ✗

---

### Test IR-002: Security Incident Response
**Objective**: Validate security incident escalation

**Scenario**: Suspicious activity detection

**Steps**:
1. **Trigger Security Alert**:
   ```bash
   curl -X POST http://localhost:3000/api/monitoring/test/security-incident \
     -d '{
       "type": "brute_force",
       "source_ip": "192.168.1.100",
       "severity": "high"
     }'
   ```

2. **Verify Immediate Response**:
   - [ ] Security team paged immediately
   - [ ] No escalation delay
   - [ ] High priority assignment
   - [ ] Security channels notified

3. **Check Response Actions**:
   - [ ] IP blocking initiated
   - [ ] User accounts secured
   - [ ] Logs collected
   - [ ] Incident commander assigned

4. **Validate Documentation**:
   - [ ] Security incident logged
   - [ ] Timeline documented
   - [ ] Actions recorded
   - [ ] Evidence preserved

---

## Manual Test Execution Checklist

### Pre-Test Setup
- [ ] Test environment prepared
- [ ] Test data seeded
- [ ] Monitoring tools configured
- [ ] Test users created
- [ ] Baseline metrics captured

### During Testing
- [ ] Document all steps performed
- [ ] Capture screenshots/evidence
- [ ] Note timing of all actions
- [ ] Record any anomalies
- [ ] Monitor system performance

### Post-Test Cleanup
- [ ] Remove test data
- [ ] Reset alert configurations
- [ ] Clear test incidents
- [ ] Document results
- [ ] Update test procedures if needed

---

## Test Result Template

**Test ID**: ____________
**Test Name**: ____________
**Date/Time**: ____________
**Tester**: ____________

**Environment**:
- [ ] Local Development
- [ ] Staging
- [ ] Production-like

**Results**:
- [ ] PASS - All criteria met
- [ ] PARTIAL - Some issues found
- [ ] FAIL - Major issues prevent success

**Issues Found**:
1. ________________________________
2. ________________________________
3. ________________________________

**Evidence Attached**:
- [ ] Screenshots
- [ ] Log files
- [ ] Performance data
- [ ] Error messages

**Next Steps**:
- [ ] No action required
- [ ] Minor fixes needed
- [ ] Major rework required
- [ ] Retest required

**Sign-off**:
Tester: _________________ Date: _______
Reviewer: _________________ Date: _______