# Database Seeding and Stats Updates

This guide explains how to re-seed the database and update movie statistics in the Big Picture Auction application.

## Quick Start

The easiest way to re-seed and update stats is to use the provided script:

```bash
./scripts/reseed-and-update.sh
```

This script will:
1. Clear all database tables
2. Restart the API (which automatically triggers the seed)
3. Wait for seeding to complete
4. Fetch stats for all movies (Metacritic, Box Office, Oscars)

## Manual Steps

If you prefer to run the steps manually:

### 1. Clear the Database

```bash
docker exec big-picture-db psql -U postgres -d big_picture_auction -c \
  "TRUNCATE TABLE movie_stats, picks, player_auctions, auctions, movies, studios, players RESTART IDENTITY CASCADE;"
```

### 2. Restart API to Trigger Seed

```bash
docker restart big-picture-api
```

The API automatically detects an empty database and runs the seed script from `api/prisma/seed.ts`.

Wait about 20 seconds for the seed to complete. You can monitor progress with:

```bash
docker logs big-picture-api -f
```

### 3. Fetch Movie Stats

After seeding, fetch external data (Metacritic scores, Box Office numbers, Oscar nominations):

```bash
curl -X POST http://localhost:8080/api/movies/update-all-stats
```

This takes 2-3 minutes to complete as it fetches data for all movies.

## Updating Stats Without Re-seeding

If you just want to refresh the stats (without re-seeding):

```bash
# Update all movies
curl -X POST http://localhost:8080/api/movies/update-all-stats

# Update a specific movie by title
curl -X POST http://localhost:8080/api/movies/update-stats/Superman
```

## Configuration

### Movie Data

Movie picks are configured in `api/prisma/seed.ts`:
- `movieTitles2025` - Movies for the 2025 auction
- `movieTitles2026` - Movies for the 2026 auction
- `moviePicks2025` - Player picks for 2025
- `moviePicks2026` - Player picks for 2026

**IMPORTANT**: When updating picks, make sure the movie titles in `movieTitlesYYYY` match exactly with the titles in `moviePicksYYYY`. The seed script creates movies from the titles array, then tries to create picks. If the titles don't match, the picks won't be created.

After editing this file, rebuild the API container:

```bash
docker compose up -d --build api
```

### Year-Aware Movie Stats

The stats fetcher now uses the movie's release year to help identify the correct film:

- **Box Office Mojo**: Searches with year context to avoid matching older films with the same title
- **OMDb API**: Filters by year to get the correct movie metadata
- **Metacritic**: Year helps when there are multiple films with similar titles

This prevents issues like fetching box office data for "Narnia (2005)" when you meant "Narnia (2026)".

### API Keys

The stats fetcher uses several APIs:

- **OMDb API** (for movie metadata): Set `OMDB_API_KEY` in `api/.env`
- **Metacritic** (web scraping): No key required
- **Box Office Mojo** (web scraping): No key required
- **Oscars** (web scraping): No key required

## Current Data

The database currently contains:
- **2 Auctions**: 2025 Winter Auction (completed), 2026 Winter Auction (active)
- **30 Movies**: 15 for 2025, 15 for 2026
- **30 Picks**: 15 for 2025, 15 for 2026
- **3 Players**: Sean Fennessy, Amanda Dobbins, Chris Ryan

## Troubleshooting

### Seed doesn't run automatically

If the seed doesn't run after restarting:

```bash
# Check if data already exists
docker exec big-picture-db psql -U postgres -d big_picture_auction -c "SELECT COUNT(*) FROM players;"

# If it returns > 0, the seed won't run. Clear the database first.
```

### Stats update fails

Check the logs for errors:

```bash
docker logs big-picture-api --tail 100
```

Common issues:
- **Rate limiting**: Web scrapers may hit rate limits. Wait a few minutes and try again.
- **Invalid API key**: For OMDb, check that `OMDB_API_KEY` is set in `api/.env`
- **Movie not found**: Some movies may not have data available yet (especially future releases)

### Docker not running

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps
```

## API Endpoints

Useful endpoints for checking data:

```bash
# Get available auction years
curl http://localhost:8080/api/auctions/years

# Get leaderboard for 2025
curl http://localhost:8080/api/auctions/latest/leaderboard?year=2025

# Get leaderboard for 2026
curl http://localhost:8080/api/auctions/latest/leaderboard?year=2026

# Get latest (defaults to 2026)
curl http://localhost:8080/api/auctions/latest/leaderboard

# Health check
curl http://localhost:8080/api/health
```
