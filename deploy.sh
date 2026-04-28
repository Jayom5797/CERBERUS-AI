#!/bin/bash
# CERBERUS-AI — Full GCP Cloud Run Deployment Script
# Usage: bash deploy.sh [GEMINI_API_KEY]

set -e

PROJECT_ID="bhojaniq-14f7a"
REGION="us-central1"
REPO="kayo-deployments"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

GEMINI_KEY="${1:-}"

echo "🐕 CERBERUS-AI Deployment"
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo "Registry: ${REGISTRY}"
echo ""

# ── Step 1: Configure Docker auth ────────────────────────────────────────────
echo "🔐 Configuring Docker auth..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# ── Step 2: Build & push images from repo root ───────────────────────────────
echo ""
echo "🏗️  Building images..."

# Backend
echo "  → Building backend..."
docker build -f backend/Dockerfile -t ${REGISTRY}/cerberus-backend:latest .
docker push ${REGISTRY}/cerberus-backend:latest

# Crawler
echo "  → Building crawler..."
docker build -f crawler/Dockerfile -t ${REGISTRY}/cerberus-crawler:latest .
docker push ${REGISTRY}/cerberus-crawler:latest

# Demo target
echo "  → Building demo-target..."
docker build -f demo-target/Dockerfile -t ${REGISTRY}/cerberus-demo:latest .
docker push ${REGISTRY}/cerberus-demo:latest

# ── Step 3: Deploy backend ────────────────────────────────────────────────────
echo ""
echo "🚀 Deploying backend..."
BACKEND_URL=$(gcloud run deploy cerberus-backend \
  --image=${REGISTRY}/cerberus-backend:latest \
  --platform=managed \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --allow-unauthenticated \
  --port=4000 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  $([ -n "$GEMINI_KEY" ] && echo "--set-env-vars=GEMINI_API_KEY=${GEMINI_KEY}" || echo "") \
  --format="value(status.url)" 2>&1 | grep "https://")

echo "  Backend URL: ${BACKEND_URL}"

# ── Step 4: Deploy crawler ────────────────────────────────────────────────────
echo ""
echo "🕷️  Deploying crawler..."
CRAWLER_URL=$(gcloud run deploy cerberus-crawler \
  --image=${REGISTRY}/cerberus-crawler:latest \
  --platform=managed \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --allow-unauthenticated \
  --port=4001 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=3 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production" \
  --format="value(status.url)" 2>&1 | grep "https://")

echo "  Crawler URL: ${CRAWLER_URL}"

# ── Step 5: Update backend with crawler URL ───────────────────────────────────
echo ""
echo "🔗 Linking backend → crawler..."
gcloud run services update cerberus-backend \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --update-env-vars="CRAWLER_SERVICE_URL=${CRAWLER_URL}" \
  --quiet

# ── Step 6: Deploy demo target ────────────────────────────────────────────────
echo ""
echo "🎯 Deploying demo target..."
DEMO_URL=$(gcloud run deploy cerberus-demo \
  --image=${REGISTRY}/cerberus-demo:latest \
  --platform=managed \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --allow-unauthenticated \
  --port=3001 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=2 \
  --timeout=60 \
  --format="value(status.url)" 2>&1 | grep "https://")

echo "  Demo URL: ${DEMO_URL}"

# ── Step 7: Build & deploy frontend with backend URL ─────────────────────────
echo ""
echo "🎨 Building frontend with backend URL: ${BACKEND_URL}"
docker build \
  -f frontend/Dockerfile \
  --build-arg VITE_API_URL=${BACKEND_URL} \
  -t ${REGISTRY}/cerberus-frontend:latest .
docker push ${REGISTRY}/cerberus-frontend:latest

echo ""
echo "🌐 Deploying frontend..."
FRONTEND_URL=$(gcloud run deploy cerberus-frontend \
  --image=${REGISTRY}/cerberus-frontend:latest \
  --platform=managed \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60 \
  --set-env-vars="BACKEND_URL=${BACKEND_URL}" \
  --format="value(status.url)" 2>&1 | grep "https://")

echo "  Frontend URL: ${FRONTEND_URL}"

# ── Step 8: Update backend CORS with frontend URL ────────────────────────────
echo ""
echo "🔒 Updating CORS settings..."
gcloud run services update cerberus-backend \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --update-env-vars="FRONTEND_URL=${FRONTEND_URL}" \
  --quiet

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "✅ CERBERUS-AI deployed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 Frontend:    ${FRONTEND_URL}"
echo "  🔧 Backend API: ${BACKEND_URL}/api/health"
echo "  🕷️  Crawler:    ${CRAWLER_URL}/health"
echo "  🎯 Demo Target: ${DEMO_URL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To test: scan ${DEMO_URL} from the frontend"
