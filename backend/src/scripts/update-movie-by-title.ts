import { updateMovieStatsByTitle } from '../services/updateMovieStats';
import { prisma } from '../lib/prisma';

/**
 * Script to update stats for a specific movie by title
 *
 * Usage: npx tsx src/scripts/update-movie-by-title.ts "Movie Title"
 *
 * Examples:
 *   npx tsx src/scripts/update-movie-by-title.ts "The Dark Knight"
 *   npx tsx src/scripts/update-movie-by-title.ts "Inception"
 *
 * IMPORTANT: Make sure you have OMDB_API_KEY set in your .env file
 * before running this script!
 */

async function main() {
  const movieTitle = process.argv[2];

  if (!movieTitle) {
    console.error('Error: Please provide a movie title as an argument.');
    console.error('Usage: npx tsx src/scripts/update-movie-by-title.ts "Movie Title"');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Movie Stats Update - Single Movie             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`Searching for: "${movieTitle}"\n`);

  try {
    const result = await updateMovieStatsByTitle(movieTitle);

    if (!result) {
      console.error(`\nMovie "${movieTitle}" not found in database.`);
      console.error('Please check the title and try again.');
      process.exit(1);
    }

    if (result.success) {
      console.log('\n✓ Update completed successfully!');
    } else {
      console.log('\n✗ Update completed with errors.');
      console.log('Errors:', result.errors);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\nFatal error during update:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
