import 'dotenv/config';

/**
 * Test the cron job by triggering it via the deployed API
 * This avoids local connection issues with Neon
 */

const API_URL = process.env.VERCEL_URL || 'https://big-picture-auction.vercel.app';
const CRON_SECRET = process.env.CRON_SECRET;

async function triggerCron() {
  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not found in .env file');
    console.error('Add CRON_SECRET to backend/.env');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Test Cron Job via Production API                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`API URL: ${API_URL}`);
  console.log('Triggering cron job...\n');

  try {
    const response = await fetch(`${API_URL}/api/cron/update-movies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cron job failed:');
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log('✅ Cron job completed successfully!\n');
    console.log('='.repeat(60));
    console.log('RESULTS:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    if (data.results) {
      console.log('\nSUMMARY:');
      console.log(`  Total movies:     ${data.results.total}`);
      console.log(`  ✅ Successful:    ${data.results.successful}`);
      console.log(`  ⚠️  With errors:   ${data.results.withErrors}`);
      console.log(`  ⏭️  Skipped:       ${data.results.skipped}`);
    }

    console.log('\n📧 Check your email for the detailed report!\n');
  } catch (error: any) {
    console.error('❌ Error triggering cron:', error.message);
    process.exit(1);
  }
}

triggerCron();
