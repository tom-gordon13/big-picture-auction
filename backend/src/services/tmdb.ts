import axios from 'axios';

export interface TMDBMovieData {
  id: number;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  genres: string[];
  genreIds: number[];
  releaseDate: string | null;
  overview: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  adult: boolean;
}

/**
 * TMDB Genre mapping (common genres)
 */
const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/**
 * Build full poster URL from TMDB poster path
 */
function buildPosterUrl(posterPath: string | null, size: string = 'w500'): string | null {
  if (!posterPath) return null;
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

/**
 * Build full backdrop URL from TMDB backdrop path
 */
function buildBackdropUrl(backdropPath: string | null, size: string = 'w1280'): string | null {
  if (!backdropPath) return null;
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}

/**
 * Search for a movie on TMDB
 * @param title - Movie title to search for
 * @param year - Optional year to narrow search
 * @returns Movie data from TMDB or null if not found
 */
export async function searchTMDBMovie(
  title: string,
  year?: number
): Promise<TMDBMovieData | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    console.warn('TMDB_API_KEY not found in environment variables.');
    return null;
  }

  try {
    const params: Record<string, any> = {
      api_key: apiKey,
      query: title,
    };

    if (year) {
      params.year = year;
    }

    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params,
      timeout: 10000,
    });

    if (!response.data.results || response.data.results.length === 0) {
      console.log(`  ⚠ Movie "${title}" not found on TMDB`);
      return null;
    }

    // Get the first (best) match
    const movie = response.data.results[0];

    // Map genre IDs to genre names
    const genres = movie.genre_ids?.map((id: number) => TMDB_GENRES[id] || 'Unknown').filter(Boolean) || [];

    const movieData: TMDBMovieData = {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      posterPath: movie.poster_path,
      posterUrl: buildPosterUrl(movie.poster_path),
      backdropPath: movie.backdrop_path,
      backdropUrl: buildBackdropUrl(movie.backdrop_path),
      genres,
      genreIds: movie.genre_ids || [],
      releaseDate: movie.release_date || null,
      overview: movie.overview || null,
      voteAverage: movie.vote_average || 0,
      voteCount: movie.vote_count || 0,
      popularity: movie.popularity || 0,
      adult: movie.adult || false,
    };

    console.log(`  ✓ Found "${movieData.title}" on TMDB (${movieData.releaseDate?.substring(0, 4) || 'N/A'})`);
    if (movieData.posterUrl) {
      console.log(`    Poster: ${movieData.posterUrl}`);
    }
    if (movieData.genres.length > 0) {
      console.log(`    Genres: ${movieData.genres.join(', ')}`);
    }

    return movieData;
  } catch (error) {
    console.error(`  ✗ Error searching TMDB for "${title}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get detailed movie information from TMDB by ID
 * @param tmdbId - TMDB movie ID
 * @returns Detailed movie data
 */
export async function getTMDBMovieDetails(tmdbId: number): Promise<any | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    console.warn('TMDB_API_KEY not found in environment variables.');
    return null;
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      params: {
        api_key: apiKey,
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching TMDB movie details for ID ${tmdbId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Batch search for movies on TMDB with rate limiting
 * @param titles - Array of movie titles
 * @param delayMs - Delay between requests in milliseconds (default 250ms)
 * @returns Map of movie titles to their TMDB data
 */
export async function batchSearchTMDBMovies(
  titles: string[],
  delayMs: number = 250
): Promise<Map<string, TMDBMovieData | null>> {
  const results = new Map<string, TMDBMovieData | null>();

  console.log(`Searching TMDB for ${titles.length} movies...\n`);

  for (const title of titles) {
    const data = await searchTMDBMovie(title);
    results.set(title, data);

    // Add delay to respect rate limits (40 requests per 10 seconds)
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const successful = Array.from(results.values()).filter(d => d !== null).length;
  console.log(`\n✓ Successfully found ${successful}/${titles.length} movies on TMDB`);

  return results;
}
