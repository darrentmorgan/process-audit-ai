# ProcessAudit AI - Monitoring Infrastructure

## 🏗️ Complete Monitoring Stack

This directory contains a comprehensive monitoring setup for ProcessAudit AI including:

- **Grafana Dashboards** - Real-time visualization and business intelligence
- **Prometheus Metrics** - Time-series data collection and storage
- **Alert Manager** - Intelligent alerting with escalation rules
- **Docker Compose** - Complete infrastructure deployment

## 📊 Components Overview

### 1. Grafana Dashboard (`grafana/dashboard-processaudit-overview.json`)
**Executive & Technical Monitoring Dashboard**

**Panels Include:**
- **Executive Summary**: Uptime, Response Time, Error Rate, Traffic Rate
- **API Performance**: Endpoint response times and request rates
- **AI & External Services**: Provider response times and daily costs
- **Multi-Tenant Metrics**: Traffic by plan type and active organizations

**Key Features:**
- Real-time updates (30s refresh)
- Alerting thresholds with color coding
- Multi-tenant business intelligence
- AI cost tracking and optimization

### 2. Prometheus Configuration (`prometheus/prometheus.yml`)
**Metrics Collection Setup**

**Scrape Targets:**
- ProcessAudit API metrics (`/api/metrics`)
- Health check monitoring (`/api/health`)
- Cloudflare Workers metrics
- Database health monitoring
- External service health checks

**Collection Intervals:**
- API metrics: 30s
- Health checks: 30s
- External services: 60s

### 3. Alert Rules (`prometheus/rules/processaudit-alerts.yml`)
**Comprehensive Alerting Strategy**

**Critical Alerts (PagerDuty + Slack):**
- `ProcessAuditDown` - API completely down (2m threshold)
- `HighErrorRate` - >5% error rate (5m threshold)
- `HighResponseTime` - >2s response time (5m threshold)
- `DatabaseConnectionFailed` - Database connectivity issues (1m threshold)
- `TenantIsolationBreach` - Security incident (immediate)

**Warning Alerts (Slack Only):**
- `HighAICost` - >$50/day AI spending
- `SlowAIResponse` - >30s AI provider response
- `LowTrafficAnomaly` - Unusual traffic drop
- `HighMemoryUsage` - >512MB memory usage

**Business Alerts:**
- `LowConversionRate` - <80% analysis completion
- `HighCustomerChurn` - >5% daily churn rate
- `OrganizationQuotaExceeded` - Plan limit violations

### 4. Alert Manager (`alertmanager/alertmanager.yml`)
**Intelligent Alert Routing**

**Escalation Channels:**
- **Critical**: PagerDuty + Slack (#alerts-critical)
- **Warning**: Slack (#alerts-warnings)
- **Business**: Slack (#business-metrics)
- **Security**: PagerDuty + Slack + Email (immediate escalation)

**Smart Features:**
- Alert grouping and deduplication
- Inhibition rules (prevent alert storms)
- Customizable repeat intervals
- Rich message formatting

### 5. Metrics API (`/api/metrics`)
**Prometheus Metrics Endpoint**

**Exported Metrics:**
```
# System Metrics
nodejs_memory_usage_bytes{type="heap_used|heap_total|external"}
nodejs_process_uptime_seconds

# Application Metrics
http_requests_total{method,status}
http_request_duration_seconds_bucket{le}
processaudit_health_check{component}

# AI Metrics
ai_requests_total{provider,status}
ai_request_duration_seconds_bucket{provider,le}
ai_cost_total

# Business Metrics
processaudit_analysis_started_total{plan}
processaudit_analysis_completed_total{plan}
processaudit_user_churn_total
processaudit_organization_usage_ratio{organization_id}
```

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install Docker and Docker Compose
# Set environment variables in .env file
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.monitoring.example .env.monitoring

# Configure required variables:
# - GRAFANA_ADMIN_PASSWORD
# - SLACK_WEBHOOK_URL
# - PAGERDUTY_SERVICE_KEY
# - PAGERDUTY_SECURITY_SERVICE_KEY
# - POSTGRES_EXPORTER_DSN
```

### 3. Start Monitoring Stack
```bash
cd monitoring
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Access Dashboards
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### 5. Configure Application
```bash
# Add to your .env.local
ENABLE_METRICS=true
PROMETHEUS_METRICS_ENDPOINT=/api/metrics
```

## 📈 Dashboard Usage

### Executive Dashboard
**Access**: Grafana → ProcessAudit AI → Production Overview

**Key Metrics:**
- **System Uptime**: Target >99.5%
- **Response Time**: Target <2s (95th percentile)
- **Error Rate**: Target <0.5%
- **AI Cost**: Daily spending tracking

**Business Intelligence:**
- Traffic distribution by plan type
- Active organizations trends
- Conversion funnel analysis

### Technical Monitoring
**Real-time Alerts**: Slack integration shows:
- Performance degradation warnings
- Error rate spikes
- AI provider issues
- Database connectivity problems

## 🔧 Customization

### Adding Custom Metrics
```javascript
// In your API routes
import { metricsCollector } from '../../../pages/api/metrics';

// Increment counter
metricsCollector.incrementCounter('custom_events_total', { type: 'user_signup' });

// Set gauge
metricsCollector.setGauge('active_sessions', {}, sessionCount);

// Record histogram
metricsCollector.recordHistogram('operation_duration_seconds', { operation: 'pdf_generation' }, durationSeconds);
```

### Creating Custom Dashboards
1. Access Grafana at http://localhost:3001
2. Create new dashboard
3. Add panels with Prometheus queries
4. Export JSON and save to `grafana/dashboards/`

### Modifying Alert Rules
1. Edit `prometheus/rules/processaudit-alerts.yml`
2. Restart Prometheus: `docker-compose restart prometheus`
3. Verify rules: http://localhost:9090/rules

## 🔒 Security Considerations

### Data Privacy
- **PII Protection**: Metrics never include user personal data
- **Organization Isolation**: Tenant context preserved without exposing sensitive info
- **Correlation IDs**: Enable debugging without data exposure

### Access Control
- **Grafana Authentication**: Default admin user (change password!)
- **Prometheus Security**: Internal network access only
- **Alert Channels**: Secure webhook URLs and API keys

## 💰 Cost Optimization

### Metric Retention
- **Prometheus**: 30 days local storage
- **Grafana**: Dashboards and configurations only
- **Estimated Storage**: ~5GB/month for typical usage

### Resource Usage
- **Prometheus**: ~200MB RAM, ~1GB storage/week
- **Grafana**: ~100MB RAM
- **AlertManager**: ~50MB RAM
- **Total**: ~350MB RAM, manageable storage growth

## 🎯 Success Metrics

### Technical Targets
- **System Uptime**: >99.5% monthly
- **Response Time**: <2s (95th percentile)
- **Error Rate**: <0.5% of all requests
- **Alert Noise**: <5% false positive rate

### Business Targets
- **Analysis Completion**: >85% conversion rate
- **User Retention**: <5% monthly churn
- **AI Cost Efficiency**: <$100/day average
- **Customer Satisfaction**: >4.5/5 rating

## 🚨 Troubleshooting

### Common Issues

**Prometheus Not Scraping:**
```bash
# Check if metrics endpoint is accessible
curl http://localhost:3000/api/metrics

# Verify Prometheus config
docker-compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
```

**Grafana Dashboard Empty:**
```bash
# Check Prometheus data source
# Grafana → Configuration → Data Sources → Prometheus
# Test connection should show "Data source is working"
```

**Alerts Not Firing:**
```bash
# Check AlertManager status
curl http://localhost:9093/api/v1/status

# Verify alert rules
curl http://localhost:9090/api/v1/rules
```

**Missing Metrics:**
```bash
# Verify application is exposing metrics
curl http://localhost:3000/api/metrics | grep processaudit

# Check Prometheus targets
# http://localhost:9090/targets
```

## 📚 Additional Resources

### Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/alertmanager/)

### ProcessAudit AI Runbooks
- API Down Recovery: `/docs/runbooks/api-down.md`
- High Error Rate: `/docs/runbooks/high-error-rate.md`
- Database Issues: `/docs/runbooks/database-connection.md`
- AI Cost Optimization: `/docs/runbooks/ai-cost-optimization.md`

---

**🎉 Monitoring Infrastructure Complete!**

ProcessAudit AI now has enterprise-grade observability with:
- Real-time dashboards and business intelligence
- Proactive alerting with smart escalation
- Comprehensive metrics collection
- Multi-tenant monitoring capabilities
- Cost optimization and AI tracking

This monitoring foundation enables 99.5%+ uptime commitments and Fortune 500 enterprise adoption.