#!/bin/bash

# Exit on error
set -e

# Load environment variables
echo "📝 Loading environment variables..."
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
  echo "✅ Environment variables loaded from .env.production"
else
  echo "⚠️ Warning: .env.production not found, using default environment"
fi

# Create deployment log
DEPLOY_LOG="deploy_$(date +%Y%m%d_%H%M%S).log"
echo "📝 Starting deployment at $(date)" > $DEPLOY_LOG

# Function to log messages
log() {
  echo "$1" | tee -a $DEPLOY_LOG
}

# Function to handle errors
handle_error() {
  log "❌ Error: $1"
  log "🔄 Attempting rollback..."
  
  # Stop containers
  docker-compose down
  
  # Send failure notification
  if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"❌ Deployment failed: $1\"}" \
      $SLACK_WEBHOOK_URL
  fi
  
  exit 1
}

# Build and start containers
log "🚀 Starting deployment process..."
log "📦 Building and starting containers..."
docker-compose up --build -d || handle_error "Failed to start containers"

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
log "🔄 Running database migrations..."
docker-compose exec backend npx prisma migrate deploy || handle_error "Database migration failed"

# Health checks
log "🔍 Running health checks..."

# Frontend health check
if ! curl -sSf http://localhost:3000/health > /dev/null; then
  handle_error "Frontend failed health check"
fi
log "✅ Frontend health check passed"

# Backend health check
if ! curl -sSf http://localhost:3001/api/health > /dev/null; then
  handle_error "Backend failed health check"
fi
log "✅ Backend health check passed"

# Check service status
log "🔍 Checking service status..."
docker-compose ps

# Send success notification
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
  log "📤 Sending deployment notification..."
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ Deployment successful!\n🌐 Frontend: http://localhost:3000\n🔌 Backend: http://localhost:3001\"}" \
    $SLACK_WEBHOOK_URL
fi

log "✅ Deployment completed successfully!"
log "🌐 Frontend is available at: http://localhost:3000"
log "🔌 Backend is available at: http://localhost:3001"
log "📝 Deployment log saved to: $DEPLOY_LOG" 