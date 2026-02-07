import dotenv from 'dotenv';
import { getMetacriticScore } from '../services/metacritic';
import { getBoxOfficeData } from '../services/boxoffice';
import { getOscarNominations } from '../services/oscars';
import { updateMovieStatsByTitle } from '../services/updateMovieStats';

dotenv.config();

/**
 * Test script to verify movie stats services are working properly
 * Tests each service individually with known movies that have data
 */
async function testMovieStatsServices() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Testing Movie Stats Services                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Test movies with known data
  const testMovies = [
    { title: 'Dune: Part Two', year: 2024 }, // Recent movie with all stats
    { title: 'Oppenheimer', year: 2023 },   // Oscar winner
    { title: 'The Batman', year: 2022 },     // Box office hit
  ];

  for (const movie of testMovies) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: "${movie.title}" (${movie.year})`);
    console.log('='.repeat(60));

    // Test Metacritic
    console.log('\n1️⃣  Testing Metacritic Service...');
    try {
      const metacriticScore = await getMetacriticScore(movie.title);
      console.log(`   ✓ Metacritic Score: ${metacriticScore}`);
    } catch (error) {
      console.error(`   ✗ Metacritic Error:`, error instanceof Error ? error.message : error);
    }

    // Test Box Office
    console.log('\n2️⃣  Testing Box Office Service...');
    try {
      const boxOffice = await getBoxOfficeData(movie.title);
      if (boxOffice) {
        console.log(`   ✓ Domestic: $${boxOffice.domestic.toLocaleString()}`);
        console.log(`   ✓ International: $${boxOffice.international.toLocaleString()}`);
        console.log(`   ✓ Worldwide: $${boxOffice.total.toLocaleString()}`);
      } else {
        console.log('   ⚠ No box office data found');
      }
    } catch (error) {
      console.error(`   ✗ Box Office Error:`, error instanceof Error ? error.message : error);
    }

    // Test Oscar Nominations
    console.log('\n3️⃣  Testing Oscar Nominations Service...');
    try {
      const nominations = await getOscarNominations(movie.title, movie.year);
      console.log(`   ✓ Oscar Nominations: ${nominations}`);
    } catch (error) {
      console.error(`   ✗ Oscar Error:`, error instanceof Error ? error.message : error);
    }

    // Add delay between movies to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║         Testing Combined Update Service               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Test the combined update service (if you have a test movie in the DB)
  console.log('Testing updateMovieStatsByTitle() with "Oppenheimer"...\n');
  try {
    const result = await updateMovieStatsByTitle('Oppenheimer');
    if (result) {
      console.log('✓ Combined Update Result:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Updates:`, result.updates);
      if (result.errors.length > 0) {
        console.log(`  Errors:`, result.errors);
      }
    } else {
      console.log('⚠ Movie not found in database (this is expected if not seeded)');
    }
  } catch (error) {
    console.error('✗ Combined Update Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n✓ All tests completed!\n');
}

// Run the tests
testMovieStatsServices()
  .then(() => {
    console.log('Test script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
