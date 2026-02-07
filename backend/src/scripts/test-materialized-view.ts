import { prisma } from '../lib/prisma';
import {
  refreshMoviePicksView,
  getMoviePicksByAuction,
  getLeaderboardFromView,
} from '../services/materializedView';

/**
 * Script to test the materialized view
 *
 * Usage: npx tsx src/scripts/test-materialized-view.ts
 */

async function testMaterializedView() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      Materialized View Test                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Check if materialized view exists
    console.log('Test 1: Checking if materialized view exists...');
    const viewExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_matviews
        WHERE matviewname = 'movie_picks_with_stats'
      ) as exists
    `;
    console.log('  View exists:', viewExists);
    console.log('');

    // Test 2: Count rows in the view
    console.log('Test 2: Counting rows in materialized view...');
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM movie_picks_with_stats
    `;
    console.log('  Total rows:', count);
    console.log('');

    // Test 3: Sample data from the view
    console.log('Test 3: Fetching sample data...');
    const sample = await prisma.$queryRaw`
      SELECT
        movie_title,
        player_full_name,
        purchase_amount,
        total_points,
        metacritic_score,
        total_box_office
      FROM movie_picks_with_stats
      LIMIT 5
    `;
    console.log('  Sample rows:');
    console.table(sample);
    console.log('');

    // Test 4: Get latest auction
    console.log('Test 4: Fetching latest auction...');
    const latestAuction = await prisma.auction.findFirst({
      orderBy: [{ year: 'desc' }, { cycle: 'desc' }],
    });

    if (latestAuction) {
      console.log(`  Latest auction: ${latestAuction.name} (${latestAuction.year}, Cycle ${latestAuction.cycle})`);
      console.log('');

      // Test 5: Get picks for latest auction
      console.log('Test 5: Fetching picks for latest auction from materialized view...');
      const picks = await getMoviePicksByAuction(latestAuction.year, latestAuction.cycle);
      console.log(`  Found ${picks.length} picks`);
      if (picks.length > 0) {
        console.log('  First pick:', {
          movie: picks[0].movie_title,
          player: picks[0].player_full_name,
          points: picks[0].total_points,
        });
      }
      console.log('');

      // Test 6: Get leaderboard from materialized view
      console.log('Test 6: Fetching leaderboard from materialized view...');
      const leaderboard = await getLeaderboardFromView(latestAuction.year, latestAuction.cycle);
      console.log(`  Found ${leaderboard.length} players`);
      if (leaderboard.length > 0) {
        console.log('  Top player:', {
          name: leaderboard[0].player_full_name,
          points: leaderboard[0].total_points,
          spent: leaderboard[0].total_spent,
          movies: leaderboard[0].total_movies,
        });
      }
      console.log('');
    } else {
      console.log('  No auctions found in database');
      console.log('');
    }

    // Test 7: Refresh the materialized view
    console.log('Test 7: Refreshing materialized view...');
    await refreshMoviePicksView();
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✓ All tests completed successfully!');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMaterializedView();
