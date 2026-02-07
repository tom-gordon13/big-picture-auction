# Oscar Nomination Overrides System

## Problem
The automated Oscar scraping from OMDb API often returns incorrect or incomplete data for Oscar nominations. For example, OMDb only provides generic award strings like "131 wins & 255 nominations total" without Oscar-specific information.

## Solution
A manual override system that takes precedence over automated scraping.

### How It Works

1. **Override File**: `/api/src/data/oscarOverrides.ts`
   - Contains manually verified Oscar nomination counts
   - Sourced from official Academy Awards announcements
   - Organized by movie title and year

2. **Update Service Integration**: `/api/src/services/updateMovieStats.ts`
   - Checks overrides FIRST before scraping
   - Falls back to automated scraping only if no override exists
   - Logs when overrides are used

3. **Benefits**:
   - ✅ Accurate Oscar data from official sources
   - ✅ Persistent across re-runs of update scripts
   - ✅ Easy to maintain and update
   - ✅ Documented with notes explaining each override

### Adding New Overrides

To add or update Oscar nominations for a movie:

1. Open `/api/src/data/oscarOverrides.ts`
2. Add an entry following this format:

```typescript
'Movie Title|Year': {
  title: 'Movie Title',
  year: 2025,
  nominations: 13,
  note: 'Optional explanation or source'
},
```

**Important**: The title must match EXACTLY as it appears in the database (case-sensitive, including punctuation).

3. Rebuild the API: `docker compose build api`
4. Run the update script to apply: `curl -X POST http://localhost:8080/api/movies/update-all-stats`

### Current Overrides (2026 Oscars / 2025 Films)

All overrides are sourced from the official 98th Academy Awards nominations:
- Source: https://www.pbs.org/newshour/arts/heres-a-full-list-of-2026-oscar-nominees

| Movie | Nominations |
|-------|-------------|
| Sinners | 16 (record-breaking) |
| One Battle After Another | 13 |
| Sentimental Value | 7 |
| Marty Supreme | 6 |
| Hamnet | 6 |
| F1 / F1: The Movie | 4 |
| Avatar: Fire and Ash | 2 |
| It Was Just An Accident | 2 |
| Weapons | 1 |
| Jurassic World Rebirth | 1 |

### Future Maintenance

When Oscar nominations are announced each year:
1. Get the official list from oscars.org or reputable news sources
2. Update `/api/src/data/oscarOverrides.ts` with new entries
3. Rebuild and redeploy

This ensures accurate Oscar data regardless of what automated scraping returns!
