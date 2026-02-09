import 'dotenv/config';

/**
 * Manually trigger the production cron job
 * Usage: npx tsx src/scripts/trigger-prod-cron.ts
 */

async function triggerProductionCron() {
  const PROD_URL = 'https://big-picture-auction.vercel.app/api/cron/update-movies';
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET) {
    console.error('❌ Error: CRON_SECRET not found in .env file');
    console.error('Please add CRON_SECRET to your .env file');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║    Triggering Production Cron Job                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`URL: ${PROD_URL}`);
  console.log(`Using CRON_SECRET: ${CRON_SECRET.substring(0, 10)}...`);
  console.log('\nSending request...\n');

  try {
    const response = await fetch(PROD_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:');
      console.error(errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Cron job triggered successfully!\n');
    console.log('Results:');
    console.log(`  Total movies: ${result.results.total}`);
    console.log(`  ✅ Successful: ${result.results.successful}`);
    console.log(`  ⚠️  With errors: ${result.results.withErrors}`);
    console.log(`  ⏭️  Skipped: ${result.results.skipped}`);
    console.log(`  📊 Changes: ${result.results.movies.filter((m: any) => Object.keys(m.changes || {}).length > 0).length}`);
    console.log(`\n  Timestamp: ${result.timestamp}`);

    // Show movies with changes
    const moviesWithChanges = result.results.movies.filter((m: any) => Object.keys(m.changes || {}).length > 0);
    if (moviesWithChanges.length > 0) {
      console.log('\n📊 Movies with changes:');
      moviesWithChanges.forEach((movie: any) => {
        console.log(`\n  ${movie.title}:`);
        Object.entries(movie.changes).forEach(([field, change]: [string, any]) => {
          console.log(`    ${field}: ${change.old} → ${change.new}`);
        });
      });
    }

    console.log('\n✅ Check your email for the full report!\n');
  } catch (error: any) {
    console.error('❌ Error triggering cron job:');
    console.error(error.message);
    process.exit(1);
  }
}

triggerProductionCron();
