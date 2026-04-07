#!/bin/bash
# Kitchen CRM Deployment Script
# This script will connect to the server and deploy the latest changes

echo "======================================"
echo "Kitchen CRM Deployment"
echo "======================================"
echo ""
echo "Connecting to server at 157.173.114.116..."
echo ""

ssh root@157.173.114.116 "
cd /root/kitchen-crm && \
echo 'Pulling latest code...' && \
git pull origin main && \
echo 'Building and starting containers...' && \
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml up -d --build && \
echo 'Deployment complete! Showing status...' && \
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml ps && \
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml logs --tail=30
"

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
