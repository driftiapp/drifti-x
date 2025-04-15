#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
fi

# Create rollback log
ROLLBACK_LOG="rollback_$(date +%Y%m%d_%H%M%S).log"
echo "📝 Starting rollback at $(date)" > $ROLLBACK_LOG

# Function to log messages
log() {
  echo "$1" | tee -a $ROLLBACK_LOG
}

# Function to handle errors
handle_error() {
  log "❌ Error: $1"
  log "🔄 Attempting recovery..."
  
  # Send failure notification
  if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"❌ Rollback failed: $1\"}" \
      $SLACK_WEBHOOK_URL
  fi
  
  exit 1
}

# Stop all containers
log "🛑 Stopping all containers..."
docker-compose down || handle_error "Failed to stop containers"

# Revert database if versioned
if [ -d "backend/prisma/migrations" ]; then
  log "🔄 Reverting database migrations..."
  docker-compose exec backend npx prisma migrate reset --force || handle_error "Failed to reset database"
fi

# Pull last stable commit
log "📥 Pulling last stable commit..."
git reset --hard HEAD~1 || handle_error "Failed to reset git"
git clean -fd || handle_error "Failed to clean git"

# Rebuild and start containers
log "🔄 Rebuilding and starting containers..."
docker-compose up --build -d || handle_error "Failed to start containers"

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 10

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

# Send success notification
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
  log "📤 Sending rollback notification..."
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ Rollback successful!\n🌐 Frontend: http://localhost:3000\n🔌 Backend: http://localhost:3001\"}" \
    $SLACK_WEBHOOK_URL
fi

log "✅ Rollback completed successfully!"
log "🌐 Frontend is available at: http://localhost:3000"
log "🔌 Backend is available at: http://localhost:3001"
log "📝 Rollback log saved to: $ROLLBACK_LOG" 