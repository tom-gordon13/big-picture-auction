import { searchTMDBMovie, getTMDBExternalIds } from './tmdb';

export interface MovieUrls {
  imdbUrl: string | null;
  letterboxdUrl: string | null;
}

/**
 * Converts a movie title to a Letterboxd-friendly slug
 * @param title - Movie title
 * @returns Letterboxd slug (lowercase, hyphens, no special chars)
 */
function createLetterboxdSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Fetches IMDB and Letterboxd URLs for a movie
 * @param title - Movie title
 * @param year - Optional release year for better matching
 * @returns Object with IMDB and Letterboxd URLs
 */
export async function getMovieUrls(
  title: string,
  year?: number
): Promise<MovieUrls> {
  let imdbUrl: string | null = null;
  let letterboxdUrl: string | null = null;

  try {
    // Search for the movie on TMDB
    const tmdbData = await searchTMDBMovie(title, year);

    if (tmdbData) {
      // Get IMDB ID from TMDB external IDs
      const externalIds = await getTMDBExternalIds(tmdbData.id);
      if (externalIds?.imdb_id) {
        imdbUrl = `https://www.imdb.com/title/${externalIds.imdb_id}/`;
        console.log(`  ✓ IMDB URL: ${imdbUrl}`);
      }

      // Create Letterboxd URL from title and year
      const slug = createLetterboxdSlug(title);
      const releaseYear = year || (tmdbData.releaseDate ? parseInt(tmdbData.releaseDate.substring(0, 4), 10) : null);

      if (releaseYear) {
        letterboxdUrl = `https://letterboxd.com/film/${slug}-${releaseYear}/`;
        console.log(`  ✓ Letterboxd URL: ${letterboxdUrl}`);
      } else {
        letterboxdUrl = `https://letterboxd.com/film/${slug}/`;
        console.log(`  ✓ Letterboxd URL (no year): ${letterboxdUrl}`);
      }
    } else {
      console.log(`  ⚠ Could not find movie "${title}" on TMDB, unable to generate URLs`);
    }
  } catch (error) {
    console.error(`  ✗ Error fetching movie URLs for "${title}":`, error instanceof Error ? error.message : error);
  }

  return { imdbUrl, letterboxdUrl };
}

/**
 * Batch fetch movie URLs for multiple movies with delay to avoid rate limiting
 * @param movies - Array of objects with title and optional year
 * @param delayMs - Delay between requests in milliseconds (default 300ms)
 * @returns Map of movie titles to their URLs
 */
export async function batchGetMovieUrls(
  movies: Array<{ title: string; year?: number }>,
  delayMs: number = 300
): Promise<Map<string, MovieUrls>> {
  const results = new Map<string, MovieUrls>();

  console.log(`Fetching URLs for ${movies.length} movies...\n`);

  for (const movie of movies) {
    console.log(`Fetching URLs for: "${movie.title}"${movie.year ? ` (${movie.year})` : ''}`);
    const urls = await getMovieUrls(movie.title, movie.year);
    results.set(movie.title, urls);

    // Add delay to avoid rate limiting
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const withImdb = Array.from(results.values()).filter(u => u.imdbUrl !== null).length;
  const withLetterboxd = Array.from(results.values()).filter(u => u.letterboxdUrl !== null).length;

  console.log(`\n✓ Successfully fetched URLs:`);
  console.log(`  IMDB: ${withImdb}/${movies.length}`);
  console.log(`  Letterboxd: ${withLetterboxd}/${movies.length}`);

  return results;
}
