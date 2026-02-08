import 'dotenv/config';
import { Pool } from 'pg';
import { getMetacriticScore } from '../services/metacritic';
import { getBoxOfficeData } from '../services/boxoffice';
import { getOscarNominations } from '../services/oscars';
import { getOscarOverride } from '../data/oscarOverrides';

/**
 * Script to update stats for all movies using direct pg connection
 * This bypasses the Prisma adapter issues when connecting to Neon
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

interface Movie {
  id: string;
  title: string;
  actualReleaseDate: Date | null;
  anticipatedReleaseDate: Date | null;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Movie Stats Update - All Movies               ║');
  console.log('║         (Direct Connection Mode)                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Fetch all movies
    const result = await pool.query(
      'SELECT id, title, "actualReleaseDate", "anticipatedReleaseDate" FROM movies ORDER BY title'
    );
    const movies: Movie[] = result.rows;

    console.log(`Found ${movies.length} movies to update.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const movie of movies) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Updating: ${movie.title}`);
      console.log(`${'='.repeat(60)}`);

      const errors: string[] = [];

      // Extract year
      let year: number | undefined;
      let releaseDate: Date | undefined;

      if (movie.actualReleaseDate) {
        releaseDate = new Date(movie.actualReleaseDate);
        year = releaseDate.getFullYear();
      } else if (movie.anticipatedReleaseDate) {
        releaseDate = new Date(movie.anticipatedReleaseDate);
        year = releaseDate.getFullYear();
      }

      // Initialize stats
      let metacriticScore: number | null = null;
      let domesticBoxOffice = 0;
      let internationalBoxOffice = 0;
      let oscarNominations: number | null = null;
      let oscarWins = 0;

      // Fetch Metacritic score (only for released movies)
      const currentDate = new Date();
      const isReleased = releaseDate && releaseDate <= currentDate;

      if (isReleased) {
        try {
          console.log('  Fetching Metacritic score...');
          const scoreResult = await getMetacriticScore(movie.title);

          // Convert 'N/A' to null
          if (scoreResult === 'N/A' || scoreResult === null) {
            metacriticScore = null;
            console.log('  - Metacritic: Not found');
          } else {
            metacriticScore = parseInt(scoreResult, 10);
            if (isNaN(metacriticScore)) {
              metacriticScore = null;
              console.log('  - Metacritic: Invalid score');
            } else {
              console.log(`  ✓ Metacritic: ${metacriticScore}`);
            }
          }
        } catch (error: any) {
          errors.push(`Metacritic: ${error.message}`);
          console.log(`  ✗ Metacritic error: ${error.message}`);
        }
      } else {
        console.log('  - Metacritic: Skipped (not released yet)');
      }

      // Fetch box office data (only for released movies)
      if (isReleased) {
        try {
          console.log('  Fetching box office data...');
          const boxOffice = await getBoxOfficeData(movie.title, year);
          if (boxOffice) {
            domesticBoxOffice = boxOffice.domestic;
            internationalBoxOffice = boxOffice.international;
            console.log(`  ✓ Box Office: $${(boxOffice.domestic / 1_000_000).toFixed(1)}M domestic`);
          } else {
            console.log('  - Box Office: Not found');
          }
        } catch (error: any) {
          errors.push(`Box Office: ${error.message}`);
          console.log(`  ✗ Box Office error: ${error.message}`);
        }
      } else {
        console.log('  - Box Office: Skipped (not released yet)');
      }

      // Check for Oscar override first
      const override = getOscarOverride(movie.title, year);
      if (override) {
        oscarNominations = override.nominations;
        // Note: oscarWins is not in the override data structure, defaults to 0
        console.log(`  ✓ Oscars (override): ${oscarNominations} nominations`);
        if (override.note) {
          console.log(`    Note: ${override.note}`);
        }
      } else {
        // Fetch Oscar nominations from OMDb API
        try {
          console.log('  Fetching Oscar data from OMDb...');
          oscarNominations = await getOscarNominations(movie.title, year);
          if (oscarNominations !== null && oscarNominations > 0) {
            console.log(`  ✓ Oscars: ${oscarNominations} nominations`);
          } else if (oscarNominations === 0) {
            console.log('  - Oscars: 0 nominations');
          } else {
            console.log('  - Oscars: Not found in OMDb');
          }
        } catch (error: any) {
          errors.push(`Oscars: ${error.message}`);
          console.log(`  ✗ Oscars error: ${error.message}`);
        }
      }

      // Upsert movie stats
      try {
        await pool.query(
          `INSERT INTO movie_stats (id, "movieId", "oscarNominations", "oscarWins", "domesticBoxOffice", "internationalBoxOffice", "metacriticScore", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT ("movieId")
           DO UPDATE SET
             "oscarNominations" = EXCLUDED."oscarNominations",
             "oscarWins" = EXCLUDED."oscarWins",
             "domesticBoxOffice" = EXCLUDED."domesticBoxOffice",
             "internationalBoxOffice" = EXCLUDED."internationalBoxOffice",
             "metacriticScore" = EXCLUDED."metacriticScore",
             "updatedAt" = NOW()`,
          [movie.id, oscarNominations, oscarWins, domesticBoxOffice, internationalBoxOffice, metacriticScore]
        );

        if (errors.length === 0) {
          successCount++;
          console.log(`\n✓ Successfully updated ${movie.title}`);
        } else {
          errorCount++;
          console.log(`\n⚠ Updated ${movie.title} with errors: ${errors.join(', ')}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`\n✗ Failed to save stats for ${movie.title}: ${error.message}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Update Summary:');
    console.log(`  Total movies: ${movies.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  With errors: ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\nFatal error during update:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
