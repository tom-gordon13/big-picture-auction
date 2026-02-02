# Movie Stats Update Service

This service fetches data from external sources (Metacritic, Box Office Mojo, OMDb) and updates the `movie_stats` table in the database.

## Prerequisites

**IMPORTANT**: Before using this service, you must set up the OMDb API key:

1. Get a free API key from: http://www.omdbapi.com/apikey.aspx
2. Add it to your `.env` file: `OMDB_API_KEY=your_api_key_here`
3. See `OMDB_SETUP.md` for detailed instructions

## What Gets Updated

For each movie, the service fetches and updates:

- **Metacritic Score**: Movie review score (0-100 or null)
- **Box Office Data**:
  - Domestic box office revenue
  - International box office revenue
- **Oscar Nominations**: Total number of Oscar nominations

## Usage Methods

### 1. Command Line Scripts

#### Update All Movies
Updates stats for all movies in the database:

```bash
npx tsx src/scripts/update-all-movies.ts
```

**Note**: This will take time as it fetches data for each movie with a small delay between requests to avoid rate limiting (500ms between movies).

#### Update Single Movie by Title
Updates stats for a specific movie by searching for its title:

```bash
npx tsx src/scripts/update-movie-by-title.ts "Movie Title"
```

**Examples**:
```bash
npx tsx src/scripts/update-movie-by-title.ts "The Dark Knight"
npx tsx src/scripts/update-movie-by-title.ts "Inception"
```

### 2. API Endpoints

Make sure your server is running first (`npm run dev` or `npm start`).

#### Update All Movies
```bash
curl -X POST http://localhost:5000/api/movies/update-all-stats
```

**Response**:
```json
{
  "message": "Update completed",
  "total": 10,
  "successful": 9,
  "failed": 1,
  "results": [...]
}
```

#### Update Single Movie by Title
```bash
curl -X POST http://localhost:5000/api/movies/update-stats/The%20Dark%20Knight
```

**Response**:
```json
{
  "message": "Update successful",
  "result": {
    "movieId": "uuid-here",
    "title": "The Dark Knight",
    "success": true,
    "errors": [],
    "updates": {
      "metacritic": "82",
      "boxOffice": {
        "domestic": 534987076,
        "international": 473295640,
        "total": 1008477382
      },
      "oscars": 8
    }
  }
}
```

#### Update Single Movie by ID
```bash
curl -X POST http://localhost:5000/api/movies/{movieId}/update-stats
```

Replace `{movieId}` with the actual movie UUID from your database.

### 3. Programmatic Usage

You can also import and use the service functions directly in your code:

```typescript
import { updateMovieStats, updateAllMovieStats, updateMovieStatsByTitle } from './services/updateMovieStats';

// Update a specific movie
const result = await updateMovieStats(movieId, movieTitle, movieYear);

// Update all movies
const results = await updateAllMovieStats();

// Update by title search
const result = await updateMovieStatsByTitle("The Dark Knight");
```

## Data Sources

### Metacritic (metacritic.com)
- **What it provides**: Movie review score (0-100)
- **Returns "N/A" when**:
  - Movie not found
  - Less than 4 reviews available
- **Stored as**: `metacriticScore` (Int, nullable)

### Box Office Mojo (boxofficemojo.com)
- **What it provides**: Box office revenue data
- **Returns null when**: Movie not found or no box office data available
- **Stored as**:
  - `domesticBoxOffice` (BigInt)
  - `internationalBoxOffice` (BigInt)
- **Note**: Values stored in dollars (not millions)

### OMDb API (omdbapi.com)
- **What it provides**: Oscar nomination count
- **Returns 0 when**: Movie not found or no Oscar nominations
- **Stored as**: `oscarNominations` (Int)
- **Requires**: API key (see Prerequisites above)

## Database Schema

The service updates the `movie_stats` table:

```prisma
model MovieStats {
  id                      String   @id @default(uuid())
  movieId                 String   @unique
  oscarNominations        Int      @default(0)
  oscarWins               Int      @default(0)
  domesticBoxOffice       BigInt   @default(0)
  internationalBoxOffice  BigInt   @default(0)
  metacriticScore         Int?
  updatedAt               DateTime @updatedAt
}
```

**Note**: The service currently only updates `oscarNominations`, not `oscarWins`. The `oscarWins` field remains at its default value.

## Error Handling

The service is designed to be **fault-tolerant** with robust error handling:

### Independent Service Calls
Each external service (Metacritic, Box Office Mojo, OMDb) is wrapped in its own try-catch block:
- If one service fails, the other two will still execute
- Only successfully fetched data is written to the database
- The database update only includes fields that were successfully retrieved

### Partial Success
The update is considered successful if **at least one** service returns data:
- Example: If Metacritic and Box Office work but OMDb fails (e.g., no API key), the first two are still saved
- The result includes an `errors` array listing what failed
- The `success` flag is `true` if any data was updated, even with some failures

### Batch Updates
When updating all movies:
- Individual movie failures won't stop the batch
- Each movie is processed independently
- A summary shows total successful vs failed movies

### Testing Error Handling
You can test the error handling with:
```bash
npx tsx src/services/test-error-handling.ts
```

This demonstrates that services work independently and partial updates succeed.

## Rate Limiting

To avoid being rate-limited by external services:

- There's a 500ms delay between each movie when updating all movies
- OMDb free tier allows 1,000 requests per day
- Metacritic and Box Office Mojo use web scraping (be respectful!)

## Tips

1. **Start with a single movie** to test that everything is working:
   ```bash
   npx tsx src/scripts/update-movie-by-title.ts "The Dark Knight"
   ```

2. **Check the logs** - the service provides detailed console output about what it's doing

3. **For new movies** - if a movie hasn't been released yet or doesn't have data available, the service will store default values (0 for box office, null for Metacritic, 0 for Oscars)

4. **Year parameter** - the service automatically extracts the year from the movie's `actualReleaseDate` or `anticipatedReleaseDate` field, which helps with matching movies accurately (especially for OMDb API)

## Troubleshooting

### "OMDB_API_KEY not found"
- Make sure you've added `OMDB_API_KEY=your_key` to your `.env` file
- Restart your terminal or server after adding the key

### "Movie not found"
- Check that the movie exists in your database
- Try a partial title match (the search is case-insensitive and uses `contains`)

### "Failed to fetch [service]"
- Check your internet connection
- Services may occasionally be down or slow
- Check the console for specific error messages
