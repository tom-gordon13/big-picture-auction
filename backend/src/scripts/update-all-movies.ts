import { updateAllMovieStats } from '../services/updateMovieStats';
import { prisma } from '../lib/prisma';

/**
 * Script to update stats for all movies in the database
 *
 * Usage: npx tsx src/scripts/update-all-movies.ts
 *
 * IMPORTANT: Make sure you have OMDB_API_KEY set in your .env file
 * before running this script!
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Movie Stats Update - All Movies               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    const results = await updateAllMovieStats();

    console.log('\nUpdate complete!');
    process.exit(0);
  } catch (error) {
    console.error('\nFatal error during update:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
