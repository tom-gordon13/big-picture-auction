import { prisma } from '../lib/prisma';
import { getMetacriticScore } from './metacritic';
import { getBoxOfficeData } from './boxoffice';
import { getOscarNominations } from './oscars';
import { refreshMoviePicksView } from './materializedView';

export interface MovieStatsUpdate {
  movieId: string;
  title: string;
  success: boolean;
  errors: string[];
  updates: {
    metacritic?: number | string;
    boxOffice?: {
      domestic: number;
      international: number;
      total: number;
    };
    oscars?: number;
  };
}

/**
 * Fetches all external data and updates the movie_stats table for a single movie
 * @param movieId - The movie ID
 * @param title - The movie title
 * @param year - Optional movie year for more accurate results
 * @returns Update result with success status and any errors
 */
export async function updateMovieStats(
  movieId: string,
  title: string,
  year?: number
): Promise<MovieStatsUpdate> {
  const result: MovieStatsUpdate = {
    movieId,
    title,
    success: true,
    errors: [],
    updates: {},
  };

  console.log(`\nUpdating stats for "${title}"${year ? ` (${year})` : ''}...`);

  let successfulFetches = 0;
  let totalFetches = 3; // We have 3 services

  // Fetch Metacritic score
  try {
    const metacriticScore = await getMetacriticScore(title);
    result.updates.metacritic = metacriticScore;
    successfulFetches++;

    if (metacriticScore === 'N/A') {
      console.log(`  Metacritic: N/A`);
    } else {
      console.log(`  Metacritic: ${metacriticScore}`);
    }
  } catch (error) {
    const errorMsg = `Failed to fetch Metacritic score: ${error}`;
    console.error(`  ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  // Fetch Box Office data
  try {
    const boxOfficeData = await getBoxOfficeData(title);
    result.updates.boxOffice = boxOfficeData || undefined;
    successfulFetches++;

    if (boxOfficeData) {
      console.log(`  Box Office: $${boxOfficeData.total.toLocaleString()} total`);
    } else {
      console.log(`  Box Office: No data found`);
    }
  } catch (error) {
    const errorMsg = `Failed to fetch box office data: ${error}`;
    console.error(`  ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  // Fetch Oscar nominations
  try {
    const oscarNominations = await getOscarNominations(title, year);
    result.updates.oscars = oscarNominations ?? 0;
    successfulFetches++;

    if (oscarNominations !== null && oscarNominations > 0) {
      console.log(`  Oscar Nominations: ${oscarNominations}`);
    } else {
      console.log(`  Oscar Nominations: 0 or not found`);
    }
  } catch (error) {
    const errorMsg = `Failed to fetch Oscar nominations: ${error}`;
    console.error(`  ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  // Log summary of fetches
  console.log(`  Fetched ${successfulFetches}/${totalFetches} services successfully`);

  // Update database
  // Only update fields that were successfully fetched
  try {
    const updateData: any = {};

    // Add Metacritic score if it was fetched
    if (result.updates.metacritic !== undefined) {
      const metacriticValue =
        result.updates.metacritic === 'N/A'
          ? null
          : parseInt(result.updates.metacritic as string, 10);
      updateData.metacriticScore = metacriticValue;
    }

    // Add Box Office data if it was fetched
    if (result.updates.boxOffice !== undefined) {
      updateData.domesticBoxOffice = result.updates.boxOffice?.domestic
        ? BigInt(result.updates.boxOffice.domestic)
        : BigInt(0);
      updateData.internationalBoxOffice = result.updates.boxOffice?.international
        ? BigInt(result.updates.boxOffice.international)
        : BigInt(0);
    }

    // Add Oscar nominations if it was fetched
    if (result.updates.oscars !== undefined) {
      updateData.oscarNominations = result.updates.oscars;
    }

    // Only update database if we have at least some data to update
    if (Object.keys(updateData).length > 0) {
      // Check if movie_stats record exists
      const existingStats = await prisma.movieStats.findUnique({
        where: { movieId },
      });

      if (existingStats) {
        // Update existing record with only the fields we successfully fetched
        await prisma.movieStats.update({
          where: { movieId },
          data: updateData,
        });
      } else {
        // Create new record with all fields (use defaults for missing ones)
        await prisma.movieStats.create({
          data: {
            movieId,
            metacriticScore: updateData.metacriticScore ?? null,
            domesticBoxOffice: updateData.domesticBoxOffice ?? BigInt(0),
            internationalBoxOffice: updateData.internationalBoxOffice ?? BigInt(0),
            oscarNominations: updateData.oscarNominations ?? 0,
          },
        });
      }

      const fieldsUpdated = Object.keys(updateData).join(', ');
      console.log(`  ✓ Database updated successfully (fields: ${fieldsUpdated})`);

      // Consider it a success if we updated at least some data
      // Even if some services failed, as long as we got something
      result.success = true;
    } else {
      console.log(`  ⚠ No data to update (all services failed)`);
      result.success = false;
    }
  } catch (error) {
    const errorMsg = `Failed to update database: ${error}`;
    console.error(`  ${errorMsg}`);
    result.errors.push(errorMsg);
    result.success = false;
  }

  // Final status message
  if (result.success && result.errors.length > 0) {
    console.log(`  ℹ Partial success: Some services failed but data was updated`);
  }

  return result;
}

/**
 * Updates stats for all movies in the database
 * @returns Array of update results for each movie
 */
export async function updateAllMovieStats(): Promise<MovieStatsUpdate[]> {
  console.log('Starting update for all movies...\n');

  // Fetch all movies
  const movies = await prisma.movie.findMany({
    select: {
      id: true,
      title: true,
      actualReleaseDate: true,
      anticipatedReleaseDate: true,
    },
  });

  console.log(`Found ${movies.length} movies to update.\n`);

  const results: MovieStatsUpdate[] = [];

  for (const movie of movies) {
    // Extract year from release date if available
    let year: number | undefined;
    if (movie.actualReleaseDate) {
      year = new Date(movie.actualReleaseDate).getFullYear();
    } else if (movie.anticipatedReleaseDate) {
      year = new Date(movie.anticipatedReleaseDate).getFullYear();
    }

    const result = await updateMovieStats(movie.id, movie.title, year);
    results.push(result);

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(50));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total movies: ${movies.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed movies:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.title}`);
        r.errors.forEach(e => console.log(`    Error: ${e}`));
      });
  }

  // Refresh materialized view after updating all stats
  console.log('\n' + '='.repeat(50));
  try {
    await refreshMoviePicksView();
  } catch (error) {
    console.error('Warning: Failed to refresh materialized view:', error);
    // Don't fail the entire operation if view refresh fails
  }
  console.log('='.repeat(50));

  return results;
}

/**
 * Updates stats for a specific movie by title
 * @param title - The movie title to search for
 * @returns Update result or null if movie not found
 */
export async function updateMovieStatsByTitle(
  title: string
): Promise<MovieStatsUpdate | null> {
  const movie = await prisma.movie.findFirst({
    where: {
      title: {
        contains: title,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
      actualReleaseDate: true,
      anticipatedReleaseDate: true,
    },
  });

  if (!movie) {
    console.log(`Movie "${title}" not found in database.`);
    return null;
  }

  // Extract year from release date if available
  let year: number | undefined;
  if (movie.actualReleaseDate) {
    year = new Date(movie.actualReleaseDate).getFullYear();
  } else if (movie.anticipatedReleaseDate) {
    year = new Date(movie.anticipatedReleaseDate).getFullYear();
  }

  const result = await updateMovieStats(movie.id, movie.title, year);

  // Refresh materialized view after updating this movie's stats
  if (result.success) {
    try {
      await refreshMoviePicksView();
    } catch (error) {
      console.error('Warning: Failed to refresh materialized view:', error);
      // Don't fail the operation if view refresh fails
    }
  }

  return result;
}
