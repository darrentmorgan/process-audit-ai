#!/bin/bash

# ProcessAudit AI - Monitoring Setup Script
# Automated setup for production-grade monitoring infrastructure

set -e

echo "🏗️ Setting up ProcessAudit AI Monitoring Infrastructure..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is required but not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create monitoring directories
echo -e "${BLUE}📁 Creating monitoring directory structure...${NC}"
mkdir -p monitoring/{grafana/{dashboards,provisioning/{dashboards,datasources}},prometheus/rules,alertmanager}

# Check if environment file exists
if [ ! -f .env.monitoring ]; then
    echo -e "${YELLOW}⚠️ Creating monitoring environment file...${NC}"
    cp .env.monitoring.example .env.monitoring
    echo -e "${YELLOW}📝 Please edit .env.monitoring with your configuration before proceeding${NC}"
fi

# Load environment variables
if [ -f .env.monitoring ]; then
    source .env.monitoring
fi

# Verify required environment variables
echo -e "${BLUE}🔧 Verifying configuration...${NC}"

REQUIRED_VARS=("GRAFANA_ADMIN_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo -e "${YELLOW}📝 Please configure these in .env.monitoring${NC}"
    exit 1
fi

# Start monitoring services
echo -e "${BLUE}🚀 Starting monitoring services...${NC}"
cd monitoring

# Pull latest images
echo -e "${BLUE}📥 Pulling Docker images...${NC}"
docker-compose pull

# Start services
echo -e "${BLUE}🏃 Starting services...${NC}"
docker-compose up -d

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

# Verify services are running
echo -e "${BLUE}✅ Verifying service health...${NC}"

# Check Prometheus
if curl -f http://localhost:9090/api/v1/status/config &> /dev/null; then
    echo -e "${GREEN}✅ Prometheus is running${NC}"
else
    echo -e "${RED}❌ Prometheus is not responding${NC}"
fi

# Check Grafana
if curl -f http://localhost:3001/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Grafana is running${NC}"
else
    echo -e "${RED}❌ Grafana is not responding${NC}"
fi

# Check AlertManager
if curl -f http://localhost:9093/api/v1/status &> /dev/null; then
    echo -e "${GREEN}✅ AlertManager is running${NC}"
else
    echo -e "${RED}❌ AlertManager is not responding${NC}"
fi

cd ..

# Test metrics endpoint
echo -e "${BLUE}🧪 Testing application metrics...${NC}"
if curl -f http://localhost:3000/api/metrics &> /dev/null; then
    echo -e "${GREEN}✅ Application metrics endpoint is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Application metrics endpoint not accessible (app may not be running)${NC}"
fi

# Test health checks
echo -e "${BLUE}🏥 Testing health check endpoints...${NC}"
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Basic health check is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Health check endpoint not accessible (app may not be running)${NC}"
fi

echo -e "${GREEN}🎉 Monitoring setup complete!${NC}"
echo ""
echo -e "${BLUE}📊 Access your dashboards:${NC}"
echo -e "  🔍 Grafana: ${YELLOW}http://localhost:3001${NC} (admin/${GRAFANA_ADMIN_PASSWORD})"
echo -e "  📈 Prometheus: ${YELLOW}http://localhost:9090${NC}"
echo -e "  🚨 AlertManager: ${YELLOW}http://localhost:9093${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "  1. Configure Slack webhook URL in .env.monitoring"
echo "  2. Set up PagerDuty service keys for critical alerts"
echo "  3. Start your ProcessAudit AI application (npm run dev)"
echo "  4. Verify metrics are being collected in Grafana"
echo ""
echo -e "${GREEN}🎯 Your ProcessAudit AI now has enterprise-grade monitoring!${NC}"