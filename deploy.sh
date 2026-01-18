#!/bin/bash
# Kitchen CRM Deployment Script
# This script will connect to the server and deploy the latest changes

echo "======================================"
echo "Kitchen CRM Deployment"
echo "======================================"
echo ""
echo "Connecting to server at 157.173.114.116..."
echo ""

ssh ubuntu@157.173.114.116 "
cd ~/Kitchen_CRM && \
echo 'Pulling latest code...' && \
git pull origin main && \
echo 'Stopping containers...' && \
docker-compose -f docker-compose.prod.yml down && \
echo 'Building and starting containers...' && \
docker-compose -f docker-compose.prod.yml up -d --build && \
echo 'Deployment complete! Showing logs...' && \
docker-compose -f docker-compose.prod.yml ps && \
docker-compose -f docker-compose.prod.yml logs --tail=30
"

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
