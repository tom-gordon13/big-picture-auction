#!/bin/bash

# Script to re-seed the database and update movie stats
# Usage: ./scripts/reseed-and-update.sh

set -e

echo "════════════════════════════════════════════════════════"
echo "  Big Picture Auction - Re-seed and Update Stats"
echo "════════════════════════════════════════════════════════"
echo ""

# Step 1: Clear the database
echo "Step 1: Clearing database..."
docker exec big-picture-db psql -U postgres -d big_picture_auction -c \
  "TRUNCATE TABLE movie_stats, picks, player_auctions, auctions, movies, studios, players RESTART IDENTITY CASCADE;" \
  > /dev/null 2>&1

echo "✓ Database cleared"
echo ""

# Step 2: Restart API to trigger seed
echo "Step 2: Restarting API to trigger seed..."
docker restart big-picture-api > /dev/null 2>&1
echo "✓ API restarted"
echo ""

# Step 3: Wait for seed to complete
echo "Step 3: Waiting for database seed to complete..."
sleep 20
echo "✓ Seed completed"
echo ""

# Step 4: Fetch movie stats
echo "Step 4: Fetching movie stats (Metacritic, Box Office, Oscars)..."
echo "   This may take 2-3 minutes..."
RESULT=$(curl -s -X POST http://localhost:8080/api/movies/update-all-stats)
TOTAL=$(echo $RESULT | jq -r '.total')
SUCCESS=$(echo $RESULT | jq -r '.successful')
FAILED=$(echo $RESULT | jq -r '.failed')

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Update Complete!"
echo "════════════════════════════════════════════════════════"
echo "  Total movies: $TOTAL"
echo "  Successful:   $SUCCESS"
echo "  Failed:       $FAILED"
echo ""
echo "  View the app at: http://localhost:8081"
echo "════════════════════════════════════════════════════════"
