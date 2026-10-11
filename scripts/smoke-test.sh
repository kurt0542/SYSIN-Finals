#!/usr/bin/env sh
# Smoke test verification script for PlaylistHub
# Usage: ./scripts/smoke-test.sh [TARGET_TAG]

TARGET_TAG="${1:-}"
PROXY_URL="${PROXY_URL:-http://localhost:8080}"
MAX_RETRIES=15
DELAY_SEC=4

echo "=================================================="
echo "Starting PlaylistHub End-to-End Smoke Test"
echo "Target Base URL: ${PROXY_URL}"
if [ -n "$TARGET_TAG" ]; then
  echo "Expected Build Tag: Build #${TARGET_TAG}"
fi
echo "=================================================="

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i of $MAX_RETRIES: Checking service endpoints..."
  
  # 1. Check Songs API through proxy
  SONGS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROXY_URL}/api/songs/health" 2>/dev/null || true)
  
  # 2. Check Playlists API through proxy
  PLAYLISTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROXY_URL}/api/playlists/health" 2>/dev/null || true)
  
  # 3. Check Frontend HTML response
  FRONTEND_BODY=$(curl -s "${PROXY_URL}/" 2>/dev/null || true)

  if [ "$SONGS_STATUS" = "200" ] && [ "$PLAYLISTS_STATUS" = "200" ]; then
    if [ -n "$TARGET_TAG" ]; then
      if echo "$FRONTEND_BODY" | grep -q "Build #${TARGET_TAG}"; then
        echo "SUCCESS: Songs API healthy (200), Playlists API healthy (200), Frontend serving Build #${TARGET_TAG}!"
        exit 0
      else
        echo "APIs responded, but Build #${TARGET_TAG} is not yet reflected in HTML. Retrying..."
      fi
    else
      if echo "$FRONTEND_BODY" | grep -q "Build #"; then
        echo "SUCCESS: Songs API healthy (200), Playlists API healthy (200), Frontend healthy!"
        exit 0
      fi
    fi
  else
    echo "Waiting for services... (songs-api HTTP: ${SONGS_STATUS}, playlist-api HTTP: ${PLAYLISTS_STATUS})"
  fi

  sleep $DELAY_SEC
done

echo "ERROR: Smoke test failed after $MAX_RETRIES attempts!"
exit 1
