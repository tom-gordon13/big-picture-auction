import axios from 'axios';
import { searchTMDBMovie, type TMDBMovieData } from './tmdb';

export interface IMDbMovieData {
  title: string;
  posterUrl: string | null;
  genre: string | null;
  year?: number;
  imdbId?: string;
  source: 'tmdb' | 'omdb';
}

/**
 * Fetches movie data from OMDb API (fallback)
 * @param title - The movie title
 * @param year - Optional year for more accurate matching
 * @returns Movie data from OMDb or null if not found
 */
async function getOMDbMovieData(
  title: string,
  year?: number
): Promise<IMDbMovieData | null> {
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    console.log('  ⚠ OMDB_API_KEY not found, skipping OMDb');
    return null;
  }

  try {
    const params: Record<string, string> = {
      apikey: apiKey,
      t: title,
      type: 'movie',
    };

    if (year) {
      params.y = year.toString();
    }

    const response = await axios.get('http://www.omdbapi.com/', {
      params,
      timeout: 10000,
    });

    const data = response.data;

    if (data.Response === 'False') {
      console.log(`  ⚠ Movie "${title}" not found on OMDb`);
      return null;
    }

    const posterUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : null;
    const genre = data.Genre && data.Genre !== 'N/A' ? data.Genre : null;
    const movieYear = data.Year ? parseInt(data.Year, 10) : undefined;
    const imdbId = data.imdbID || undefined;

    console.log(`  ✓ Found "${data.Title}" on OMDb (${data.Year})`);
    if (posterUrl) {
      console.log(`    Poster: ${posterUrl.substring(0, 60)}...`);
    }
    if (genre) {
      console.log(`    Genre: ${genre}`);
    }

    return {
      title: data.Title,
      posterUrl,
      genre,
      year: movieYear,
      imdbId,
      source: 'omdb',
    };
  } catch (error) {
    console.error(`  ✗ Error fetching OMDb data for "${title}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Convert TMDB data to IMDbMovieData format
 */
function convertTMDBToIMDbData(tmdbData: TMDBMovieData): IMDbMovieData {
  const year = tmdbData.releaseDate ? parseInt(tmdbData.releaseDate.substring(0, 4), 10) : undefined;

  return {
    title: tmdbData.title,
    posterUrl: tmdbData.posterUrl,
    genre: tmdbData.genres.join(', ') || null,
    year,
    source: 'tmdb',
  };
}

/**
 * Fetches movie poster and genre using hybrid approach:
 * 1. Try TMDB first (better coverage, higher quality)
 * 2. Fall back to OMDb if TMDB fails
 *
 * @param title - The movie title
 * @param year - Optional year for more accurate matching
 * @returns Movie data with poster URL and genre, or null if not found
 */
export async function getIMDbMovieData(
  title: string,
  year?: number
): Promise<IMDbMovieData | null> {
  // Try TMDB first
  try {
    const tmdbData = await searchTMDBMovie(title, year);
    if (tmdbData && tmdbData.posterUrl) {
      return convertTMDBToIMDbData(tmdbData);
    }
  } catch (error) {
    console.log(`  ⚠ TMDB search failed for "${title}", trying OMDb...`);
  }

  // Fall back to OMDb
  return await getOMDbMovieData(title, year);
}

/**
 * Batch fetch movie data for multiple movies with delay to avoid rate limiting
 * Uses hybrid approach: TMDB primary, OMDb fallback
 *
 * @param titles - Array of movie titles
 * @param delayMs - Delay between requests in milliseconds (default 250ms)
 * @returns Map of movie titles to their movie data
 */
export async function batchGetIMDbMovieData(
  titles: string[],
  delayMs: number = 250
): Promise<Map<string, IMDbMovieData | null>> {
  const results = new Map<string, IMDbMovieData | null>();

  console.log(`Fetching movie data for ${titles.length} movies (TMDB → OMDb fallback)...\n`);

  for (const title of titles) {
    console.log(`Fetching: "${title}"`);
    const data = await getIMDbMovieData(title);
    results.set(title, data);

    // Add delay to avoid rate limiting
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const successful = Array.from(results.values()).filter(d => d !== null).length;
  const tmdbCount = Array.from(results.values()).filter(d => d?.source === 'tmdb').length;
  const omdbCount = Array.from(results.values()).filter(d => d?.source === 'omdb').length;

  console.log(`\n✓ Successfully fetched ${successful}/${titles.length} movies`);
  console.log(`  TMDB: ${tmdbCount}, OMDb: ${omdbCount}`);

  return results;
}
