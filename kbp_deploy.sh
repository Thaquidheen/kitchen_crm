#!/bin/bash
# Kitchen CRM — deploy the scroll-driven kitchen build panel (FRONTEND ONLY).
# No backend change, no DB migration, no Flyway version.
#
# Deliberately git-pull-free: the server's GitHub creds are expired, and
# `git pull` aborts the whole chain on this box.
set -o pipefail
cd /root/kitchen-crm || { echo "DEPLOY_FAILED: no app dir"; exit 1; }

echo "=== [1/6] extract uploaded trees ==="
tar xzf kbp_code.tgz   || { echo "DEPLOY_FAILED: extract code"; exit 1; }
tar xzf kbp_frames.tgz || { echo "DEPLOY_FAILED: extract frames"; exit 1; }
rm -f kbp_code.tgz kbp_frames.tgz
echo "frames on disk: $(ls kitchen-crm-frontend/public/frames/desktop | wc -l) desktop / $(ls kitchen-crm-frontend/public/frames/mobile | wc -l) mobile"
echo "gsap/lenis in package.json:"; grep -E '"(gsap|lenis)"' kitchen-crm-frontend/package.json
echo "webp in frontend nginx.conf:"; grep -c 'webp' kitchen-crm-frontend/nginx.conf

echo "=== [2/6] tag current frontend image for rollback (BY ID, before build) ==="
PREV_ID="$(docker inspect kitchen_crm_frontend --format '{{.Image}}')"
echo "current frontend image: $PREV_ID"
docker tag "$PREV_ID" kitchen-crm-backend-frontend:prev && echo "tagged kitchen-crm-backend-frontend:prev"

echo "=== [3/6] build frontend (no pipe — a piped exit code would mask a failed build) ==="
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml build --progress plain frontend
rc=$?
echo "BUILD_RC=$rc"
if [ $rc -ne 0 ]; then echo "DEPLOY_FAILED: frontend build"; exit 1; fi

echo "=== [4/6] recreate frontend (force — build alone can leave the old container) ==="
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend
rc=$?
echo "UP_RC=$rc"
if [ $rc -ne 0 ]; then echo "DEPLOY_FAILED: frontend up"; exit 1; fi

echo "=== [5/6] restart edge nginx (it caches upstream container IPs -> 502s) ==="
docker restart kitchen_crm_nginx
sleep 6

echo "=== [6/6] verify (read-only) ==="
docker compose -p kitchen-crm-backend -f docker-compose.prod.yml ps
echo "--- site root ---"
curl -s -o /dev/null -w "site_root=%{http_code}\n" http://localhost/
echo "--- backend still healthy (401 = mapped+secured) ---"
curl -s -o /dev/null -w "login=%{http_code}\n" -X POST http://localhost/api/auth/login
echo "--- live bundle ---"
BUNDLE="$(curl -s http://localhost/ | grep -o 'assets/index-[^\"]*\.js' | head -1)"
echo "bundle=$BUNDLE"
echo "--- new UI strings present in bundle? ---"
curl -s "http://localhost/$BUNDLE" | grep -c 'It starts with a plan'
echo "--- a frame is served, and cacheable ---"
curl -s -o /dev/null -w "frame001=%{http_code}\n" http://localhost/frames/desktop/frame-001.webp
curl -sI http://localhost/frames/desktop/frame-001.webp | grep -i 'cache-control\|content-type'
echo "DEPLOY_DONE"
