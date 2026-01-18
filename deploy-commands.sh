#!/bin/bash
# SSH into your server and run these commands:

cd ~/Kitchen_CRM
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml logs -f --tail=50
