import { prisma } from '../lib/prisma';

/**
 * Refreshes the movie_picks_with_stats materialized view
 *
 * This should be called after updating movie stats to ensure
 * the materialized view reflects the latest data.
 *
 * @returns void
 */
export async function refreshMoviePicksView(): Promise<void> {
  console.log('Refreshing movie_picks_with_stats materialized view...');

  try {
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY movie_picks_with_stats`;
    console.log('✓ Materialized view refreshed successfully');
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    throw error;
  }
}

/**
 * Query the materialized view for a specific auction
 *
 * @param auctionYear - The auction year
 * @param auctionCycle - The auction cycle
 * @returns Array of movie picks with stats
 */
export async function getMoviePicksByAuction(
  auctionYear: number,
  auctionCycle: number
): Promise<any[]> {
  const result = await prisma.$queryRaw`
    SELECT * FROM movie_picks_with_stats
    WHERE auction_year = ${auctionYear}
      AND auction_cycle = ${auctionCycle}
    ORDER BY player_full_name, movie_title
  `;

  return result as any[];
}

/**
 * Query the materialized view for a specific player in an auction
 *
 * @param playerId - The player ID
 * @param auctionId - The auction ID
 * @returns Array of movie picks with stats for that player
 */
export async function getPlayerMoviePicks(
  playerId: string,
  auctionId: string
): Promise<any[]> {
  const result = await prisma.$queryRaw`
    SELECT * FROM movie_picks_with_stats
    WHERE player_id = ${playerId}
      AND auction_id = ${auctionId}
    ORDER BY pick_date
  `;

  return result as any[];
}

/**
 * Get leaderboard data from the materialized view for an auction
 *
 * @param auctionYear - The auction year
 * @param auctionCycle - The auction cycle
 * @returns Leaderboard with aggregated stats per player
 */
export async function getLeaderboardFromView(
  auctionYear: number,
  auctionCycle: number
): Promise<any[]> {
  const result = await prisma.$queryRaw`
    SELECT
      player_id,
      player_full_name,
      player_first_name,
      player_last_name,
      auction_id,
      COUNT(*) as total_movies,
      SUM(purchase_amount) as total_spent,
      SUM(total_points) as total_points,
      SUM(box_office_achieved) as box_office_achievements,
      SUM(oscar_achieved) as oscar_achievements,
      SUM(metacritic_achieved) as metacritic_achievements,
      SUM(total_box_office) as combined_box_office,
      ARRAY_AGG(
        jsonb_build_object(
          'movie_id', movie_id,
          'title', movie_title,
          'purchase_amount', purchase_amount,
          'points', total_points,
          'domestic_box_office', domestic_box_office,
          'international_box_office', international_box_office,
          'total_box_office', total_box_office,
          'oscar_nominations', oscar_nominations,
          'metacritic_score', metacritic_score,
          'box_office_achieved', box_office_achieved,
          'oscar_achieved', oscar_achieved,
          'metacritic_achieved', metacritic_achieved
        )
        ORDER BY pick_date
      ) as movies
    FROM movie_picks_with_stats
    WHERE auction_year = ${auctionYear}
      AND auction_cycle = ${auctionCycle}
    GROUP BY player_id, player_full_name, player_first_name, player_last_name, auction_id
    ORDER BY total_points DESC, total_spent ASC
  `;

  return result as any[];
}

/**
 * Get a specific movie with all picks across all auctions
 *
 * @param movieId - The movie ID
 * @returns Array of picks for that movie with player and stats info
 */
export async function getMovieWithAllPicks(movieId: string): Promise<any[]> {
  const result = await prisma.$queryRaw`
    SELECT * FROM movie_picks_with_stats
    WHERE movie_id = ${movieId}
    ORDER BY auction_year DESC, auction_cycle DESC, pick_date
  `;

  return result as any[];
}
