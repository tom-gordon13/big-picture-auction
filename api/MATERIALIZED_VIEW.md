# Materialized View: movie_picks_with_stats

## Overview

The `movie_picks_with_stats` materialized view combines data from multiple tables to provide a **high-performance, denormalized view** of movies, their statistics, and the players who picked them.

## Why a Materialized View?

**Performance Benefits:**
- Pre-joins movies, stats, picks, players, auctions, and studios
- Indexed for fast queries
- No need for complex joins at query time
- Perfect for read-heavy operations like leaderboards

**Use Cases:**
- Displaying leaderboards
- Showing player portfolios
- Movie performance analytics
- Auction summaries

## Schema

The view includes:

### Movie Information
- `movie_id`, `movie_title`, `director`, `genre`, `budget`
- `anticipated_release_date`, `actual_release_date`, `movie_status`
- `poster_url`, `trailer_url`

### Studio Information
- `studio_name`, `studio_logo_url`

### Movie Stats
- `oscar_nominations`, `oscar_wins`
- `domestic_box_office`, `international_box_office`, `total_box_office`
- `metacritic_score`
- `stats_updated_at`

### Pick Information
- `pick_id`, `purchase_amount`, `pick_date`

### Player Information
- `player_id`, `player_first_name`, `player_last_name`, `player_full_name`

### Auction Information
- `auction_id`, `auction_name`, `auction_year`, `auction_cycle`
- `auction_status`, `auction_start_date`, `auction_end_date`
- `auction_budget_per_player`

### Calculated Fields
- `box_office_achieved` (1 if total >= $100M, else 0)
- `oscar_achieved` (1 if nominations > 0, else 0)
- `metacritic_achieved` (1 if score >= 85, else 0)
- `total_points` (sum of all three achievements)

## Refreshing the View

The materialized view is **automatically refreshed** after:
- Running `updateAllMovieStats()` (updates all movies)
- Running `updateMovieStatsByTitle(title)` (updates single movie)
- Calling the update endpoints

### Manual Refresh

**Via TypeScript:**
```typescript
import { refreshMoviePicksView } from './services/materializedView';

await refreshMoviePicksView();
```

**Via API:**
```bash
curl -X POST http://localhost:5000/api/materialized-view/refresh
```

**Via SQL:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY movie_picks_with_stats;
```

## Querying the View

### 1. Get All Picks for an Auction

**TypeScript:**
```typescript
import { getMoviePicksByAuction } from './services/materializedView';

const picks = await getMoviePicksByAuction(2026, 1);
```

**API:**
```bash
curl http://localhost:5000/api/materialized-view/auction/2026/1
```

**SQL:**
```sql
SELECT * FROM movie_picks_with_stats
WHERE auction_year = 2026 AND auction_cycle = 1
ORDER BY player_full_name, movie_title;
```

### 2. Get Leaderboard for an Auction

**TypeScript:**
```typescript
import { getLeaderboardFromView } from './services/materializedView';

const leaderboard = await getLeaderboardFromView(2026, 1);
```

**API:**
```bash
curl http://localhost:5000/api/materialized-view/leaderboard/2026/1
```

**Response:**
```json
[
  {
    "player_id": "uuid",
    "player_full_name": "Amanda Dobbins",
    "total_movies": 2,
    "total_spent": 450,
    "total_points": 3,
    "box_office_achievements": 2,
    "oscar_achievements": 1,
    "metacritic_achievements": 1,
    "combined_box_office": 250000000,
    "movies": [
      {
        "movie_id": "uuid",
        "title": "Movie Title",
        "purchase_amount": 200,
        "points": 2,
        "domestic_box_office": 100000000,
        ...
      }
    ]
  }
]
```

### 3. Get a Player's Picks

**TypeScript:**
```typescript
import { getPlayerMoviePicks } from './services/materializedView';

const picks = await getPlayerMoviePicks(playerId, auctionId);
```

**API:**
```bash
curl http://localhost:5000/api/materialized-view/player/{playerId}/auction/{auctionId}
```

### 4. Get a Movie with All Picks

**TypeScript:**
```typescript
import { getMovieWithAllPicks } from './services/materializedView';

const picks = await getMovieWithAllPicks(movieId);
```

**API:**
```bash
curl http://localhost:5000/api/materialized-view/movie/{movieId}/picks
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/materialized-view/refresh` | Manually refresh the view |
| GET | `/api/materialized-view/auction/:year/:cycle` | Get all picks for an auction |
| GET | `/api/materialized-view/leaderboard/:year/:cycle` | Get aggregated leaderboard |
| GET | `/api/materialized-view/player/:playerId/auction/:auctionId` | Get player's picks |
| GET | `/api/materialized-view/movie/:movieId/picks` | Get all picks for a movie |

## Indexes

The view has indexes on:
- `pick_id` (unique)
- `movie_id`
- `player_id`
- `auction_id`
- `(auction_year, auction_cycle)`
- `(player_id, auction_id)`

These indexes ensure **fast query performance** for common access patterns.

## Testing

Run the test script:
```bash
npx tsx src/scripts/test-materialized-view.ts
```

This will:
1. Verify the view exists
2. Count rows
3. Show sample data
4. Test query functions
5. Test refresh functionality

## Performance

**Benefits:**
- ✅ Single query instead of multiple joins
- ✅ Pre-calculated achievement flags
- ✅ Indexed for common queries
- ✅ Concurrent refresh (no blocking)

**Trade-offs:**
- ⚠️ Data is snapshot (refreshed after stats updates)
- ⚠️ Uses additional storage
- ⚠️ Refresh takes time (runs concurrently to minimize blocking)

## Migration

The view was created in migration:
```
prisma/migrations/20260201_add_movie_picks_view/migration.sql
```

To recreate if needed:
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d big_picture_auction \
  -f prisma/migrations/20260201_add_movie_picks_view/migration.sql
```

## Example Queries

### Find Top Scoring Movies
```sql
SELECT movie_title, player_full_name, total_points, total_box_office
FROM movie_picks_with_stats
WHERE auction_year = 2026 AND auction_cycle = 1
ORDER BY total_points DESC, total_box_office DESC
LIMIT 10;
```

### Find Players with Metacritic Achievements
```sql
SELECT player_full_name, COUNT(*) as metacritic_wins
FROM movie_picks_with_stats
WHERE metacritic_achieved = 1
GROUP BY player_full_name
ORDER BY metacritic_wins DESC;
```

### Calculate ROI (Points per Dollar Spent)
```sql
SELECT
  player_full_name,
  SUM(total_points) as total_points,
  SUM(purchase_amount) as total_spent,
  ROUND(SUM(total_points)::numeric / NULLIF(SUM(purchase_amount), 0), 3) as roi
FROM movie_picks_with_stats
WHERE auction_year = 2026 AND auction_cycle = 1
GROUP BY player_full_name
ORDER BY roi DESC;
```

## Notes

- The view uses `COALESCE` to handle NULL stats gracefully
- BigInt values (box office) may need special handling in JavaScript
- The view automatically updates when underlying tables change (after refresh)
- Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid blocking reads
