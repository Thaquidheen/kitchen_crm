#!/bin/bash
# Kitchen CRM — redeploy the kitchen panel after the full-width layout change.
# Code only: the 484 frames are unchanged and already on the server.
set -o pipefail
cd /root/kitchen-crm || { echo "DEPLOY_FAILED: no app dir"; exit 1; }

echo "=== [1/5] extract code ==="
tar xzf kbp_code.tgz || { echo "DEPLOY_FAILED: extract"; exit 1; }
rm -f kbp_code.tgz
echo "frames still present: $(ls kitchen-crm-frontend/public/frames/desktop | wc -l) desktop / $(ls kitchen-crm-frontend/public/frames/mobile | wc -l) mobile"
echo "text column removed (kbp-copy should be 0): $(grep -c 'kbp-copy' kitchen-crm-frontend/src/components/kitchen/KitchenBuildPanel.tsx)"
echo "high-quality smoothing present: $(grep -c "imageSmoothingQuality" kitchen-crm-frontend/src/components/kitchen/KitchenBuildPanel.tsx)"

echo "=== [2/5] tag current frontend image for rollback (BY ID, before build) ==="
docker tag "$(docker inspect kitchen_crm_frontend --format '{{.Image}}')" kitchen-crm-backend-frontend:prev \
  && echo "tagged :prev"

echo "=== [3/5] build frontend ==="
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml build --progress plain frontend
rc=$?; echo "BUILD_RC=$rc"
if [ $rc -ne 0 ]; then echo "DEPLOY_FAILED: build"; exit 1; fi

echo "=== [4/5] recreate frontend + restart edge nginx ==="
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend
rc=$?; echo "UP_RC=$rc"
if [ $rc -ne 0 ]; then echo "DEPLOY_FAILED: up"; exit 1; fi
docker restart kitchen_crm_nginx
sleep 6

echo "=== [5/5] verify (read-only) ==="
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml ps --format '{{.Name}}\t{{.Status}}'
curl -s -o /dev/null -w "site_root=%{http_code}\n" http://localhost/
curl -s -o /dev/null -w "login=%{http_code}\n" -X POST http://localhost/api/auth/login
BUNDLE="$(curl -s http://localhost/ | grep -o 'assets/index-[^\"]*\.js' | head -1)"
echo "bundle=$BUNDLE"
echo "panel still in bundle (expect 1): $(curl -s "http://localhost/$BUNDLE" | grep -c 'Scroll to build')"
echo "old chip labels gone (expect 0): $(curl -s "http://localhost/$BUNDLE" | grep -c 'Storage, floor to ceiling.\{0,40\}Light and texture')"
echo "--- frame still served as webp ---"
curl -sI http://localhost/frames/desktop/frame-001.webp | grep -i 'content-type\|cache-control'
echo "DEPLOY_DONE"
