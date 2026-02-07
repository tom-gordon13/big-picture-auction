# Testing Movie Stats Services

This guide shows you how to test the movie stats fetching functionality (Metacritic, Box Office, Oscar nominations).

## Testing Options

### Option 1: Run TypeScript Test Script (Recommended)

Test all three services with known movies that have data:

```bash
npx tsx src/scripts/test-movie-stats.ts
```

This will:
- ✅ Test Metacritic service with "Dune: Part Two", "Oppenheimer", "The Batman"
- ✅ Test Box Office service with the same movies
- ✅ Test Oscar Nominations service with the same movies
- ✅ Test the combined `updateMovieStatsByTitle()` function
- ✅ Show detailed output for each test

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║         Testing Movie Stats Services                  ║
╚════════════════════════════════════════════════════════╝

============================================================
Testing: "Dune: Part Two" (2024)
============================================================

1️⃣  Testing Metacritic Service...
   ✓ Metacritic Score: 79

2️⃣  Testing Box Office Service...
   ✓ Domestic: $282,144,271
   ✓ International: $429,417,426
   ✓ Worldwide: $711,561,697

3️⃣  Testing Oscar Nominations Service...
   ✓ Oscar Nominations: 5
```

### Option 2: Test Individual API Endpoints

Make sure your API server is running, then use curl:

#### Test Metacritic Endpoint
```bash
curl http://localhost:5000/api/metacritic/Oppenheimer | jq '.'
```

Expected response:
```json
{
  "title": "Oppenheimer",
  "score": "89",
  "details": {
    "score": 89,
    "reviewCount": 62,
    "url": "https://www.metacritic.com/movie/oppenheimer/"
  }
}
```

#### Test Box Office Endpoint
```bash
curl "http://localhost:5000/api/boxoffice/Dune:%20Part%20Two" | jq '.'
```

Expected response:
```json
{
  "title": "Dune: Part Two",
  "domestic": 282144271,
  "international": 429417426,
  "total": 711561697
}
```

#### Test Oscar Nominations Endpoint
```bash
curl "http://localhost:5000/api/oscars/Oppenheimer?year=2023" | jq '.'
```

Expected response:
```json
{
  "title": "Oppenheimer",
  "nominations": 13,
  "awards": "Won 7 Oscars. 13 nominations total"
}
```

#### Test Update Single Movie Stats (Database Update)
```bash
curl -X POST "http://localhost:5000/api/movies/update-stats/The%20Odyssey" | jq '.'
```

Expected response:
```json
{
  "message": "Update completed with errors",
  "result": {
    "movieId": "uuid-here",
    "success": false,
    "successfulFetches": 0,
    "updates": {
      "metacritic": "N/A",
      "boxOffice": null,
      "oscarNominations": 0
    },
    "errors": [
      "Metacritic: Movie not found or score unavailable",
      "Box Office: Movie not found on Box Office Mojo",
      "Oscar Nominations: Movie not found on OMDb"
    ]
  }
}
```

**Note:** For unreleased movies like "The Odyssey", you'll get "N/A" or 0 values, which is expected!

#### Test Update All Movies
```bash
curl -X POST http://localhost:5000/api/movies/update-all-stats | jq '.'
```

This updates stats for ALL movies in the database and refreshes the materialized view.

### Option 3: Use the Bash Test Script

Run all endpoint tests at once:

```bash
./test-endpoints.sh
```

This will test all 5 endpoints in sequence and show formatted JSON output.

## Testing with Your Seeded Movies

Your database has these movies (all unreleased as of 2026):
- The Odyssey
- Toy Story 5
- Narnia
- Digger
- Jack of Spades
- Dune: Part 3
- Project Hail Mary
- The Social Reckoning
- Verity
- The Mandalorian & Grogu
- Wuthering Heights
- Resident Evil
- The Devil Wears Prada 2
- The Adventures of Cliff Booth
- Disclosure Day

**Expected behavior for unreleased movies:**
- ✅ Metacritic: "N/A" (not reviewed yet)
- ✅ Box Office: null or 0 (not released yet)
- ✅ Oscar Nominations: 0 (awards haven't happened yet)

This is **correct** behavior! The stats will update once movies are released.

## Testing with Released Movies

To test with movies that actually have data, you can temporarily add a released movie to your database:

```bash
# Example: Test with "Dune: Part Two" which has real stats
curl -X POST "http://localhost:5000/api/movies/update-stats/Dune:%20Part%20Two"
```

## Verifying the Database Was Updated

After running an update, check the `movie_stats` table:

```bash
# Connect to database
docker exec -it big-picture-db psql -U postgres -d big_picture_auction

# Query movie stats
SELECT
  m.title,
  ms."metacriticScore",
  ms."domesticBoxOffice",
  ms."oscarNominations"
FROM movies m
LEFT JOIN movie_stats ms ON m.id = ms."movieId"
LIMIT 5;
```

## Checking the Materialized View

The materialized view should refresh automatically after stats updates:

```bash
# Query the materialized view
SELECT
  movie_title,
  oscar_nominations,
  metacritic_score,
  total_box_office
FROM movie_picks_with_stats
LIMIT 5;
```

## Troubleshooting

### "OMDB_API_KEY not found"
- Make sure your `.env` file has `OMDB_API_KEY` set
- This is only needed for Oscar nominations

### "TMDB_API_KEY not found"
- Make sure your `.env` file has `TMDB_API_KEY` set
- This is used during seeding for posters

### Web scraping returns null
- Metacritic and Box Office Mojo can be finicky
- Movie titles need to match exactly (try different variations)
- Some movies may not have pages yet if unreleased

### Rate limiting
- The services have built-in delays (200-500ms)
- Don't run `update-all-stats` too frequently
- Be respectful of the external APIs

## Summary

✅ **Best for quick testing:** `npx tsx src/scripts/test-movie-stats.ts`
✅ **Best for API testing:** `./test-endpoints.sh`
✅ **Best for single movie:** `curl -X POST http://localhost:5000/api/movies/update-stats/MovieName`
✅ **Best for all movies:** `curl -X POST http://localhost:5000/api/movies/update-all-stats`
