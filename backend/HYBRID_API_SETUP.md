# Hybrid API Setup - Multi-Source Movie Data

## Overview

The application uses a **hybrid approach** to fetch movie data from multiple sources, ensuring the best coverage and data quality:

```
TMDB (Primary) → OMDb (Fallback) → Web Scraping (Specialized)
```

## Data Sources

### 1. **TMDB (The Movie Database)** - PRIMARY ⭐
- **Used for**: Posters, Genres, General movie info
- **Why**: Better coverage of upcoming movies, higher quality posters, generous rate limits
- **API Key**: Free forever, no trial period
- **Rate Limit**: 40 requests per 10 seconds
- **Get key**: https://www.themoviedb.org/settings/api

### 2. **OMDb (Open Movie Database)** - FALLBACK
- **Used for**: Oscar nominations, Backup posters/genres
- **Why**: Comprehensive awards data, includes Metacritic scores
- **API Key**: Free tier available (1,000 requests/day)
- **Rate Limit**: 1,000 requests per day (free tier)
- **Get key**: http://www.omdbapi.com/apikey.aspx

### 3. **Metacritic** - WEB SCRAPING
- **Used for**: Review scores (0-100)
- **Why**: Most authoritative critic scores
- **No API key needed**
- **Method**: Web scraping with cheerio

### 4. **Box Office Mojo** - WEB SCRAPING
- **Used for**: Detailed box office revenue
- **Why**: Most comprehensive box office data
- **No API key needed**
- **Method**: Web scraping with cheerio

## How the Hybrid Approach Works

### Movie Posters & Genres (imdb.ts service)
```
1. Try TMDB first
   ├─ Success? → Use TMDB poster & genres
   └─ Fail? → Try OMDb
      ├─ Success? → Use OMDb poster & genres
      └─ Fail? → Return null
```

### Oscar Nominations (oscars.ts service)
```
Uses OMDb directly (best source for Oscar data)
```

### Metacritic Scores (metacritic.ts service)
```
Web scrapes Metacritic.com (only source for this data)
```

### Box Office Data (boxoffice.ts service)
```
Web scrapes Box Office Mojo (only comprehensive source)
```

## Setup Instructions

### Step 1: Get TMDB API Key (Primary - Recommended)

1. Create account: https://www.themoviedb.org/signup
2. Go to: https://www.themoviedb.org/settings/api
3. Click "Request an API Key"
4. Fill out the form (select "Developer" or "Educational")
5. Copy your API Key (v3 auth)
6. Add to `.env`:
   ```bash
   TMDB_API_KEY=your_actual_tmdb_key_here
   ```

### Step 2: Get OMDb API Key (Fallback - Optional but Recommended)

1. Visit: http://www.omdbapi.com/apikey.aspx
2. Select FREE plan (1,000 requests/day)
3. Enter your email
4. Check email and activate key
5. Add to `.env`:
   ```bash
   OMDB_API_KEY=your_actual_omdb_key_here
   ```

### Step 3: Verify Setup

```bash
# Check which keys are set
node -e "require('dotenv').config(); console.log('TMDB:', process.env.TMDB_API_KEY ? '✓' : '✗', '\nOMDB:', process.env.OMDB_API_KEY ? '✓' : '✗');"
```

## What Each Service Uses

| Service | Primary Source | Fallback | Requires API Key? |
|---------|---------------|----------|-------------------|
| **Posters** | TMDB | OMDb | Yes (TMDB recommended) |
| **Genres** | TMDB | OMDb | Yes (TMDB recommended) |
| **Oscar Nominations** | OMDb | - | Yes (OMDb required) |
| **Metacritic Scores** | Web Scraping | - | No |
| **Box Office Revenue** | Web Scraping | - | No |

## Configuration Scenarios

### Scenario 1: TMDB Only (Recommended Minimum)
```bash
TMDB_API_KEY=abc123
# OMDB_API_KEY=  # not set
```

**Result**:
- ✅ Posters & Genres work (TMDB)
- ❌ Oscar nominations won't be fetched
- ✅ Metacritic scores work (scraping)
- ✅ Box office works (scraping)

### Scenario 2: Both TMDB + OMDb (Best Setup) ⭐
```bash
TMDB_API_KEY=abc123
OMDB_API_KEY=xyz789
```

**Result**:
- ✅ Posters & Genres work (TMDB primary, OMDb fallback)
- ✅ Oscar nominations work (OMDb)
- ✅ Metacritic scores work (scraping)
- ✅ Box office works (scraping)
- 🎯 **Maximum data coverage!**

### Scenario 3: OMDb Only
```bash
# TMDB_API_KEY=  # not set
OMDB_API_KEY=xyz789
```

**Result**:
- ✅ Posters & Genres work (OMDb only, may have gaps)
- ✅ Oscar nominations work (OMDb)
- ✅ Metacritic scores work (scraping)
- ✅ Box office works (scraping)
- ⚠️ May miss some upcoming movies

### Scenario 4: No API Keys
```bash
# TMDB_API_KEY=  # not set
# OMDB_API_KEY=  # not set
```

**Result**:
- ❌ Posters & Genres won't be fetched
- ❌ Oscar nominations won't be fetched
- ✅ Metacritic scores work (scraping)
- ✅ Box office works (scraping)
- ⚠️ Limited functionality

## Service Behavior Details

### Poster/Genre Fetching (Seed Script & IMDb Service)

When you run the seed script or fetch movie data:

```typescript
// With TMDB_API_KEY set:
Fetching: "The Odyssey"
  ✓ Found "The Odyssey" on TMDB (2025)
    Poster: https://image.tmdb.org/t/p/w500/abc123.jpg
    Genres: Action, Adventure, Drama

// TMDB fails, OMDb succeeds:
Fetching: "Obscure Movie"
  ⚠ Movie "Obscure Movie" not found on TMDB
  ✓ Found "Obscure Movie" on OMDb (2024)
    Poster: https://m.media-amazon.com/images/...
    Genre: Drama

// Both fail:
Fetching: "Unreleased Movie"
  ⚠ Movie "Unreleased Movie" not found on TMDB
  ⚠ Movie "Unreleased Movie" not found on OMDb
  (Movie created with default genre: "Drama", no poster)
```

## Rate Limits & Performance

| Source | Free Tier Limit | Our Implementation |
|--------|----------------|-------------------|
| TMDB | 40 req / 10 sec | 250ms delay between requests |
| OMDb | 1,000 req / day | 200ms delay between requests |
| Metacritic | No official limit | 500ms delay (respectful scraping) |
| Box Office Mojo | No official limit | 500ms delay (respectful scraping) |

**For 15 movies (our seed):**
- TMDB: ~4 seconds (250ms × 15)
- OMDb fallbacks: adds ~3 more seconds if needed
- Total seed time: ~7-10 seconds with API keys

## Testing the Setup

### Test TMDB Connection
```bash
npx tsx -e "import { searchTMDBMovie } from './src/services/tmdb'; searchTMDBMovie('The Odyssey').then(r => console.log(r)).catch(console.error);"
```

### Test Hybrid Approach
```bash
npx tsx -e "import { getIMDbMovieData } from './src/services/imdb'; getIMDbMovieData('The Odyssey').then(r => console.log(r)).catch(console.error);"
```

### Test Full Seed
```bash
npx tsx prisma/seed.ts
```

Expected output with both keys:
```
✓ Successfully fetched 15/15 movies
  TMDB: 12, OMDb: 3
```

## Troubleshooting

### "TMDB_API_KEY not found"
- Add key to `.env` file
- Uncomment the line (remove `#`)
- Restart your server/script

### "TMDB search failed, trying OMDb"
- Normal behavior when movie not on TMDB
- OMDb will be tried as fallback
- Not an error if OMDb succeeds

### "Successfully fetched 0/15 movies"
- Neither API key is set
- Check `.env` file
- Verify keys are uncommented

### Rate limit errors
- TMDB: Wait 10 seconds and try again
- OMDb: You've hit 1,000 requests/day limit, wait until tomorrow
- Scraping: Sites may be temporarily blocking, add more delay

## Updating the Seed Script

The seed script (`prisma/seed.ts`) automatically uses the hybrid approach:

```typescript
// Automatically tries TMDB → OMDb → defaults
const imdbDataMap = await batchGetIMDbMovieData(movieTitles);

// Each movie gets:
// - Poster from TMDB or OMDb
// - Genres from TMDB or OMDb
// - Falls back to defaults if both fail
```

No code changes needed - just set your API keys!

## Best Practices

1. **Always set TMDB_API_KEY** - Best coverage for upcoming movies
2. **Set OMDb_API_KEY too** - Ensures Oscar data and fallback coverage
3. **Monitor rate limits** - Check console output for warnings
4. **Respect delays** - Don't reduce delay times below recommended
5. **Cache results** - Store fetched data in database to avoid re-fetching

## Summary

The hybrid approach ensures:
- ✅ Maximum data coverage
- ✅ Graceful fallbacks
- ✅ Best quality posters
- ✅ Comprehensive movie information
- ✅ Works even with partial setup

**Recommended setup**: Both TMDB + OMDb API keys for best results! 🎬
