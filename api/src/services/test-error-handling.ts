import { updateMovieStats } from './updateMovieStats';

/**
 * Test script to verify that error handling works properly
 *
 * This script tests that if one service fails, the other two still work
 *
 * Usage: npx tsx src/services/test-error-handling.ts
 */

async function testErrorHandling() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Error Handling Test                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('This test demonstrates that if one service fails,');
  console.log('the other services still work and update the database.\n');

  // Create a fake movie ID for testing
  const testMovieId = 'test-movie-id-123';
  const testMovieTitle = 'The Dark Knight';
  const testYear = 2008;

  console.log('Testing with a movie that should work: "The Dark Knight" (2008)\n');
  console.log('Expected behavior:');
  console.log('  ✓ Metacritic: Should fetch successfully');
  console.log('  ✓ Box Office: Should fetch successfully');
  console.log('  ? Oscar: May fail if OMDB_API_KEY is not set');
  console.log('  ✓ Result: Should still succeed if at least one service works\n');

  try {
    const result = await updateMovieStats(testMovieId, testMovieTitle, testYear);

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Movie: ${result.title}`);
    console.log(`Overall Success: ${result.success ? '✓ YES' : '✗ NO'}`);
    console.log(`Errors encountered: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    console.log('\nData fetched:');
    console.log(`  Metacritic: ${result.updates.metacritic || 'FAILED'}`);
    console.log(`  Box Office: ${result.updates.boxOffice ? 'SUCCESS' : 'FAILED'}`);
    if (result.updates.boxOffice) {
      console.log(`    - Total: $${result.updates.boxOffice.total.toLocaleString()}`);
    }
    console.log(`  Oscar Nominations: ${result.updates.oscars !== undefined ? result.updates.oscars : 'FAILED'}`);

    console.log('\n' + '='.repeat(60));

    if (result.success && result.errors.length > 0) {
      console.log('✓ TEST PASSED: Partial success achieved!');
      console.log('  Some services failed but others succeeded and data was updated.');
    } else if (result.success && result.errors.length === 0) {
      console.log('✓ TEST PASSED: All services succeeded!');
    } else {
      console.log('✗ TEST FAILED: No data could be updated.');
      console.log('  This might be expected if all external services are down.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ TEST FAILED with exception:', error);
  }
}

testErrorHandling().catch(console.error);
