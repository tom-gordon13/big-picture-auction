#!/bin/bash

# Test script for movie stats API endpoints
# Make sure the API server is running on port 5000

echo "╔════════════════════════════════════════════════════════╗"
echo "║         Testing Movie Stats API Endpoints             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000"

# Test 1: Metacritic endpoint
echo "1️⃣  Testing Metacritic endpoint..."
echo "GET $API_URL/api/metacritic/Oppenheimer"
curl -s "$API_URL/api/metacritic/Oppenheimer" | jq '.'
echo ""

# Test 2: Box Office endpoint
echo "2️⃣  Testing Box Office endpoint..."
echo "GET $API_URL/api/boxoffice/Dune: Part Two"
curl -s "$API_URL/api/boxoffice/Dune:%20Part%20Two" | jq '.'
echo ""

# Test 3: Oscar nominations endpoint
echo "3️⃣  Testing Oscar nominations endpoint..."
echo "GET $API_URL/api/oscars/Oppenheimer?year=2023"
curl -s "$API_URL/api/oscars/Oppenheimer?year=2023" | jq '.'
echo ""

# Test 4: Update stats for a specific movie (if it exists in DB)
echo "4️⃣  Testing update stats for specific movie..."
echo "POST $API_URL/api/movies/update-stats/The Odyssey"
curl -s -X POST "$API_URL/api/movies/update-stats/The%20Odyssey" | jq '.'
echo ""

# Test 5: Update all movie stats
echo "5️⃣  Testing update all movie stats..."
echo "POST $API_URL/api/movies/update-all-stats"
echo "(This will take a while as it fetches data for all movies...)"
curl -s -X POST "$API_URL/api/movies/update-all-stats" | jq '.'
echo ""

echo "✓ All endpoint tests completed!"
