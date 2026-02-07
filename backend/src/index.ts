import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { getMetacriticScore, getMetacriticScoreDetails } from './services/metacritic';
import { getBoxOfficeData } from './services/boxoffice';
import { getOscarNominations, getAwardsInfo } from './services/oscars';
import { updateMovieStats, updateAllMovieStats, updateMovieStatsByTitle } from './services/updateMovieStats';
import {
  refreshMoviePicksView,
  getMoviePicksByAuction,
  getPlayerMoviePicks,
  getLeaderboardFromView,
  getMovieWithAllPicks,
} from './services/materializedView';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'API is running', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'API is running', database: 'disconnected' });
  }
});

app.get('/api/players', async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Test endpoint for Metacritic service
app.get('/api/metacritic/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const score = await getMetacriticScore(title as string);
    const details = await getMetacriticScoreDetails(title as string);

    res.json({
      title,
      score,
      details,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Metacritic score' });
  }
});

// Test endpoint for Box Office service
app.get('/api/boxoffice/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const { year } = req.query;
    const data = await getBoxOfficeData(
      title as string,
      year ? parseInt(year as string, 10) : undefined
    );

    if (!data) {
      return res.json({
        title,
        year: year || null,
        domestic: 0,
        international: 0,
        total: 0,
      });
    }

    res.json({
      title,
      year: year || null,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch box office data' });
  }
});

// Test endpoint for Oscar nominations service
app.get('/api/oscars/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const { year } = req.query;

    const nominations = await getOscarNominations(
      title as string,
      year ? parseInt(year as string, 10) : undefined
    );
    const awards = await getAwardsInfo(
      title as string,
      year ? parseInt(year as string, 10) : undefined
    );

    if (nominations === null) {
      return res.json({
        title,
        nominations: 0,
        awards: null,
      });
    }

    res.json({
      title,
      nominations,
      awards,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Oscar nominations' });
  }
});

// Endpoint to update stats for all movies
app.post('/api/movies/update-all-stats', async (req: Request, res: Response) => {
  try {
    console.log('Received request to update all movie stats...');
    const results = await updateAllMovieStats();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: 'Update completed',
      total: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error updating movie stats:', error);
    res.status(500).json({ error: 'Failed to update movie stats' });
  }
});

// Endpoint to update stats for a specific movie by title
app.post('/api/movies/update-stats/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    console.log(`Received request to update stats for "${title}"...`);

    const result = await updateMovieStatsByTitle(title as string);

    if (!result) {
      return res.status(404).json({ error: `Movie "${title}" not found` });
    }

    res.json({
      message: result.success ? 'Update successful' : 'Update completed with errors',
      result,
    });
  } catch (error) {
    console.error('Error updating movie stats:', error);
    res.status(500).json({ error: 'Failed to update movie stats' });
  }
});

// Endpoint to update stats for a specific movie by ID
app.post('/api/movies/:movieId/update-stats', async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;
    console.log(`Received request to update stats for movie ID ${movieId}...`);

    // Fetch movie from database
    const movie = await prisma.movie.findUnique({
      where: { id: movieId as string },
      select: {
        id: true,
        title: true,
        actualReleaseDate: true,
        anticipatedReleaseDate: true,
      },
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Extract year and full release date if available
    let year: number | undefined;
    let releaseDate: Date | undefined;

    if (movie.actualReleaseDate) {
      releaseDate = new Date(movie.actualReleaseDate);
      year = releaseDate.getFullYear();
    } else if (movie.anticipatedReleaseDate) {
      releaseDate = new Date(movie.anticipatedReleaseDate);
      year = releaseDate.getFullYear();
    }

    const result = await updateMovieStats(movie.id, movie.title, year, releaseDate);

    res.json({
      message: result.success ? 'Update successful' : 'Update completed with errors',
      result,
    });
  } catch (error) {
    console.error('Error updating movie stats:', error);
    res.status(500).json({ error: 'Failed to update movie stats' });
  }
});

// Endpoint to manually refresh the materialized view
app.post('/api/materialized-view/refresh', async (req: Request, res: Response) => {
  try {
    await refreshMoviePicksView();
    res.json({ message: 'Materialized view refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    res.status(500).json({ error: 'Failed to refresh materialized view' });
  }
});

// Endpoint to get movie picks from materialized view by auction
app.get('/api/materialized-view/auction/:year/:cycle', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year as string, 10);
    const cycle = parseInt(req.params.cycle as string, 10);

    const picks = await getMoviePicksByAuction(year, cycle);
    res.json(picks);
  } catch (error) {
    console.error('Error fetching movie picks:', error);
    res.status(500).json({ error: 'Failed to fetch movie picks' });
  }
});

// Endpoint to get leaderboard from materialized view
app.get('/api/materialized-view/leaderboard/:year/:cycle', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year as string, 10);
    const cycle = parseInt(req.params.cycle as string, 10);

    const leaderboard = await getLeaderboardFromView(year, cycle);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Endpoint to get a player's picks from materialized view
app.get('/api/materialized-view/player/:playerId/auction/:auctionId', async (req: Request, res: Response) => {
  try {
    const { playerId, auctionId } = req.params;

    const picks = await getPlayerMoviePicks(playerId as string, auctionId as string);
    res.json(picks);
  } catch (error) {
    console.error('Error fetching player picks:', error);
    res.status(500).json({ error: 'Failed to fetch player picks' });
  }
});

// Endpoint to get a movie with all its picks
app.get('/api/materialized-view/movie/:movieId/picks', async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;

    const picks = await getMovieWithAllPicks(movieId as string);
    res.json(picks);
  } catch (error) {
    console.error('Error fetching movie picks:', error);
    res.status(500).json({ error: 'Failed to fetch movie picks' });
  }
});

app.get('/api/auctions/years', async (req: Request, res: Response) => {
  try {
    const auctions = await prisma.auction.findMany({
      select: { year: true, cycle: true, name: true },
      orderBy: [{ year: 'desc' }, { cycle: 'desc' }],
      distinct: ['year'],
    });

    res.json(auctions);
  } catch (error) {
    console.error('Error fetching auction years:', error);
    res.status(500).json({ error: 'Failed to fetch auction years' });
  }
});

app.get('/api/auctions/latest/leaderboard', async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    let targetYear: number;
    if (year) {
      targetYear = parseInt(year as string, 10);
    } else {
      // Get latest year
      const latestAuction = await prisma.auction.findFirst({
        orderBy: [{ year: 'desc' }],
      });
      if (!latestAuction) {
        return res.json([]);
      }
      targetYear = latestAuction.year;
    }

    // Get all auctions for the target year
    const auctions = await prisma.auction.findMany({
      where: { year: targetYear },
      orderBy: [{ cycle: 'asc' }],
    });

    if (auctions.length === 0) {
      return res.json([]);
    }

    const auctionIds = auctions.map(a => a.id);

    // Get all player auctions for this year (we'll combine their stats)
    const allPlayerAuctions = await prisma.playerAuction.findMany({
      where: { auctionId: { in: auctionIds } },
    });

    // Group by player
    const playerAuctionsByPlayer = new Map<string, typeof allPlayerAuctions>();
    allPlayerAuctions.forEach(pa => {
      const existing = playerAuctionsByPlayer.get(pa.playerId) || [];
      playerAuctionsByPlayer.set(pa.playerId, [...existing, pa]);
    });

    const leaderboard = await Promise.all(
      Array.from(playerAuctionsByPlayer.entries()).map(async ([playerId, playerAuctions], index: number) => {
        const player = await prisma.player.findUnique({
          where: { id: playerId },
        });

        // Get all picks across all cycles for this player
        const allPicks = await prisma.pick.findMany({
          where: {
            playerId: playerId,
            auctionId: { in: auctionIds },
          },
          include: {
            auction: true,
          },
        });

        const movies = await Promise.all(
          allPicks.map(async (pick) => {
            const movie = await prisma.movie.findUnique({
              where: { id: pick.movieId },
            });

            const stats = await prisma.movieStats.findUnique({
              where: { movieId: pick.movieId },
            });

            if (!movie) return null;

            const boxOfficeValue = stats?.domesticBoxOffice || BigInt(0);
            const boxOfficeMillions = Number(boxOfficeValue) / 1_000_000;

            const boxOfficeStatus =
              boxOfficeValue > 0
                ? boxOfficeMillions >= 100
                  ? 'achieved'
                  : 'failed'
                : 'pending';

            // Determine if Oscars have been announced for this movie's eligibility year
            // Movies are typically eligible for Oscars in the year after release
            const movieYear = movie.actualReleaseDate
              ? new Date(movie.actualReleaseDate).getFullYear()
              : movie.anticipatedReleaseDate
              ? new Date(movie.anticipatedReleaseDate).getFullYear()
              : null;

            // Oscars for 2026 movies would be in 2027
            const oscarYear = movieYear ? movieYear + 1 : null;
            const currentYear = new Date().getFullYear();
            const oscarsHaveHappened = oscarYear && oscarYear <= currentYear;

            const oscarStatus =
              stats?.oscarNominations && stats.oscarNominations >= 2
                ? 'achieved'
                : oscarsHaveHappened && stats && stats.oscarNominations !== null && stats.oscarNominations < 2
                ? 'failed'
                : 'pending';

            const metacriticStatus = stats?.metacriticScore
              ? stats.metacriticScore >= 85
                ? 'achieved'
                : 'failed'
              : 'pending';

            let points = 0;
            if (boxOfficeStatus === 'achieved') points += 1;
            if (oscarStatus === 'achieved') points += 1;
            if (metacriticStatus === 'achieved') points += 1;

            return {
              title: movie.title,
              price: pick.purchaseAmount,
              posterUrl: movie.posterUrl || null,
              posterTheme: (movie.genre?.toLowerCase() || 'drama') as any,
              cycle: pick.auction.cycle,
              boxOffice: {
                status: boxOfficeStatus,
                value:
                  boxOfficeValue > 0
                    ? `$${Math.round(boxOfficeMillions)}M`
                    : 'TBD',
              },
              oscar: {
                status: oscarStatus,
                value:
                  stats?.oscarNominations !== null && stats?.oscarNominations !== undefined
                    ? stats.oscarNominations.toString()
                    : 'TBD',
              },
              metacritic: {
                status: metacriticStatus,
                value: stats?.metacriticScore
                  ? stats.metacriticScore.toString()
                  : 'TBD',
              },
              points: points > 0 ? points : null,
            };
          })
        );

        const validMovies = movies.filter((m) => m !== null);

        // Calculate total points from actual movie points
        const calculatedPoints = validMovies.reduce((total, movie) => {
          return total + (movie.points || 0);
        }, 0);

        // Calculate total spent and remaining budget across all cycles
        const totalSpent = playerAuctions.reduce((sum, pa) => sum + pa.totalSpent, 0);
        const remainingBudget = playerAuctions.reduce((sum, pa) => sum + pa.remainingBudget, 0);

        return {
          rank: index + 1,
          name: player ? `${player.firstName} ${player.lastName}` : 'Unknown',
          spent: totalSpent,
          left: remainingBudget,
          points: calculatedPoints,
          movies: validMovies,
        };
      })
    );

    // Re-sort by points and update ranks
    leaderboard.sort((a, b) => b.points - a.points);
    leaderboard.forEach((player, idx) => {
      player.rank = idx + 1;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Export for Vercel serverless
export default app;

// Only listen if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
