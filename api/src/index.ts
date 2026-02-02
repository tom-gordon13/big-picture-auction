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
    const data = await getBoxOfficeData(title as string);

    if (!data) {
      return res.json({
        title,
        domestic: 0,
        international: 0,
        total: 0,
      });
    }

    res.json({
      title,
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

    // Extract year from release date if available
    let year: number | undefined;
    if (movie.actualReleaseDate) {
      year = new Date(movie.actualReleaseDate).getFullYear();
    } else if (movie.anticipatedReleaseDate) {
      year = new Date(movie.anticipatedReleaseDate).getFullYear();
    }

    const result = await updateMovieStats(movie.id, movie.title, year);

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

app.get('/api/auctions/latest/leaderboard', async (req: Request, res: Response) => {
  try {
    const latestAuction = await prisma.auction.findFirst({
      orderBy: [{ year: 'desc' }, { cycle: 'desc' }],
    });

    if (!latestAuction) {
      return res.json([]);
    }

    const playerAuctions = await prisma.playerAuction.findMany({
      where: { auctionId: latestAuction.id },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    const leaderboard = await Promise.all(
      playerAuctions.map(async (pa, index: number) => {
        const player = await prisma.player.findUnique({
          where: { id: pa.playerId },
        });

        const picks = await prisma.pick.findMany({
          where: {
            playerId: pa.playerId,
            auctionId: pa.auctionId,
          },
        });

        const movies = await Promise.all(
          picks.map(async (pick) => {
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

            const oscarStatus =
              stats?.oscarNominations && stats.oscarNominations > 0
                ? 'achieved'
                : stats?.oscarNominations === 0
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
                  stats?.oscarNominations && stats.oscarNominations > 0
                    ? 'Nom'
                    : stats?.oscarNominations === 0
                    ? 'None'
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

        return {
          rank: index + 1,
          name: player ? `${player.firstName} ${player.lastName}` : 'Unknown',
          spent: pa.totalSpent,
          left: pa.remainingBudget,
          points: pa.totalPoints,
          movies: validMovies,
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
